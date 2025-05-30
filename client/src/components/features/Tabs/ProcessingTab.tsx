/**
 * ProcessingTab Component
 * Displays and manages document processing jobs
 * Shows real-time status updates and allows manual refresh
 * Integrates with ProcessingContext for global job state management
 */
import React, { useState, useEffect } from 'react';
import { RefreshCw, AlertCircle, Loader2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card.js';
import { checkIngestionStatus } from '../../../services/api/index.js';
import { format } from 'date-fns';
import { useProcessing } from '../../../contexts/ProcessingContext.js';

const ProcessingTab: React.FC = () => {
  // Get processing context functions and state
  const { jobs, updateJob, removeJob } = useProcessing();
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Polls the status of a processing job
   * Updates job status and continues polling if still processing
   * @param job - The processing job to check
   */
  const pollJobStatus = async (job: typeof jobs[0]) => {
    try {
      const status = await checkIngestionStatus(job.topic, job.filename);
      updateJob(job.filename, status);

      // If still processing, continue polling
      if (status.status === 'processing') {
        setTimeout(() => pollJobStatus({ ...job, ...status }), 5000);
      }
    } catch (error) {
      console.error('Error polling job status:', error);
      updateJob(job.filename, {
        status: 'error',
        message: 'Failed to check status'
      });
    }
  };

  /**
   * Gets the appropriate icon for a job status
   * @param status - Current status of the job
   * @returns Icon component representing the status
   */
  const getStatusIcon = (status: typeof jobs[0]['status']) => {
    switch (status) {
      case 'processing':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'complete':
        return <span className="text-green-500">✅</span>;
      case 'error':
        return <span className="text-red-500">❌</span>;
      default:
        return <span className="text-yellow-500">⏳</span>;
    }
  };

  /**
   * Formats a date string to a readable format
   * @param dateString - ISO date string to format
   * @returns Formatted date string or 'N/A' if invalid
   */
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'MMM d, yyyy h:mm:ss a');
    } catch (error) {
      return 'Invalid date';
    }
  };

  // Start polling for any processing jobs when component mounts or jobs change
  useEffect(() => {
    jobs.forEach(job => {
      if (job.status === 'processing') {
        pollJobStatus(job);
      }
    });
  }, [jobs]);

  return (
    <div className="p-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Processing Jobs</CardTitle>
          {/* Manual refresh button */}
          <button
            onClick={() => setIsLoading(true)}
            className="text-gray-500 hover:text-gray-700"
          >
            <RefreshCw className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </CardHeader>
        <CardContent>
          {jobs.length === 0 ? (
            // Empty state when no jobs are present
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <AlertCircle className="h-12 w-12 mb-4" />
              <p className="text-lg">No processing jobs</p>
              <p className="text-sm mt-2">
                Processing jobs will appear here when documents are being ingested.
              </p>
            </div>
          ) : (
            // List of processing jobs
            <div className="space-y-4">
              {jobs.map(job => (
                <div
                  key={`${job.topic}/${job.filename}`}
                  className="bg-white rounded-lg border border-gray-200 p-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {/* Job header with filename and status */}
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-gray-900">{job.filename}</h4>
                        {getStatusIcon(job.status)}
                      </div>
                      {/* Status message */}
                      <p className="text-sm text-gray-500 mt-1">{job.message}</p>
                      {/* Job metadata */}
                      <div className="mt-2 text-xs text-gray-400">
                        <p>Topic: {job.topic}</p>
                        <p>Last checked: {formatDate(job.lastChecked)}</p>
                        {job.timestamp && <p>Started: {formatDate(job.timestamp)}</p>}
                      </div>
                    </div>
                    {/* Remove job button */}
                    <button
                      onClick={() => removeJob(job.filename)}
                      className="text-gray-400 hover:text-gray-500"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProcessingTab; 