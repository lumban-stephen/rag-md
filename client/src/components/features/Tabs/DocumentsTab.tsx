/**
 * DocumentsTab Component
 * Provides a comprehensive interface for managing documents including:
 * - Viewing, editing, and deleting documents
 * - Filtering by topic and searching
 * - Sorting and pagination
 * - Bulk operations
 * - Processing status tracking
 */
import React, { useState, useEffect } from 'react';
import { Trash2, RefreshCw, AlertCircle, ArrowUpDown, Download, Edit2, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card.js';
import Button from '../ui/Button.js';
import Select from '../ui/Select.js';
import Badge from '../ui/Badge.js';
import ConfirmationModal from '../ui/ConfirmationModal.js';
import { getDocuments, deleteDocument, deleteDocuments, getDownloadUrl, getFileContent, updateFileContent, checkIngestionStatus } from '../../../services/api/index.js';
import toast from 'react-hot-toast';
import Input from '../ui/Input.js';
import { useProcessing } from '../../../contexts/ProcessingContext.js';

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
              variant={showConfirmSave ? "danger" : "primary"}
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
  const [topics, setTopics] = useState<{ value: string; label: string }[]>([]);
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
  const { addJob } = useProcessing();

  /**
   * Fetches documents from the API
   * Updates the document list and available topics
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
      
      // Update topics if we got them from the response
      if (response.topics) {
        // Filter out empty strings and duplicates before mapping
        const uniqueTopics = Array.from(new Set(response.topics.filter(Boolean)));
        setTopics(uniqueTopics.map(topic => ({
          value: topic,
          label: topic
        })));
      }
    } catch (error) {
      console.error('Error in fetchDocuments:', error);
      toast.error('Failed to load documents');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch documents when any filter changes
  useEffect(() => {
    fetchDocuments();
  }, [selectedTopic, currentPage, searchQuery, sortField, sortDirection]);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedTopic, searchQuery, sortField, sortDirection]);

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
      // Add the job to processing context
      addJob({
        topic,
        filename,
        status: 'processing',
        message: 'Updating document...',
        timestamp: new Date().toISOString()
      });
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
      const content = await getFileContent(topic, filename);
      setEditingFile({ topic, filename, content });
      setShowEditModal(true);
    } catch (error) {
      console.error('Error getting file content:', error);
      toast.error(`Failed to open "${filename}" for editing`);
    }
  };

  /**
   * Saves edited document content
   * Updates content and shows success notification
   */
  const handleSaveContent = async (content: string) => {
    if (!editingFile) return;

    try {
      // Add job to processing context
      addJob({
        topic: editingFile.topic,
        filename: editingFile.filename,
        status: 'processing',
        message: 'Updating document...',
        timestamp: new Date().toISOString()
      });

      await updateFileContent(editingFile.topic, editingFile.filename, content);
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
   * Opens document in view-only mode
   */
  const handleViewClick = async (topic: string, filename: string) => {
    try {
      // Add the job to processing context
      addJob({
        topic,
        filename,
        status: 'processing',
        message: 'Checking file status...',
        timestamp: new Date().toISOString()
      });

      const content = await getFileContent(topic, filename);
      setEditingFile({ topic, filename, content });
      setIsViewOnly(true);
      setShowEditModal(true);
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

  return (
    <div className="p-6">
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>Documents</CardTitle>
          <div className="mt-2 sm:mt-0 flex flex-row items-center gap-4">
            <div className="w-48">
              <Input
                type="text"
                placeholder="Search by filename..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1); // Reset to first page when searching
                }}
                className="w-full"
              />
            </div>
            <div className="w-48">
              <Select
                options={topics}
                value={selectedTopic}
                onChange={(e) => setSelectedTopic(e.target.value)}
                fullWidth
              />
            </div>
            {selectedDocuments.size > 0 && (
              <Button
                variant="danger"
                onClick={handleBulkDelete}
                icon={<Trash2 className="h-4 w-4" />}
              >
                Delete Selected ({selectedDocuments.size})
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
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
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <input
                        type="checkbox"
                        checked={selectedDocuments.size === documents.length}
                        onChange={toggleSelectAll}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('filename')}
                    >
                      <div className="flex items-center gap-1">
                        Filename
                        <ArrowUpDown className="h-4 w-4" />
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('topic')}
                    >
                      <div className="flex items-center gap-1">
                        Topic
                        <ArrowUpDown className="h-4 w-4" />
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('lastModified')}
                    >
                      <div className="flex items-center gap-1">
                        Last Modified
                        <ArrowUpDown className="h-4 w-4" />
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('size')}
                    >
                      <div className="flex items-center gap-1">
                        Size
                        <ArrowUpDown className="h-4 w-4" />
                      </div>
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {getPaginatedDocuments().map((doc, index) => (
                    <tr key={`${doc.topic}-${doc.filename}-${index}`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedDocuments.has(`${doc.topic}/${doc.filename}`)}
                          onChange={() => toggleDocumentSelection(doc.topic, doc.filename)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleViewClick(doc.topic, doc.filename)}
                            className="text-blue-600 hover:text-blue-800 hover:underline focus:outline-none"
                          >
                            {doc.filename}
                          </button>
                          {doc.ingestionStatus?.status === 'processing' && (
                            <span className="text-yellow-500" title="Document is being processed">⏳</span>
                          )}
                          {doc.ingestionStatus?.status === 'complete' && (
                            <span className="text-green-500" title="Document is ready">✅</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <Badge variant="default">{doc.topic}</Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(doc.lastModified)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatFileSize(doc.size)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleEditClick(doc.topic, doc.filename)}
                            icon={<Edit2 className="h-4 w-4" />}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleDelete(doc.topic, doc.filename)}
                            isLoading={isDeleting === doc.filename}
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
              
              {/* Pagination Controls */}
              {totalDocuments > 0 && (
                <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
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
            </div>
          )}
        </CardContent>
      </Card>

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

      {/* Add processing notifications */}
      {processingNotifications.map(notification => (
        <ProcessingNotification
          key={`${notification.topic}/${notification.filename}`}
          notification={notification}
          onClose={() => removeNotification(notification.filename)}
        />
      ))}
    </div>
  );
};

export default DocumentsTab;