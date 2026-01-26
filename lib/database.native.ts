/**
 * データベースモジュール（Native用）
 * iOS/Androidでは SQLite を使用
 */
import * as SQLite from "expo-sqlite";

const DATABASE_NAME = "kakeibo.db";
const SCHEMA_VERSION = 1;

// SQLiteDatabase型の代替定義
export type SQLiteDatabaseType = {
  execAsync: (sql: string) => Promise<void>;
  runAsync: (sql: string, ...params: unknown[]) => Promise<{ changes: number }>;
  getFirstAsync: <T>(sql: string, ...params: unknown[]) => Promise<T | null>;
  getAllAsync: <T>(sql: string, ...params: unknown[]) => Promise<T[]>;
  closeAsync: () => Promise<void>;
};

let db: SQLite.SQLiteDatabase | null = null;

/**
 * Webプラットフォームかどうかを判定
 */
export function isWeb(): boolean {
  return false; // このファイルはNative用
}

/**
 * データベース接続を取得（シングルトン）
 */
export async function getDatabase(): Promise<SQLiteDatabaseType | null> {
  if (db) {
    return db as unknown as SQLiteDatabaseType;
  }

  db = await SQLite.openDatabaseAsync(DATABASE_NAME);
  await initializeSchema(db);
  return db as unknown as SQLiteDatabaseType;
}

/**
 * スキーマの初期化
 */
async function initializeSchema(database: SQLite.SQLiteDatabase): Promise<void> {
  // バージョン管理テーブル
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS schema_version (
      version INTEGER PRIMARY KEY
    );
  `);

  // 現在のバージョンを取得
  const result = await database.getFirstAsync<{ version: number }>(
    "SELECT version FROM schema_version LIMIT 1"
  );
  const currentVersion = result?.version ?? 0;

  if (currentVersion < SCHEMA_VERSION) {
    await runMigrations(database, currentVersion);
  }
}

/**
 * マイグレーションの実行
 */
async function runMigrations(
  database: SQLite.SQLiteDatabase,
  fromVersion: number
): Promise<void> {
  // Version 0 -> 1: 初期スキーマ
  if (fromVersion < 1) {
    await database.execAsync(`
      -- カテゴリテーブル
      CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        icon TEXT NOT NULL,
        color TEXT NOT NULL,
        is_default INTEGER NOT NULL DEFAULT 0,
        display_order INTEGER NOT NULL,
        type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
        custom_name TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      -- 取引テーブル
      CREATE TABLE IF NOT EXISTS transactions (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
        amount INTEGER NOT NULL,
        category_id TEXT,
        date TEXT NOT NULL,
        memo TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (category_id) REFERENCES categories(id)
      );

      -- インデックス
      CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
      CREATE INDEX IF NOT EXISTS idx_transactions_type_date ON transactions(type, date);
      CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category_id);
      CREATE INDEX IF NOT EXISTS idx_categories_type ON categories(type);
      CREATE INDEX IF NOT EXISTS idx_categories_order ON categories(display_order);

      -- 設定テーブル
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );
    `);
  }

  // バージョンを更新
  await database.runAsync(
    "INSERT OR REPLACE INTO schema_version (version) VALUES (?)",
    SCHEMA_VERSION
  );
}

/**
 * データベース接続を閉じる
 */
export async function closeDatabase(): Promise<void> {
  if (db) {
    await db.closeAsync();
    db = null;
  }
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
