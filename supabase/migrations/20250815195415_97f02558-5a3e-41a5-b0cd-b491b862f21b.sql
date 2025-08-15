-- Create tables for blockchain PDF encryption system

-- Encryption sessions table for tracking file encryption operations
CREATE TABLE public.encryption_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_hash TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  encrypted_aes_key TEXT NOT NULL,
  public_key_fingerprint TEXT NOT NULL,
  blockchain_tx_id TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Decryption sessions table for tracking decryption attempts
CREATE TABLE public.decryption_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  encryption_session_id UUID REFERENCES public.encryption_sessions(id),
  blockchain_tx_id TEXT NOT NULL,
  private_key_fingerprint TEXT NOT NULL,
  file_hash_verification TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'verification_failed')),
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Key pairs table for RSA key management
CREATE TABLE public.key_pairs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  public_key TEXT NOT NULL,
  private_key_encrypted TEXT NOT NULL,
  algorithm TEXT NOT NULL DEFAULT 'RSA-2048' CHECK (algorithm IN ('RSA-2048', 'RSA-4096')),
  fingerprint TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'revoked', 'expired')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Blockchain transactions table (simulated blockchain)
CREATE TABLE public.blockchain_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tx_id TEXT UNIQUE NOT NULL,
  block_number INTEGER NOT NULL,
  file_hash TEXT NOT NULL,
  encrypted_aes_key TEXT NOT NULL,
  sender_id TEXT NOT NULL,
  recipient_id TEXT NOT NULL,
  gas_used INTEGER NOT NULL DEFAULT 21000,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'failed')),
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  metadata JSONB
);

-- Security audit log
CREATE TABLE public.security_audit_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  ip_address TEXT,
  user_agent TEXT,
  success BOOLEAN NOT NULL,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.encryption_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.decryption_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.key_pairs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blockchain_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for encryption_sessions
CREATE POLICY "Users can view their own encryption sessions" 
ON public.encryption_sessions FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own encryption sessions" 
ON public.encryption_sessions FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own encryption sessions" 
ON public.encryption_sessions FOR UPDATE 
USING (auth.uid() = user_id);

-- RLS Policies for decryption_sessions
CREATE POLICY "Users can view their own decryption sessions" 
ON public.decryption_sessions FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own decryption sessions" 
ON public.decryption_sessions FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own decryption sessions" 
ON public.decryption_sessions FOR UPDATE 
USING (auth.uid() = user_id);

-- RLS Policies for key_pairs
CREATE POLICY "Users can view their own key pairs" 
ON public.key_pairs FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own key pairs" 
ON public.key_pairs FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own key pairs" 
ON public.key_pairs FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own key pairs" 
ON public.key_pairs FOR DELETE 
USING (auth.uid() = user_id);

-- RLS Policies for blockchain_transactions (read-only for all authenticated users)
CREATE POLICY "Authenticated users can view blockchain transactions" 
ON public.blockchain_transactions FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "System can insert blockchain transactions" 
ON public.blockchain_transactions FOR INSERT 
WITH CHECK (true);

CREATE POLICY "System can update blockchain transactions" 
ON public.blockchain_transactions FOR UPDATE 
USING (true);

-- RLS Policies for security_audit_log
CREATE POLICY "Users can view their own audit logs" 
ON public.security_audit_log FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "System can insert audit logs" 
ON public.security_audit_log FOR INSERT 
WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX idx_encryption_sessions_user_id ON public.encryption_sessions(user_id);
CREATE INDEX idx_encryption_sessions_blockchain_tx_id ON public.encryption_sessions(blockchain_tx_id);
CREATE INDEX idx_decryption_sessions_user_id ON public.decryption_sessions(user_id);
CREATE INDEX idx_decryption_sessions_blockchain_tx_id ON public.decryption_sessions(blockchain_tx_id);
CREATE INDEX idx_key_pairs_user_id ON public.key_pairs(user_id);
CREATE INDEX idx_key_pairs_fingerprint ON public.key_pairs(fingerprint);
CREATE INDEX idx_blockchain_transactions_tx_id ON public.blockchain_transactions(tx_id);
CREATE INDEX idx_blockchain_transactions_block_number ON public.blockchain_transactions(block_number);
CREATE INDEX idx_security_audit_log_user_id ON public.security_audit_log(user_id);

-- Functions for automatic timestamp updates
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.completed_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for timestamp updates
CREATE TRIGGER update_encryption_sessions_completed_at
    BEFORE UPDATE ON public.encryption_sessions
    FOR EACH ROW
    WHEN (OLD.status != NEW.status AND NEW.status = 'completed')
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_decryption_sessions_completed_at
    BEFORE UPDATE ON public.decryption_sessions
    FOR EACH ROW
    WHEN (OLD.status != NEW.status AND NEW.status IN ('completed', 'failed', 'verification_failed'))
    EXECUTE FUNCTION public.update_updated_at_column();