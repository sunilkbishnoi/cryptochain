import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Key, Download, Upload, RefreshCw, Copy, Eye, EyeOff, Shield, Plus, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface KeyPair {
  id: string;
  name: string;
  publicKey: string;
  privateKey: string;
  algorithm: 'RSA-2048' | 'RSA-4096';
  createdAt: Date;
  fingerprint: string;
  status: 'active' | 'revoked' | 'expired';
}

export const KeyManagement = () => {
  const [keyPairs, setKeyPairs] = useState<KeyPair[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPrivateKeys, setShowPrivateKeys] = useState<{ [key: string]: boolean }>({});
  const { toast } = useToast();

  useEffect(() => {
    loadKeyPairs();
  }, []);

  const loadKeyPairs = async () => {
    try {
      const { data, error } = await supabase
        .from('key_pairs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setKeyPairs(data.map((key: any) => ({
        ...key,
        createdAt: new Date(key.created_at)
      })));
    } catch (error) {
      console.error('Failed to load key pairs:', error);
      toast({
        title: "Loading Failed",
        description: "Failed to load key pairs from database.",
        variant: "destructive"
      });
    }
  };

  const [newKeyName, setNewKeyName] = useState('');

  const generateKeyPair = async (algorithm: 'RSA-2048' | 'RSA-4096' = 'RSA-2048') => {
    if (!newKeyName.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter a name for the key pair.",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    
    try {
      // Get auth token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Authentication required');
      }

      // Call key generation edge function
      const { data, error } = await supabase.functions.invoke('generate-keypair', {
        body: {
          keyName: newKeyName.trim(),
          algorithm
        }
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);

      // Add new key pair to local state
      const newKeyPair: KeyPair = {
        id: data.keyPair.id,
        name: data.keyPair.name,
        publicKey: data.keyPair.publicKey,
        privateKey: data.keyPair.privateKey,
        algorithm: data.keyPair.algorithm,
        createdAt: new Date(data.keyPair.createdAt),
        fingerprint: data.keyPair.fingerprint,
        status: 'active'
      };

      setKeyPairs(prev => [newKeyPair, ...prev]);
      setNewKeyName('');

      // Download private key for safekeeping
      downloadKey(newKeyPair, 'private');

      toast({
        title: "Key Pair Generated",
        description: `New ${algorithm} key pair created successfully. Private key downloaded for safekeeping.`,
      });
    } catch (error) {
      console.error('Key generation error:', error);
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate key pair. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const generateMockPublicKey = () => {
    return `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAu1SU1LfVLPHCozMxH2Mo
4lgOEePzNm0tRgeLezV6ffAt0gunVTLw7onLRnrq0/IzW7yWR7QkrmBL7jTKEn5u
+qKhbwKfBstIs+bMprp1WVvLiWHJLE5lYBNRE8NdGbMDVT2VNM5Pp8UKo5AEiLke
5gOKL55JlVJe0TgS3jQlUtAjM+E6K6bFY9xKBCHEyO8KCfp3+WJHB8JsHXXlQxzE
...
-----END PUBLIC KEY-----`;
  };

  const generateMockPrivateKey = () => {
    return `-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC7VJTUt9Us8cKj
MzEfYyjiWA4R4/M2bS1GB4t7NXp98C3SC6dVMvDuictGeurT8jNbvJZHtCSuYEvu
NMoSfm76oqFvAp8Gy0iz5symuXVZW8uJYcksTeVgE1ETw10ZswNVPZU0zk+nxQqj
kASIuR7mA4ovnkmVUl7ROBLeNCVS0CMz4TorpsVj3EoEIcTI7woJ+nf5YkcHwmwd
...
-----END PRIVATE KEY-----`;
  };

  const generateFingerprint = async (publicKey: string): Promise<string> => {
    // Simulate fingerprint generation
    const encoder = new TextEncoder();
    const data = encoder.encode(publicKey);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join(':').slice(0, 47);
  };

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied",
        description: `${type} copied to clipboard.`,
      });
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Failed to copy to clipboard.",
        variant: "destructive"
      });
    }
  };

  const togglePrivateKeyVisibility = (keyId: string) => {
    setShowPrivateKeys(prev => ({
      ...prev,
      [keyId]: !prev[keyId]
    }));
  };

  const downloadKey = (keyPair: KeyPair, type: 'public' | 'private') => {
    const key = type === 'public' ? keyPair.publicKey : keyPair.privateKey;
    if (!key) {
      toast({
        title: "Key Not Available",
        description: `${type} key is not available for download.`,
        variant: "destructive"
      });
      return;
    }
    
    const blob = new Blob([key], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${keyPair.name.toLowerCase().replace(/\s+/g, '_')}_${type}_key.pem`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const deleteKeyPair = async (keyPairId: string) => {
    try {
      const { error } = await supabase
        .from('key_pairs')
        .delete()
        .eq('id', keyPairId);

      if (error) throw error;

      setKeyPairs(prev => prev.filter(kp => kp.id !== keyPairId));
      
      toast({
        title: "Key Pair Deleted",
        description: "Key pair deleted successfully.",
      });
    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: "Deletion Failed",
        description: "Failed to delete key pair.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card className="crypto-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="w-6 h-6 text-primary" />
            Cryptographic Key Management
          </CardTitle>
          <CardDescription>
            Generate, manage, and secure RSA key pairs for file encryption
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Key Pair Name</label>
              <Input
                placeholder="e.g., My Encryption Key"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                className="mt-1"
              />
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                onClick={() => generateKeyPair('RSA-2048')}
                disabled={isGenerating || !newKeyName.trim()}
                className="crypto-glow"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Generate RSA-2048
                  </>
                )}
              </Button>
              <Button 
                onClick={() => generateKeyPair('RSA-4096')}
                disabled={isGenerating || !newKeyName.trim()}
                variant="outline"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4 mr-2" />
                    Generate RSA-4096
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="crypto-card p-4 text-center">
              <Key className="w-8 h-8 text-primary mx-auto mb-2" />
              <div className="text-2xl font-bold">{keyPairs.length}</div>
              <div className="text-sm text-muted-foreground">Key Pairs</div>
            </div>
            <div className="crypto-card p-4 text-center">
              <Shield className="w-8 h-8 text-crypto-green mx-auto mb-2" />
              <div className="text-2xl font-bold">{keyPairs.filter(k => k.status === 'active').length}</div>
              <div className="text-sm text-muted-foreground">Active Keys</div>
            </div>
            <div className="crypto-card p-4 text-center">
              <RefreshCw className="w-8 h-8 text-accent mx-auto mb-2" />
              <div className="text-2xl font-bold">2048</div>
              <div className="text-sm text-muted-foreground">Default Bits</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {keyPairs.length > 0 && (
        <Card className="crypto-card">
          <CardHeader>
            <CardTitle>Key Pairs</CardTitle>
            <CardDescription>Manage your RSA key pairs</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {keyPairs.map((keyPair) => (
                <div key={keyPair.id} className="border rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold">{keyPair.name}</h4>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{keyPair.algorithm}</span>
                        <Badge variant={keyPair.status === 'active' ? 'default' : 'secondary'}>
                          {keyPair.status}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right text-sm text-muted-foreground">
                        <div>Created: {keyPair.createdAt.toLocaleDateString()}</div>
                        <div className="font-mono text-xs">
                          {keyPair.fingerprint}
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteKeyPair(keyPair.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <Tabs defaultValue="public" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="public">Public Key</TabsTrigger>
                      <TabsTrigger value="private">Private Key</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="public" className="space-y-3">
                      <div className="hash-display">
                        {keyPair.publicKey}
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => copyToClipboard(keyPair.publicKey, 'Public key')}
                        >
                          <Copy className="w-4 h-4 mr-1" />
                          Copy
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => downloadKey(keyPair, 'public')}
                        >
                          <Download className="w-4 h-4 mr-1" />
                          Download
                        </Button>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="private" className="space-y-3">
                      <div className="hash-display">
                        {showPrivateKeys[keyPair.id] 
                          ? keyPair.privateKey 
                          : '••••••••••••••••••••••••••••••••••••••••••••••••••••••••'
                        }
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => togglePrivateKeyVisibility(keyPair.id)}
                        >
                          {showPrivateKeys[keyPair.id] ? (
                            <><EyeOff className="w-4 h-4 mr-1" />Hide</>
                          ) : (
                            <><Eye className="w-4 h-4 mr-1" />Show</>
                          )}
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => copyToClipboard(keyPair.privateKey, 'Private key')}
                          disabled={!showPrivateKeys[keyPair.id]}
                        >
                          <Copy className="w-4 h-4 mr-1" />
                          Copy
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => downloadKey(keyPair, 'private')}
                          disabled={!keyPair.privateKey}
                        >
                          <Download className="w-4 h-4 mr-1" />
                          Download
                        </Button>
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};