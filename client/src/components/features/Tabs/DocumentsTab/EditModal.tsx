import React, { useState, useEffect } from 'react';
import Button from '../../ui/Button.js';
import { EditModalProps } from './types';

const EditModal: React.FC<EditModalProps> = ({ 
  document,
  onClose, 
  onSubmit
}) => {
  const [content, setContent] = useState(document.content || '');
  const [isSaving, setIsSaving] = useState(false);
  const [showConfirmSave, setShowConfirmSave] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setContent(document.content || '');
    setHasChanges(false);
    setShowConfirmSave(false);
  }, [document]);

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!hasChanges) {
      onClose();
      return;
    }

    if (!showConfirmSave) {
      setShowConfirmSave(true);
      return;
    }

    setIsSaving(true);
    try {
      await onSubmit({
        ...document,
        content
      });
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (showConfirmSave) {
      setShowConfirmSave(false);
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-[80vw] h-[80vh] flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold dark:text-gray-100">Edit {document.filename}</h2>
          <Button variant="ghost" onClick={handleCancel}>×</Button>
        </div>
        <div className="flex-grow overflow-auto mb-4">
          <textarea
            value={content}
            onChange={handleContentChange}
            className="w-full h-full min-h-[400px] p-4 border rounded-lg font-mono text-sm dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
            spellCheck="false"
          />
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={handleCancel}>
            {showConfirmSave ? 'Back to Editing' : 'Cancel'}
          </Button>
          <Button
            variant={showConfirmSave ? "danger" : "primary"}
            onClick={handleSave}
            isLoading={isSaving}
          >
            {showConfirmSave ? 'Confirm Save' : 'Save Changes'}
          </Button>
        </div>
        {showConfirmSave && (
          <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <p className="text-yellow-800 dark:text-yellow-200">
              You are about to update the RAG content. This will affect future search results.
              Are you sure you want to proceed?
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EditModal; 