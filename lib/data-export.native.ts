/**
 * データエクスポート/インポートモジュール（Native用）
 */
import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import * as DocumentPicker from "expo-document-picker";
import { getTransactions, getCategories, getThemeMode, saveThemeMode } from "./storage";
import { getDatabase, getCurrentTimestamp } from "./database";
import type { Transaction, Category } from "@/types";
import type { ThemeMode } from "./storage";

/**
 * エクスポートデータの型定義
 */
export interface ExportData {
  version: number;
  exportedAt: string;
  data: {
    transactions: Transaction[];
    categories: Category[];
    themeMode: ThemeMode;
  };
}

const EXPORT_VERSION = 1;

/**
 * すべてのデータをエクスポート用のオブジェクトとして取得
 */
export async function getExportData(): Promise<ExportData> {
  const [transactions, categories, themeMode] = await Promise.all([
    getTransactions(),
    getCategories(),
    getThemeMode(),
  ]);

  return {
    version: EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    data: {
      transactions,
      categories,
      themeMode,
    },
  };
}

/**
 * データをJSONファイルとしてエクスポートし、共有する
 */
export async function exportData(): Promise<{ success: boolean; error?: string }> {
  try {
    const exportDataObj = await getExportData();
    const jsonString = JSON.stringify(exportDataObj, null, 2);

    // ファイル名を生成（日時を含む）
    const date = new Date();
    const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`;
    const fileName = `kakeibo_backup_${dateStr}.json`;

    // 一時ファイルとして保存
    const file = new File(Paths.cache, fileName);
    await file.write(jsonString);

    // 共有可能か確認
    const canShare = await Sharing.isAvailableAsync();
    if (!canShare) {
      return { success: false, error: "この端末では共有機能を利用できません。" };
    }

    // 共有ダイアログを表示
    await Sharing.shareAsync(file.uri, {
      mimeType: "application/json",
      dialogTitle: "家計簿データをエクスポート",
      UTI: "public.json",
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to export data:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "エクスポートに失敗しました。",
    };
  }
}

/**
 * インポートデータの検証
 */
function validateImportData(data: unknown): data is ExportData {
  if (!data || typeof data !== "object") {
    return false;
  }

  const obj = data as Record<string, unknown>;

  if (typeof obj.version !== "number") {
    return false;
  }

  if (!obj.data || typeof obj.data !== "object") {
    return false;
  }

  const dataObj = obj.data as Record<string, unknown>;

  if (!Array.isArray(dataObj.transactions)) {
    return false;
  }

  if (!Array.isArray(dataObj.categories)) {
    return false;
  }

  return true;
}

/**
 * JSONファイルからデータをインポート
 */
export async function importData(): Promise<{
  success: boolean;
  error?: string;
  stats?: {
    transactions: number;
    categories: number;
  };
}> {
  try {
    // ファイルピッカーを表示
    const result = await DocumentPicker.getDocumentAsync({
      type: "application/json",
      copyToCacheDirectory: true,
    });

    if (result.canceled) {
      return { success: false, error: "キャンセルされました。" };
    }

    const pickedFile = result.assets[0];
    if (!pickedFile) {
      return { success: false, error: "ファイルが選択されませんでした。" };
    }

    // ファイル内容を読み込み
    const file = new File(pickedFile.uri);
    const content = await file.text();

    // JSONをパース
    let importDataObj: unknown;
    try {
      importDataObj = JSON.parse(content);
    } catch {
      return { success: false, error: "JSONの形式が正しくありません。" };
    }

    // データの検証
    if (!validateImportData(importDataObj)) {
      return { success: false, error: "データの形式が正しくありません。" };
    }

    // バージョンチェック
    if (importDataObj.version > EXPORT_VERSION) {
      return {
        success: false,
        error: "このファイルは新しいバージョンのアプリで作成されました。アプリを更新してください。",
      };
    }

    // SQLiteにデータを保存
    const db = await getDatabase();
    if (!db) {
      return { success: false, error: "データベースが利用できません。" };
    }

    const timestamp = getCurrentTimestamp();

    // 既存データをクリア
    await db.execAsync(`
      DELETE FROM transactions;
      DELETE FROM categories;
    `);

    // カテゴリをインポート
    for (const cat of importDataObj.data.categories) {
      await db.runAsync(
        `INSERT INTO categories
         (id, name, icon, color, is_default, display_order, type, custom_name, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        cat.id,
        cat.name,
        cat.icon,
        cat.color,
        cat.isDefault ? 1 : 0,
        cat.order,
        cat.type,
        cat.customName ?? null,
        cat.createdAt || timestamp,
        cat.updatedAt || timestamp
      );
    }

    // 取引をインポート
    for (const txn of importDataObj.data.transactions) {
      await db.runAsync(
        `INSERT INTO transactions
         (id, type, amount, category_id, date, memo, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        txn.id,
        txn.type,
        txn.amount,
        txn.categoryId ?? null,
        txn.date,
        txn.memo ?? null,
        txn.createdAt || timestamp,
        txn.updatedAt || timestamp
      );
    }

    // テーマモードを保存
    if (importDataObj.data.themeMode) {
      await saveThemeMode(importDataObj.data.themeMode);
    }

    return {
      success: true,
      stats: {
        transactions: importDataObj.data.transactions.length,
        categories: importDataObj.data.categories.length,
      },
    };
  } catch (error) {
    console.error("Failed to import data:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "インポートに失敗しました。",
    };
  }
}

/**
 * エクスポートデータの概要を取得
 */
export async function getDataSummary(): Promise<{
  transactionCount: number;
  categoryCount: number;
  oldestTransaction?: string;
  newestTransaction?: string;
}> {
  const transactions = await getTransactions();
  const categories = await getCategories();

  let oldestTransaction: string | undefined;
  let newestTransaction: string | undefined;

  if (transactions.length > 0) {
    const sorted = [...transactions].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    oldestTransaction = sorted[0].date;
    newestTransaction = sorted[sorted.length - 1].date;
  }

  return {
    transactionCount: transactions.length,
    categoryCount: categories.length,
    oldestTransaction,
    newestTransaction,
  };
}
