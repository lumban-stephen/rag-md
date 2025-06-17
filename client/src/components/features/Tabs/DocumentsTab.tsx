import React, { useState, useEffect } from 'react';
import { Trash2, RefreshCw, AlertCircle, ArrowUpDown, Download, Edit2, Loader2, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card.js';
import Button from '../ui/Button.js';
import Select from '../ui/Select.js';
import Badge from '../ui/Badge.js';
import ConfirmationModal from '../ui/ConfirmationModal.js';
import { getDocuments, deleteDocument, deleteDocuments, getDownloadUrl, getFileContent, updateFileContent, checkIngestionStatus, getAllTopics, getProcessingLogs, getDocumentChunks } from '../../../services/api/index.js';
import toast from 'react-hot-toast';
import Input from '../ui/Input.js';

/**
 * Represents a document in the system
 * @property filename - Name of the file
 * @property topic - Category/topic of the document
 * @property lastModified - Last modification timestamp
 * @property size - File size in bytes
 * @property content - Optional file content for editing
 * @property ingestionStatus - Optional processing status information
 */
interface Document {
  filename: string;
  topic: string;
  lastModified: string;
  size: number;
  content?: string;
  ingestionStatus?: {
    status: 'pending' | 'processing' | 'complete' | 'error';
    message: string;
    timestamp?: string;
  };
}

type SortField = 'filename' | 'topic' | 'lastModified' | 'size';
type SortDirection = 'asc' | 'desc';

/**
 * Props for the EditModal component
 * @property isOpen - Whether the modal is visible
 * @property onClose - Function to close the modal
 * @property onSave - Function to save changes
 * @property initialContent - Initial content to display
 * @property filename - Name of the file being edited
 * @property isViewOnly - Whether the modal is in view-only mode
 */
interface EditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (content: string) => Promise<void>;
  initialContent: string;
  filename: string;
  isViewOnly?: boolean;
}

/**
 * Represents a processing notification
 * @property topic - Document topic
 * @property filename - Name of the file
 * @property status - Current processing status
 * @property message - Status message
 * @property timestamp - When the status was last updated
 */
interface ProcessingNotification {
  topic: string;
  filename: string;
  status: 'pending' | 'processing' | 'complete' | 'error';
  message: string;
  timestamp?: string;
}

/**
 * Modal component for editing or viewing document content
 * Includes confirmation for saving changes and view-only mode
 */
const EditModal: React.FC<EditModalProps> = ({ isOpen, onClose, onSave, initialContent, filename, isViewOnly = false }) => {
  const [content, setContent] = useState(initialContent);
  const [isSaving, setIsSaving] = useState(false);
  const [showConfirmSave, setShowConfirmSave] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setContent(initialContent);
    setHasChanges(false);
    setShowConfirmSave(false);
  }, [initialContent]);

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (isViewOnly) return;
    setContent(e.target.value);
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (isViewOnly) {
      onClose();
      return;
    }

    if (!hasChanges) {
      onClose();
      return;
    }

    if (!showConfirmSave) {
      setShowConfirmSave(true);
      return;
    }

    setIsSaving(true);
    try {
      // Start the save process but don't wait for it
      onSave(content).catch(error => {
        console.error('Error saving file:', error);
        toast.error('Failed to save changes');
      });
      // Close immediately
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (showConfirmSave) {
      setShowConfirmSave(false);
    } else {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-[80vw] h-[80vh] flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">{isViewOnly ? 'View' : 'Edit'} {filename}</h2>
          <Button variant="ghost" onClick={handleCancel}>×</Button>
        </div>
        <div className="flex-grow overflow-auto mb-4">
          <textarea
            value={content}
            onChange={handleContentChange}
            className={`w-full h-full min-h-[400px] p-4 border rounded-lg font-mono text-sm ${isViewOnly ? 'bg-gray-50 cursor-default' : ''}`}
            spellCheck="false"
            readOnly={isViewOnly}
          />
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={handleCancel}>
            {isViewOnly ? 'Close' : (showConfirmSave ? 'Back to Editing' : 'Cancel')}
          </Button>
          {!isViewOnly && (
            <Button
              variant={showConfirmSave ? "primary" : "primary"}
              onClick={handleSave}
              isLoading={isSaving}
            >
              {showConfirmSave ? 'Confirm Save' : 'Save Changes'}
            </Button>
          )}
        </div>
        {!isViewOnly && showConfirmSave && (
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-yellow-800">
              You are about to update the RAG content. This will affect future search results.
              Are you sure you want to proceed?
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Notification component for displaying document processing status
 * Shows progress, completion, or error states with appropriate icons
 */
const ProcessingNotification: React.FC<{
  notification: ProcessingNotification;
  onClose: () => void;
}> = ({ notification, onClose }) => {
  return (
    <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg p-4 border border-gray-200 w-80">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h4 className="font-medium text-gray-900">{notification.filename}</h4>
          <p className="text-sm text-gray-500 mt-1">{notification.message}</p>
          <div className="mt-2 flex items-center gap-2">
            {notification.status === 'processing' && (
              <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
            )}
            {notification.status === 'complete' && (
              <span className="text-green-500">✅</span>
            )}
            {notification.status === 'error' && (
              <span className="text-red-500">❌</span>
            )}
            <span className="text-sm text-gray-500">
              {notification.status === 'processing' ? 'Processing...' : 
               notification.status === 'complete' ? 'Complete' : 
               notification.status === 'error' ? 'Error' : 'Pending'}
            </span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-500"
        >
          ×
        </button>
      </div>
    </div>
  );
};

interface ProcessingLog {
  timestamp: number;
  message: string;
  logStreamName: string;
}

interface DocumentChunk {
  text: string;
  metadata: Record<string, any>;
  score: number;
}

/**
 * Main DocumentsTab component
 * Manages the document list, filtering, sorting, and operations
 */
const DocumentsTab: React.FC = () => {
  // State management for documents and UI
  const [documents, setDocuments] = useState<Document[]>([]);
  const [totalDocuments, setTotalDocuments] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTopic, setSelectedTopic] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [selectedDocuments, setSelectedDocuments] = useState<Set<string>>(new Set());
  const [topics, setTopics] = useState<string[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteType, setDeleteType] = useState<'single' | 'bulk'>('single');
  const [documentToDelete, setDocumentToDelete] = useState<{ topic: string; filename: string } | null>(null);
  const [sortField, setSortField] = useState<SortField>('lastModified');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingFile, setEditingFile] = useState<{ topic: string; filename: string; content: string } | null>(null);
  const [ingestionStatuses, setIngestionStatuses] = useState<Record<string, Document['ingestionStatus']>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;
  const [isViewOnly, setIsViewOnly] = useState(false);
  const [processingNotifications, setProcessingNotifications] = useState<ProcessingNotification[]>([]);
  const [showLogsModal, setShowLogsModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<{ topic: string; filename: string } | null>(null);
  const [processingLogs, setProcessingLogs] = useState<ProcessingLog[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [showChunksModal, setShowChunksModal] = useState(false);
  const [documentChunks, setDocumentChunks] = useState<DocumentChunk[]>([]);
  const [isLoadingChunks, setIsLoadingChunks] = useState(false);

  /**
   * Fetches all available topics
   */
  const fetchTopics = async () => {
    console.log('Starting to fetch topics...');
    try {
      const topicsList = await getAllTopics();
      console.log('Received topics:', topicsList);
      // Filter out empty strings and duplicates before mapping
      const uniqueTopics = Array.from(new Set(topicsList.filter(Boolean)));
      console.log('Unique topics after filtering:', uniqueTopics);
      setTopics(uniqueTopics);
      console.log('Final topics state:', uniqueTopics);
    } catch (error) {
      console.error('Error fetching topics:', error);
      toast.error('Failed to load topics');
    }
  };

  /**
   * Fetches documents from the API
   * Updates the document list
   */
  const fetchDocuments = async () => {
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
      setDocuments(response.documents);
      setTotalDocuments(response.total);
    } catch (error) {
      console.error('Error in fetchDocuments:', error);
      toast.error('Failed to load documents');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch topics when component mounts
  useEffect(() => {
    fetchTopics();
  }, []);

  // Fetch documents when any filter changes
  useEffect(() => {
    fetchDocuments();
  }, [selectedTopic, currentPage, searchQuery, sortField, sortDirection]);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedTopic, searchQuery, sortField, sortDirection]);

  // Log when topics state changes
  useEffect(() => {
    console.log('Topics state updated:', topics);
  }, [topics]);

  /**
   * Initiates the document deletion process
   * Shows confirmation modal for single document deletion
   */
  const handleDelete = async (topic: string, filename: string) => {
    setDeleteType('single');
    setDocumentToDelete({ topic, filename });
    setShowDeleteModal(true);
  };

  /**
   * Initiates bulk document deletion
   * Shows confirmation modal for multiple document deletion
   */
  const handleBulkDelete = () => {
    if (selectedDocuments.size === 0) {
      toast.error('Please select documents to delete');
      return;
    }

    // Only prevent deletion of all documents when in "All Topics" view
    if (selectedTopic === '' && selectedDocuments.size === documents.length) {
      toast.error('Cannot delete all documents at once. Please select a subset of documents.');
      return;
    }

    setDeleteType('bulk');
    setShowDeleteModal(true);
  };

  /**
   * Executes the actual document deletion
   * Handles both single and bulk deletions
   */
  const executeDelete = async () => {
    if (deleteType === 'single' && documentToDelete) {
      setIsDeleting(documentToDelete.filename);
      try {
        await deleteDocument(documentToDelete.topic, documentToDelete.filename);
        setDocuments(documents.filter(doc => doc.filename !== documentToDelete.filename));
        toast.success(`"${documentToDelete.filename}" has been deleted`, {
          duration: 4000,
          icon: '🗑️',
          style: {
            background: '#10B981',
            color: '#fff',
            padding: '16px',
            borderRadius: '8px',
          },
        });
        setShowDeleteModal(false);
        setDocumentToDelete(null);
      } catch (error) {
        console.error('Error in handleDelete:', error);
        toast.error(`Failed to delete "${documentToDelete.filename}"`, {
          duration: 4000,
          icon: '❌',
          style: {
            background: '#EF4444',
            color: '#fff',
            padding: '16px',
            borderRadius: '8px',
          },
        });
      } finally {
        setIsDeleting(null);
      }
    } else if (deleteType === 'bulk') {
      try {
        const documentsToDelete = documents.filter(doc => 
          selectedDocuments.has(`${doc.topic}/${doc.filename}`)
        );

        await deleteDocuments(documentsToDelete);
        setDocuments(documents.filter(doc => 
          !selectedDocuments.has(`${doc.topic}/${doc.filename}`)
        ));
        setSelectedDocuments(new Set());
        
        toast.success(`${documentsToDelete.length} document(s) have been deleted`, {
          duration: 4000,
          icon: '🗑️',
          style: {
            background: '#10B981',
            color: '#fff',
            padding: '16px',
            borderRadius: '8px',
          },
        });
        setShowDeleteModal(false);
      } catch (error) {
        console.error('Error in handleBulkDelete:', error);
        toast.error('Failed to delete selected documents', {
          duration: 4000,
          icon: '❌',
          style: {
            background: '#EF4444',
            color: '#fff',
            padding: '16px',
            borderRadius: '8px',
          },
        });
      }
    }
  };

  /**
   * Toggles selection of a single document
   * Updates the selectedDocuments set
   */
  const toggleDocumentSelection = (topic: string, filename: string) => {
    const key = `${topic}/${filename}`;
    const newSelected = new Set(selectedDocuments);
    if (newSelected.has(key)) {
      newSelected.delete(key);
    } else {
      newSelected.add(key);
    }
    setSelectedDocuments(newSelected);
  };

  /**
   * Toggles selection of all documents
   * Selects or deselects all documents based on current state
   */
  const toggleSelectAll = () => {
    if (selectedDocuments.size === documents.length) {
      setSelectedDocuments(new Set());
    } else {
      setSelectedDocuments(new Set(
        documents.map(doc => `${doc.topic}/${doc.filename}`)
      ));
    }
  };

  /**
   * Formats file size in bytes to human-readable format
   * @param bytes - File size in bytes
   * @returns Formatted size string (e.g., "1.5 MB")
   */
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  /**
   * Formats date string to readable format
   * @param dateString - ISO date string
   * @returns Formatted date string
   */
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Invalid date';
      }
      return format(date, 'MMM d, yyyy h:mm a');
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
  };

  /**
   * Handles sorting of documents
   * Toggles sort direction if same field is clicked
   * @param field - Field to sort by
   */
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  /**
   * Handles document download
   * Generates download URL and triggers download
   */
  const handleDownload = async (topic: string, filename: string) => {
    try {
      const url = await getDownloadUrl(topic, filename);
      
      // Create a temporary link element
      const link = document.createElement('a');
      link.href = url;
      link.download = filename; // This will be the default filename when downloading
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success(`Downloading "${filename}"`, {
        duration: 2000,
        icon: '📥',
      });
    } catch (error) {
      console.error('Error downloading file:', error);
      toast.error(`Failed to download "${filename}"`, {
        duration: 4000,
        icon: '❌',
        style: {
          background: '#EF4444',
          color: '#fff',
          padding: '16px',
          borderRadius: '8px',
        },
      });
    }
  };

  /**
   * Polls the ingestion status of a document
   * Updates status and shows notifications
   */
  const pollIngestionStatus = async (topic: string, filename: string) => {
    try {
      const status = await checkIngestionStatus(topic, filename);
      
      // Update the notification
      setProcessingNotifications(prev => {
        const existing = prev.find(n => n.filename === filename);
        if (existing) {
          return prev.map(n => 
            n.filename === filename 
              ? { ...n, ...status }
              : n
          );
        }
        return [...prev, { topic, filename, ...status }];
      });

      // If still processing, continue polling
      if (status.status === 'processing') {
        setTimeout(() => pollIngestionStatus(topic, filename), 5000);
      } else if (status.status === 'complete') {
        // Refresh the documents list after successful processing
        fetchDocuments();
      }
    } catch (error) {
      console.error('Error polling ingestion status:', error);
      setProcessingNotifications(prev => 
        prev.map(n => 
          n.filename === filename 
            ? { ...n, status: 'error', message: 'Failed to check status' }
            : n
        )
      );
    }
  };

  /**
   * Handles document editing
   * Fetches content and shows edit modal
   */
  const handleEdit = async (topic: string, filename: string, content: string) => {
    try {
      await updateFileContent(topic, filename, content);
      toast.success('Document updated successfully');
      setShowEditModal(false);
      setEditingFile(null);
      fetchDocuments();
    } catch (error) {
      console.error('Error updating document:', error);
      toast.error('Failed to update document');
    }
  };

  /**
   * Initiates document editing
   * Fetches content and opens edit modal
   */
  const handleEditClick = async (topic: string, filename: string) => {
    try {
      setIsLoading(true);
      const content = await getFileContent(topic, filename);
      
      // Check if content is valid
      if (!content || content.trim() === '') {
        toast.error('Unable to load document content. The file may be corrupted or in an unsupported format.');
        return;
      }

      // Check if content contains binary data
      if (/[\x00-\x08\x0E-\x1F]/.test(content)) {
        toast.error('This file appears to be in binary format and cannot be displayed. Please download it instead.');
        return;
      }

      setEditingFile({ topic, filename, content });
      setShowEditModal(true);
    } catch (error) {
      console.error('Error getting file content:', error);
      toast.error(`Failed to open "${filename}". The file may be too large or in an unsupported format.`);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Saves edited document content
   * Updates content and shows success notification
   */
  const handleSaveContent = async (content: string) => {
    if (!editingFile) return;

    try {
      await updateFileContent(editingFile.topic, editingFile.filename, content);
      toast.success('Document updated successfully');
      setShowEditModal(false);
      setEditingFile(null);
      fetchDocuments();

      // Show logs modal after successful update
      setSelectedDocument({ topic: editingFile.topic, filename: editingFile.filename });
      setShowLogsModal(true);
      setIsLoadingLogs(true);

      try {
        const { logs } = await getProcessingLogs(editingFile.topic, editingFile.filename);
        setProcessingLogs(logs);
      } catch (error) {
        console.error('Error fetching logs:', error);
        toast.error('Failed to fetch processing logs');
      } finally {
        setIsLoadingLogs(false);
      }
    } catch (error) {
      console.error('Error updating document:', error);
      toast.error('Failed to update document');
    }
  };

  /**
   * Gets the appropriate icon for ingestion status
   * @param status - Current ingestion status
   * @returns Icon component for the status
   */
  const getIngestionStatusIcon = (status?: Document['ingestionStatus']) => {
    if (!status) return null;
    
    switch (status.status) {
      case 'processing':
        return <span className="text-yellow-500" title={status.message}>⏳</span>;
      case 'complete':
        return <span className="text-green-500" title={status.message}>✅</span>;
      case 'error':
        return <span className="text-red-500" title={status.message}>❌</span>;
      default:
        return null;
    }
  };

  /**
   * Gets paginated documents for current page
   * @returns Array of documents for current page
   */
  const getPaginatedDocuments = () => {
    return documents;
  };

  const totalPages = Math.ceil(totalDocuments / rowsPerPage);

  /**
   * Handles page change in pagination
   * @param page - New page number
   */
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Reset selection when changing pages
    setSelectedDocuments(new Set());
  };

  /**
   * Handles document viewing
   * Opens document in view-only mode and shows chunks
   */
  const handleViewClick = async (topic: string, filename: string) => {
    try {
      // Get document content
      const content = await getFileContent(topic, filename);
      setEditingFile({ topic, filename, content });
      setIsViewOnly(true);
      setShowEditModal(true);

      // Get document chunks
      setIsLoadingChunks(true);
      try {
        const { chunks } = await getDocumentChunks(topic, filename);
        setDocumentChunks(chunks);
        setShowChunksModal(true);
      } catch (error) {
        console.error('Error getting document chunks:', error);
        toast.error('Failed to load document chunks');
      } finally {
        setIsLoadingChunks(false);
      }
    } catch (error) {
      console.error('Error getting file content:', error);
      toast.error(`Failed to open "${filename}" for viewing`);
    }
  };

  /**
   * Removes a processing notification
   * @param filename - Name of the file to remove notification for
   */
  const removeNotification = (filename: string) => {
    setProcessingNotifications(prev => 
      prev.filter(n => n.filename !== filename)
    );
  };

  /**
   * Handles viewing processing logs for a document
   */
  const handleViewLogs = async (topic: string, filename: string) => {
    setSelectedDocument({ topic, filename });
    setShowLogsModal(true);
    setIsLoadingLogs(true);

    try {
      const { logs } = await getProcessingLogs(topic, filename);
      setProcessingLogs(logs);
    } catch (error) {
      console.error('Error fetching logs:', error);
      toast.error('Failed to fetch processing logs');
    } finally {
      setIsLoadingLogs(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-xl font-semibold">Documents</h3>
          <div className="mt-2 sm:mt-0 flex flex-row items-center gap-4">
            <div className="w-48">
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="Search by filename..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <div className="w-48">
              <Select
                value={selectedTopic || ''}
                onChange={setSelectedTopic}
                options={[
                  { value: '', label: 'All Topics' },
                  ...topics.map(topic => ({ value: topic, label: topic }))
                ]}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <RefreshCw className="h-8 w-8 text-blue-500 animate-spin" />
            </div>
          ) : documents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <AlertCircle className="h-12 w-12 mb-4" />
              <p className="text-lg">No documents found</p>
              <p className="text-sm mt-2">
                {selectedTopic 
                  ? `No documents found in the "${selectedTopic}" topic.` 
                  : 'Upload a document to get started.'}
              </p>
            </div>
          ) : (
            <table className="w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="w-12 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <input
                      type="checkbox"
                      checked={selectedDocuments.size === documents.length}
                      onChange={toggleSelectAll}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </th>
                  <th 
                    className="w-1/4 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('filename')}
                  >
                    <div className="flex items-center gap-1">
                      Filename
                      <ArrowUpDown className="h-4 w-4" />
                    </div>
                  </th>
                  <th 
                    className="w-1/6 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('topic')}
                  >
                    <div className="flex items-center gap-1">
                      Topic
                      <ArrowUpDown className="h-4 w-4" />
                    </div>
                  </th>
                  <th 
                    className="w-1/6 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('lastModified')}
                  >
                    <div className="flex items-center gap-1">
                      Last Modified
                      <ArrowUpDown className="h-4 w-4" />
                    </div>
                  </th>
                  <th 
                    className="w-24 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('size')}
                  >
                    <div className="flex items-center gap-1">
                      Size
                      <ArrowUpDown className="h-4 w-4" />
                    </div>
                  </th>
                  <th className="w-32 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Chunks
                  </th>
                  <th className="w-32 px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {getPaginatedDocuments().map((doc, index) => (
                  <tr key={`${doc.topic}-${doc.filename}-${index}`}>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedDocuments.has(`${doc.topic}/${doc.filename}`)}
                        onChange={() => toggleDocumentSelection(doc.topic, doc.filename)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </td>
                    <td className="px-4 py-4 text-sm font-medium text-gray-900">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleViewClick(doc.topic, doc.filename)}
                          className="text-blue-600 hover:text-blue-800 hover:underline focus:outline-none truncate"
                        >
                          {doc.filename}
                        </button>
                        {doc.ingestionStatus?.status === 'processing' && (
                          <span className="text-yellow-500 flex-shrink-0" title="Document is being processed">⏳</span>
                        )}
                        {doc.ingestionStatus?.status === 'complete' && (
                          <span className="text-green-500 flex-shrink-0" title="Document is ready">✅</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-500">
                      <Badge variant="default">{doc.topic}</Badge>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-500">
                      {formatDate(doc.lastModified)}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-500">
                      {formatFileSize(doc.size)}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-500">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewClick(doc.topic, doc.filename)}
                        className="flex items-center gap-1 w-full justify-center"
                      >
                        <FileText className="h-4 w-4" />
                        <span className="hidden sm:inline">View Chunks</span>
                      </Button>
                    </td>
                    <td className="px-4 py-4 text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleEdit(doc.topic, doc.filename, doc.content || '')}
                          icon={<Edit2 className="h-4 w-4" />}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleDelete(doc.topic, doc.filename)}
                          icon={<Trash2 className="h-4 w-4" />}
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* Pagination Controls */}
          {totalDocuments > 0 && (
            <div className="flex items-center justify-between px-4 py-4 border-t border-gray-200">
              <div className="flex items-center">
                <p className="text-sm text-gray-700">
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
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <Button
                    key={page}
                    variant={currentPage === page ? "primary" : "ghost"}
                    onClick={() => handlePageChange(page)}
                  >
                    {page}
                  </Button>
                ))}
                <Button
                  variant="ghost"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setDocumentToDelete(null);
        }}
        onConfirm={executeDelete}
        title={deleteType === 'single' ? 'Delete Document' : 'Delete Documents'}
        message={
          deleteType === 'single'
            ? `Are you sure you want to delete "${documentToDelete?.filename}"? This action cannot be undone.`
            : `Are you sure you want to delete ${selectedDocuments.size} selected document(s)? This action cannot be undone.`
        }
        confirmText="confirm"
        confirmButtonText={deleteType === 'single' ? 'Delete Document' : 'Delete Documents'}
      />

      <EditModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingFile(null);
          setIsViewOnly(false);
        }}
        onSave={handleSaveContent}
        initialContent={editingFile?.content || ''}
        filename={editingFile?.filename || ''}
        isViewOnly={isViewOnly}
      />

      {/* Processing Notifications */}
      {processingNotifications.map(notification => (
        <ProcessingNotification
          key={`${notification.topic}/${notification.filename}`}
          notification={notification}
          onClose={() => removeNotification(notification.filename)}
        />
      ))}

      {/* Logs Modal */}
      {showLogsModal && selectedDocument && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-3/4 max-h-[80vh] flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                Processing Logs: {selectedDocument.filename}
              </h3>
              <button
                onClick={() => setShowLogsModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="flex-grow overflow-auto bg-gray-100 rounded p-4 font-mono text-sm">
              {isLoadingLogs ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                </div>
              ) : processingLogs.length > 0 ? (
                <div className="space-y-2">
                  {processingLogs.map((log, index) => (
                    <div key={index} className="flex gap-4">
                      <span className="text-gray-500 whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString()}
                      </span>
                      <span className="text-gray-800">{log.message}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-gray-500 text-center">
                  No logs available for this document
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Chunks Modal */}
      {showChunksModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-3/4 max-h-[80vh] flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                Document Chunks: {editingFile?.filename}
              </h3>
              <button
                onClick={() => setShowChunksModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="flex-grow overflow-auto bg-gray-100 rounded p-4">
              {isLoadingChunks ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                </div>
              ) : documentChunks.length > 0 ? (
                <div className="space-y-4">
                  {documentChunks.map((chunk, index) => (
                    <div key={index} className="bg-white p-4 rounded shadow">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-500">Chunk {index + 1}</span>
                        <Badge variant="default">Score: {chunk.score.toFixed(2)}</Badge>
                      </div>
                      <p className="text-gray-800 whitespace-pre-wrap">{chunk.text}</p>
                      {Object.keys(chunk.metadata).length > 0 && (
                        <div className="mt-2 text-sm text-gray-500">
                          <strong>Metadata:</strong>
                          <pre className="mt-1 bg-gray-50 p-2 rounded">
                            {JSON.stringify(chunk.metadata, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-gray-500 text-center">
                  No chunks available for this document
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DocumentsTab;