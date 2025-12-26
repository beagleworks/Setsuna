/**
 * ルームあたりの最大接続数
 */
export const MAX_CONNECTIONS_PER_ROOM = 100;

/**
 * SSE接続情報
 */
interface SSEConnection {
  id: string;
  controller: ReadableStreamDefaultController;
}

/**
 * Server-Sent Eventsの接続を管理するクラス
 * ルームごとに複数の接続を管理し、ブロードキャスト機能を提供する
 */
export class SSEManager {
  private rooms: Map<string, Map<string, SSEConnection>> = new Map();
  private connectionIdCounter = 0;

  /**
   * 新しい接続をルームに追加する
   * @param roomCode ルームコード
   * @param controller SSEストリームのコントローラー
   * @returns 接続ID
   */
  addConnection(roomCode: string, controller: ReadableStreamDefaultController): string {
    const connectionId = `conn_${++this.connectionIdCounter}`;

    if (!this.rooms.has(roomCode)) {
      this.rooms.set(roomCode, new Map());
    }

    const room = this.rooms.get(roomCode)!;
    room.set(connectionId, { id: connectionId, controller });

    return connectionId;
  }

  /**
   * 接続を削除する
   * @param roomCode ルームコード
   * @param connectionId 接続ID
   */
  removeConnection(roomCode: string, connectionId: string): void {
    const room = this.rooms.get(roomCode);
    if (room) {
      room.delete(connectionId);
      // ルームが空になったら削除
      if (room.size === 0) {
        this.rooms.delete(roomCode);
      }
    }
  }

  /**
   * ルーム内の全接続にメッセージをブロードキャストする
   * @param roomCode ルームコード
   * @param eventType SSEイベントタイプ
   * @param data 送信するデータ
   */
  broadcast(roomCode: string, eventType: string, data: unknown): void {
    const room = this.rooms.get(roomCode);
    if (!room) {
      return;
    }

    const message = this.formatSSEMessage(eventType, data);
    const encoder = new TextEncoder();
    const encodedMessage = encoder.encode(message);

    const failedConnectionIds: string[] = [];

    room.forEach((connection, connectionId) => {
      try {
        connection.controller.enqueue(encodedMessage);
      } catch {
        // 接続が切断されている場合は削除リストに追加
        failedConnectionIds.push(connectionId);
      }
    });

    // 失敗した接続を削除
    failedConnectionIds.forEach((connectionId) => {
      this.removeConnection(roomCode, connectionId);
    });
  }

  /**
   * ルームの接続数を取得する
   * @param roomCode ルームコード
   * @returns 接続数
   */
  getConnectionCount(roomCode: string): number {
    const room = this.rooms.get(roomCode);
    return room ? room.size : 0;
  }

  /**
   * ルームに新しい接続を追加できるかチェックする
   * @param roomCode ルームコード
   * @returns 接続可能な場合はtrue
   */
  canConnect(roomCode: string): boolean {
    return this.getConnectionCount(roomCode) < MAX_CONNECTIONS_PER_ROOM;
  }

  /**
   * SSE形式のメッセージを生成する
   * @param eventType イベントタイプ
   * @param data データ
   * @returns SSE形式の文字列
   */
  private formatSSEMessage(eventType: string, data: unknown): string {
    const jsonData = JSON.stringify(data);
    return `event: ${eventType}\ndata: ${jsonData}\n\n`;
  }
}

/**
 * グローバルシングルトンインスタンス
 */
const globalForSSE = globalThis as unknown as {
  sseManager: SSEManager | undefined;
};

export const sseManager = globalForSSE.sseManager ?? new SSEManager();

if (process.env.NODE_ENV !== 'production') {
  globalForSSE.sseManager = sseManager;
}
