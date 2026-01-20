import { useState, useMemo } from "react";
import { View, Text, Pressable, Modal } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import dayjs from "dayjs";
import "dayjs/locale/ja";
import { useColors } from "@/hooks/use-colors";

dayjs.locale("ja");

interface CalendarPickerProps {
  value: string; // YYYY-MM-DD format
  onChange: (date: string) => void;
}

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];

export function CalendarPicker({ value, onChange }: CalendarPickerProps) {
  const colors = useColors();
  const [visible, setVisible] = useState(false);
  const [viewDate, setViewDate] = useState(() => dayjs(value || undefined));

  const selectedDate = useMemo(() => dayjs(value || undefined), [value]);

  const calendarDays = useMemo(() => {
    const firstDay = viewDate.startOf("month");
    const lastDay = viewDate.endOf("month");
    const startDayOfWeek = firstDay.day();
    const daysInMonth = lastDay.date();

    const days: Array<{ date: dayjs.Dayjs | null; isCurrentMonth: boolean }> = [];

    // 前月の日付を埋める
    for (let i = 0; i < startDayOfWeek; i++) {
      const date = firstDay.subtract(startDayOfWeek - i, "day");
      days.push({ date, isCurrentMonth: false });
    }

    // 今月の日付
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({ date: firstDay.date(i), isCurrentMonth: true });
    }

    // 次月の日付を埋める（6週分 = 42日になるまで）
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      const date = lastDay.add(i, "day");
      days.push({ date, isCurrentMonth: false });
    }

    return days;
  }, [viewDate]);

  const handlePrevMonth = () => {
    setViewDate(viewDate.subtract(1, "month"));
  };

  const handleNextMonth = () => {
    setViewDate(viewDate.add(1, "month"));
  };

  const handleSelectDate = (date: dayjs.Dayjs) => {
    onChange(date.format("YYYY-MM-DD"));
    setVisible(false);
  };

  const handleOpen = () => {
    setViewDate(selectedDate.isValid() ? selectedDate : dayjs());
    setVisible(true);
  };

  const isToday = (date: dayjs.Dayjs) => {
    return date.isSame(dayjs(), "day");
  };

  const isSelected = (date: dayjs.Dayjs) => {
    return date.isSame(selectedDate, "day");
  };

  return (
    <>
      <Pressable
        style={({ pressed }) => ({
          backgroundColor: colors.surface,
          borderRadius: 12,
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderWidth: 1,
          borderColor: colors.border,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          opacity: pressed ? 0.7 : 1,
        })}
        onPress={handleOpen}
      >
        <Text style={{ fontSize: 16, color: colors.foreground }}>
          {selectedDate.isValid() ? selectedDate.format("YYYY年M月D日（ddd）") : "日付を選択"}
        </Text>
        <MaterialIcons name="calendar-today" size={20} color={colors.muted} />
      </Pressable>

      <Modal
        visible={visible}
        animationType="fade"
        transparent
        onRequestClose={() => setVisible(false)}
      >
        <Pressable
          style={{
            flex: 1,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            justifyContent: "center",
            alignItems: "center",
            padding: 20,
          }}
          onPress={() => setVisible(false)}
        >
          <Pressable
            style={{
              backgroundColor: colors.background,
              borderRadius: 16,
              padding: 16,
              width: "100%",
              maxWidth: 360,
            }}
            onPress={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 16,
              }}
            >
              <Pressable
                style={({ pressed }) => ({
                  padding: 8,
                  opacity: pressed ? 0.6 : 1,
                })}
                onPress={handlePrevMonth}
              >
                <MaterialIcons name="chevron-left" size={28} color={colors.foreground} />
              </Pressable>

              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "bold",
                  color: colors.foreground,
                }}
              >
                {viewDate.format("YYYY年M月")}
              </Text>

              <Pressable
                style={({ pressed }) => ({
                  padding: 8,
                  opacity: pressed ? 0.6 : 1,
                })}
                onPress={handleNextMonth}
              >
                <MaterialIcons name="chevron-right" size={28} color={colors.foreground} />
              </Pressable>
            </View>

            {/* Weekday Headers */}
            <View style={{ flexDirection: "row", marginBottom: 8 }}>
              {WEEKDAYS.map((day, index) => (
                <View
                  key={day}
                  style={{
                    flex: 1,
                    alignItems: "center",
                    paddingVertical: 8,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: "600",
                      color: index === 0 ? colors.error : index === 6 ? colors.primary : colors.muted,
                    }}
                  >
                    {day}
                  </Text>
                </View>
              ))}
            </View>

            {/* Calendar Grid */}
            <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
              {calendarDays.map((item, index) => {
                if (!item.date) return null;

                const today = isToday(item.date);
                const selected = isSelected(item.date);
                const dayOfWeek = item.date.day();

                return (
                  <Pressable
                    key={index}
                    style={({ pressed }) => ({
                      width: "14.28%",
                      aspectRatio: 1,
                      alignItems: "center",
                      justifyContent: "center",
                      opacity: pressed ? 0.6 : 1,
                    })}
                    onPress={() => handleSelectDate(item.date!)}
                  >
                    <View
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 18,
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: selected
                          ? colors.primary
                          : today
                            ? colors.surface
                            : "transparent",
                        borderWidth: today && !selected ? 1 : 0,
                        borderColor: colors.primary,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 14,
                          fontWeight: selected || today ? "600" : "400",
                          color: selected
                            ? "#FFFFFF"
                            : !item.isCurrentMonth
                              ? colors.muted
                              : dayOfWeek === 0
                                ? colors.error
                                : dayOfWeek === 6
                                  ? colors.primary
                                  : colors.foreground,
                        }}
                      >
                        {item.date.date()}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>

            {/* Today Button */}
            <Pressable
              style={({ pressed }) => ({
                marginTop: 16,
                paddingVertical: 12,
                borderRadius: 8,
                backgroundColor: colors.surface,
                alignItems: "center",
                opacity: pressed ? 0.7 : 1,
              })}
              onPress={() => handleSelectDate(dayjs())}
            >
              <Text style={{ fontSize: 14, color: colors.primary, fontWeight: "600" }}>
                今日を選択
              </Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}
