import { describe, it, expect } from 'vitest';
import { generateRoomCode, validateRoomCode, ALLOWED_CHARS } from './room-code';

describe('generateRoomCode', () => {
  it('6文字のコードを生成する', () => {
    const code = generateRoomCode();
    expect(code).toHaveLength(6);
  });

  it('許可された文字のみを含む', () => {
    const code = generateRoomCode();
    // A-H, J-K, M-N, P-Z, 2-9 (0, O, 1, I, L を除外)
    const pattern = /^[A-HJ-KM-NP-Z2-9]{6}$/;
    expect(code).toMatch(pattern);
  });

  it('紛らわしい文字（0, O, 1, I, L）を含まない', () => {
    // 100回生成して確認
    for (let i = 0; i < 100; i++) {
      const code = generateRoomCode();
      expect(code).not.toMatch(/[0O1IL]/);
    }
  });

  it('毎回異なるコードを生成する', () => {
    const codes = new Set<string>();
    for (let i = 0; i < 100; i++) {
      codes.add(generateRoomCode());
    }
    expect(codes.size).toBe(100);
  });

  it('31文字の文字セットを使用する（26文字+10数字-5除外文字）', () => {
    // ALLOWED_CHARSが31文字であることを確認
    expect(ALLOWED_CHARS).toHaveLength(31);
    // 除外文字を含まないことを確認
    expect(ALLOWED_CHARS).not.toMatch(/[0O1IL]/);
  });
});

describe('validateRoomCode', () => {
  it('有効なコードをtrueで返す', () => {
    expect(validateRoomCode('A2B3C4')).toBe(true);
    expect(validateRoomCode('ABCDEF')).toBe(true);
    expect(validateRoomCode('234567')).toBe(true);
    expect(validateRoomCode('HJKMNP')).toBe(true);
  });

  it('6文字でない場合falseで返す', () => {
    expect(validateRoomCode('ABC')).toBe(false);
    expect(validateRoomCode('ABCDEFGH')).toBe(false);
    expect(validateRoomCode('')).toBe(false);
  });

  it('禁止文字を含む場合falseで返す', () => {
    expect(validateRoomCode('ABCD0E')).toBe(false); // 0を含む
    expect(validateRoomCode('ABCDOE')).toBe(false); // Oを含む
    expect(validateRoomCode('ABCD1E')).toBe(false); // 1を含む
    expect(validateRoomCode('ABCDIE')).toBe(false); // Iを含む
    expect(validateRoomCode('ABCDLE')).toBe(false); // Lを含む
  });

  it('小文字を含む場合falseで返す', () => {
    expect(validateRoomCode('abcdef')).toBe(false);
    expect(validateRoomCode('AbCdEf')).toBe(false);
  });
});
