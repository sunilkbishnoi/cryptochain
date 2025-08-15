import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Hash, Clock, Shield, Database, Activity } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

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
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from('blockchain_transactions')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(50);

      if (error) throw error;

      setTransactions(data.map(tx => ({
        txId: tx.tx_id,
        blockNumber: tx.block_number,
        timestamp: new Date(tx.timestamp),
        fileHash: tx.file_hash,
        encryptedKey: tx.encrypted_aes_key,
        senderId: tx.sender_id,
        recipientId: tx.recipient_id,
        gasUsed: tx.gas_used,
        status: tx.status as 'confirmed' | 'pending' | 'failed'
      })));

      // Update block height to latest
      if (data.length > 0) {
        setBlockHeight(Math.max(...data.map(tx => tx.block_number)));
      }
    } catch (error) {
      console.error('Error loading transactions:', error);
    }
  };

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