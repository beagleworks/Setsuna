import { NextResponse } from 'next/server';
import { validatePassword, generateToken, buildAuthCookieValue } from '@/lib/admin-auth';
import { RateLimiter, getClientIP, createRateLimitHeaders } from '@/lib/rate-limiter';
import type { AdminLoginResponse } from '@/types/admin';
import { ADMIN_LOGIN_RATE_LIMIT, ADMIN_SESSION_EXPIRY_HOURS } from '@/types/admin';
import { ERROR_MESSAGES } from '@/types/api';

const LOGIN_RATE_LIMIT_WINDOW_MS = 60000;

const globalForAdminLoginRateLimiter = globalThis as typeof globalThis & {
  adminLoginRateLimiter?: RateLimiter;
};

function getAdminLoginRateLimiter(): RateLimiter {
  if (!globalForAdminLoginRateLimiter.adminLoginRateLimiter) {
    globalForAdminLoginRateLimiter.adminLoginRateLimiter = new RateLimiter({
      windowMs: LOGIN_RATE_LIMIT_WINDOW_MS,
      maxRequests: ADMIN_LOGIN_RATE_LIMIT,
    });
  }
  return globalForAdminLoginRateLimiter.adminLoginRateLimiter;
}

/**
 * POST /api/admin/auth/login
 * 管理者ログイン
 */
export async function POST(request: Request): Promise<NextResponse<AdminLoginResponse>> {
  try {
    const adminLoginRateLimiter = getAdminLoginRateLimiter();

    // レート制限チェック（IPごと）
    const ip = getClientIP(request);
    const rateLimit = adminLoginRateLimiter.check(ip);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: ERROR_MESSAGES.RATE_LIMIT_EXCEEDED,
          },
        },
        {
          status: 429,
          headers: {
            ...createRateLimitHeaders(rateLimit, ADMIN_LOGIN_RATE_LIMIT),
          },
        }
      );
    }
    adminLoginRateLimiter.increment(ip);

    const body = await request.json();
    const { password } = body;

    // パスワード未指定
    if (!password || typeof password !== 'string' || password.trim() === '') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_PASSWORD',
            message: 'Password is required',
          },
        },
        { status: 400 }
      );
    }

    // パスワード検証
    if (!validatePassword(password)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_PASSWORD',
            message: 'Invalid password',
          },
        },
        { status: 401 }
      );
    }

    // JWT生成
    const token = await generateToken();
    const expiresAt = new Date(Date.now() + ADMIN_SESSION_EXPIRY_HOURS * 60 * 60 * 1000);

    // レスポンス作成とCookie設定
    const response = NextResponse.json({
      success: true,
      data: {
        expiresAt: expiresAt.toISOString(),
      },
    });
    response.headers.set('Set-Cookie', buildAuthCookieValue(token));

    return response;
  } catch (error) {
    // 設定エラー（ADMIN_JWT_SECRET未設定など）
    if (error instanceof Error && error.message.includes('not configured')) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Server configuration error',
          },
        },
        { status: 500 }
      );
    }

    // JSONパースエラーなど
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INVALID_PASSWORD',
          message: 'Invalid request body',
        },
      },
      { status: 400 }
    );
  }
}
