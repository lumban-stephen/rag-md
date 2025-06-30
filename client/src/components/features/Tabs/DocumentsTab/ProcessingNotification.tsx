import React from 'react';

interface ProcessingNotificationProps {
  notification: {
    topic: string;
    filename: string;
    status: 'pending' | 'processing' | 'complete' | 'error';
    message: string;
    timestamp?: string;
  };
  onClose: () => void;
}

const ProcessingNotification: React.FC<ProcessingNotificationProps> = ({ notification, onClose }) => {
  return (
    <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg p-4 border border-gray-200 w-80">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h4 className="font-medium text-gray-900">{notification.filename}</h4>
          <p className="text-sm text-gray-500 mt-1">{notification.message}</p>
          <div className="mt-2 flex items-center gap-2">
            {notification.status === 'processing' && (
              <span className="animate-spin inline-block text-blue-500">⏳</span>
            )}
            {notification.status === 'complete' && (
              <span className="text-green-500">✅</span>
            )}
            {notification.status === 'error' && (
              <span className="text-red-500">❌</span>
            )}
            <span className="text-sm text-gray-500">
              {notification.status === 'processing' ? 'Processing...' : 
               notification.status === 'complete' ? 'Complete' : 
               notification.status === 'error' ? 'Error' : 'Pending'}
            </span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-500"
        >
          ×
        </button>
      </div>
    </div>
  );
};

export default ProcessingNotification; 