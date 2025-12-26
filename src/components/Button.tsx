'use client';

import { ButtonHTMLAttributes, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  children: ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  children,
  className = '',
  ...props
}: ButtonProps) {
  // ブルータリストスタイル: 角丸なし、太いボーダー、大文字
  const baseClasses = `
    inline-flex items-center justify-center gap-2
    font-bold uppercase tracking-wider
    border-2
    transition-all duration-100
    focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
    active:translate-x-[2px] active:translate-y-[2px]
    disabled:opacity-50 disabled:cursor-not-allowed disabled:active:translate-x-0 disabled:active:translate-y-0
  `;

  const variantClasses = {
    primary: `
      bg-[#00ff88] text-black border-[#00ff88]
      hover:bg-black hover:text-[#00ff88]
      focus-visible:ring-[#00ff88]
    `,
    secondary: `
      bg-neutral-900 text-white border-white
      hover:bg-white hover:text-black
      focus-visible:ring-white
    `,
    outline: `
      bg-transparent text-white border-white
      hover:bg-white hover:text-black
      focus-visible:ring-white
    `,
    ghost: `
      bg-transparent text-neutral-400 border-transparent
      hover:text-white hover:border-white
      focus-visible:ring-white
    `,
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2.5 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  const classes = [baseClasses, variantClasses[variant], sizeClasses[size], className].join(' ');

  return (
    <button className={classes} disabled={disabled || loading} {...props}>
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      {children}
    </button>
  );
}
