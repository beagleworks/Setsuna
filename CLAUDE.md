# CLAUDE.md

Claude Code向けのクイックリファレンス。詳細仕様は `docs/` を参照。

## Project Overview

**Setsuna（刹那）** - デバイス間でテキストをリアルタイム共有するWebアプリ。
6文字のルームコードでルームを作成/参加し、SSEでテキストを即時同期。24時間で自動削除。

## Tech Stack

Next.js 14 (App Router) / TypeScript / Turso (Prisma) / Tailwind CSS / next-intl / Vitest & Playwright

## i18n（国際化）

- **対応言語**: 英語（デフォルト）, 日本語
- **ライブラリ**: next-intl
- **翻訳ファイル**: `messages/en.json`, `messages/ja.json`
- **URL構造**: `/en` (英語), `/ja` (日本語)

## TDD（テスト駆動開発）

```
Red → Green → Refactor
```

| 対象                       | アプローチ            |
| -------------------------- | --------------------- |
| `src/lib/`, `src/app/api/` | **TDD（テスト先行）** |
| `src/components/`, E2E     | 後付けテスト          |

## Commands

```bash
npm run dev          # 開発サーバー
npm run test         # テスト実行
npm run test:watch   # TDD用ウォッチモード
npm run lint         # ESLint
npm run build        # ビルド
```

## Commit Rules

コミット時は以下を必ずユーザーに確認すること：

1. **バージョンを上げるか？** - 変更内容に応じてSemantic Versioningに従う
   - `MAJOR`: 破壊的変更
   - `MINOR`: 機能追加（後方互換あり）
   - `PATCH`: バグ修正
2. **CHANGELOGに追記するか？** - バージョンを上げる場合は `CHANGELOG.md` を更新

```
確認例:
「この変更をコミットします。バージョンを上げますか？CHANGELOGに追記しますか？」
```

## 詳細仕様

| ドキュメント                           | 内容                                |
| -------------------------------------- | ----------------------------------- |
| [docs/SPEC.md](./docs/SPEC.md)         | 全体仕様・機能要件・アーキテクチャ  |
| [docs/API.md](./docs/API.md)           | APIエンドポイント・TypeScript型定義 |
| [docs/DB.md](./docs/DB.md)             | DBスキーマ・Prismaクエリ            |
| [docs/UI.md](./docs/UI.md)             | UI/UXデザイン・コンポーネント       |
| [docs/TEST.md](./docs/TEST.md)         | テスト仕様・TDDガイドライン         |
| [docs/SECURITY.md](./docs/SECURITY.md) | セキュリティレビュー・脆弱性対応    |
