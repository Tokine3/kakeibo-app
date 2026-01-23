import { View, Text, Pressable, Platform } from "react-native";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/use-colors";

export type ViewMode = "expense" | "income" | "all";

interface SegmentControlProps {
  value: ViewMode;
  onChange: (value: ViewMode) => void;
}

const segments: { value: ViewMode; label: string }[] = [
  { value: "all", label: "全体" },
  { value: "income", label: "収入" },
  { value: "expense", label: "支出" },
];

export function SegmentControl({ value, onChange }: SegmentControlProps) {
  const colors = useColors();

  const handlePress = (newValue: ViewMode) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onChange(newValue);
  };

  return (
    <View
      style={{
        flexDirection: "row",
        backgroundColor: colors.surface,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: colors.border,
        overflow: "hidden",
      }}
    >
      {segments.map((segment, index) => {
        const isSelected = value === segment.value;
        return (
          <Pressable
            key={segment.value}
            onPress={() => handlePress(segment.value)}
            style={({ pressed }) => ({
              flex: 1,
              paddingVertical: 8,
              paddingHorizontal: 12,
              backgroundColor: isSelected ? colors.primary : "transparent",
              opacity: pressed ? 0.7 : 1,
              borderRightWidth: index < segments.length - 1 ? 1 : 0,
              borderRightColor: colors.border,
            })}
          >
            <Text
              style={{
                textAlign: "center",
                fontSize: 14,
                fontWeight: isSelected ? "600" : "400",
                color: isSelected ? "#FFFFFF" : colors.foreground,
              }}
            >
              {segment.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
