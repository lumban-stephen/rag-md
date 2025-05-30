import React, { createContext, useContext, useState, useCallback } from 'react';

interface ProcessingJob {
  topic: string;
  filename: string;
  status: 'pending' | 'processing' | 'complete' | 'error';
  message: string;
  timestamp?: string;
  lastChecked?: string;
}

interface ProcessingContextType {
  jobs: ProcessingJob[];
  addJob: (job: ProcessingJob) => void;
  updateJob: (filename: string, updates: Partial<ProcessingJob>) => void;
  removeJob: (filename: string) => void;
}

const ProcessingContext = createContext<ProcessingContextType | undefined>(undefined);

export const ProcessingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [jobs, setJobs] = useState<ProcessingJob[]>([]);

  const addJob = useCallback((job: ProcessingJob) => {
    setJobs(prev => {
      const exists = prev.some(j => j.filename === job.filename);
      if (!exists) {
        return [...prev, { ...job, lastChecked: new Date().toISOString() }];
      }
      return prev;
    });
  }, []);

  const updateJob = useCallback((filename: string, updates: Partial<ProcessingJob>) => {
    setJobs(prev => prev.map(job => 
      job.filename === filename 
        ? { ...job, ...updates, lastChecked: new Date().toISOString() }
        : job
    ));
  }, []);

  const removeJob = useCallback((filename: string) => {
    setJobs(prev => prev.filter(job => job.filename !== filename));
  }, []);

  return (
    <ProcessingContext.Provider value={{ jobs, addJob, updateJob, removeJob }}>
      {children}
    </ProcessingContext.Provider>
  );
};

export const useProcessing = () => {
  const context = useContext(ProcessingContext);
  if (context === undefined) {
    throw new Error('useProcessing must be used within a ProcessingProvider');
  }
  return context;
}; 