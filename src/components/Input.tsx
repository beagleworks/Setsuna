'use client';

import { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ error, className = '', ...props }, ref) => {
    const baseClasses =
      'w-full px-4 py-2 border rounded-lg transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent';
    const errorClasses = error ? 'border-red-500' : 'border-gray-300';

    return (
      <div className="w-full">
        <input ref={ref} className={`${baseClasses} ${errorClasses} ${className}`} {...props} />
        {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
