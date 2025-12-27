'use client';

import { MessageSquare, Clock } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { Message } from '@/types/api';
import { CopyButton } from './CopyButton';

interface MessageListProps {
  messages: Message[];
}

export function MessageList({ messages }: MessageListProps) {
  const t = useTranslations('messageList');
  const locale = useLocale();

  // Map locale to locale string for toLocaleTimeString
  const localeString = locale === 'ja' ? 'ja-JP' : 'en-US';

  if (messages.length === 0) {
    return (
      <div className="text-center py-16 text-neutral-500">
        <div className="w-16 h-16 mx-auto mb-4 border-2 border-neutral-600 flex items-center justify-center">
          <MessageSquare className="w-8 h-8 text-neutral-600" />
        </div>
        <p className="font-bold uppercase tracking-wider">{t('empty.title')}</p>
        <p className="text-sm mt-2 text-neutral-600">{t('empty.description')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-white uppercase tracking-wider">{t('title')}</h3>

      {messages.map((message, index) => (
        <div
          key={message.id}
          className="bg-neutral-900 border-2 border-neutral-600 p-4 animate-fadeIn hover:border-white transition-colors duration-100"
          style={{ animationDelay: `${Math.min(index, 5) * 30}ms` }}
        >
          <div className="flex justify-between items-start gap-4">
            <p className="flex-1 whitespace-pre-wrap break-words text-white font-mono leading-relaxed">
              {message.content}
            </p>
            <CopyButton text={message.content} data-testid="copy-button" />
          </div>

          <div className="mt-3 flex items-center justify-end gap-1.5">
            <Clock className="w-3.5 h-3.5 text-neutral-600" />
            <time className="text-xs text-neutral-500 font-mono">
              {new Date(message.createdAt).toLocaleTimeString(localeString)}
            </time>
          </div>
        </div>
      ))}
    </div>
  );
}
