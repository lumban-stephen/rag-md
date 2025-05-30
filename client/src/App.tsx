/**
 * Main Application Component
 * Handles the overall layout and tab-based navigation of the application
 * Wraps the entire app in a ProcessingProvider for global state management
 */
import React, { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import Header from './components/features/Layout/Header';
import Footer from './components/features/Layout/Footer';
import TabNavigation from './components/features/Layout/TabNavigation';
import UploadTab from './components/features/Tabs/UploadTab';
import DocumentsTab from './components/features/Tabs/DocumentsTab';
import SearchTab from './components/features/Tabs/SearchTab';
import LogsTab from './components/features/Tabs/LogsTab';
import ProcessingTab from './components/features/Tabs/ProcessingTab.js';
import { Search, FileText, Upload, Loader2, List } from 'lucide-react';
import { ProcessingProvider } from './contexts/ProcessingContext.js';

function App() {
  // State to track the currently active tab
  const [activeTab, setActiveTab] = useState('search');

  /**
   * Renders the content for the currently active tab
   * @returns The component corresponding to the active tab
   */
  const renderTabContent = () => {
    switch (activeTab) {
      case 'upload':
        return <UploadTab />;
      case 'documents':
        return <DocumentsTab />;
      case 'search':
        return <SearchTab />;
      case 'processing':
        return <ProcessingTab />;
      case 'logs':
        return <LogsTab />;
      default:
        return <UploadTab />;
    }
  };

  // Configuration for the navigation tabs
  const tabs = [
    { id: 'search', label: 'Search', icon: Search },
    { id: 'documents', label: 'Documents', icon: FileText },
    { id: 'upload', label: 'Upload', icon: Upload },
    { id: 'processing', label: 'Processing', icon: Loader2 },
    { id: 'logs', label: 'Logs', icon: List },
  ];

  return (
    <ProcessingProvider>
      <div className="min-h-screen flex flex-col bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
        {/* Toast notifications */}
        <Toaster position="top-right" />
        
        {/* Application header */}
        <Header />
        
        {/* Tab navigation */}
        <TabNavigation activeTab={activeTab} setActiveTab={setActiveTab} />
        
        {/* Main content area */}
        <main className="flex-grow">
          <div className="container mx-auto max-w-7xl bg-[hsl(var(--background))] p-8 border border-[hsl(var(--border))]">
            {renderTabContent()}
          </div>
        </main>
        
        {/* Application footer */}
        <Footer />
      </div>
    </ProcessingProvider>
  );
}

export default App;