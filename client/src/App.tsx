/**
 * Main Application Component
 * Handles the overall layout and tab-based navigation of the application
 */
import React, { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import Header from './components/features/Layout/Header.js';
import Footer from './components/features/Layout/Footer.js';
import TabNavigation from './components/features/Layout/TabNavigation.js';
import UploadTab from './components/features/Tabs/UploadTab.js';
import DocumentsTab from './components/features/Tabs/DocumentsTab.js';
import SearchTab from './components/features/Tabs/SearchTab.js';
import LogsTab from './components/features/Tabs/LogsTab.js';
import { Search, FileText, Upload, List } from 'lucide-react';

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
    { id: 'logs', label: 'Logs', icon: List }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
      {/* Toast notifications */}
      <Toaster position="top-right" />
      
      {/* Application header */}
      <Header />
      
      {/* Tab navigation */}
      <TabNavigation activeTab={activeTab} setActiveTab={setActiveTab} />
      
      {/* Main content area */}
      <main className="flex-grow w-full flex justify-center">
        <div className="w-full min-w-[80%] max-w-[80%]">
          {renderTabContent()}
        </div>
      </main>
      
      {/* Application footer */}
      <Footer />
    </div>
  );
}

export default App;