'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from './Button';
import { MAX_MESSAGE_LENGTH } from '@/types/api';

interface MessageInputProps {
  onSubmit: (content: string) => Promise<void>;
  disabled?: boolean;
}

export function MessageInput({ onSubmit, disabled }: MessageInputProps) {
  const t = useTranslations('messageInput');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isOverLimit = content.length > MAX_MESSAGE_LENGTH;
  const isEmpty = content.trim() === '';

  const handleSubmit = useCallback(async () => {
    if (isEmpty || isOverLimit || loading) return;

    setLoading(true);
    try {
      await onSubmit(content);
      setContent('');
      textareaRef.current?.focus();
    } finally {
      setLoading(false);
    }
  }, [content, isEmpty, isOverLimit, loading, onSubmit]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  // Auto-adjust textarea height
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  }, [content]);

  return (
    <div className="bg-neutral-900 border-2 border-white p-4">
      <textarea
        ref={textareaRef}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={t('placeholder')}
        disabled={disabled || loading}
        className="w-full px-4 py-3 bg-black border-2 border-neutral-600 text-white font-sans placeholder:text-neutral-400 resize-none focus:outline-none focus:border-white transition-colors duration-100"
        rows={3}
      />

      <div className="mt-3 flex items-center justify-between">
        <div className="text-sm font-mono">
          {isOverLimit ? (
            <span className="text-[#ff3366]">
              {content.length.toLocaleString()} / {MAX_MESSAGE_LENGTH.toLocaleString()}{' '}
              {t('charCount')} {t('charCountOver')}
            </span>
          ) : (
            <span className="text-neutral-500">
              {content.length.toLocaleString()} / {MAX_MESSAGE_LENGTH.toLocaleString()}{' '}
              {t('charCount')}
            </span>
          )}
        </div>

        <Button
          onClick={handleSubmit}
          disabled={isEmpty || isOverLimit || disabled}
          loading={loading}
        >
          {t('button')}
        </Button>
      </div>

      <p className="mt-2 text-xs text-neutral-400 font-mono uppercase tracking-wider">
        {t('hint')}
      </p>
    </div>
  );
}
