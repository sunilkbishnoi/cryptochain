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

    const { keyName, algorithm = 'RSA-2048' } = await req.json();

    if (!keyName) {
      throw new Error('Key name is required');
    }

    const keySize = algorithm === 'RSA-4096' ? 4096 : 2048;
    console.log(`Generating ${algorithm} key pair for user: ${user.id}`);

    // Generate RSA key pair
    const keyPair = await crypto.subtle.generateKey(
      {
        name: 'RSA-OAEP',
        modulusLength: keySize,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: 'SHA-256',
      },
      true,
      ['encrypt', 'decrypt']
    );

    // Export public key
    const publicKeyBuffer = await crypto.subtle.exportKey('spki', keyPair.publicKey);
    const publicKeyBase64 = btoa(String.fromCharCode(...new Uint8Array(publicKeyBuffer)));
    const publicKeyPem = `-----BEGIN PUBLIC KEY-----\n${publicKeyBase64.match(/.{1,64}/g)?.join('\n')}\n-----END PUBLIC KEY-----`;

    // Export private key
    const privateKeyBuffer = await crypto.subtle.exportKey('pkcs8', keyPair.privateKey);
    const privateKeyBase64 = btoa(String.fromCharCode(...new Uint8Array(privateKeyBuffer)));
    const privateKeyPem = `-----BEGIN PRIVATE KEY-----\n${privateKeyBase64.match(/.{1,64}/g)?.join('\n')}\n-----END PRIVATE KEY-----`;

    // Generate fingerprint from public key
    const publicKeyBytes = new TextEncoder().encode(publicKeyPem);
    const fingerprintHash = await crypto.subtle.digest('SHA-256', publicKeyBytes);
    const fingerprint = Array.from(new Uint8Array(fingerprintHash))
      .map(b => b.toString(16).padStart(2, '0'))
      .join(':')
      .slice(0, 47);

    // For demonstration, we'll store an encrypted version of the private key
    // In production, this should use a proper encryption scheme with user password
    const encryptedPrivateKey = btoa(privateKeyPem); // Simple base64 encoding for demo

    // Store key pair in database
    const { data: keyPairData, error: keyError } = await supabase
      .from('key_pairs')
      .insert({
        user_id: user.id,
        name: keyName,
        public_key: publicKeyPem,
        private_key_encrypted: encryptedPrivateKey,
        algorithm,
        fingerprint,
        status: 'active'
      })
      .select()
      .single();

    if (keyError) {
      console.error('Key storage error:', keyError);
      throw new Error('Failed to store key pair');
    }

    // Log security audit
    await supabase
      .from('security_audit_log')
      .insert({
        user_id: user.id,
        action: 'KEYPAIR_GENERATE',
        resource_type: 'keypair',
        resource_id: keyPairData.id,
        success: true
      });

    console.log(`Key pair generated successfully with fingerprint: ${fingerprint}`);

    return new Response(JSON.stringify({
      success: true,
      keyPair: {
        id: keyPairData.id,
        name: keyName,
        algorithm,
        fingerprint,
        publicKey: publicKeyPem,
        privateKey: privateKeyPem, // Only returned once for user to save securely
        createdAt: keyPairData.created_at
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Key generation error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});