'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from './Button';
import { Card } from './Card';
import { Input } from './Input';

// 許可される文字のパターン（0, O, 1, I, L を除外）
const ALLOWED_PATTERN = /^[A-HJ-KM-NP-Z2-9]*$/;

export function RoomJoiner() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCodeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase();
    // 許可された文字のみを受け付ける
    if (ALLOWED_PATTERN.test(value) && value.length <= 6) {
      setCode(value);
      setError(null);
    }
  }, []);

  const handleJoin = async () => {
    if (code.length !== 6) {
      setError('6文字のルームコードを入力してください');
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
        setError('ルームが見つかりません');
      } else if (data.error?.code === 'ROOM_EXPIRED') {
        setError('ルームの有効期限が切れています');
      } else {
        setError(data.error?.message || 'ルームへの参加に失敗しました');
      }
    } catch {
      setError('ルームへの参加に失敗しました');
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
    <Card title="既存のルームに参加">
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">ルームコード</label>
        <Input
          value={code}
          onChange={handleCodeChange}
          onKeyDown={handleKeyDown}
          placeholder="A B C D 2 3"
          maxLength={6}
          error={error || undefined}
          className="text-center text-2xl tracking-widest font-mono"
        />
      </div>

      <Button
        onClick={handleJoin}
        loading={loading}
        disabled={code.length !== 6}
        className="w-full"
        size="lg"
      >
        参加する
      </Button>
    </Card>
  );
}
