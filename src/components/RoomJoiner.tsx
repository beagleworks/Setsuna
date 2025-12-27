'use client';

import { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { Button } from './Button';
import { Card } from './Card';
import { Input } from './Input';

// Allowed character pattern (excluding 0, O, 1, I, L)
const ALLOWED_PATTERN = /^[A-HJ-KM-NP-Z2-9]*$/;

export function RoomJoiner() {
  const t = useTranslations('roomJoiner');
  const router = useRouter();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCodeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase();
    // Accept only allowed characters
    if (ALLOWED_PATTERN.test(value) && value.length <= 6) {
      setCode(value);
      setError(null);
    }
  }, []);

  const handleJoin = async () => {
    if (code.length !== 6) {
      setError(t('error.invalidLength'));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/rooms/${code}`);
      const data = await response.json();

      if (data.success) {
        router.push(`/room/${code}`);
      } else if (data.error?.code === 'ROOM_NOT_FOUND') {
        setError(t('error.notFound'));
      } else if (data.error?.code === 'ROOM_EXPIRED') {
        setError(t('error.expired'));
      } else {
        setError(data.error?.message || t('error.failed'));
      }
    } catch {
      setError(t('error.failed'));
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && code.length === 6) {
      handleJoin();
    }
  };

  return (
    <Card title={t('title')}>
      <div className="mb-4">
        <label className="block text-sm font-bold text-neutral-400 mb-2 uppercase tracking-wider">
          {t('label')}
        </label>
        <Input
          value={code}
          onChange={handleCodeChange}
          onKeyDown={handleKeyDown}
          placeholder="A B C D 2 3"
          maxLength={6}
          error={error || undefined}
          className="text-center text-2xl tracking-widest"
        />
      </div>

      <Button
        onClick={handleJoin}
        loading={loading}
        disabled={code.length !== 6}
        className="w-full"
        size="lg"
        variant="secondary"
      >
        {t('button')}
      </Button>
    </Card>
  );
}
