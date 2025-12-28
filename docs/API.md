# Setsuna - API仕様書

## 概要

SetsunaのREST APIおよびSSE（Server-Sent Events）エンドポイントの仕様を定義します。

## ベースURL

| 環境 | URL                               |
| ---- | --------------------------------- |
| 開発 | `http://localhost:3000/api`       |
| 本番 | `https://your-app.vercel.app/api` |

## 共通仕様

### レスポンス形式

すべてのAPIはJSON形式でレスポンスを返します。

#### 成功時

```json
{
  "success": true,
  "data": { ... }
}
```

#### エラー時

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "エラーメッセージ"
  }
}
```

### エラーコード一覧

| コード                | HTTPステータス | 説明                             |
| --------------------- | -------------- | -------------------------------- |
| `ROOM_NOT_FOUND`      | 404            | ルームが存在しないまたは期限切れ |
| `ROOM_EXPIRED`        | 410            | ルームの有効期限が切れている     |
| `INVALID_ROOM_CODE`   | 400            | ルームコードの形式が不正         |
| `CONTENT_TOO_LONG`    | 400            | メッセージが10,000文字を超過     |
| `CONTENT_EMPTY`       | 400            | メッセージが空                   |
| `RATE_LIMIT_EXCEEDED` | 429            | レート制限を超過                 |
| `INVALID_PASSWORD`    | 400/401        | パスワードが無効または未指定     |
| `ADMIN_REQUIRED`      | 401            | 管理者認証が必要                 |
| `INTERNAL_ERROR`      | 500            | サーバー内部エラー               |

### レート制限

- **制限**: 1分あたり30リクエスト
- **対象**: IPアドレスごと
- **レスポンスヘッダー**:
  - `X-RateLimit-Limit`: 制限値
  - `X-RateLimit-Remaining`: 残りリクエスト数
  - `X-RateLimit-Reset`: リセット時刻（Unix timestamp）

---

## エンドポイント

### 1. ルーム作成

新しいルームを作成し、ルームコードを取得します。

```
POST /api/rooms
```

#### リクエスト

ボディは不要です。

#### レスポンス

```json
{
  "success": true,
  "data": {
    "room": {
      "code": "ABCD23",
      "expiresAt": "2024-12-22T10:30:00.000Z"
    }
  }
}
```

#### レスポンスフィールド

| フィールド       | 型                | 説明                                      |
| ---------------- | ----------------- | ----------------------------------------- |
| `room.code`      | string            | 6文字のルームコード（A-HJ-NP-Z, 2-9のみ） |
| `room.expiresAt` | string (ISO 8601) | 有効期限（作成から24時間後）              |

#### 例

```bash
curl -X POST http://localhost:3000/api/rooms
```

---

### 2. ルーム情報取得

指定したルームコードのルーム情報を取得します。

```
GET /api/rooms/{code}
```

#### パスパラメータ

| パラメータ | 型     | 説明                |
| ---------- | ------ | ------------------- |
| `code`     | string | 6文字のルームコード |

#### レスポンス（成功時）

```json
{
  "success": true,
  "data": {
    "room": {
      "id": "clq1234567890",
      "code": "ABCD23",
      "createdAt": "2024-12-21T10:30:00.000Z",
      "expiresAt": "2024-12-22T10:30:00.000Z",
      "messageCount": 5
    }
  }
}
```

#### レスポンス（失敗時）

```json
{
  "success": false,
  "error": {
    "code": "ROOM_NOT_FOUND",
    "message": "指定されたルームは存在しないか、有効期限が切れています"
  }
}
```

#### 例

```bash
curl http://localhost:3000/api/rooms/ABCD23
```

---

### 3. メッセージ一覧取得

ルーム内のメッセージ一覧を取得します。

```
GET /api/rooms/{code}/messages
```

#### パスパラメータ

| パラメータ | 型     | 説明                |
| ---------- | ------ | ------------------- |
| `code`     | string | 6文字のルームコード |

#### クエリパラメータ

| パラメータ | 型     | 必須 | 説明                                  |
| ---------- | ------ | ---- | ------------------------------------- |
| `after`    | string | No   | このID以降のメッセージのみ取得        |
| `limit`    | number | No   | 取得件数（デフォルト: 50、最大: 100） |

#### レスポンス

```json
{
  "success": true,
  "data": {
    "messages": [
      {
        "id": "clq1234567890",
        "content": "共有したいテキスト",
        "createdAt": "2024-12-21T10:30:00.000Z"
      },
      {
        "id": "clq1234567891",
        "content": "もう一つのメッセージ",
        "createdAt": "2024-12-21T10:31:00.000Z"
      }
    ],
    "hasMore": false
  }
}
```

#### レスポンスフィールド

| フィールド             | 型                | 説明                         |
| ---------------------- | ----------------- | ---------------------------- |
| `messages`             | array             | メッセージの配列             |
| `messages[].id`        | string            | メッセージID                 |
| `messages[].content`   | string            | メッセージ内容               |
| `messages[].createdAt` | string (ISO 8601) | 作成日時                     |
| `hasMore`              | boolean           | さらにメッセージが存在するか |

#### 例

```bash
# 全件取得
curl http://localhost:3000/api/rooms/ABCD23/messages

# 特定ID以降を取得
curl "http://localhost:3000/api/rooms/ABCD23/messages?after=clq1234567890"
```

---

### 4. メッセージ送信

ルームに新しいメッセージを送信します。

```
POST /api/rooms/{code}/messages
```

#### パスパラメータ

| パラメータ | 型     | 説明                |
| ---------- | ------ | ------------------- |
| `code`     | string | 6文字のルームコード |

#### リクエストボディ

```json
{
  "content": "共有したいテキスト"
}
```

| フィールド | 型     | 必須 | 説明                            |
| ---------- | ------ | ---- | ------------------------------- |
| `content`  | string | Yes  | メッセージ内容（1〜10,000文字） |

#### レスポンス

```json
{
  "success": true,
  "data": {
    "message": {
      "id": "clq1234567892",
      "content": "共有したいテキスト",
      "createdAt": "2024-12-21T10:32:00.000Z"
    }
  }
}
```

#### エラーレスポンス

```json
{
  "success": false,
  "error": {
    "code": "CONTENT_TOO_LONG",
    "message": "メッセージは10,000文字以内で入力してください"
  }
}
```

#### 例

```bash
curl -X POST http://localhost:3000/api/rooms/ABCD23/messages \
  -H "Content-Type: application/json" \
  -d '{"content": "共有したいテキスト"}'
```

---

### 5. SSEリアルタイム接続

Server-Sent Eventsを使用してリアルタイムにメッセージを受信します。

```
GET /api/sse/{code}
```

#### パスパラメータ

| パラメータ | 型     | 説明                |
| ---------- | ------ | ------------------- |
| `code`     | string | 6文字のルームコード |

#### レスポンスヘッダー

```
Content-Type: text/event-stream
Cache-Control: no-cache
Connection: keep-alive
```

#### イベント形式

##### connected（接続確立）

```
event: connected
data: {"roomCode":"ABCD23","timestamp":1703155800000}
```

##### message（新規メッセージ）

```
event: message
data: {"id":"clq1234567892","content":"共有したいテキスト","createdAt":"2024-12-21T10:32:00.000Z"}
```

##### ping（キープアライブ）

```
event: ping
data: {"timestamp":1703155830000}
```

30秒ごとに送信され、接続を維持します。

#### クライアント側実装例

```javascript
const eventSource = new EventSource('/api/sse/ABCD23');

eventSource.addEventListener('connected', (event) => {
  console.log('接続しました:', JSON.parse(event.data));
});

eventSource.addEventListener('message', (event) => {
  const message = JSON.parse(event.data);
  console.log('新しいメッセージ:', message);
});

eventSource.addEventListener('error', () => {
  console.log('接続エラー。再接続を試みます...');
});

// クリーンアップ
eventSource.close();
```

---

### 6. クリーンアップ（内部用）

期限切れのルームを削除します。Vercel Cron Jobsから1時間ごとに呼び出されます。

```
POST /api/cleanup
```

#### 認証

| ヘッダー        | 値                     |
| --------------- | ---------------------- |
| `Authorization` | `Bearer {CRON_SECRET}` |

または、Vercel Cronからの呼び出し:

| ヘッダー        | 値  |
| --------------- | --- |
| `x-vercel-cron` | `1` |

#### レスポンス

```json
{
  "success": true,
  "data": {
    "deletedRooms": 15,
    "executedAt": "2024-12-21T10:00:00.000Z"
  }
}
```

---

## 管理API

管理ダッシュボード用のAPI。すべて`/api/admin`パス配下。Cookie認証が必要なエンドポイントは`admin_token` Cookieを確認します。

### 7. 管理者ログイン

パスワード認証を行い、JWTトークンをCookieに設定します。

```
POST /api/admin/auth/login
```

#### リクエストボディ

```json
{
  "password": "your-admin-password"
}
```

#### レスポンス（成功時）

```json
{
  "success": true,
  "data": {
    "expiresAt": "2024-12-22T10:30:00.000Z"
  }
}
```

**Cookie**: `admin_token` (HttpOnly, Secure, SameSite=Strict, 24時間有効)

#### エラーレスポンス

```json
{
  "success": false,
  "error": {
    "code": "INVALID_PASSWORD",
    "message": "Invalid password"
  }
}
```

---

### 8. 管理者ログアウト

セッションを終了し、Cookie `admin_token` を削除します。

```
POST /api/admin/auth/logout
```

#### レスポンス

```json
{
  "success": true,
  "data": {
    "message": "Logged out successfully"
  }
}
```

---

### 9. 統計情報取得

ダッシュボード表示用の統計情報を取得します。

```
GET /api/admin/stats
```

#### 認証

Cookie: `admin_token` 必須

#### レスポンス

```json
{
  "success": true,
  "data": {
    "activeRooms": 42,
    "totalMessages": 1234,
    "roomsCreatedToday": 5,
    "messagesCreatedToday": 67,
    "dailyStats": [
      { "date": "2024-12-21", "rooms": 10, "messages": 50 },
      { "date": "2024-12-20", "rooms": 8, "messages": 42 }
    ]
  }
}
```

---

### 10. ルーム一覧取得

管理用のルーム一覧を取得します。

```
GET /api/admin/rooms
```

#### 認証

Cookie: `admin_token` 必須

#### クエリパラメータ

| パラメータ | 型     | 必須 | 説明                         |
| ---------- | ------ | ---- | ---------------------------- |
| `page`     | number | No   | ページ番号（デフォルト: 1）  |
| `search`   | string | No   | ルームコード検索             |
| `filter`   | string | No   | `active` / `expired` / `all` |

#### レスポンス

```json
{
  "success": true,
  "data": {
    "rooms": [
      {
        "code": "ABCD23",
        "createdAt": "2024-12-21T10:30:00.000Z",
        "expiresAt": "2024-12-22T10:30:00.000Z",
        "messageCount": 5,
        "isExpired": false
      }
    ],
    "pagination": {
      "page": 1,
      "totalPages": 5,
      "totalItems": 42
    }
  }
}
```

---

### 11. ルーム詳細取得

メッセージを含むルーム詳細を取得します。

```
GET /api/admin/rooms/{code}
```

#### 認証

Cookie: `admin_token` 必須

#### パスパラメータ

| パラメータ | 型     | 説明                |
| ---------- | ------ | ------------------- |
| `code`     | string | 6文字のルームコード |

#### レスポンス

```json
{
  "success": true,
  "data": {
    "room": {
      "code": "ABCD23",
      "createdAt": "2024-12-21T10:30:00.000Z",
      "expiresAt": "2024-12-22T10:30:00.000Z",
      "isExpired": false
    },
    "messages": [
      {
        "id": "clq1234567890",
        "content": "共有したいテキスト",
        "createdAt": "2024-12-21T10:30:00.000Z"
      }
    ]
  }
}
```

---

### 12. ルーム削除

指定したルームを強制削除します。

```
DELETE /api/admin/rooms/{code}
```

#### 認証

Cookie: `admin_token` 必須

#### パスパラメータ

| パラメータ | 型     | 説明                |
| ---------- | ------ | ------------------- |
| `code`     | string | 6文字のルームコード |

#### レスポンス

```json
{
  "success": true,
  "data": {
    "message": "Room deleted successfully"
  }
}
```

---

### 13. 手動クリーンアップ

期限切れルームを即時削除します。

```
POST /api/admin/cleanup
```

#### 認証

Cookie: `admin_token` 必須

#### レスポンス

```json
{
  "success": true,
  "data": {
    "deletedRooms": 15
  }
}
```

---

## TypeScript型定義

```typescript
// types/api.ts

// ルーム
interface Room {
  id: string;
  code: string;
  createdAt: string;
  expiresAt: string;
}

// メッセージ
interface Message {
  id: string;
  content: string;
  createdAt: string;
}

// API レスポンス
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

// ルーム作成レスポンス
type CreateRoomResponse = ApiResponse<{
  room: Pick<Room, 'code' | 'expiresAt'>;
}>;

// ルーム取得レスポンス
type GetRoomResponse = ApiResponse<{
  room: Room & { messageCount: number };
}>;

// メッセージ一覧レスポンス
type GetMessagesResponse = ApiResponse<{
  messages: Message[];
  hasMore: boolean;
}>;

// メッセージ送信レスポンス
type CreateMessageResponse = ApiResponse<{
  message: Message;
}>;

// SSEイベント
type SSEEvent =
  | { type: 'connected'; data: { roomCode: string; timestamp: number } }
  | { type: 'message'; data: Message }
  | { type: 'ping'; data: { timestamp: number } };

// 管理者統計
interface AdminStats {
  activeRooms: number;
  totalMessages: number;
  roomsCreatedToday: number;
  messagesCreatedToday: number;
  dailyStats: { date: string; rooms: number; messages: number }[];
}

// 管理者用ルーム
interface AdminRoom {
  code: string;
  createdAt: string;
  expiresAt: string;
  messageCount: number;
  isExpired: boolean;
}

// 管理者用メッセージ
interface AdminMessage {
  id: string;
  content: string;
  createdAt: string;
}

// ページネーション
interface Pagination {
  page: number;
  totalPages: number;
  totalItems: number;
}

// 管理者ログインレスポンス
type AdminLoginResponse = ApiResponse<{
  expiresAt: string;
}>;

// 統計情報レスポンス
type AdminStatsResponse = ApiResponse<AdminStats>;

// ルーム一覧レスポンス
type AdminRoomsResponse = ApiResponse<{
  rooms: AdminRoom[];
  pagination: Pagination;
}>;

// ルーム詳細レスポンス
type AdminRoomDetailResponse = ApiResponse<{
  room: Omit<AdminRoom, 'messageCount'>;
  messages: AdminMessage[];
}>;
```

---

## 関連ドキュメント

- [全体仕様書](./SPEC.md)
- [データベース仕様書](./DB.md)
- [UI/UX仕様書](./UI.md)
