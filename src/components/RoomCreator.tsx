'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { Button } from './Button';
import { Card } from './Card';

export function RoomCreator() {
  const t = useTranslations('roomCreator');
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/rooms', {
        method: 'POST',
      });

      const data = await response.json();

      if (data.success) {
        router.push(`/room/${data.data.room.code}`);
      } else {
        setError(data.error?.message || t('error.failed'));
      }
    } catch {
      setError(t('error.failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card title={t('title')}>
      <p className="text-neutral-400 mb-6">{t('description')}</p>

      {error && (
        <div
          role="alert"
          className="mb-4 p-3 bg-[#ff3366]/10 border-2 border-[#ff3366] text-[#ff3366] text-sm font-mono"
        >
          {error}
        </div>
      )}

      <Button onClick={handleCreate} loading={loading} className="w-full" size="lg">
        {t('button')}
      </Button>
    </Card>
  );
}
