import { useState, useEffect } from "react";
import {
  View,
  Text,
  Modal,
  TextInput,
  ScrollView,
  Pressable,
  Platform,
  Alert,
} from "react-native";
import * as Haptics from "expo-haptics";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import dayjs from "dayjs";
import { useColors } from "@/hooks/use-colors";
import { CalendarPicker } from "@/components/calendar-picker";
import type { Transaction, TransactionType, Category } from "@/types";
import { saveTransaction, updateTransaction, deleteTransaction } from "@/lib/storage";

interface TransactionModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: () => void;
  transaction?: Transaction;
  categories: Category[];
  initialType?: TransactionType;
}

export function TransactionModal({
  visible,
  onClose,
  onSave,
  transaction,
  categories,
  initialType = "expense",
}: TransactionModalProps) {
  const colors = useColors();
  const isEdit = !!transaction;

  const [type, setType] = useState<TransactionType>("expense");
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState<string | undefined>();
  const [date, setDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [memo, setMemo] = useState("");

  useEffect(() => {
    if (transaction) {
      setType(transaction.type);
      setAmount(transaction.amount.toString());
      setCategoryId(transaction.categoryId);
      setDate(dayjs(transaction.date).format("YYYY-MM-DD"));
      setMemo(transaction.memo || "");
    } else {
      setType(initialType);
      setAmount("");
      setCategoryId(undefined);
      setDate(dayjs().format("YYYY-MM-DD"));
      setMemo("");
    }
  }, [transaction, visible, initialType]);

  const handleSave = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert("エラー", "金額を入力してください。");
      return;
    }

    if (!categoryId) {
      Alert.alert("エラー", "カテゴリを選択してください。");
      return;
    }

    try {
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      if (isEdit && transaction) {
        await updateTransaction(transaction.id, {
          type,
          amount: parseFloat(amount),
          categoryId,
          date: `${date}T00:00:00.000Z`,
          memo: memo || undefined,
        });
      } else {
        await saveTransaction({
          type,
          amount: parseFloat(amount),
          categoryId,
          date: `${date}T00:00:00.000Z`,
          memo: memo || undefined,
        });
      }

      onSave();
      onClose();
    } catch (error) {
      console.error("Failed to save transaction:", error);
      Alert.alert("エラー", "保存に失敗しました。");
    }
  };

  const handleDelete = () => {
    if (!transaction) return;

    Alert.alert("取引を削除", "この取引を削除しますか?", [
      { text: "キャンセル", style: "cancel" },
      {
        text: "削除",
        style: "destructive",
        onPress: async () => {
          try {
            if (Platform.OS !== "web") {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            }
            await deleteTransaction(transaction.id);
            onSave();
            onClose();
          } catch (error) {
            console.error("Failed to delete transaction:", error);
            Alert.alert("エラー", "削除に失敗しました。");
          }
        },
      },
    ]);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        {/* Header */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 16,
            paddingVertical: 16,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
          }}
        >
          <Pressable
            style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
            onPress={onClose}
          >
            <Text style={{ fontSize: 16, color: colors.primary }}>キャンセル</Text>
          </Pressable>
          <Text style={{ fontSize: 18, fontWeight: "bold", color: colors.foreground }}>
            {isEdit ? "取引を編集" : "取引を追加"}
          </Text>
          <Pressable
            style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
            onPress={handleSave}
          >
            <Text style={{ fontSize: 16, color: colors.primary, fontWeight: "600" }}>
              保存
            </Text>
          </Pressable>
        </View>

        <ScrollView style={{ flex: 1 }}>
          <View style={{ padding: 16, gap: 24 }}>
            {/* Type Selector */}
            <View>
              <Text style={{ fontSize: 14, color: colors.muted, marginBottom: 8 }}>
                タイプ
              </Text>
              <View style={{ flexDirection: "row", gap: 12 }}>
                <Pressable
                  style={({ pressed }) => ({
                    flex: 1,
                    paddingVertical: 12,
                    borderRadius: 12,
                    alignItems: "center",
                    backgroundColor: type === "expense" ? colors.error : colors.surface,
                    opacity: pressed ? 0.7 : 1,
                  })}
                  onPress={() => {
                    if (Platform.OS !== "web") {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }
                    setType("expense");
                    if (type === "income") {
                      setCategoryId(undefined);
                    }
                  }}
                >
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: "600",
                      color: type === "expense" ? "#FFFFFF" : colors.foreground,
                    }}
                  >
                    支出
                  </Text>
                </Pressable>
                <Pressable
                  style={({ pressed }) => ({
                    flex: 1,
                    paddingVertical: 12,
                    borderRadius: 12,
                    alignItems: "center",
                    backgroundColor: type === "income" ? colors.success : colors.surface,
                    opacity: pressed ? 0.7 : 1,
                  })}
                  onPress={() => {
                    if (Platform.OS !== "web") {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }
                    setType("income");
                    setCategoryId(undefined);
                  }}
                >
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: "600",
                      color: type === "income" ? "#FFFFFF" : colors.foreground,
                    }}
                  >
                    収入
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* Amount Input */}
            <View>
              <Text style={{ fontSize: 14, color: colors.muted, marginBottom: 8 }}>
                金額
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: colors.surface,
                  borderRadius: 12,
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <Text style={{ fontSize: 24, color: colors.foreground, marginRight: 8 }}>
                  ¥
                </Text>
                <TextInput
                  style={{
                    flex: 1,
                    fontSize: 24,
                    color: colors.foreground,
                    padding: 0,
                  }}
                  value={amount}
                  onChangeText={setAmount}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={colors.muted}
                />
              </View>
            </View>

            {/* Category Selector */}
            <View>
              <Text style={{ fontSize: 14, color: colors.muted, marginBottom: 8 }}>
                カテゴリ
              </Text>
              <View style={{ gap: 8 }}>
                {categories
                  .filter((category) => category.type === type)
                  .map((category) => (
                    <Pressable
                      key={category.id}
                      style={({ pressed }) => ({
                        flexDirection: "row",
                        alignItems: "center",
                        padding: 12,
                        borderRadius: 12,
                        backgroundColor:
                          categoryId === category.id ? colors.primary : colors.surface,
                        borderWidth: 1,
                        borderColor:
                          categoryId === category.id ? colors.primary : colors.border,
                        opacity: pressed ? 0.7 : 1,
                      })}
                      onPress={() => {
                        if (Platform.OS !== "web") {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        }
                        setCategoryId(category.id);
                      }}
                    >
                      <View
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 18,
                          backgroundColor: category.color,
                          alignItems: "center",
                          justifyContent: "center",
                          marginRight: 12,
                        }}
                      >
                        <MaterialIcons
                          name={category.icon as any}
                          size={20}
                          color="#FFFFFF"
                        />
                      </View>
                      <Text
                        style={{
                          fontSize: 16,
                          color:
                            categoryId === category.id ? "#FFFFFF" : colors.foreground,
                        }}
                      >
                        {category.name}
                      </Text>
                    </Pressable>
                  ))}
              </View>
            </View>

            {/* Date Input */}
            <View>
              <Text style={{ fontSize: 14, color: colors.muted, marginBottom: 8 }}>
                日付
              </Text>
              <CalendarPicker value={date} onChange={setDate} />
            </View>

            {/* Memo Input */}
            <View>
              <Text style={{ fontSize: 14, color: colors.muted, marginBottom: 8 }}>
                メモ (オプション)
              </Text>
              <TextInput
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: 12,
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  fontSize: 16,
                  color: colors.foreground,
                  borderWidth: 1,
                  borderColor: colors.border,
                  minHeight: 80,
                  textAlignVertical: "top",
                }}
                value={memo}
                onChangeText={setMemo}
                placeholder="メモを入力..."
                placeholderTextColor={colors.muted}
                multiline
              />
            </View>

            {/* Delete Button (for edit mode) */}
            {isEdit && (
              <Pressable
                style={({ pressed }) => ({
                  paddingVertical: 12,
                  borderRadius: 12,
                  alignItems: "center",
                  backgroundColor: colors.error,
                  opacity: pressed ? 0.7 : 1,
                  marginTop: 16,
                })}
                onPress={handleDelete}
              >
                <Text style={{ fontSize: 16, fontWeight: "600", color: "#FFFFFF" }}>
                  削除
                </Text>
              </Pressable>
            )}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}
