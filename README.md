![image](https://github.com/user-attachments/assets/8260676c-645c-4440-9eb1-778b0b0bce62)# CosmicWatch Recorder

> 宇宙線検出器CosmicWatchのデータ記録・解析アプリケーション

CosmicWatch Recorderは、放射線検出器**CosmicWatch**からのデータをリアルタイムで記録・可視化するアプリケーションです。ブラウザアプリとして利用でき、複雑なセットアップなしにCosmicWatchと接続してデータ測定を開始できます。

Windowsユーザーのみ、デスクトップアプリ版も利用可能です。

## 🚀 クイックスタート

### Webアプリ版
**最も簡単な方法です**

1. **ブラウザでアクセス**: [https://accel-kitchen.com/app/cosmicwatch-app/](https://accel-kitchen.com/app/cosmicwatch-app/)
2. **CosmicWatchを接続**: USBケーブルでPCに接続
3. **シリアルポートを選択**: アプリ内で接続ボタンをクリック
4. **測定開始**: データが自動的に表示されます

> ⚠️ **対応ブラウザ**: Google Chrome, Microsoft Edgeなど（Safariは非対応）\
> ⚠️ データはダウンロードボタンを押さないと保存されません

### デスクトップアプリ版（Windows）
**自動保存したい場合**

1. **ダウンロード**: [最新リリース](https://github.com/nagi-hobbies/cosmicwatch-app/releases/latest)からWindows版を入手
2. **インストール**: ダウンロードした`.exe`ファイルを実行
3. **起動**: CosmicWatch Recorderを起動

## ✨ 主な機能

### 📡 リアルタイムデータ取得
- USB経由でCosmicWatchと接続、データを受信
- 接続状態をリアルタイム表示

### 📊 データ可視化
- **ADCヒストグラム**: 放射線エネルギー分布をリアルタイム表示
- **データテーブル**: 最新100件の測定データを一覧表示
- **統計情報**: カウントレート、平均値、最大値などの自動計算

### 💾 データ保存
- **手動ダウンロード**: 測定データを`.dat`ファイルで保存
- **自動保存（デスクトップ版）**: 指定フォルダに自動上書き
- **コメント機能**: 測定条件等をコメントとしてファイルに記録可

## 📖 使用方法

### 1. CosmicWatchとの接続

1. **ハードウェア準備**
   - USBケーブルでPCに接続

2. **アプリでの接続**
   ```
   1. 「CosmicWatchと接続」セクションの「接続」ボタンをクリック
   2. 表示されるポップアップのシリアルポート一覧からCosmicWatchを選択
   3. 接続成功の表示を確認
   ```

3. **再接続機能**
   - 一度接続したデバイスは緑色の再接続ボタンで素早く再接続可能

### 2. データ測定と監視

- **データテーブル**: 最新のイベントデータを確認
- **ヒストグラム**: エネルギー分布の傾向を監視
- **統計情報**: 測定効率と品質を確認

### 3. データ保存設定

#### 手動保存
```
① 「ファイル設定」でコメントやファイル名を設定
② 「データをダウンロード」で.datファイルをダウンロード
```

#### 自動保存（デスクトップ版のみ）
```
1. 「自動保存設定」を有効化
2. 保存先フォルダを選択
3. 測定開始と同時に自動でファイル作成・追記保存
```

## 📋 対応データ形式

CosmicWatchは設定により異なるデータ形式を出力します：

| カラム数 | 形式 | 説明 |
|---------|------|------|
| 6列 | `event time adc sipm deadtime temp` | 基本形式 |
| 7列 | `event date totaltime adc sipm deadtime temp` | 日付付き |
| 9列 | `event date totaltime adc sipm deadtime temp hum press` | 環境センサー付き |

> 💡 アプリは全形式に自動対応し、PC時刻で統一されたタイムスタンプを付与します

## 🔧 トラブルシューティング

### 接続できない場合
1. **ブラウザ確認**: Chrome/Edgeを使用してみてください
2. **デバイス確認**: デバイスマネージャーでCosmicWatchが認識されているか確認
3. **ポート確認**: 他のアプリケーションがシリアルポートを使用していないか確認
4. **再起動**: ブラウザのリロード、CosmicWatchを再接続

### データが表示されない場合
1. **接続状態確認**: アプリの接続ステータスを確認
2. **ケーブル確認**: USBケーブルがデータ通信対応であることを確認

## 💡 Tips

- **複数デバイス**: ブラウザの複数タブで同時に複数のCosmicWatchを使用可能

---

## 📝 データファイル形式

保存される`.dat`ファイルの形式：

```
# CosmicWatchから送られてきたコメント
# アプリ上で設定したコメント
1	2024-01-01-12-00-01.123	1000	450	25.5	120	22.3
2	2024-01-01-12-00-02.234	2000	480	26.1	110	22.4
```

- タブ区切り形式（TSV）
- コメント行は`#`で開始
- PC時刻で統一されたタイムスタンプ
- パース失敗データも生データとして保存

## 🤝 サポート・フィードバック

- **不具合報告**: [GitHub Issues](https://github.com/nagi-hobbies/cosmicwatch-app/issues)
- **機能要望**: [GitHub Discussions](https://github.com/nagi-hobbies/cosmicwatch-app/discussions)
- **質問**: [GitHub Discussions Q&A](https://github.com/nagi-hobbies/cosmicwatch-app/discussions/categories/q-a)

## 📄 ライセンス

保留

---

## 開発者向け情報

### 🛠️ 技術スタック

**フロントエンド**
- React 19 + TypeScript
- Vite (ビルドツール)
- TailwindCSS (スタイリング)
- Plotly.js (データ可視化)
- @tanstack/react-table (テーブル)

**デスクトップ**
- Tauri 2.0 (Rust)
- Tauri Plugins: fs, dialog, updater

**Web API**
- Web Serial API (Chrome/Edge)
- File System Access API (実験的)

### 📁 プロジェクト構造

```
src/
├── common/              # プラットフォーム共通
│   ├── components/      # UIコンポーネント
│   ├── hooks/          # React Hooks
│   └── utils/          # ユーティリティ関数
├── shared/             # 型定義・定数
└── App.tsx            # メインアプリケーション
```

### 🏗️ 開発環境セットアップ

```bash
# 依存関係インストール
pnpm install

# Web版開発サーバー起動（ローカル用、base: '/'）
pnpm dev
pnpm dev:local           # 同上（明示的にローカル用）

# デスクトップ版開発
pnpm tauri:dev           # Tauri開発サーバー起動（ローカル用）
pnpm tauri:dev:local     # 同上（明示的にローカル用）
```

#### ビルドコマンド

**Web版**
```bash
# 本番用ビルド（base: '/app/cosmicwatch-app/' でデプロイ用）
pnpm build

# ローカル用ビルド（base: '/' でテスト用）
pnpm build:local

# プレビュー
pnpm preview             # 本番用プレビュー
pnpm preview:local       # ローカル用プレビュー
```

**デスクトップ版**

※自動アップデートのために署名が必要。詳細はNotionへ

```bash
# 本番用Tauriビルド（base: '/app/cosmicwatch-app/'）
pnpm tauri:build

# ローカル用Tauriビルド（base: '/' でテスト用）
pnpm tauri:build:local
```

> 💡 **baseパス自動切り替え**:
> - `development` mode: `base: '/'` (ローカル開発用)
> - `production` mode: `base: '/app/cosmicwatch-app/'` (本番デプロイ用)
>
> ※自動アップデートのために署名が必要、詳細はNotion

### 📊 データフロー

1. **データ受信**: Web Serial API → parseCosmicWatchData()
2. **データ処理**: 型安全なパース → CosmicWatchData型
3. **状態管理**: React State (raw + parsed)
4. **可視化**: Plotly.js + React Table
5. **保存**: File API / Tauri fs

### 🔌 API仕様

#### データパーサー
```typescript
parseCosmicWatchData(line: string): CosmicWatchData | null
```

#### シリアル通信
```typescript
interface SerialPortState {
  port: SerialPort | null;
  isConnected: boolean;
  error: string | null;
}
```

### 🚀 デプロイ

**Web版**
- Cloudflare Pages自動デプロイ
- プッシュ時に自動ビルド・デプロイ

#### 開発ガイドライン
- TypeScript strictモード遵守
- ESLint/Prettier設定に従う
- 機能追加時はREADMEも更新

### 🐛 既知の問題

- Safari非対応（Web Serial API非対応）
- macOS/Linux版デスクトップアプリ未対応
  - macOSもデスクトップアプリ化はできるが、Tauriが内部で使用するWebビューアがSafari系統のため、シリアル通信が不可。RustによるネイティブSerial通信を実装すれば可能と思われる。
- 大量データでのパフォーマンス劣化
