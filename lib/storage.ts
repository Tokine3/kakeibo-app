import AsyncStorage from "@react-native-async-storage/async-storage";
import { getDatabase, generateId, getCurrentTimestamp, isWeb } from "./database";
import type { Transaction, Category } from "@/types";

export type ThemeMode = "system" | "light" | "dark" | "pink" | "blue";

// AsyncStorageのキー
const STORAGE_KEYS = {
  TRANSACTIONS: "@kakeibo/transactions",
  CATEGORIES: "@kakeibo/categories",
  INITIALIZED: "@kakeibo/initialized",
  THEME_MODE: "@kakeibo/theme-mode",
  MIGRATED: "@kakeibo/migrated-to-sqlite",
} as const;

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
 * SQLiteの行からCategoryオブジェクトに変換
 */
function rowToCategory(row: Record<string, unknown>): Category {
  return {
    id: row.id as string,
    name: row.name as string,
    icon: row.icon as string,
    color: row.color as string,
    isDefault: (row.is_default as number) === 1,
    order: row.display_order as number,
    type: row.type as "income" | "expense",
    customName: row.custom_name as string | undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

/**
 * SQLiteの行からTransactionオブジェクトに変換
 */
function rowToTransaction(row: Record<string, unknown>): Transaction {
  return {
    id: row.id as string,
    type: row.type as "income" | "expense",
    amount: row.amount as number,
    categoryId: row.category_id as string | undefined,
    date: row.date as string,
    memo: row.memo as string | undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

/**
 * AsyncStorageからSQLiteへのマイグレーション（ネイティブのみ）
 */
async function migrateFromAsyncStorage(): Promise<void> {
  if (isWeb()) return;

  try {
    const migrated = await AsyncStorage.getItem(STORAGE_KEYS.MIGRATED);
    if (migrated === "true") {
      return; // 既にマイグレーション済み
    }

    const db = await getDatabase();
    if (!db) return;

    // カテゴリのマイグレーション
    const categoriesJson = await AsyncStorage.getItem(STORAGE_KEYS.CATEGORIES);
    if (categoriesJson) {
      const categories: Category[] = JSON.parse(categoriesJson);
      for (const cat of categories) {
        await db.runAsync(
          `INSERT OR REPLACE INTO categories
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
          cat.createdAt,
          cat.updatedAt
        );
      }
    }

    // 取引のマイグレーション
    const transactionsJson = await AsyncStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    if (transactionsJson) {
      const transactions: Transaction[] = JSON.parse(transactionsJson);
      for (const txn of transactions) {
        await db.runAsync(
          `INSERT OR REPLACE INTO transactions
           (id, type, amount, category_id, date, memo, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          txn.id,
          txn.type,
          txn.amount,
          txn.categoryId ?? null,
          txn.date,
          txn.memo ?? null,
          txn.createdAt,
          txn.updatedAt
        );
      }
    }

    // テーマ設定のマイグレーション
    const themeMode = await AsyncStorage.getItem(STORAGE_KEYS.THEME_MODE);
    if (themeMode) {
      await db.runAsync(
        "INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)",
        "theme_mode",
        themeMode
      );
    }

    // マイグレーション完了フラグを設定
    await AsyncStorage.setItem(STORAGE_KEYS.MIGRATED, "true");

    console.log("Migration from AsyncStorage to SQLite completed");
  } catch (error) {
    console.error("Failed to migrate from AsyncStorage:", error);
  }
}

// ============================================
// Web用 AsyncStorage 実装
// ============================================

async function initializeStorageWeb(): Promise<void> {
  try {
    const initialized = await AsyncStorage.getItem(STORAGE_KEYS.INITIALIZED);
    if (initialized === "true") {
      return;
    }

    // デフォルトカテゴリを作成
    const timestamp = getCurrentTimestamp();
    const categories: Category[] = DEFAULT_CATEGORIES.map((cat, index) => ({
      ...cat,
      id: generateId("cat"),
      createdAt: timestamp,
      updatedAt: timestamp,
    }));

    await AsyncStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
    await AsyncStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify([]));
    await AsyncStorage.setItem(STORAGE_KEYS.INITIALIZED, "true");
  } catch (error) {
    console.error("Failed to initialize storage (Web):", error);
    throw error;
  }
}

async function getTransactionsWeb(): Promise<Transaction[]> {
  try {
    const json = await AsyncStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    if (!json) return [];
    const transactions: Transaction[] = JSON.parse(json);
    return transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  } catch (error) {
    console.error("Failed to get transactions (Web):", error);
    return [];
  }
}

async function saveTransactionWeb(
  transaction: Omit<Transaction, "id" | "createdAt" | "updatedAt">
): Promise<Transaction> {
  try {
    const transactions = await getTransactionsWeb();
    const timestamp = getCurrentTimestamp();
    const newTransaction: Transaction = {
      ...transaction,
      id: generateId("txn"),
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    transactions.push(newTransaction);
    await AsyncStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
    return newTransaction;
  } catch (error) {
    console.error("Failed to save transaction (Web):", error);
    throw error;
  }
}

async function updateTransactionWeb(
  id: string,
  updates: Partial<Omit<Transaction, "id" | "createdAt" | "updatedAt">>
): Promise<Transaction | null> {
  try {
    const transactions = await getTransactionsWeb();
    const index = transactions.findIndex((t) => t.id === id);
    if (index === -1) return null;

    const timestamp = getCurrentTimestamp();
    transactions[index] = {
      ...transactions[index],
      ...updates,
      updatedAt: timestamp,
    };
    await AsyncStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
    return transactions[index];
  } catch (error) {
    console.error("Failed to update transaction (Web):", error);
    throw error;
  }
}

async function deleteTransactionWeb(id: string): Promise<boolean> {
  try {
    const transactions = await getTransactionsWeb();
    const filtered = transactions.filter((t) => t.id !== id);
    if (filtered.length === transactions.length) return false;
    await AsyncStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(filtered));
    return true;
  } catch (error) {
    console.error("Failed to delete transaction (Web):", error);
    throw error;
  }
}

async function getCategoriesWeb(): Promise<Category[]> {
  try {
    const json = await AsyncStorage.getItem(STORAGE_KEYS.CATEGORIES);
    if (!json) return [];
    const categories: Category[] = JSON.parse(json);
    return categories.sort((a, b) => a.order - b.order);
  } catch (error) {
    console.error("Failed to get categories (Web):", error);
    return [];
  }
}

async function saveCategoryWeb(
  category: Omit<Category, "id" | "createdAt" | "updatedAt">
): Promise<Category> {
  try {
    const categories = await getCategoriesWeb();
    const timestamp = getCurrentTimestamp();
    const newCategory: Category = {
      ...category,
      id: generateId("cat"),
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    categories.push(newCategory);
    await AsyncStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
    return newCategory;
  } catch (error) {
    console.error("Failed to save category (Web):", error);
    throw error;
  }
}

async function updateCategoryWeb(
  id: string,
  updates: Partial<Omit<Category, "id" | "createdAt" | "updatedAt">>
): Promise<Category | null> {
  try {
    const categories = await getCategoriesWeb();
    const index = categories.findIndex((c) => c.id === id);
    if (index === -1) return null;

    const timestamp = getCurrentTimestamp();
    categories[index] = {
      ...categories[index],
      ...updates,
      updatedAt: timestamp,
    };
    await AsyncStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
    return categories[index];
  } catch (error) {
    console.error("Failed to update category (Web):", error);
    throw error;
  }
}

async function deleteCategoryWeb(id: string): Promise<boolean> {
  try {
    const categories = await getCategoriesWeb();
    const filtered = categories.filter((c) => c.id !== id);
    if (filtered.length === categories.length) return false;
    await AsyncStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(filtered));
    return true;
  } catch (error) {
    console.error("Failed to delete category (Web):", error);
    throw error;
  }
}

async function updateCategoryOrdersWeb(
  categoryOrders: { id: string; order: number }[]
): Promise<void> {
  try {
    const categories = await getCategoriesWeb();
    const timestamp = getCurrentTimestamp();
    const orderMap = new Map(categoryOrders.map((c) => [c.id, c.order]));

    const updatedCategories = categories.map((cat) => {
      const newOrder = orderMap.get(cat.id);
      if (newOrder !== undefined) {
        return { ...cat, order: newOrder, updatedAt: timestamp };
      }
      return cat;
    });

    await AsyncStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(updatedCategories));
  } catch (error) {
    console.error("Failed to update category orders (Web):", error);
    throw error;
  }
}

async function clearAllDataWeb(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEYS.TRANSACTIONS);
    await AsyncStorage.removeItem(STORAGE_KEYS.CATEGORIES);
    await AsyncStorage.removeItem(STORAGE_KEYS.THEME_MODE);
    await AsyncStorage.removeItem(STORAGE_KEYS.INITIALIZED);
  } catch (error) {
    console.error("Failed to clear data (Web):", error);
    throw error;
  }
}

async function getThemeModeWeb(): Promise<ThemeMode> {
  try {
    const mode = await AsyncStorage.getItem(STORAGE_KEYS.THEME_MODE);
    return (mode as ThemeMode) || "system";
  } catch (error) {
    console.error("Failed to get theme mode (Web):", error);
    return "system";
  }
}

async function saveThemeModeWeb(mode: ThemeMode): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.THEME_MODE, mode);
  } catch (error) {
    console.error("Failed to save theme mode (Web):", error);
    throw error;
  }
}

// ============================================
// Native用 SQLite 実装
// ============================================

async function initializeStorageNative(): Promise<void> {
  try {
    const db = await getDatabase();
    if (!db) return;

    // AsyncStorageからのマイグレーションを試行
    await migrateFromAsyncStorage();

    // カテゴリが存在するか確認
    const result = await db.getFirstAsync<{ count: number }>(
      "SELECT COUNT(*) as count FROM categories"
    );

    if (!result || result.count === 0) {
      // デフォルトカテゴリを作成
      const timestamp = getCurrentTimestamp();
      for (let i = 0; i < DEFAULT_CATEGORIES.length; i++) {
        const cat = DEFAULT_CATEGORIES[i];
        const id = generateId("cat");
        await db.runAsync(
          `INSERT INTO categories
           (id, name, icon, color, is_default, display_order, type, custom_name, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          id,
          cat.name,
          cat.icon,
          cat.color,
          cat.isDefault ? 1 : 0,
          cat.order,
          cat.type,
          null,
          timestamp,
          timestamp
        );
      }
    }
  } catch (error) {
    console.error("Failed to initialize storage (Native):", error);
    throw error;
  }
}

async function getTransactionsNative(): Promise<Transaction[]> {
  try {
    const db = await getDatabase();
    if (!db) return [];
    const rows = await db.getAllAsync<Record<string, unknown>>(
      "SELECT * FROM transactions ORDER BY date DESC"
    );
    return rows.map(rowToTransaction);
  } catch (error) {
    console.error("Failed to get transactions (Native):", error);
    return [];
  }
}

async function saveTransactionNative(
  transaction: Omit<Transaction, "id" | "createdAt" | "updatedAt">
): Promise<Transaction> {
  const db = await getDatabase();
  if (!db) throw new Error("Database not available");

  const id = generateId("txn");
  const timestamp = getCurrentTimestamp();

  await db.runAsync(
    `INSERT INTO transactions
     (id, type, amount, category_id, date, memo, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    id,
    transaction.type,
    transaction.amount,
    transaction.categoryId ?? null,
    transaction.date,
    transaction.memo ?? null,
    timestamp,
    timestamp
  );

  return {
    ...transaction,
    id,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

async function updateTransactionNative(
  id: string,
  updates: Partial<Omit<Transaction, "id" | "createdAt" | "updatedAt">>
): Promise<Transaction | null> {
  const db = await getDatabase();
  if (!db) return null;

  const timestamp = getCurrentTimestamp();

  // 現在のデータを取得
  const current = await db.getFirstAsync<Record<string, unknown>>(
    "SELECT * FROM transactions WHERE id = ?",
    id
  );

  if (!current) {
    return null;
  }

  const updated = {
    type: updates.type ?? current.type,
    amount: updates.amount ?? current.amount,
    categoryId: updates.categoryId !== undefined ? updates.categoryId : current.category_id,
    date: updates.date ?? current.date,
    memo: updates.memo !== undefined ? updates.memo : current.memo,
  };

  await db.runAsync(
    `UPDATE transactions
     SET type = ?, amount = ?, category_id = ?, date = ?, memo = ?, updated_at = ?
     WHERE id = ?`,
    updated.type as string,
    updated.amount as number,
    (updated.categoryId as string | null) ?? null,
    updated.date as string,
    (updated.memo as string | null) ?? null,
    timestamp,
    id
  );

  return {
    id,
    type: updated.type as "income" | "expense",
    amount: updated.amount as number,
    categoryId: updated.categoryId as string | undefined,
    date: updated.date as string,
    memo: updated.memo as string | undefined,
    createdAt: current.created_at as string,
    updatedAt: timestamp,
  };
}

async function deleteTransactionNative(id: string): Promise<boolean> {
  const db = await getDatabase();
  if (!db) return false;
  const result = await db.runAsync("DELETE FROM transactions WHERE id = ?", id);
  return result.changes > 0;
}

async function getCategoriesNative(): Promise<Category[]> {
  try {
    const db = await getDatabase();
    if (!db) return [];
    const rows = await db.getAllAsync<Record<string, unknown>>(
      "SELECT * FROM categories ORDER BY display_order ASC"
    );
    return rows.map(rowToCategory);
  } catch (error) {
    console.error("Failed to get categories (Native):", error);
    return [];
  }
}

async function saveCategoryNative(
  category: Omit<Category, "id" | "createdAt" | "updatedAt">
): Promise<Category> {
  const db = await getDatabase();
  if (!db) throw new Error("Database not available");

  const id = generateId("cat");
  const timestamp = getCurrentTimestamp();

  await db.runAsync(
    `INSERT INTO categories
     (id, name, icon, color, is_default, display_order, type, custom_name, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    id,
    category.name,
    category.icon,
    category.color,
    category.isDefault ? 1 : 0,
    category.order,
    category.type,
    category.customName ?? null,
    timestamp,
    timestamp
  );

  return {
    ...category,
    id,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

async function updateCategoryNative(
  id: string,
  updates: Partial<Omit<Category, "id" | "createdAt" | "updatedAt">>
): Promise<Category | null> {
  const db = await getDatabase();
  if (!db) return null;

  const timestamp = getCurrentTimestamp();

  // 現在のデータを取得
  const current = await db.getFirstAsync<Record<string, unknown>>(
    "SELECT * FROM categories WHERE id = ?",
    id
  );

  if (!current) {
    return null;
  }

  const updated = {
    name: updates.name ?? current.name,
    icon: updates.icon ?? current.icon,
    color: updates.color ?? current.color,
    isDefault: updates.isDefault !== undefined ? updates.isDefault : (current.is_default as number) === 1,
    order: updates.order ?? current.display_order,
    type: updates.type ?? current.type,
    customName: updates.customName !== undefined ? updates.customName : current.custom_name,
  };

  await db.runAsync(
    `UPDATE categories
     SET name = ?, icon = ?, color = ?, is_default = ?, display_order = ?, type = ?, custom_name = ?, updated_at = ?
     WHERE id = ?`,
    updated.name as string,
    updated.icon as string,
    updated.color as string,
    updated.isDefault ? 1 : 0,
    updated.order as number,
    updated.type as string,
    (updated.customName as string | null) ?? null,
    timestamp,
    id
  );

  return {
    id,
    name: updated.name as string,
    icon: updated.icon as string,
    color: updated.color as string,
    isDefault: updated.isDefault,
    order: updated.order as number,
    type: updated.type as "income" | "expense",
    customName: updated.customName as string | undefined,
    createdAt: current.created_at as string,
    updatedAt: timestamp,
  };
}

async function deleteCategoryNative(id: string): Promise<boolean> {
  const db = await getDatabase();
  if (!db) return false;
  const result = await db.runAsync("DELETE FROM categories WHERE id = ?", id);
  return result.changes > 0;
}

async function updateCategoryOrdersNative(
  categoryOrders: { id: string; order: number }[]
): Promise<void> {
  const db = await getDatabase();
  if (!db) return;

  const timestamp = getCurrentTimestamp();
  for (const { id, order } of categoryOrders) {
    await db.runAsync(
      "UPDATE categories SET display_order = ?, updated_at = ? WHERE id = ?",
      order,
      timestamp,
      id
    );
  }
}

async function clearAllDataNative(): Promise<void> {
  const db = await getDatabase();
  if (!db) return;
  await db.execAsync(`
    DELETE FROM transactions;
    DELETE FROM categories;
    DELETE FROM settings;
  `);
}

async function getThemeModeNative(): Promise<ThemeMode> {
  try {
    const db = await getDatabase();
    if (!db) return "system";
    const result = await db.getFirstAsync<{ value: string }>(
      "SELECT value FROM settings WHERE key = ?",
      "theme_mode"
    );
    return (result?.value as ThemeMode) || "system";
  } catch (error) {
    console.error("Failed to get theme mode (Native):", error);
    return "system";
  }
}

async function saveThemeModeNative(mode: ThemeMode): Promise<void> {
  const db = await getDatabase();
  if (!db) return;
  await db.runAsync(
    "INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)",
    "theme_mode",
    mode
  );
}

// ============================================
// エクスポート関数（プラットフォームに応じて切り替え）
// ============================================

export async function initializeStorage(): Promise<void> {
  if (isWeb()) {
    return initializeStorageWeb();
  } else {
    return initializeStorageNative();
  }
}

export async function getTransactions(): Promise<Transaction[]> {
  if (isWeb()) {
    return getTransactionsWeb();
  } else {
    return getTransactionsNative();
  }
}

export async function saveTransaction(
  transaction: Omit<Transaction, "id" | "createdAt" | "updatedAt">
): Promise<Transaction> {
  if (isWeb()) {
    return saveTransactionWeb(transaction);
  } else {
    return saveTransactionNative(transaction);
  }
}

export async function updateTransaction(
  id: string,
  updates: Partial<Omit<Transaction, "id" | "createdAt" | "updatedAt">>
): Promise<Transaction | null> {
  if (isWeb()) {
    return updateTransactionWeb(id, updates);
  } else {
    return updateTransactionNative(id, updates);
  }
}

export async function deleteTransaction(id: string): Promise<boolean> {
  if (isWeb()) {
    return deleteTransactionWeb(id);
  } else {
    return deleteTransactionNative(id);
  }
}

export async function getCategories(): Promise<Category[]> {
  if (isWeb()) {
    return getCategoriesWeb();
  } else {
    return getCategoriesNative();
  }
}

export async function saveCategory(
  category: Omit<Category, "id" | "createdAt" | "updatedAt">
): Promise<Category> {
  if (isWeb()) {
    return saveCategoryWeb(category);
  } else {
    return saveCategoryNative(category);
  }
}

export async function updateCategory(
  id: string,
  updates: Partial<Omit<Category, "id" | "createdAt" | "updatedAt">>
): Promise<Category | null> {
  if (isWeb()) {
    return updateCategoryWeb(id, updates);
  } else {
    return updateCategoryNative(id, updates);
  }
}

export async function deleteCategory(id: string): Promise<boolean> {
  if (isWeb()) {
    return deleteCategoryWeb(id);
  } else {
    return deleteCategoryNative(id);
  }
}

export async function updateCategoryOrders(
  categoryOrders: { id: string; order: number }[]
): Promise<void> {
  if (isWeb()) {
    return updateCategoryOrdersWeb(categoryOrders);
  } else {
    return updateCategoryOrdersNative(categoryOrders);
  }
}

export async function clearAllData(): Promise<void> {
  if (isWeb()) {
    return clearAllDataWeb();
  } else {
    return clearAllDataNative();
  }
}

export async function getThemeMode(): Promise<ThemeMode> {
  if (isWeb()) {
    return getThemeModeWeb();
  } else {
    return getThemeModeNative();
  }
}

export async function saveThemeMode(mode: ThemeMode): Promise<void> {
  if (isWeb()) {
    return saveThemeModeWeb(mode);
  } else {
    return saveThemeModeNative(mode);
  }
}
