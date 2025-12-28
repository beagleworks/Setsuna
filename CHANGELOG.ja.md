# Changelog

このプロジェクトにおける注目すべき変更点をこのファイルに記録します。

フォーマットは [Keep a Changelog](https://keepachangelog.com/ja/1.1.0/) に基づいており、
このプロジェクトは [Semantic Versioning](https://semver.org/spec/v2.0.0.html) に従います。

## [Unreleased]

## [1.1.3] - 2025-12-28

### Fixed

- **フッター表示問題** - フッターがデフォルトで隠れておりスクロールしないと見えなかった問題を修正。ホームページのmain要素で`min-h-screen`を`flex-1`に変更

## [1.1.2] - 2025-12-28

### Added

- **プライバシーポリシーページ** - `/privacy`ルートにデータ収集、保持期間（24時間自動削除）、サードパーティサービス開示を追加
- **利用規約ページ** - `/terms`ルートに禁止事項、責任制限、データ有効期限の警告を追加
- **法的ページレイアウトコンポーネント** - 法的ページ用の再利用可能な`LegalPageLayout`
- **フッター法的リンク** - プライバシーポリシーと利用規約へのリンクをフッターに追加

## [1.1.1] - 2025-12-28

### Fixed

- **XShareButton縦伸び問題** - `inline-flex`を追加してボタンがコンテンツサイズに収まるよう修正
- **ルームシェアURL 404問題** - シェアURLにlocaleを含めるよう修正（`/room/CODE` → `/ja/room/CODE`）

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
| 1.1.3   | 2025-12-28 | フッター表示問題を修正             |
| 1.1.2   | 2025-12-28 | プライバシーポリシー・利用規約追加 |
| 1.1.1   | 2025-12-28 | XShareButton・シェアURL修正        |
| 1.1.0   | 2025-12-28 | レート制限、トースト通知、a11y改善 |
| 1.0.1   | 2025-12-28 | フッター追加                       |
| 1.0.0   | 2025-12-28 | 初回正式リリース                   |

[Unreleased]: https://github.com/beagleworks/Setsuna/compare/v1.1.3...HEAD
[1.1.3]: https://github.com/beagleworks/Setsuna/compare/v1.1.2...v1.1.3
[1.1.2]: https://github.com/beagleworks/Setsuna/compare/v1.1.1...v1.1.2
[1.1.1]: https://github.com/beagleworks/Setsuna/compare/v1.1.0...v1.1.1
[1.1.0]: https://github.com/beagleworks/Setsuna/compare/v1.0.1...v1.1.0
[1.0.1]: https://github.com/beagleworks/Setsuna/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/beagleworks/Setsuna/releases/tag/v1.0.0
