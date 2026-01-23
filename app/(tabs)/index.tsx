import { useState, useCallback, useMemo } from "react";
import { View, Text, ScrollView, Pressable, Platform } from "react-native";
import dayjs from "dayjs";
import { useFocusEffect } from "@react-navigation/native";
import * as Haptics from "expo-haptics";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { ScreenContainer } from "@/components/screen-container";
import { TransactionModal } from "@/components/transaction-modal";
import { useColors } from "@/hooks/use-colors";
import { getTransactions, getCategories } from "@/lib/storage";
import {
  calculateMonthlySummary,
  formatAmount,
  formatDate,
} from "@/lib/calculations";
import type { Transaction, Category } from "@/types";

export default function HomeScreen() {
  const colors = useColors();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<"income" | "expense">("expense");
  const [selectedTransaction, setSelectedTransaction] = useState<
    Transaction | undefined
  >();

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

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  const summary = calculateMonthlySummary(
    transactions,
    currentYear,
    currentMonth,
  );

  const recentTransactions = useMemo(() => {
    const threeMonthsAgo = dayjs().subtract(3, "month").startOf("day");
    return transactions
      .filter(
        (t) =>
          dayjs(t.date).isAfter(threeMonthsAgo) ||
          dayjs(t.date).isSame(threeMonthsAgo, "day"),
      )
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 100);
  }, [transactions]);

  const handleAddTransaction = (type: "income" | "expense") => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setModalType(type);
    setSelectedTransaction(undefined);
    setModalVisible(true);
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

  return (
    <ScreenContainer>
      <ScrollView className="flex-1">
        <View className="p-4 gap-4">
          {/* Header */}
          <View className="mb-2">
            <Text className="text-2xl font-bold text-foreground">家計簿</Text>
            <Text className="text-muted mt-1">
              {currentYear}年{currentMonth}月
            </Text>
          </View>

          {/* Summary Card */}
          <View className="bg-surface rounded-2xl p-4 border border-border">
            <Text className="text-sm text-muted mb-3">今月の収支</Text>

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
            </View>
          </View>

          {/* Action Buttons */}
          <View className="flex-row gap-3">
            <Pressable
              style={({ pressed }) => ({
                flex: 1,
                backgroundColor: colors.success,
                paddingVertical: 16,
                borderRadius: 12,
                alignItems: "center",
                opacity: pressed ? 0.7 : 1,
              })}
              onPress={() => handleAddTransaction("income")}
            >
              <View className="flex-row items-center gap-2">
                <MaterialIcons name="add" size={20} color="#FFFFFF" />
                <Text
                  className="text-base font-semibold"
                  style={{ color: "#FFFFFF" }}
                >
                  収入を追加
                </Text>
              </View>
            </Pressable>

            <Pressable
              style={({ pressed }) => ({
                flex: 1,
                backgroundColor: colors.error,
                paddingVertical: 16,
                borderRadius: 12,
                alignItems: "center",
                opacity: pressed ? 0.7 : 1,
              })}
              onPress={() => handleAddTransaction("expense")}
            >
              <View className="flex-row items-center gap-2">
                <MaterialIcons name="remove" size={20} color="#FFFFFF" />
                <Text
                  className="text-base font-semibold"
                  style={{ color: "#FFFFFF" }}
                >
                  支出を追加
                </Text>
              </View>
            </Pressable>
          </View>

          {/* Recent Transactions */}
          <View>
            <Text className="text-lg font-bold text-foreground mb-3">
              最近の取引
            </Text>

            {recentTransactions.length === 0 ? (
              <View className="bg-surface rounded-2xl p-6 border border-border items-center">
                <MaterialIcons
                  name="receipt-long"
                  size={48}
                  color={colors.muted}
                />
                <Text className="text-muted mt-2">取引がありません</Text>
              </View>
            ) : (
              <ScrollView
                nestedScrollEnabled
                style={{ maxHeight: 400 }}
                contentContainerStyle={{ gap: 8 }}
                showsVerticalScrollIndicator={recentTransactions.length > 5}
              >
                {recentTransactions.map((transaction) => {
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
                            <Text
                              className="text-base font-semibold text-foreground"
                              numberOfLines={1}
                            >
                              {category?.name || "その他"}
                              {transaction.memo && (
                                <Text className="text-sm font-normal text-muted">
                                  <MaterialIcons name="description" />
                                  {transaction.memo}
                                </Text>
                              )}
                            </Text>
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
              </ScrollView>
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
        initialType={modalType}
      />
    </ScreenContainer>
  );
}
