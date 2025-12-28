# Setsuna

> **[English](./README.md)** | 日本語

**Setsuna**（刹那）は、デバイス間でテキストをリアルタイム共有するWebアプリケーションです。

スマートフォンでコピーしたテキストをPCで取得したり、その逆も簡単に行えます。

## 特徴

- **シンプル**: 6文字のルームコードでデバイス間を接続
- **リアルタイム**: Server-Sent Events (SSE) による即時同期
- **セキュア**: 暗号学的に安全な乱数でルームコードを生成
- **一時的**: ルームは24時間後に自動削除（プライバシー保護）
- **レスポンシブ**: スマホでもPCでも快適に使用可能
- **ダーク × ブルータリスト**: モノスペースフォント、太いボーダー、ネオンアクセント
- **国際化対応**: 英語・日本語に対応

## デモ

🌐 **ライブデモ**: [https://setsuna-text.vercel.app](https://setsuna-text.vercel.app)

```
┌──────────────────────────────────────────┐
│                                 [EN][JA] │  ← 言語切替
│          背景: #0a0a0a                   │
│                                          │
│           SETSUNA_                       │  ← 白 + 緑カーソル
│     [リアルタイムテキスト共有]            │  ← グレー、大文字
│                                          │
│     6文字のルームコードを共有するだけで   │  ← 説明テキスト
│     複数デバイス間でテキストを同期        │
│                                          │
│  ┌────────────────────────────────────┐  │
│  │ 新規ルーム作成                      │  │  ← 白ボーダー2px
│  │ ──────────────────────────         │  │
│  │ ルームを作成してコードを共有すると  │  │  ← 説明
│  │ 別のデバイスからアクセスできます    │  │
│  │  ┌──────────────────────────────┐  │  │
│  │  │     ルーム作成                │  │  │  ← 緑背景、黒文字
│  │  └──────────────────────────────┘  │  │
│  └────────────────────────────────────┘  │
│                                          │
│            ────── または ──────          │  ← セパレーター
│                                          │
│  ┌────────────────────────────────────┐  │
│  │ 既存ルームに参加                    │  │
│  │ ──────────────────────────         │  │
│  │  ルームコード                       │  │  ← ラベル
│  │  ┌──────────────────────────────┐  │  │
│  │  │  A B C D 2 3                  │  │  │  ← 黒背景、白ボーダー
│  │  └──────────────────────────────┘  │  │
│  │  ┌──────────────────────────────┐  │  │
│  │  │     参加                      │  │  │  ← 白背景、黒文字
│  │  └──────────────────────────────┘  │  │
│  └────────────────────────────────────┘  │
│                                          │
└──────────────────────────────────────────┘
```

## 技術スタック

| カテゴリ         | 技術                                |
| ---------------- | ----------------------------------- |
| フレームワーク   | Next.js 15 (App Router), React 19   |
| 言語             | TypeScript                          |
| スタイリング     | Tailwind CSS                        |
| データベース     | Turso (SQLite互換)                  |
| ORM              | Prisma                              |
| リアルタイム通信 | Server-Sent Events (SSE)            |
| テスト           | Vitest, Testing Library, Playwright |
| Linter/Formatter | ESLint 9, Prettier                  |
| Gitフック        | husky, lint-staged                  |
| デプロイ         | Vercel                              |
| 国際化           | next-intl                           |

## クイックスタート

### 必要条件

- Node.js 20+
- npm 10+

### インストール

```bash
# リポジトリをクローン
git clone https://github.com/beagleworks/Setsuna.git
cd Setsuna

# 依存関係をインストール
npm install

# Prismaクライアントを生成
npx prisma generate

# データベースをセットアップ（ローカルSQLite）
npx prisma migrate dev
```

### 環境変数

`.env.example` をコピーして `.env` を作成します：

```bash
cp .env.example .env
```

開発環境用の設定：

```env
# ローカル開発用
DATABASE_URL="file:./dev.db"
```

本番環境用の設定（Turso）：

```env
TURSO_DATABASE_URL="libsql://your-db.turso.io"
TURSO_AUTH_TOKEN="your-token"
CRON_SECRET="your-secret"
```

### 開発サーバーの起動

```bash
npm run dev
```

ブラウザで http://localhost:3000 を開きます。

## 開発コマンド

```bash
# 開発サーバー
npm run dev

# ビルド
npm run build

# 本番サーバー
npm run start

# リント
npm run lint
npm run lint:fix

# フォーマット
npm run format
npm run format:check

# テスト
npm run test              # 全テスト実行
npm run test:watch        # ウォッチモード（TDD用）
npm run test:coverage     # カバレッジレポート
npm run test:e2e          # E2Eテスト

# データベース
npx prisma generate       # Prismaクライアント生成
npx prisma migrate dev    # マイグレーション実行
npx prisma studio         # DBのGUI
```

## プロジェクト構成

```
Setsuna/
├── docs/                      # 仕様書
│   ├── SPEC.md               # 全体仕様
│   ├── API.md                # API仕様
│   ├── DB.md                 # データベース仕様
│   ├── UI.md                 # UI/UX仕様
│   └── TEST.md               # テスト仕様
├── messages/                  # i18n翻訳ファイル
│   ├── en.json               # 英語
│   └── ja.json               # 日本語
├── prisma/
│   └── schema.prisma         # DBスキーマ
├── src/
│   ├── app/                  # Next.js App Router
│   │   ├── [locale]/         # ロケール対応ルート
│   │   │   ├── page.tsx      # ホームページ
│   │   │   └── room/[code]/  # ルームページ
│   │   └── api/              # APIルート
│   ├── components/           # Reactコンポーネント
│   ├── i18n/                 # i18n設定
│   ├── lib/                  # ユーティリティ
│   ├── hooks/                # カスタムフック
│   └── types/                # 型定義
├── e2e/                      # E2Eテスト
├── middleware.ts             # next-intlミドルウェア
└── ...config files
```

## 使い方

### ルームを作成する

1. トップページで「ルームを作成する」をクリック
2. 6文字のルームコード（例: `ABCD23`）が生成されます
3. このコードを別のデバイスで入力するか、URLを共有します

### ルームに参加する

1. トップページでルームコードを入力
2. 「参加する」をクリック
3. または、直接URL `/room/ABCD23` にアクセス

### テキストを共有する

1. ルームページでテキストを入力
2. 「送信する」またはCtrl+Enterで送信
3. 全参加者にリアルタイムで配信されます
4. コピーボタンでクリップボードにコピー可能

## API

| エンドポイント               | メソッド | 説明               |
| ---------------------------- | -------- | ------------------ |
| `/api/rooms`                 | POST     | ルーム作成         |
| `/api/rooms/[code]`          | GET      | ルーム情報取得     |
| `/api/rooms/[code]/messages` | GET      | メッセージ一覧取得 |
| `/api/rooms/[code]/messages` | POST     | メッセージ送信     |
| `/api/sse/[code]`            | GET      | SSE接続            |
| `/api/cleanup`               | POST     | 期限切れルーム削除 |

詳細は [API仕様書](./docs/API.md) を参照してください。

## 開発方針

このプロジェクトは **TDD（テスト駆動開発）** を採用しています。

```
Red → Green → Refactor
1. 失敗するテストを書く
2. テストを通す最小限のコードを書く
3. コードをリファクタリングする
```

| 対象              | アプローチ        |
| ----------------- | ----------------- |
| `src/lib/`        | TDD（テスト先行） |
| `src/app/api/`    | TDD（テスト先行） |
| `src/components/` | 後付けテスト      |
| E2E               | 後付けテスト      |

## テスト

```bash
# ユニット/統合テスト（35件）
npm run test

# E2Eテスト（14件）
npm run test:e2e

# カバレッジレポート
npm run test:coverage
```

## 国際化（i18n）

Setsunaは英語と日本語に対応しています。UIから言語を切り替えられます。

### URL構造

| 言語   | URLパターン              |
| ------ | ------------------------ |
| 英語   | `/en`, `/en/room/ABCD23` |
| 日本語 | `/ja`, `/ja/room/ABCD23` |

### 翻訳ファイルの追加

翻訳ファイルは `messages/` ディレクトリにあります：

```
messages/
├── en.json    # 英語
└── ja.json    # 日本語
```

## ドキュメント

- [全体仕様書](./docs/SPEC.md)
- [API仕様書](./docs/API.md)
- [データベース仕様書](./docs/DB.md)
- [UI/UX仕様書](./docs/UI.md)
- [テスト仕様書](./docs/TEST.md)
- [変更履歴](./CHANGELOG.ja.md)

## ライセンス

MIT License
