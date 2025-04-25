import { useMemo, useState, useEffect, useRef } from "react";
import { CosmicWatchData } from "../../shared/types";
import { SectionTitle } from "./Layout";
import Plot from "react-plotly.js";

interface PlotlyADCHistogramProps {
  data: CosmicWatchData[];
  binCount?: number;
  startTime: Date | null; // 測定開始時間を追加
}

export const ADCHistogram = ({
  data,
  binCount = 25,
  startTime,
}: PlotlyADCHistogramProps) => {
  // 表示用データの状態
  const [displayData, setDisplayData] = useState<CosmicWatchData[]>([]);
  // 更新間隔（秒）
  const [updateInterval, setUpdateInterval] = useState<number>(5);
  // 最終更新時刻
  const lastUpdateRef = useRef<number>(Date.now());
  // 更新タイマー
  const timerRef = useRef<number | null>(null);
  // ズーム状態を保持
  const [zoomState, setZoomState] = useState<any>(null);

  // データが来たら一定間隔で更新する
  useEffect(() => {
    // タイマーをクリア
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    // 今すぐ更新するかチェック
    const now = Date.now();
    const timeSinceLastUpdate = now - lastUpdateRef.current;

    if (timeSinceLastUpdate >= updateInterval * 1000) {
      // 更新間隔を超えていれば即時更新
      setDisplayData([...data]);
      lastUpdateRef.current = now;
    } else {
      // 更新間隔に達していなければタイマーをセット
      const remainingTime = updateInterval * 1000 - timeSinceLastUpdate;
      timerRef.current = window.setTimeout(() => {
        setDisplayData([...data]);
        lastUpdateRef.current = Date.now();
      }, remainingTime);
    }

    // クリーンアップ
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [data, updateInterval]);

  // ADC値のヒストグラムデータを計算
  const histogramData = useMemo(() => {
    if (displayData.length === 0) return [];

    // データからADC値を抽出
    return displayData.map((item) => item.adc);
  }, [displayData]);

  // 統計情報を計算
  const stats = useMemo(() => {
    if (histogramData.length === 0) return null;

    const sum = histogramData.reduce((a, b) => a + b, 0);
    const mean = sum / histogramData.length;

    const squaredDiffs = histogramData.map((value) =>
      Math.pow(value - mean, 2)
    );
    const variance =
      squaredDiffs.reduce((a, b) => a + b, 0) / histogramData.length;
    const stdDev = Math.sqrt(variance);

    const sortedData = [...histogramData].sort((a, b) => a - b);
    const median =
      sortedData.length % 2 === 0
        ? (sortedData[sortedData.length / 2 - 1] +
            sortedData[sortedData.length / 2]) /
          2
        : sortedData[Math.floor(sortedData.length / 2)];

    // カウントレートを計算（件/秒）
    let countRate = 0;
    if (startTime) {
      const elapsedSeconds = (Date.now() - startTime.getTime()) / 1000;
      countRate =
        elapsedSeconds > 0 ? histogramData.length / elapsedSeconds : 0;
    }

    return {
      count: histogramData.length,
      mean: mean.toFixed(2),
      median: median.toFixed(2),
      stdDev: stdDev.toFixed(2),
      min: Math.min(...histogramData),
      max: Math.max(...histogramData),
      countRate: countRate.toFixed(4),
    };
  }, [histogramData, startTime]);

  // 更新間隔の変更ハンドラ
  const handleIntervalChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setUpdateInterval(Number(e.target.value));
  };

  // グラフのズーム状態が変更されたときのハンドラ
  const handleRelayout = (event: any) => {
    // xaxis.range または yaxis.range が含まれている場合はズーム状態を保存
    if (
      (event["xaxis.range[0]"] !== undefined &&
        event["xaxis.range[1]"] !== undefined) ||
      (event["yaxis.range[0]"] !== undefined &&
        event["yaxis.range[1]"] !== undefined)
    ) {
      setZoomState({
        "xaxis.range[0]": event["xaxis.range[0]"],
        "xaxis.range[1]": event["xaxis.range[1]"],
        "yaxis.range[0]": event["yaxis.range[0]"],
        "yaxis.range[1]": event["yaxis.range[1]"],
      });
    } else if (
      event.autosize ||
      event["xaxis.autorange"] ||
      event["yaxis.autorange"]
    ) {
      // リセットされた場合
      setZoomState(null);
    }
  };

  if (displayData.length === 0) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-md">
        <SectionTitle>データ解析</SectionTitle>
        <div className="p-6 text-gray-500 text-center flex items-center justify-center h-40">
          データが不足しています...
        </div>
      </div>
    );
  }

  // レイアウト設定を作成（ズーム状態を反映）
  const layoutConfig: any = {
    width: undefined,
    height: 400,
    autosize: true,
    margin: { t: 30, r: 30, l: 50, b: 60 },
    paper_bgcolor: "#fff",
    plot_bgcolor: "#f8fafc",
    xaxis: {
      title: {
        text: "ADC",
        font: {
          size: 14,
          color: "#555",
        },
      },
      gridcolor: "#e2e8f0",
      tickangle: -45,
      tickfont: { size: 12 },
    },
    yaxis: {
      title: {
        text: "Count",
        font: {
          size: 14,
          color: "#555",
        },
      },
      gridcolor: "#e2e8f0",
      tickfont: { size: 12 },
    },
    bargap: 0.02,
    shapes: [
      {
        type: "line",
        x0: stats ? stats.mean : 0,
        y0: 0,
        x1: stats ? stats.mean : 0,
        y1: 1,
        yref: "paper",
        line: {
          color: "rgba(255, 0, 0, 0.7)",
          width: 2,
          dash: "dash",
        },
      },
    ],
    annotations: [
      {
        x: stats ? stats.mean : 0,
        y: 1,
        yref: "paper",
        text: "平均値",
        showarrow: true,
        arrowhead: 2,
        ax: 40,
        ay: -20,
        font: {
          color: "rgba(255, 0, 0, 0.8)",
        },
      },
    ],
  };

  // ズーム状態があれば適用
  if (zoomState) {
    layoutConfig.xaxis.range = [
      zoomState["xaxis.range[0]"],
      zoomState["xaxis.range[1]"],
    ];
    layoutConfig.yaxis.range = [
      zoomState["yaxis.range[0]"],
      zoomState["yaxis.range[1]"],
    ];
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <SectionTitle>データ解析</SectionTitle>

      <div className="flex items-center space-x-2">
        <label htmlFor="updateInterval" className="text-sm text-gray-600">
          データ更新間隔:
        </label>
        <select
          id="updateInterval"
          value={updateInterval}
          onChange={handleIntervalChange}
          className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="1">1秒</option>
          <option value="10">10秒</option>
          <option value="60">1分</option>
          <option value="300">5分</option>
          <option value="600">10分</option>
        </select>
      </div>
      <span className="text-xs text-gray-500">
        (長時間計測する場合は更新間隔を長くしてください)
      </span>
      <div className="mt-2 text-xs text-gray-500">
        全{data.length}件のデータ（
        {displayData.length === data.length
          ? "全て表示中"
          : `${displayData.length}件表示中`}
        ）
      </div>
      {stats && (
        <div className="mb-4 grid grid-cols-3 md:grid-cols-5 gap-2 text-center text-sm">
          <div className="bg-red-50 p-2 rounded">
            <div className="font-semibold text-red-800">総シグナル数</div>
            <div>{stats.count}</div>
          </div>
          <div className="bg-yellow-50 p-2 rounded">
            <div className="font-semibold text-yellow-800">カウントレート</div>
            <div>{stats.countRate} 回/s</div>
          </div>
          <div className="bg-green-50 p-2 rounded">
            <div className="font-semibold text-green-800">平均</div>
            <div>{stats.mean}</div>
          </div>
          <div className="bg-blue-50 p-2 rounded">
            <div className="font-semibold text-blue-800">最小値</div>
            <div>{stats.min}</div>
          </div>
          <div className="bg-purple-50 p-2 rounded">
            <div className="font-semibold text-purple-800">最大値</div>
            <div>{stats.max}</div>
          </div>
        </div>
      )}

      <div className="mt-4">
        <Plot
          data={[
            {
              x: histogramData,
              type: "histogram",
              autobinx: false,
              xbins: {
                size:
                  (Math.max(...histogramData) - Math.min(...histogramData)) /
                  binCount,
                start: Math.min(...histogramData),
                end: Math.max(...histogramData),
              },
              marker: {
                color: "rgba(75, 192, 192, 0.6)",
                line: {
                  color: "rgba(75, 192, 192, 1)",
                  width: 1,
                },
              },
              hoverlabel: {
                bgcolor: "#FFF",
                font: { color: "#333" },
                bordercolor: "#999",
              },
              name: "ADC",
              opacity: 0.85,
            },
          ]}
          layout={layoutConfig}
          config={{
            responsive: true,
            displayModeBar: true,
            displaylogo: false,
            modeBarButtonsToRemove: ["lasso2d", "select2d"],
            toImageButtonOptions: {
              format: "png",
              filename: "adc_histogram",
              height: 500,
              width: 700,
              scale: 2,
            },
          }}
          style={{ width: "100%", height: "100%" }}
          onRelayout={handleRelayout}
        />
      </div>
    </div>
  );
};
