import React, { useEffect, useContext, useReducer } from 'react';
import { RefreshCw, AlertCircle, Loader2 } from 'lucide-react';
import { Card, CardHeader, CardContent } from '../ui/Card.js';
import ConfirmationModal from '../ui/ConfirmationModal.js';
import { deleteDocument, getFileContent, updateFileContent, getProcessingLogs, deleteTopic } from '../../../services/api/index.js';
import toast from 'react-hot-toast';
import { LoadingContext } from '../../../App';
import ProcessingNotification from './DocumentsTab/ProcessingNotification.js';
import EditModal from './DocumentsTab/EditModal';
import type { DocumentType, ProcessingNotification as ProcessingNotificationType, ProcessingLog } from './DocumentsTab/types.js';
import Pagination from './DocumentsTab/Pagination';
import DeleteTopicModal from './DocumentsTab/DeleteTopicModal';
import DocumentsTable from './DocumentsTab/DocumentsTable';
import DocumentsToolbar from './DocumentsTab/DocumentsToolbar';
import { useDocuments } from './DocumentsTab/useDocuments';
import { useTopics } from './DocumentsTab/useTopics';

// Add types for UI state and actions
interface UIState {
  showDeleteModal: boolean;
  documentToDelete: { topic: string; filename: string } | null;
  showEditModal: boolean;
  editingFile: DocumentType | null;
  showLogsModal: boolean;
  selectedDocument: { topic: string; filename: string } | null;
  processingLogs: ProcessingLog[];
  isLoadingLogs: boolean;
  showDeleteTopicModal: boolean;
  topicToDelete: string | null;
  isDeletingTopic: boolean;
  processingNotifications: ProcessingNotificationType[];
}

type UIAction =
  | { type: 'SHOW_DELETE_MODAL'; payload: { topic: string; filename: string } }
  | { type: 'HIDE_DELETE_MODAL' }
  | { type: 'SHOW_EDIT_MODAL'; payload: DocumentType }
  | { type: 'HIDE_EDIT_MODAL' }
  | { type: 'SHOW_LOGS_MODAL'; payload: { topic: string; filename: string } }
  | { type: 'HIDE_LOGS_MODAL' }
  | { type: 'SET_PROCESSING_LOGS'; payload: ProcessingLog[] }
  | { type: 'SET_LOADING_LOGS'; payload: boolean }
  | { type: 'SHOW_DELETE_TOPIC_MODAL'; payload: string }
  | { type: 'HIDE_DELETE_TOPIC_MODAL' }
  | { type: 'SET_DELETING_TOPIC'; payload: boolean }
  | { type: 'SET_PROCESSING_NOTIFICATIONS'; payload: ProcessingNotificationType[] };

const initialUIState: UIState = {
  showDeleteModal: false,
  documentToDelete: null,
  showEditModal: false,
  editingFile: null,
  showLogsModal: false,
  selectedDocument: null,
  processingLogs: [],
  isLoadingLogs: false,
  showDeleteTopicModal: false,
  topicToDelete: null,
  isDeletingTopic: false,
  processingNotifications: [],
};

function uiReducer(state: UIState, action: UIAction): UIState {
  switch (action.type) {
    case 'SHOW_DELETE_MODAL':
      return { ...state, showDeleteModal: true, documentToDelete: action.payload };
    case 'HIDE_DELETE_MODAL':
      return { ...state, showDeleteModal: false, documentToDelete: null };
    case 'SHOW_EDIT_MODAL':
      return { ...state, showEditModal: true, editingFile: action.payload };
    case 'HIDE_EDIT_MODAL':
      return { ...state, showEditModal: false, editingFile: null };
    case 'SHOW_LOGS_MODAL':
      return { ...state, showLogsModal: true, selectedDocument: action.payload, isLoadingLogs: true };
    case 'HIDE_LOGS_MODAL':
      return { ...state, showLogsModal: false, selectedDocument: null, processingLogs: [], isLoadingLogs: false };
    case 'SET_PROCESSING_LOGS':
      return { ...state, processingLogs: action.payload, isLoadingLogs: false };
    case 'SET_LOADING_LOGS':
      return { ...state, isLoadingLogs: action.payload };
    case 'SHOW_DELETE_TOPIC_MODAL':
      return { ...state, showDeleteTopicModal: true, topicToDelete: action.payload };
    case 'HIDE_DELETE_TOPIC_MODAL':
      return { ...state, showDeleteTopicModal: false, topicToDelete: null };
    case 'SET_DELETING_TOPIC':
      return { ...state, isDeletingTopic: action.payload };
    case 'SET_PROCESSING_NOTIFICATIONS':
      return { ...state, processingNotifications: action.payload };
    default:
      return state;
  }
}

/**
 * Main DocumentsTab component
 * Manages the document list, filtering, sorting, and operations
 */
const DocumentsTab: React.FC = () => {
  // Data hooks
  const { setIsLoading: setGlobalLoading } = useContext(LoadingContext);
  const {
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
  } = useDocuments();
  const {
    topics,
    selectedTopic,
    setSelectedTopic,
    fetchTopics,
  } = useTopics();

  const [uiState, dispatchUI] = useReducer(uiReducer, initialUIState);

  /**
   * Fetches documents from the API
   * Updates the document list
   */
  useEffect(() => {
    fetchTopics();
  }, [fetchTopics]);

  useEffect(() => {
    fetchDocuments(selectedTopic);
  }, [selectedTopic, currentPage, searchQuery, sortField, sortDirection, fetchDocuments]);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedTopic, searchQuery, sortField, sortDirection, setCurrentPage]);

  /**
   * Handles document deletion
   * Shows confirmation modal and deletes document
   */
  const handleDelete = async (topic: string, filename: string) => {
    dispatchUI({ type: 'SHOW_DELETE_MODAL', payload: { topic, filename } });
  };

  /**
   * Executes the actual document deletion
   * Handles both single and bulk deletions
   */
  const executeDelete = async () => {
    if (!uiState.documentToDelete) return;
    dispatchUI({ type: 'SET_DELETING_TOPIC', payload: true });
    try {
      setGlobalLoading(true);
      await deleteDocument(uiState.documentToDelete.topic, uiState.documentToDelete.filename);
      removeDocument(uiState.documentToDelete.filename);
      toast.success(`"${uiState.documentToDelete.filename}" has been deleted`, {
        duration: 4000,
        icon: '🗑️',
        style: {
          background: '#10B981',
          color: '#fff',
          padding: '16px',
          borderRadius: '8px',
        },
      });
      dispatchUI({ type: 'HIDE_DELETE_MODAL' });
    } catch (error) {
      console.error('Error in handleDelete:', error);
      toast.error(`Failed to delete "${uiState.documentToDelete.filename}"`, {
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
      setGlobalLoading(false);
      dispatchUI({ type: 'SET_DELETING_TOPIC', payload: false });
    }
  };

  /**
   * Handles document viewing
   * Opens document in view-only mode
   */
  const handleViewClick = async (topic: string, filename: string) => {
    try {
      setGlobalLoading(true);
      const content = await getFileContent(topic, filename);
      const doc = documents.find(d => d.topic === topic && d.filename === filename);
      if (doc) {
        dispatchUI({ type: 'SHOW_EDIT_MODAL', payload: {
          id: `${doc.topic}-${doc.filename}`,
          filename: doc.filename,
          topic: doc.topic,
          lastModified: doc.lastModified,
          size: doc.size,
          content,
          ingestionStatus: doc.ingestionStatus
        } });
      } else {
        toast.error('Document not found');
        dispatchUI({ type: 'HIDE_EDIT_MODAL' });
      }
    } catch (error) {
      console.error('Error getting file content:', error);
      toast.error(`Failed to open "${filename}" for viewing`);
    } finally {
      setGlobalLoading(false);
    }
  };

  /**
   * Initiates document editing
   * Fetches content and opens edit modal
   */
  const handleEditClick = async (topic: string, filename: string) => {
    try {
      setGlobalLoading(true);
      const content = await getFileContent(topic, filename);
      if (!content || content.trim() === '') {
        toast.error('Unable to load document content. The file may be corrupted or in an unsupported format.');
        return;
      }
      const contentSizeInKB = content.length / 1024;
      if (contentSizeInKB > 50) {
        toast.error(`File size (${contentSizeInKB.toFixed(2)}KB) exceeds the 50KB limit. Please reupload the file instead.`);
        return;
      }
      const binaryChars = content.match(/[\x00-\x06\x0B\x0C\x0E-\x1F]/g);
      if (/[\x00-\x06\x0B\x0C\x0E-\x1F]/.test(content)) {
        console.error('Binary content detected in file:', {
          filename,
          topic,
          contentLength: content.length,
          binaryChars: binaryChars?.map(c => `0x${c.charCodeAt(0).toString(16)}`)
        });
        toast.error('This file contains binary content and cannot be edited. Please reupload the file instead.');
        return;
      }
      const doc = documents.find(d => d.topic === topic && d.filename === filename);
      if (doc) {
        dispatchUI({ type: 'SHOW_EDIT_MODAL', payload: {
          id: `${doc.topic}-${doc.filename}`,
          filename: doc.filename,
          topic: doc.topic,
          lastModified: doc.lastModified,
          size: doc.size,
          content,
          ingestionStatus: doc.ingestionStatus
        } });
      } else {
        toast.error('Document not found');
        dispatchUI({ type: 'HIDE_EDIT_MODAL' });
      }
    } catch (error) {
      console.error('Error getting file content:', error);
      toast.error(`Failed to open "${filename}". The file may be too large or in an unsupported format.`);
    } finally {
      setGlobalLoading(false);
    }
  };

  /**
   * Saves edited document content
   * Updates content and shows success notification
   */
  const handleSaveContent = async (content: string) => {
    if (!uiState.editingFile) return;

    setGlobalLoading(true); // Show global loader
    try {
      await updateFileContent(uiState.editingFile.topic, uiState.editingFile.filename, content);
      toast.success('Document updated successfully');
      dispatchUI({ type: 'HIDE_EDIT_MODAL' });
      fetchDocuments(selectedTopic);

      // Show logs modal after successful update
      dispatchUI({ type: 'SHOW_LOGS_MODAL', payload: { topic: uiState.editingFile.topic, filename: uiState.editingFile.filename } });

      try {
        const { logs } = await getProcessingLogs(uiState.editingFile.topic, uiState.editingFile.filename);
        dispatchUI({ type: 'SET_PROCESSING_LOGS', payload: logs });
      } catch (error) {
        console.error('Error fetching logs:', error);
        toast.error('Failed to fetch processing logs');
      }
    } catch (error) {
      console.error('Error updating document:', error);
      toast.error('Failed to update document');
    } finally {
      setGlobalLoading(false); // Hide global loader
    }
  };

  const totalPages = Math.ceil(totalDocuments / rowsPerPage);

  /**
   * Removes a processing notification
   * @param filename - Name of the file to remove notification for
   */
  const removeNotification = (filename: string) => {
    dispatchUI({ type: 'SET_PROCESSING_NOTIFICATIONS', payload: uiState.processingNotifications.filter((n: ProcessingNotificationType) => n.filename !== filename) });
  };

  /**
   * Handles topic deletion
   */
  const handleDeleteTopic = async (topic: string) => {
    dispatchUI({ type: 'SHOW_DELETE_TOPIC_MODAL', payload: topic });
  };

  /**
   * Executes the topic deletion
   */
  const executeDeleteTopic = async () => {
    if (!uiState.topicToDelete) return;

    dispatchUI({ type: 'SET_DELETING_TOPIC', payload: true });
    try {
      await deleteTopic(uiState.topicToDelete);
      toast.success(`Topic "${uiState.topicToDelete}" has been deleted`, {
        duration: 4000,
        icon: '🗑️',
        style: {
          background: '#10B981',
          color: '#fff',
          padding: '16px',
          borderRadius: '8px',
        },
      });
      // Reset topic selection and refresh topics list
      setSelectedTopic('');
      fetchTopics();
      fetchDocuments(selectedTopic);
    } catch (error) {
      console.error('Error deleting topic:', error);
      toast.error(`Failed to delete topic "${uiState.topicToDelete}"`, {
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
      dispatchUI({ type: 'HIDE_DELETE_TOPIC_MODAL' });
      dispatchUI({ type: 'SET_DELETING_TOPIC', payload: false });
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-xl font-semibold dark:text-gray-100">Documents</h3>
          <DocumentsToolbar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedTopic={selectedTopic}
            onTopicChange={setSelectedTopic}
            topics={topics}
            onDeleteTopic={() => handleDeleteTopic(selectedTopic!)}
            isDeletingTopic={uiState.isDeletingTopic}
            showDeleteButton={!!selectedTopic}
          />
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <RefreshCw className="h-8 w-8 text-blue-500 animate-spin" />
            </div>
          ) : documents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500 dark:text-gray-400">
              <AlertCircle className="h-12 w-12 mb-4" />
              <p className="text-lg">No documents found</p>
              <p className="text-sm mt-2">
                {selectedTopic 
                  ? `No documents found in the "${selectedTopic}" topic.` 
                  : 'Upload a document to get started.'}
              </p>
            </div>
          ) : (
            <DocumentsTable
              documents={documents}
              isLoading={isLoading}
              onDelete={(id) => {
                const [topic, filename] = id.split(':');
                handleDelete(topic, filename);
              }}
              onEdit={(doc) => handleEditClick(doc.topic, doc.filename)}
              onView={(id) => {
                const [topic, filename] = id.split(':');
                handleViewClick(topic, filename);
              }}
              sortField={sortField}
              sortDirection={sortDirection}
              onSort={(field: string) => handleSort(field as any)}
            />
          )}

          {/* Pagination Controls */}
          {totalDocuments > 0 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              totalDocuments={totalDocuments}
              rowsPerPage={rowsPerPage}
            />
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      <ConfirmationModal
        isOpen={uiState.showDeleteModal}
        onClose={() => {
          dispatchUI({ type: 'HIDE_DELETE_MODAL' });
        }}
        onConfirm={executeDelete}
        title="Delete Document"
        message={
          `Are you sure you want to delete "${uiState.documentToDelete?.filename}"? This action cannot be undone.`
        }
        confirmText="confirm"
        confirmButtonText="Delete Document"
      />

      {uiState.showEditModal && uiState.editingFile && (
        <EditModal
          document={uiState.editingFile}
          onClose={() => {
            dispatchUI({ type: 'HIDE_EDIT_MODAL' });
          }}
          onSubmit={async (updatedDoc) => {
            await handleSaveContent(updatedDoc.content || '');
          }}
        />
      )}

      {/* Processing Notifications */}
      {uiState.processingNotifications.map((notification: ProcessingNotificationType) => (
        <ProcessingNotification
          key={`${notification.topic}/${notification.filename}`}
          notification={notification}
          onClose={() => removeNotification(notification.filename)}
        />
      ))}

      {/* Logs Modal */}
      {uiState.showLogsModal && uiState.selectedDocument && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-3/4 max-h-[80vh] flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold dark:text-gray-100">
                Processing Logs: {uiState.selectedDocument.filename}
              </h3>
              <button
                onClick={() => dispatchUI({ type: 'HIDE_LOGS_MODAL' })}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="flex-grow overflow-auto bg-gray-100 dark:bg-gray-700 rounded p-4 font-mono text-sm">
              {uiState.isLoadingLogs ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                </div>
              ) : uiState.processingLogs.length > 0 ? (
                <div className="space-y-2">
                  {uiState.processingLogs.map((log: ProcessingLog, index: number) => (
                    <div key={index} className="flex gap-4">
                      <span className="text-gray-500 dark:text-gray-400 whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString()}
                      </span>
                      <span className="text-gray-800 dark:text-gray-200">{log.message}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-gray-500 dark:text-gray-400 text-center">
                  No logs available for this document
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Topic Confirmation Modal */}
      <DeleteTopicModal
        isOpen={uiState.showDeleteTopicModal}
        onClose={() => {
          dispatchUI({ type: 'HIDE_DELETE_TOPIC_MODAL' });
        }}
        onConfirm={executeDeleteTopic}
        topic={uiState.topicToDelete}
      />
    </>
  );
};

export default DocumentsTab;