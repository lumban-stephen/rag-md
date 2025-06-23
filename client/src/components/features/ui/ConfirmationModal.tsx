import React, { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import Button from './Button';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  confirmButtonText?: string;
  cancelButtonText?: string;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'confirm',
  confirmButtonText = 'Delete',
  cancelButtonText = 'Cancel'
}) => {
  const [inputValue, setInputValue] = useState('');

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (inputValue.toLowerCase() === confirmText.toLowerCase()) {
      onConfirm();
      setInputValue('');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex items-center gap-3 mb-4">
          <AlertTriangle className="h-6 w-6 text-red-500" />
          <h3 className="text-lg font-semibold dark:text-gray-100">{title}</h3>
        </div>
        
        <p className="text-gray-600 dark:text-gray-300 mb-4">{message}</p>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Type "{confirmText}" to confirm
          </label>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
            placeholder={`Type "${confirmText}" to confirm`}
          />
        </div>

        <div className="flex justify-end gap-3">
          <Button
            variant="secondary"
            onClick={() => {
              onClose();
              setInputValue('');
            }}
          >
            {cancelButtonText}
          </Button>
          <Button
            variant="danger"
            onClick={handleConfirm}
            disabled={inputValue.toLowerCase() !== confirmText.toLowerCase()}
          >
            {confirmButtonText}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal; 