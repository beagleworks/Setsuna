'use client';

import { useCallback, useRef, useState, useEffect, useMemo } from 'react';

interface UseThrottleReturn<T extends (...args: Parameters<T>) => void> {
  /** スロットリングされた関数 */
  throttledFn: (...args: Parameters<T>) => void;
  /** 現在スロットル中かどうか */
  isThrottled: boolean;
  /** 次に実行可能になるまでの残り時間（ミリ秒） */
  remainingTime: number;
}

/**
 * 関数の呼び出しを一定間隔に制限するフック
 *
 * @param fn - スロットリングする関数
 * @param delay - 呼び出し間隔（ミリ秒）
 * @returns スロットリングされた関数とステータス
 *
 * @example
 * ```tsx
 * const { throttledFn, isThrottled, remainingTime } = useThrottle(handleSend, 2000);
 *
 * return (
 *   <button
 *     onClick={() => throttledFn(message)}
 *     disabled={isThrottled}
 *   >
 *     送信 {isThrottled && `(${Math.ceil(remainingTime / 1000)}秒)`}
 *   </button>
 * );
 * ```
 */
export function useThrottle<T extends (...args: Parameters<T>) => void>(
  fn: T,
  delay: number
): UseThrottleReturn<T> {
  const lastCallRef = useRef<number>(0);
  const [isThrottled, setIsThrottled] = useState(false);
  const [remainingTime, setRemainingTime] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // コールバックを ref で保持
  const fnRef = useRef(fn);
  useEffect(() => {
    fnRef.current = fn;
  });

  // クリーンアップ
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const throttledFn = useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now();
      const elapsed = now - lastCallRef.current;

      if (elapsed >= delay) {
        // 制限時間が経過していれば即座に実行
        lastCallRef.current = now;
        setIsThrottled(true);
        setRemainingTime(delay);

        // 残り時間を更新するインターバル
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
        intervalRef.current = setInterval(() => {
          const remaining = Math.max(0, delay - (Date.now() - lastCallRef.current));
          setRemainingTime(remaining);
          if (remaining === 0) {
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
            }
          }
        }, 100);

        // 制限解除タイマー
        if (timerRef.current) {
          clearTimeout(timerRef.current);
        }
        timerRef.current = setTimeout(() => {
          setIsThrottled(false);
          setRemainingTime(0);
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
          }
        }, delay);

        fnRef.current(...args);
      }
      // 制限時間内なら無視
    },
    [delay]
  );

  return useMemo(
    () => ({
      throttledFn,
      isThrottled,
      remainingTime,
    }),
    [throttledFn, isThrottled, remainingTime]
  );
}
