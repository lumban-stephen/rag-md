import React, { forwardRef } from 'react';

export interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  fullWidth?: boolean;
}

const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ label, error, className = '', fullWidth = false, rows = 4, ...props }, ref) => {
    return (
      <div className={`${fullWidth ? 'w-full' : ''} mb-4`}>
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {label}
          </label>
        )}
        <textarea
          className={`px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm
                     placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500
                     focus:border-blue-500 ${fullWidth ? 'w-full' : ''} ${error ? 'border-red-500' : ''} ${className}`}
          ref={ref}
          rows={rows}
          {...props}
        />
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      </div>
    );
  }
);

TextArea.displayName = 'TextArea';

export default TextArea;