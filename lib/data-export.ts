/**
 * データエクスポート/インポートモジュール（Web用）
 */
import * as DocumentPicker from "expo-document-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getTransactions, getCategories, getThemeMode } from "./storage";
import type { Transaction, Category } from "@/types";
import type { ThemeMode } from "./storage";

// AsyncStorageのキー（Web用）
const STORAGE_KEYS = {
  TRANSACTIONS: "@kakeibo/transactions",
  CATEGORIES: "@kakeibo/categories",
  THEME_MODE: "@kakeibo/theme-mode",
  INITIALIZED: "@kakeibo/initialized",
} as const;

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
 * データをJSONファイルとしてエクスポートし、ダウンロードする
 */
export async function exportData(): Promise<{ success: boolean; error?: string }> {
  try {
    const exportDataObj = await getExportData();
    const jsonString = JSON.stringify(exportDataObj, null, 2);

    // ファイル名を生成（日時を含む）
    const date = new Date();
    const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`;
    const fileName = `kakeibo_backup_${dateStr}.json`;

    // Blobを作成してダウンロード
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

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

    // Web用: fetchでファイル内容を取得
    const response = await fetch(pickedFile.uri);
    const content = await response.text();

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

    // AsyncStorageにデータを保存
    await AsyncStorage.setItem(
      STORAGE_KEYS.TRANSACTIONS,
      JSON.stringify(importDataObj.data.transactions)
    );
    await AsyncStorage.setItem(
      STORAGE_KEYS.CATEGORIES,
      JSON.stringify(importDataObj.data.categories)
    );
    if (importDataObj.data.themeMode) {
      await AsyncStorage.setItem(STORAGE_KEYS.THEME_MODE, importDataObj.data.themeMode);
    }
    await AsyncStorage.setItem(STORAGE_KEYS.INITIALIZED, "true");

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
