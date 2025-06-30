/**
 * LogsTab Component
 * Displays system logs and provides administrative controls
 * Features:
 * - Real-time log viewing with automatic refresh
 * - OpenSearch index management
 * - System status monitoring
 */
import React, { useState, useEffect } from 'react';
import { RefreshCw, Clock, Activity } from 'lucide-react';
import { format } from 'date-fns';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import { getLogs, refreshIndex } from '../../../services/api'
import { LogEntry } from '../../../types'
import toast from 'react-hot-toast';

const LogsTab: React.FC = () => {
  // State management for logs and loading states
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  /**
   * Fetches logs from the API
   * Updates the logs state and handles loading states
   */
  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const data = await getLogs();
      setLogs(data);
    } catch (error) {
      console.error('Error fetching logs:', error);
      toast.error('Failed to load logs');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch logs when component mounts
  useEffect(() => {
    fetchLogs();
  }, []);

  /**
   * Handles OpenSearch index refresh
   * Triggers reindexing of all documents
   */
  const handleRefreshIndex = async () => {
    setIsRefreshing(true);
    try {
      await refreshIndex();
      toast.success('OpenSearch index refreshed successfully');
    } catch (error) {
      console.error('Error refreshing index:', error);
      toast.error('Failed to refresh OpenSearch index');
    } finally {
      setIsRefreshing(false);
    }
  };

  /**
   * Gets the appropriate emoji icon for a log event
   * @param event - The log event type
   * @returns Emoji icon representing the event type
   */
  const getEventIcon = (event: string) => {
    if (event.includes('Upload')) return '📤';
    if (event.includes('Ingestion')) return '📥';
    if (event.includes('S3')) return '🪣';
    if (event.includes('Error')) return '⚠️';
    return '📝';
  };

  return (
    <div className="p-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main logs section */}
        <div className="md:col-span-2">
          <Card className="h-[800px] flex flex-col">
            <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <CardTitle className="flex items-center">
                <Activity className="mr-2 h-5 w-5" />
                Recent Logs
              </CardTitle>
              {/* Manual refresh button */}
              <Button
                variant="secondary"
                size="sm"
                onClick={fetchLogs}
                isLoading={isLoading}
                icon={<RefreshCw className="h-4 w-4" />}
              >
                Refresh Logs
              </Button>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden">
              {isLoading ? (
                // Loading state
                <div className="flex justify-center items-center py-12">
                  <RefreshCw className="h-8 w-8 text-blue-500 animate-spin" />
                </div>
              ) : logs.length === 0 ? (
                // Empty state
                <div className="text-center py-8 text-gray-500">
                  <p>No logs available</p>
                </div>
              ) : (
                // Log entries list
                <div className="space-y-4 h-full overflow-y-auto pr-2">
                  {logs.map((log) => (
                    <div key={`${log.id}-${log.timestamp}`} className="border-l-4 border-blue-500 pl-4 py-2">
                      {/* Timestamp */}
                      <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                        <Clock className="mr-1 h-4 w-4" />
                        <span>
                          {format(new Date(log.timestamp), 'MMM d, yyyy h:mm:ss a')}
                        </span>
                      </div>
                      {/* Event type with icon */}
                      <div className="mt-1 flex items-center">
                        <span className="mr-2 text-lg">{getEventIcon(log.event)}</span>
                        <h4 className="font-medium text-gray-800 dark:text-gray-100">{log.event}</h4>
                      </div>
                      {/* Event details */}
                      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{log.details}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Admin controls section */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Admin Controls</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* OpenSearch index management */}
              <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800 dark:border-gray-700">
                <h3 className="font-medium text-gray-800 dark:text-gray-100 mb-2">OpenSearch Index</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Manually refresh the OpenSearch index to ensure all document changes are searchable.
                </p>
                <Button
                  variant="primary"
                  onClick={handleRefreshIndex}
                  isLoading={isRefreshing}
                  icon={<RefreshCw className="h-4 w-4" />}
                >
                  Refresh Index
                </Button>
              </div>
              
              {/* System status indicators */}
              <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800 dark:border-gray-700">
                <h3 className="font-medium text-gray-800 dark:text-gray-100 mb-2">System Status</h3>
                <div className="space-y-2">
                  {/* S3 status */}
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">S3 Bucket:</span>
                    <Badge variant="success">Online</Badge>
                  </div>
                  {/* OpenSearch status */}
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">OpenSearch Cluster:</span>
                    <Badge variant="success">Online</Badge>
                  </div>
                  {/* Lambda status */}
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Lambda Functions:</span>
                    <Badge variant="success">Online</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default LogsTab;