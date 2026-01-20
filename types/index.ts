/**
 * 取引タイプ
 */
export type TransactionType = "income" | "expense";

/**
 * 取引データ
 */
export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  categoryId?: string; // カテゴリID
  date: string; // ISO 8601 形式
  memo?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * カテゴリデータ
 */
export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  isDefault: boolean;
  order: number;
  type: "income" | "expense";
  customName?: string; // 「その他（自由記述）」用のカスタム名
  createdAt: string;
  updatedAt: string;
}

/**
 * 月別サマリー
 */
export interface MonthlySummary {
  year: number;
  month: number;
  income: number;
  expense: number;
  balance: number;
  previousMonthBalance?: number;
  changePercentage?: number;
}

/**
 * 年別サマリー
 */
export interface YearlySummary {
  year: number;
  income: number;
  expense: number;
  balance: number;
  previousYearBalance?: number;
  changePercentage?: number;
}

/**
 * カテゴリ別支出
 */
export interface CategoryExpense {
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
  amount: number;
  percentage: number;
}
