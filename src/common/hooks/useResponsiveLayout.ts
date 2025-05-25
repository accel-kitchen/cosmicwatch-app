import { useState, useEffect, useCallback, useRef } from "react";

export type LayoutType = "full-sidebar" | "mobile";

export interface ResponsiveLayoutHook {
  layout: LayoutType;
  userPreference: "auto" | LayoutType;
  setUserPreference: (preference: "auto" | LayoutType) => void;
  isAuto: boolean;
}

export const useResponsiveLayout = (): ResponsiveLayoutHook => {
  const [userPreference, setUserPreference] = useState<"auto" | LayoutType>(
    "auto"
  );
  const [autoLayout, setAutoLayout] = useState<LayoutType>("mobile");
  const timeoutRef = useRef<number | undefined>(undefined);

  // 自動レイアウト判定
  const determineAutoLayout = useCallback((): LayoutType => {
    const { innerWidth: w, innerHeight: h } = window;
    const aspectRatio = w / h;
    const dpr = window.devicePixelRatio || 1;

    // 複数条件での安定判定
    const conditions = {
      minWidth: w >= 1024, // 最低限の幅
      mediumAspect: aspectRatio > 1.2, // 中程度横長（4:3以上）
      notTooNarrow: w > h * 0.9, // 極端に縦長でない
      physicalSize: w / dpr > 600, // 物理サイズ考慮
    };

    // フルサイドバー条件
    if (
      conditions.minWidth &&
      conditions.mediumAspect &&
      conditions.physicalSize
    ) {
      return "full-sidebar";
    }

    // その他はモバイルレイアウト
    return "mobile";
  }, []);

  // 遅延付きレイアウト更新
  useEffect(() => {
    const handleResize = () => {
      // 500ms の遅延で判定（連続的な変更を防ぐ）
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        const newLayout = determineAutoLayout();

        // さらに200ms後に安定性を確認
        setTimeout(() => {
          const confirmedLayout = determineAutoLayout();
          if (confirmedLayout === newLayout) {
            setAutoLayout(newLayout);
          }
        }, 200);
      }, 500) as unknown as number;
    };

    // 初回実行
    setAutoLayout(determineAutoLayout());

    // イベントリスナー登録
    window.addEventListener("resize", handleResize);
    window.addEventListener("orientationchange", handleResize);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", handleResize);
    };
  }, [determineAutoLayout]);

  // 実際に使用するレイアウト
  const effectiveLayout =
    userPreference === "auto" ? autoLayout : userPreference;

  return {
    layout: effectiveLayout,
    userPreference,
    setUserPreference,
    isAuto: userPreference === "auto",
  };
};
