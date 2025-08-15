import { useState } from 'react';
import { Navigation } from '@/components/Navigation';
import { CryptoEngine } from '@/components/CryptoEngine';
import { BlockchainExplorer } from '@/components/BlockchainExplorer';
import { ArchitectureDiagram } from '@/components/ArchitectureDiagram';
import { KeyManagement } from '@/components/KeyManagement';
import blockchainHero from '@/assets/blockchain-hero.jpg';

const Index = () => {
  const [activeTab, setActiveTab] = useState('encrypt');

  const renderActiveComponent = () => {
    switch (activeTab) {
      case 'encrypt':
        return <CryptoEngine />;
      case 'blockchain':
        return <BlockchainExplorer />;
      case 'architecture':
        return <ArchitectureDiagram />;
      case 'keys':
        return <KeyManagement />;
      default:
        return <CryptoEngine />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative h-96 bg-gradient-to-r from-background to-muted overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{ backgroundImage: `url(${blockchainHero})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background/90 to-transparent" />
        <div className="relative container mx-auto px-4 h-full flex items-center">
          <div className="max-w-2xl">
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              <span className="crypto-gradient">Blockchain</span>
              <br />
              File Encryption
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Enterprise-grade file encryption with blockchain metadata storage. 
              Secure your documents with AES-256 encryption and immutable transaction records.
            </p>
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2 bg-muted/50 px-3 py-2 rounded-full">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span>AES-256 Encryption</span>
              </div>
              <div className="flex items-center gap-2 bg-muted/50 px-3 py-2 rounded-full">
                <div className="w-2 h-2 bg-crypto-green rounded-full"></div>
                <span>Blockchain Storage</span>
              </div>
              <div className="flex items-center gap-2 bg-muted/50 px-3 py-2 rounded-full">
                <div className="w-2 h-2 bg-accent rounded-full"></div>
                <span>Cross-Device Access</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <Navigation activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {renderActiveComponent()}
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card/50 py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-muted-foreground">
            CryptoChain - Secure blockchain-based file encryption system
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Built with enterprise security standards and GDPR compliance
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
