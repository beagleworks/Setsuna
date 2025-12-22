/**
 * ルーム情報
 */
export interface Room {
  id: string;
  code: string;
  createdAt: string;
  expiresAt: string;
}

/**
 * メッセージ情報
 */
export interface Message {
  id: string;
  content: string;
  createdAt: string;
}

/**
 * APIエラー情報
 */
export interface ApiError {
  code: ErrorCode;
  message: string;
}

/**
 * API共通レスポンス
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiError;
}

/**
 * ルーム作成レスポンス
 */
export type CreateRoomResponse = ApiResponse<{
  room: Pick<Room, 'code' | 'expiresAt'>;
}>;

/**
 * ルーム取得レスポンス
 */
export type GetRoomResponse = ApiResponse<{
  room: Room & { messageCount: number };
}>;

/**
 * メッセージ一覧レスポンス
 */
export type GetMessagesResponse = ApiResponse<{
  messages: Message[];
  hasMore: boolean;
}>;

/**
 * メッセージ送信レスポンス
 */
export type CreateMessageResponse = ApiResponse<{
  message: Message;
}>;

/**
 * クリーンアップレスポンス
 */
export type CleanupResponse = ApiResponse<{
  deletedRooms: number;
  executedAt: string;
}>;

/**
 * SSEイベント型
 */
export type SSEEvent =
  | { type: 'connected'; data: { roomCode: string; timestamp: number } }
  | { type: 'message'; data: Message }
  | { type: 'ping'; data: { timestamp: number } };

/**
 * エラーコード
 */
export type ErrorCode =
  | 'ROOM_NOT_FOUND'
  | 'ROOM_EXPIRED'
  | 'INVALID_ROOM_CODE'
  | 'CONTENT_TOO_LONG'
  | 'CONTENT_EMPTY'
  | 'RATE_LIMIT_EXCEEDED'
  | 'UNAUTHORIZED'
  | 'INTERNAL_ERROR';

/**
 * エラーメッセージマップ
 */
export const ERROR_MESSAGES: Record<ErrorCode, string> = {
  ROOM_NOT_FOUND: '指定されたルームは存在しないか、有効期限が切れています',
  ROOM_EXPIRED: 'ルームの有効期限が切れています',
  INVALID_ROOM_CODE: 'ルームコードの形式が不正です',
  CONTENT_TOO_LONG: 'メッセージは10,000文字以内で入力してください',
  CONTENT_EMPTY: 'メッセージを入力してください',
  RATE_LIMIT_EXCEEDED: 'リクエストが多すぎます。しばらく待ってから再試行してください',
  UNAUTHORIZED: '認証が必要です',
  INTERNAL_ERROR: 'サーバーエラーが発生しました',
};

/**
 * 定数
 */
export const ROOM_EXPIRY_HOURS = 24;
export const MAX_MESSAGE_LENGTH = 10000;
export const DEFAULT_MESSAGE_LIMIT = 50;
export const MAX_MESSAGE_LIMIT = 100;
