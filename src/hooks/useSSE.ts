'use client';

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
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
  const isValid = useMemo(() => isValidRoomCode(roomCode), [roomCode]);
  const [connectionState, setConnectionState] = useState<{
    isConnected: boolean;
    connectionError: string | null;
  }>({ isConnected: false, connectionError: null });
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const shouldReconnectRef = useRef(true);

  const { onMessage, onConnected, onError } = options;

  // reconnect 用の ref（再接続ロジックで使用）
  const setupConnectionRef = useRef<() => void>(() => {});

  const reconnect = useCallback(() => {
    shouldReconnectRef.current = true;
    setupConnectionRef.current();
  }, []);

  useEffect(() => {
    // 無効なルームコードの場合は接続しない
    if (!isValid) {
      return;
    }

    // 接続セットアップ関数
    const setupConnection = () => {
      // 既存の接続をクリーンアップ
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }

      setConnectionState({ isConnected: false, connectionError: null });
      shouldReconnectRef.current = true;

      const eventSource = new EventSource(`/api/sse/${roomCode}`);
      eventSourceRef.current = eventSource;

      eventSource.addEventListener('connected', () => {
        setConnectionState({ isConnected: true, connectionError: null });
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
        setConnectionState({ isConnected: false, connectionError: '接続が切断されました' });
        onError?.();

        // 再接続が許可されている場合のみ自動再接続（5秒後）
        if (shouldReconnectRef.current) {
          reconnectTimeoutRef.current = setTimeout(() => {
            if (shouldReconnectRef.current) {
              setupConnectionRef.current();
            }
          }, 5000);
        }
      };
    };

    // ref を更新して reconnect から呼び出せるようにする
    setupConnectionRef.current = setupConnection;

    // 初回接続
    setupConnection();

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
  }, [roomCode, isValid, onMessage, onConnected, onError]);

  // 派生状態: 無効なルームコードの場合はエラーを返す
  const error = !isValid ? '無効なルームコードです' : connectionState.connectionError;
  const isConnected = isValid && connectionState.isConnected;

  return { isConnected, error, reconnect };
}
