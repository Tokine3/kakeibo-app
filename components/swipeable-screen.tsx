import { useRef, useMemo } from "react";
import { View, PanResponder, Dimensions } from "react-native";
import { useRouter, usePathname } from "expo-router";

const SCREEN_WIDTH = Dimensions.get("window").width;
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.15;

const TAB_COUNT = 4;
const ROUTES = ["/", "/monthly", "/yearly", "/categories"];

interface SwipeableScreenProps {
  children: React.ReactNode;
}

export function SwipeableScreen({ children }: SwipeableScreenProps) {
  const router = useRouter();
  const pathname = usePathname();
  const currentIndexRef = useRef(0);
  const isNavigatingRef = useRef(false);

  // 現在のタブインデックスを取得
  const getCurrentIndex = (): number => {
    if (pathname === "/" || pathname === "/(tabs)") return 0;
    if (pathname === "/monthly" || pathname === "/(tabs)/monthly") return 1;
    if (pathname === "/yearly" || pathname === "/(tabs)/yearly") return 2;
    if (pathname === "/categories" || pathname === "/(tabs)/categories") return 3;
    return 0;
  };

  // 現在のインデックスを更新
  currentIndexRef.current = getCurrentIndex();

  const navigateToIndex = (index: number) => {
    if (index >= 0 && index < ROUTES.length && !isNavigatingRef.current) {
      isNavigatingRef.current = true;
      router.replace(ROUTES[index] as any);
      // ナビゲーション後にフラグをリセット
      setTimeout(() => {
        isNavigatingRef.current = false;
      }, 300);
    }
  };

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onMoveShouldSetPanResponder: (_, gestureState) => {
          const { dx, dy } = gestureState;
          // 水平方向のスワイプのみ検出（より厳密に）
          return Math.abs(dx) > Math.abs(dy) * 2 && Math.abs(dx) > 20;
        },
        onPanResponderRelease: (_, gestureState) => {
          const { dx, vx } = gestureState;
          const index = currentIndexRef.current;
          const canSwipeRight = index > 0;
          const canSwipeLeft = index < TAB_COUNT - 1;

          const shouldNavigate = Math.abs(dx) > SWIPE_THRESHOLD || Math.abs(vx) > 0.5;

          if (shouldNavigate) {
            if (dx > 0 && canSwipeRight) {
              // 右スワイプ → 前のページへ
              navigateToIndex(index - 1);
            } else if (dx < 0 && canSwipeLeft) {
              // 左スワイプ → 次のページへ
              navigateToIndex(index + 1);
            }
          }
        },
      }),
    []
  );

  return (
    <View style={{ flex: 1 }} {...panResponder.panHandlers}>
      {children}
    </View>
  );
}
