import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST } from './route';

// 有効なルームコード
const VALID_CODE = 'ABCD23';

// Prismaモック
vi.mock('@/lib/db', () => ({
  prisma: {
    room: {
      findUnique: vi.fn(),
    },
    message: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
  },
}));

// SSEマネージャーモック
vi.mock('@/lib/sse-manager', () => ({
  sseManager: {
    broadcast: vi.fn(),
  },
}));

import { prisma } from '@/lib/db';
import { sseManager } from '@/lib/sse-manager';

describe('GET /api/rooms/[code]/messages', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('メッセージ一覧を返す', async () => {
    const mockRoom = { id: 'room-id', code: VALID_CODE };
    const mockMessages = [
      { id: 'msg-1', content: 'First', createdAt: new Date() },
      { id: 'msg-2', content: 'Second', createdAt: new Date() },
    ];

    (prisma.room.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(mockRoom);
    (prisma.message.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(mockMessages);

    const request = new Request(`http://localhost/api/rooms/${VALID_CODE}/messages`);
    const response = await GET(request, { params: Promise.resolve({ code: VALID_CODE }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.messages).toHaveLength(2);
    expect(data.data.hasMore).toBe(false);
  });

  it('存在しないルームは404を返す', async () => {
    (prisma.room.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const request = new Request(`http://localhost/api/rooms/${VALID_CODE}/messages`);
    const response = await GET(request, { params: Promise.resolve({ code: VALID_CODE }) });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error.code).toBe('ROOM_NOT_FOUND');
  });
});

describe('POST /api/rooms/[code]/messages', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('メッセージを作成する', async () => {
    const mockRoom = { id: 'room-id', code: VALID_CODE };
    const mockMessage = {
      id: 'msg-id',
      content: 'Hello, World!',
      createdAt: new Date(),
    };

    (prisma.room.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(mockRoom);
    (prisma.message.create as ReturnType<typeof vi.fn>).mockResolvedValue(mockMessage);

    const request = new Request(`http://localhost/api/rooms/${VALID_CODE}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: 'Hello, World!' }),
    });

    const response = await POST(request, { params: Promise.resolve({ code: VALID_CODE }) });
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.data.message.content).toBe('Hello, World!');
  });

  it('SSEでブロードキャストする', async () => {
    const mockRoom = { id: 'room-id', code: VALID_CODE };
    const mockMessage = { id: 'msg-id', content: 'Test', createdAt: new Date() };

    (prisma.room.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(mockRoom);
    (prisma.message.create as ReturnType<typeof vi.fn>).mockResolvedValue(mockMessage);

    const request = new Request(`http://localhost/api/rooms/${VALID_CODE}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: 'Test' }),
    });

    await POST(request, { params: Promise.resolve({ code: VALID_CODE }) });

    expect(sseManager.broadcast).toHaveBeenCalledWith(
      VALID_CODE,
      'message',
      expect.objectContaining({ content: 'Test' })
    );
  });

  it('10,000文字を超えると400を返す', async () => {
    const longContent = 'a'.repeat(10001);

    const request = new Request(`http://localhost/api/rooms/${VALID_CODE}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: longContent }),
    });

    const response = await POST(request, { params: Promise.resolve({ code: VALID_CODE }) });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error.code).toBe('CONTENT_TOO_LONG');
  });

  it('空のcontentは400を返す', async () => {
    const request = new Request(`http://localhost/api/rooms/${VALID_CODE}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: '' }),
    });

    const response = await POST(request, { params: Promise.resolve({ code: VALID_CODE }) });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error.code).toBe('CONTENT_EMPTY');
  });

  it('存在しないルームは404を返す', async () => {
    (prisma.room.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const request = new Request(`http://localhost/api/rooms/${VALID_CODE}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: 'Test' }),
    });

    const response = await POST(request, { params: Promise.resolve({ code: VALID_CODE }) });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error.code).toBe('ROOM_NOT_FOUND');
  });
});
