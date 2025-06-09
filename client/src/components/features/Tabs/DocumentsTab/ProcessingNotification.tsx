import React from 'react';
import { Loader2 } from 'lucide-react';
import { ProcessingNotificationProps } from './types';

const ProcessingNotification: React.FC<ProcessingNotificationProps> = ({ notifications, onRemove }) => {
  if (notifications.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 flex flex-col gap-2">
      {notifications.map((notification) => (
        <div key={notification.id} className="bg-white rounded-lg shadow-lg p-4 border border-gray-200 w-80">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h4 className="font-medium text-gray-900">{notification.filename}</h4>
              <p className="text-sm text-gray-500 mt-1">{notification.message}</p>
              <div className="mt-2 flex items-center gap-2">
                {notification.status === 'processing' && (
                  <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
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
              onClick={() => onRemove(notification.id)}
              className="text-gray-400 hover:text-gray-500"
            >
              ×
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ProcessingNotification; 