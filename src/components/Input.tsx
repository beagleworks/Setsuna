'use client';

import { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ error, className = '', ...props }, ref) => {
    const baseClasses =
      'w-full px-4 py-3 bg-black border-2 text-white font-mono placeholder:text-neutral-600 transition-colors duration-100 focus:outline-none focus:bg-neutral-900';
    const errorClasses = error ? 'border-[#ff3366] text-[#ff3366]' : 'border-white';

    return (
      <div className="w-full">
        <input ref={ref} className={`${baseClasses} ${errorClasses} ${className}`} {...props} />
        {error && <p className="mt-2 text-sm text-[#ff3366] font-mono">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
