import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Cpu, Database, Shield, Key, FileText, Smartphone, Monitor } from 'lucide-react';

export const ArchitectureDiagram = () => {
  return (
    <Card className="crypto-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Cpu className="w-6 h-6 text-primary" />
          System Architecture
        </CardTitle>
        <CardDescription>
          Blockchain-based file encryption and decryption workflow
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-8">
          {/* Mermaid Diagram */}
          <div className="bg-muted/20 p-6 rounded-lg">
            <div className="text-center mb-6">
              <h3 className="text-lg font-semibold mb-2">Encryption/Decryption Flow</h3>
              <p className="text-sm text-muted-foreground">
                End-to-end secure file processing with blockchain metadata storage
              </p>
            </div>
            
            <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
              {/* Device 1 - Encryption */}
              <div className="flex flex-col items-center space-y-4">
                <div className="crypto-card p-6 text-center">
                  <Monitor className="w-12 h-12 text-primary mx-auto mb-3" />
                  <h4 className="font-semibold">Device 1 (Sender)</h4>
                  <p className="text-sm text-muted-foreground">Encryption Process</p>
                </div>
                
                <div className="space-y-3 text-center">
                  <div className="flex items-center gap-2 text-sm">
                    <FileText className="w-4 h-4 text-crypto-orange" />
                    <span>1. Upload PDF File</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Shield className="w-4 h-4 text-primary" />
                    <span>2. AES-256 Encryption</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Key className="w-4 h-4 text-accent" />
                    <span>3. RSA Key Exchange</span>
                  </div>
                </div>
              </div>

              {/* Blockchain */}
              <div className="flex flex-col items-center space-y-4">
                <div className="crypto-card p-6 text-center crypto-glow">
                  <Database className="w-12 h-12 text-crypto-green mx-auto mb-3 blockchain-pulse" />
                  <h4 className="font-semibold crypto-gradient">Blockchain Network</h4>
                  <p className="text-sm text-muted-foreground">Immutable Metadata Storage</p>
                </div>
                
                <div className="space-y-2 text-center">
                  <div className="text-xs text-muted-foreground">Stores:</div>
                  <div className="space-y-1 text-xs">
                    <div>• File Hash (SHA-256)</div>
                    <div>• Encrypted AES Key</div>
                    <div>• Timestamp & IDs</div>
                    <div>• Transaction Proof</div>
                  </div>
                </div>
              </div>

              {/* Device 2 - Decryption */}
              <div className="flex flex-col items-center space-y-4">
                <div className="crypto-card p-6 text-center">
                  <Smartphone className="w-12 h-12 text-accent mx-auto mb-3" />
                  <h4 className="font-semibold">Device 2 (Recipient)</h4>
                  <p className="text-sm text-muted-foreground">Decryption Process</p>
                </div>
                
                <div className="space-y-3 text-center">
                  <div className="flex items-center gap-2 text-sm">
                    <Database className="w-4 h-4 text-crypto-green" />
                    <span>1. Query Blockchain</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Key className="w-4 h-4 text-accent" />
                    <span>2. Decrypt AES Key</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Shield className="w-4 h-4 text-primary" />
                    <span>3. Decrypt File</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Security Features */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="crypto-card p-4 text-center">
              <Shield className="w-8 h-8 text-primary mx-auto mb-2" />
              <h5 className="font-semibold text-sm">AES-256 Encryption</h5>
              <p className="text-xs text-muted-foreground">Military-grade file encryption</p>
            </div>
            <div className="crypto-card p-4 text-center">
              <Key className="w-8 h-8 text-accent mx-auto mb-2" />
              <h5 className="font-semibold text-sm">RSA-2048 Keys</h5>
              <p className="text-xs text-muted-foreground">Secure key exchange protocol</p>
            </div>
            <div className="crypto-card p-4 text-center">
              <Database className="w-8 h-8 text-crypto-green mx-auto mb-2" />
              <h5 className="font-semibold text-sm">Immutable Storage</h5>
              <p className="text-xs text-muted-foreground">Blockchain integrity guarantee</p>
            </div>
            <div className="crypto-card p-4 text-center">
              <Cpu className="w-8 h-8 text-crypto-orange mx-auto mb-2" />
              <h5 className="font-semibold text-sm">Zero Knowledge</h5>
              <p className="text-xs text-muted-foreground">File content never exposed</p>
            </div>
          </div>

          {/* Implementation Details */}
          <div className="bg-muted/10 p-6 rounded-lg">
            <h4 className="font-semibold mb-4">Technical Implementation</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
              <div>
                <h5 className="font-medium text-primary mb-2">Encryption Process</h5>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Generate random AES-256 key</li>
                  <li>• Encrypt PDF with AES-GCM mode</li>
                  <li>• Create SHA-256 file hash</li>
                  <li>• Encrypt AES key with RSA public key</li>
                  <li>• Store metadata on blockchain</li>
                </ul>
              </div>
              <div>
                <h5 className="font-medium text-accent mb-2">Security Measures</h5>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Multi-factor authentication</li>
                  <li>• GDPR compliance</li>
                  <li>• Zero-knowledge architecture</li>
                  <li>• Immutable audit trail</li>
                  <li>• End-to-end encryption</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};