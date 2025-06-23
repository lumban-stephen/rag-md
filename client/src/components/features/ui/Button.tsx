import React from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  icon,
  fullWidth = false,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-md transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]';
  
  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };

  const variantStyles = {
    primary: 'bg-blue-500 hover:bg-blue-400 text-white focus:ring-blue-500 dark:bg-blue-600 dark:hover:bg-blue-500 shadow-sm hover:shadow-md dark:shadow-blue-900/20',
    secondary: 'bg-gray-200 hover:bg-gray-100 text-gray-700 focus:ring-gray-500 dark:bg-gray-700 dark:hover:bg-gray-500 dark:text-gray-200 shadow-sm hover:shadow-md dark:shadow-gray-900/20',
    danger: 'bg-red-500 hover:bg-red-400 text-white focus:ring-red-500 dark:bg-red-600 dark:hover:bg-red-500 dark:shadow-red-900/20 shadow-sm hover:shadow-md',
    ghost: 'bg-transparent hover:bg-gray-100/80 text-gray-700 focus:ring-gray-500 dark:hover:bg-gray-600/80 dark:text-gray-200 hover:shadow-sm dark:hover:shadow-gray-900/20'
  };

  const widthStyles = fullWidth ? 'w-full' : '';

  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${widthStyles} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
      )}
      {icon && !isLoading && (
        <span className="mr-2">{icon}</span>
      )}
      {children}
    </button>
  );
};

export default Button;