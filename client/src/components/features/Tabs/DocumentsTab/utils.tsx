import React from 'react';
import { format } from 'date-fns';

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return 'Invalid date';
    }
    return format(date, 'MMM d, yyyy h:mm a');
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid date';
  }
};

export const getStatusIcon = (status?: {
  status: 'pending' | 'processing' | 'complete' | 'error';
  message: string;
}): React.ReactNode => {
  if (!status) return null;
  
  switch (status.status) {
    case 'processing':
      return <span className="text-yellow-500" title={status.message}>⏳</span>;
    case 'complete':
      return <span className="text-green-500" title={status.message}>✅</span>;
    case 'error':
      return <span className="text-red-500" title={status.message}>❌</span>;
    default:
      return null;
  }
}; 