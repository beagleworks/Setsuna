import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { validatePassword, generateToken, verifyToken, getTokenFromCookies } from './admin-auth';

describe('admin-auth', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = {
      ...originalEnv,
      ADMIN_PASSWORD: 'test-password-123',
      ADMIN_JWT_SECRET: 'test-jwt-secret-key-for-testing',
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('validatePassword', () => {
    it('正しいパスワードでtrueを返す', () => {
      expect(validatePassword('test-password-123')).toBe(true);
    });

    it('誤ったパスワードでfalseを返す', () => {
      expect(validatePassword('wrong-password')).toBe(false);
    });

    it('空のパスワードでfalseを返す', () => {
      expect(validatePassword('')).toBe(false);
    });

    it('nullやundefinedでfalseを返す', () => {
      expect(validatePassword(null as unknown as string)).toBe(false);
      expect(validatePassword(undefined as unknown as string)).toBe(false);
    });

    it('環境変数が設定されていない場合falseを返す', () => {
      delete process.env.ADMIN_PASSWORD;
      expect(validatePassword('any-password')).toBe(false);
    });
  });

  describe('generateToken', () => {
    it('有効なJWTトークンを生成する', async () => {
      const token = await generateToken();
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT format: header.payload.signature
    });

    it('生成されたトークンは検証可能', async () => {
      const token = await generateToken();
      const payload = await verifyToken(token);
      expect(payload).not.toBeNull();
      expect(payload?.role).toBe('admin');
    });
  });

  describe('verifyToken', () => {
    it('有効なトークンでペイロードを返す', async () => {
      const token = await generateToken();
      const payload = await verifyToken(token);
      expect(payload).not.toBeNull();
      expect(payload?.role).toBe('admin');
    });

    it('ペイロードにiat（発行時刻）を含む', async () => {
      const token = await generateToken();
      const payload = await verifyToken(token);
      expect(payload?.iat).toBeDefined();
      expect(typeof payload?.iat).toBe('number');
    });

    it('ペイロードにexp（有効期限）を含む', async () => {
      const token = await generateToken();
      const payload = await verifyToken(token);
      expect(payload?.exp).toBeDefined();
      expect(typeof payload?.exp).toBe('number');
    });

    it('有効期限は約24時間後に設定される', async () => {
      const beforeGenerate = Math.floor(Date.now() / 1000);
      const token = await generateToken();
      const payload = await verifyToken(token);
      const afterGenerate = Math.floor(Date.now() / 1000);

      const expectedExpiry = 24 * 60 * 60; // 24 hours in seconds
      expect(payload?.exp).toBeGreaterThanOrEqual(beforeGenerate + expectedExpiry - 1);
      expect(payload?.exp).toBeLessThanOrEqual(afterGenerate + expectedExpiry + 1);
    });

    it('不正なトークンでnullを返す', async () => {
      const payload = await verifyToken('invalid-token');
      expect(payload).toBeNull();
    });

    it('改ざんされたトークンでnullを返す', async () => {
      const token = await generateToken();
      const tamperedToken = token.slice(0, -5) + 'xxxxx';
      const payload = await verifyToken(tamperedToken);
      expect(payload).toBeNull();
    });

    it('空のトークンでnullを返す', async () => {
      const payload = await verifyToken('');
      expect(payload).toBeNull();
    });

    it('環境変数が設定されていない場合nullを返す', async () => {
      const token = await generateToken();
      delete process.env.ADMIN_JWT_SECRET;
      const payload = await verifyToken(token);
      expect(payload).toBeNull();
    });
  });

  describe('getTokenFromCookies', () => {
    it('Cookieヘッダーからadmin_tokenを抽出する', () => {
      const cookieHeader = 'admin_token=test-jwt-token; other=value';
      const token = getTokenFromCookies(cookieHeader);
      expect(token).toBe('test-jwt-token');
    });

    it('admin_tokenがない場合nullを返す', () => {
      const cookieHeader = 'other=value; session=abc';
      const token = getTokenFromCookies(cookieHeader);
      expect(token).toBeNull();
    });

    it('空のCookieヘッダーでnullを返す', () => {
      const token = getTokenFromCookies('');
      expect(token).toBeNull();
    });

    it('nullのCookieヘッダーでnullを返す', () => {
      const token = getTokenFromCookies(null);
      expect(token).toBeNull();
    });

    it('複数のCookieがある場合も正しく抽出する', () => {
      const cookieHeader = 'first=1; admin_token=my-token-value; last=2';
      const token = getTokenFromCookies(cookieHeader);
      expect(token).toBe('my-token-value');
    });
  });
});
