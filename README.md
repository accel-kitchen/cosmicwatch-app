# CosmicWatch Recorder

## 概要

CosmicWatch(小型放射線検出器)からのシリアル通信を.datファイルに変換するアプリ

## 機能

- シリアル通信を受信し.datファイルとしてダウンロードできるようにする
- リアルタイムにヒストグラムやカウントレートを表示
- Web(Windows, Mac, Chromebook)版に加え、PWA版や、Windowsデスクトップ版を用意
- 複数のCosmicWatchからのデータを同時に記録可能
- 2台測定モード（Master/Slave）に対応

## 開発環境

- vite+react+tailwindcss + Tauri によるクロスプラットフォームアプリ
- tailwindcss prettierの補完

## 詳細仕様

### 技術スタック

- vite+react+tailwindcss + Tauri によるクロスプラットフォームアプリ
  - Webアプリをメインとし、PWA版を用意、TauriによるWindowsデスクトップ版
  - WebアプリやPWAは Windows, Mac, Chromebook に対応
- Tauri による Windowsデスクトップ版はネイティブファイルI/Oを用いて、リアルタイムのデータ保存
- Windows デスクトップ版では、TauriのGithub Releasesを用いてアップデートチェックにも対応

### ディレクトリ構成

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

### UI/UX

- 共通機能
  - ファイル名は`測定開始時間_{ユーザー指定の詳細}`.datとし、ユーザー指定の詳細のインプットボックスを設ける
  - ダウンロードボタンで現時点でのデータを.datファイルとしてダウンロード
  - データをテーブル形式で表示し、随時更新
  - ヒストグラムとカウントレート（1秒あたり）の表示
    - ヒストグラムの範囲：adc値 0-1023
    - 表示更新間隔はユーザーが設定可能
  - 複数のCosmicWatch対応
    - ポート番号でデバイスを識別
    - 2台測定モード（Master/Slave）対応
      - Master機を0.1秒先にシリアル通信を開始

- Windows デスクトップ版
  - ファイルの保存先を測定開始前にセットすることが可能
  - データ保存はネイティブファイルI/Oを用いてリアルタイムに行う

### エラー処理

- シリアル通信が切断された場合
  - 記録を停止
  - 既存のデータは保持
- 不正なデータ形式の場合
  - `.dat`ファイルにはそのまま書き込み
  - UI上はその行をスキップして表示
