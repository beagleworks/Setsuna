import { describe, it, expect } from 'vitest';
import { buildTwitterShareUrl } from './share';

describe('buildTwitterShareUrl', () => {
  it('テキストとURLを含むTwitter Intent URLを生成する', () => {
    const result = buildTwitterShareUrl('Hello World', 'https://example.com');

    expect(result).toBe(
      'https://twitter.com/intent/tweet?text=Hello+World&url=https%3A%2F%2Fexample.com'
    );
  });

  it('日本語テキストを正しくエンコードする', () => {
    const result = buildTwitterShareUrl('こんにちは', 'https://example.com');

    expect(result).toContain('text=%E3%81%93%E3%82%93%E3%81%AB%E3%81%A1%E3%81%AF');
  });

  it('特殊文字を含むテキストを正しくエンコードする', () => {
    const result = buildTwitterShareUrl('Hello & Goodbye!', 'https://example.com');

    expect(result).toContain('text=Hello+%26+Goodbye%21');
  });

  it('URLパラメータを含むURLを正しくエンコードする', () => {
    const result = buildTwitterShareUrl('Check this', 'https://example.com?foo=bar');

    expect(result).toContain('url=https%3A%2F%2Fexample.com%3Ffoo%3Dbar');
  });

  it('空のテキストでも正しいURLを生成する', () => {
    const result = buildTwitterShareUrl('', 'https://example.com');

    expect(result).toBe('https://twitter.com/intent/tweet?text=&url=https%3A%2F%2Fexample.com');
  });
});
