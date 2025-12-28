# セキュリティレビューレポート

最終更新: 2025-12-28

## 概要

| 重要度   | 件数 | 説明                         |
| -------- | ---- | ---------------------------- |
| Critical | 0    | 即時対応が必要な重大な脆弱性 |
| High     | 0    | 早急に対応すべき脆弱性       |
| Medium   | 0    | 計画的に対応すべき問題       |
| Low      | 1    | リスクは低いが改善推奨       |

---

## v1.2.0 管理ダッシュボード セキュリティレビュー

### レビュー概要

**実施日:** 2025-12-28
**対象:** 管理ダッシュボード機能（v1.2.0で追加）

| 検出項目     | 確信度 | ステータス   |
| ------------ | ------ | ------------ |
| 脆弱性（高） | -      | 検出なし     |
| 脆弱性（中） | -      | 検出なし     |
| 偽陽性       | 5件    | すべて確認済 |

### レビュー対象ファイル

- `src/lib/admin-auth.ts` - JWT認証ロジック
- `src/app/api/admin/auth/login/route.ts` - ログインAPI
- `src/app/api/admin/auth/logout/route.ts` - ログアウトAPI
- `src/app/api/admin/stats/route.ts` - 統計API
- `src/app/api/admin/rooms/route.ts` - ルーム一覧API
- `src/app/api/admin/rooms/[code]/route.ts` - ルーム詳細・削除API
- `src/app/api/admin/cleanup/route.ts` - クリーンアップAPI
- `middleware.ts` - 認証ミドルウェア

### 検出項目の分析（すべて偽陽性）

#### 1. 環境変数の直接参照

**場所:** `src/lib/admin-auth.ts:8`

```typescript
if (!process.env.ADMIN_PASSWORD) {
  return false;
}
```

**確信度:** 2/10（偽陽性）

**理由:** これは環境変数の存在チェックであり、環境変数の使用自体はセキュリティ上の問題ではない。パスワードはコードにハードコードされておらず、環境変数から安全に読み込まれている。

---

#### 2. Cookieの手動設定

**場所:** `src/app/api/admin/auth/login/route.ts:62-73`

```typescript
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
```

**確信度:** 2/10（偽陽性）

**理由:** 手動でのCookie設定だが、すべてのセキュリティ属性（HttpOnly、Secure、SameSite=Strict）が正しく設定されている。Next.jsのRoute HandlersではResponseオブジェクトの`cookies`メソッドが使えないため、この実装は適切。

---

#### 3. JWTトークン検証

**場所:** `src/lib/admin-auth.ts:40-52`

```typescript
export async function verifyToken(token: string): Promise<AdminJWTPayload | null> {
  try {
    const secret = getJWTSecret();
    const { payload } = await jwtVerify(token, secret, {
      algorithms: ['HS256'],
    });
    return payload as AdminJWTPayload;
  } catch {
    return null;
  }
}
```

**確信度:** 2/10（偽陽性）

**理由:** `jose`ライブラリの標準的なJWT検証を使用しており、アルゴリズムも明示的に指定（HS256）。`jose`はEdge Runtime互換の信頼性の高いライブラリ。

---

#### 4. 認証チェック関数

**場所:** `src/lib/admin-auth.ts:60-70`

```typescript
export async function verifyAdminAuth(request: Request): Promise<boolean> {
  const cookieHeader = request.headers.get('cookie');
  const token = getTokenFromCookies(cookieHeader);
  if (!token) return false;
  const payload = await verifyToken(token);
  return payload !== null && payload.role === 'admin';
}
```

**確信度:** 2/10（偽陽性）

**理由:** トークンの存在チェック、JWT検証、ロール確認の3段階認証が実装されている。認証失敗時は早期リターンで`false`を返す安全な設計。

---

#### 5. ミドルウェアでのトークンチェック

**場所:** `middleware.ts:17-22`

```typescript
if (!pathname.startsWith('/admin/login')) {
  const token = request.cookies.get('admin_token');
  if (!token?.value) {
    return NextResponse.redirect(new URL('/admin/login', request.url));
  }
}
```

**確信度:** 2/10（偽陽性）

**理由:** ミドルウェアでのトークン存在チェックは追加の防御層として機能。実際のJWT検証は各APIエンドポイントで行われる。ログインページは認証不要で正しくスキップされている。

---

### セキュリティ対策の実装状況

| 対策                     | 状態 | 詳細                                                 |
| ------------------------ | ---- | ---------------------------------------------------- |
| **JWT署名検証**          | ✅   | `jose`ライブラリでHS256アルゴリズムを使用            |
| **HttpOnly Cookie**      | ✅   | XSS攻撃からトークンを保護                            |
| **Secure Cookie**        | ✅   | HTTPS接続でのみCookieを送信（本番環境）              |
| **SameSite=Strict**      | ✅   | CSRF攻撃を防止                                       |
| **セッション有効期限**   | ✅   | 24時間で自動失効                                     |
| **パスワード環境変数化** | ✅   | ハードコーディングを回避                             |
| **入力バリデーション**   | ✅   | パスワードの空文字・型チェック                       |
| **SQLインジェクション**  | ✅   | Prisma ORMでパラメータ化クエリ                       |
| **XSS防止**              | ✅   | Reactの自動エスケープ、dangerouslySetInnerHTML未使用 |
| **認証ミドルウェア**     | ✅   | 未認証アクセスをログインページへリダイレクト         |
| **エラー情報秘匿**       | ✅   | 認証失敗時も詳細を漏らさない汎用メッセージ           |

---

### 結論

管理ダッシュボード機能（v1.2.0）のセキュリティレビューを完了。**脆弱性は検出されなかった**。

検出された5件はすべて偽陽性であり、実際にはセキュリティベストプラクティスに従った適切な実装となっている。

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
| **管理者認証**          | 安全 | JWT + HttpOnly Cookie、24時間有効期限（v1.2.0）        |
| **CSRF対策**            | 安全 | SameSite=Strict Cookie（v1.2.0）                       |

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
