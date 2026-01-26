import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  Platform,
  Alert,
  ActivityIndicator,
  Modal,
  ScrollView,
} from "react-native";
import * as Haptics from "expo-haptics";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useColors } from "@/hooks/use-colors";
import { exportData, importData, getDataSummary } from "@/lib/data-export";
import dayjs from "dayjs";

export default function DataManagementScreen() {
  const colors = useColors();
  const [loading, setLoading] = useState(false);
  const [helpModalVisible, setHelpModalVisible] = useState(false);
  const [summary, setSummary] = useState<{
    transactionCount: number;
    categoryCount: number;
    oldestTransaction?: string;
    newestTransaction?: string;
  } | null>(null);

  const loadSummary = useCallback(async () => {
    const data = await getDataSummary();
    setSummary(data);
  }, []);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  const showAlert = (title: string, message: string) => {
    if (Platform.OS === "web") {
      window.alert(`${title}: ${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  const handleExport = async () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    setLoading(true);
    try {
      const result = await exportData();
      if (!result.success) {
        showAlert("エラー", result.error || "エクスポートに失敗しました。");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    const doImport = async () => {
      setLoading(true);
      try {
        const result = await importData();
        if (result.success) {
          if (Platform.OS !== "web") {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }
          showAlert(
            "インポート完了",
            `${result.stats?.transactions || 0}件の取引と${result.stats?.categories || 0}件のカテゴリをインポートしました。`
          );
          loadSummary();
        } else if (result.error !== "キャンセルされました。") {
          showAlert("エラー", result.error || "インポートに失敗しました。");
        }
      } finally {
        setLoading(false);
      }
    };

    if (Platform.OS === "web") {
      if (window.confirm("既存のデータは上書きされます。続けますか?")) {
        await doImport();
      }
    } else {
      Alert.alert(
        "データのインポート",
        "既存のデータは上書きされます。続けますか?",
        [
          { text: "キャンセル", style: "cancel" },
          {
            text: "インポート",
            onPress: doImport,
          },
        ]
      );
    }
  };

  const handleOpenHelp = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setHelpModalVisible(true);
  };

  const formatDate = (dateStr: string | undefined): string => {
    if (!dateStr) return "-";
    return dayjs(dateStr).format("YYYY/MM/DD");
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, padding: 16 }}>
      {/* データ概要 */}
      <View
        style={{
          backgroundColor: colors.surface,
          borderRadius: 12,
          padding: 16,
          marginBottom: 24,
          borderWidth: 1,
          borderColor: colors.border,
        }}
      >
        <Text
          style={{
            fontSize: 14,
            color: colors.muted,
            marginBottom: 12,
          }}
        >
          現在のデータ
        </Text>
        <View style={{ gap: 8 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <Text style={{ color: colors.foreground }}>取引件数</Text>
            <Text style={{ color: colors.foreground, fontWeight: "600" }}>
              {summary?.transactionCount ?? "-"} 件
            </Text>
          </View>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <Text style={{ color: colors.foreground }}>カテゴリ数</Text>
            <Text style={{ color: colors.foreground, fontWeight: "600" }}>
              {summary?.categoryCount ?? "-"} 件
            </Text>
          </View>
          {summary?.oldestTransaction && (
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <Text style={{ color: colors.foreground }}>データ期間</Text>
              <Text style={{ color: colors.foreground, fontWeight: "600" }}>
                {formatDate(summary.oldestTransaction)} 〜 {formatDate(summary.newestTransaction)}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* エクスポート */}
      <Text
        style={{
          fontSize: 14,
          color: colors.muted,
          marginBottom: 8,
          paddingHorizontal: 4,
        }}
      >
        バックアップ
      </Text>
      <Pressable
        style={({ pressed }) => ({
          backgroundColor: colors.surface,
          borderRadius: 12,
          padding: 16,
          marginBottom: 12,
          borderWidth: 1,
          borderColor: colors.border,
          flexDirection: "row",
          alignItems: "center",
          opacity: pressed ? 0.7 : 1,
        })}
        onPress={handleExport}
        disabled={loading}
      >
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
          <MaterialIcons name="file-upload" size={20} color="#FFFFFF" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 16, color: colors.foreground, fontWeight: "600" }}>
            データをエクスポート
          </Text>
          <Text style={{ fontSize: 13, color: colors.muted, marginTop: 2 }}>
            JSONファイルとして保存・共有
          </Text>
        </View>
        {loading ? (
          <ActivityIndicator color={colors.primary} />
        ) : (
          <MaterialIcons name="chevron-right" size={24} color={colors.muted} />
        )}
      </Pressable>

      {/* インポート */}
      <Pressable
        style={({ pressed }) => ({
          backgroundColor: colors.surface,
          borderRadius: 12,
          padding: 16,
          marginBottom: 24,
          borderWidth: 1,
          borderColor: colors.border,
          flexDirection: "row",
          alignItems: "center",
          opacity: pressed ? 0.7 : 1,
        })}
        onPress={handleImport}
        disabled={loading}
      >
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: colors.success,
            alignItems: "center",
            justifyContent: "center",
            marginRight: 12,
          }}
        >
          <MaterialIcons name="file-download" size={20} color="#FFFFFF" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 16, color: colors.foreground, fontWeight: "600" }}>
            データをインポート
          </Text>
          <Text style={{ fontSize: 13, color: colors.muted, marginTop: 2 }}>
            バックアップファイルから復元
          </Text>
        </View>
        {loading ? (
          <ActivityIndicator color={colors.primary} />
        ) : (
          <MaterialIcons name="chevron-right" size={24} color={colors.muted} />
        )}
      </Pressable>

      {/* 注意事項 */}
      <Pressable
        style={({ pressed }) => ({
          backgroundColor: colors.surface,
          borderRadius: 12,
          padding: 16,
          borderWidth: 1,
          borderColor: colors.border,
          opacity: pressed ? 0.7 : 1,
        })}
        onPress={handleOpenHelp}
      >
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <MaterialIcons name="help-outline" size={20} color={colors.primary} />
            <Text
              style={{
                fontSize: 14,
                color: colors.primary,
                marginLeft: 8,
                fontWeight: "600",
              }}
            >
              バックアップの方法を見る
            </Text>
          </View>
          <MaterialIcons name="chevron-right" size={24} color={colors.muted} />
        </View>
      </Pressable>

      {/* ヘルプモーダル */}
      <Modal
        visible={helpModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setHelpModalVisible(false)}
      >
        <View style={{ flex: 1, backgroundColor: colors.background }}>
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
            <View style={{ minWidth: 80 }} />
            <Text
              style={{
                fontSize: 18,
                fontWeight: "bold",
                color: colors.foreground,
              }}
            >
              バックアップの方法
            </Text>
            <Pressable
              style={({ pressed }) => ({
                opacity: pressed ? 0.6 : 1,
                minWidth: 80,
                alignItems: "flex-end",
              })}
              onPress={() => setHelpModalVisible(false)}
            >
              <MaterialIcons name="close" size={24} color={colors.primary} />
            </Pressable>
          </View>

          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ padding: 16 }}
          >
            {/* エクスポートの手順 */}
            <View style={{ marginBottom: 32 }}>
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
                <View
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: colors.primary,
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 12,
                  }}
                >
                  <MaterialIcons name="file-upload" size={18} color="#FFFFFF" />
                </View>
                <Text style={{ fontSize: 18, fontWeight: "600", color: colors.foreground }}>
                  エクスポート（保存）
                </Text>
              </View>

              <View style={{ gap: 16 }}>
                <View style={{ flexDirection: "row" }}>
                  <Text style={{ fontSize: 16, fontWeight: "600", color: colors.primary, marginRight: 12 }}>1</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 15, color: colors.foreground, lineHeight: 22 }}>
                      「データをエクスポート」をタップします
                    </Text>
                  </View>
                </View>

                <View style={{ flexDirection: "row" }}>
                  <Text style={{ fontSize: 16, fontWeight: "600", color: colors.primary, marginRight: 12 }}>2</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 15, color: colors.foreground, lineHeight: 22 }}>
                      共有メニューが表示されます
                    </Text>
                  </View>
                </View>

                <View style={{ flexDirection: "row" }}>
                  <Text style={{ fontSize: 16, fontWeight: "600", color: colors.primary, marginRight: 12 }}>3</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 15, color: colors.foreground, fontWeight: "600", marginBottom: 8 }}>
                      保存先を選択します
                    </Text>

                    {/* iCloud Drive */}
                    <View
                      style={{
                        backgroundColor: colors.surface,
                        borderRadius: 8,
                        padding: 12,
                        marginBottom: 8,
                        borderWidth: 1,
                        borderColor: colors.border,
                      }}
                    >
                      <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground, marginBottom: 4 }}>
                        iCloud Drive（iPhone）
                      </Text>
                      <Text style={{ fontSize: 13, color: colors.muted, lineHeight: 20 }}>
                        共有メニューで「"ファイル"に保存」を選択{"\n"}
                        → iCloud Drive内のフォルダを選択{"\n"}
                        → 「保存」をタップ
                      </Text>
                    </View>

                    {/* Google Drive */}
                    <View
                      style={{
                        backgroundColor: colors.surface,
                        borderRadius: 8,
                        padding: 12,
                        borderWidth: 1,
                        borderColor: colors.border,
                      }}
                    >
                      <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground, marginBottom: 4 }}>
                        Google Drive（Android / iPhone）
                      </Text>
                      <Text style={{ fontSize: 13, color: colors.muted, lineHeight: 20 }}>
                        共有メニューで「ドライブ」を選択{"\n"}
                        （表示されない場合は「その他」から探す）{"\n"}
                        → 保存先フォルダを選択{"\n"}
                        → 「保存」をタップ
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>

            {/* インポートの手順 */}
            <View style={{ marginBottom: 32 }}>
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
                <View
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: colors.success,
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 12,
                  }}
                >
                  <MaterialIcons name="file-download" size={18} color="#FFFFFF" />
                </View>
                <Text style={{ fontSize: 18, fontWeight: "600", color: colors.foreground }}>
                  インポート（復元）
                </Text>
              </View>

              <View style={{ gap: 16 }}>
                <View style={{ flexDirection: "row" }}>
                  <Text style={{ fontSize: 16, fontWeight: "600", color: colors.success, marginRight: 12 }}>1</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 15, color: colors.foreground, lineHeight: 22 }}>
                      「データをインポート」をタップします
                    </Text>
                  </View>
                </View>

                <View style={{ flexDirection: "row" }}>
                  <Text style={{ fontSize: 16, fontWeight: "600", color: colors.success, marginRight: 12 }}>2</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 15, color: colors.foreground, fontWeight: "600", marginBottom: 8 }}>
                      ファイルの場所を選択します
                    </Text>

                    {/* iCloud Drive */}
                    <View
                      style={{
                        backgroundColor: colors.surface,
                        borderRadius: 8,
                        padding: 12,
                        marginBottom: 8,
                        borderWidth: 1,
                        borderColor: colors.border,
                      }}
                    >
                      <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground, marginBottom: 4 }}>
                        iCloud Drive（iPhone）
                      </Text>
                      <Text style={{ fontSize: 13, color: colors.muted, lineHeight: 20 }}>
                        ファイル選択画面で「iCloud Drive」を選択{"\n"}
                        → バックアップファイルを選択
                      </Text>
                    </View>

                    {/* Google Drive */}
                    <View
                      style={{
                        backgroundColor: colors.surface,
                        borderRadius: 8,
                        padding: 12,
                        borderWidth: 1,
                        borderColor: colors.border,
                      }}
                    >
                      <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground, marginBottom: 4 }}>
                        Google Drive（Android / iPhone）
                      </Text>
                      <Text style={{ fontSize: 13, color: colors.muted, lineHeight: 20 }}>
                        ファイル選択画面の「...」または設定から{"\n"}
                        「Google Drive」を有効にする{"\n"}
                        → Google Driveを選択{"\n"}
                        → バックアップファイルを選択
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={{ flexDirection: "row" }}>
                  <Text style={{ fontSize: 16, fontWeight: "600", color: colors.success, marginRight: 12 }}>3</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 15, color: colors.foreground, lineHeight: 22 }}>
                      確認画面で「インポート」をタップします
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* 注意事項 */}
            <View
              style={{
                backgroundColor: colors.surface,
                borderRadius: 12,
                padding: 16,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
                <MaterialIcons name="warning" size={18} color={colors.error} />
                <Text
                  style={{
                    fontSize: 14,
                    color: colors.error,
                    marginLeft: 6,
                    fontWeight: "600",
                  }}
                >
                  注意事項
                </Text>
              </View>
              <Text style={{ fontSize: 13, color: colors.muted, lineHeight: 20 }}>
                • インポートすると既存のデータは上書きされます{"\n"}
                • 定期的にバックアップを取ることをおすすめします{"\n"}
                • 端末の入れ替え時は、旧端末でエクスポート → 新端末でインポートしてください
              </Text>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}
