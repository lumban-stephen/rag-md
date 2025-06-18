import React from 'react';
import { Upload, FileText, Search, Activity as ActivityLog, Box } from 'lucide-react';

interface TabProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const TabNavigation: React.FC<TabProps> = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: 'search', label: 'Search', icon: <Search className="h-5 w-5" /> },
    { id: 'documents', label: 'Documents', icon: <FileText className="h-5 w-5" /> },
    { id: 'upload', label: 'Upload', icon: <Upload className="h-5 w-5" /> },
    { id: 'logs', label: 'Logs', icon: <ActivityLog className="h-5 w-5" /> }
  ];

  return (
    <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div className="container mx-auto">
        <nav className="flex overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors duration-200 ease-in-out
                ${activeTab === tab.id
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              aria-current={activeTab === tab.id ? 'page' : undefined}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
};

export default TabNavigation;