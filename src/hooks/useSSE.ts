'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Message } from '@/types/api';

/**
 * ルームコードの形式を検証する（クライアントサイド用）
 */
function isValidRoomCode(code: string): boolean {
  if (!code || code.length !== 6) return false;
  const pattern = /^[A-HJ-KM-NP-Z2-9]{6}$/;
  return pattern.test(code);
}

interface UseSSEOptions {
  onMessage?: (message: Message) => void;
  onConnected?: () => void;
  onError?: () => void;
}

interface UseSSEReturn {
  isConnected: boolean;
  error: string | null;
  reconnect: () => void;
}

export function useSSE(roomCode: string, options: UseSSEOptions = {}): UseSSEReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const shouldReconnectRef = useRef(true);

  const { onMessage, onConnected, onError } = options;

  const connect = useCallback(() => {
    // 無効なルームコードの場合は接続しない
    if (!isValidRoomCode(roomCode)) {
      setError('無効なルームコードです');
      setIsConnected(false);
      return;
    }

    // 既存の接続をクリーンアップ
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    setError(null);
    shouldReconnectRef.current = true;

    const eventSource = new EventSource(`/api/sse/${roomCode}`);
    eventSourceRef.current = eventSource;

    eventSource.addEventListener('connected', () => {
      setIsConnected(true);
      setError(null);
      onConnected?.();
    });

    eventSource.addEventListener('message', (event) => {
      try {
        const message = JSON.parse(event.data) as Message;
        onMessage?.(message);
      } catch (e) {
        console.error('Failed to parse message:', e);
      }
    });

    eventSource.addEventListener('ping', () => {
      // キープアライブ - 何もしない
    });

    eventSource.onerror = () => {
      setIsConnected(false);
      setError('接続が切断されました');
      onError?.();

      // 再接続が許可されている場合のみ自動再接続（5秒後）
      if (shouldReconnectRef.current) {
        reconnectTimeoutRef.current = setTimeout(() => {
          if (shouldReconnectRef.current) {
            connect();
          }
        }, 5000);
      }
    };
  }, [roomCode, onMessage, onConnected, onError]);

  const reconnect = useCallback(() => {
    shouldReconnectRef.current = true;
    connect();
  }, [connect]);

  useEffect(() => {
    connect();

    return () => {
      // クリーンアップ時は再接続を停止
      shouldReconnectRef.current = false;
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [connect]);

  return { isConnected, error, reconnect };
}
