'use client';

import { useState, useEffect } from 'react';

function formatTimeLeft(ms: number): string {
  if (ms <= 0) return '期限切れ';

  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  const h = hours;
  const m = minutes % 60;
  const s = seconds % 60;

  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export function useCountdown(expiresAt: Date): string {
  const [timeLeft, setTimeLeft] = useState<string>(() => {
    const ms = expiresAt.getTime() - Date.now();
    return formatTimeLeft(ms);
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const ms = expiresAt.getTime() - Date.now();
      setTimeLeft(formatTimeLeft(ms));

      if (ms <= 0) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt]);

  return timeLeft;
}
