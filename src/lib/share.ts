/**
 * Twitter Intent URLを生成する
 * @param text - シェアするテキスト
 * @param url - シェアするURL
 * @returns Twitter Intent URL
 */
export function buildTwitterShareUrl(text: string, url: string): string {
  const params = new URLSearchParams({ text, url });
  return `https://twitter.com/intent/tweet?${params.toString()}`;
}
