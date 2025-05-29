import axios from 'axios';
import { LogEntry } from '../../types';

// Debug environment variables
console.log('All env variables:', import.meta.env);
console.log('API Base URL from env:', import.meta.env.VITE_API_BASE_URL);

// AWS API Gateway URL - this should be set in your .env file
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
if (!API_BASE_URL) {
  console.error('VITE_API_BASE_URL is not set in environment variables');
  throw new Error('VITE_API_BASE_URL environment variable is required');
}

console.log('Using API Base URL:', API_BASE_URL);

// Create an axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,  // Use the API Gateway URL directly
  timeout: 30000, // Increase timeout to 30 seconds
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
}

interface DocumentsResponse {
  documents: Document[];
  topics?: string[];  // Add topics to the response
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

    // Use local backend in development
    const isDevelopment = import.meta.env.DEV;
    const baseURL = isDevelopment 
      ? 'http://localhost:3000/api'
      : API_BASE_URL;
    
    const localApi = axios.create({
      baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });

    await localApi.post('/s3/upload', formData);
    return true;
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
};

/**
 * Get documents by topic
 */
export const getDocuments = async (topic?: string): Promise<DocumentsResponse> => {
  try {
    // Always use local S3 service
    const url = '/s3/documents';
    
    // Create a new axios instance for the local backend
    const localApi = axios.create({
      baseURL: 'http://localhost:3000/api',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    
    const response = await localApi.get(url);
    
    // Extract unique topics from documents
    const allDocuments = (response.data.documents || []).map((doc: any) => {
      // Ensure size is a number and has a fallback
      const size = typeof doc.size === 'number' ? doc.size : 
                  typeof doc.size === 'string' ? parseInt(doc.size, 10) : 0;
      
      return {
        filename: doc.filename || '',
        topic: doc.topic || '',
        lastModified: doc.lastModified || new Date().toISOString(),
        size: size
      };
    });
    
    // Filter documents by topic if specified
    const documents = topic 
      ? allDocuments.filter((doc: Document) => doc.topic === topic)
      : allDocuments;
    
    const topics = Array.from(new Set(allDocuments.map((doc: Document) => doc.topic).filter(Boolean))) as string[];
    
    return { 
      documents,
      topics: ['', ...topics] // Add empty string for "All Topics" option
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
export const deleteDocument = async (topic: string, filename: string): Promise<boolean> => {
  try {
    // Create a new axios instance for the local backend
    const localApi = axios.create({
      baseURL: 'http://localhost:3000/api',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    // Use the correct local S3 service endpoint
    await localApi.delete(`/s3/documents/${topic}/${filename}`);
    return true;
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
    // Use API Gateway directly in production, proxy in development
    const isDevelopment = import.meta.env.DEV;
    const baseURL = isDevelopment 
      ? 'http://localhost:3000/api'
      : API_BASE_URL;
    
    const api = axios.create({
      baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    // Use appropriate endpoint based on environment
    const url = topic 
      ? (isDevelopment ? `/proxy/opensearch/${encodeURIComponent(topic)}` : `/search/${encodeURIComponent(topic)}`)
      : (isDevelopment ? '/proxy/opensearch' : '/search');
    
    const response = await api.post(url, { query });
    
    // Check if response has the expected structure
    if (!response.data || !response.data.results || !Array.isArray(response.data.results)) {
      console.warn('Search response has unexpected structure:', response.data);
      return [];
    }
    
    // Transform the results to match SearchResult type
    return response.data.results.map((item: any) => {
      // Extract filename from metadata, handling different possible structures
      const filename = item.metadata?.filename || 
                      item.metadata?.source || 
                      item.metadata?.file || 
                      'Unknown file';
      
      // Ensure confidence score is a number and format it
      const score = typeof item.score === 'number' ? item.score : 1.0;
      
      return {
        id: filename || Math.random().toString(36).substr(2, 9),
        snippet: item.text_chunk || '',
        filename: filename,
        confidence: Number(score.toFixed(2)) // Format to 2 decimal places
      };
    });
  } catch (error) {
    console.error('Error searching documents:', error);
    // Return empty array on error to prevent .map errors
    return [];
  }
};

/**
 * Get recent logs
 */
export const getLogs = async (): Promise<LogEntry[]> => {
  try {
    // Use local backend in development
    const isDevelopment = import.meta.env.DEV;
    const baseURL = isDevelopment 
      ? 'http://localhost:3000/api'
      : API_BASE_URL;
    
    const localApi = axios.create({
      baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    const response = await localApi.get('/logs');
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
    // Create a new axios instance for the local backend
    const localApi = axios.create({
      baseURL: 'http://localhost:3000/api',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    await localApi.delete('/s3/documents/bulk', { data: { documents } });
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
    // Create a new axios instance for the local backend
    const localApi = axios.create({
      baseURL: 'http://localhost:3000/api',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    const response = await localApi.get('/s3/download-url', {
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
    const localApi = axios.create({
      baseURL: 'http://localhost:3000/api',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    const response = await localApi.get('/s3/file-content', {
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
    const localApi = axios.create({
      baseURL: 'http://localhost:3000/api',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    await localApi.put('/s3/file-content', { topic, filename, content });
    return true;
  } catch (error) {
    console.error('Error updating file content:', error);
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
    // Use local backend in development
    const isDevelopment = import.meta.env.DEV;
    const baseURL = isDevelopment 
      ? 'http://localhost:3000/api'
      : API_BASE_URL;
    
    const localApi = axios.create({
      baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    const response = await localApi.get('/s3/ingestion-status', {
      params: { topic, filename }
    });
    return response.data;
  } catch (error) {
    console.error('Error checking ingestion status:', error);
    throw error;
  }
};