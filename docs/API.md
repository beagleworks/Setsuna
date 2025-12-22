# Setsuna - API仕様書

## 概要

SetsunaのREST APIおよびSSE（Server-Sent Events）エンドポイントの仕様を定義します。

## ベースURL

| 環境 | URL |
|------|-----|
| 開発 | `http://localhost:3000/api` |
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

| コード | HTTPステータス | 説明 |
|--------|----------------|------|
| `ROOM_NOT_FOUND` | 404 | ルームが存在しないまたは期限切れ |
| `ROOM_EXPIRED` | 410 | ルームの有効期限が切れている |
| `INVALID_ROOM_CODE` | 400 | ルームコードの形式が不正 |
| `CONTENT_TOO_LONG` | 400 | メッセージが10,000文字を超過 |
| `CONTENT_EMPTY` | 400 | メッセージが空 |
| `RATE_LIMIT_EXCEEDED` | 429 | レート制限を超過 |
| `INTERNAL_ERROR` | 500 | サーバー内部エラー |

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
      "code": "A1B2C3",
      "expiresAt": "2024-12-22T10:30:00.000Z"
    }
  }
}
```

#### レスポンスフィールド

| フィールド | 型 | 説明 |
|-----------|-----|------|
| `room.code` | string | 6文字のルームコード |
| `room.expiresAt` | string (ISO 8601) | 有効期限（作成から24時間後） |

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

| パラメータ | 型 | 説明 |
|-----------|-----|------|
| `code` | string | 6文字のルームコード |

#### レスポンス（成功時）

```json
{
  "success": true,
  "data": {
    "room": {
      "code": "A1B2C3",
      "expiresAt": "2024-12-22T10:30:00.000Z",
      "createdAt": "2024-12-21T10:30:00.000Z",
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
curl http://localhost:3000/api/rooms/A1B2C3
```

---

### 3. メッセージ一覧取得

ルーム内のメッセージ一覧を取得します。

```
GET /api/rooms/{code}/messages
```

#### パスパラメータ

| パラメータ | 型 | 説明 |
|-----------|-----|------|
| `code` | string | 6文字のルームコード |

#### クエリパラメータ

| パラメータ | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| `after` | string | No | このID以降のメッセージのみ取得 |
| `limit` | number | No | 取得件数（デフォルト: 50、最大: 100） |

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

| フィールド | 型 | 説明 |
|-----------|-----|------|
| `messages` | array | メッセージの配列 |
| `messages[].id` | string | メッセージID |
| `messages[].content` | string | メッセージ内容 |
| `messages[].createdAt` | string (ISO 8601) | 作成日時 |
| `hasMore` | boolean | さらにメッセージが存在するか |

#### 例

```bash
# 全件取得
curl http://localhost:3000/api/rooms/A1B2C3/messages

# 特定ID以降を取得
curl "http://localhost:3000/api/rooms/A1B2C3/messages?after=clq1234567890"
```

---

### 4. メッセージ送信

ルームに新しいメッセージを送信します。

```
POST /api/rooms/{code}/messages
```

#### パスパラメータ

| パラメータ | 型 | 説明 |
|-----------|-----|------|
| `code` | string | 6文字のルームコード |

#### リクエストボディ

```json
{
  "content": "共有したいテキスト"
}
```

| フィールド | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| `content` | string | Yes | メッセージ内容（1〜10,000文字） |

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
curl -X POST http://localhost:3000/api/rooms/A1B2C3/messages \
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

| パラメータ | 型 | 説明 |
|-----------|-----|------|
| `code` | string | 6文字のルームコード |

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
data: {"roomCode":"A1B2C3","timestamp":1703155800000}
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
const eventSource = new EventSource('/api/sse/A1B2C3');

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

| ヘッダー | 値 |
|----------|-----|
| `Authorization` | `Bearer {CRON_SECRET}` |

または、Vercel Cronからの呼び出し:

| ヘッダー | 値 |
|----------|-----|
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
```

---

## 関連ドキュメント

- [全体仕様書](./SPEC.md)
- [データベース仕様書](./DB.md)
- [UI/UX仕様書](./UI.md)
