/**
 * 管理者認証ロジック
 * JWT生成・検証、パスワード検証を担当
 */

import { SignJWT, jwtVerify } from 'jose';
import type { AdminJWTPayload } from '@/types/admin';
import { ADMIN_SESSION_EXPIRY_HOURS } from '@/types/admin';

const COOKIE_NAME = 'admin_token';

/**
 * パスワードを検証する
 */
export function validatePassword(password: string): boolean {
  if (!password || typeof password !== 'string') {
    return false;
  }

  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) {
    return false;
  }

  return password === adminPassword;
}

/**
 * JWTトークンを生成する
 */
export async function generateToken(): Promise<string> {
  const secret = new TextEncoder().encode(process.env.ADMIN_JWT_SECRET);

  const token = await new SignJWT({ role: 'admin' as const })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${ADMIN_SESSION_EXPIRY_HOURS}h`)
    .sign(secret);

  return token;
}

/**
 * JWTトークンを検証する
 */
export async function verifyToken(token: string): Promise<AdminJWTPayload | null> {
  if (!token || typeof token !== 'string') {
    return null;
  }

  const secretKey = process.env.ADMIN_JWT_SECRET;
  if (!secretKey) {
    return null;
  }

  try {
    const secret = new TextEncoder().encode(secretKey);
    const { payload } = await jwtVerify(token, secret);

    return {
      role: payload.role as 'admin',
      iat: payload.iat as number,
      exp: payload.exp as number,
    };
  } catch {
    return null;
  }
}

/**
 * CookieヘッダーからJWTトークンを抽出する
 */
export function getTokenFromCookies(cookieHeader: string | null): string | null {
  if (!cookieHeader) {
    return null;
  }

  const cookies = cookieHeader.split(';').map((c) => c.trim());
  for (const cookie of cookies) {
    const [name, ...valueParts] = cookie.split('=');
    if (name === COOKIE_NAME) {
      return valueParts.join('=') || null;
    }
  }

  return null;
}

/**
 * 認証Cookie設定用のオプションを取得する
 */
export function getAuthCookieOptions(maxAge: number = ADMIN_SESSION_EXPIRY_HOURS * 60 * 60) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    maxAge,
    path: '/admin',
  };
}

/**
 * Cookie名を取得する
 */
export function getAuthCookieName(): string {
  return COOKIE_NAME;
}

/**
 * リクエストから認証状態を確認する
 */
export async function verifyAdminAuth(request: Request): Promise<boolean> {
  const cookieHeader = request.headers.get('cookie');
  const token = getTokenFromCookies(cookieHeader);

  if (!token) {
    return false;
  }

  const payload = await verifyToken(token);
  return payload !== null && payload.role === 'admin';
}
