import { useState, useCallback, useMemo, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Platform,
  Dimensions,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { PieChart } from "react-native-chart-kit";
import { ScreenContainer } from "@/components/screen-container";
import { TransactionModal } from "@/components/transaction-modal";
import { FilterModal } from "@/components/filter-modal";
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
import type { Transaction, Category, FilterState } from "@/types";

export default function MonthlyScreen() {
  const colors = useColors();
  const params = useLocalSearchParams<{ year?: string; month?: string }>();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<
    Transaction | undefined
  >();

  const now = new Date();
  const [selectedYear, setSelectedYear] = useState(() => {
    return params.year ? parseInt(params.year) : now.getFullYear();
  });
  const [selectedMonth, setSelectedMonth] = useState(() => {
    return params.month ? parseInt(params.month) : now.getMonth() + 1;
  });

  // パラメータ変更時に更新
  useEffect(() => {
    if (params.year && params.month) {
      setSelectedYear(parseInt(params.year));
      setSelectedMonth(parseInt(params.month));
    }
  }, [params.year, params.month]);
  const [viewMode, setViewMode] = useState<ViewMode>("all");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null,
  );
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [filterState, setFilterState] = useState<FilterState>({
    transactionType: "all",
    selectedCategoryIds: [],
    amountMin: null,
    amountMax: null,
    dateSortOrder: "date-desc",
    amountSortOrder: null,
  });

  // 今月かどうかを判定
  const isCurrentMonth =
    selectedYear === now.getFullYear() && selectedMonth === now.getMonth() + 1;

  const handleGoToCurrentMonth = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSelectedYear(now.getFullYear());
    setSelectedMonth(now.getMonth() + 1);
  };

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

  const isFilterActive = useMemo(() => {
    return (
      filterState.transactionType !== "all" ||
      filterState.selectedCategoryIds.length > 0 ||
      filterState.amountMin !== null ||
      filterState.amountMax !== null ||
      filterState.dateSortOrder !== "date-desc" ||
      filterState.amountSortOrder !== null
    );
  }, [filterState]);

  const filteredTransactions = useMemo(() => {
    let result = monthTransactions;

    // 凡例のカテゴリ選択（独立機能）
    if (selectedCategoryId) {
      result = result.filter((t) => t.categoryId === selectedCategoryId);
    }

    // 検索モーダルのフィルタ - 収入・支出
    if (filterState.transactionType !== "all") {
      result = result.filter((t) => t.type === filterState.transactionType);
    } else if (viewMode !== "all") {
      result = result.filter((t) => t.type === viewMode);
    }

    // 検索モーダルのフィルタ - カテゴリ（凡例選択がない場合のみ）
    if (!selectedCategoryId && filterState.selectedCategoryIds.length > 0) {
      result = result.filter(
        (t) => t.categoryId && filterState.selectedCategoryIds.includes(t.categoryId),
      );
    }

    // 検索モーダルのフィルタ - 金額範囲
    if (filterState.amountMin !== null) {
      result = result.filter((t) => t.amount >= filterState.amountMin!);
    }
    if (filterState.amountMax !== null) {
      result = result.filter((t) => t.amount <= filterState.amountMax!);
    }

    // 並び替え
    result = [...result].sort((a, b) => {
      // 金額ソートが設定されている場合は金額でソート
      if (filterState.amountSortOrder) {
        return filterState.amountSortOrder === "amount-desc"
          ? b.amount - a.amount
          : a.amount - b.amount;
      }
      // それ以外は日付でソート
      return filterState.dateSortOrder === "date-desc"
        ? new Date(b.date).getTime() - new Date(a.date).getTime()
        : new Date(a.date).getTime() - new Date(b.date).getTime();
    });

    return result;
  }, [monthTransactions, viewMode, selectedCategoryId, filterState]);

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
      {/* Header with Month Selector - 固定 */}
      <View
        style={{
          backgroundColor: colors.background,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          paddingTop: 12,
          paddingBottom: 12,
          paddingHorizontal: 16,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
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

        {/* 今月に戻るボタン */}
        {!isCurrentMonth && (
          <View style={{ alignItems: "center", marginTop: 8 }}>
            <Pressable
              style={({ pressed }) => ({
                flexDirection: "row",
                alignItems: "center",
                gap: 4,
                paddingHorizontal: 14,
                paddingVertical: 8,
                borderRadius: 20,
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.primary,
                opacity: pressed ? 0.6 : 1,
              })}
              onPress={handleGoToCurrentMonth}
            >
              <MaterialIcons
                name="today"
                size={16}
                color={colors.primary}
              />
              <Text
                style={{
                  color: colors.primary,
                  fontSize: 13,
                  fontWeight: "600",
                }}
              >
                今月に戻る
              </Text>
            </Pressable>
          </View>
        )}
      </View>

      <ScrollView className="flex-1">
        <View className="p-4 gap-4">
          {/* Summary Card */}
          <View className="bg-surface rounded-2xl p-4 border border-border">
            <Text className="text-sm text-muted mb-3">月間収支</Text>

            <View className="gap-3">
              <View className="flex-row items-center justify-between">
                <Text className="text-base text-foreground">収入</Text>
                <Text
                  className="text-lg font-semibold"
                  style={{
                    color: colors.success,
                    fontVariant: ["tabular-nums"],
                  }}
                >
                  {formatAmount(summary.income)}
                </Text>
              </View>

              <View className="flex-row items-center justify-between">
                <Text className="text-base text-foreground">支出</Text>
                <Text
                  className="text-lg font-semibold"
                  style={{ color: colors.error, fontVariant: ["tabular-nums"] }}
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
                    fontVariant: ["tabular-nums"],
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
            {viewMode === "all" ? (
              <Text className="text-lg font-bold text-foreground mb-2">
                {sectionTitle}
              </Text>
            ) : (
              <Text className="text-lg font-bold text-foreground">
                {sectionTitle}
              </Text>
            )}

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
                  <View className="gap-1">
                    {categoryExpenseData.length > 0 && (
                      <Text
                        className="font-semibold text-foreground mt-2 mb-1"
                        style={{ color: colors.error }}
                      >
                        支出
                      </Text>
                    )}
                    {categoryExpenseData.map((ce) => (
                      <Pressable
                        key={`expense-${ce.categoryId}`}
                        style={({ pressed }) => ({
                          flexDirection: "row",
                          alignItems: "center",
                          justifyContent: "space-between",
                          paddingVertical: 6,
                          paddingHorizontal: 8,
                          borderRadius: 8,
                          backgroundColor:
                            selectedCategoryId === ce.categoryId
                              ? `${ce.categoryColor}20`
                              : pressed
                                ? `${colors.muted}10`
                                : "transparent",
                        })}
                        onPress={() => {
                          if (Platform.OS !== "web") {
                            Haptics.impactAsync(
                              Haptics.ImpactFeedbackStyle.Light,
                            );
                          }
                          setSelectedCategoryId(
                            selectedCategoryId === ce.categoryId
                              ? null
                              : ce.categoryId,
                          );
                        }}
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
                          <Text
                            style={{
                              fontSize: 14,
                              color:
                                selectedCategoryId === ce.categoryId
                                  ? ce.categoryColor
                                  : colors.foreground,
                              fontWeight:
                                selectedCategoryId === ce.categoryId
                                  ? "600"
                                  : "400",
                            }}
                          >
                            {ce.categoryName}
                          </Text>
                        </View>
                        <Text
                          style={{
                            fontSize: 14,
                            fontWeight: "600",
                            color:
                              selectedCategoryId === ce.categoryId
                                ? ce.categoryColor
                                : colors.foreground,
                          }}
                        >
                          {formatAmount(ce.amount)} ({ce.percentage.toFixed(1)}
                          %)
                        </Text>
                      </Pressable>
                    ))}
                    {categoryIncome.length > 0 && (
                      <Text
                        className="font-semibold text-foreground mt-2 mb-1"
                        style={{ color: colors.success }}
                      >
                        収入
                      </Text>
                    )}
                    {categoryIncome.map((ce) => (
                      <Pressable
                        key={`income-${ce.categoryId}`}
                        style={({ pressed }) => ({
                          flexDirection: "row",
                          alignItems: "center",
                          justifyContent: "space-between",
                          paddingVertical: 6,
                          paddingHorizontal: 8,
                          borderRadius: 8,
                          backgroundColor:
                            selectedCategoryId === ce.categoryId
                              ? `${ce.categoryColor}20`
                              : pressed
                                ? `${colors.muted}10`
                                : "transparent",
                        })}
                        onPress={() => {
                          if (Platform.OS !== "web") {
                            Haptics.impactAsync(
                              Haptics.ImpactFeedbackStyle.Light,
                            );
                          }
                          setSelectedCategoryId(
                            selectedCategoryId === ce.categoryId
                              ? null
                              : ce.categoryId,
                          );
                        }}
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
                          <Text
                            style={{
                              fontSize: 14,
                              color:
                                selectedCategoryId === ce.categoryId
                                  ? ce.categoryColor
                                  : colors.foreground,
                              fontWeight:
                                selectedCategoryId === ce.categoryId
                                  ? "600"
                                  : "400",
                            }}
                          >
                            {ce.categoryName}
                          </Text>
                        </View>
                        <Text
                          style={{
                            fontSize: 14,
                            fontWeight: "600",
                            color:
                              selectedCategoryId === ce.categoryId
                                ? ce.categoryColor
                                : colors.foreground,
                          }}
                        >
                          {formatAmount(ce.amount)} ({ce.percentage.toFixed(1)}
                          %)
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                ) : (
                  <View className="gap-1">
                    {currentCategoryData.map((ce) => (
                      <Pressable
                        key={ce.categoryId}
                        style={({ pressed }) => ({
                          flexDirection: "row",
                          alignItems: "center",
                          justifyContent: "space-between",
                          paddingVertical: 6,
                          paddingHorizontal: 8,
                          borderRadius: 8,
                          backgroundColor:
                            selectedCategoryId === ce.categoryId
                              ? `${ce.categoryColor}20`
                              : pressed
                                ? `${colors.muted}10`
                                : "transparent",
                        })}
                        onPress={() => {
                          if (Platform.OS !== "web") {
                            Haptics.impactAsync(
                              Haptics.ImpactFeedbackStyle.Light,
                            );
                          }
                          setSelectedCategoryId(
                            selectedCategoryId === ce.categoryId
                              ? null
                              : ce.categoryId,
                          );
                        }}
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
                          <Text
                            style={{
                              fontSize: 14,
                              color:
                                selectedCategoryId === ce.categoryId
                                  ? ce.categoryColor
                                  : colors.foreground,
                              fontWeight:
                                selectedCategoryId === ce.categoryId
                                  ? "600"
                                  : "400",
                            }}
                          >
                            {ce.categoryName}
                          </Text>
                        </View>
                        <Text
                          style={{
                            fontSize: 14,
                            fontWeight: "600",
                            color:
                              selectedCategoryId === ce.categoryId
                                ? ce.categoryColor
                                : colors.foreground,
                          }}
                        >
                          {formatAmount(ce.amount)} ({ce.percentage.toFixed(1)}
                          %)
                        </Text>
                      </Pressable>
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
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-lg font-bold text-foreground">
                取引履歴
                {(viewMode !== "all" ||
                  selectedCategoryId ||
                  isFilterActive) && (
                  <Text
                    className="text-sm font-normal"
                    style={{
                      color: isFilterActive ? colors.primary : colors.muted,
                    }}
                  >
                    {" "}
                    (
                    {isFilterActive && "フィルタ中"}
                    {isFilterActive &&
                      (viewMode !== "all" || selectedCategoryId) &&
                      "・"}
                    {viewMode !== "all" &&
                      (viewMode === "expense" ? "支出" : "収入")}
                    {viewMode !== "all" && selectedCategoryId && "・"}
                    {selectedCategoryId &&
                      categories.find((c) => c.id === selectedCategoryId)?.name}
                    )
                  </Text>
                )}
              </Text>
              <View className="flex-row items-center gap-2">
                {/* Filter Button */}
                <Pressable
                  style={({ pressed }) => ({
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: isFilterActive
                      ? `${colors.primary}20`
                      : colors.surface,
                    alignItems: "center",
                    justifyContent: "center",
                    opacity: pressed ? 0.7 : 1,
                  })}
                  onPress={() => {
                    if (Platform.OS !== "web") {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }
                    setFilterModalVisible(true);
                  }}
                >
                  <MaterialIcons
                    name="filter-list"
                    size={20}
                    color={isFilterActive ? colors.primary : colors.muted}
                  />
                </Pressable>
                {/* Clear Category Button */}
                {selectedCategoryId && (
                  <Pressable
                    style={({ pressed }) => ({
                      paddingHorizontal: 10,
                      paddingVertical: 4,
                      borderRadius: 16,
                      backgroundColor: `${colors.muted}20`,
                      opacity: pressed ? 0.7 : 1,
                    })}
                    onPress={() => {
                      if (Platform.OS !== "web") {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }
                      setSelectedCategoryId(null);
                    }}
                  >
                    <Text
                      style={{
                        color: colors.muted,
                        fontSize: 12,
                        fontWeight: "400",
                      }}
                    >
                      すべて表示
                    </Text>
                  </Pressable>
                )}
              </View>
            </View>

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
                            <View className="flex-row items-end gap-2">
                              <Text
                                className="text-base font-semibold text-foreground"
                                numberOfLines={1}
                              >
                                {category?.name || "その他"}
                              </Text>
                              {transaction.memo && (
                                <Text
                                  className="text-sm font-normal text-muted flex-1"
                                  numberOfLines={1}
                                  ellipsizeMode="tail"
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
                            fontVariant: ["tabular-nums"],
                          }}
                        >
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

      <FilterModal
        visible={filterModalVisible}
        onClose={() => setFilterModalVisible(false)}
        onApply={setFilterState}
        initialState={filterState}
        categories={categories}
      />
    </ScreenContainer>
  );
}
