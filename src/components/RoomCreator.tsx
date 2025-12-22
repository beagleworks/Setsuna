'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from './Button';
import { Card } from './Card';

export function RoomCreator() {
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
        setError(data.error?.message || 'ルームの作成に失敗しました');
      }
    } catch {
      setError('ルームの作成に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card title="新しいルームを作成">
      <p className="text-gray-500 mb-6">
        ルームを作成してコードを共有すると、別のデバイスからアクセスできます
      </p>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
          {error}
        </div>
      )}

      <Button onClick={handleCreate} loading={loading} className="w-full" size="lg">
        ルームを作成する
      </Button>
    </Card>
  );
}
