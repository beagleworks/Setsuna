'use client';

import Link from 'next/link';
import { ArrowLeft, Clock } from 'lucide-react';
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
    <header className="bg-black border-b-2 border-white py-4 px-6 sticky top-0 z-50">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2 text-neutral-400 hover:text-[#00ff88] transition-colors duration-100 uppercase tracking-wider"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-bold">[戻る]</span>
        </Link>

        <div className="flex flex-col items-center">
          <div className="flex items-center gap-3">
            <span
              className="text-2xl sm:text-3xl font-mono font-bold tracking-[0.3em] text-[#00ff88]"
              data-testid="room-code"
            >
              {code}
            </span>
            <CopyButton text={roomUrl} />
          </div>
          <div className="flex items-center gap-1.5 mt-1 text-sm text-neutral-500 font-mono">
            <Clock className="w-4 h-4" />
            <span>残り: {timeLeft}</span>
          </div>
        </div>

        <div className="w-20" />
      </div>
    </header>
  );
}
