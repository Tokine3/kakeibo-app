import { describe, it, expect, beforeEach } from "vitest";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  initializeStorage,
  getTransactions,
  saveTransaction,
  updateTransaction,
  deleteTransaction,
  getCategories,
  saveCategory,
  updateCategory,
  deleteCategory,
  clearAllData,
} from "@/lib/storage";

describe("Storage", () => {
  beforeEach(async () => {
    await clearAllData();
  });

  describe("initializeStorage", () => {
    it("should initialize storage with default categories", async () => {
      await initializeStorage();
      const categories = await getCategories();
      
      expect(categories.length).toBeGreaterThan(0);
      expect(categories[0]).toHaveProperty("id");
      expect(categories[0]).toHaveProperty("name");
      expect(categories[0]).toHaveProperty("icon");
      expect(categories[0]).toHaveProperty("color");
      expect(categories[0]).toHaveProperty("isDefault");
    });

    it("should not reinitialize if already initialized", async () => {
      await initializeStorage();
      const categories1 = await getCategories();
      
      await initializeStorage();
      const categories2 = await getCategories();
      
      expect(categories1.length).toBe(categories2.length);
      expect(categories1[0].id).toBe(categories2[0].id);
    });
  });

  describe("Transactions", () => {
    beforeEach(async () => {
      await initializeStorage();
    });

    it("should save a transaction", async () => {
      const transaction = await saveTransaction({
        type: "expense",
        amount: 1000,
        categoryId: "cat_1",
        date: new Date().toISOString(),
      });

      expect(transaction).toHaveProperty("id");
      expect(transaction.type).toBe("expense");
      expect(transaction.amount).toBe(1000);
      expect(transaction.categoryId).toBe("cat_1");
    });

    it("should get all transactions", async () => {
      await saveTransaction({
        type: "income",
        amount: 5000,
        date: new Date().toISOString(),
      });

      await saveTransaction({
        type: "expense",
        amount: 2000,
        categoryId: "cat_1",
        date: new Date().toISOString(),
      });

      const transactions = await getTransactions();
      expect(transactions.length).toBe(2);
    });

    it("should update a transaction", async () => {
      const transaction = await saveTransaction({
        type: "expense",
        amount: 1000,
        categoryId: "cat_1",
        date: new Date().toISOString(),
      });

      const updated = await updateTransaction(transaction.id, {
        amount: 1500,
      });

      expect(updated).not.toBeNull();
      expect(updated?.amount).toBe(1500);
      expect(updated?.type).toBe("expense");
    });

    it("should delete a transaction", async () => {
      const transaction = await saveTransaction({
        type: "expense",
        amount: 1000,
        categoryId: "cat_1",
        date: new Date().toISOString(),
      });

      const deleted = await deleteTransaction(transaction.id);
      expect(deleted).toBe(true);

      const transactions = await getTransactions();
      expect(transactions.length).toBe(0);
    });
  });

  describe("Categories", () => {
    beforeEach(async () => {
      await initializeStorage();
    });

    it("should get default categories", async () => {
      const categories = await getCategories();
      expect(categories.length).toBeGreaterThan(0);
      
      const defaultCategories = categories.filter((c) => c.isDefault);
      expect(defaultCategories.length).toBeGreaterThan(0);
    });

    it("should save a custom category", async () => {
      const category = await saveCategory({
        name: "カスタムカテゴリ",
        icon: "star",
        color: "#FF0000",
        isDefault: false,
        order: 10,
      });

      expect(category).toHaveProperty("id");
      expect(category.name).toBe("カスタムカテゴリ");
      expect(category.isDefault).toBe(false);
    });

    it("should update a category", async () => {
      const category = await saveCategory({
        name: "テストカテゴリ",
        icon: "star",
        color: "#FF0000",
        isDefault: false,
        order: 10,
        type: "expense",
      });

      const updated = await updateCategory(category.id, {
        name: "更新されたカテゴリ",
      });

      expect(updated).not.toBeNull();
      expect(updated?.name).toBe("更新されたカテゴリ");
      expect(updated?.icon).toBe("star");
    });

    it("should delete a category", async () => {
      const category = await saveCategory({
        name: "削除テスト",
        icon: "star",
        color: "#FF0000",
        isDefault: false,
        order: 10,
        type: "expense",
      });

      const deleted = await deleteCategory(category.id);
      expect(deleted).toBe(true);

      const categories = await getCategories();
      const found = categories.find((c) => c.id === category.id);
      expect(found).toBeUndefined();
    });
  });
});
