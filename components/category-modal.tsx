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
  KeyboardAvoidingView,
} from "react-native";
import * as Haptics from "expo-haptics";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useColors } from "@/hooks/use-colors";
import { CATEGORY_ICONS, CATEGORY_COLORS } from "@/constants/category-presets";
import { saveCategory, updateCategory, getCategories } from "@/lib/storage";
import type { Category } from "@/types";

interface CategoryModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: () => void;
  category?: Category;
  initialType?: "income" | "expense";
  canDelete?: boolean;
  onDelete?: () => void;
}

export function CategoryModal({
  visible,
  onClose,
  onSave,
  category,
  initialType = "expense",
  canDelete = false,
  onDelete,
}: CategoryModalProps) {
  const colors = useColors();
  const isEdit = !!category;

  const [name, setName] = useState("");
  const [icon, setIcon] = useState<string>("more-horiz");
  const [color, setColor] = useState<string>("#C7CEEA");
  const [type, setType] = useState<"income" | "expense">("expense");
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);

  useEffect(() => {
    if (category) {
      setName(category.name);
      setIcon(category.icon);
      setColor(category.color);
      setType(category.type);
    } else {
      setName("");
      setIcon("more-horiz");
      setColor("#C7CEEA");
      setType(initialType);
    }
    setShowIconPicker(false);
    setShowColorPicker(false);
  }, [category, visible, initialType]);

  const showAlert = (title: string, message: string) => {
    if (Platform.OS === "web") {
      window.alert(`${title}: ${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      showAlert("エラー", "カテゴリ名を入力してください。");
      return;
    }

    if (name.trim().length > 20) {
      showAlert("エラー", "カテゴリ名は20文字以内で入力してください。");
      return;
    }

    try {
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      if (isEdit && category) {
        await updateCategory(category.id, {
          name: name.trim(),
          icon,
          color,
        });
      } else {
        const categories = await getCategories();
        const maxOrder = Math.max(...categories.map((c) => c.order), -1);

        await saveCategory({
          name: name.trim(),
          icon,
          color,
          type,
          isDefault: false,
          order: maxOrder + 1,
        });
      }

      onSave();
      onClose();
    } catch (error) {
      console.error("Failed to save category:", error);
      showAlert("エラー", "保存に失敗しました。");
    }
  };

  const handleDelete = () => {
    if (!category || !onDelete) return;

    const doDelete = () => {
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }
      onDelete();
      onClose();
    };

    if (Platform.OS === "web") {
      if (window.confirm(`「${category.name}」を削除しますか?`)) {
        doDelete();
      }
    } else {
      Alert.alert("カテゴリを削除", `「${category.name}」を削除しますか?`, [
        { text: "キャンセル", style: "cancel" },
        {
          text: "削除",
          style: "destructive",
          onPress: doDelete,
        },
      ]);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: colors.background }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 40 : 0}
      >
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
            style={({ pressed }) => ({
              opacity: pressed ? 0.6 : 1,
              minWidth: 80,
            })}
            onPress={onClose}
          >
            <MaterialIcons name="clear" size={24} color={colors.primary} />
          </Pressable>
          <Text
            style={{
              fontSize: 18,
              fontWeight: "bold",
              color: colors.foreground,
            }}
          >
            {isEdit ? "カテゴリを編集" : "カテゴリを追加"}
          </Text>
          {isEdit && canDelete ? (
            <Pressable
              style={({ pressed }) => ({
                opacity: pressed ? 0.6 : 1,
                minWidth: 80,
                alignItems: "flex-end",
              })}
              onPress={handleDelete}
            >
              <MaterialIcons name="delete" size={24} color={colors.error} />
            </Pressable>
          ) : (
            <View style={{ minWidth: 80 }} />
          )}
        </View>

        <ScrollView
          style={{ flex: 1 }}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ flexGrow: 1 }}
        >
          <View style={{ padding: 16, gap: 24 }}>
            {/* Type Selector */}
            <View>
              <Text
                style={{ fontSize: 14, color: colors.muted, marginBottom: 8 }}
              >
                タイプ
              </Text>
              <View style={{ flexDirection: "row", gap: 12 }}>
                <Pressable
                  style={({ pressed }) => ({
                    flex: 1,
                    paddingVertical: 12,
                    borderRadius: 12,
                    alignItems: "center",
                    backgroundColor:
                      type === "income" ? colors.success : colors.surface,
                    opacity: isEdit ? 0.5 : pressed ? 0.7 : 1,
                  })}
                  onPress={() => {
                    if (isEdit) return;
                    if (Platform.OS !== "web") {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }
                    setType("income");
                  }}
                  disabled={isEdit}
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

                <Pressable
                  style={({ pressed }) => ({
                    flex: 1,
                    paddingVertical: 12,
                    borderRadius: 12,
                    alignItems: "center",
                    backgroundColor:
                      type === "expense" ? colors.error : colors.surface,
                    opacity: isEdit ? 0.5 : pressed ? 0.7 : 1,
                  })}
                  onPress={() => {
                    if (isEdit) return;
                    if (Platform.OS !== "web") {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }
                    setType("expense");
                  }}
                  disabled={isEdit}
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
              </View>
              {isEdit && (
                <Text
                  style={{
                    fontSize: 12,
                    color: colors.muted,
                    marginTop: 8,
                  }}
                >
                  タイプは変更できません
                </Text>
              )}
            </View>

            {/* Name Input */}
            <View>
              <Text
                style={{ fontSize: 14, color: colors.muted, marginBottom: 8 }}
              >
                カテゴリ名
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
                }}
                value={name}
                onChangeText={setName}
                placeholder="カテゴリ名を入力..."
                placeholderTextColor={colors.muted}
                maxLength={20}
              />
            </View>

            {/* Icon Picker */}
            <View>
              <Text
                style={{ fontSize: 14, color: colors.muted, marginBottom: 8 }}
              >
                アイコン
              </Text>
              <Pressable
                style={({ pressed }) => ({
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: colors.surface,
                  borderRadius: 12,
                  padding: 12,
                  borderWidth: 1,
                  borderColor: colors.border,
                  opacity: pressed ? 0.7 : 1,
                })}
                onPress={() => {
                  if (Platform.OS !== "web") {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                  setShowIconPicker(!showIconPicker);
                  setShowColorPicker(false);
                }}
              >
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: color,
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 12,
                  }}
                >
                  <MaterialIcons name={icon as any} size={24} color="#FFFFFF" />
                </View>
                <Text style={{ flex: 1, color: colors.foreground, fontSize: 16 }}>
                  アイコンを選択
                </Text>
                <MaterialIcons
                  name={showIconPicker ? "expand-less" : "expand-more"}
                  size={24}
                  color={colors.muted}
                />
              </Pressable>

              {showIconPicker && (
                <View
                  style={{
                    marginTop: 12,
                    flexDirection: "row",
                    flexWrap: "wrap",
                    gap: 8,
                  }}
                >
                  {CATEGORY_ICONS.map((iconName) => (
                    <Pressable
                      key={iconName}
                      style={({ pressed }) => ({
                        width: 56,
                        height: 56,
                        borderRadius: 28,
                        backgroundColor: color,
                        alignItems: "center",
                        justifyContent: "center",
                        borderWidth: icon === iconName ? 3 : 0,
                        borderColor: colors.primary,
                        opacity: pressed ? 0.7 : 1,
                      })}
                      onPress={() => {
                        if (Platform.OS !== "web") {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        }
                        setIcon(iconName);
                        setShowIconPicker(false);
                      }}
                    >
                      <MaterialIcons
                        name={iconName as any}
                        size={24}
                        color="#FFFFFF"
                      />
                    </Pressable>
                  ))}
                </View>
              )}
            </View>

            {/* Color Picker */}
            <View>
              <Text
                style={{ fontSize: 14, color: colors.muted, marginBottom: 8 }}
              >
                色
              </Text>
              <Pressable
                style={({ pressed }) => ({
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: colors.surface,
                  borderRadius: 12,
                  padding: 12,
                  borderWidth: 1,
                  borderColor: colors.border,
                  opacity: pressed ? 0.7 : 1,
                })}
                onPress={() => {
                  if (Platform.OS !== "web") {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                  setShowColorPicker(!showColorPicker);
                  setShowIconPicker(false);
                }}
              >
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: color,
                    marginRight: 12,
                  }}
                />
                <Text style={{ flex: 1, color: colors.foreground, fontSize: 16 }}>
                  色を選択
                </Text>
                <MaterialIcons
                  name={showColorPicker ? "expand-less" : "expand-more"}
                  size={24}
                  color={colors.muted}
                />
              </Pressable>

              {showColorPicker && (
                <View
                  style={{
                    marginTop: 12,
                    flexDirection: "row",
                    flexWrap: "wrap",
                    gap: 12,
                  }}
                >
                  {CATEGORY_COLORS.map((colorValue) => (
                    <Pressable
                      key={colorValue}
                      style={({ pressed }) => ({
                        width: 44,
                        height: 44,
                        borderRadius: 22,
                        backgroundColor: colorValue,
                        alignItems: "center",
                        justifyContent: "center",
                        borderWidth: color === colorValue ? 3 : 0,
                        borderColor: colors.primary,
                        opacity: pressed ? 0.7 : 1,
                      })}
                      onPress={() => {
                        if (Platform.OS !== "web") {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        }
                        setColor(colorValue);
                        setShowColorPicker(false);
                      }}
                    >
                      {color === colorValue && (
                        <MaterialIcons name="check" size={20} color="#FFFFFF" />
                      )}
                    </Pressable>
                  ))}
                </View>
              )}
            </View>

            {/* Save Button */}
            <Pressable
              style={({ pressed }) => ({
                marginBottom: 12,
                paddingVertical: 16,
                borderRadius: 12,
                alignItems: "center",
                backgroundColor: colors.primary,
                opacity: pressed ? 0.7 : 1,
              })}
              onPress={handleSave}
            >
              <Text
                style={{ fontSize: 16, fontWeight: "600", color: "#FFFFFF" }}
              >
                保存
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}
