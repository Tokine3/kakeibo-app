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
import { PieChart } from "react-native-chart-kit";
import { ScreenContainer } from "@/components/screen-container";
import { TransactionModal } from "@/components/transaction-modal";
import { SegmentControl, ViewMode } from "@/components/segment-control";
import { DoublePieChart } from "@/components/double-pie-chart";
import { useColors } from "@/hooks/use-colors";
import { getTransactions, getCategories } from "@/lib/storage";
import {
  calculateMonthlySummary,
  calculateCategoryData,
  filterTransactionsByMonth,
  formatAmount,
  formatDate,
  formatPercentage,
} from "@/lib/calculations";
import type { Transaction, Category } from "@/types";

export default function MonthlyScreen() {
  const colors = useColors();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<
    Transaction | undefined
  >();

  const now = new Date();
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
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

  const previousMonth = selectedMonth === 1 ? 12 : selectedMonth - 1;
  const previousYear = selectedMonth === 1 ? selectedYear - 1 : selectedYear;

  const previousMonthTransactions = filterTransactionsByMonth(
    transactions,
    previousYear,
    previousMonth,
  );

  const summary = calculateMonthlySummary(
    transactions,
    selectedYear,
    selectedMonth,
    previousMonthTransactions,
  );

  const monthTransactions = filterTransactionsByMonth(
    transactions,
    selectedYear,
    selectedMonth,
  ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const categoryIncome = useMemo(
    () => calculateCategoryData(monthTransactions, categories, "income"),
    [monthTransactions, categories],
  );

  const categoryExpenseData = useMemo(
    () => calculateCategoryData(monthTransactions, categories, "expense"),
    [monthTransactions, categories],
  );

  const filteredTransactions = useMemo(() => {
    if (viewMode === "all") return monthTransactions;
    return monthTransactions.filter((t) => t.type === viewMode);
  }, [monthTransactions, viewMode]);

  const currentCategoryData = useMemo(() => {
    if (viewMode === "expense") return categoryExpenseData;
    if (viewMode === "income") return categoryIncome;
    return [];
  }, [viewMode, categoryExpenseData, categoryIncome]);

  const handlePreviousMonth = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  const handleEditTransaction = (transaction: Transaction) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSelectedTransaction(transaction);
    setModalVisible(true);
  };

  const handleModalClose = () => {
    setModalVisible(false);
    setSelectedTransaction(undefined);
  };

  const handleModalSave = () => {
    loadData();
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
      ? "カテゴリ別支出"
      : viewMode === "income"
        ? "カテゴリ別収入"
        : "カテゴリ別内訳";
  const hasChartData =
    viewMode === "all"
      ? categoryExpenseData.length > 0 || categoryIncome.length > 0
      : currentCategoryData.length > 0;

  return (
    <ScreenContainer>
      <ScrollView className="flex-1">
        <View className="p-4 gap-4">
          {/* Header with Month Selector */}
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
              onPress={handlePreviousMonth}
            >
              <MaterialIcons
                name="chevron-left"
                size={24}
                color={colors.foreground}
              />
            </Pressable>

            <Text className="text-2xl font-bold text-foreground">
              {selectedYear}年{selectedMonth}月
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
              onPress={handleNextMonth}
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
            <Text className="text-sm text-muted mb-3">月間収支</Text>

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
                  <Text className="text-sm text-muted">前月比</Text>
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

          {/* Category Chart */}

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

          {/* Transaction List */}
          <View>
            <Text className="text-lg font-bold text-foreground mb-3">
              取引履歴
              {viewMode !== "all" && (
                <Text className="text-sm font-normal text-muted">
                  {" "}
                  ({viewMode === "expense" ? "支出" : "収入"}のみ)
                </Text>
              )}
            </Text>

            {filteredTransactions.length === 0 ? (
              <View className="bg-surface rounded-2xl p-6 border border-border items-center">
                <MaterialIcons
                  name="receipt-long"
                  size={52}
                  color={colors.muted}
                />
                <Text className="text-muted mt-2">取引がありません</Text>
              </View>
            ) : (
              <View className="gap-2">
                {filteredTransactions.map((transaction) => {
                  const category = categories.find(
                    (c) => c.id === transaction.categoryId,
                  );
                  return (
                    <Pressable
                      key={transaction.id}
                      style={({ pressed }) => ({
                        backgroundColor: colors.surface,
                        borderRadius: 12,
                        padding: 12,
                        borderWidth: 1,
                        borderColor:
                          transaction.type === "income"
                            ? `${colors.success}80`
                            : `${colors.error}80`,
                        opacity: pressed ? 0.7 : 1,
                      })}
                      onPress={() => handleEditTransaction(transaction)}
                    >
                      <View className="flex-row items-center justify-between">
                        <View className="flex-row items-center flex-1">
                          <View
                            style={{
                              width: 40,
                              height: 40,
                              borderRadius: 20,
                              backgroundColor: category?.color || colors.muted,
                              alignItems: "center",
                              justifyContent: "center",
                              marginRight: 12,
                            }}
                          >
                            <MaterialIcons
                              name={(category?.icon as any) || "more-horiz"}
                              size={20}
                              color="#FFFFFF"
                            />
                          </View>

                          <View className="flex-1">
                            <View className="flex-row items-end flex-wrap gap-3">
                              <Text
                                className="text-base font-semibold text-foreground"
                                numberOfLines={1}
                              >
                                {category?.name || "その他"}
                              </Text>
                              {transaction.memo && (
                                <Text
                                  className="text-sm font-normal text-muted"
                                  numberOfLines={1}
                                >
                                  <MaterialIcons name="description" />
                                  {transaction.memo}
                                </Text>
                              )}
                            </View>
                            <Text className="text-xs text-muted mt-1">
                              {formatDate(transaction.date)}
                            </Text>
                          </View>
                        </View>

                        <Text
                          className="text-lg font-bold"
                          style={{
                            color:
                              transaction.type === "income"
                                ? colors.success
                                : colors.error,
                          }}
                        >
                          {transaction.type === "income" ? "+" : "-"}
                          {formatAmount(transaction.amount)}
                        </Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      <TransactionModal
        visible={modalVisible}
        onClose={handleModalClose}
        onSave={handleModalSave}
        transaction={selectedTransaction}
        categories={categories}
      />
    </ScreenContainer>
  );
}
