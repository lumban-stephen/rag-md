import axios from 'axios';
import { LogEntry } from '../../types';

// Debug environment variables
console.log('All env variables:', import.meta.env);
console.log('API Base URL from env:', import.meta.env.VITE_LOCAL_API_URL);

// AWS API Gateway URL - this should be set in your .env file
const API_BASE_URL = import.meta.env.VITE_LOCAL_API_URL || (import.meta.env.DEV ? 'http://localhost:3000/api' : 'http://172.28.64.1:3000/api');

if (!API_BASE_URL) {
  console.error('API Base URL is not configured');
  throw new Error('API Base URL configuration is required');
}

console.log('Using API Base URL:', API_BASE_URL);

// Create an axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Add request interceptor for debugging
api.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    // Check if the response is HTML instead of JSON
    const contentType = response.headers['content-type'];
    if (contentType && contentType.includes('text/html')) {
      console.error('Received HTML instead of JSON response. Check API configuration.');
      throw new Error('Invalid API response format');
    }
    return response;
  },
  (error) => {
    if (error.code === 'ECONNABORTED') {
      console.error('Request timed out. The server might be taking too long to respond.');
    }
    
    console.error('API Error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      baseURL: error.config?.baseURL,
      timeout: error.config?.timeout,
      headers: error.config?.headers
    });
    
    return Promise.reject(error);
  }
);

interface Document {
  filename: string;
  topic: string;
  lastModified: string;
  size: number;
  status?: 'processing' | 'complete';
}

interface GetDocumentsParams {
  topic?: string;
  page?: number;
  limit?: number;
  search?: string;
  sortField?: string;
  sortDirection?: 'asc' | 'desc';
}

interface DocumentsResponse {
  documents: Document[];
  total: number;
  topics?: string[];
}

/**
 * Generate a pre-signed URL for file upload
 */
export const generateUploadUrl = async (filename: string, topic: string): Promise<string> => {
  try {
    const response = await api.get('/generate-url', {
      params: { topic, filename }
    });
    return response.data.url;
  } catch (error) {
    console.error('Error generating upload URL:', error);
    throw error;
  }
};

/**
 * Upload a file through the backend proxy
 */
export const uploadFile = async (file: File, topic: string, filename: string): Promise<boolean> => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('topic', topic);
    formData.append('filename', filename);

    await api.post('/s3/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return true;
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
};

/**
 * Get documents with pagination, filtering, and sorting
 */
export const getDocuments = async (params: GetDocumentsParams = {}): Promise<DocumentsResponse> => {
  try {
    const {
      topic,
      page = 1,
      limit = 10,
      search = '',
      sortField = 'lastModified',
      sortDirection = 'desc'
    } = params;

    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      search,
      sortField,
      sortDirection
    });

    if (topic) {
      queryParams.append('topic', topic);
    }

    const url = `/s3/documents?${queryParams.toString()}`;
    const response = await api.get(url);
    
    // Extract unique topics from documents
    const allDocuments = (response.data.documents || []).map((doc: any) => {
      // Ensure size is a number and has a fallback
      const size = typeof doc.size === 'number' ? doc.size : 
                  typeof doc.size === 'string' ? parseInt(doc.size, 10) : 0;
      
      return {
        filename: doc.filename || '',
        topic: doc.topic || '',
        lastModified: doc.lastModified || new Date().toISOString(),
        size: size,
        status: doc.status || 'complete' // Default to complete if status is not provided
      };
    });
    
    const topics = Array.from(new Set(allDocuments.map((doc: Document) => doc.topic).filter(Boolean))) as string[];
    
    return { 
      documents: allDocuments,
      total: response.data.total || 0,
      topics: topics // Remove the empty string for "All Topics" option
    };
  } catch (error) {
    console.error('Error fetching documents:', error);
    if (axios.isAxiosError(error)) {
      console.error('Axios error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          headers: error.config?.headers
        }
      });
    }
    throw error;
  }
};

/**
 * Delete a document
 */
export const deleteDocument = async (topic: string, filename: string): Promise<{ success: boolean; wasLastFile: boolean }> => {
  try {
    const response = await api.delete(`/s3/documents/${topic}/${filename}`);
    return {
      success: true,
      wasLastFile: response.data.wasLastFile
    };
  } catch (error) {
    console.error('Error deleting document:', error);
    throw error;
  }
};

/**
 * Reprocess a document
 */
export const reprocessDocument = async (topic: string, filename: string): Promise<boolean> => {
  try {
    await api.post('/reprocess-file', { topic, filename });
    return true;
  } catch (error) {
    console.error('Error reprocessing document:', error);
    throw error;
  }
};

/**
 * Search documents
 */
export const searchDocuments = async (query: string, topic?: string): Promise<any[]> => {
  try {
    const url = topic 
      ? `/proxy/opensearch/${encodeURIComponent(topic)}`
      : '/proxy/opensearch';
    
    const response = await api.post(url, { query });
    
    // Add debug logging
    console.log('Search response for topic:', topic, response.data);
    
    // Check if response has the expected structure
    if (!response.data || !response.data.results || !Array.isArray(response.data.results)) {
      console.warn('Search response has unexpected structure:', response.data);
      return [];
    }
    
    // Transform the results to match SearchResult type
    return response.data.results.map((item: any) => {
      // Add debug logging for metadata
      console.log('Result item metadata:', item.metadata);
      
      const filename = item.metadata?.filename || 
                      item.metadata?.original_filename ||
                      item.metadata?.source || 
                      item.metadata?.file || 
                      'Unknown file';
      
      const score = typeof item.score === 'number' ? item.score : 1.0;
      
      return {
        id: filename || Math.random().toString(36).substr(2, 9),
        snippet: item.text_chunk || '',
        filename: filename,
        confidence: Number(score.toFixed(2))
      };
    });
  } catch (error) {
    console.error('Error searching documents:', error);
    return [];
  }
};

/**
 * Get recent logs
 */
export const getLogs = async (): Promise<LogEntry[]> => {
  try {
    const response = await api.get('/logs');
    return response.data;
  } catch (error) {
    console.error('Error fetching logs:', error);
    throw error;
  }
};

/**
 * Refresh OpenSearch index
 */
export const refreshIndex = async (): Promise<boolean> => {
  // In a real implementation, this would call an API endpoint
  return new Promise(resolve => {
    setTimeout(() => resolve(true), 2000);
  });
};

/**
 * Get index statistics
 */
export const getIndexStats = async (): Promise<any> => {
  try {
    const response = await api.get('/index-stats');
    return response.data;
  } catch (error) {
    console.error('Error getting index stats:', error);
    throw error;
  }
};

/**
 * Delete multiple documents
 */
export const deleteDocuments = async (documents: { topic: string; filename: string }[]): Promise<boolean> => {
  try {
    await api.delete('/s3/documents/bulk', { data: { documents } });
    return true;
  } catch (error) {
    console.error('Error deleting documents:', error);
    throw error;
  }
};

/**
 * Get download URL for a file
 */
export const getDownloadUrl = async (topic: string, filename: string): Promise<string> => {
  try {
    const response = await api.get('/s3/download-url', {
      params: { topic, filename }
    });
    return response.data.url;
  } catch (error) {
    console.error('Error getting download URL:', error);
    throw error;
  }
};

/**
 * Get file content
 */
export const getFileContent = async (topic: string, filename: string): Promise<string> => {
  try {
    const response = await api.get('/s3/file-content', {
      params: { topic, filename }
    });
    return response.data.content;
  } catch (error) {
    console.error('Error getting file content:', error);
    throw error;
  }
};

/**
 * Update file content
 */
export const updateFileContent = async (topic: string, filename: string, content: string): Promise<boolean> => {
  try {
    const response = await api.put('/s3/file-content', {
      topic,
      filename,
      content
    });
    
    if (!response.data) {
      throw new Error('No response data received');
    }
    
    return true;
  } catch (error) {
    console.error('Error updating file content:', error);
    if (axios.isAxiosError(error)) {
      console.error('Axios error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          headers: error.config?.headers
        }
      });
    }
    throw error;
  }
};

/**
 * Check ingestion status for a document
 */
export const checkIngestionStatus = async (topic: string, filename: string): Promise<{
  status: 'pending' | 'processing' | 'complete' | 'error';
  message: string;
  timestamp?: string;
}> => {
  try {
    const response = await api.get('/s3/ingestion-status', {
      params: { topic, filename }
    });
    return response.data;
  } catch (error) {
    console.error('Error checking ingestion status:', error);
    throw error;
  }
};