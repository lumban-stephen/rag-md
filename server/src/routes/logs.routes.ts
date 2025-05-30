/**
 * Logs Routes
 * Handles log retrieval and management operations
 */
import { Router } from 'express';
import { LoggingService } from '../services/logging.service.js';

const router = Router();
const loggingService = LoggingService.getInstance();

/**
 * Get all system logs
 * @route GET /api/logs
 */
router.get('/', (req, res) => {
  try {
    const logs = loggingService.getLogs();
    res.json(logs);
  } catch (error) {
    console.error('Error fetching logs:', error);
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
});

/**
 * Clear all system logs
 * @route DELETE /api/logs
 */
router.delete('/', (req, res) => {
  try {
    loggingService.clearLogs();
    res.json({ message: 'Logs cleared successfully' });
  } catch (error) {
    console.error('Error clearing logs:', error);
    res.status(500).json({ error: 'Failed to clear logs' });
  }
});

export default router; 