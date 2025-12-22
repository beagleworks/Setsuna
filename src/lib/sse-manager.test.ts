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
    const connectionId = manager.addConnection('ROOM01', mockController);

    expect(connectionId).toBeDefined();
    expect(manager.getConnectionCount('ROOM01')).toBe(1);
  });

  it('同じルームに複数接続を追加できる', () => {
    const controller2 = {
      enqueue: vi.fn(),
      close: vi.fn(),
      error: vi.fn(),
    } as unknown as ReadableStreamDefaultController;

    manager.addConnection('ROOM01', mockController);
    manager.addConnection('ROOM01', controller2);

    expect(manager.getConnectionCount('ROOM01')).toBe(2);
  });

  it('接続を削除できる', () => {
    const connectionId = manager.addConnection('ROOM01', mockController);
    manager.removeConnection('ROOM01', connectionId);

    expect(manager.getConnectionCount('ROOM01')).toBe(0);
  });

  it('ルームの全接続にブロードキャストできる', () => {
    const controller2 = {
      enqueue: vi.fn(),
      close: vi.fn(),
      error: vi.fn(),
    } as unknown as ReadableStreamDefaultController;

    manager.addConnection('ROOM01', mockController);
    manager.addConnection('ROOM01', controller2);

    manager.broadcast('ROOM01', 'message', { text: 'hello' });

    expect(mockController.enqueue).toHaveBeenCalled();
    expect(controller2.enqueue).toHaveBeenCalled();
  });

  it('ブロードキャストはSSE形式でデータを送信する', () => {
    manager.addConnection('ROOM01', mockController);
    manager.broadcast('ROOM01', 'message', { text: 'hello' });

    const call = (mockController.enqueue as ReturnType<typeof vi.fn>).mock.calls[0][0];
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

    const controller2 = {
      enqueue: vi.fn(),
      close: vi.fn(),
      error: vi.fn(),
    } as unknown as ReadableStreamDefaultController;
    manager.addConnection('ROOM01', controller2);
    expect(manager.getConnectionCount('ROOM01')).toBe(2);
  });

  it('切断された接続はブロードキャスト時に自動削除される', () => {
    const failingController = {
      enqueue: vi.fn().mockImplementation(() => {
        throw new Error('Connection closed');
      }),
      close: vi.fn(),
      error: vi.fn(),
    } as unknown as ReadableStreamDefaultController;

    manager.addConnection('ROOM01', failingController);
    expect(manager.getConnectionCount('ROOM01')).toBe(1);

    manager.broadcast('ROOM01', 'message', { text: 'hello' });

    expect(manager.getConnectionCount('ROOM01')).toBe(0);
  });

  it('異なるルームは独立して管理される', () => {
    const controller2 = {
      enqueue: vi.fn(),
      close: vi.fn(),
      error: vi.fn(),
    } as unknown as ReadableStreamDefaultController;

    manager.addConnection('ROOM01', mockController);
    manager.addConnection('ROOM02', controller2);

    manager.broadcast('ROOM01', 'message', { text: 'hello' });

    expect(mockController.enqueue).toHaveBeenCalled();
    expect(controller2.enqueue).not.toHaveBeenCalled();
  });
});
