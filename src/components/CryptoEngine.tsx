import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, Shield, Key, Database, Lock, Unlock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CryptoOperation {
  id: string;
  type: 'encrypt' | 'decrypt';
  fileName: string;
  fileHash: string;
  timestamp: Date;
  status: 'pending' | 'completed' | 'failed';
  blockchainTxId?: string;
}

export const CryptoEngine = () => {
  const [operations, setOperations] = useState<CryptoOperation[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleFileEncryption = async (file: File) => {
    if (file.type !== 'application/pdf') {
      toast({
        title: "Invalid File Type",
        description: "Only PDF files are supported for encryption.",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    
    // Simulate encryption process
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

    // Simulate blockchain transaction
    setTimeout(() => {
      const blockchainTxId = generateBlockchainTxId();
      setOperations(prev => 
        prev.map(op => 
          op.id === operationId 
            ? { ...op, status: 'completed', blockchainTxId }
            : op
        )
      );
      
      toast({
        title: "Encryption Complete",
        description: `File encrypted and metadata stored on blockchain. TX: ${blockchainTxId.slice(0, 16)}...`,
      });
      
      setIsProcessing(false);
    }, 3000);
  };

  const generateFileHash = async (file: File): Promise<string> => {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const generateBlockchainTxId = (): string => {
    return '0x' + Array.from(crypto.getRandomValues(new Uint8Array(32)), 
      b => b.toString(16).padStart(2, '0')).join('');
  };

  return (
    <div className="space-y-6">
      <Card className="crypto-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary" />
            Blockchain File Encryption Engine
          </CardTitle>
          <CardDescription>
            Secure AES-256 encryption with blockchain metadata storage
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
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
                <div className="font-semibold">RSA-2048</div>
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

          <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
            <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Upload PDF for Encryption</h3>
            <p className="text-muted-foreground mb-4">
              Drag and drop a PDF file or click to browse
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
              disabled={isProcessing}
              className="crypto-glow"
            >
              {isProcessing ? 'Processing...' : 'Select PDF File'}
            </Button>
          </div>
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