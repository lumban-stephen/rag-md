/**
 * Processing Context
 * Manages the state of document processing jobs across the application
 * Provides a way to track, update, and remove processing jobs
 */
import React, { createContext, useContext, useState, useCallback } from 'react';

/**
 * Represents a document processing job
 * @property topic - The topic/category of the document
 * @property filename - Name of the file being processed
 * @property status - Current status of the processing job
 * @property message - Status message or error description
 * @property timestamp - When the job was created
 * @property lastChecked - When the job status was last checked
 */
interface ProcessingJob {
  topic: string;
  filename: string;
  status: 'pending' | 'processing' | 'complete' | 'error';
  message: string;
  timestamp?: string;
  lastChecked?: string;
}

/**
 * Interface for the Processing Context
 * Provides methods to manage processing jobs
 */
interface ProcessingContextType {
  jobs: ProcessingJob[];
  addJob: (job: ProcessingJob) => void;
  updateJob: (filename: string, updates: Partial<ProcessingJob>) => void;
  removeJob: (filename: string) => void;
}

// Create the context with undefined as initial value
const ProcessingContext = createContext<ProcessingContextType | undefined>(undefined);

/**
 * Provider component for the Processing Context
 * Manages the state of processing jobs and provides methods to update them
 */
export const ProcessingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [jobs, setJobs] = useState<ProcessingJob[]>([]);

  /**
   * Adds a new processing job if it doesn't already exist
   * @param job - The processing job to add
   */
  const addJob = useCallback((job: ProcessingJob) => {
    setJobs(prev => {
      const exists = prev.some(j => j.filename === job.filename);
      if (!exists) {
        return [...prev, { ...job, lastChecked: new Date().toISOString() }];
      }
      return prev;
    });
  }, []);

  /**
   * Updates an existing processing job
   * @param filename - Name of the file to update
   * @param updates - Partial job object containing updates
   */
  const updateJob = useCallback((filename: string, updates: Partial<ProcessingJob>) => {
    setJobs(prev => prev.map(job => 
      job.filename === filename 
        ? { ...job, ...updates, lastChecked: new Date().toISOString() }
        : job
    ));
  }, []);

  /**
   * Removes a processing job
   * @param filename - Name of the file to remove
   */
  const removeJob = useCallback((filename: string) => {
    setJobs(prev => prev.filter(job => job.filename !== filename));
  }, []);

  return (
    <ProcessingContext.Provider value={{ jobs, addJob, updateJob, removeJob }}>
      {children}
    </ProcessingContext.Provider>
  );
};

/**
 * Custom hook to use the Processing Context
 * @returns The Processing Context
 * @throws Error if used outside of a ProcessingProvider
 */
export const useProcessing = () => {
  const context = useContext(ProcessingContext);
  if (context === undefined) {
    throw new Error('useProcessing must be used within a ProcessingProvider');
  }
  return context;
}; 