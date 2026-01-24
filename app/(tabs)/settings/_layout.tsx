import { Stack } from "expo-router";
import { useColors } from "@/hooks/use-colors";

export default function SettingsLayout() {
  const colors = useColors();

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.background,
        },
        headerTintColor: colors.primary,
        headerTitleStyle: {
          color: colors.foreground,
          fontWeight: "600",
        },
        headerTitleAlign: "center",
        headerBackVisible: true,
        headerBackTitle: "",
        contentStyle: {
          backgroundColor: colors.background,
        },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="category-edit"
        options={{
          title: "カテゴリ編集",
        }}
      />
      <Stack.Screen
        name="theme"
        options={{
          title: "テーマ選択",
        }}
      />
    </Stack>
  );
}
