'use client';

import { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';

interface CopyButtonProps {
  text: string;
  className?: string;
}

export function CopyButton({ text, className = '' }: CopyButtonProps) {
  const t = useTranslations('copyButton');
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }, [text]);

  return (
    <button
      onClick={handleCopy}
      className={`p-2 border-2 transition-all duration-100 ${
        copied
          ? 'border-[#00ff88] text-[#00ff88] bg-[#00ff88]/10'
          : 'border-neutral-600 text-neutral-400 hover:border-white hover:text-white hover:bg-white/10'
      } ${className}`}
      aria-label={copied ? t('copied') : t('copy')}
      aria-pressed={copied}
    >
      {copied ? (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
          />
        </svg>
      )}
    </button>
  );
}
