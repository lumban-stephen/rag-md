import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 py-4 px-6">
      <div className="container mx-auto flex flex-col sm:flex-row justify-center items-center text-sm text-gray-500 dark:text-gray-400">
        <div>
          <p>© {new Date().getFullYear()} RAG Management Dashboard</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;