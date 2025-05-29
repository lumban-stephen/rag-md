import { Router } from 'express';
import { S3Service } from '../../services/aws/s3.service.js';
import multer from 'multer';
import { config } from '../../config/env.js';

const router = Router();
const s3Service = new S3Service();

// Configure multer for memory storage
const upload = multer({ storage: multer.memoryStorage() });

// Upload file through backend
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

// Generate presigned URL for file upload
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

// Generate presigned URL for file download
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

// List all documents
router.get('/documents', async (req, res) => {
  try {
    const documents = await s3Service.listDocuments();
    res.json({ documents });
  } catch (error) {
    console.error('Error listing documents:', error);
    res.status(500).json({ error: 'Failed to list documents' });
  }
});

// List documents by topic
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

// Delete a document
router.delete('/documents/:topic/:filename', async (req, res) => {
  try {
    const { topic, filename } = req.params;
    await s3Service.deleteDocument(topic, filename);
    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Error deleting document:', error);
    res.status(500).json({ error: 'Failed to delete document' });
  }
});

// Delete multiple documents
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

// Get file content
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

// Update file content
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

// Check ingestion status
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

export default router; 