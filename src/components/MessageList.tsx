'use client';

import { Message } from '@/types/api';
import { CopyButton } from './CopyButton';

interface MessageListProps {
  messages: Message[];
}

export function MessageList({ messages }: MessageListProps) {
  if (messages.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <p>まだメッセージがありません</p>
        <p className="text-sm mt-1">テキストを入力して送信してください</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">共有されたテキスト</h3>

      {messages.map((message) => (
        <div
          key={message.id}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 animate-fadeIn"
        >
          <div className="flex justify-between items-start gap-4">
            <p className="flex-1 whitespace-pre-wrap break-words text-gray-900">
              {message.content}
            </p>
            <CopyButton text={message.content} data-testid="copy-button" />
          </div>

          <div className="mt-3 text-right">
            <time className="text-xs text-gray-400">
              {new Date(message.createdAt).toLocaleTimeString('ja-JP')}
            </time>
          </div>
        </div>
      ))}
    </div>
  );
}
