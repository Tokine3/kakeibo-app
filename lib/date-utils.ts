import dayjs from "dayjs";
import "dayjs/locale/ja";

dayjs.locale("ja");

/**
 * 日付をフォーマットする（例：2026年1月20日（火））
 */
export function formatDateWithDay(date: string | Date | number): string {
  try {
    const d = dayjs(date);
    if (!d.isValid()) {
      return "無効な日付";
    }
    return d.format("YYYY年M月D日（ddd）");
  } catch {
    return "無効な日付";
  }
}

/**
 * 日付をシンプルにフォーマットする（例：2026-01-20）
 */
export function formatDate(date: string | Date | number): string {
  try {
    const d = dayjs(date);
    if (!d.isValid()) {
      return "";
    }
    return d.format("YYYY-MM-DD");
  } catch {
    return "";
  }
}

/**
 * 日付を月別フォーマットする（例：2026年1月）
 */
export function formatMonth(date: string | Date | number): string {
  try {
    const d = dayjs(date);
    if (!d.isValid()) {
      return "";
    }
    return d.format("YYYY年M月");
  } catch {
    return "";
  }
}

/**
 * 日付を年別フォーマットする（例：2026年）
 */
export function formatYear(date: string | Date | number): string {
  try {
    const d = dayjs(date);
    if (!d.isValid()) {
      return "";
    }
    return d.format("YYYY年");
  } catch {
    return "";
  }
}

/**
 * 今月の最初の日を取得
 */
export function getFirstDayOfMonth(date?: string | Date | number): dayjs.Dayjs {
  const d = date ? dayjs(date) : dayjs();
  return d.startOf("month");
}

/**
 * 今月の最後の日を取得
 */
export function getLastDayOfMonth(date?: string | Date | number): dayjs.Dayjs {
  const d = date ? dayjs(date) : dayjs();
  return d.endOf("month");
}

/**
 * 前月を取得
 */
export function getPreviousMonth(date?: string | Date | number): dayjs.Dayjs {
  const d = date ? dayjs(date) : dayjs();
  return d.subtract(1, "month");
}

/**
 * 次月を取得
 */
export function getNextMonth(date?: string | Date | number): dayjs.Dayjs {
  const d = date ? dayjs(date) : dayjs();
  return d.add(1, "month");
}

/**
 * 前年を取得
 */
export function getPreviousYear(date?: string | Date | number): dayjs.Dayjs {
  const d = date ? dayjs(date) : dayjs();
  return d.subtract(1, "year");
}

/**
 * 次年を取得
 */
export function getNextYear(date?: string | Date | number): dayjs.Dayjs {
  const d = date ? dayjs(date) : dayjs();
  return d.add(1, "year");
}

/**
 * 2つの日付が同じ月かどうかを判定
 */
export function isSameMonth(date1: string | Date | number, date2: string | Date | number): boolean {
  const d1 = dayjs(date1);
  const d2 = dayjs(date2);
  return d1.isSame(d2, "month");
}

/**
 * 2つの日付が同じ年かどうかを判定
 */
export function isSameYear(date1: string | Date | number, date2: string | Date | number): boolean {
  const d1 = dayjs(date1);
  const d2 = dayjs(date2);
  return d1.isSame(d2, "year");
}

/**
 * 今日の日付を取得
 */
export function getToday(): string {
  return dayjs().format("YYYY-MM-DD");
}

/**
 * 曜日を取得（日本語）
 */
export function getDayOfWeek(date: string | Date | number): string {
  return dayjs(date).format("ddd");
}
