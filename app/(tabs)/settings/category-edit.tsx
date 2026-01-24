import { useState, useEffect, useCallback, useMemo } from "react";
import { View, Text, ScrollView, Platform, Pressable } from "react-native";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/use-colors";
import { getCategories, deleteCategory } from "@/lib/storage";
import type { Category } from "@/types";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { CategoryModal } from "@/components/category-modal";

export default function CategoryEditScreen() {
  const colors = useColors();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | undefined>();

  const loadCategories = useCallback(async () => {
    try {
      const data = await getCategories();
      setCategories(data.sort((a, b) => a.order - b.order));
    } catch (error) {
      console.error("Failed to load categories:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  // タイプ別にグループ化
  const expenseCategories = useMemo(
    () => categories.filter((c) => c.type === "expense"),
    [categories]
  );
  const incomeCategories = useMemo(
    () => categories.filter((c) => c.type === "income"),
    [categories]
  );

  // 削除可能かどうかを判定（同一タイプで最後の1つは削除不可）
  const canDelete = useCallback(
    (category: Category): boolean => {
      const sameTypeCount = categories.filter(
        (c) => c.type === category.type
      ).length;
      return sameTypeCount > 1;
    },
    [categories]
  );

  const handleCategoryPress = (category: Category) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setEditingCategory(category);
    setModalVisible(true);
  };

  const handleAdd = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setEditingCategory(undefined);
    setModalVisible(true);
  };

  const handleModalClose = () => {
    setModalVisible(false);
    setEditingCategory(undefined);
  };

  const handleModalSave = () => {
    loadCategories();
  };

  const handleDelete = async () => {
    if (!editingCategory) return;
    try {
      await deleteCategory(editingCategory.id);
      loadCategories();
    } catch (error) {
      console.error("Failed to delete category:", error);
    }
  };

  const renderCategoryCard = (category: Category) => (
    <Pressable
      key={category.id}
      style={({ pressed }) => ({
        backgroundColor: colors.surface,
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: colors.border,
        opacity: pressed ? 0.7 : 1,
      })}
      onPress={() => handleCategoryPress(category)}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
        }}
      >
        <View
          style={{
            width: 48,
            height: 48,
            borderRadius: 24,
            backgroundColor: category.color,
            alignItems: "center",
            justifyContent: "center",
            marginRight: 12,
          }}
        >
          <MaterialIcons name={category.icon as any} size={24} color="#FFFFFF" />
        </View>
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: 18,
              fontWeight: "600",
              color: colors.foreground,
            }}
          >
            {category.name}
          </Text>
        </View>
        <MaterialIcons name="chevron-right" size={24} color={colors.muted} />
      </View>
    </Pressable>
  );

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: colors.background,
        }}
      >
        <Text style={{ color: colors.muted }}>読み込み中...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* 支出カテゴリ */}
        <Text
          style={{
            fontSize: 14,
            fontWeight: "600",
            color: colors.muted,
            marginBottom: 8,
            paddingHorizontal: 4,
          }}
        >
          支出
        </Text>
        <View style={{ gap: 8, marginBottom: 24 }}>
          {expenseCategories.map(renderCategoryCard)}
        </View>

        {/* 収入カテゴリ */}
        <Text
          style={{
            fontSize: 14,
            fontWeight: "600",
            color: colors.muted,
            marginBottom: 8,
            paddingHorizontal: 4,
          }}
        >
          収入
        </Text>
        <View style={{ gap: 8 }}>
          {incomeCategories.map(renderCategoryCard)}
        </View>
      </ScrollView>

      {/* Floating Action Button */}
      <Pressable
        style={({ pressed }) => ({
          position: "absolute",
          right: 20,
          bottom: 20,
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: colors.primary,
          alignItems: "center",
          justifyContent: "center",
          opacity: pressed ? 0.7 : 1,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.25,
          shadowRadius: 4,
          elevation: 5,
        })}
        onPress={handleAdd}
      >
        <MaterialIcons name="add" size={28} color="#FFFFFF" />
      </Pressable>

      {/* Category Modal */}
      <CategoryModal
        visible={modalVisible}
        onClose={handleModalClose}
        onSave={handleModalSave}
        category={editingCategory}
        initialType="expense"
        canDelete={editingCategory ? canDelete(editingCategory) : false}
        onDelete={handleDelete}
      />
    </View>
  );
}
