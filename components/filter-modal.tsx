import { useState, useEffect } from "react";
import {
  View,
  Text,
  Modal,
  Pressable,
  ScrollView,
  TextInput,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import * as Haptics from "expo-haptics";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useColors } from "@/hooks/use-colors";
import type { Category, FilterState } from "@/types";

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filterState: FilterState) => void;
  initialState: FilterState;
  categories: Category[];
}

const DEFAULT_FILTER_STATE: FilterState = {
  transactionType: "all",
  selectedCategoryIds: [],
  amountMin: null,
  amountMax: null,
  dateSortOrder: "date-desc",
  amountSortOrder: null,
};

const formatNumber = (num: number | null) =>
  num === null ? "" : num.toLocaleString("ja-JP");

export function FilterModal({
  visible,
  onClose,
  onApply,
  initialState,
  categories,
}: FilterModalProps) {
  const colors = useColors();
  const [tempState, setTempState] = useState<FilterState>(initialState);

  useEffect(() => {
    if (visible) {
      setTempState(initialState);
    }
  }, [visible, initialState]);

  const impact = (style: Haptics.ImpactFeedbackStyle) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(style);
    }
  };

  const handleClear = () => {
    impact(Haptics.ImpactFeedbackStyle.Light);
    onApply(DEFAULT_FILTER_STATE);
    onClose();
  };

  const handleApply = () => {
    impact(Haptics.ImpactFeedbackStyle.Medium);
    onApply(tempState);
    onClose();
  };

  const handleClose = () => {
    impact(Haptics.ImpactFeedbackStyle.Light);
    onClose();
  };

  const toggleCategory = (categoryId: string) => {
    impact(Haptics.ImpactFeedbackStyle.Light);
    setTempState((prev) => ({
      ...prev,
      selectedCategoryIds: prev.selectedCategoryIds.includes(categoryId)
        ? prev.selectedCategoryIds.filter((id) => id !== categoryId)
        : [...prev.selectedCategoryIds, categoryId],
    }));
  };

  const filteredCategories = categories.filter((c) => {
    if (tempState.transactionType === "all") return true;
    return c.type === tempState.transactionType;
  });

  return (
    <Modal visible={visible} transparent animationType="fade">
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.5)",
            justifyContent: "flex-end",
          }}
        >
          <View
            style={{
              backgroundColor: colors.surface,
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              maxHeight: "85%",
            }}
          >
            {/* Header */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                padding: 16,
                borderBottomWidth: 1,
                borderColor: colors.border,
              }}
            >
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "bold",
                  color: colors.foreground,
                }}
              >
                フィルター
              </Text>
              <Pressable
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: colors.background,
                  alignItems: "center",
                  justifyContent: "center",
                }}
                onPress={handleClose}
              >
                <MaterialIcons name="close" size={20} color={colors.muted} />
              </Pressable>
            </View>

            {/* Content */}
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{
                padding: 16,
                paddingBottom: 32,
              }}
            >
              {/* Transaction Type */}
              <View style={{ marginBottom: 20 }}>
                <Text
                  style={{ fontSize: 14, color: colors.muted, marginBottom: 8 }}
                >
                  収入・支出
                </Text>
                <View style={{ flexDirection: "row", gap: 8 }}>
                  {(
                    [
                      { value: "all", label: "全て" },
                      { value: "income", label: "収入" },
                      { value: "expense", label: "支出" },
                    ] as const
                  ).map((option) => {
                    const isSelected =
                      tempState.transactionType === option.value;
                    return (
                      <Pressable
                        key={option.value}
                        style={{
                          flex: 1,
                          paddingVertical: 10,
                          borderRadius: 8,
                          alignItems: "center",
                          backgroundColor: colors.background,
                          borderWidth: 1,
                          borderColor: isSelected
                            ? colors.primary
                            : colors.border,
                        }}
                        onPress={() =>
                          setTempState((prev) => ({
                            ...prev,
                            transactionType: option.value,
                            selectedCategoryIds: [],
                          }))
                        }
                      >
                        <Text
                          style={{
                            fontSize: 13,
                            fontWeight: isSelected ? "600" : "400",
                            color: isSelected
                              ? colors.primary
                              : colors.foreground,
                          }}
                        >
                          {option.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* Category */}
              <View style={{ marginBottom: 20, marginHorizontal: -16 }}>
                <Text
                  style={{
                    fontSize: 14,
                    color: colors.muted,
                    marginBottom: 8,
                    paddingHorizontal: 16,
                  }}
                >
                  カテゴリ
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                  }}
                  style={{ marginVertical: -8 }}
                >
                  <View style={{ flexDirection: "row", gap: 8 }}>
                    {filteredCategories.map((category) => {
                      const isSelected = tempState.selectedCategoryIds.includes(
                        category.id,
                      );
                      return (
                        <Pressable
                          key={category.id}
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            paddingHorizontal: 14,
                            paddingVertical: 10,
                            borderRadius: 22,
                            backgroundColor: colors.background,
                            borderWidth: 1,
                            borderColor: isSelected
                              ? category.color
                              : colors.border,
                          }}
                          onPress={() => toggleCategory(category.id)}
                        >
                          <MaterialIcons
                            name={
                              category.icon as keyof typeof MaterialIcons.glyphMap
                            }
                            size={18}
                            color={category.color}
                          />
                          <Text
                            style={{
                              marginLeft: 6,
                              fontSize: 14,
                              color: isSelected
                                ? category.color
                                : colors.foreground,
                            }}
                          >
                            {category.name}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </ScrollView>
              </View>

              {/* Amount Range */}
              <View style={{ marginBottom: 20 }}>
                <Text
                  style={{ fontSize: 14, color: colors.muted, marginBottom: 8 }}
                >
                  金額範囲
                </Text>

                <View
                  style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
                >
                  {/* Min */}
                  <View
                    style={{
                      flex: 1,
                      flexDirection: "row",
                      alignItems: "center",
                      backgroundColor: colors.background,
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor: colors.border,
                      paddingHorizontal: 8,
                    }}
                  >
                    <Text style={{ color: colors.muted, marginRight: 4 }}>
                      ￥
                    </Text>
                    <TextInput
                      style={{
                        flex: 1,
                        paddingVertical: 10,
                        fontSize: 16,
                        color: colors.foreground,
                      }}
                      placeholder="最小"
                      keyboardType="number-pad"
                      placeholderTextColor={colors.muted}
                      value={formatNumber(tempState.amountMin) ?? ""}
                      onChangeText={(text) => {
                        const num = parseInt(text.replace(/[^0-9]/g, ""), 10);
                        setTempState((prev) => ({
                          ...prev,
                          amountMin: isNaN(num) ? null : num,
                        }));
                      }}
                    />
                  </View>

                  <Text style={{ color: colors.muted }}>〜</Text>

                  {/* Max */}
                  <View
                    style={{
                      flex: 1,
                      flexDirection: "row",
                      alignItems: "center",
                      backgroundColor: colors.background,
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor: colors.border,
                      paddingHorizontal: 8,
                    }}
                  >
                    <Text style={{ color: colors.muted, marginRight: 4 }}>
                      ￥
                    </Text>
                    <TextInput
                      style={{
                        flex: 1,
                        paddingVertical: 10,
                        fontSize: 16,
                        color: colors.foreground,
                      }}
                      placeholder="最大"
                      keyboardType="number-pad"
                      placeholderTextColor={colors.muted}
                      value={formatNumber(tempState.amountMax) ?? ""}
                      onChangeText={(text) => {
                        const num = parseInt(text.replace(/[^0-9]/g, ""), 10);
                        setTempState((prev) => ({
                          ...prev,
                          amountMax: isNaN(num) ? null : num,
                        }));
                      }}
                    />
                  </View>
                </View>
              </View>

              {/* AmountSort */}
              <View style={{ marginBottom: 16 }}>
                <Text
                  style={{ fontSize: 14, color: colors.muted, marginBottom: 8 }}
                >
                  金額の並び順
                </Text>

                <View style={{ flexDirection: "row", gap: 8 }}>
                  {[
                    { value: "amount-asc", label: "安い順" },
                    { value: "amount-desc", label: "高い順" },
                  ].map((option) => {
                    const isSelected =
                      tempState.amountSortOrder === option.value;
                    return (
                      <Pressable
                        key={option.value}
                        style={{
                          flex: 1,
                          paddingVertical: 10,
                          borderRadius: 8,
                          alignItems: "center",
                          backgroundColor: colors.background,
                          borderWidth: 1,
                          borderColor: isSelected
                            ? colors.primary
                            : colors.border,
                        }}
                        onPress={() =>
                          setTempState((p) => ({
                            ...p,
                            amountSortOrder: option.value as any,
                          }))
                        }
                      >
                        <Text
                          style={{
                            color: isSelected
                              ? colors.primary
                              : colors.foreground,
                          }}
                        >
                          {option.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* DateSort */}
              <View style={{ marginBottom: 4 }}>
                <Text
                  style={{
                    fontSize: 14,
                    color: colors.muted,
                    marginBottom: 8,
                  }}
                >
                  日付の並び順
                </Text>
                <View style={{ flexDirection: "row", gap: 8 }}>
                  {(
                    [
                      { value: "date-desc", label: "新しい順" },
                      { value: "date-asc", label: "古い順" },
                    ] as const
                  ).map((option) => {
                    const isSelected = tempState.dateSortOrder === option.value;
                    return (
                      <Pressable
                        key={option.value}
                        style={{
                          flex: 1,
                          paddingVertical: 10,
                          borderRadius: 8,
                          alignItems: "center",
                          backgroundColor: colors.background,
                          borderWidth: 1,
                          borderColor: isSelected
                            ? colors.primary
                            : colors.border,
                        }}
                        onPress={() =>
                          setTempState((prev) => ({
                            ...prev,
                            dateSortOrder: option.value,
                          }))
                        }
                      >
                        <Text
                          style={{
                            color: isSelected
                              ? colors.primary
                              : colors.foreground,
                          }}
                        >
                          {option.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            </ScrollView>

            {/* Footer */}
            <View
              style={{
                flexDirection: "row",
                gap: 12,
                padding: 16,
                borderTopWidth: 1,
                borderColor: colors.border,
                backgroundColor: colors.surface,
              }}
            >
              <Pressable
                style={{
                  flex: 1,
                  paddingVertical: 14,
                  borderRadius: 8,
                  alignItems: "center",
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
                onPress={handleClear}
              >
                <Text style={{ color: colors.foreground }}>クリア</Text>
              </Pressable>

              <Pressable
                style={{
                  flex: 1,
                  paddingVertical: 14,
                  borderRadius: 8,
                  alignItems: "center",
                  backgroundColor: colors.primary,
                }}
                onPress={handleApply}
              >
                <Text style={{ color: "#FFFFFF", fontWeight: "600" }}>
                  適用
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
