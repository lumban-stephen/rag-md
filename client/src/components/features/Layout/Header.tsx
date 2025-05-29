import React from 'react';
import { Database } from 'lucide-react';

const Header: React.FC = () => {
  return (
    <header className="bg-gradient-to-r from-blue-900 to-blue-800 text-white px-6 py-4 shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Database className="h-8 w-8" />
          <div>
            <h1 className="text-2xl font-bold">RAG Management Dashboard</h1>
            <p className="text-sm text-blue-200">Manage your Retrieval-Augmented Generation pipeline</p>
          </div>
        </div>
        <div className="hidden md:block">
          <span className="text-sm text-blue-200">
            Connected to AWS Services
          </span>
        </div>
      </div>
    </header>
  );
};

export default Header;