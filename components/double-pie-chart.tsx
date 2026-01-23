import { View, Text } from "react-native";
import { PieChart } from "react-native-chart-kit";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useColors } from "@/hooks/use-colors";
import type { CategoryExpense } from "@/types";
import { formatAmount } from "@/lib/calculations";

interface DoublePieChartProps {
  expenseData: CategoryExpense[];
  incomeData: CategoryExpense[];
  width: number;
}

export function DoublePieChart({
  expenseData,
  incomeData,
  width,
}: DoublePieChartProps) {
  const colors = useColors();

  const expenseChartData = expenseData.slice(0, 6).map((ce) => ({
    name: `${ce.categoryName} ${formatAmount(ce.amount)} (${ce.percentage.toFixed(1)}%)`,
    amount: ce.amount,
    color: ce.categoryColor,
    legendFontColor: colors.foreground,
    legendFontSize: 12,
  }));

  const incomeChartData = incomeData.slice(0, 6).map((ce) => ({
    name: `${ce.categoryName} ${formatAmount(ce.amount)} (${ce.percentage.toFixed(1)}%)`,
    amount: ce.amount,
    color: ce.categoryColor,
    legendFontColor: colors.foreground,
    legendFontSize: 12,
  }));

  // 各円グラフのサイズ（親幅の半分）
  const chartWidth = width / 2;
  // 円グラフの高さ（大きめに設定）
  const pieHeight = 130;
  // PieChartの円の半径は約 height / 2.5
  const radius = pieHeight / 2.5;
  // 円を中央に配置するためのpadding
  const piePadding = Math.round(chartWidth / 2 - radius);

  const hasExpenseData = expenseChartData.length > 0;
  const hasIncomeData = incomeChartData.length > 0;

  if (!hasExpenseData && !hasIncomeData) {
    return null;
  }

  return (
    <View
      style={{
        flexDirection: "row",
      }}
    >
      {/* 収入の円グラフ */}
      <View style={{ width: chartWidth, alignItems: "center" }}>
        <Text
          style={{
            fontSize: 14,
            fontWeight: "600",
            color: colors.foreground,
            marginBottom: 8,
          }}
        >
          収入
        </Text>
        {hasIncomeData ? (
          <PieChart
            data={incomeChartData}
            width={chartWidth}
            height={pieHeight}
            chartConfig={{
              color: (opacity = 1) => colors.primary,
              labelColor: (opacity = 1) => colors.foreground,
            }}
            accessor="amount"
            backgroundColor="transparent"
            paddingLeft={`${piePadding}`}
            hasLegend={false}
          />
        ) : (
          <View
            style={{
              width: chartWidth,
              height: pieHeight,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <MaterialIcons name="pie-chart" size={52} color={colors.muted} />
            <Text style={{ color: colors.muted, marginTop: 4 }}>
              データがありません
            </Text>
          </View>
        )}
      </View>

      {/* 支出の円グラフ */}
      <View style={{ width: chartWidth, alignItems: "center" }}>
        <Text
          style={{
            fontSize: 14,
            fontWeight: "600",
            color: colors.foreground,
            marginBottom: 8,
          }}
        >
          支出
        </Text>
        {hasExpenseData ? (
          <PieChart
            data={expenseChartData}
            width={chartWidth}
            height={pieHeight}
            chartConfig={{
              color: (opacity = 1) => colors.primary,
              labelColor: (opacity = 1) => colors.foreground,
            }}
            accessor="amount"
            backgroundColor="transparent"
            paddingLeft={`${piePadding}`}
            hasLegend={false}
          />
        ) : (
          <View
            style={{
              width: chartWidth,
              height: pieHeight,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <MaterialIcons name="pie-chart" size={52} color={colors.muted} />
            <Text style={{ color: colors.muted, marginTop: 4 }}>
              データがありません
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}
