import React from 'react';
import Button from '../../ui/Button.js';
import Select from '../../ui/Select.js';
import { Trash2 } from 'lucide-react';

interface DocumentsToolbarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  selectedTopic: string | undefined;
  onTopicChange: (value: string | undefined) => void;
  topics: string[];
  onDeleteTopic: () => void;
  isDeletingTopic: boolean;
  showDeleteButton: boolean;
}

const DocumentsToolbar: React.FC<DocumentsToolbarProps> = ({
  searchQuery,
  onSearchChange,
  selectedTopic,
  onTopicChange,
  topics,
  onDeleteTopic,
  isDeletingTopic,
  showDeleteButton,
}) => (
  <div className="mt-2 sm:mt-0 flex flex-row items-center gap-4">
    <div className="w-48">
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by filename..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 \
                   rounded-md shadow-sm text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400\
                   focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    </div>
    <div className="w-48">
      <Select
        value={selectedTopic}
        onChange={(value) => onTopicChange(value === '' ? undefined : value)}
        options={[
          { value: '', label: 'All Topics' },
          ...topics.map(topic => ({ value: topic, label: topic }))
        ]}
      />
    </div>
    {showDeleteButton && (
      <Button
        variant="danger"
        onClick={onDeleteTopic}
        isLoading={isDeletingTopic}
        icon={<Trash2 className="h-4 w-4" />}
      >
        Delete Topic
      </Button>
    )}
  </div>
);

export default DocumentsToolbar; 