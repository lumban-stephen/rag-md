/**
 * Type definitions for document-related operations
 * These types are used across the document management services
 */

/**
 * Represents the status of a document's ingestion process
 * @property isPending - Whether the document is still in the uploads directory
 * @property isProcessed - Whether the document has been processed and moved to the processed directory
 * @property error - Any error message if the ingestion failed
 */
export interface IngestionStatus {
  isPending: boolean;
  isProcessed: boolean;
  error?: string;
}

/**
 * Represents a document in the system
 * @property key - The S3 key of the document
 * @property filename - The name of the file
 * @property topic - The topic/category the document belongs to
 * @property lastModified - When the document was last modified
 * @property size - Size of the document in bytes
 * @property status - Current status of the document (processing or complete)
 */
export interface Document {
  key: string;
  filename: string;
  topic: string;
  lastModified: Date;
  size: number;
  status: 'processing' | 'complete';
}

/**
 * Represents the result of a document listing operation
 * @property documents - Array of documents found
 * @property topics - Array of unique topics found in the documents
 */
export interface DocumentListResult {
  documents: Document[];
  topics: string[];
}

export interface DocumentListResponse {
  documents: Document[];
  total: number;
}

export interface DocumentUploadResponse {
  url: string;
  key: string;
}

export interface DocumentDeleteResponse {
  success: boolean;
  message: string;
} 