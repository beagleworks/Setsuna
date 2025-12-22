# Setsuna - データベース仕様書

## 概要

Setsunaは**Turso**（SQLite互換のエッジデータベース）を使用し、**Prisma ORM**でデータアクセスを行います。

## データベース構成

| 項目         | 値                     |
| ------------ | ---------------------- |
| データベース | Turso                  |
| エンジン     | libSQL (SQLite互換)    |
| ORM          | Prisma                 |
| アダプター   | @prisma/adapter-libsql |

### 環境別設定

| 環境 | 接続先                                   |
| ---- | ---------------------------------------- |
| 開発 | ローカルSQLiteファイル (`file:./dev.db`) |
| 本番 | Tursoクラウド (`libsql://xxx.turso.io`)  |

---

## スキーマ定義

### Prismaスキーマ

```prisma
// prisma/schema.prisma

generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["driverAdapters"]
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

model Room {
  id        String    @id @default(cuid())
  code      String    @unique
  createdAt DateTime  @default(now())
  expiresAt DateTime
  messages  Message[]

  @@index([code])
  @@index([expiresAt])
}

model Message {
  id        String   @id @default(cuid())
  content   String
  roomId    String
  room      Room     @relation(fields: [roomId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())

  @@index([roomId])
  @@index([createdAt])
}
```

---

## テーブル定義

### Room テーブル

ルーム（テキスト共有セッション）を管理します。

| カラム      | 型       | NULL | デフォルト | 説明                            |
| ----------- | -------- | ---- | ---------- | ------------------------------- |
| `id`        | TEXT     | NO   | `cuid()`   | 主キー（CUID形式）              |
| `code`      | TEXT     | NO   | -          | ルームコード（6文字、ユニーク） |
| `createdAt` | DATETIME | NO   | `now()`    | 作成日時                        |
| `expiresAt` | DATETIME | NO   | -          | 有効期限（作成から24時間後）    |

#### インデックス

| インデックス名       | カラム      | 用途                                 |
| -------------------- | ----------- | ------------------------------------ |
| `Room_code_key`      | `code`      | ルームコードでの検索（ユニーク制約） |
| `Room_expiresAt_idx` | `expiresAt` | 期限切れルームの検索・削除           |

#### 制約

- `code`: UNIQUE制約

---

### Message テーブル

ルーム内で共有されるテキストメッセージを管理します。

| カラム      | 型       | NULL | デフォルト | 説明                             |
| ----------- | -------- | ---- | ---------- | -------------------------------- |
| `id`        | TEXT     | NO   | `cuid()`   | 主キー（CUID形式）               |
| `content`   | TEXT     | NO   | -          | メッセージ内容（最大10,000文字） |
| `roomId`    | TEXT     | NO   | -          | 所属ルームID（外部キー）         |
| `createdAt` | DATETIME | NO   | `now()`    | 作成日時                         |

#### インデックス

| インデックス名          | カラム      | 用途                       |
| ----------------------- | ----------- | -------------------------- |
| `Message_roomId_idx`    | `roomId`    | ルームごとのメッセージ取得 |
| `Message_createdAt_idx` | `createdAt` | 時系列ソート               |

#### 外部キー制約

| 参照元   | 参照先    | ON DELETE |
| -------- | --------- | --------- |
| `roomId` | `Room.id` | CASCADE   |

> **CASCADE削除**: ルームが削除されると、関連するすべてのメッセージも自動的に削除されます。

---

## ER図

```
┌─────────────────────────────────────┐
│              Room                   │
├─────────────────────────────────────┤
│ id        : TEXT (PK, CUID)        │
│ code      : TEXT (UNIQUE)          │
│ createdAt : DATETIME               │
│ expiresAt : DATETIME               │
└─────────────────────────────────────┘
                 │
                 │ 1:N
                 ▼
┌─────────────────────────────────────┐
│             Message                 │
├─────────────────────────────────────┤
│ id        : TEXT (PK, CUID)        │
│ content   : TEXT                   │
│ roomId    : TEXT (FK → Room.id)    │
│ createdAt : DATETIME               │
└─────────────────────────────────────┘
```

---

## Prismaクライアント設定

### 統一実装（開発/本番自動切り替え）

```typescript
// src/lib/db.ts
import { PrismaClient } from '@prisma/client';
import { PrismaLibSQL } from '@prisma/adapter-libsql';
import { createClient } from '@libsql/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  // Production: Use Turso
  if (process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN) {
    const libsql = createClient({
      url: process.env.TURSO_DATABASE_URL,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
    const adapter = new PrismaLibSQL(libsql);
    return new PrismaClient({ adapter });
  }

  // Development: Use local SQLite
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
```

環境変数 `TURSO_DATABASE_URL` と `TURSO_AUTH_TOKEN` が設定されている場合はTursoに接続し、それ以外はローカルSQLiteを使用します。

---

## データ操作例

### ルーム作成

```typescript
import { prisma } from '@/lib/db';
import { generateRoomCode } from '@/lib/room-code';

const ROOM_EXPIRY_HOURS = 24;

async function createRoom() {
  const code = generateRoomCode();
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + ROOM_EXPIRY_HOURS);

  const room = await prisma.room.create({
    data: {
      code,
      expiresAt,
    },
  });

  return room;
}
```

### ルーム取得（有効期限チェック付き）

```typescript
async function getRoom(code: string) {
  const room = await prisma.room.findUnique({
    where: {
      code,
      expiresAt: {
        gt: new Date(), // 期限切れでないもの
      },
    },
    include: {
      _count: {
        select: { messages: true },
      },
    },
  });

  return room;
}
```

### メッセージ送信

```typescript
async function createMessage(roomCode: string, content: string) {
  const room = await prisma.room.findUnique({
    where: { code: roomCode },
  });

  if (!room) {
    throw new Error('Room not found');
  }

  const message = await prisma.message.create({
    data: {
      content,
      roomId: room.id,
    },
  });

  return message;
}
```

### メッセージ一覧取得

```typescript
async function getMessages(
  roomCode: string,
  options?: {
    after?: string;
    limit?: number;
  }
) {
  const { after, limit = 50 } = options ?? {};

  const room = await prisma.room.findUnique({
    where: { code: roomCode },
  });

  if (!room) {
    return [];
  }

  const messages = await prisma.message.findMany({
    where: {
      roomId: room.id,
      ...(after && {
        createdAt: {
          gt: (
            await prisma.message.findUnique({
              where: { id: after },
            })
          )?.createdAt,
        },
      }),
    },
    orderBy: {
      createdAt: 'asc',
    },
    take: limit + 1, // hasMore判定用に+1
  });

  const hasMore = messages.length > limit;
  if (hasMore) {
    messages.pop();
  }

  return { messages, hasMore };
}
```

### 期限切れルーム削除

```typescript
async function cleanupExpiredRooms() {
  const result = await prisma.room.deleteMany({
    where: {
      expiresAt: {
        lt: new Date(),
      },
    },
  });

  return result.count;
}
```

---

## マイグレーション

### 開発環境

```bash
# マイグレーション作成・適用
npx prisma migrate dev --name init

# Prismaクライアント生成
npx prisma generate

# DBリセット（開発用）
npx prisma migrate reset
```

### 本番環境 (Turso)

```bash
# スキーマをTursoに適用
npx prisma db push

# または、マイグレーションSQL生成
npx prisma migrate diff \
  --from-empty \
  --to-schema-datamodel ./prisma/schema.prisma \
  --script > migration.sql

# Turso CLIで適用
turso db shell setsuna < migration.sql
```

---

## 環境変数

| 変数名               | 開発環境        | 本番環境                |
| -------------------- | --------------- | ----------------------- |
| `DATABASE_URL`       | `file:./dev.db` | -                       |
| `TURSO_DATABASE_URL` | -               | `libsql://xxx.turso.io` |
| `TURSO_AUTH_TOKEN`   | -               | `eyJhbGciOi...`         |

---

## パフォーマンス考慮事項

### インデックス戦略

1. **`Room.code`**: ルームアクセス時の高速検索
2. **`Room.expiresAt`**: クリーンアップ処理の効率化
3. **`Message.roomId`**: ルームごとのメッセージ取得
4. **`Message.createdAt`**: 時系列ソート

### クエリ最適化

- `findUnique`を優先（インデックスを活用）
- ページネーションで大量データを防ぐ
- `select`で必要なフィールドのみ取得

### 接続プーリング

Tursoはコネクションレスなので、接続プーリングの設定は不要です。
ただし、Prismaのグローバルインスタンス化により、開発時のHot Reload問題を回避しています。

---

## 関連ドキュメント

- [全体仕様書](./SPEC.md)
- [API仕様書](./API.md)
- [UI/UX仕様書](./UI.md)
