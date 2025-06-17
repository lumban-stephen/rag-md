import React, { forwardRef, useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  label?: string;
  options: SelectOption[];
  error?: string;
  fullWidth?: boolean;
  onChange?: (value: string) => void;
}

const Select = forwardRef<HTMLInputElement, SelectProps>(
  ({ label, options, error, className = '', fullWidth = false, value, onChange, ...props }, ref) => {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedLabel, setSelectedLabel] = useState('');
    const [searchText, setSearchText] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    // Update selected label when value changes
    useEffect(() => {
      const option = options.find(opt => opt.value === value);
      setSelectedLabel(option ? option.label : 'Select an option');
    }, [value, options]);

    // Focus search input when dropdown opens
    useEffect(() => {
      if (isOpen && searchInputRef.current) {
        searchInputRef.current.focus();
      } else {
        setSearchText('');
      }
    }, [isOpen]);

    // Close dropdown when clicking outside
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
          setIsOpen(false);
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (option: SelectOption) => {
      if (onChange) {
        onChange(option.value);
      }
      setIsOpen(false);
    };

    const handleTriggerClick = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsOpen(!isOpen);
    };

    // Filter options based on search text
    const filteredOptions = options.filter(option =>
      option.label.toLowerCase().includes(searchText.toLowerCase())
    );

    return (
      <div className={`${fullWidth ? 'w-full' : ''} mb-4 relative`} ref={dropdownRef}>
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {label}
          </label>
        )}
        <div
          className={`relative h-[38px] flex items-center px-3 bg-white border border-gray-300 rounded-md shadow-sm 
                     text-gray-700 cursor-pointer ${fullWidth ? 'w-full' : ''} 
                     ${error ? 'border-red-500' : ''} ${className}`}
          onClick={handleTriggerClick}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setIsOpen(!isOpen);
            }
          }}
        >
          <div className="flex justify-between items-center w-full">
            <span>{selectedLabel}</span>
            <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'transform rotate-180' : ''}`} />
          </div>
        </div>
        {isOpen && (
          <div 
            className="absolute z-[100] mt-1 bg-white border border-gray-300 rounded-md shadow-lg min-w-[200px]"
            style={{ 
              pointerEvents: 'auto',
              width: 'max-content',
              minWidth: '100%'
            }}
          >
            {/* Search input */}
            <div className="sticky top-0 bg-white border-b border-gray-200 p-2 z-10">
              <input
                ref={searchInputRef}
                type="text"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="Search..."
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
            {/* Options container with fixed height */}
            <div className="max-h-[160px] overflow-y-auto">
              {/* Filtered options */}
              {filteredOptions.length > 0 ? (
                filteredOptions.map((option) => (
                  <div
                    key={option.value}
                    className={`px-3 py-2 cursor-pointer hover:bg-gray-100 ${
                      option.value === value ? 'bg-blue-50' : ''
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelect(option);
                    }}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    role="option"
                    aria-selected={option.value === value}
                  >
                    {option.label}
                  </div>
                ))
              ) : (
                <div className="px-3 py-2 text-gray-500 text-sm">
                  No options found
                </div>
              )}
            </div>
          </div>
        )}
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
        <div className="flex gap-2 items-center">
          <Select
            value={value}
            onChange={onChange}
            options={topics}
            className={`flex-1 ${props.error ? 'border-red-500' : ''}`}
            {...props}
            label={undefined}
          />
          <button
            onClick={() => setIsAddingNew(true)}
            className="h-[38px] px-3 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 
                     focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2
                     flex items-center justify-center whitespace-nowrap"
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