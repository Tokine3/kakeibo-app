/**
 * データベースモジュール（Web用）
 * Webでは AsyncStorage を使用するため、SQLite関連は空実装
 */

// SQLiteDatabase型の代替定義
export type SQLiteDatabaseType = {
  execAsync: (sql: string) => Promise<void>;
  runAsync: (sql: string, ...params: unknown[]) => Promise<{ changes: number }>;
  getFirstAsync: <T>(sql: string, ...params: unknown[]) => Promise<T | null>;
  getAllAsync: <T>(sql: string, ...params: unknown[]) => Promise<T[]>;
  closeAsync: () => Promise<void>;
};

/**
 * Webプラットフォームかどうかを判定
 */
export function isWeb(): boolean {
  return true; // このファイルはWeb用
}

/**
 * データベース接続を取得
 * Web環境ではnullを返す
 */
export async function getDatabase(): Promise<SQLiteDatabaseType | null> {
  return null;
}

/**
 * データベース接続を閉じる
 */
export async function closeDatabase(): Promise<void> {
  // Web環境では何もしない
}

/**
 * IDを生成
 */
export function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 現在のISO日時を取得
 */
export function getCurrentTimestamp(): string {
  return new Date().toISOString();
}
