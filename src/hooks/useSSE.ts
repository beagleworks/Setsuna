'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Message } from '@/types/api';

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

  const { onMessage, onConnected, onError } = options;

  const connect = useCallback(() => {
    // 既存の接続をクリーンアップ
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    setError(null);

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

      // 自動再接続（5秒後）
      reconnectTimeoutRef.current = setTimeout(() => {
        connect();
      }, 5000);
    };
  }, [roomCode, onMessage, onConnected, onError]);

  const reconnect = useCallback(() => {
    connect();
  }, [connect]);

  useEffect(() => {
    connect();

    return () => {
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
