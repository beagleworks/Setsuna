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
  onReconnecting?: (attempt: number, delay: number) => void;
}

interface UseSSEReturn {
  isConnected: boolean;
  error: string | null;
  reconnect: () => void;
  /** 現在の再接続試行回数 */
  retryCount: number;
}

// 指数バックオフの設定
const BACKOFF_BASE_DELAY = 1000; // 1秒
const BACKOFF_MAX_DELAY = 30000; // 30秒
const BACKOFF_MAX_RETRIES = 10; // 最大再試行回数

/**
 * 指数バックオフの遅延時間を計算する
 * ジッターを追加してリクエストを分散
 */
function calculateBackoffDelay(retryCount: number): number {
  const delay = Math.min(BACKOFF_BASE_DELAY * Math.pow(2, retryCount), BACKOFF_MAX_DELAY);
  // ジッター: 0.5〜1.5倍のランダム化
  return Math.floor(delay * (0.5 + Math.random()));
}

export function useSSE(roomCode: string, options: UseSSEOptions = {}): UseSSEReturn {
  const isValid = useMemo(() => isValidRoomCode(roomCode), [roomCode]);
  const [connectionState, setConnectionState] = useState<{
    isConnected: boolean;
    connectionError: string | null;
  }>({ isConnected: false, connectionError: null });
  const [retryCount, setRetryCount] = useState(0);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const shouldReconnectRef = useRef(true);
  const retryCountRef = useRef(0);

  // コールバックを ref で保持（依存配列から除外するため）
  const onMessageRef = useRef(options.onMessage);
  const onConnectedRef = useRef(options.onConnected);
  const onErrorRef = useRef(options.onError);
  const onReconnectingRef = useRef(options.onReconnecting);

  // コールバックが変わったら ref を更新
  useEffect(() => {
    onMessageRef.current = options.onMessage;
    onConnectedRef.current = options.onConnected;
    onErrorRef.current = options.onError;
    onReconnectingRef.current = options.onReconnecting;
  });

  // reconnect 用の ref（再接続ロジックで使用）
  const setupConnectionRef = useRef<() => void>(() => {});

  const reconnect = useCallback(() => {
    shouldReconnectRef.current = true;
    retryCountRef.current = 0;
    setRetryCount(0);
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
        // 接続成功時はリトライカウントをリセット
        retryCountRef.current = 0;
        setRetryCount(0);
        setConnectionState({ isConnected: true, connectionError: null });
        onConnectedRef.current?.();
      });

      eventSource.addEventListener('message', (event) => {
        try {
          const message = JSON.parse(event.data) as Message;
          onMessageRef.current?.(message);
        } catch (e) {
          console.error('Failed to parse message:', e);
        }
      });

      eventSource.addEventListener('ping', () => {
        // キープアライブ - 何もしない
      });

      eventSource.onerror = () => {
        setConnectionState({ isConnected: false, connectionError: '接続が切断されました' });
        onErrorRef.current?.();

        // 再接続が許可されている場合のみ自動再接続（指数バックオフ）
        if (shouldReconnectRef.current) {
          const currentRetry = retryCountRef.current;

          // 最大再試行回数を超えた場合は諦める
          if (currentRetry >= BACKOFF_MAX_RETRIES) {
            setConnectionState({
              isConnected: false,
              connectionError: '接続に失敗しました。ページを再読み込みしてください',
            });
            return;
          }

          const delay = calculateBackoffDelay(currentRetry);
          onReconnectingRef.current?.(currentRetry + 1, delay);

          reconnectTimeoutRef.current = setTimeout(() => {
            if (shouldReconnectRef.current) {
              retryCountRef.current++;
              setRetryCount(retryCountRef.current);
              setupConnectionRef.current();
            }
          }, delay);
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
  }, [roomCode, isValid]);

  // 派生状態: 無効なルームコードの場合はエラーを返す
  const error = !isValid ? '無効なルームコードです' : connectionState.connectionError;
  const isConnected = isValid && connectionState.isConnected;

  return { isConnected, error, reconnect, retryCount };
}
