import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, Shield, Key, Database, Lock, Unlock, Download, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface CryptoOperation {
  id: string;
  type: 'encrypt' | 'decrypt';
  fileName: string;
  fileHash: string;
  timestamp: Date;
  status: 'pending' | 'completed' | 'failed';
  blockchainTxId?: string;
}

interface KeyPair {
  id: string;
  name: string;
  publicKey: string;
  privateKey?: string;
  algorithm: string;
  fingerprint: string;
}

export const CryptoEngine = () => {
  const [operations, setOperations] = useState<CryptoOperation[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [keyPairs, setKeyPairs] = useState<KeyPair[]>([]);
  const [selectedKeyPair, setSelectedKeyPair] = useState<KeyPair | null>(null);
  
  // Decryption state
  const [blockchainTxId, setBlockchainTxId] = useState('');
  const [privateKey, setPrivateKey] = useState('');
  const [encryptedFile, setEncryptedFile] = useState<File | null>(null);
  const [isDecrypting, setIsDecrypting] = useState(false);
  
  const { toast } = useToast();

  // Load key pairs on component mount
  React.useEffect(() => {
    loadKeyPairs();
  }, []);

  const loadKeyPairs = async () => {
    try {
      const { data, error } = await supabase
        .from('key_pairs')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setKeyPairs(data.map(kp => ({
        id: kp.id,
        name: kp.name,
        publicKey: kp.public_key,
        algorithm: kp.algorithm,
        fingerprint: kp.fingerprint
      })));
    } catch (error) {
      console.error('Error loading key pairs:', error);
    }
  };

  const handleFileEncryption = async (file: File) => {
    if (!selectedKeyPair) {
      toast({
        title: "No Key Selected",
        description: "Please select a key pair for encryption.",
        variant: "destructive"
      });
      return;
    }

    if (file.type !== 'application/pdf') {
      toast({
        title: "Invalid File Type",
        description: "Only PDF files are supported for encryption.",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    
    try {
      const operationId = crypto.randomUUID();
      const fileHash = await generateFileHash(file);
      
      const newOperation: CryptoOperation = {
        id: operationId,
        type: 'encrypt',
        fileName: file.name,
        fileHash,
        timestamp: new Date(),
        status: 'pending'
      };

      setOperations(prev => [newOperation, ...prev]);

      // Convert file to base64
      const fileContent = await fileToBase64(file);
      
      // Get auth token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Authentication required');
      }

      // Call encryption edge function
      const { data, error } = await supabase.functions.invoke('encrypt-file', {
        body: {
          fileName: file.name,
          fileContent: fileContent.split(',')[1], // Remove data:... prefix
          fileSize: file.size,
          publicKeyPem: selectedKeyPair.publicKey
        }
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);

      // Update operation status
      setOperations(prev => 
        prev.map(op => 
          op.id === operationId 
            ? { ...op, status: 'completed', blockchainTxId: data.blockchainTxId }
            : op
        )
      );

      // Download encrypted file
      downloadFile(data.encryptedFile, data.fileName, 'application/octet-stream');
      
      toast({
        title: "Encryption Complete",
        description: `File encrypted successfully. TX: ${data.blockchainTxId.slice(0, 16)}...`,
      });
      
    } catch (error) {
      console.error('Encryption error:', error);
      toast({
        title: "Encryption Failed",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileDecryption = async () => {
    if (!blockchainTxId || !privateKey || !encryptedFile) {
      toast({
        title: "Missing Information",
        description: "Please provide transaction ID, private key, and encrypted file.",
        variant: "destructive"
      });
      return;
    }

    setIsDecrypting(true);

    try {
      // Convert encrypted file to base64
      const encryptedFileContent = await fileToBase64(encryptedFile);

      // Get auth token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Authentication required');
      }

      // Call decryption edge function
      const { data, error } = await supabase.functions.invoke('decrypt-file', {
        body: {
          blockchainTxId,
          encryptedFileContent: encryptedFileContent.split(',')[1], // Remove data:... prefix
          privateKeyPem: privateKey
        }
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);

      // Download decrypted file
      downloadFile(data.decryptedFile, data.originalFileName, 'application/pdf');
      
      toast({
        title: "Decryption Complete",
        description: `File decrypted successfully: ${data.originalFileName}`,
      });

      // Clear form
      setBlockchainTxId('');
      setPrivateKey('');
      setEncryptedFile(null);
      
    } catch (error) {
      console.error('Decryption error:', error);
      toast({
        title: "Decryption Failed",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive"
      });
    } finally {
      setIsDecrypting(false);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const downloadFile = (base64Content: string, fileName: string, mimeType: string) => {
    const binaryString = atob(base64Content);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    const blob = new Blob([bytes], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const generateFileHash = async (file: File): Promise<string> => {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  return (
    <div className="space-y-6">
      <Card className="crypto-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary" />
            Blockchain File Encryption System
          </CardTitle>
          <CardDescription>
            Enterprise-grade AES-256 encryption with blockchain metadata storage and cross-device access
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="encrypt" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="encrypt">Encrypt File</TabsTrigger>
              <TabsTrigger value="decrypt">Decrypt File</TabsTrigger>
            </TabsList>
            
            <TabsContent value="encrypt" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
                  <Lock className="w-8 h-8 text-primary" />
                  <div>
                    <div className="font-semibold">AES-256</div>
                    <div className="text-sm text-muted-foreground">File Encryption</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
                  <Key className="w-8 h-8 text-accent" />
                  <div>
                    <div className="font-semibold">RSA-OAEP</div>
                    <div className="text-sm text-muted-foreground">Key Exchange</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
                  <Database className="w-8 h-8 text-crypto-green" />
                  <div>
                    <div className="font-semibold">Blockchain</div>
                    <div className="text-sm text-muted-foreground">Metadata Storage</div>
                  </div>
                </div>
              </div>

              {/* Key Pair Selection */}
              <div className="space-y-3">
                <label className="text-sm font-medium">Select Key Pair for Encryption</label>
                <div className="grid gap-2">
                  {keyPairs.length > 0 ? (
                    keyPairs.map((keyPair) => (
                      <div
                        key={keyPair.id}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          selectedKeyPair?.id === keyPair.id
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50'
                        }`}
                        onClick={() => setSelectedKeyPair(keyPair)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">{keyPair.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {keyPair.algorithm} • {keyPair.fingerprint.slice(0, 20)}...
                            </div>
                          </div>
                          {selectedKeyPair?.id === keyPair.id && (
                            <CheckCircle className="w-5 h-5 text-primary" />
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 border border-dashed rounded-lg text-center">
                      <AlertCircle className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-muted-foreground">No key pairs found. Create one in the Key Management tab.</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Upload PDF for Encryption</h3>
                <p className="text-muted-foreground mb-4">
                  Select a PDF file to encrypt with AES-256 and store metadata on blockchain
                </p>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileEncryption(file);
                  }}
                  className="hidden"
                  id="file-upload"
                />
                <Button 
                  variant="default"
                  onClick={() => document.getElementById('file-upload')?.click()}
                  disabled={isProcessing || !selectedKeyPair}
                  className="crypto-glow"
                >
                  {isProcessing ? 'Encrypting...' : 'Select PDF File'}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="decrypt" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
                  <Unlock className="w-8 h-8 text-crypto-green" />
                  <div>
                    <div className="font-semibold">Decrypt</div>
                    <div className="text-sm text-muted-foreground">File Recovery</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
                  <Shield className="w-8 h-8 text-accent" />
                  <div>
                    <div className="font-semibold">Verify</div>
                    <div className="text-sm text-muted-foreground">Integrity Check</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
                  <Database className="w-8 h-8 text-primary" />
                  <div>
                    <div className="font-semibold">Blockchain</div>
                    <div className="text-sm text-muted-foreground">Metadata Retrieval</div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Blockchain Transaction ID</label>
                  <Input
                    placeholder="0x1234567890abcdef..."
                    value={blockchainTxId}
                    onChange={(e) => setBlockchainTxId(e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Private Key (PEM Format)</label>
                  <Textarea
                    placeholder="-----BEGIN PRIVATE KEY-----&#10;...&#10;-----END PRIVATE KEY-----"
                    value={privateKey}
                    onChange={(e) => setPrivateKey(e.target.value)}
                    rows={6}
                    className="mt-1 font-mono text-sm"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Encrypted File (.enc)</label>
                  <div className="mt-1 border-2 border-dashed border-border rounded-lg p-4">
                    {encryptedFile ? (
                      <div className="flex items-center gap-3">
                        <FileText className="w-8 h-8 text-primary" />
                        <div>
                          <div className="font-medium">{encryptedFile.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {(encryptedFile.size / 1024).toFixed(2)} KB
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center">
                        <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-muted-foreground">Select encrypted file (.enc)</p>
                      </div>
                    )}
                    <input
                      type="file"
                      accept=".enc"
                      onChange={(e) => setEncryptedFile(e.target.files?.[0] || null)}
                      className="hidden"
                      id="encrypted-file-upload"
                    />
                    <Button 
                      variant="outline"
                      onClick={() => document.getElementById('encrypted-file-upload')?.click()}
                      className="mt-3 w-full"
                    >
                      Choose Encrypted File
                    </Button>
                  </div>
                </div>

                <Button 
                  onClick={handleFileDecryption}
                  disabled={isDecrypting || !blockchainTxId || !privateKey || !encryptedFile}
                  className="w-full crypto-glow"
                >
                  {isDecrypting ? 'Decrypting...' : 'Decrypt File'}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {operations.length > 0 && (
        <Card className="crypto-card">
          <CardHeader>
            <CardTitle>Recent Operations</CardTitle>
            <CardDescription>Encryption and decryption history</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {operations.map((operation) => (
                <div key={operation.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {operation.type === 'encrypt' ? 
                      <Lock className="w-5 h-5 text-primary" /> : 
                      <Unlock className="w-5 h-5 text-crypto-green" />
                    }
                    <div>
                      <div className="font-medium">{operation.fileName}</div>
                      <div className="text-sm text-muted-foreground">
                        {operation.timestamp.toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-sm font-medium ${
                      operation.status === 'completed' ? 'text-crypto-green' :
                      operation.status === 'failed' ? 'text-destructive' :
                      'text-crypto-orange'
                    }`}>
                      {operation.status.toUpperCase()}
                    </div>
                    {operation.blockchainTxId && (
                      <div className="text-xs text-muted-foreground font-mono">
                        TX: {operation.blockchainTxId.slice(0, 16)}...
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};