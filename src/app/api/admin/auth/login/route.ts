import { NextResponse } from 'next/server';
import { validatePassword, generateToken, buildAuthCookieValue } from '@/lib/admin-auth';
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
