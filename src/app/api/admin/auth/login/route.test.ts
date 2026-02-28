import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { POST } from './route';
import { ADMIN_LOGIN_RATE_LIMIT } from '@/types/admin';

describe('POST /api/admin/auth/login', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    delete (globalThis as { adminLoginRateLimiter?: unknown }).adminLoginRateLimiter;
    process.env = {
      ...originalEnv,
      ADMIN_PASSWORD: 'test-admin-password',
      ADMIN_JWT_SECRET: 'test-jwt-secret-key-for-testing-1234567890',
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('正しいパスワードでログイン成功', async () => {
    const request = new Request('http://localhost/api/admin/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: 'test-admin-password' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.expiresAt).toBeDefined();
  });

  it('誤ったパスワードで401を返す', async () => {
    const request = new Request('http://localhost/api/admin/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: 'wrong-password' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
    expect(data.error.code).toBe('INVALID_PASSWORD');
  });

  it('パスワード未指定で400を返す', async () => {
    const request = new Request('http://localhost/api/admin/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
  });

  it('空のパスワードで400を返す', async () => {
    const request = new Request('http://localhost/api/admin/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: '' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
  });

  it('ログイン成功時にSet-Cookieヘッダーが設定される', async () => {
    const request = new Request('http://localhost/api/admin/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: 'test-admin-password' }),
    });

    const response = await POST(request);
    const setCookie = response.headers.get('Set-Cookie');

    expect(setCookie).toBeDefined();
    expect(setCookie).toContain('admin_token=');
    expect(setCookie).toContain('HttpOnly');
    expect(setCookie).toContain('Path=/');
  });

  it('不正なJSONで400を返す', async () => {
    const request = new Request('http://localhost/api/admin/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'invalid json',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
  });

  it('ログイン試行回数が上限を超えると429を返す', async () => {
    const requests = Array.from(
      { length: ADMIN_LOGIN_RATE_LIMIT + 1 },
      () =>
        new Request('http://localhost/api/admin/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '203.0.113.10' },
          body: JSON.stringify({ password: 'wrong-password' }),
        })
    );

    let lastResponse: Response | null = null;
    for (const request of requests) {
      lastResponse = await POST(request);
    }

    expect(lastResponse).not.toBeNull();
    expect(lastResponse?.status).toBe(429);
    const data = await lastResponse!.json();
    expect(data.error.code).toBe('RATE_LIMIT_EXCEEDED');
  });
});
