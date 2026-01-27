import { useState, useEffect, useCallback, useMemo } from "react";
import { View, Text, Platform, Pressable } from "react-native";
import {
  ScaleDecorator,
  RenderItemParams,
  NestableScrollContainer,
  NestableDraggableFlatList,
} from "react-native-draggable-flatlist";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/use-colors";
import { getCategories, deleteCategory, updateCategoryOrders } from "@/lib/storage";
import type { Category } from "@/types";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { CategoryModal } from "@/components/category-modal";
import { GestureHandlerRootView } from "react-native-gesture-handler";

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

  const handleDragEnd = async (
    type: "expense" | "income",
    newData: Category[]
  ) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    // 新しい順序でカテゴリを更新
    const otherCategories =
      type === "expense" ? incomeCategories : expenseCategories;

    // 支出カテゴリは0から、収入カテゴリは支出カテゴリの数から開始
    const baseOrder = type === "expense" ? 0 : expenseCategories.length;
    const updatedData = newData.map((cat, index) => ({
      ...cat,
      order: baseOrder + index,
    }));

    // ローカル状態を即座に更新
    const allCategories =
      type === "expense"
        ? [...updatedData, ...otherCategories]
        : [...otherCategories, ...updatedData];
    setCategories(allCategories.sort((a, b) => a.order - b.order));

    // サーバーに保存
    try {
      await updateCategoryOrders(
        updatedData.map((cat) => ({ id: cat.id, order: cat.order }))
      );
    } catch (error) {
      console.error("Failed to update category orders:", error);
      loadCategories(); // エラー時は再読み込み
    }
  };

  const renderCategoryItem = ({
    item,
    drag,
    isActive,
  }: RenderItemParams<Category>) => (
    <ScaleDecorator>
      <Pressable
        style={{
          backgroundColor: isActive ? colors.background : colors.surface,
          borderRadius: 16,
          padding: 16,
          borderWidth: 1,
          borderColor: isActive ? colors.primary : colors.border,
          opacity: isActive ? 0.95 : 1,
        }}
        onPress={() => handleCategoryPress(item)}
        onLongPress={drag}
        delayLongPress={150}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          {/* ドラッグハンドル */}
          <View
            style={{
              marginRight: 8,
              padding: 4,
            }}
          >
            <MaterialIcons name="drag-indicator" size={20} color={colors.muted} />
          </View>
          <View
            style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor: item.color,
              alignItems: "center",
              justifyContent: "center",
              marginRight: 12,
            }}
          >
            <MaterialIcons name={item.icon as any} size={24} color="#FFFFFF" />
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: 18,
                fontWeight: "600",
                color: colors.foreground,
              }}
            >
              {item.name}
            </Text>
          </View>
          <MaterialIcons name="chevron-right" size={24} color={colors.muted} />
        </View>
      </Pressable>
    </ScaleDecorator>
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
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.background }}>
      <NestableScrollContainer
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
        <NestableDraggableFlatList
          data={expenseCategories}
          keyExtractor={(item) => item.id}
          renderItem={renderCategoryItem}
          onDragEnd={({ data }) => handleDragEnd("expense", data)}
          style={{ marginBottom: 24 }}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        />

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
        <NestableDraggableFlatList
          data={incomeCategories}
          keyExtractor={(item) => item.id}
          renderItem={renderCategoryItem}
          onDragEnd={({ data }) => handleDragEnd("income", data)}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        />
      </NestableScrollContainer>

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
    </GestureHandlerRootView>
  );
}
