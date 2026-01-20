import { useState, useEffect, useCallback } from "react";
import { View, Text, ScrollView, TouchableOpacity, Alert, Platform, Pressable } from "react-native";
import * as Haptics from "expo-haptics";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { getCategories, deleteCategory } from "@/lib/storage";
import type { Category } from "@/types";
import { IconSymbol } from "@/components/ui/icon-symbol";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

export default function CategoriesScreen() {
  const colors = useColors();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

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

  const handleDelete = useCallback((category: Category) => {
    if (category.isDefault) {
      Alert.alert("削除できません", "デフォルトカテゴリは削除できません。");
      return;
    }

    Alert.alert(
      "カテゴリを削除",
      `「${category.name}」を削除しますか?`,
      [
        { text: "キャンセル", style: "cancel" },
        {
          text: "削除",
          style: "destructive",
          onPress: async () => {
            if (Platform.OS !== "web") {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            }
            await deleteCategory(category.id);
            loadCategories();
          },
        },
      ]
    );
  }, [loadCategories]);

  if (loading) {
    return (
      <ScreenContainer className="items-center justify-center">
        <Text className="text-muted">読み込み中...</Text>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <View className="flex-1 p-4">
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-2xl font-bold text-foreground">カテゴリ管理</Text>
          <Pressable
            style={({ pressed }) => ({
              backgroundColor: colors.primary,
              width: 40,
              height: 40,
              borderRadius: 20,
              alignItems: "center",
              justifyContent: "center",
              opacity: pressed ? 0.7 : 1,
            })}
            onPress={() => {
              if (Platform.OS !== "web") {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
              // TODO: カテゴリ追加画面へ遷移
              Alert.alert("開発中", "カテゴリ追加機能は次のフェーズで実装します。");
            }}
          >
            <MaterialIcons name="add" size={24} color={colors.background} />
          </Pressable>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          <View className="gap-2">
            {categories.map((category) => (
              <View
                key={category.id}
                className="bg-surface rounded-2xl p-4 border border-border"
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center flex-1">
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
                    <View className="flex-1">
                      <Text className="text-lg font-semibold text-foreground">
                        {category.name}
                      </Text>
                      {category.isDefault && (
                        <Text className="text-xs text-muted mt-1">デフォルト</Text>
                      )}
                    </View>
                  </View>

                  <View className="flex-row gap-2">
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
                      onPress={() => {
                        if (Platform.OS !== "web") {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        }
                        // TODO: カテゴリ編集画面へ遷移
                        Alert.alert("開発中", "カテゴリ編集機能は次のフェーズで実装します。");
                      }}
                    >
                      <MaterialIcons name="edit" size={18} color={colors.muted} />
                    </Pressable>

                    {!category.isDefault && (
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
                        onPress={() => handleDelete(category)}
                      >
                        <MaterialIcons name="delete" size={18} color={colors.error} />
                      </Pressable>
                    )}
                  </View>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    </ScreenContainer>
  );
}
