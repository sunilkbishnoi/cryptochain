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

    const { fileName, fileContent, fileSize, publicKeyPem } = await req.json();

    if (!fileName || !fileContent || !fileSize || !publicKeyPem) {
      throw new Error('Missing required fields: fileName, fileContent, fileSize, publicKeyPem');
    }

    // Validate file type
    if (!fileName.toLowerCase().endsWith('.pdf')) {
      throw new Error('Only PDF files are supported');
    }

    console.log(`Starting encryption for file: ${fileName}, size: ${fileSize}`);

    // Generate AES-256 key
    const aesKey = await crypto.subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );

    // Convert file content from base64 to ArrayBuffer
    const fileBuffer = Uint8Array.from(atob(fileContent), c => c.charCodeAt(0));

    // Generate IV for AES encryption
    const iv = crypto.getRandomValues(new Uint8Array(12));

    // Encrypt file with AES-256
    const encryptedFileBuffer = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      aesKey,
      fileBuffer
    );

    // Export AES key to raw format
    const aesKeyBuffer = await crypto.subtle.exportKey('raw', aesKey);

    // Import RSA public key
    const publicKeyBuffer = new TextEncoder().encode(publicKeyPem);
    const pemHeader = '-----BEGIN PUBLIC KEY-----';
    const pemFooter = '-----END PUBLIC KEY-----';
    const pemContents = publicKeyPem
      .replace(pemHeader, '')
      .replace(pemFooter, '')
      .replace(/\s/g, '');
    
    const binaryDerString = atob(pemContents);
    const binaryDer = new Uint8Array(binaryDerString.length);
    for (let i = 0; i < binaryDerString.length; i++) {
      binaryDer[i] = binaryDerString.charCodeAt(i);
    }

    const publicKey = await crypto.subtle.importKey(
      'spki',
      binaryDer,
      { name: 'RSA-OAEP', hash: 'SHA-256' },
      false,
      ['encrypt']
    );

    // Encrypt AES key with RSA public key
    const encryptedAesKey = await crypto.subtle.encrypt(
      { name: 'RSA-OAEP' },
      publicKey,
      aesKeyBuffer
    );

    // Generate file hash
    const fileHash = await crypto.subtle.digest('SHA-256', fileBuffer);
    const fileHashHex = Array.from(new Uint8Array(fileHash))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    // Generate blockchain transaction ID
    const blockchainTxId = '0x' + Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    // Generate public key fingerprint
    const publicKeyBuffer2 = new TextEncoder().encode(publicKeyPem);
    const fingerprintHash = await crypto.subtle.digest('SHA-256', publicKeyBuffer2);
    const fingerprint = Array.from(new Uint8Array(fingerprintHash))
      .map(b => b.toString(16).padStart(2, '0'))
      .join(':')
      .slice(0, 47);

    // Encode encrypted AES key to base64
    const encryptedAesKeyBase64 = btoa(String.fromCharCode(...new Uint8Array(encryptedAesKey)));

    // Get current block height (simulated)
    const blockHeight = Math.floor(Date.now() / 1000) % 100000 + 1000000;

    console.log(`Generated blockchain TX ID: ${blockchainTxId}`);
    console.log(`File hash: ${fileHashHex}`);

    // Store in blockchain transactions table
    const { error: blockchainError } = await supabase
      .from('blockchain_transactions')
      .insert({
        tx_id: blockchainTxId,
        block_number: blockHeight,
        file_hash: fileHashHex,
        encrypted_aes_key: encryptedAesKeyBase64,
        sender_id: user.id,
        recipient_id: user.id,
        gas_used: 21000 + Math.floor(fileSize / 1000),
        status: 'confirmed',
        metadata: {
          file_name: fileName,
          file_size: fileSize,
          public_key_fingerprint: fingerprint,
          encryption_algorithm: 'AES-256-GCM',
          key_algorithm: 'RSA-OAEP'
        }
      });

    if (blockchainError) {
      console.error('Blockchain error:', blockchainError);
      throw new Error('Failed to store blockchain transaction');
    }

    // Store in encryption sessions table
    const { error: sessionError } = await supabase
      .from('encryption_sessions')
      .insert({
        user_id: user.id,
        file_name: fileName,
        file_hash: fileHashHex,
        file_size: fileSize,
        encrypted_aes_key: encryptedAesKeyBase64,
        public_key_fingerprint: fingerprint,
        blockchain_tx_id: blockchainTxId,
        status: 'completed'
      });

    if (sessionError) {
      console.error('Session error:', sessionError);
      throw new Error('Failed to store encryption session');
    }

    // Log security audit
    await supabase
      .from('security_audit_log')
      .insert({
        user_id: user.id,
        action: 'FILE_ENCRYPT',
        resource_type: 'file',
        resource_id: blockchainTxId,
        success: true
      });

    // Combine IV and encrypted file for download
    const encryptedWithIv = new Uint8Array(iv.length + encryptedFileBuffer.byteLength);
    encryptedWithIv.set(iv);
    encryptedWithIv.set(new Uint8Array(encryptedFileBuffer), iv.length);

    // Convert to base64 for transmission
    const encryptedFileBase64 = btoa(String.fromCharCode(...encryptedWithIv));

    console.log(`Encryption completed successfully for ${fileName}`);

    return new Response(JSON.stringify({
      success: true,
      blockchainTxId,
      fileHash: fileHashHex,
      encryptedFile: encryptedFileBase64,
      fileName: fileName.replace('.pdf', '.enc'),
      publicKeyFingerprint: fingerprint
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Encryption error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});