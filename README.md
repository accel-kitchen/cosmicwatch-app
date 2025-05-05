# CosmicWatch Recorder

CosmicWatch Recorderは、CosmicWatchからのデータ -> datファイルへの変換をメインの機能に、簡単なデータの表示や解析を行うアプリケーションです。PCにCosmicWatchを接続し、[URL](https://cosmicwatch-app.pages.dev/)にアクセスするだけで、データの記録が可能です。


Google Chrome や Microsoft Edge ブラウザの標準機能を利用することで、アプリやドライバのインストールの必要なく、CosmicWatchとシリアル通信が可能になりました。

---

## ユーザー向け情報

### ✨ 主な機能

*   **シリアル接続:** USB経由でCosmicWatch検出器に接続し、データをリアルタイムで受信します。
*   **データ表示:**
    *   解析済みの測定データ（最新100件）をテーブル形式で表示します。
    *   受信した生データをそのまま表示します。
*   **データ解析:**
    *   ADC値のヒストグラムをインタラクティブなグラフ（Plotly.js）で表示します。
    *   総シグナル数、カウントレート、平均値、最小値、最大値などの統計情報をリアルタイムで計算・表示します。
    *   グラフの更新間隔を調整可能です（データ量が多い場合に便利）。
    *   グラフのズーム状態を保持します。
*   **データ保存:**
    *   **手動保存:** 測定中の全データを `.dat` ファイルとしてダウンロードできます。
    *   **自動保存 (デスクトップ版):** 指定したフォルダに測定データを継続的に追記保存します。
    *   **自動保存 (Web版 - Chrome/Edge):** FileSystem Access API を使用し、ユーザーが許可したファイルにデータを継続的に追記保存します（実験的な機能）。
*   **ファイル設定:** 保存するファイルにコメントを追加したり、ファイル名の末尾にカスタムテキスト（サフィックス）を付加したりできます。
*   **レスポンシブデザイン:** デスクトップ、タブレット、モバイルなど、様々な画面サイズに対応します。
*   **自動アップデート (デスクトップ版):** 新しいバージョンがリリースされると通知し、簡単にアップデートできます。

### 🚀 はじめ方

#### Webアプリケーション

最新の Google Chrome または Microsoft Edge ブラウザで、以下のURLにアクセスします。（注: デプロイ先のURLを記載してください。例: `https://your-app-url.com`）

#### Windows デスクトップアプリケーション

1.  **ダウンロード:** 最新版を [GitHub Releases](https://github.com/nagi-hobbies/cosmicwatch-app/releases/latest) ページからダウンロードします。
    *   Windows: `.exe`インストーラー
    *   macOS, Linux: 非対応
2.  **インストール:** ダウンロードしたファイルを実行し、指示に従ってインストールします。
3.  **実行:** インストールされた CosmicWatch Recorder を起動します。


### 使い方ガイド

1.  **接続:** CosmicWatch検出器をUSBでPCに接続します。アプリケーションの「CosmicWatch接続」セクションで、正しいシリアルポートを選択し、「接続」ボタンをクリックします。
2.  **データ表示:** 接続が成功すると、データがリアルタイムで表示され始めます。「測定データ」テーブルと「生データ」エリアが更新されます。
3.  **データ解析:** 「データ解析」セクションのヒストグラムと統計情報がリアルタイムで更新されます。グラフはズームやパン操作が可能です。更新が重い場合は「グラフ更新間隔」を調整してください。
4.  **データ保存:**
    *   手動で保存する場合は、「ファイル設定」セクションでコメントやサフィックスを設定し、「データをダウンロード」ボタンをクリックします。
    *   デスクトップ版で自動保存を有効にする場合は、「自動保存設定」でフォルダを選択します。
    *   Web版で自動保存を開始するには、「自動保存を開始 (Chrome/Edge)」ボタンをクリックし、保存先のファイルを選択・許可します。

---

## 開発者向け情報

### 🛠️ 技術スタック

*   **フロントエンド:**
    *   [React](https://reactjs.org/) 19 (with Hooks)
    *   [TypeScript](https://www.typescriptlang.org/)
    *   [Vite](https://vitejs.dev/)
    *   [Tailwind CSS](https://tailwindcss.com/)
    *   [Plotly.js](https://plotly.com/javascript/) (グラフ描画)
*   **デスクトップ:**
    *   [Tauri](https://tauri.app/) (Rust)
    *   Tauri Plugins: `fs`, `dialog`, `updater`, `log`
*   **パッケージマネージャー:** [pnpm](https://pnpm.io/)

### 📁 プロジェクト構造 (概要)

```
cosmicwatch_app/
├── src/
│   ├── common/          # プラットフォーム共通のコード
│   │   ├── components/  # 共通コンポーネント
│   │   ├── hooks/       # 共通フック
│   │   └── utils/       # 共通ユーティリティ
│   ├── web/            # Web/PWA固有のコード
│   ├── desktop/        # デスクトップアプリ固有のコード
│   └── shared/         # 型定義や定数など
├── public/             # 静的ファイル
└── tauri/             # Tauri固有の設定
```

### シリアル通信

- Chrome/EdgeのWebSerial APIでシリアル通信を行う
- CosmicWatchからのシリアル通信の形式
  - 始めの数行は `#` で始まるコメント行、その後にデータ行が続く
  - データ行の形式は、`\t` 区切りで、1イベントのイベント番号、イベント時間、adc値、sipm値、温度などとなっている
    - 6カラム: `event`, `time`, `adc`, `sipm`, `deadtime`, `temp`
    - 7カラム: `event`, `date`, `totaltime`, `adc`, `sipm`, `deadtime`, `temp`
    - 9カラム: `event`, `date`, `totaltime`, `adc`, `sipm`, `deadtime`, `temp`, `hum`, `press`
  - `event` はイベント番号(整数)、`date` は日付(YYYY-MM-DD-HH-MM-SS.ms)、`totaltime` は総計時間(整数)、`adc` はadc値(整数)、`sipm` はsipm値(小数)、`deadtime` は処理にかかった時間の総計(整数)、`temp` は温度(小数)、`hum` は湿度(小数)、`press` は気圧(小数)

### データ保存

- `.dat`ファイルにはシリアル通信の内容をそのまま保存
- コメント行（`#`で始まる行）も含めて保存
- 区切り文字はタブ文字を使用
- 不正なデータ形式の行もそのまま保存