import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.55.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = 'https://nctrccziiaqycnaaueob.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5jdHJjY3ppaWFxeWNuYWF1ZW9iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUyODU5NTUsImV4cCI6MjA3MDg2MTk1NX0.xCnmbPw8xGrltVWwjvk_UDebgmOqorKWEJaJ-t3NgzU';

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authToken = req.headers.get('authorization')?.replace('Bearer ', '');
    if (!authToken) {
      throw new Error('Authentication required');
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { autoRefreshToken: false }
    });

    // Set the auth token
    const { data: { user }, error: authError } = await supabase.auth.getUser(authToken);
    if (authError || !user) {
      throw new Error('Invalid authentication token');
    }

    const { blockchainTxId, encryptedFileContent, privateKeyPem } = await req.json();

    if (!blockchainTxId || !encryptedFileContent || !privateKeyPem) {
      throw new Error('Missing required fields: blockchainTxId, encryptedFileContent, privateKeyPem');
    }

    console.log(`Starting decryption for transaction: ${blockchainTxId}`);

    // Retrieve blockchain transaction
    const { data: blockchainTx, error: blockchainError } = await supabase
      .from('blockchain_transactions')
      .select('*')
      .eq('tx_id', blockchainTxId)
      .single();

    if (blockchainError || !blockchainTx) {
      throw new Error('Blockchain transaction not found');
    }

    if (blockchainTx.status !== 'confirmed') {
      throw new Error('Transaction not confirmed on blockchain');
    }

    console.log(`Found blockchain transaction with file hash: ${blockchainTx.file_hash}`);

    // Import RSA private key
    const pemHeader = '-----BEGIN PRIVATE KEY-----';
    const pemFooter = '-----END PRIVATE KEY-----';
    const pemContents = privateKeyPem
      .replace(pemHeader, '')
      .replace(pemFooter, '')
      .replace(/\s/g, '');
    
    const binaryDerString = atob(pemContents);
    const binaryDer = new Uint8Array(binaryDerString.length);
    for (let i = 0; i < binaryDerString.length; i++) {
      binaryDer[i] = binaryDerString.charCodeAt(i);
    }

    const privateKey = await crypto.subtle.importKey(
      'pkcs8',
      binaryDer,
      { name: 'RSA-OAEP', hash: 'SHA-256' },
      false,
      ['decrypt']
    );

    // Decrypt AES key
    const encryptedAesKeyBuffer = Uint8Array.from(atob(blockchainTx.encrypted_aes_key), c => c.charCodeAt(0));
    const aesKeyBuffer = await crypto.subtle.decrypt(
      { name: 'RSA-OAEP' },
      privateKey,
      encryptedAesKeyBuffer
    );

    // Import AES key
    const aesKey = await crypto.subtle.importKey(
      'raw',
      aesKeyBuffer,
      { name: 'AES-GCM' },
      false,
      ['decrypt']
    );

    // Convert encrypted file from base64
    const encryptedWithIv = Uint8Array.from(atob(encryptedFileContent), c => c.charCodeAt(0));

    // Extract IV (first 12 bytes) and encrypted data
    const iv = encryptedWithIv.slice(0, 12);
    const encryptedFileBuffer = encryptedWithIv.slice(12);

    console.log(`Decrypting file with IV length: ${iv.length}, encrypted data length: ${encryptedFileBuffer.length}`);

    // Decrypt file
    const decryptedFileBuffer = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      aesKey,
      encryptedFileBuffer
    );

    // Verify file integrity
    const fileHash = await crypto.subtle.digest('SHA-256', decryptedFileBuffer);
    const fileHashHex = Array.from(new Uint8Array(fileHash))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    if (fileHashHex !== blockchainTx.file_hash) {
      console.error(`Hash mismatch! Expected: ${blockchainTx.file_hash}, Got: ${fileHashHex}`);
      
      // Log failed decryption
      await supabase
        .from('decryption_sessions')
        .insert({
          user_id: user.id,
          blockchain_tx_id: blockchainTxId,
          private_key_fingerprint: 'unknown',
          file_hash_verification: fileHashHex,
          status: 'verification_failed',
          error_message: 'File integrity verification failed'
        });

      await supabase
        .from('security_audit_log')
        .insert({
          user_id: user.id,
          action: 'FILE_DECRYPT',
          resource_type: 'file',
          resource_id: blockchainTxId,
          success: false,
          error_message: 'File integrity verification failed'
        });

      throw new Error('File integrity verification failed. The file may be corrupted or tampered with.');
    }

    console.log(`File integrity verified successfully`);

    // Generate private key fingerprint
    const privateKeyBuffer = new TextEncoder().encode(privateKeyPem);
    const fingerprintHash = await crypto.subtle.digest('SHA-256', privateKeyBuffer);
    const privateKeyFingerprint = Array.from(new Uint8Array(fingerprintHash))
      .map(b => b.toString(16).padStart(2, '0'))
      .join(':')
      .slice(0, 47);

    // Log successful decryption
    await supabase
      .from('decryption_sessions')
      .insert({
        user_id: user.id,
        blockchain_tx_id: blockchainTxId,
        private_key_fingerprint: privateKeyFingerprint,
        file_hash_verification: fileHashHex,
        status: 'completed'
      });

    await supabase
      .from('security_audit_log')
      .insert({
        user_id: user.id,
        action: 'FILE_DECRYPT',
        resource_type: 'file',
        resource_id: blockchainTxId,
        success: true
      });

    // Convert decrypted file to base64
    const decryptedFileBase64 = btoa(String.fromCharCode(...new Uint8Array(decryptedFileBuffer)));

    const originalFileName = blockchainTx.metadata?.file_name || 'decrypted_file.pdf';

    console.log(`Decryption completed successfully for ${originalFileName}`);

    return new Response(JSON.stringify({
      success: true,
      decryptedFile: decryptedFileBase64,
      originalFileName,
      fileHash: fileHashHex,
      verificationPassed: true
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Decryption error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});