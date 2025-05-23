import React from "react";
import packageInfo from "../../../package.json";

// 共通のセクションタイトルを別ファイルに移動する準備として、まずは内部で改善
export const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <h2 className="text-xl font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">
    {children}
  </h2>
);

// セクションヘッダーコンポーネント（サブ見出し用）
export const SectionHeader = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <h3 className={`font-medium text-gray-700 mb-3 ${className}`}>{children}</h3>
);

// 全体の背景色、最小高、パディングを設定
export const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-6">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-center">
            CosmicWatch Recorder
          </h1>
        </header>
        <main>{children}</main>
        <footer className="mt-12 pt-4 border-t border-gray-200 text-center text-gray-500 text-sm">
          <div className="space-y-1">
            <p>CosmicWatch Recorder &copy; {new Date().getFullYear()}</p>
            <p>Version {packageInfo.version}</p>
          </div>
        </footer>
      </div>
    </div>
  );
};
