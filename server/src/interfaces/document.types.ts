export interface Document {
  filename: string;
  topic: string;
  lastModified: string;
  size: number;
  status: 'processing' | 'complete';
  ingestionStatus?: {
    status: 'pending' | 'processing' | 'complete' | 'error';
    message: string;
    timestamp?: string;
  };
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