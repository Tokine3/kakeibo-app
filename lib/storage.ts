import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Transaction, Category } from "@/types";

const STORAGE_KEYS = {
  TRANSACTIONS: "@kakeibo/transactions",
  CATEGORIES: "@kakeibo/categories",
  INITIALIZED: "@kakeibo/initialized",
  THEME_MODE: "@kakeibo/theme-mode",
} as const;

export type ThemeMode = "system" | "light" | "dark" | "pink" | "blue";

/**
 * デフォルトカテゴリ
 */
const DEFAULT_CATEGORIES: Omit<Category, "id" | "createdAt" | "updatedAt">[] = [
  // 支出カテゴリ
  { name: "食費", icon: "restaurant", color: "#FF6B6B", isDefault: true, order: 0, type: "expense" },
  { name: "交通費", icon: "directions-car", color: "#4ECDC4", isDefault: true, order: 1, type: "expense" },
  { name: "娯楽", icon: "sports-esports", color: "#FFD93D", isDefault: true, order: 2, type: "expense" },
  { name: "光熱費", icon: "lightbulb", color: "#95E1D3", isDefault: true, order: 3, type: "expense" },
  { name: "通信費", icon: "phone-iphone", color: "#A8E6CF", isDefault: true, order: 4, type: "expense" },
  { name: "医療費", icon: "local-hospital", color: "#FF8B94", isDefault: true, order: 5, type: "expense" },
  { name: "その他", icon: "more-horiz", color: "#C7CEEA", isDefault: true, order: 6, type: "expense" },
  // 収入カテゴリ
  { name: "給与", icon: "work", color: "#4CAF50", isDefault: true, order: 7, type: "income" },
  { name: "賞与", icon: "card-giftcard", color: "#8BC34A", isDefault: true, order: 8, type: "income" },
  { name: "臨時収入", icon: "trending-up", color: "#CDDC39", isDefault: true, order: 9, type: "income" },
  { name: "その他", icon: "more-horiz", color: "#FFC107", isDefault: true, order: 10, type: "income" },
];

/**
 * ストレージの初期化
 */
export async function initializeStorage(): Promise<void> {
  try {
    const initialized = await AsyncStorage.getItem(STORAGE_KEYS.INITIALIZED);
    
    if (!initialized) {
      // デフォルトカテゴリを作成
      const categories: Category[] = DEFAULT_CATEGORIES.map((cat, index) => ({
        ...cat,
        id: `cat_${Date.now()}_${index}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));
      
      await AsyncStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
      await AsyncStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify([]));
      await AsyncStorage.setItem(STORAGE_KEYS.INITIALIZED, "true");
    }
  } catch (error) {
    console.error("Failed to initialize storage:", error);
    throw error;
  }
}

/**
 * 取引を取得
 */
export async function getTransactions(): Promise<Transaction[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Failed to get transactions:", error);
    return [];
  }
}

/**
 * 取引を保存
 */
export async function saveTransaction(transaction: Omit<Transaction, "id" | "createdAt" | "updatedAt">): Promise<Transaction> {
  try {
    const transactions = await getTransactions();
    const newTransaction: Transaction = {
      ...transaction,
      id: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    transactions.push(newTransaction);
    await AsyncStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
    
    return newTransaction;
  } catch (error) {
    console.error("Failed to save transaction:", error);
    throw error;
  }
}

/**
 * 取引を更新
 */
export async function updateTransaction(id: string, updates: Partial<Omit<Transaction, "id" | "createdAt" | "updatedAt">>): Promise<Transaction | null> {
  try {
    const transactions = await getTransactions();
    const index = transactions.findIndex((t) => t.id === id);
    
    if (index === -1) {
      return null;
    }
    
    transactions[index] = {
      ...transactions[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    
    await AsyncStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
    
    return transactions[index];
  } catch (error) {
    console.error("Failed to update transaction:", error);
    throw error;
  }
}

/**
 * 取引を削除
 */
export async function deleteTransaction(id: string): Promise<boolean> {
  try {
    const transactions = await getTransactions();
    const filtered = transactions.filter((t) => t.id !== id);
    
    if (filtered.length === transactions.length) {
      return false;
    }
    
    await AsyncStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(filtered));
    return true;
  } catch (error) {
    console.error("Failed to delete transaction:", error);
    throw error;
  }
}

/**
 * カテゴリを取得
 */
export async function getCategories(): Promise<Category[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.CATEGORIES);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Failed to get categories:", error);
    return [];
  }
}

/**
 * カテゴリを保存
 */
export async function saveCategory(category: Omit<Category, "id" | "createdAt" | "updatedAt">): Promise<Category> {
  try {
    const categories = await getCategories();
    const newCategory: Category = {
      ...category,
      id: `cat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    categories.push(newCategory);
    await AsyncStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
    
    return newCategory;
  } catch (error) {
    console.error("Failed to save category:", error);
    throw error;
  }
}

/**
 * カテゴリを更新
 */
export async function updateCategory(id: string, updates: Partial<Omit<Category, "id" | "createdAt" | "updatedAt">>): Promise<Category | null> {
  try {
    const categories = await getCategories();
    const index = categories.findIndex((c) => c.id === id);
    
    if (index === -1) {
      return null;
    }
    
    categories[index] = {
      ...categories[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    
    await AsyncStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
    
    return categories[index];
  } catch (error) {
    console.error("Failed to update category:", error);
    throw error;
  }
}

/**
 * カテゴリを削除
 */
export async function deleteCategory(id: string): Promise<boolean> {
  try {
    const categories = await getCategories();
    const filtered = categories.filter((c) => c.id !== id);
    
    if (filtered.length === categories.length) {
      return false;
    }
    
    await AsyncStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(filtered));
    return true;
  } catch (error) {
    console.error("Failed to delete category:", error);
    throw error;
  }
}

/**
 * すべてのデータをクリア（開発用）
 */
export async function clearAllData(): Promise<void> {
  try {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.TRANSACTIONS,
      STORAGE_KEYS.CATEGORIES,
      STORAGE_KEYS.INITIALIZED,
    ]);
  } catch (error) {
    console.error("Failed to clear data:", error);
    throw error;
  }
}

/**
 * テーマモードを取得
 */
export async function getThemeMode(): Promise<ThemeMode> {
  try {
    const mode = await AsyncStorage.getItem(STORAGE_KEYS.THEME_MODE);
    return (mode as ThemeMode) || "system";
  } catch (error) {
    console.error("Failed to get theme mode:", error);
    return "system";
  }
}

/**
 * テーマモードを保存
 */
export async function saveThemeMode(mode: ThemeMode): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.THEME_MODE, mode);
  } catch (error) {
    console.error("Failed to save theme mode:", error);
    throw error;
  }
}
