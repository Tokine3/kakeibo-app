import { View, Text, Pressable, Platform } from "react-native";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/use-colors";
import { useThemeContext } from "@/lib/theme-provider";
import type { ThemeMode } from "@/lib/storage";

const THEME_OPTIONS: { value: ThemeMode; label: string; description?: string }[] = [
  { value: "system", label: "デバイスに合わせる", description: "端末の設定に従います" },
  { value: "light", label: "ライト", description: "明るい背景" },
  { value: "dark", label: "ダーク", description: "暗い背景" },
  { value: "pink", label: "ライトピンク", description: "淡いピンクの背景" },
  { value: "blue", label: "ライトブルー", description: "淡い水色の背景" },
];

export default function ThemeScreen() {
  const colors = useColors();
  const { themeMode, setThemeMode } = useThemeContext();

  const handleThemeChange = (mode: ThemeMode) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setThemeMode(mode);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, padding: 16 }}>
      <View style={{ gap: 8 }}>
        {THEME_OPTIONS.map((option) => (
          <Pressable
            key={option.value}
            style={({ pressed }) => ({
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              padding: 16,
              borderRadius: 12,
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: themeMode === option.value ? colors.primary : colors.border,
              opacity: pressed ? 0.7 : 1,
            })}
            onPress={() => handleThemeChange(option.value)}
          >
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "600",
                  color: themeMode === option.value ? colors.primary : colors.foreground,
                }}
              >
                {option.label}
              </Text>
              {option.description && (
                <Text
                  style={{
                    fontSize: 13,
                    color: colors.muted,
                    marginTop: 4,
                  }}
                >
                  {option.description}
                </Text>
              )}
            </View>
            {themeMode === option.value && (
              <View
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 12,
                  backgroundColor: colors.primary,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ color: "#FFFFFF", fontSize: 14, fontWeight: "bold" }}>
                  ✓
                </Text>
              </View>
            )}
          </Pressable>
        ))}
      </View>
    </View>
  );
}
