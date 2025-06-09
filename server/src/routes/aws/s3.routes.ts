/**
 * S3 Routes
 * Handles all S3-related operations including file uploads, downloads,
 * content management, and ingestion status checks
 */
import { Router } from 'express';
import { S3Service } from '../../services/aws/s3.service.js';
import multer from 'multer';
import { config } from '../../config/env.js';

const router = Router();
const s3Service = new S3Service();

// Configure multer for memory storage of uploaded files
const upload = multer({ storage: multer.memoryStorage() });

/**
 * Upload a file through the backend
 * Accepts multipart form data with file and metadata
 * @route POST /api/s3/upload
 */
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    const { topic, filename } = req.body;
    
    if (!topic || !filename) {
      return res.status(400).json({ error: 'Topic and filename are required' });
    }

    await s3Service.uploadFile(
      topic,
      filename,
      req.file.buffer,
      req.file.mimetype
    );
    
    res.json({ message: 'File uploaded successfully' });
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ error: 'Failed to upload file' });
  }
});

/**
 * Generate a presigned URL for direct file upload to S3
 * @route GET /api/s3/generate-url
 */
router.get('/generate-url', async (req, res) => {
  try {
    const { topic, filename } = req.query;
    
    if (!topic || !filename) {
      return res.status(400).json({ error: 'Topic and filename are required' });
    }

    const url = await s3Service.generatePresignedUrl(
      topic as string,
      filename as string
    );
    
    res.json({ url });
  } catch (error) {
    console.error('Error generating URL:', error);
    res.status(500).json({ error: 'Failed to generate upload URL' });
  }
});

/**
 * Generate a presigned URL for downloading a processed file
 * @route GET /api/s3/download-url
 */
router.get('/download-url', async (req, res) => {
  try {
    const { topic, filename } = req.query;
    
    if (!topic || !filename) {
      return res.status(400).json({ error: 'Topic and filename are required' });
    }

    const url = await s3Service.generateDownloadUrl(
      topic as string,
      filename as string
    );
    
    res.json({ url });
  } catch (error) {
    console.error('Error generating download URL:', error);
    res.status(500).json({ error: 'Failed to generate download URL' });
  }
});

/**
 * List all documents across all topics
 * @route GET /api/s3/documents
 * @query page - Page number (default: 1)
 * @query limit - Items per page (default: 10)
 * @query search - Search term for filename
 * @query sortField - Field to sort by (filename, topic, lastModified, size)
 * @query sortDirection - Sort direction (asc, desc)
 * @query topic - Optional topic filter
 */
router.get('/documents', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      sortField = 'lastModified',
      sortDirection = 'desc',
      topic
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const documents = await s3Service.listDocuments({
      topic: topic as string,
      search: search as string,
      sortField: sortField as string,
      sortDirection: sortDirection as 'asc' | 'desc',
      skip,
      limit: limitNum
    });

    res.json(documents);
  } catch (error) {
    console.error('Error listing documents:', error);
    res.status(500).json({ error: 'Failed to list documents' });
  }
});

/**
 * List documents for a specific topic
 * @route GET /api/s3/documents/:topic
 */
router.get('/documents/:topic', async (req, res) => {
  try {
    const { topic } = req.params;
    const documents = await s3Service.listDocuments(topic);
    res.json({ documents });
  } catch (error) {
    console.error('Error listing documents:', error);
    res.status(500).json({ error: 'Failed to list documents' });
  }
});

/**
 * Delete a specific document
 * Also checks if it was the last file in the topic
 * @route DELETE /api/s3/documents/:topic/:filename
 */
router.delete('/documents/:topic/:filename', async (req, res) => {
  try {
    const { topic, filename } = req.params;
    await s3Service.deleteDocument(topic, filename);
    
    // Check if there are any remaining files in this topic
    const remainingFiles = await s3Service.listDocuments(topic);
    const wasLastFile = remainingFiles.length === 0;
    
    res.json({ 
      message: 'Document deleted successfully',
      wasLastFile,
      remainingFiles
    });
  } catch (error) {
    console.error('Error deleting document:', error);
    res.status(500).json({ error: 'Failed to delete document' });
  }
});

/**
 * Delete multiple documents in parallel
 * @route DELETE /api/s3/documents/bulk
 */
router.delete('/documents/bulk', async (req, res) => {
  try {
    const { documents } = req.body;
    
    if (!Array.isArray(documents) || documents.length === 0) {
      return res.status(400).json({ error: 'Documents array is required' });
    }

    // Delete all documents in parallel
    await Promise.all(
      documents.map(({ topic, filename }) => 
        s3Service.deleteDocument(topic, filename)
      )
    );
    
    res.json({ message: 'Documents deleted successfully' });
  } catch (error) {
    console.error('Error deleting documents:', error);
    res.status(500).json({ error: 'Failed to delete documents' });
  }
});

/**
 * Get the content of a file
 * Checks both processed and uploads directories
 * @route GET /api/s3/file-content
 */
router.get('/file-content', async (req, res) => {
  try {
    const { topic, filename } = req.query;
    
    if (!topic || !filename) {
      return res.status(400).json({ error: 'Topic and filename are required' });
    }

    const content = await s3Service.getFileContent(
      topic as string,
      filename as string
    );
    
    res.json({ content });
  } catch (error) {
    console.error('Error getting file content:', error);
    res.status(500).json({ error: 'Failed to get file content' });
  }
});

/**
 * Update the content of a file
 * Triggers reprocessing of the document
 * @route PUT /api/s3/file-content
 */
router.put('/file-content', async (req, res) => {
  try {
    const { topic, filename, content } = req.body;
    
    if (!topic || !filename || content === undefined) {
      return res.status(400).json({ error: 'Topic, filename, and content are required' });
    }

    await s3Service.updateFileContent(topic, filename, content);
    
    res.json({ message: 'File content updated successfully' });
  } catch (error) {
    console.error('Error updating file content:', error);
    res.status(500).json({ error: 'Failed to update file content' });
  }
});

/**
 * Check the ingestion status of a document
 * @route GET /api/s3/ingestion-status
 */
router.get('/ingestion-status', async (req, res) => {
  try {
    const { topic, filename } = req.query;
    
    if (!topic || !filename) {
      return res.status(400).json({ error: 'Topic and filename are required' });
    }

    const status = await s3Service.checkIngestionStatus(
      topic as string,
      filename as string
    );
    
    res.json(status);
  } catch (error) {
    console.error('Error checking ingestion status:', error);
    res.status(500).json({ error: 'Failed to check ingestion status' });
  }
});

/**
 * Get all available topics
 * @route GET /api/s3/topics
 */
router.get('/topics', async (req, res) => {
  console.log('Received request for topics');
  try {
    const topics = await s3Service.getAllTopics();
    console.log('Retrieved topics from S3:', topics);
    res.json({ topics });
  } catch (error: any) {
    console.error('Error getting topics:', error);
    res.status(500).json({ 
      error: 'Failed to get topics',
      message: error.message || 'Unknown error',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

export default router; 