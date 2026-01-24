/**
 * カテゴリ編集用のアイコンと色のプリセット
 */

// MaterialIconsから家計簿に適したアイコンを厳選
export const CATEGORY_ICONS = [
  // 食費・飲食
  "restaurant",
  "local-cafe",
  "local-bar",
  "local-pizza",
  "cake",
  // 交通
  "directions-car",
  "train",
  "flight",
  "directions-bus",
  "local-taxi",
  // ショッピング
  "shopping-cart",
  "shopping-bag",
  "store",
  "local-mall",
  // 生活
  "home",
  "lightbulb",
  "local-laundry-service",
  // 通信・テクノロジー
  "phone-iphone",
  "computer",
  "wifi",
  // 健康・医療
  "local-hospital",
  "medication",
  "fitness-center",
  "spa",
  // 娯楽
  "sports-esports",
  "movie",
  "music-note",
  "book",
  "sports-soccer",
  // 仕事・収入
  "work",
  "business-center",
  "card-giftcard",
  "trending-up",
  "savings",
  // 教育・学習
  "school",
  "menu-book",
  // 美容・ファッション
  "face",
  "dry-cleaning",
  // ペット
  "pets",
  // その他
  "more-horiz",
  "attach-money",
  "credit-card",
  "account-balance",
] as const;

// カテゴリ用カラーパレット
export const CATEGORY_COLORS = [
  // 既存デフォルトカテゴリの色
  "#FF6B6B",
  "#4ECDC4",
  "#FFD93D",
  "#95E1D3",
  "#A8E6CF",
  "#FF8B94",
  "#C7CEEA",
  "#4CAF50",
  "#8BC34A",
  "#CDDC39",
  "#FFC107",
  // 追加カラーパレット
  "#9C27B0",
  "#673AB7",
  "#3F51B5",
  "#2196F3",
  "#03A9F4",
  "#00BCD4",
  "#009688",
  "#E91E63",
  "#F44336",
  "#FF5722",
  "#795548",
  "#607D8B",
] as const;

export type CategoryIconName = (typeof CATEGORY_ICONS)[number];
export type CategoryColorValue = (typeof CATEGORY_COLORS)[number];
