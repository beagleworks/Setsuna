# セキュリティレビューレポート

最終更新: 2025-12-27

## 概要

| 重要度   | 件数 | 説明                         |
| -------- | ---- | ---------------------------- |
| Critical | 0    | 即時対応が必要な重大な脆弱性 |
| High     | 0    | 早急に対応すべき脆弱性       |
| Medium   | 1    | 計画的に対応すべき問題       |
| Low      | 1    | リスクは低いが改善推奨       |

---

## High（高リスク）

### ~~1. 依存関係の脆弱性: `glob` パッケージ~~ ✅ 対応済み

**場所:** `node_modules/glob` (eslint-config-next経由)

**問題:**

```
glob 10.2.0 - 10.4.5: コマンドインジェクション脆弱性
https://github.com/advisories/GHSA-5j98-mcp5-4vw2
```

**影響:** 開発時のCLI実行時に悪意のあるファイル名を介してコマンドが実行される可能性

**対策:**

```bash
npm audit fix --force  # eslint-config-next@16への破壊的更新が必要
```

**ステータス:** 対応済み（eslint-config-next@16.1.1 に更新）

---

## Medium（中リスク）

### 2. Cleanup APIの認証

**場所:** `src/app/api/cleanup/route.ts:15-16`

**問題:**

```typescript
const isAuthorized =
  vercelCron === '1' || (authHeader && authHeader === `Bearer ${process.env.CRON_SECRET}`);
```

`x-vercel-cron: 1` ヘッダーだけで認証が通る。Vercel環境ではVercelがこのヘッダーを管理するため安全だが、他の環境（セルフホスティング等）では偽装可能。

**対策:**

- Vercel以外の環境にデプロイする場合は `CRON_SECRET` のみを使用するよう修正

**ステータス:** Vercel環境では問題なし

---

### 3. セキュリティヘッダーの未設定

**場所:** `next.config.mjs`

**問題:** CSP（Content Security Policy）、X-Frame-Options などのセキュリティヘッダーが設定されていない

**推奨設定:**

```javascript
const nextConfig = {
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ];
  },
};
```

**ステータス:** 対応済み（`next.config.mjs` にセキュリティヘッダーを追加）

---

## Low（低リスク）

### 4. ルームコード生成のModulo Bias

**場所:** `src/lib/room-code.ts:17`

**問題:**

```typescript
const index = bytes[i] % ALLOWED_CHARS.length; // 31文字
```

256 % 31 = 8 のため、最初の8文字（A-H）がわずかに出やすい（約0.3%の偏り）

**実際の影響:** 極めて小さく、ブルートフォース攻撃への実質的な影響はほぼなし

**ステータス:** 許容範囲内

---

### 5. SSEエンドポイントのレート制限なし

**場所:** `src/app/api/sse/[code]/route.ts`

**問題:** 同一ルームへの大量のSSE接続を制限する仕組みがない

**対策:** ルームあたりの最大接続数を設定することを検討

**ステータス:** 対応済み（`MAX_CONNECTIONS_PER_ROOM = 100` を設定、超過時は429を返す）

---

## 良好な点

| カテゴリ                | 状態 | 詳細                                                   |
| ----------------------- | ---- | ------------------------------------------------------ |
| **SQLインジェクション** | 安全 | Prisma使用でパラメータ化されたクエリ                   |
| **XSS**                 | 安全 | `dangerouslySetInnerHTML` 未使用、React自動エスケープ  |
| **入力バリデーション**  | 良好 | ルームコード・メッセージ長の検証あり                   |
| **環境変数**            | 安全 | `.env` は `.gitignore` に含まれている                  |
| **エラー情報漏洩**      | 良好 | スタックトレースは露出せず、汎用エラーメッセージを使用 |
| **乱数生成**            | 安全 | `crypto.randomBytes()` を使用                          |
| **期限切れデータ**      | 良好 | 24時間で自動削除の仕組みあり                           |

---

## 推奨アクション

| 優先度 | アクション                                     | 対応状況 |
| ------ | ---------------------------------------------- | -------- |
| 高     | `npm audit fix --force` で依存関係を更新       | 対応済み |
| 中     | `next.config.mjs` にセキュリティヘッダーを追加 | 対応済み |
| 低     | 本番環境でSSE接続のレート制限を検討            | 対応済み |

---

## セキュリティチェックの実行方法

```bash
# 依存関係の脆弱性スキャン
npm audit

# 依存関係の更新（破壊的変更を含む）
npm audit fix --force
```

---

## 参考情報

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Next.js セキュリティヘッダー](https://nextjs.org/docs/advanced-features/security-headers)
- [Prisma セキュリティベストプラクティス](https://www.prisma.io/docs/concepts/components/prisma-client/raw-database-access)
