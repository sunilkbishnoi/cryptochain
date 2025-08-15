import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Hash, Clock, Shield, Database, Activity } from 'lucide-react';

interface BlockchainTransaction {
  txId: string;
  blockNumber: number;
  timestamp: Date;
  fileHash: string;
  encryptedKey: string;
  senderId: string;
  recipientId: string;
  gasUsed: number;
  status: 'confirmed' | 'pending' | 'failed';
}

export const BlockchainExplorer = () => {
  const [transactions, setTransactions] = useState<BlockchainTransaction[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [blockHeight, setBlockHeight] = useState(1337);

  useEffect(() => {
    // Simulate some existing blockchain transactions
    const mockTransactions: BlockchainTransaction[] = [
      {
        txId: '0xa1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456',
        blockNumber: 1337,
        timestamp: new Date(Date.now() - 3600000),
        fileHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        encryptedKey: 'rsa_encrypted_aes_key_base64_encoded_string_here',
        senderId: '0x742d35Cc6634C0532925a3b8D400551E9b7c865e',
        recipientId: '0x8ba1f109551bD432803012645Hac136c18B08f7a',
        gasUsed: 21000,
        status: 'confirmed'
      },
      {
        txId: '0xb2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456a1',
        blockNumber: 1336,
        timestamp: new Date(Date.now() - 7200000),
        fileHash: 'f7fbba6e0636f890e56fbbf3283e524c6fa3204ae298382d624741d0dc6638326',
        encryptedKey: 'another_rsa_encrypted_aes_key_base64_encoded_string',
        senderId: '0x8ba1f109551bD432803012645Hac136c18B08f7a',
        recipientId: '0x742d35Cc6634C0532925a3b8D400551E9b7c865e',
        gasUsed: 21000,
        status: 'confirmed'
      }
    ];
    setTransactions(mockTransactions);
  }, []);

  const filteredTransactions = transactions.filter(tx =>
    tx.txId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tx.fileHash.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tx.senderId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <Card className="crypto-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-6 h-6 text-primary" />
            Blockchain Explorer
          </CardTitle>
          <CardDescription>
            Browse encrypted file metadata transactions on the blockchain
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="crypto-card p-4">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="w-5 h-5 text-crypto-green" />
                <span className="font-semibold">Block Height</span>
              </div>
              <div className="text-2xl font-bold font-mono text-crypto-green">
                {blockHeight.toLocaleString()}
              </div>
            </div>
            <div className="crypto-card p-4">
              <div className="flex items-center gap-2 mb-2">
                <Hash className="w-5 h-5 text-primary" />
                <span className="font-semibold">Total Transactions</span>
              </div>
              <div className="text-2xl font-bold font-mono text-primary">
                {transactions.length}
              </div>
            </div>
            <div className="crypto-card p-4">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-5 h-5 text-accent" />
                <span className="font-semibold">Security Level</span>
              </div>
              <div className="text-2xl font-bold text-accent">
                Enterprise
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by transaction ID, file hash, or address..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline">
              <Search className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="crypto-card">
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>Latest encryption metadata transactions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredTransactions.map((tx) => (
              <div key={tx.txId} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Hash className="w-4 h-4 text-primary" />
                    <span className="font-mono text-sm text-primary">
                      {tx.txId.slice(0, 20)}...{tx.txId.slice(-6)}
                    </span>
                  </div>
                  <Badge variant={tx.status === 'confirmed' ? 'default' : 'secondary'}>
                    {tx.status}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground">Block Number</div>
                    <div className="font-mono text-crypto-green">#{tx.blockNumber}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Timestamp</div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {tx.timestamp.toLocaleString()}
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <div className="text-muted-foreground">File Hash (SHA-256)</div>
                    <div className="hash-display">
                      {tx.fileHash}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">From</div>
                    <div className="font-mono text-xs text-muted-foreground">
                      {tx.senderId}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">To</div>
                    <div className="font-mono text-xs text-muted-foreground">
                      {tx.recipientId}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Gas Used</div>
                    <div className="font-mono text-crypto-orange">
                      {tx.gasUsed.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Encrypted Key Size</div>
                    <div className="font-mono">
                      {tx.encryptedKey.length} bytes
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};