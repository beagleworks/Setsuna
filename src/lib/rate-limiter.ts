/**
 * レート制限ユーティリティ
 *
 * スライディングウィンドウ方式でIPアドレスごとのリクエスト数を制限する。
 * インメモリ管理のため、Vercelのサーバーレス環境では同一インスタンス内での
 * 連続リクエストのみを制限できる（完全な分散制限にはRedis等が必要）。
 */

interface RateLimitConfig {
  /** ウィンドウサイズ（ミリ秒） */
  windowMs: number;
  /** ウィンドウ内の最大リクエスト数 */
  maxRequests: number;
}

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

export interface RateLimitResult {
  /** リクエストが許可されるかどうか */
  allowed: boolean;
  /** 残りリクエスト数 */
  remaining: number;
  /** リセット時刻（Unix timestamp） */
  resetAt: number;
}

export class RateLimiter {
  private store: Map<string, RateLimitEntry>;
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.store = new Map();
    this.config = config;
  }

  /**
   * 指定されたIDのレート制限状態をチェックする
   */
  check(identifier: string): RateLimitResult {
    const now = Date.now();
    const entry = this.store.get(identifier);

    // エントリがないか、期限切れの場合
    if (!entry || now >= entry.resetAt) {
      return {
        allowed: true,
        remaining: this.config.maxRequests,
        resetAt: now + this.config.windowMs,
      };
    }

    const remaining = Math.max(0, this.config.maxRequests - entry.count);
    return {
      allowed: remaining > 0,
      remaining,
      resetAt: entry.resetAt,
    };
  }

  /**
   * 指定されたIDのリクエストカウントを増加させる
   */
  increment(identifier: string): void {
    const now = Date.now();
    const entry = this.store.get(identifier);

    // エントリがないか、期限切れの場合は新規作成
    if (!entry || now >= entry.resetAt) {
      this.store.set(identifier, {
        count: 1,
        resetAt: now + this.config.windowMs,
      });
      return;
    }

    // カウントを増加
    entry.count++;
  }

  /**
   * 期限切れのエントリを削除する
   */
  cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    this.store.forEach((entry, key) => {
      if (now >= entry.resetAt) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach((key) => this.store.delete(key));
  }
}

/**
 * リクエストからクライアントIPアドレスを取得する
 *
 * Vercel/Cloudflare等のプロキシ環境では、x-forwarded-forやx-real-ipヘッダーから
 * 実際のクライアントIPを取得する。
 */
export function getClientIP(request: Request): string {
  // x-forwarded-forが最優先（複数のプロキシを経由している場合、最初がクライアントIP）
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  // x-real-ipはNginx等で設定されるヘッダー
  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  // ヘッダーがない場合（ローカル開発など）
  return 'unknown';
}

// デフォルト設定でシングルトンインスタンスを作成
// 30リクエスト/分（SECURITY.mdで定義された値）
const DEFAULT_CONFIG: RateLimitConfig = {
  windowMs: 60000, // 1分
  maxRequests: 30,
};

// グローバルインスタンス（開発時のホットリロード対応）
const globalForRateLimiter = globalThis as typeof globalThis & {
  rateLimiter?: RateLimiter;
};

export const rateLimiter = globalForRateLimiter.rateLimiter ?? new RateLimiter(DEFAULT_CONFIG);

if (process.env.NODE_ENV !== 'production') {
  globalForRateLimiter.rateLimiter = rateLimiter;
}
