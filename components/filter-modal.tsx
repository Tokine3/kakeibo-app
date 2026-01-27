import { useState, useEffect } from "react";
import {
  View,
  Text,
  Modal,
  Pressable,
  ScrollView,
  TextInput,
  Platform,
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
  sortOrder: "date-desc",
};

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

  const handleClear = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onApply(DEFAULT_FILTER_STATE);
    onClose();
  };

  const handleApply = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    onApply(tempState);
    onClose();
  };

  const handleClose = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onClose();
  };

  const toggleCategory = (categoryId: string) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
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
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <Pressable
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.5)",
          justifyContent: "center",
          alignItems: "center",
          padding: 20,
        }}
        onPress={handleClose}
      >
        <Pressable
          style={{
            width: "100%",
            maxWidth: 400,
            backgroundColor: colors.surface,
            borderRadius: 16,
            padding: 16,
            maxHeight: "80%",
          }}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 16,
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
              style={({ pressed }) => ({
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: colors.background,
                alignItems: "center",
                justifyContent: "center",
                opacity: pressed ? 0.7 : 1,
              })}
              onPress={handleClose}
            >
              <MaterialIcons name="close" size={20} color={colors.muted} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Transaction Type */}
            <View style={{ marginBottom: 20 }}>
              <Text
                style={{
                  fontSize: 14,
                  color: colors.muted,
                  marginBottom: 8,
                }}
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
                  const isSelected = tempState.transactionType === option.value;
                  return (
                    <Pressable
                      key={option.value}
                      style={({ pressed }) => ({
                        flex: 1,
                        paddingVertical: 10,
                        borderRadius: 8,
                        alignItems: "center",
                        backgroundColor: colors.background,
                        borderWidth: 1,
                        borderColor: isSelected ? colors.primary : colors.border,
                        opacity: pressed ? 0.7 : 1,
                      })}
                      onPress={() => {
                        if (Platform.OS !== "web") {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        }
                        setTempState((prev) => ({
                          ...prev,
                          transactionType: option.value,
                          selectedCategoryIds: [],
                        }));
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 13,
                          fontWeight: isSelected ? "600" : "400",
                          color: isSelected ? colors.primary : colors.foreground,
                        }}
                      >
                        {option.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Category Selection */}
            <View style={{ marginBottom: 20 }}>
              <Text
                style={{
                  fontSize: 14,
                  color: colors.muted,
                  marginBottom: 8,
                }}
              >
                カテゴリ
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{ marginHorizontal: -16 }}
                contentContainerStyle={{ paddingHorizontal: 16 }}
              >
                <View style={{ flexDirection: "row", gap: 8 }}>
                  {filteredCategories.map((category) => {
                    const isSelected = tempState.selectedCategoryIds.includes(
                      category.id,
                    );
                    return (
                      <Pressable
                        key={category.id}
                        style={({ pressed }) => ({
                          flexDirection: "row",
                          alignItems: "center",
                          paddingHorizontal: 12,
                          paddingVertical: 8,
                          borderRadius: 20,
                          backgroundColor: colors.background,
                          borderWidth: 1,
                          borderColor: isSelected
                            ? category.color
                            : colors.border,
                          opacity: pressed ? 0.7 : 1,
                        })}
                        onPress={() => toggleCategory(category.id)}
                      >
                        <MaterialIcons
                          name={category.icon as keyof typeof MaterialIcons.glyphMap}
                          size={16}
                          color={category.color}
                        />
                        <Text
                          style={{
                            marginLeft: 6,
                            fontSize: 13,
                            fontWeight: isSelected ? "600" : "400",
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
              {filteredCategories.length === 0 && (
                <Text
                  style={{
                    fontSize: 13,
                    color: colors.muted,
                    textAlign: "center",
                    paddingVertical: 8,
                  }}
                >
                  カテゴリがありません
                </Text>
              )}
            </View>

            {/* Amount Range */}
            <View style={{ marginBottom: 20 }}>
              <Text
                style={{
                  fontSize: 14,
                  color: colors.muted,
                  marginBottom: 8,
                }}
              >
                金額範囲
              </Text>
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
              >
                <TextInput
                  style={{
                    flex: 1,
                    backgroundColor: colors.background,
                    borderRadius: 8,
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    fontSize: 14,
                    color: colors.foreground,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                  value={tempState.amountMin?.toLocaleString() ?? ""}
                  onChangeText={(text) => {
                    const num = parseInt(text.replace(/[^0-9]/g, ""), 10);
                    setTempState((prev) => ({
                      ...prev,
                      amountMin: isNaN(num) ? null : num,
                    }));
                  }}
                  placeholder="最小"
                  placeholderTextColor={colors.muted}
                  keyboardType="numeric"
                />
                <Text style={{ color: colors.muted }}>〜</Text>
                <TextInput
                  style={{
                    flex: 1,
                    backgroundColor: colors.background,
                    borderRadius: 8,
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    fontSize: 14,
                    color: colors.foreground,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                  value={tempState.amountMax?.toLocaleString() ?? ""}
                  onChangeText={(text) => {
                    const num = parseInt(text.replace(/[^0-9]/g, ""), 10);
                    setTempState((prev) => ({
                      ...prev,
                      amountMax: isNaN(num) ? null : num,
                    }));
                  }}
                  placeholder="最大"
                  placeholderTextColor={colors.muted}
                  keyboardType="numeric"
                />
              </View>
            </View>

            {/* Sort Order */}
            <View style={{ marginBottom: 20 }}>
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
                  const isSelected = tempState.sortOrder === option.value;
                  return (
                    <Pressable
                      key={option.value}
                      style={({ pressed }) => ({
                        flex: 1,
                        paddingVertical: 10,
                        borderRadius: 8,
                        alignItems: "center",
                        backgroundColor: colors.background,
                        borderWidth: 1,
                        borderColor: isSelected ? colors.primary : colors.border,
                        opacity: pressed ? 0.7 : 1,
                      })}
                      onPress={() => {
                        if (Platform.OS !== "web") {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        }
                        setTempState((prev) => ({
                          ...prev,
                          sortOrder: option.value,
                        }));
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 13,
                          fontWeight: isSelected ? "600" : "400",
                          color: isSelected ? colors.primary : colors.foreground,
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

          {/* Footer Buttons */}
          <View style={{ flexDirection: "row", gap: 12, marginTop: 8 }}>
            <Pressable
              style={({ pressed }) => ({
                flex: 1,
                paddingVertical: 12,
                borderRadius: 8,
                alignItems: "center",
                backgroundColor: colors.background,
                borderWidth: 1,
                borderColor: colors.border,
                opacity: pressed ? 0.7 : 1,
              })}
              onPress={handleClear}
            >
              <Text style={{ fontSize: 14, color: colors.foreground }}>
                クリア
              </Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => ({
                flex: 1,
                paddingVertical: 12,
                borderRadius: 8,
                alignItems: "center",
                backgroundColor: colors.primary,
                opacity: pressed ? 0.7 : 1,
              })}
              onPress={handleApply}
            >
              <Text
                style={{ fontSize: 14, fontWeight: "600", color: "#FFFFFF" }}
              >
                適用
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
