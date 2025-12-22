# Setsuna - テスト仕様書

## 概要

Setsunaのテスト戦略と各テストケースの仕様を定義します。

## テスト戦略

### アプローチ：ハイブリッド（TDD + 後付けテスト）

t-wada氏のTDD（テスト駆動開発）の原則に従い、**入出力が明確でロジックが複雑な部分**にはTDDを適用し、**視覚的確認が必要なUI部分**には後付けテストを適用します。

| レイヤー | アプローチ | 理由 |
|----------|-----------|------|
| `src/lib/` | **TDD** | 純粋なロジック、明確な仕様 |
| `src/app/api/` | **TDD** | API仕様が定義済み |
| `src/components/` | **後付け** | 視覚的確認が必要 |
| `src/hooks/` | **ハイブリッド** | ロジック部分はTDD |
| E2E | **後付け** | 全体結合後に実施 |

### TDDサイクル（Red → Green → Refactor）

```
1. Red:      失敗するテストを書く
2. Green:   テストを通す最小限のコードを書く
3. Refactor: コードを整理する（テストは通ったまま）
```

---

## テストツール

| ツール | 用途 | バージョン |
|--------|------|-----------|
| Vitest | ユニット/統合テスト | ^2.0 |
| Testing Library | コンポーネントテスト | ^16 |
| MSW | APIモック | ^2.0 |
| Playwright | E2Eテスト | ^1.40 |

### 依存パッケージ

```json
{
  "devDependencies": {
    "vitest": "^2.0.0",
    "@vitest/coverage-v8": "^2.0.0",
    "@vitest/ui": "^2.0.0",
    "@testing-library/react": "^16.0.0",
    "@testing-library/user-event": "^14.5.0",
    "@testing-library/jest-dom": "^6.0.0",
    "msw": "^2.0.0",
    "playwright": "^1.40.0",
    "@playwright/test": "^1.40.0",
    "happy-dom": "^15.0.0"
  }
}
```

---

## テストディレクトリ構造

```
Setsuna/
├── src/
│   ├── lib/
│   │   ├── room-code.ts
│   │   ├── room-code.test.ts          # ユニットテスト（TDD）
│   │   ├── sse-manager.ts
│   │   └── sse-manager.test.ts        # ユニットテスト（TDD）
│   │
│   ├── app/api/
│   │   ├── rooms/
│   │   │   ├── route.ts
│   │   │   └── route.test.ts          # 統合テスト（TDD）
│   │   └── ...
│   │
│   └── components/
│       ├── CopyButton.tsx
│       └── CopyButton.test.tsx        # コンポーネントテスト（後付け）
│
├── e2e/
│   ├── room-flow.spec.ts              # E2Eテスト
│   └── fixtures/
│       └── test-data.ts
│
├── vitest.config.ts                   # Vitest設定
├── vitest.setup.ts                    # テストセットアップ
└── playwright.config.ts               # Playwright設定
```

---

## 設定ファイル

### vitest.config.ts

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'happy-dom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/**/*.d.ts',
        'src/types/',
        '**/*.config.*',
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80,
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

### vitest.setup.ts

```typescript
import '@testing-library/jest-dom';
import { beforeAll, afterEach, afterAll } from 'vitest';
import { server } from './src/mocks/server';

// MSWサーバーのセットアップ
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

### playwright.config.ts

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 13'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

---

## ユニットテスト仕様

### 1. room-code.ts（TDD）

#### generateRoomCode

| テストケース | 期待結果 | 優先度 |
|-------------|---------|--------|
| 6文字のコードを生成する | `code.length === 6` | 高 |
| 許可された文字のみを含む | `/^[A-HJ-NP-Z2-9]{6}$/` にマッチ | 高 |
| 紛らわしい文字を含まない | `0, O, 1, I, L` を含まない | 高 |
| 毎回異なるコードを生成する | 100回生成して重複なし | 中 |
| 暗号学的に安全な乱数を使用 | `crypto.randomBytes` を使用 | 高 |

```typescript
// src/lib/room-code.test.ts
import { describe, it, expect } from 'vitest';
import { generateRoomCode, validateRoomCode, ALLOWED_CHARS } from './room-code';

describe('generateRoomCode', () => {
  it('6文字のコードを生成する', () => {
    const code = generateRoomCode();
    expect(code).toHaveLength(6);
  });

  it('許可された文字のみを含む', () => {
    const code = generateRoomCode();
    const pattern = /^[A-HJ-NP-Z2-9]{6}$/;
    expect(code).toMatch(pattern);
  });

  it('紛らわしい文字（0, O, 1, I, L）を含まない', () => {
    // 100回生成して確認
    for (let i = 0; i < 100; i++) {
      const code = generateRoomCode();
      expect(code).not.toMatch(/[0O1IL]/);
    }
  });

  it('毎回異なるコードを生成する', () => {
    const codes = new Set<string>();
    for (let i = 0; i < 100; i++) {
      codes.add(generateRoomCode());
    }
    expect(codes.size).toBe(100);
  });

  it('十分なエントロピーを持つ（32^6 = 約10億通り）', () => {
    // ALLOWED_CHARSが32文字であることを確認
    expect(ALLOWED_CHARS).toHaveLength(32);
  });
});

describe('validateRoomCode', () => {
  it('有効なコードをtrueで返す', () => {
    expect(validateRoomCode('A1B2C3')).toBe(true);
    expect(validateRoomCode('ABCDEF')).toBe(true);
    expect(validateRoomCode('234567')).toBe(true);
  });

  it('6文字でない場合falseで返す', () => {
    expect(validateRoomCode('ABC')).toBe(false);
    expect(validateRoomCode('ABCDEFGH')).toBe(false);
    expect(validateRoomCode('')).toBe(false);
  });

  it('禁止文字を含む場合falseで返す', () => {
    expect(validateRoomCode('ABCD0E')).toBe(false); // 0を含む
    expect(validateRoomCode('ABCDOE')).toBe(false); // Oを含む
    expect(validateRoomCode('ABCD1E')).toBe(false); // 1を含む
    expect(validateRoomCode('ABCDIE')).toBe(false); // Iを含む
    expect(validateRoomCode('ABCDLE')).toBe(false); // Lを含む
  });

  it('小文字を含む場合falseで返す', () => {
    expect(validateRoomCode('abcdef')).toBe(false);
    expect(validateRoomCode('AbCdEf')).toBe(false);
  });
});
```

---

### 2. sse-manager.ts（TDD）

| テストケース | 期待結果 | 優先度 |
|-------------|---------|--------|
| 接続を追加できる | 接続がMapに追加される | 高 |
| 接続を削除できる | 接続がMapから削除される | 高 |
| ルームの全接続にブロードキャストできる | 全controllerにenqueueが呼ばれる | 高 |
| 存在しないルームへのブロードキャストは何もしない | エラーなく終了 | 中 |
| 接続数を取得できる | 正しい数を返す | 中 |
| 切断された接続は自動削除される | enqueue失敗時に削除 | 高 |

```typescript
// src/lib/sse-manager.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SSEManager } from './sse-manager';

describe('SSEManager', () => {
  let manager: SSEManager;
  let mockController: ReadableStreamDefaultController;

  beforeEach(() => {
    manager = new SSEManager();
    mockController = {
      enqueue: vi.fn(),
      close: vi.fn(),
      error: vi.fn(),
    } as unknown as ReadableStreamDefaultController;
  });

  it('接続を追加できる', () => {
    const connection = manager.addConnection('ROOM01', mockController);

    expect(connection.roomCode).toBe('ROOM01');
    expect(manager.getConnectionCount('ROOM01')).toBe(1);
  });

  it('同じルームに複数接続を追加できる', () => {
    const controller2 = { ...mockController, enqueue: vi.fn() };

    manager.addConnection('ROOM01', mockController);
    manager.addConnection('ROOM01', controller2 as any);

    expect(manager.getConnectionCount('ROOM01')).toBe(2);
  });

  it('接続を削除できる', () => {
    const connection = manager.addConnection('ROOM01', mockController);
    manager.removeConnection(connection);

    expect(manager.getConnectionCount('ROOM01')).toBe(0);
  });

  it('ルームの全接続にブロードキャストできる', () => {
    const controller2 = { enqueue: vi.fn() } as any;

    manager.addConnection('ROOM01', mockController);
    manager.addConnection('ROOM01', controller2);

    manager.broadcast('ROOM01', 'message', { text: 'hello' });

    expect(mockController.enqueue).toHaveBeenCalled();
    expect(controller2.enqueue).toHaveBeenCalled();
  });

  it('ブロードキャストはSSE形式でデータを送信する', () => {
    manager.addConnection('ROOM01', mockController);
    manager.broadcast('ROOM01', 'message', { text: 'hello' });

    const call = (mockController.enqueue as any).mock.calls[0][0];
    const decoded = new TextDecoder().decode(call);

    expect(decoded).toContain('event: message');
    expect(decoded).toContain('data: {"text":"hello"}');
  });

  it('存在しないルームへのブロードキャストは何もしない', () => {
    // エラーが発生しないことを確認
    expect(() => {
      manager.broadcast('NONEXISTENT', 'message', { text: 'hello' });
    }).not.toThrow();
  });

  it('接続数を取得できる', () => {
    expect(manager.getConnectionCount('ROOM01')).toBe(0);

    manager.addConnection('ROOM01', mockController);
    expect(manager.getConnectionCount('ROOM01')).toBe(1);

    manager.addConnection('ROOM01', { enqueue: vi.fn() } as any);
    expect(manager.getConnectionCount('ROOM01')).toBe(2);
  });

  it('切断された接続はブロードキャスト時に自動削除される', () => {
    const failingController = {
      enqueue: vi.fn().mockImplementation(() => {
        throw new Error('Connection closed');
      }),
    } as any;

    manager.addConnection('ROOM01', failingController);
    expect(manager.getConnectionCount('ROOM01')).toBe(1);

    manager.broadcast('ROOM01', 'message', { text: 'hello' });

    expect(manager.getConnectionCount('ROOM01')).toBe(0);
  });
});
```

---

## 統合テスト仕様（API）

### 3. POST /api/rooms（TDD）

| テストケース | 期待結果 | ステータス |
|-------------|---------|-----------|
| 新しいルームを作成し、コードを返す | `{ success: true, data: { room: {...} } }` | 201 |
| expiresAtは24時間後に設定される | `expiresAt - createdAt ≈ 24h` | 201 |
| ルームコードはユニーク | 重複時は再生成 | 201 |
| レート制限を超えると429を返す | `{ success: false, error: {...} }` | 429 |

```typescript
// src/app/api/rooms/route.test.ts
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { POST } from './route';
import { prisma } from '@/lib/db';

// Prismaモック
vi.mock('@/lib/db', () => ({
  prisma: {
    room: {
      create: vi.fn(),
      findUnique: vi.fn(),
    },
  },
}));

describe('POST /api/rooms', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('新しいルームを作成し、コードを返す', async () => {
    const mockRoom = {
      id: 'test-id',
      code: 'ABC123',
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    };

    (prisma.room.create as any).mockResolvedValue(mockRoom);

    const request = new Request('http://localhost/api/rooms', {
      method: 'POST',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.data.room.code).toHaveLength(6);
  });

  it('expiresAtは24時間後に設定される', async () => {
    const now = new Date();
    vi.setSystemTime(now);

    (prisma.room.create as any).mockImplementation(({ data }) => ({
      ...data,
      id: 'test-id',
    }));

    const request = new Request('http://localhost/api/rooms', {
      method: 'POST',
    });

    await POST(request);

    const createCall = (prisma.room.create as any).mock.calls[0][0];
    const expiresAt = new Date(createCall.data.expiresAt);
    const expectedExpiry = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    // 1分以内の誤差を許容
    expect(Math.abs(expiresAt.getTime() - expectedExpiry.getTime())).toBeLessThan(60000);

    vi.useRealTimers();
  });
});
```

### 4. GET /api/rooms/[code]（TDD）

| テストケース | 期待結果 | ステータス |
|-------------|---------|-----------|
| 存在するルームの情報を返す | ルーム情報 + messageCount | 200 |
| 存在しないルームは404を返す | `ROOM_NOT_FOUND` | 404 |
| 期限切れルームは410を返す | `ROOM_EXPIRED` | 410 |
| 無効なコード形式は400を返す | `INVALID_ROOM_CODE` | 400 |

```typescript
// src/app/api/rooms/[code]/route.test.ts
import { describe, it, expect, vi } from 'vitest';
import { GET } from './route';
import { prisma } from '@/lib/db';

vi.mock('@/lib/db');

describe('GET /api/rooms/[code]', () => {
  it('存在するルームの情報を返す', async () => {
    const mockRoom = {
      id: 'test-id',
      code: 'ABC123',
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      _count: { messages: 5 },
    };

    (prisma.room.findUnique as any).mockResolvedValue(mockRoom);

    const request = new Request('http://localhost/api/rooms/ABC123');
    const response = await GET(request, { params: { code: 'ABC123' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.room.code).toBe('ABC123');
    expect(data.data.room.messageCount).toBe(5);
  });

  it('存在しないルームは404を返す', async () => {
    (prisma.room.findUnique as any).mockResolvedValue(null);

    const request = new Request('http://localhost/api/rooms/NOROOM');
    const response = await GET(request, { params: { code: 'NOROOM' } });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.success).toBe(false);
    expect(data.error.code).toBe('ROOM_NOT_FOUND');
  });

  it('期限切れルームは410を返す', async () => {
    const mockRoom = {
      id: 'test-id',
      code: 'ABC123',
      createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000),
      expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 期限切れ
    };

    (prisma.room.findUnique as any).mockResolvedValue(mockRoom);

    const request = new Request('http://localhost/api/rooms/ABC123');
    const response = await GET(request, { params: { code: 'ABC123' } });
    const data = await response.json();

    expect(response.status).toBe(410);
    expect(data.error.code).toBe('ROOM_EXPIRED');
  });

  it('無効なコード形式は400を返す', async () => {
    const request = new Request('http://localhost/api/rooms/invalid');
    const response = await GET(request, { params: { code: 'invalid' } });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error.code).toBe('INVALID_ROOM_CODE');
  });
});
```

### 5. POST /api/rooms/[code]/messages（TDD）

| テストケース | 期待結果 | ステータス |
|-------------|---------|-----------|
| メッセージを作成する | 新しいメッセージ | 201 |
| SSEでブロードキャストする | `sseManager.broadcast` が呼ばれる | 201 |
| 10,000文字を超えると400を返す | `CONTENT_TOO_LONG` | 400 |
| 空のcontentは400を返す | `CONTENT_EMPTY` | 400 |
| 存在しないルームは404を返す | `ROOM_NOT_FOUND` | 404 |

```typescript
// src/app/api/rooms/[code]/messages/route.test.ts
import { describe, it, expect, vi } from 'vitest';
import { POST, GET } from './route';
import { prisma } from '@/lib/db';
import { sseManager } from '@/lib/sse-manager';

vi.mock('@/lib/db');
vi.mock('@/lib/sse-manager');

describe('POST /api/rooms/[code]/messages', () => {
  it('メッセージを作成する', async () => {
    const mockRoom = { id: 'room-id', code: 'ABC123' };
    const mockMessage = {
      id: 'msg-id',
      content: 'Hello, World!',
      createdAt: new Date(),
    };

    (prisma.room.findUnique as any).mockResolvedValue(mockRoom);
    (prisma.message.create as any).mockResolvedValue(mockMessage);

    const request = new Request('http://localhost/api/rooms/ABC123/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: 'Hello, World!' }),
    });

    const response = await POST(request, { params: { code: 'ABC123' } });
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.data.message.content).toBe('Hello, World!');
  });

  it('SSEでブロードキャストする', async () => {
    const mockRoom = { id: 'room-id', code: 'ABC123' };
    const mockMessage = { id: 'msg-id', content: 'Test', createdAt: new Date() };

    (prisma.room.findUnique as any).mockResolvedValue(mockRoom);
    (prisma.message.create as any).mockResolvedValue(mockMessage);

    const request = new Request('http://localhost/api/rooms/ABC123/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: 'Test' }),
    });

    await POST(request, { params: { code: 'ABC123' } });

    expect(sseManager.broadcast).toHaveBeenCalledWith(
      'ABC123',
      'message',
      expect.objectContaining({ content: 'Test' })
    );
  });

  it('10,000文字を超えると400を返す', async () => {
    const longContent = 'a'.repeat(10001);

    const request = new Request('http://localhost/api/rooms/ABC123/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: longContent }),
    });

    const response = await POST(request, { params: { code: 'ABC123' } });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error.code).toBe('CONTENT_TOO_LONG');
  });

  it('空のcontentは400を返す', async () => {
    const request = new Request('http://localhost/api/rooms/ABC123/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: '' }),
    });

    const response = await POST(request, { params: { code: 'ABC123' } });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error.code).toBe('CONTENT_EMPTY');
  });
});

describe('GET /api/rooms/[code]/messages', () => {
  it('メッセージ一覧を返す', async () => {
    const mockRoom = { id: 'room-id', code: 'ABC123' };
    const mockMessages = [
      { id: 'msg-1', content: 'First', createdAt: new Date() },
      { id: 'msg-2', content: 'Second', createdAt: new Date() },
    ];

    (prisma.room.findUnique as any).mockResolvedValue(mockRoom);
    (prisma.message.findMany as any).mockResolvedValue(mockMessages);

    const request = new Request('http://localhost/api/rooms/ABC123/messages');
    const response = await GET(request, { params: { code: 'ABC123' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data.messages).toHaveLength(2);
  });
});
```

---

## コンポーネントテスト仕様（後付け）

### 6. CopyButton

```typescript
// src/components/CopyButton.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CopyButton } from './CopyButton';

// クリップボードAPIのモック
const mockWriteText = vi.fn();
Object.assign(navigator, {
  clipboard: { writeText: mockWriteText },
});

describe('CopyButton', () => {
  it('レンダリングされる', () => {
    render(<CopyButton text="test" />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('クリックでクリップボードにコピーする', async () => {
    const user = userEvent.setup();
    render(<CopyButton text="Hello, World!" />);

    await user.click(screen.getByRole('button'));

    expect(mockWriteText).toHaveBeenCalledWith('Hello, World!');
  });

  it('コピー成功後にアイコンが変わる', async () => {
    const user = userEvent.setup();
    render(<CopyButton text="test" />);

    await user.click(screen.getByRole('button'));

    expect(screen.getByLabelText('コピー完了')).toBeInTheDocument();
  });

  it('3秒後に元のアイコンに戻る', async () => {
    vi.useFakeTimers();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

    render(<CopyButton text="test" />);
    await user.click(screen.getByRole('button'));

    vi.advanceTimersByTime(3000);

    expect(screen.getByLabelText('コピー')).toBeInTheDocument();
    vi.useRealTimers();
  });
});
```

### 7. MessageInput

```typescript
// src/components/MessageInput.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MessageInput } from './MessageInput';

describe('MessageInput', () => {
  it('テキストを入力できる', async () => {
    const user = userEvent.setup();
    render(<MessageInput onSubmit={vi.fn()} />);

    const textarea = screen.getByRole('textbox');
    await user.type(textarea, 'Hello');

    expect(textarea).toHaveValue('Hello');
  });

  it('送信ボタンでonSubmitが呼ばれる', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<MessageInput onSubmit={onSubmit} />);

    await user.type(screen.getByRole('textbox'), 'Test message');
    await user.click(screen.getByRole('button', { name: /送信/i }));

    expect(onSubmit).toHaveBeenCalledWith('Test message');
  });

  it('Ctrl+Enterで送信できる', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<MessageInput onSubmit={onSubmit} />);

    const textarea = screen.getByRole('textbox');
    await user.type(textarea, 'Test message');
    await user.keyboard('{Control>}{Enter}{/Control}');

    expect(onSubmit).toHaveBeenCalledWith('Test message');
  });

  it('空の状態では送信ボタンが無効', () => {
    render(<MessageInput onSubmit={vi.fn()} />);

    expect(screen.getByRole('button', { name: /送信/i })).toBeDisabled();
  });

  it('10,000文字を超えると警告表示', async () => {
    const user = userEvent.setup();
    render(<MessageInput onSubmit={vi.fn()} />);

    const longText = 'a'.repeat(10001);
    await user.type(screen.getByRole('textbox'), longText);

    expect(screen.getByText(/10,000文字を超えています/i)).toBeInTheDocument();
  });
});
```

### 8. RoomJoiner

```typescript
// src/components/RoomJoiner.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RoomJoiner } from './RoomJoiner';

describe('RoomJoiner', () => {
  it('6文字入力で参加ボタンが有効になる', async () => {
    const user = userEvent.setup();
    render(<RoomJoiner onJoin={vi.fn()} />);

    const input = screen.getByRole('textbox');
    await user.type(input, 'ABC123');

    expect(screen.getByRole('button', { name: /参加/i })).toBeEnabled();
  });

  it('6文字未満では参加ボタンが無効', async () => {
    const user = userEvent.setup();
    render(<RoomJoiner onJoin={vi.fn()} />);

    await user.type(screen.getByRole('textbox'), 'ABC');

    expect(screen.getByRole('button', { name: /参加/i })).toBeDisabled();
  });

  it('入力は自動的に大文字に変換される', async () => {
    const user = userEvent.setup();
    render(<RoomJoiner onJoin={vi.fn()} />);

    await user.type(screen.getByRole('textbox'), 'abc123');

    expect(screen.getByRole('textbox')).toHaveValue('ABC123');
  });

  it('無効な文字（0, O, 1, I, L）は入力できない', async () => {
    const user = userEvent.setup();
    render(<RoomJoiner onJoin={vi.fn()} />);

    await user.type(screen.getByRole('textbox'), 'A0O1IL');

    expect(screen.getByRole('textbox')).toHaveValue('A');
  });

  it('参加ボタンクリックでonJoinが呼ばれる', async () => {
    const user = userEvent.setup();
    const onJoin = vi.fn();
    render(<RoomJoiner onJoin={onJoin} />);

    await user.type(screen.getByRole('textbox'), 'ABC123');
    await user.click(screen.getByRole('button', { name: /参加/i }));

    expect(onJoin).toHaveBeenCalledWith('ABC123');
  });
});
```

---

## E2Eテスト仕様（Playwright）

### 9. ルーム作成→参加→テキスト共有フロー

```typescript
// e2e/room-flow.spec.ts
import { test, expect } from '@playwright/test';

test.describe('ルーム作成→参加→テキスト共有フロー', () => {
  test('ルームを作成できる', async ({ page }) => {
    await page.goto('/');

    await page.click('button:has-text("ルームを作成")');

    // ルームページにリダイレクトされる
    await expect(page).toHaveURL(/\/room\/[A-HJ-NP-Z2-9]{6}/);

    // ルームコードが表示される
    await expect(page.locator('[data-testid="room-code"]')).toBeVisible();
  });

  test('別タブでルームに参加できる', async ({ browser }) => {
    // タブ1: ルーム作成
    const context1 = await browser.newContext();
    const page1 = await context1.newPage();
    await page1.goto('/');
    await page1.click('button:has-text("ルームを作成")');

    // ルームコードを取得
    const roomCode = await page1.locator('[data-testid="room-code"]').textContent();

    // タブ2: ルーム参加
    const context2 = await browser.newContext();
    const page2 = await context2.newPage();
    await page2.goto('/');
    await page2.fill('input[placeholder*="ルームコード"]', roomCode!);
    await page2.click('button:has-text("参加")');

    // 同じルームにいることを確認
    await expect(page2).toHaveURL(`/room/${roomCode}`);

    await context1.close();
    await context2.close();
  });

  test('テキストを送信すると両方に表示される', async ({ browser }) => {
    // 2つのブラウザコンテキストを作成
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();
    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    // タブ1: ルーム作成
    await page1.goto('/');
    await page1.click('button:has-text("ルームを作成")');
    const roomCode = await page1.locator('[data-testid="room-code"]').textContent();

    // タブ2: ルーム参加
    await page2.goto(`/room/${roomCode}`);

    // タブ1からメッセージ送信
    await page1.fill('textarea', 'Hello from Tab 1!');
    await page1.click('button:has-text("送信")');

    // 両方のタブでメッセージが表示される
    await expect(page1.locator('text=Hello from Tab 1!')).toBeVisible();
    await expect(page2.locator('text=Hello from Tab 1!')).toBeVisible();

    await context1.close();
    await context2.close();
  });

  test('コピーボタンでクリップボードにコピーできる', async ({ page, context }) => {
    // クリップボードへのアクセスを許可
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);

    await page.goto('/');
    await page.click('button:has-text("ルームを作成")');

    // メッセージを送信
    await page.fill('textarea', 'Copy this text');
    await page.click('button:has-text("送信")');

    // コピーボタンをクリック
    await page.click('[data-testid="copy-button"]');

    // クリップボードの内容を確認
    const clipboardContent = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboardContent).toBe('Copy this text');
  });

  test('期限切れルームにはアクセスできない', async ({ page }) => {
    // 存在しないルームコードでアクセス
    await page.goto('/room/XXXXXX');

    // エラーメッセージが表示される
    await expect(page.locator('text=ルームが見つかりません')).toBeVisible();
  });
});
```

---

## テストコマンド

```bash
# ユニット/統合テスト実行
npm run test

# ウォッチモードで実行
npm run test:watch

# カバレッジレポート生成
npm run test:coverage

# UIモードで実行
npm run test:ui

# E2Eテスト実行
npm run test:e2e

# E2E（UIモード）
npm run test:e2e:ui
```

### package.json scripts

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "test:ui": "vitest --ui",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui"
  }
}
```

---

## Linter & Git Hooks

### husky + lint-staged

コミット前に自動でlint/formatを実行し、プッシュ前にテストを実行します。

| フック | タイミング | 実行内容 |
|--------|-----------|---------|
| pre-commit | `git commit` 前 | lint-staged（ESLint + Prettier） |
| pre-push | `git push` 前 | `npm run test` |

### lint-staged設定

```javascript
// lint-staged.config.mjs
export default {
  '*.{ts,tsx}': ['eslint --fix', 'prettier --write'],
  '*.{json,md,css}': ['prettier --write'],
};
```

### セットアップ

```bash
# Husky初期化（npm install時に自動実行）
npx husky init

# フック作成
echo "npx lint-staged" > .husky/pre-commit
echo "npm run test" > .husky/pre-push
```

---

## CI/CD設定

### GitHub Actions

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run ESLint
        run: npm run lint

      - name: Check Prettier formatting
        run: npm run format:check

  unit-test:
    runs-on: ubuntu-latest
    needs: lint
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run unit tests
        run: npm run test:coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v4
        with:
          files: ./coverage/lcov.info

  e2e-test:
    runs-on: ubuntu-latest
    needs: lint
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright browsers
        run: npx playwright install --with-deps

      - name: Run E2E tests
        run: npm run test:e2e

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: playwright-report/
```

---

## カバレッジ目標

| 対象 | 目標 |
|------|------|
| 全体 | 80%以上 |
| `src/lib/` | 90%以上 |
| `src/app/api/` | 85%以上 |
| `src/components/` | 75%以上 |

---

## 関連ドキュメント

- [全体仕様書](./SPEC.md)
- [API仕様書](./API.md)
- [データベース仕様書](./DB.md)
- [UI/UX仕様書](./UI.md)
