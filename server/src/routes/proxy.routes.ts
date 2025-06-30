/**
 * Proxy Routes
 * Handles proxying requests to external services (API Gateway)
 * Includes search and reindexing operations
 */
import { Router } from 'express';
import axios from 'axios';
import { config } from '../config/env.js';

const router = Router();

/**
 * Proxy search requests to OpenSearch through API Gateway
 * @route POST /api/proxy/opensearch
 */
router.post('/opensearch', async (req, res) => {
  try {
    const { query } = req.body;
    console.log('Proxying search request:', { query });
    
    const response = await axios.post(`${config.apiGateway.url}/search`, { query });
    console.log('Search response:', response.data);
    
    if (!response.data || !response.data.results) {
      console.warn('Unexpected search response structure:', response.data);
      return res.json({ results: [] });
    }
    
    res.json(response.data);
  } catch (error) {
    console.error('Error proxying search request:', error);
    if (axios.isAxiosError(error)) {
      console.error('Search error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      });
    }
    res.status(500).json({ error: 'Failed to proxy search request' });
  }
});

/**
 * Proxy search requests for a specific topic to OpenSearch
 * @route POST /api/proxy/opensearch/:topic
 */
router.post('/opensearch/:topic', async (req, res) => {
  try {
    const { topic } = req.params;
    const { query } = req.body;
    console.log('Proxying search request with topic:', { 
      topic, 
      query,
      url: `${config.apiGateway.url}/search/${topic}`
    });
    
    const response = await axios.post(`${config.apiGateway.url}/search/${topic}`, { query });
    console.log('Search response:', {
      status: response.status,
      statusText: response.statusText,
      data: response.data,
      headers: response.headers
    });
    
    if (!response.data || !response.data.results) {
      console.warn('Unexpected search response structure:', response.data);
      return res.json({ results: [] });
    }
    
    res.json(response.data);
  } catch (error) {
    console.error('Error proxying search request:', error);
    if (axios.isAxiosError(error)) {
      console.error('Search error details:', {
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
    res.status(500).json({ error: 'Failed to proxy search request' });
  }
});

/**
 * Proxy reindexing requests to API Gateway
 * Used to update the search index for a document
 * @route POST /api/proxy/reindex
 */
router.post('/reindex', async (req, res) => {
  try {
    const { topic, filename, content } = req.body;
    console.log('Proxying reindex request:', { 
      topic, 
      filename, 
      contentLength: content?.length,
      url: `${config.apiGateway.url}/reindex`
    });
    
    const response = await axios.post(`${config.apiGateway.url}/reindex`, { topic, filename, content });
    console.log('Reindex response:', {
      status: response.status,
      statusText: response.statusText,
      data: response.data,
      headers: response.headers
    });
    
    res.json(response.data);
  } catch (error) {
    console.error('Error proxying reindex request:', error);
    if (axios.isAxiosError(error)) {
      console.error('Reindex error details:', {
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
    res.status(500).json({ error: 'Failed to proxy reindex request' });
  }
});

/**
 * Get chunks for a specific document
 * @route GET /api/proxy/opensearch/chunks/:topic/:filename
 */
router.get('/opensearch/chunks/:topic/:filename', async (req, res) => {
  try {
    const { topic, filename } = req.params;
    console.log('Getting chunks for document:', { 
      topic, 
      filename,
      apiGatewayUrl: config.apiGateway.url
    });
    
    if (!config.apiGateway.url) {
      throw new Error('API Gateway URL is not configured');
    }
    
    const searchUrl = `${config.apiGateway.url}/search/${topic}`;
    console.log('Making request to:', searchUrl);
    
    // Use a more precise query to get all chunks for the document
    const response = await axios.post(searchUrl, {
      query: {
        bool: {
          must: [
            { 
              match: { 
                "metadata.filename": {
                  query: filename,
                  operator: "and"
                }
              } 
            }
          ],
          filter: [
            { exists: { field: "text_chunk" } }
          ]
        }
      },
      size: 1000, // Increased from 100 to 1000 chunks
      from: 0,    // Start from the first chunk
      sort: [
        { "metadata.chunk_index": { "order": "asc" } } // Sort by chunk index
      ],
      _source: ["text_chunk", "metadata", "score"] // Only return needed fields
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers);
    
    if (!response.data) {
      console.warn('Empty response from API Gateway');
      return res.json({ chunks: [] });
    }

    if (!response.data.results) {
      console.warn('Unexpected response structure:', response.data);
      return res.json({ chunks: [] });
    }
    
    // Transform the results to include chunk information
    const chunks = response.data.results.map((item: any) => ({
      text: item.text_chunk || '',
      metadata: item.metadata || {},
      score: item.score || 1.0
    }));

    // Log the number of chunks found
    console.log(`Found ${chunks.length} chunks for document: ${topic}/${filename}`, {
      firstChunk: chunks[0]?.metadata,
      lastChunk: chunks[chunks.length - 1]?.metadata
    });
    
    res.json({ chunks });
  } catch (error: unknown) {
    console.error('Error getting document chunks:', error);
    if (axios.isAxiosError(error)) {
      console.error('Error details:', {
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
    res.status(500).json({ 
      error: 'Failed to get document chunks',
      details: axios.isAxiosError(error) ? {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      } : error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Delete a topic and all its associated chunks from OpenSearch
 * @route DELETE /api/proxy/opensearch/topic/:topic
 */
router.delete('/opensearch/topic/:topic', async (req, res) => {
  try {
    const { topic } = req.params;
    console.log('Deleting topic and its chunks:', { 
      topic,
      apiGatewayUrl: config.apiGateway.url
    });
    
    if (!config.apiGateway.url) {
      throw new Error('API Gateway URL is not configured');
    }
    
    const deleteUrl = `${config.apiGateway.url}/delete-topic/${encodeURIComponent(topic)}`;
    console.log('Making request to:', deleteUrl);
    
    const response = await axios.delete(deleteUrl);
    console.log('Delete response:', {
      status: response.status,
      statusText: response.statusText,
      data: response.data
    });
    
    res.json({ 
      message: `Successfully deleted topic "${topic}" and all its chunks`,
      details: response.data
    });
  } catch (error) {
    console.error('Error deleting topic:', error);
    if (axios.isAxiosError(error)) {
      console.error('Error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      });
    }
    res.status(500).json({ 
      error: 'Failed to delete topic',
      details: axios.isAxiosError(error) ? {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      } : error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router; 