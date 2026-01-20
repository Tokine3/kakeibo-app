import { describe, it, expect } from "vitest";
import {
  filterTransactionsByMonth,
  filterTransactionsByYear,
  calculateMonthlySummary,
  calculateYearlySummary,
  calculateCategoryExpenses,
  calculateMonthlyData,
  formatAmount,
  formatPercentage,
} from "@/lib/calculations";
import type { Transaction, Category } from "@/types";

const mockTransactions: Transaction[] = [
  {
    id: "1",
    type: "income",
    amount: 300000,
    date: "2026-01-15T00:00:00.000Z",
    createdAt: "2026-01-15T00:00:00.000Z",
    updatedAt: "2026-01-15T00:00:00.000Z",
  },
  {
    id: "2",
    type: "expense",
    amount: 50000,
    categoryId: "cat_1",
    date: "2026-01-20T00:00:00.000Z",
    createdAt: "2026-01-20T00:00:00.000Z",
    updatedAt: "2026-01-20T00:00:00.000Z",
  },
  {
    id: "3",
    type: "expense",
    amount: 30000,
    categoryId: "cat_2",
    date: "2026-01-25T00:00:00.000Z",
    createdAt: "2026-01-25T00:00:00.000Z",
    updatedAt: "2026-01-25T00:00:00.000Z",
  },
  {
    id: "4",
    type: "income",
    amount: 250000,
    date: "2025-12-15T00:00:00.000Z",
    createdAt: "2025-12-15T00:00:00.000Z",
    updatedAt: "2025-12-15T00:00:00.000Z",
  },
];

const mockCategories: Category[] = [
  {
    id: "cat_1",
    name: "食費",
    icon: "restaurant",
    color: "#FF6B6B",
    isDefault: true,
    order: 0,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "cat_2",
    name: "交通費",
    icon: "directions-car",
    color: "#4ECDC4",
    isDefault: true,
    order: 1,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
];

describe("Calculations", () => {
  describe("filterTransactionsByMonth", () => {
    it("should filter transactions by month", () => {
      const result = filterTransactionsByMonth(mockTransactions, 2026, 1);
      expect(result.length).toBe(3);
      expect(result.every((t) => new Date(t.date).getMonth() + 1 === 1)).toBe(true);
    });

    it("should return empty array for month with no transactions", () => {
      const result = filterTransactionsByMonth(mockTransactions, 2026, 2);
      expect(result.length).toBe(0);
    });
  });

  describe("filterTransactionsByYear", () => {
    it("should filter transactions by year", () => {
      const result = filterTransactionsByYear(mockTransactions, 2026);
      expect(result.length).toBe(3);
      expect(result.every((t) => new Date(t.date).getFullYear() === 2026)).toBe(true);
    });
  });

  describe("calculateMonthlySummary", () => {
    it("should calculate monthly summary correctly", () => {
      const summary = calculateMonthlySummary(mockTransactions, 2026, 1);
      
      expect(summary.year).toBe(2026);
      expect(summary.month).toBe(1);
      expect(summary.income).toBe(300000);
      expect(summary.expense).toBe(80000);
      expect(summary.balance).toBe(220000);
    });

    it("should calculate change percentage with previous month", () => {
      const previousMonth = filterTransactionsByMonth(mockTransactions, 2025, 12);
      const summary = calculateMonthlySummary(
        mockTransactions,
        2026,
        1,
        previousMonth
      );
      
      expect(summary.previousMonthBalance).toBe(250000);
      expect(summary.changePercentage).toBeDefined();
    });
  });

  describe("calculateYearlySummary", () => {
    it("should calculate yearly summary correctly", () => {
      const summary = calculateYearlySummary(mockTransactions, 2026);
      
      expect(summary.year).toBe(2026);
      expect(summary.income).toBe(300000);
      expect(summary.expense).toBe(80000);
      expect(summary.balance).toBe(220000);
    });
  });

  describe("calculateCategoryExpenses", () => {
    it("should calculate category expenses correctly", () => {
      const monthTransactions = filterTransactionsByMonth(mockTransactions, 2026, 1);
      const result = calculateCategoryExpenses(monthTransactions, mockCategories);
      
      expect(result.length).toBe(2);
      expect(result[0].amount).toBe(50000);
      expect(result[0].categoryName).toBe("食費");
      expect(result[0].percentage).toBeCloseTo(62.5, 1);
      expect(result[1].amount).toBe(30000);
      expect(result[1].categoryName).toBe("交通費");
      expect(result[1].percentage).toBeCloseTo(37.5, 1);
    });

    it("should return empty array when no expenses", () => {
      const incomeOnly: Transaction[] = [
        {
          id: "1",
          type: "income",
          amount: 100000,
          date: "2026-01-15T00:00:00.000Z",
          createdAt: "2026-01-15T00:00:00.000Z",
          updatedAt: "2026-01-15T00:00:00.000Z",
        },
      ];
      
      const result = calculateCategoryExpenses(incomeOnly, mockCategories);
      expect(result.length).toBe(0);
    });
  });

  describe("calculateMonthlyData", () => {
    it("should calculate monthly data for all 12 months", () => {
      const result = calculateMonthlyData(mockTransactions, 2026);
      
      expect(result.length).toBe(12);
      expect(result[0].month).toBe(1);
      expect(result[0].income).toBe(300000);
      expect(result[0].expense).toBe(80000);
      expect(result[0].balance).toBe(220000);
    });
  });

  describe("formatAmount", () => {
    it("should format amount as Japanese currency", () => {
      const result1 = formatAmount(1000);
      const result2 = formatAmount(1234567);
      const result3 = formatAmount(0);
      
      // 日本語環境では通貨記号が異なる場合があるため、数値部分のみチェック
      expect(result1).toContain("1,000");
      expect(result2).toContain("1,234,567");
      expect(result3).toContain("0");
    });
  });

  describe("formatPercentage", () => {
    it("should format percentage with sign", () => {
      expect(formatPercentage(10.5)).toBe("+10.5%");
      expect(formatPercentage(-5.3)).toBe("-5.3%");
      // 0の場合は符号が付かない場合もある
      const result = formatPercentage(0);
      expect(result).toMatch(/^[+]?0\.0%$/);
    });
  });
});
