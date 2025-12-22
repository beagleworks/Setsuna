# Setsuna - 実装計画書

## 概要

本ドキュメントでは、Setsuna（刹那）の実装計画をTDDアプローチに基づいて定義します。

## 実装方針

### TDD原則

```
Red → Green → Refactor
1. 失敗するテストを書く
2. テストを通す最小限のコードを書く
3. コードをリファクタリングする
```

### 実装順序の原則

1. **下位レイヤーから上位レイヤーへ**: 依存関係を考慮し、基盤となる部分から実装
2. **TDD対象は必ずテスト先行**: `src/lib/`と`src/app/api/`
3. **設定ファイルはテスト実行に必要な範囲で先に作成**

---

## フェーズ1: プロジェクトセットアップ

### 1.1 Next.jsプロジェクト初期化

```bash
# 実行コマンド
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --no-turbo --import-alias "@/*"
```

### 1.2 追加パッケージインストール

#### 本番依存

| パッケージ               | 用途               |
| ------------------------ | ------------------ |
| `prisma`                 | ORM                |
| `@prisma/client`         | Prisma Client      |
| `@prisma/adapter-libsql` | Tursoアダプター    |
| `@libsql/client`         | libSQLクライアント |

#### 開発依存

| パッケージ                    | 用途                 |
| ----------------------------- | -------------------- |
| `vitest`                      | テストフレームワーク |
| `@vitest/coverage-v8`         | カバレッジ           |
| `@vitest/ui`                  | テストUI             |
| `@testing-library/react`      | コンポーネントテスト |
| `@testing-library/user-event` | ユーザーイベント     |
| `@testing-library/jest-dom`   | DOM マッチャー       |
| `happy-dom`                   | テスト環境           |
| `msw`                         | APIモック            |
| `playwright`                  | E2Eテスト            |
| `@playwright/test`            | Playwright           |
| `husky`                       | Gitフック            |
| `lint-staged`                 | ステージファイルlint |
| `prettier`                    | コードフォーマッター |

### 1.3 設定ファイル作成

| ファイル                 | 内容                 |
| ------------------------ | -------------------- |
| `vitest.config.ts`       | Vitest設定           |
| `vitest.setup.ts`        | テストセットアップ   |
| `playwright.config.ts`   | Playwright設定       |
| `prettier.config.mjs`    | Prettier設定         |
| `lint-staged.config.mjs` | lint-staged設定      |
| `eslint.config.mjs`      | ESLint Flat Config   |
| `.env`                   | 環境変数（ローカル） |
| `.env.example`           | 環境変数テンプレート |

### 1.4 Husky設定

```bash
npx husky init
```

| フック       | 実行内容          |
| ------------ | ----------------- |
| `pre-commit` | `npx lint-staged` |
| `pre-push`   | `npm run test`    |

### 1.5 ディレクトリ構造作成

```
src/
├── app/
│   ├── api/
│   │   ├── rooms/
│   │   ├── sse/
│   │   └── cleanup/
│   ├── room/[code]/
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/
├── hooks/
├── lib/
├── types/
└── mocks/
e2e/
prisma/
```

---

## フェーズ2: データベース設定

### 2.1 Prismaスキーマ作成

`prisma/schema.prisma` を仕様書通りに作成

### 2.2 マイグレーション実行

```bash
npx prisma migrate dev --name init
npx prisma generate
```

### 2.3 DBクライアント作成

`src/lib/db.ts` を作成（開発環境用SQLite）

---

## フェーズ3: ユーティリティ関数（TDD）

### 3.1 room-code.ts

#### Red: テスト作成

`src/lib/room-code.test.ts`

| テストケース                   | 優先度 |
| ------------------------------ | ------ |
| 6文字のコードを生成する        | 高     |
| 許可された文字のみを含む       | 高     |
| 紛らわしい文字を含まない       | 高     |
| 毎回異なるコードを生成する     | 中     |
| 十分なエントロピーを持つ       | 高     |
| validateRoomCode: 有効なコード | 高     |
| validateRoomCode: 無効なコード | 高     |

#### Green: 最小実装

`src/lib/room-code.ts`

- `ALLOWED_CHARS` 定数（32文字）
- `generateRoomCode()` 関数
- `validateRoomCode()` 関数

#### Refactor: コード整理

- 暗号学的乱数使用の確認
- 型定義の整理

### 3.2 sse-manager.ts

#### Red: テスト作成

`src/lib/sse-manager.test.ts`

| テストケース                 | 優先度 |
| ---------------------------- | ------ |
| 接続を追加できる             | 高     |
| 同じルームに複数接続できる   | 高     |
| 接続を削除できる             | 高     |
| ブロードキャストできる       | 高     |
| SSE形式でデータ送信          | 高     |
| 存在しないルームは何もしない | 中     |
| 接続数を取得できる           | 中     |
| 切断時に自動削除             | 高     |

#### Green: 最小実装

`src/lib/sse-manager.ts`

- `SSEManager` クラス
- `addConnection()` メソッド
- `removeConnection()` メソッド
- `broadcast()` メソッド
- `getConnectionCount()` メソッド

#### Refactor: コード整理

- シングルトンパターン適用
- 型定義の整理

---

## フェーズ4: 型定義

### 4.1 API型定義

`src/types/api.ts`

```typescript
interface Room { ... }
interface Message { ... }
interface ApiResponse<T> { ... }
type CreateRoomResponse = ...
type GetRoomResponse = ...
type GetMessagesResponse = ...
type CreateMessageResponse = ...
type SSEEvent = ...
```

### 4.2 エラーコード定義

`src/types/errors.ts`

```typescript
type ErrorCode =
  | 'ROOM_NOT_FOUND'
  | 'ROOM_EXPIRED'
  | 'INVALID_ROOM_CODE'
  | 'CONTENT_TOO_LONG'
  | 'CONTENT_EMPTY'
  | 'RATE_LIMIT_EXCEEDED'
  | 'INTERNAL_ERROR';
```

---

## フェーズ5: APIエンドポイント（TDD）

### 5.1 POST /api/rooms（ルーム作成）

#### Red: テスト作成

`src/app/api/rooms/route.test.ts`

| テストケース                       | ステータス |
| ---------------------------------- | ---------- |
| 新しいルームを作成し、コードを返す | 201        |
| expiresAtは24時間後に設定される    | 201        |

#### Green: 最小実装

`src/app/api/rooms/route.ts`

#### Refactor: コード整理

---

### 5.2 GET /api/rooms/[code]（ルーム取得）

#### Red: テスト作成

`src/app/api/rooms/[code]/route.test.ts`

| テストケース               | ステータス |
| -------------------------- | ---------- |
| 存在するルームの情報を返す | 200        |
| 存在しないルームは404      | 404        |
| 期限切れルームは410        | 410        |
| 無効なコード形式は400      | 400        |

#### Green: 最小実装

`src/app/api/rooms/[code]/route.ts`

#### Refactor: コード整理

---

### 5.3 GET/POST /api/rooms/[code]/messages（メッセージ）

#### Red: テスト作成

`src/app/api/rooms/[code]/messages/route.test.ts`

| テストケース              | メソッド | ステータス |
| ------------------------- | -------- | ---------- |
| メッセージ一覧を返す      | GET      | 200        |
| メッセージを作成する      | POST     | 201        |
| SSEでブロードキャストする | POST     | 201        |
| 10,000文字超過は400       | POST     | 400        |
| 空contentは400            | POST     | 400        |
| 存在しないルームは404     | POST     | 404        |

#### Green: 最小実装

`src/app/api/rooms/[code]/messages/route.ts`

#### Refactor: コード整理

---

### 5.4 GET /api/sse/[code]（SSE接続）

#### Red: テスト作成

`src/app/api/sse/[code]/route.test.ts`

| テストケース            | 期待動作                        |
| ----------------------- | ------------------------------- |
| SSEストリームを返す     | Content-Type: text/event-stream |
| connectedイベントを送信 | 接続時                          |
| 存在しないルームは404   | エラーレスポンス                |

#### Green: 最小実装

`src/app/api/sse/[code]/route.ts`

#### Refactor: コード整理

---

### 5.5 POST /api/cleanup（クリーンアップ）

#### Red: テスト作成

`src/app/api/cleanup/route.test.ts`

| テストケース         | ステータス |
| -------------------- | ---------- |
| 期限切れルームを削除 | 200        |
| 削除件数を返す       | 200        |
| 認証なしは401        | 401        |

#### Green: 最小実装

`src/app/api/cleanup/route.ts`

#### Refactor: コード整理

---

## フェーズ6: UIコンポーネント（後付けテスト）

### 6.1 共通コンポーネント

| コンポーネント | 説明                                     |
| -------------- | ---------------------------------------- |
| `Button`       | プライマリ/セカンダリ/アウトラインボタン |
| `Input`        | テキスト入力フィールド                   |
| `Card`         | カードコンテナ                           |
| `Toast`        | 通知トースト                             |

### 6.2 機能コンポーネント

| コンポーネント   | 説明               | 場所   |
| ---------------- | ------------------ | ------ |
| `RoomCreator`    | ルーム作成カード   | ホーム |
| `RoomJoiner`     | ルーム参加カード   | ホーム |
| `MessageInput`   | テキスト入力エリア | ルーム |
| `MessageList`    | メッセージ一覧     | ルーム |
| `MessageItem`    | 個別メッセージ     | ルーム |
| `CopyButton`     | コピーボタン       | ルーム |
| `RoomHeader`     | ルームヘッダー     | ルーム |
| `CountdownTimer` | 残り時間表示       | ルーム |

### 6.3 カスタムフック

| フック         | 用途               |
| -------------- | ------------------ |
| `useSSE`       | SSE接続管理        |
| `useClipboard` | クリップボード操作 |
| `useToast`     | トースト表示       |
| `useCountdown` | カウントダウン     |

---

## フェーズ7: ページ実装

### 7.1 ホームページ（`/`）

`src/app/page.tsx`

- ロゴとサブタイトル
- RoomCreatorカード
- RoomJoinerカード

### 7.2 ルームページ（`/room/[code]`）

`src/app/room/[code]/page.tsx`

- RoomHeader
- MessageInput
- MessageList
- SSE接続

### 7.3 レイアウト

`src/app/layout.tsx`

- グローバルスタイル
- メタデータ
- Toastプロバイダー

---

## フェーズ8: E2Eテスト（後付け）

### 8.1 テストシナリオ

`e2e/room-flow.spec.ts`

| シナリオ     | 説明                     |
| ------------ | ------------------------ |
| ルーム作成   | ホームからルーム作成     |
| ルーム参加   | コード入力で参加         |
| テキスト共有 | 送受信のリアルタイム確認 |
| コピー機能   | クリップボードコピー     |
| 期限切れ     | 無効ルームへのアクセス   |

---

## フェーズ9: 本番準備

### 9.1 環境変数設定

| 変数                 | 用途                  |
| -------------------- | --------------------- |
| `TURSO_DATABASE_URL` | Turso接続URL          |
| `TURSO_AUTH_TOKEN`   | Turso認証トークン     |
| `CRON_SECRET`        | クリーンアップAPI認証 |

### 9.2 Vercel設定

`vercel.json`

```json
{
  "crons": [
    {
      "path": "/api/cleanup",
      "schedule": "0 * * * *"
    }
  ]
}
```

### 9.3 本番DBマイグレーション

```bash
npx prisma db push
```

---

## 実装スケジュール

| フェーズ | 内容                      | 推定作業量 |
| -------- | ------------------------- | ---------- |
| 1        | プロジェクトセットアップ  | 中         |
| 2        | データベース設定          | 小         |
| 3        | ユーティリティ関数（TDD） | 中         |
| 4        | 型定義                    | 小         |
| 5        | APIエンドポイント（TDD）  | 大         |
| 6        | UIコンポーネント          | 大         |
| 7        | ページ実装                | 中         |
| 8        | E2Eテスト                 | 中         |
| 9        | 本番準備                  | 小         |

---

## チェックリスト

### フェーズ1完了条件

- [ ] Next.jsプロジェクト初期化
- [ ] 全パッケージインストール
- [ ] 設定ファイル作成完了
- [ ] Husky設定完了
- [ ] ディレクトリ構造作成
- [ ] `npm run test` が実行可能

### フェーズ2完了条件

- [ ] Prismaスキーマ作成
- [ ] マイグレーション成功
- [ ] DBクライアント作成
- [ ] `npx prisma studio` で確認可能

### フェーズ3完了条件

- [ ] room-code.test.ts 全テストパス
- [ ] sse-manager.test.ts 全テストパス
- [ ] カバレッジ90%以上

### フェーズ4完了条件

- [ ] 全型定義ファイル作成
- [ ] 型エラーなし

### フェーズ5完了条件

- [ ] 全APIエンドポイントのテストパス
- [ ] カバレッジ85%以上

### フェーズ6完了条件

- [ ] 全コンポーネント実装
- [ ] コンポーネントテスト追加
- [ ] カバレッジ75%以上

### フェーズ7完了条件

- [ ] ホームページ動作確認
- [ ] ルームページ動作確認
- [ ] レスポンシブデザイン確認

### フェーズ8完了条件

- [ ] 全E2Eテストパス
- [ ] モバイル/デスクトップ両方で確認

### フェーズ9完了条件

- [ ] Turso接続成功
- [ ] Vercelデプロイ成功
- [ ] Cronジョブ動作確認

---

## 関連ドキュメント

- [全体仕様書](./SPEC.md)
- [API仕様書](./API.md)
- [データベース仕様書](./DB.md)
- [UI/UX仕様書](./UI.md)
- [テスト仕様書](./TEST.md)
