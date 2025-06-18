/**
 * Main Application Component
 * Handles the overall layout and tab-based navigation of the application
 */
import React, { useState, createContext, useContext } from 'react';
import { Toaster } from 'react-hot-toast';
import Header from './components/features/Layout/Header.js';
import Footer from './components/features/Layout/Footer.js';
import TabNavigation from './components/features/Layout/TabNavigation.js';
import UploadTab from './components/features/Tabs/UploadTab.js';
import DocumentsTab from './components/features/Tabs/DocumentsTab.js';
import SearchTab from './components/features/Tabs/SearchTab.js';
import LogsTab from './components/features/Tabs/LogsTab.js';
import { Search, FileText, Upload, List, Loader2 } from 'lucide-react';
import { ThemeProvider } from './contexts/ThemeContext';

// Create loading context
export const LoadingContext = createContext<{
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}>({
  isLoading: false,
  setIsLoading: () => {},
});

function App() {
  // State to track the currently active tab
  const [activeTab, setActiveTab] = useState('search');
  const [isLoading, setIsLoading] = useState(false);

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
    <ThemeProvider>
      <LoadingContext.Provider value={{ isLoading, setIsLoading }}>
        <div className="min-h-screen flex flex-col bg-[hsl(var(--background))] text-[hsl(var(--foreground))] dark:bg-gray-900 dark:text-gray-100">
          {/* Toast notifications */}
          <Toaster position="top-right" />
          
          {/* Global loading spinner */}
          {isLoading && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg flex flex-col items-center gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                <p className="text-gray-700 dark:text-gray-300">Loading...</p>
              </div>
            </div>
          )}
          
          {/* Application header */}
          <Header />
          
          {/* Tab navigation */}
          <TabNavigation activeTab={activeTab} setActiveTab={setActiveTab} />
          
          {/* Main content area */}
          <main className="flex-grow w-full flex justify-center mt-8">
            <div className="w-full min-w-[80%] max-w-[80%]">
              {renderTabContent()}
            </div>
          </main>
          
          {/* Application footer */}
          <Footer />
        </div>
      </LoadingContext.Provider>
    </ThemeProvider>
  );
}

export default App;