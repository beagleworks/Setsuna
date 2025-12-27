import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useThrottle } from './useThrottle';

describe('useThrottle', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('最初の呼び出しは即座に実行される', () => {
    const fn = vi.fn();
    const { result } = renderHook(() => useThrottle(fn, 1000));

    act(() => {
      result.current.throttledFn('arg1');
    });

    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith('arg1');
  });

  it('制限時間内の連続呼び出しは無視される', () => {
    const fn = vi.fn();
    const { result } = renderHook(() => useThrottle(fn, 1000));

    act(() => {
      result.current.throttledFn('first');
      result.current.throttledFn('second');
      result.current.throttledFn('third');
    });

    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith('first');
  });

  it('制限時間経過後は再度実行できる', () => {
    const fn = vi.fn();
    const { result } = renderHook(() => useThrottle(fn, 1000));

    act(() => {
      result.current.throttledFn('first');
    });

    expect(fn).toHaveBeenCalledTimes(1);

    // 1秒経過
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    act(() => {
      result.current.throttledFn('second');
    });

    expect(fn).toHaveBeenCalledTimes(2);
    expect(fn).toHaveBeenLastCalledWith('second');
  });

  it('遅延値が変わっても正しく動作する', () => {
    const fn = vi.fn();
    const { result, rerender } = renderHook(({ delay }) => useThrottle(fn, delay), {
      initialProps: { delay: 1000 },
    });

    act(() => {
      result.current.throttledFn('first');
    });

    expect(fn).toHaveBeenCalledTimes(1);

    // delayを500msに変更
    rerender({ delay: 500 });

    // 500ms経過
    act(() => {
      vi.advanceTimersByTime(500);
    });

    act(() => {
      result.current.throttledFn('second');
    });

    // 新しいdelayが適用されている
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('isThrottledが正しく更新される', () => {
    const fn = vi.fn();
    const { result } = renderHook(() => useThrottle(fn, 1000));

    // 最初はスロットル中ではない
    expect(result.current.isThrottled).toBe(false);

    act(() => {
      result.current.throttledFn('first');
    });

    // 呼び出し後はスロットル中
    expect(result.current.isThrottled).toBe(true);

    // 1秒経過
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    // スロットル解除
    expect(result.current.isThrottled).toBe(false);
  });

  it('remainingTimeが正しく計算される', () => {
    const fn = vi.fn();
    const { result } = renderHook(() => useThrottle(fn, 1000));

    // 最初は0
    expect(result.current.remainingTime).toBe(0);

    act(() => {
      result.current.throttledFn('first');
    });

    // 呼び出し直後は約1000ms
    expect(result.current.remainingTime).toBeGreaterThan(900);
    expect(result.current.remainingTime).toBeLessThanOrEqual(1000);

    // 500ms経過
    act(() => {
      vi.advanceTimersByTime(500);
    });

    // 約500ms残り
    expect(result.current.remainingTime).toBeGreaterThan(400);
    expect(result.current.remainingTime).toBeLessThanOrEqual(500);
  });

  it('コンポーネントがアンマウントされてもエラーにならない', () => {
    const fn = vi.fn();
    const { result, unmount } = renderHook(() => useThrottle(fn, 1000));

    act(() => {
      result.current.throttledFn('first');
    });

    // アンマウント
    unmount();

    // タイマーが進んでもエラーにならない
    expect(() => {
      vi.advanceTimersByTime(1000);
    }).not.toThrow();
  });
});
