import { View, Text, Pressable, Platform } from "react-native";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useThemeContext } from "@/lib/theme-provider";

const THEME_LABELS: Record<string, string> = {
  system: "デバイスに合わせる",
  light: "ライト",
  dark: "ダーク",
  pink: "ライトピンク",
  blue: "ライトブルー",
};

export default function SettingsScreen() {
  const colors = useColors();
  const { themeMode } = useThemeContext();

  const handleNavigate = (path: string) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push(path as any);
  };

  return (
    <ScreenContainer>
      <View style={{ flex: 1, padding: 16 }}>
        <Text
          style={{
            fontSize: 24,
            fontWeight: "bold",
            color: colors.foreground,
            marginBottom: 24,
          }}
        >
          設定
        </Text>

        {/* カテゴリ */}
        <View style={{ marginBottom: 24 }}>
          <Text style={{ fontSize: 14, color: colors.muted, marginBottom: 8 }}>
            カテゴリ
          </Text>
          <Pressable
            style={({ pressed }) => ({
              backgroundColor: colors.surface,
              borderRadius: 12,
              padding: 16,
              borderWidth: 1,
              borderColor: colors.border,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              opacity: pressed ? 0.7 : 1,
            })}
            onPress={() => handleNavigate("/settings/category-edit")}
          >
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: colors.primary,
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 12,
                }}
              >
                <MaterialIcons name="folder" size={20} color="#FFFFFF" />
              </View>
              <Text style={{ fontSize: 16, color: colors.foreground }}>
                カテゴリ編集
              </Text>
            </View>
            <MaterialIcons
              name="chevron-right"
              size={24}
              color={colors.muted}
            />
          </Pressable>
        </View>

        {/* デザイン */}
        <View>
          <Text style={{ fontSize: 14, color: colors.muted, marginBottom: 8 }}>
            デザイン
          </Text>
          <Pressable
            style={({ pressed }) => ({
              backgroundColor: colors.surface,
              borderRadius: 12,
              padding: 16,
              borderWidth: 1,
              borderColor: colors.border,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              opacity: pressed ? 0.7 : 1,
            })}
            onPress={() => handleNavigate("/settings/theme")}
          >
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: colors.primary,
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 12,
                }}
              >
                <MaterialIcons name="palette" size={20} color="#FFFFFF" />
              </View>
              <View>
                <Text style={{ fontSize: 16, color: colors.foreground }}>
                  テーマ選択
                </Text>
                <Text
                  style={{ fontSize: 13, color: colors.muted, marginTop: 2 }}
                >
                  {THEME_LABELS[themeMode] || themeMode}
                </Text>
              </View>
            </View>
            <MaterialIcons
              name="chevron-right"
              size={24}
              color={colors.muted}
            />
          </Pressable>
        </View>
      </View>
    </ScreenContainer>
  );
}
