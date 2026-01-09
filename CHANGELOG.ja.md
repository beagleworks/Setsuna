# Changelog

このプロジェクトにおける注目すべき変更点をこのファイルに記録します。

フォーマットは [Keep a Changelog](https://keepachangelog.com/ja/1.1.0/) に基づいており、
このプロジェクトは [Semantic Versioning](https://semver.org/spec/v2.0.0.html) に従います。

## [Unreleased]

## [1.3.4] - 2026-01-09

### Changed

- **管理認証Cookie処理のリファクタリング** - Cookie生成ロジックを共通ヘルパー関数に抽出
  - `buildAuthCookieValue(token)` を追加（認証Cookie設定用）
  - `buildClearAuthCookieValue()` を追加（認証Cookie削除用）
  - ログイン/ログアウトエンドポイントの重複コードを削減
  - Cookieロジックを `src/lib/admin-auth.ts` に集約

## [1.3.3] - 2025-12-29

### Fixed

- **管理画面ログアウトが動作しない** - ログアウトしても認証Cookieが削除されない問題を修正
  - Cookie削除時に `Path=/admin` を使用していたが、ログイン時は `Path=/` で設定されていた
  - ログアウトエンドポイントで `getAuthCookieOptions()` を使用するよう修正し、Cookie Pathを統一

## [1.3.2] - 2025-12-29

### Fixed

- **管理画面ログイン後リダイレクトループ** - ログイン成功後もログイン画面にリダイレクトされる問題を修正
  - Cookie の Path を `/admin` から `/` に変更し、`/api/admin/*` エンドポイントにも Cookie が送信されるように修正
  - すべての管理画面の fetch 呼び出しに `credentials: 'include'` を追加

### Changed

- 管理者認証の Cookie Path を `/admin` から `/` に変更

## [1.3.1] - 2025-12-29

### Fixed

- **管理画面ログイン認証バグ** - 正しいパスワードでログインすると200ではなく400エラーが返される問題を修正
  - 原因: `ADMIN_JWT_SECRET` 環境変数がドキュメントに記載されておらず、設定漏れが発生
  - `generateToken()` にシークレット未設定時の明示的なエラーハンドリングを追加
  - サーバー設定エラーは400ではなく500を返すように修正

### Added

- **環境変数ドキュメント** - `ADMIN_JWT_SECRET` をすべてのドキュメントに追加
  - `.env.example` に新しい変数を追加
  - `docs/SPEC.md` に環境変数セットアップガイドを追加
  - `README.md`、`README.ja.md`、`CLAUDE.md` に設定手順を追加
  - 安全なシークレット生成コマンドを記載: `openssl rand -base64 32`

## [1.3.0] - 2025-12-29

### Changed

- **フレームワークアップグレード** - Next.js 15 および React 19 にアップグレード
  - Next.js 14.2.35 → 15.5.9
  - React 18.3.1 → 19.x
  - eslint-config-next 16.1.1 → 16.x（flat config対応）
- 新しい技術スタックを反映するようドキュメントを更新

## [1.2.0] - 2025-12-28

### Added

- **管理ダッシュボード** - ルーム管理と統計表示のためのシンプルな管理パネル
  - パスワード認証（環境変数 `ADMIN_PASSWORD`）
  - JWT セッション管理（HttpOnly Cookie、24時間有効）
  - 統計ダッシュボード（アクティブルーム数、総メッセージ数、7日間のアクティビティ推移）
  - ルーム管理（検索、フィルタリング（アクティブ/期限切れ）、ページネーション）
  - メッセージビューア（ルーム内容の確認）
  - 期限切れルームの手動クリーンアップボタン
- **管理API エンドポイント**
  - `POST /api/admin/auth/login` - パスワード認証
  - `POST /api/admin/auth/logout` - セッション終了
  - `GET /api/admin/stats` - 統計情報取得
  - `GET /api/admin/rooms` - ルーム一覧（検索・フィルタ対応）
  - `GET /api/admin/rooms/[code]` - ルーム詳細（メッセージ含む）
  - `DELETE /api/admin/rooms/[code]` - ルーム強制削除
  - `POST /api/admin/cleanup` - 期限切れルームの手動クリーンアップ
- **ミドルウェア認証** - 未認証の `/admin` アクセスをログインページへリダイレクト

### Changed

- ミドルウェアを更新して `/admin` ルートを i18n とは別に処理

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

| Version | Date       | Description                          |
| ------- | ---------- | ------------------------------------ |
| 1.3.4   | 2026-01-09 | 管理認証Cookie処理リファクタリング   |
| 1.3.3   | 2025-12-29 | 管理画面ログアウト修正               |
| 1.3.2   | 2025-12-29 | 管理画面ログインリダイレクト修正     |
| 1.3.1   | 2025-12-29 | 管理画面ログイン400エラー修正        |
| 1.3.0   | 2025-12-29 | Next.js 15 & React 19 アップグレード |
| 1.2.0   | 2025-12-28 | 管理ダッシュボード                   |
| 1.1.3   | 2025-12-28 | フッター表示問題を修正               |
| 1.1.2   | 2025-12-28 | プライバシーポリシー・利用規約追加   |
| 1.1.1   | 2025-12-28 | XShareButton・シェアURL修正          |
| 1.1.0   | 2025-12-28 | レート制限、トースト通知、a11y改善   |
| 1.0.1   | 2025-12-28 | フッター追加                         |
| 1.0.0   | 2025-12-28 | 初回正式リリース                     |

[Unreleased]: https://github.com/beagleworks/Setsuna/compare/v1.3.4...HEAD
[1.3.4]: https://github.com/beagleworks/Setsuna/compare/v1.3.3...v1.3.4
[1.3.3]: https://github.com/beagleworks/Setsuna/compare/v1.3.2...v1.3.3
[1.3.2]: https://github.com/beagleworks/Setsuna/compare/v1.3.1...v1.3.2
[1.3.1]: https://github.com/beagleworks/Setsuna/compare/v1.3.0...v1.3.1
[1.3.0]: https://github.com/beagleworks/Setsuna/compare/v1.2.0...v1.3.0
[1.2.0]: https://github.com/beagleworks/Setsuna/compare/v1.1.3...v1.2.0
[1.1.3]: https://github.com/beagleworks/Setsuna/compare/v1.1.2...v1.1.3
[1.1.2]: https://github.com/beagleworks/Setsuna/compare/v1.1.1...v1.1.2
[1.1.1]: https://github.com/beagleworks/Setsuna/compare/v1.1.0...v1.1.1
[1.1.0]: https://github.com/beagleworks/Setsuna/compare/v1.0.1...v1.1.0
[1.0.1]: https://github.com/beagleworks/Setsuna/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/beagleworks/Setsuna/releases/tag/v1.0.0
