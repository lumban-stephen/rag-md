import React from 'react';
import Button from '../../ui/Button.js';
import { PaginationProps } from './types';

interface ExtendedPaginationProps extends PaginationProps {
  totalDocuments: number;
  rowsPerPage: number;
}

const Pagination: React.FC<ExtendedPaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  totalDocuments,
  rowsPerPage,
}) => {
  if (totalDocuments === 0) return null;

  return (
    <div className="flex items-center justify-between px-4 py-4 border-t border-gray-200 dark:border-gray-700">
      <div className="flex items-center">
        <p className="text-sm text-gray-700 dark:text-gray-300">
          Showing{' '}
          <span className="font-medium">
            {totalDocuments === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1}
          </span>
          {' '}-{' '}
          <span className="font-medium">
            {Math.min(currentPage * rowsPerPage, totalDocuments)}
          </span>
          {' '}of{' '}
          <span className="font-medium">{totalDocuments}</span>
          {' '}documents
        </p>
      </div>
      <div className="flex items-center space-x-2">
        <Button
          variant="ghost"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          Previous
        </Button>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
          <Button
            key={page}
            variant={currentPage === page ? 'ghost' : 'ghost'}
            onClick={() => onPageChange(page)}
          >
            {page}
          </Button>
        ))}
        <Button
          variant="ghost"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          Next
        </Button>
      </div>
    </div>
  );
};

export default Pagination; 