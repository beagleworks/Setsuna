/**
 * 管理画面用型定義
 */

import type { ApiResponse } from './api';

/**
 * 管理者JWTペイロード
 */
export interface AdminJWTPayload {
  role: 'admin';
  iat: number;
  exp: number;
}

/**
 * 統計情報
 */
export interface AdminStats {
  activeRooms: number;
  totalMessages: number;
  roomsCreatedToday: number;
  messagesCreatedToday: number;
  dailyStats: DailyStat[];
}

export interface DailyStat {
  date: string;
  rooms: number;
  messages: number;
}

/**
 * 管理画面用ルーム情報
 */
export interface AdminRoom {
  id: string;
  code: string;
  createdAt: string;
  expiresAt: string;
  messageCount: number;
  isExpired: boolean;
}

/**
 * ルーム詳細（メッセージ含む）
 */
export interface AdminRoomDetail extends AdminRoom {
  messages: AdminMessage[];
}

/**
 * 管理画面用メッセージ情報
 */
export interface AdminMessage {
  id: string;
  content: string;
  createdAt: string;
}

/**
 * ログインリクエスト
 */
export interface AdminLoginRequest {
  password: string;
}

/**
 * ログインレスポンス
 */
export type AdminLoginResponse = ApiResponse<{
  expiresAt: string;
}>;

/**
 * ログアウトレスポンス
 */
export type AdminLogoutResponse = ApiResponse<{
  loggedOut: boolean;
}>;

/**
 * 統計レスポンス
 */
export type AdminStatsResponse = ApiResponse<AdminStats>;

/**
 * ルーム一覧レスポンス
 */
export type AdminRoomsResponse = ApiResponse<{
  rooms: AdminRoom[];
  total: number;
  page: number;
  pageSize: number;
}>;

/**
 * ルーム詳細レスポンス
 */
export type AdminRoomDetailResponse = ApiResponse<{
  room: AdminRoomDetail;
}>;

/**
 * ルーム削除レスポンス
 */
export type AdminRoomDeleteResponse = ApiResponse<{
  deleted: boolean;
  code: string;
}>;

/**
 * クリーンアップレスポンス
 */
export type AdminCleanupResponse = ApiResponse<{
  deletedRooms: number;
  executedAt: string;
}>;

/**
 * ルーム一覧クエリパラメータ
 */
export interface AdminRoomsQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: 'all' | 'active' | 'expired';
  sortBy?: 'createdAt' | 'expiresAt' | 'messageCount';
  sortOrder?: 'asc' | 'desc';
}

/**
 * 管理用エラーコード
 */
export type AdminErrorCode = 'INVALID_PASSWORD' | 'SESSION_EXPIRED' | 'ADMIN_REQUIRED';

/**
 * 管理用定数
 */
export const ADMIN_SESSION_EXPIRY_HOURS = 24;
export const ADMIN_DEFAULT_PAGE_SIZE = 20;
export const ADMIN_MAX_PAGE_SIZE = 100;
export const ADMIN_LOGIN_RATE_LIMIT = 5; // 1分あたりの試行回数
