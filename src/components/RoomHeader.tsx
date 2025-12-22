'use client';

import Link from 'next/link';
import { CopyButton } from './CopyButton';
import { useCountdown } from '@/hooks/useCountdown';

interface RoomHeaderProps {
  code: string;
  expiresAt: string;
}

export function RoomHeader({ code, expiresAt }: RoomHeaderProps) {
  const timeLeft = useCountdown(new Date(expiresAt));

  const roomUrl = typeof window !== 'undefined' ? `${window.location.origin}/room/${code}` : '';

  return (
    <header className="bg-white border-b border-gray-200 py-4 px-6">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2 text-gray-500 hover:text-gray-700 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          <span>戻る</span>
        </Link>
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-2">
            <span
              className="text-2xl font-mono font-bold tracking-widest text-gray-900"
              data-testid="room-code"
            >
              {code}
            </span>
            <CopyButton text={roomUrl} />
          </div>
          <span className="text-sm text-gray-400">残り: {timeLeft}</span>
        </div>
        <div className="w-16" /> {/* Spacer for centering */}
      </div>
    </header>
  );
}
