import React from "react";

interface LayoutProps {
  children: React.ReactNode;
}

// 共通のセクションタイトルコンポーネント
export const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <h2 className="text-xl font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">
    {children}
  </h2>
);

// 全体の背景色、最小高、パディングを設定
export const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-6">
      <div className="max-w-6xl mx-auto">
        <header className="mb-6">
          <h1 className="text-3xl font-bold">CosmicWatch Recorder</h1>
        </header>
        <main>{children}</main>
        <footer className="mt-12 pt-4 border-t border-gray-200 text-center text-gray-500 text-sm">
          <p>CosmicWatch Recorder &copy; {new Date().getFullYear()}</p>
        </footer>
      </div>
    </div>
  );
};
