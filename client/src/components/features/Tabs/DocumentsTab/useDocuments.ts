import { useState, useCallback } from 'react';
import { getDocuments } from '../../../../services/api/index';
import type { DocumentType } from './types';

type SortField = 'filename' | 'topic' | 'lastModified' | 'size';
type SortDirection = 'asc' | 'desc';

export function useDocuments() {
  const [documents, setDocuments] = useState<DocumentType[]>([]);
  const [totalDocuments, setTotalDocuments] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [sortField, setSortField] = useState<SortField>('lastModified');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const rowsPerPage = 10;

  const fetchDocuments = useCallback(async (selectedTopic?: string) => {
    setIsLoading(true);
    try {
      const response = await getDocuments({
        topic: selectedTopic || undefined,
        page: currentPage,
        limit: rowsPerPage,
        search: searchQuery,
        sortField,
        sortDirection
      });
      setDocuments(response.documents.map(doc => ({
        ...doc,
        id: doc.topic + ':' + doc.filename
      })));
      setTotalDocuments(response.total);
    } catch (error) {
      // error handling should be done in the component
      setDocuments([]);
      setTotalDocuments(0);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, searchQuery, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const removeDocument = (filename: string) => {
    setDocuments(prev => prev.filter(doc => doc.filename !== filename));
  };

  return {
    documents,
    totalDocuments,
    isLoading,
    sortField,
    sortDirection,
    currentPage,
    rowsPerPage,
    searchQuery,
    setSearchQuery,
    setCurrentPage,
    setSortField,
    setSortDirection,
    fetchDocuments,
    handleSort,
    handlePageChange,
    removeDocument,
  };
} 