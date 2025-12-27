# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.1.0] - 2025-12-28

### Added

- **APIレート制限** - スライディングウィンドウ方式で30リクエスト/分を制限
  - IPベースの識別
  - X-RateLimit-\* レスポンスヘッダー
  - 429ステータスとRetry-Afterヘッダー
- **トースト通知システム** - ブルータリストデザインの通知UI
  - 成功/エラー/情報/警告の4種類
  - メッセージ送信成功/失敗、コピー完了、接続状態変化の通知
- **Xシェアボタン** - ルームURLをTwitter/Xで共有
- **SSE再接続の指数バックオフ** - 1秒〜30秒のジッター付き遅延
  - 最大10回の再試行
  - 再接続中の進捗通知
- **アクセシビリティ改善**
  - aria-liveリージョンで新着メッセージをスクリーンリーダーに通知
  - 接続インジケーターにrole="status"とaria-label追加
  - メッセージリストにrole="log"追加
- **クライアント側スロットリングフック** (`useThrottle`)

### Changed

- **useSSE** - `onReconnecting`コールバックと`retryCount`を追加

## [1.0.1] - 2025-12-28

### Added

- **フッターコンポーネント** - コピーライト表示を全ページに追加

## [1.0.0] - 2025-12-28

### Added

- **国際化（i18n）サポート** - next-intlによる英語/日本語対応
  - 翻訳ファイル（`messages/en.json`, `messages/ja.json`）
  - 言語切替コンポーネント（LanguageSwitcher）
  - Accept-Languageによる自動リダイレクト
  - URL構造: `/en`, `/ja`
- **セキュリティ強化**
  - セキュリティヘッダー（X-Frame-Options, X-Content-Type-Options, Referrer-Policy）
  - SSEレート制限（ルームあたり最大100接続、超過時429エラー）
  - セキュリティレビューレポート（`docs/SECURITY.md`）
- **ダークブルータリストUI** - モダンでミニマルなダークテーマデザイン
- **ホームページ改善** - アプリ機能の説明テキストを追加
- **Lucide React アイコン** - UIアイコンライブラリの導入

### Fixed

- **SSE再接続ループ** - コールバック依存性によるパフォーマンス問題を解消
- **glob脆弱性（CVE）** - eslint-config-nextを16.1.1に更新
- **アクセシビリティ（a11y）**
  - Input コンポーネントにARIA属性追加（aria-invalid, aria-describedby）
  - エラーメッセージに`role="alert"`を追加
  - WCAGコンプライアンスのための色コントラスト改善
  - 動作軽減設定（reduced-motion）サポート
- **API改善**
  - `limit`パラメータのNaNハンドリング追加
  - 無効/空のルームコードでのSSE接続を防止
  - 送信エラーのUI表示と閉じるボタン追加

### Changed

- **ESLint設定** - フラット設定形式（eslint.config.mjs）に移行
- **Vercelデプロイ設定** - prisma generateをビルドスクリプトに追加
- **cronスケジュール** - Hobbyプラン制限に対応し日次実行に変更

### Security

- glob パッケージの脆弱性を修正（eslint-config-next更新）
- SSE接続のレート制限を実装
- セキュリティヘッダーを追加

---

## Version History

| Version | Date       | Description                        |
| ------- | ---------- | ---------------------------------- |
| 1.1.0   | 2025-12-28 | レート制限、トースト通知、a11y改善 |
| 1.0.1   | 2025-12-28 | フッター追加                       |
| 1.0.0   | 2025-12-28 | 初回正式リリース                   |

[Unreleased]: https://github.com/beagleworks/Setsuna/compare/v1.1.0...HEAD
[1.1.0]: https://github.com/beagleworks/Setsuna/compare/v1.0.1...v1.1.0
[1.0.1]: https://github.com/beagleworks/Setsuna/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/beagleworks/Setsuna/releases/tag/v1.0.0
