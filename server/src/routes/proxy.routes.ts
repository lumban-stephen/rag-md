/**
 * Proxy Routes
 * Handles proxying requests to external services (API Gateway)
 * Includes search and reindexing operations
 */
import express from 'express';
import axios from 'axios';

const router = express.Router();
const API_GATEWAY_URL = process.env.API_GATEWAY_URL || 'https://r0ts5l6wz4.execute-api.us-east-1.amazonaws.com/dev';

/**
 * Proxy search requests to OpenSearch through API Gateway
 * @route POST /api/proxy/opensearch
 */
router.post('/opensearch', async (req, res) => {
  try {
    const { query } = req.body;
    console.log('Proxying search request:', { query });
    
    const response = await axios.post(`${API_GATEWAY_URL}/search`, { query });
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
      url: `${API_GATEWAY_URL}/search/${topic}`
    });
    
    const response = await axios.post(`${API_GATEWAY_URL}/search/${topic}`, { query });
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
      url: `${API_GATEWAY_URL}/reindex`
    });
    
    const response = await axios.post(`${API_GATEWAY_URL}/reindex`, { topic, filename, content });
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

export default router; 