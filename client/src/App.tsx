import React, { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import Header from './components/features/Layout/Header';
import Footer from './components/features/Layout/Footer';
import TabNavigation from './components/features/Layout/TabNavigation';
import UploadTab from './components/features/Tabs/UploadTab';
import DocumentsTab from './components/features/Tabs/DocumentsTab';
import SearchTab from './components/features/Tabs/SearchTab';
import LogsTab from './components/features/Tabs/LogsTab';

function App() {
  const [activeTab, setActiveTab] = useState('upload');

  const renderTabContent = () => {
    switch (activeTab) {
      case 'upload':
        return <UploadTab />;
      case 'documents':
        return <DocumentsTab />;
      case 'search':
        return <SearchTab />;
      case 'logs':
        return <LogsTab />;
      default:
        return <UploadTab />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
      <Toaster position="top-right" />
      <Header />
      <TabNavigation activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="flex-grow">
        <div className="container mx-auto bg-[hsl(var(--background))] p-4 border border-[hsl(var(--border))]">
          {renderTabContent()}
        </div>
      </main>
      
      <Footer />
    </div>
  );
}

export default App;