import { randomBytes } from 'crypto';

/**
 * 許可される文字（紛らわしい文字 0, O, 1, I, L を除外）
 * A-H, J-K, M-N, P-Z, 2-9 = 31文字
 */
export const ALLOWED_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

/**
 * 6文字のルームコードを暗号学的に安全な乱数で生成する
 */
export function generateRoomCode(): string {
  const bytes = randomBytes(6);
  let code = '';

  for (let i = 0; i < 6; i++) {
    const index = bytes[i] % ALLOWED_CHARS.length;
    code += ALLOWED_CHARS[index];
  }

  return code;
}

/**
 * ルームコードの形式を検証する
 * - 6文字であること
 * - 許可された文字のみを含むこと（0, O, 1, I, L を除外）
 * - 大文字であること
 */
export function validateRoomCode(code: string): boolean {
  if (code.length !== 6) {
    return false;
  }

  // 許可される文字: A-H, J-K, M-N, P-Z, 2-9 (0, O, 1, I, L を除外)
  const pattern = /^[A-HJ-KM-NP-Z2-9]{6}$/;
  return pattern.test(code);
}
