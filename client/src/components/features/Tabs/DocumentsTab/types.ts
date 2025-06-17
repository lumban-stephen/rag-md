export interface DocumentType {
  id: string;
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

export interface DocumentsTableProps {
  documents: DocumentType[];
  isLoading: boolean;
  onDelete: (id: string) => void;
  onEdit: (document: DocumentType) => void;
  onView: (id: string) => void;
}

export interface EditModalProps {
  document: DocumentType;
  onClose: () => void;
  onSubmit: (document: DocumentType) => Promise<void>;
}

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
} 