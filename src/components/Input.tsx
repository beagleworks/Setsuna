'use client';

import { InputHTMLAttributes, forwardRef, useId } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ error, className = '', id, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id || generatedId;
    const errorId = `${inputId}-error`;

    const baseClasses =
      'w-full px-4 py-3 bg-black border-2 text-white font-mono placeholder:text-neutral-400 transition-colors duration-100 focus:outline-none focus:bg-neutral-900';
    const errorClasses = error ? 'border-[#ff3366] text-[#ff3366]' : 'border-white';

    return (
      <div className="w-full">
        <input
          ref={ref}
          id={inputId}
          className={`${baseClasses} ${errorClasses} ${className}`}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : undefined}
          {...props}
        />
        {error && (
          <p id={errorId} className="mt-2 text-sm text-[#ff3366] font-mono" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
