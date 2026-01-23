import dayjs from "dayjs";
import type { Transaction, Category, MonthlySummary, YearlySummary, CategoryExpense } from "@/types";

/**
 * 指定された月の取引をフィルタリング
 */
export function filterTransactionsByMonth(transactions: Transaction[], year: number, month: number): Transaction[] {
  return transactions.filter((t) => {
    const d = dayjs(t.date);
    return d.year() === year && d.month() + 1 === month;
  });
}

/**
 * 指定された年の取引をフィルタリング
 */
export function filterTransactionsByYear(transactions: Transaction[], year: number): Transaction[] {
  return transactions.filter((t) => {
    const d = dayjs(t.date);
    return d.year() === year;
  });
}

/**
 * 月別サマリーを計算
 */
export function calculateMonthlySummary(
  transactions: Transaction[],
  year: number,
  month: number,
  previousMonthTransactions?: Transaction[]
): MonthlySummary {
  const monthTransactions = filterTransactionsByMonth(transactions, year, month);
  
  const income = monthTransactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);
  
  const expense = monthTransactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);
  
  const balance = income - expense;
  
  let previousMonthBalance: number | undefined;
  let changePercentage: number | undefined;
  
  if (previousMonthTransactions) {
    const prevIncome = previousMonthTransactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);
    
    const prevExpense = previousMonthTransactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);
    
    previousMonthBalance = prevIncome - prevExpense;
    
    if (previousMonthBalance !== 0) {
      changePercentage = ((balance - previousMonthBalance) / Math.abs(previousMonthBalance)) * 100;
    }
  }
  
  return {
    year,
    month,
    income,
    expense,
    balance,
    previousMonthBalance,
    changePercentage,
  };
}

/**
 * 年別サマリーを計算
 */
export function calculateYearlySummary(
  transactions: Transaction[],
  year: number,
  previousYearTransactions?: Transaction[]
): YearlySummary {
  const yearTransactions = filterTransactionsByYear(transactions, year);
  
  const income = yearTransactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);
  
  const expense = yearTransactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);
  
  const balance = income - expense;
  
  let previousYearBalance: number | undefined;
  let changePercentage: number | undefined;
  
  if (previousYearTransactions) {
    const prevIncome = previousYearTransactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);
    
    const prevExpense = previousYearTransactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);
    
    previousYearBalance = prevIncome - prevExpense;
    
    if (previousYearBalance !== 0) {
      changePercentage = ((balance - previousYearBalance) / Math.abs(previousYearBalance)) * 100;
    }
  }
  
  return {
    year,
    income,
    expense,
    balance,
    previousYearBalance,
    changePercentage,
  };
}

/**
 * カテゴリ別支出を計算
 */
export function calculateCategoryExpenses(
  transactions: Transaction[],
  categories: Category[]
): CategoryExpense[] {
  const expenses = transactions.filter((t) => t.type === "expense");
  const totalExpense = expenses.reduce((sum, t) => sum + t.amount, 0);

  if (totalExpense === 0) {
    return [];
  }

  const categoryMap = new Map<string, number>();

  expenses.forEach((t) => {
    if (t.categoryId) {
      const current = categoryMap.get(t.categoryId) || 0;
      categoryMap.set(t.categoryId, current + t.amount);
    }
  });

  const result: CategoryExpense[] = [];

  categoryMap.forEach((amount, categoryId) => {
    const category = categories.find((c) => c.id === categoryId);
    if (category) {
      result.push({
        categoryId,
        categoryName: category.name,
        categoryIcon: category.icon,
        categoryColor: category.color,
        amount,
        percentage: (amount / totalExpense) * 100,
      });
    }
  });

  // 金額の大きい順にソート
  result.sort((a, b) => b.amount - a.amount);

  return result;
}

/**
 * カテゴリ別データを計算（収入/支出を指定可能）
 */
export function calculateCategoryData(
  transactions: Transaction[],
  categories: Category[],
  type: "income" | "expense"
): CategoryExpense[] {
  const filtered = transactions.filter((t) => t.type === type);
  const total = filtered.reduce((sum, t) => sum + t.amount, 0);

  if (total === 0) {
    return [];
  }

  const categoryMap = new Map<string, number>();

  filtered.forEach((t) => {
    if (t.categoryId) {
      const current = categoryMap.get(t.categoryId) || 0;
      categoryMap.set(t.categoryId, current + t.amount);
    }
  });

  const result: CategoryExpense[] = [];

  categoryMap.forEach((amount, categoryId) => {
    const category = categories.find((c) => c.id === categoryId);
    if (category) {
      result.push({
        categoryId,
        categoryName: category.name,
        categoryIcon: category.icon,
        categoryColor: category.color,
        amount,
        percentage: (amount / total) * 100,
      });
    }
  });

  // 金額の大きい順にソート
  result.sort((a, b) => b.amount - a.amount);

  return result;
}

/**
 * 月別の収支データを計算（年別グラフ用）
 */
export function calculateMonthlyData(transactions: Transaction[], year: number): Array<{
  month: number;
  income: number;
  expense: number;
  balance: number;
}> {
  const result = [];
  
  for (let month = 1; month <= 12; month++) {
    const monthTransactions = filterTransactionsByMonth(transactions, year, month);
    
    const income = monthTransactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);
    
    const expense = monthTransactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);
    
    result.push({
      month,
      income,
      expense,
      balance: income - expense,
    });
  }
  
  return result;
}

/**
 * 金額をフォーマット
 */
export function formatAmount(amount: number): string {
  return new Intl.NumberFormat("ja-JP", {
    style: "currency",
    currency: "JPY",
  }).format(amount);
}

/**
 * パーセンテージをフォーマット
 */
export function formatPercentage(percentage: number): string {
  const sign = percentage > 0 ? "+" : "";
  return `${sign}${percentage.toFixed(1)}%`;
}

/**
 * 日付をフォーマット
 */
export function formatDate(date: string | Date): string {
  try {
    const d = dayjs(date);
    if (!d.isValid()) {
      return "不明";
    }
    return d.format("YYYY年M月D日");
  } catch (error) {
    console.error("Failed to format date:", date, error);
    return "不明";
  }
}

/**
 * 月名を取得
 */
export function getMonthName(month: number): string {
  return `${month}月`;
}
