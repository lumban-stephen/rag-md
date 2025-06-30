import React from 'react';
import { Database, Moon, Sun } from 'lucide-react';
import { useTheme } from '../../../contexts/ThemeContext';

const Header: React.FC = () => {
  const { isDarkMode, toggleDarkMode } = useTheme();

  // Assign icon and label based on isDarkMode
  const modeIcon = isDarkMode ? (
    <Sun className="h-5 w-5 text-yellow-300" />
  ) : (
    <Moon className="h-5 w-5 text-blue-200" />
  );
  const modeLabel = isDarkMode ? 'Theme: Dark' : 'Theme: Light';

  return (
    <header className="bg-gradient-to-r from-blue-900 to-blue-800 text-white px-6 py-4 shadow-md dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Database className="h-8 w-8" />
          <div>
            <h1 className="text-2xl font-bold">RAG Management Dashboard</h1>
            <p className="text-sm text-blue-200 dark:text-gray-300">Manage your Retrieval-Augmented Generation pipeline</p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-lg hover:bg-blue-800 dark:hover:bg-gray-700 transition-colors"
            aria-label="Toggle dark mode"
          >
            {modeIcon}
          </button>
          <span className="text-sm text-blue-200 dark:text-gray-300 hidden md:block">
            {modeLabel}
          </span>
        </div>
      </div>
    </header>
  );
};

export default Header;