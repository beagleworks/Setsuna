import { NextResponse } from 'next/server';
import {
  validatePassword,
  generateToken,
  getAuthCookieOptions,
  getAuthCookieName,
} from '@/lib/admin-auth';
import type { AdminLoginResponse } from '@/types/admin';
import { ADMIN_SESSION_EXPIRY_HOURS } from '@/types/admin';

/**
 * POST /api/admin/auth/login
 * 管理者ログイン
 */
export async function POST(request: Request): Promise<NextResponse<AdminLoginResponse>> {
  try {
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

    // レスポンス作成
    const response = NextResponse.json({
      success: true,
      data: {
        expiresAt: expiresAt.toISOString(),
      },
    });

    // Cookie設定
    const cookieOptions = getAuthCookieOptions();
    const cookieValue = [
      `${getAuthCookieName()}=${token}`,
      `Max-Age=${cookieOptions.maxAge}`,
      `Path=${cookieOptions.path}`,
      cookieOptions.httpOnly ? 'HttpOnly' : '',
      cookieOptions.secure ? 'Secure' : '',
      `SameSite=${cookieOptions.sameSite}`,
    ]
      .filter(Boolean)
      .join('; ');

    response.headers.set('Set-Cookie', cookieValue);

    return response;
  } catch {
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
