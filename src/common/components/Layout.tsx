import React from "react";

interface LayoutProps {
  children: React.ReactNode;
}

// 全体の背景色、最小高、パディングを設定
export const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8">
      <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
        CosmicWatch Recorder
      </h1>
      <div className="max-w-4xl mx-auto">{children}</div>
    </div>
  );
};
