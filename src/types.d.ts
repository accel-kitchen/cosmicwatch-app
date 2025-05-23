// TypeScript 型定義ファイル

// JSON ファイルをモジュールとしてインポートできるようにする
declare module "*.json" {
  const value: {
    name: string;
    version: string;
    repository: {
      type: string;
      url: string;
    };
    [key: string]: any;
  };
  export default value;
}
