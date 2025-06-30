import React from 'react';
import ConfirmationModal from '../../ui/ConfirmationModal.js';

interface DeleteTopicModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  topic: string | null;
}

const DeleteTopicModal: React.FC<DeleteTopicModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  topic,
}) => {
  return (
    <ConfirmationModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title="Delete Topic"
      message={`Are you sure you want to delete the topic "${topic}"? This will remove all associated chunks from OpenSearch. This action cannot be undone.`}
      confirmText="delete"
      confirmButtonText="Delete Topic"
      cancelButtonText="Cancel"
    />
  );
};

export default DeleteTopicModal; 