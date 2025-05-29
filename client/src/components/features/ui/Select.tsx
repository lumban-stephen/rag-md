import React, { forwardRef, useState } from 'react';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: SelectOption[];
  error?: string;
  fullWidth?: boolean;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, options, error, className = '', fullWidth = false, ...props }, ref) => {
    return (
      <div className={`${fullWidth ? 'w-full' : ''} mb-4`}>
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {label}
          </label>
        )}
        <select
          className={`px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm 
                     text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 
                     focus:border-blue-500 ${fullWidth ? 'w-full' : ''} ${error ? 'border-red-500' : ''} ${className}`}
          ref={ref}
          {...props}
        >
          <option value="">Select an option</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      </div>
    );
  }
);

Select.displayName = 'Select';

export interface TopicSelectProps extends Omit<SelectProps, 'options'> {
  topics: SelectOption[];
  onAddTopic: (newTopic: string) => void;
}

export const TopicSelect: React.FC<TopicSelectProps> = ({
  topics,
  onAddTopic,
  value,
  onChange,
  fullWidth,
  ...props
}) => {
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newTopic, setNewTopic] = useState('');

  const handleAddTopic = () => {
    if (newTopic.trim()) {
      onAddTopic(newTopic.trim());
      setNewTopic('');
      setIsAddingNew(false);
    }
  };

  return (
    <div className={`${fullWidth ? 'w-full' : ''} mb-4`}>
      {props.label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {props.label}
        </label>
      )}
      {isAddingNew ? (
        <div className="flex gap-2">
          <input
            type="text"
            value={newTopic}
            onChange={(e) => setNewTopic(e.target.value)}
            placeholder="Enter new topic"
            className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm 
                     text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 
                     focus:border-blue-500"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleAddTopic();
              } else if (e.key === 'Escape') {
                setIsAddingNew(false);
                setNewTopic('');
              }
            }}
          />
          <button
            onClick={handleAddTopic}
            className="px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 
                     focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Add
          </button>
          <button
            onClick={() => {
              setIsAddingNew(false);
              setNewTopic('');
            }}
            className="px-3 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 
                     focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            Cancel
          </button>
        </div>
      ) : (
        <div className="flex gap-2">
          <select
            value={value}
            onChange={onChange}
            className={`flex-1 px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm 
                     text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 
                     focus:border-blue-500 ${props.error ? 'border-red-500' : ''}`}
            {...props}
          >
            <option value="">Select a topic</option>
            {topics.map((topic) => (
              <option key={topic.value} value={topic.value}>
                {topic.label}
              </option>
            ))}
          </select>
          <button
            onClick={() => setIsAddingNew(true)}
            className="px-3 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 
                     focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            + New
          </button>
        </div>
      )}
      {props.error && <p className="mt-1 text-sm text-red-600">{props.error}</p>}
    </div>
  );
};

export default Select;