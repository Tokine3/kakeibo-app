import { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Platform,
  Dimensions,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import * as Haptics from "expo-haptics";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { LineChart, PieChart } from "react-native-chart-kit";
import { ScreenContainer } from "@/components/screen-container";
import { SegmentControl, ViewMode } from "@/components/segment-control";
import { DoublePieChart } from "@/components/double-pie-chart";
import { useColors } from "@/hooks/use-colors";
import { getTransactions, getCategories } from "@/lib/storage";
import {
  calculateYearlySummary,
  calculateMonthlyData,
  calculateCategoryData,
  filterTransactionsByYear,
  formatAmount,
  formatPercentage,
} from "@/lib/calculations";
import type { Transaction, Category } from "@/types";

export default function YearlyScreen() {
  const colors = useColors();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const now = new Date();
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [viewMode, setViewMode] = useState<ViewMode>("all");

  const loadData = useCallback(async () => {
    try {
      const [txns, cats] = await Promise.all([
        getTransactions(),
        getCategories(),
      ]);
      setTransactions(txns);
      setCategories(cats);
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData]),
  );

  const previousYearTransactions = filterTransactionsByYear(
    transactions,
    selectedYear - 1,
  );
  const summary = calculateYearlySummary(
    transactions,
    selectedYear,
    previousYearTransactions,
  );

  const monthlyData = calculateMonthlyData(transactions, selectedYear);
  const yearTransactions = filterTransactionsByYear(transactions, selectedYear);

  const categoryIncome = useMemo(
    () => calculateCategoryData(yearTransactions, categories, "income"),
    [yearTransactions, categories],
  );

  const categoryExpenseData = useMemo(
    () => calculateCategoryData(yearTransactions, categories, "expense"),
    [yearTransactions, categories],
  );

  const currentCategoryData = useMemo(() => {
    if (viewMode === "expense") return categoryExpenseData;
    if (viewMode === "income") return categoryIncome;
    return [];
  }, [viewMode, categoryExpenseData, categoryIncome]);

  const handlePreviousYear = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSelectedYear(selectedYear - 1);
  };

  const handleNextYear = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSelectedYear(selectedYear + 1);
  };

  if (loading) {
    return (
      <ScreenContainer className="items-center justify-center">
        <Text className="text-muted">読み込み中...</Text>
      </ScreenContainer>
    );
  }

  const screenWidth = Dimensions.get("window").width;
  const chartWidth = screenWidth - 32;

  const pieChartData = currentCategoryData.slice(0, 6).map((ce) => ({
    name: `${ce.categoryName} ${formatAmount(ce.amount)} (${ce.percentage.toFixed(1)}%)`,
    amount: ce.amount,
    color: ce.categoryColor,
    legendFontColor: colors.foreground,
    legendFontSize: 12,
  }));

  const sectionTitle =
    viewMode === "expense"
      ? "年間カテゴリ別支出"
      : viewMode === "income"
        ? "年間カテゴリ別収入"
        : "年間カテゴリ別内訳";
  const hasChartData =
    viewMode === "all"
      ? categoryExpenseData.length > 0 || categoryIncome.length > 0
      : currentCategoryData.length > 0;

  return (
    <ScreenContainer>
      <ScrollView className="flex-1">
        <View className="p-4 gap-4">
          {/* Header with Year Selector */}
          <View className="flex-row items-center justify-between">
            <Pressable
              style={({ pressed }) => ({
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: colors.surface,
                alignItems: "center",
                justifyContent: "center",
                opacity: pressed ? 0.6 : 1,
              })}
              onPress={handlePreviousYear}
            >
              <MaterialIcons
                name="chevron-left"
                size={24}
                color={colors.foreground}
              />
            </Pressable>

            <Text className="text-2xl font-bold text-foreground">
              {selectedYear}年
            </Text>

            <Pressable
              style={({ pressed }) => ({
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: colors.surface,
                alignItems: "center",
                justifyContent: "center",
                opacity: pressed ? 0.6 : 1,
              })}
              onPress={handleNextYear}
            >
              <MaterialIcons
                name="chevron-right"
                size={24}
                color={colors.foreground}
              />
            </Pressable>
          </View>

          {/* Summary Card */}
          <View className="bg-surface rounded-2xl p-4 border border-border">
            <Text className="text-sm text-muted mb-3">年間収支</Text>

            <View className="gap-3">
              <View className="flex-row items-center justify-between">
                <Text className="text-base text-foreground">収入</Text>
                <Text
                  className="text-lg font-semibold"
                  style={{ color: colors.success }}
                >
                  {formatAmount(summary.income)}
                </Text>
              </View>

              <View className="flex-row items-center justify-between">
                <Text className="text-base text-foreground">支出</Text>
                <Text
                  className="text-lg font-semibold"
                  style={{ color: colors.error }}
                >
                  {formatAmount(summary.expense)}
                </Text>
              </View>

              <View
                style={{
                  height: 1,
                  backgroundColor: colors.border,
                  marginVertical: 4,
                }}
              />

              <View className="flex-row items-center justify-between">
                <Text className="text-base font-semibold text-foreground">
                  収支
                </Text>
                <Text
                  className="text-xl font-bold"
                  style={{
                    color: summary.balance >= 0 ? colors.success : colors.error,
                  }}
                >
                  {summary.balance >= 0
                    ? `+${formatAmount(summary.balance)}`
                    : formatAmount(summary.balance)}
                </Text>
              </View>

              {summary.changePercentage !== undefined && (
                <View className="flex-row items-center justify-between mt-2">
                  <Text className="text-sm text-muted">昨年比</Text>
                  <View className="flex-row items-center gap-1">
                    <MaterialIcons
                      name={
                        summary.changePercentage >= 0
                          ? "trending-up"
                          : "trending-down"
                      }
                      size={16}
                      color={
                        summary.changePercentage >= 0
                          ? colors.success
                          : colors.error
                      }
                    />
                    <Text
                      className="text-sm font-semibold"
                      style={{
                        color:
                          summary.changePercentage >= 0
                            ? colors.success
                            : colors.error,
                      }}
                    >
                      {formatPercentage(summary.changePercentage)}
                    </Text>
                  </View>
                </View>
              )}
            </View>
          </View>

          {/* Monthly Line Chart */}
          {monthlyData.some((m) => m.income > 0 || m.expense > 0) && (
            <View className="bg-surface rounded-2xl p-4 border border-border">
              <Text className="text-lg font-bold text-foreground mb-3">
                月別収支推移
              </Text>

              <LineChart
                data={{
                  labels: [
                    "1月",
                    "2月",
                    "3月",
                    "4月",
                    "5月",
                    "6月",
                    "7月",
                    "8月",
                    "9月",
                    "10月",
                    "11月",
                    "12月",
                  ],
                  datasets: [
                    {
                      data: monthlyData.map((m) => m.income),
                      color: (opacity = 1) => colors.success,
                      strokeWidth: 2,
                    },
                    {
                      data: monthlyData.map((m) => m.expense),
                      color: (opacity = 1) => colors.error,
                      strokeWidth: 2,
                    },
                  ],
                  legend: ["収入", "支出"],
                }}
                width={chartWidth - 32}
                height={240}
                yAxisLabel="¥"
                yAxisSuffix=""
                segments={5}
                formatYLabel={(value) => {
                  const num = Number(value);
                  if (num >= 10000) {
                    return `${(num / 10000).toLocaleString("ja-JP")}万`;
                  }
                  return num.toLocaleString("ja-JP");
                }}
                chartConfig={{
                  backgroundColor: colors.surface,
                  backgroundGradientFrom: colors.surface,
                  backgroundGradientTo: colors.surface,
                  decimalPlaces: 0,
                  color: (opacity = 1) => colors.primary,
                  labelColor: (opacity = 1) => colors.foreground,
                  style: {
                    borderRadius: 16,
                  },
                  propsForLabels: {
                    fontSize: 10,
                  },
                  paddingRight: 32,
                }}
                bezier
                style={{
                  marginVertical: 2,
                  borderRadius: 16,
                }}
              />
            </View>
          )}

          {/* Category Pie Chart */}
          <View className="bg-surface rounded-2xl p-4 border border-border">
            <View style={{ marginBottom: 12 }}>
              <SegmentControl value={viewMode} onChange={setViewMode} />
            </View>
            <Text className="text-lg font-bold text-foreground mb-2">
              {sectionTitle}
            </Text>

            {hasChartData ? (
              <>
                {viewMode === "all" ? (
                  <DoublePieChart
                    expenseData={categoryExpenseData}
                    incomeData={categoryIncome}
                    width={chartWidth}
                  />
                ) : (
                  <PieChart
                    data={pieChartData}
                    width={chartWidth}
                    height={180}
                    chartConfig={{
                      color: (opacity = 1) => colors.primary,
                      labelColor: (opacity = 1) => colors.foreground,
                    }}
                    accessor="amount"
                    backgroundColor="transparent"
                    paddingLeft={`${(chartWidth - 32) / 2 - 90}`}
                    hasLegend={false}
                    style={{
                      borderRadius: 16,
                    }}
                  />
                )}

                {viewMode === "all" ? (
                  <View className="gap-2">
                    {categoryExpenseData.length > 0 && (
                      <Text
                        className="text-sm font-semibold text-foreground mt-2"
                        style={{ color: colors.error }}
                      >
                        支出
                      </Text>
                    )}
                    {categoryExpenseData.map((ce) => (
                      <View
                        key={`expense-${ce.categoryId}`}
                        className="flex-row items-center justify-between"
                      >
                        <View className="flex-row items-center flex-1">
                          <View
                            style={{
                              width: 12,
                              height: 12,
                              borderRadius: 6,
                              backgroundColor: ce.categoryColor,
                              marginRight: 8,
                            }}
                          />
                          <Text className="text-sm text-foreground">
                            {ce.categoryName}
                          </Text>
                        </View>
                        <Text className="text-sm font-semibold text-foreground">
                          {formatAmount(ce.amount)} ({ce.percentage.toFixed(1)}
                          %)
                        </Text>
                      </View>
                    ))}
                    {categoryIncome.length > 0 && (
                      <Text
                        className="text-sm font-semibold text-foreground mt-2"
                        style={{ color: colors.success }}
                      >
                        収入
                      </Text>
                    )}
                    {categoryIncome.map((ce) => (
                      <View
                        key={`income-${ce.categoryId}`}
                        className="flex-row items-center justify-between"
                      >
                        <View className="flex-row items-center flex-1">
                          <View
                            style={{
                              width: 12,
                              height: 12,
                              borderRadius: 6,
                              backgroundColor: ce.categoryColor,
                              marginRight: 8,
                            }}
                          />
                          <Text className="text-sm text-foreground">
                            {ce.categoryName}
                          </Text>
                        </View>
                        <Text className="text-sm font-semibold text-foreground">
                          {formatAmount(ce.amount)} ({ce.percentage.toFixed(1)}
                          %)
                        </Text>
                      </View>
                    ))}
                  </View>
                ) : (
                  <View className="gap-2">
                    {currentCategoryData.map((ce) => (
                      <View
                        key={ce.categoryId}
                        className="flex-row items-center justify-between"
                      >
                        <View className="flex-row items-center flex-1">
                          <View
                            style={{
                              width: 12,
                              height: 12,
                              borderRadius: 6,
                              backgroundColor: ce.categoryColor,
                              marginRight: 8,
                            }}
                          />
                          <Text className="text-sm text-foreground">
                            {ce.categoryName}
                          </Text>
                        </View>
                        <Text className="text-sm font-semibold text-foreground">
                          {formatAmount(ce.amount)} ({ce.percentage.toFixed(1)}
                          %)
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
              </>
            ) : (
              <View className="items-center py-6">
                <MaterialIcons
                  name="pie-chart"
                  size={52}
                  color={colors.muted}
                />
                <Text className="text-muted mt-2">データがありません</Text>
              </View>
            )}
          </View>

          {/* Monthly Breakdown */}
          <View className="bg-surface rounded-2xl p-4 border border-border">
            <Text className="text-lg font-bold text-foreground mb-3">
              月別詳細
            </Text>

            <View className="gap-2">
              {monthlyData.map((data) => (
                <View
                  key={data.month}
                  className="flex-row items-center justify-between py-2 border-b border-border"
                >
                  <Text className="text-base text-foreground font-medium">
                    {data.month}月
                  </Text>

                  <View className="items-end">
                    <Text className="text-sm" style={{ color: colors.success }}>
                      収入: {formatAmount(data.income)}
                    </Text>
                    <Text className="text-sm" style={{ color: colors.error }}>
                      支出: {formatAmount(data.expense)}
                    </Text>
                    <Text
                      className="text-sm font-semibold mt-1"
                      style={{
                        color:
                          data.balance >= 0 ? colors.success : colors.error,
                      }}
                    >
                      収支:
                      {data.balance >= 0
                        ? `+${formatAmount(data.balance)}`
                        : formatAmount(data.balance)}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
