import React, { forwardRef } from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  fullWidth?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', fullWidth = false, ...props }, ref) => {
    return (
      <div className={`${fullWidth ? 'w-full' : ''} mb-4`}>
        {label && (
          <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-1">
            {label}
          </label>
        )}
        <input
          className={`px-3 py-2 bg-[hsl(var(--background))] border border-[hsl(var(--input))] rounded-md shadow-sm
                     placeholder-[hsl(var(--muted-foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]
                     focus:border-[hsl(var(--ring))] ${fullWidth ? 'w-full' : ''} ${error ? 'border-[hsl(var(--destructive))]' : ''} ${className}`}
          ref={ref}
          {...props}
        />
        {error && <p className="mt-1 text-sm text-[hsl(var(--destructive))]">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;