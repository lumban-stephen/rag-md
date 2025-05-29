import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-50 border-t border-gray-200 py-4 px-6">
      <div className="container mx-auto flex flex-col sm:flex-row justify-between items-center text-sm text-gray-500">
        <div>
          <p>© {new Date().getFullYear()} RAG Management Dashboard</p>
        </div>
        <div className="mt-2 sm:mt-0">
          <p>Powered by AWS Services</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;