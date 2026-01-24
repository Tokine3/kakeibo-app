import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Appearance, View, useColorScheme as useSystemColorScheme } from "react-native";
import { colorScheme as nativewindColorScheme, vars } from "nativewind";

import { SchemeColors, type ColorScheme } from "@/constants/theme";
import { getThemeMode, saveThemeMode, type ThemeMode } from "@/lib/storage";

type ThemeContextValue = {
  colorScheme: ColorScheme;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useSystemColorScheme() ?? "light";
  const [themeMode, setThemeModeState] = useState<ThemeMode>("system");
  const [isLoaded, setIsLoaded] = useState(false);

  // 実際に表示するカラースキームを計算
  const colorScheme: ColorScheme = themeMode === "system" ? systemScheme : themeMode;

  const applyScheme = useCallback((scheme: ColorScheme, isSystemMode: boolean) => {
    // nativewindとAppearanceはlight/darkのみサポート
    const baseScheme = scheme === "dark" ? "dark" : "light";
    nativewindColorScheme.set(baseScheme);
    // systemモードの場合はAppearance.setColorSchemeを呼ばない（システム設定を尊重）
    if (!isSystemMode) {
      Appearance.setColorScheme?.(baseScheme);
    } else {
      // systemモードの場合はnullに戻してシステム設定に従う
      Appearance.setColorScheme?.(null);
    }
    if (typeof document !== "undefined") {
      const root = document.documentElement;
      root.dataset.theme = scheme;
      root.classList.toggle("dark", scheme === "dark");
      const palette = SchemeColors[scheme];
      Object.entries(palette).forEach(([token, value]) => {
        root.style.setProperty(`--color-${token}`, value);
      });
    }
  }, []);

  const setThemeMode = useCallback(async (mode: ThemeMode) => {
    setThemeModeState(mode);
    await saveThemeMode(mode);
  }, []);

  // 初回読み込み時にストレージから設定を取得
  useEffect(() => {
    getThemeMode().then((mode) => {
      setThemeModeState(mode);
      setIsLoaded(true);
    });
  }, []);

  // colorSchemeが変更されたら適用
  useEffect(() => {
    applyScheme(colorScheme, themeMode === "system");
  }, [applyScheme, colorScheme, themeMode]);

  const themeVariables = useMemo(
    () =>
      vars({
        "color-primary": SchemeColors[colorScheme].primary,
        "color-background": SchemeColors[colorScheme].background,
        "color-surface": SchemeColors[colorScheme].surface,
        "color-foreground": SchemeColors[colorScheme].foreground,
        "color-muted": SchemeColors[colorScheme].muted,
        "color-border": SchemeColors[colorScheme].border,
        "color-success": SchemeColors[colorScheme].success,
        "color-warning": SchemeColors[colorScheme].warning,
        "color-error": SchemeColors[colorScheme].error,
      }),
    [colorScheme],
  );

  const value = useMemo(
    () => ({
      colorScheme,
      themeMode,
      setThemeMode,
    }),
    [colorScheme, themeMode, setThemeMode],
  );

  return (
    <ThemeContext.Provider value={value}>
      <View style={[{ flex: 1 }, themeVariables]}>{children}</View>
    </ThemeContext.Provider>
  );
}

export function useThemeContext(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useThemeContext must be used within ThemeProvider");
  }
  return ctx;
}
