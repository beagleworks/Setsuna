import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { RateLimiter, getClientIP } from './rate-limiter';

describe('RateLimiter', () => {
  let rateLimiter: RateLimiter;

  beforeEach(() => {
    rateLimiter = new RateLimiter({
      windowMs: 60000, // 1分
      maxRequests: 30,
    });
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('check', () => {
    it('制限内のリクエストを許可する', () => {
      const result = rateLimiter.check('192.168.1.1');

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(30);
    });

    it('リクエスト後に残り回数が減少する', () => {
      rateLimiter.increment('192.168.1.1');
      const result = rateLimiter.check('192.168.1.1');

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(29);
    });

    it('制限を超えたリクエストを拒否する', () => {
      const ip = '192.168.1.1';

      // 30回リクエストを送信
      for (let i = 0; i < 30; i++) {
        rateLimiter.increment(ip);
      }

      const result = rateLimiter.check(ip);

      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it('ウィンドウリセット後にリクエストを許可する', () => {
      const ip = '192.168.1.1';

      // 30回リクエストを送信
      for (let i = 0; i < 30; i++) {
        rateLimiter.increment(ip);
      }

      // 制限に達していることを確認
      expect(rateLimiter.check(ip).allowed).toBe(false);

      // 1分経過
      vi.advanceTimersByTime(60001);

      // リクエストが許可されることを確認
      const result = rateLimiter.check(ip);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(30);
    });

    it('リセット時刻を正しく返す', () => {
      const now = Date.now();
      vi.setSystemTime(now);

      rateLimiter.increment('192.168.1.1');
      const result = rateLimiter.check('192.168.1.1');

      // リセット時刻は現在時刻 + ウィンドウサイズ
      expect(result.resetAt).toBe(now + 60000);
    });

    it('異なるIPは独立してカウントされる', () => {
      const ip1 = '192.168.1.1';
      const ip2 = '192.168.1.2';

      // IP1で30回リクエスト
      for (let i = 0; i < 30; i++) {
        rateLimiter.increment(ip1);
      }

      // IP1は制限に達している
      expect(rateLimiter.check(ip1).allowed).toBe(false);

      // IP2は制限に達していない
      const result = rateLimiter.check(ip2);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(30);
    });
  });

  describe('increment', () => {
    it('カウントを増加させる', () => {
      const ip = '192.168.1.1';

      expect(rateLimiter.check(ip).remaining).toBe(30);

      rateLimiter.increment(ip);
      expect(rateLimiter.check(ip).remaining).toBe(29);

      rateLimiter.increment(ip);
      expect(rateLimiter.check(ip).remaining).toBe(28);
    });

    it('新しいIPの場合はエントリを作成する', () => {
      const ip = '10.0.0.1';

      rateLimiter.increment(ip);
      const result = rateLimiter.check(ip);

      expect(result.remaining).toBe(29);
    });
  });

  describe('cleanup', () => {
    it('期限切れのエントリを削除する', () => {
      const ip = '192.168.1.1';

      rateLimiter.increment(ip);

      // 1分以上経過
      vi.advanceTimersByTime(61000);

      // クリーンアップを実行
      rateLimiter.cleanup();

      // 新しいエントリとしてカウントされる
      const result = rateLimiter.check(ip);
      expect(result.remaining).toBe(30);
    });
  });
});

describe('getClientIP', () => {
  it('x-forwarded-forヘッダーからIPを取得する', () => {
    const request = new Request('http://localhost', {
      headers: {
        'x-forwarded-for': '203.0.113.195, 70.41.3.18, 150.172.238.178',
      },
    });

    const ip = getClientIP(request);

    expect(ip).toBe('203.0.113.195');
  });

  it('x-real-ipヘッダーからIPを取得する', () => {
    const request = new Request('http://localhost', {
      headers: {
        'x-real-ip': '203.0.113.195',
      },
    });

    const ip = getClientIP(request);

    expect(ip).toBe('203.0.113.195');
  });

  it('ヘッダーがない場合はunknownを返す', () => {
    const request = new Request('http://localhost');

    const ip = getClientIP(request);

    expect(ip).toBe('unknown');
  });

  it('x-forwarded-forがx-real-ipより優先される', () => {
    const request = new Request('http://localhost', {
      headers: {
        'x-forwarded-for': '203.0.113.100',
        'x-real-ip': '203.0.113.200',
      },
    });

    const ip = getClientIP(request);

    expect(ip).toBe('203.0.113.100');
  });
});
