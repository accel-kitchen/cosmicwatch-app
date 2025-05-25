import { useMemo, useState } from "react";
import { CosmicWatchData } from "../../shared/types";
import { SectionTitle } from "./Layout";
import Plot from "react-plotly.js";
import { SignalIcon } from "@heroicons/react/24/outline";

interface ADCHistogramProps {
  data: CosmicWatchData[];
  binSize: number;
  setBinSize: (size: number) => void;
  startTime: Date | null;
  graphLayout?: "vertical" | "horizontal";
}

export const ADCHistogram = ({
  data,
  binSize,
  setBinSize,
  startTime,
  graphLayout = "vertical",
}: ADCHistogramProps) => {
  // ズーム状態を保持
  const [zoomState, setZoomState] = useState<any>(null);

  const adcVals = useMemo(() => data.map((d) => d.adc), [data]);

  // 統計情報を計算
  const stats = useMemo(() => {
    if (adcVals.length === 0) return null;

    const sum = adcVals.reduce((a, b) => a + b, 0);
    const mean = sum / adcVals.length;

    const squaredDiffs = adcVals.map((value) => Math.pow(value - mean, 2));
    const variance = squaredDiffs.reduce((a, b) => a + b, 0) / adcVals.length;
    const stdDev = Math.sqrt(variance);

    const sortedData = [...adcVals].sort((a, b) => a - b);
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
      countRate = elapsedSeconds > 0 ? adcVals.length / elapsedSeconds : 0;
    }

    return {
      count: adcVals.length,
      mean: mean.toFixed(2),
      median: median.toFixed(2),
      stdDev: stdDev.toFixed(2),
      min: Math.min(...adcVals),
      max: Math.max(...adcVals),
      countRate: countRate.toFixed(4),
    };
  }, [adcVals, startTime]);

  // グラフのズーム状態が変更されたときのハンドラ
  const handleRelayout = (event: any) => {
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
      setZoomState(null);
    }
  };

  // レイアウト設定を作成（ズーム状態を反映）
  const layoutConfig: any = {
    width: undefined,
    height: 380,
    autosize: true,
    margin: { t: 40, r: 30, l: 50, b: 60 },
    paper_bgcolor: "#fff",
    plot_bgcolor: "#f8fafc",
    title: {
      text: "",
      font: { size: 16, color: "#374151" },
    },
    xaxis: {
      title: {
        text: "ADC",
        font: { size: 14, color: "#555" },
      },
      gridcolor: "#e2e8f0",
      tickangle: -45,
      tickfont: { size: 12 },
    },
    yaxis: {
      title: {
        text: "Count",
        font: { size: 14, color: "#555" },
      },
      gridcolor: "#e2e8f0",
      tickfont: { size: 12 },
    },
    bargap: 0.02,
  };

  // 統計情報がある場合は平均値の線とアノテーションを追加
  if (stats) {
    layoutConfig.shapes = [
      {
        type: "line",
        x0: stats.mean,
        y0: 0,
        x1: stats.mean,
        y1: 1,
        yref: "paper",
        line: {
          color: "rgba(75, 192, 192, 0.8)",
          width: 2,
          dash: "dash",
        },
      },
    ];

    layoutConfig.annotations = [
      {
        x: stats.mean,
        y: 1,
        yref: "paper",
        text: "平均値",
        showarrow: true,
        arrowhead: 2,
        ax: 40,
        ay: -20,
        font: { color: "rgba(75, 192, 192, 0.9)" },
      },
    ];
  }

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

  if (data.length === 0) {
    return (
      <div className="bg-gray-50 p-4 rounded-lg border-2 border-dashed border-gray-300">
        <p className="text-gray-500 text-center">ADCデータ受信待ち...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <SectionTitle>
        <div className="flex items-center">
          <SignalIcon className="h-6 w-6 mr-2 text-gray-600" />
          ADC(エネルギー)ヒストグラム
        </div>
      </SectionTitle>

      {/* 統計情報 */}
      {stats && (
        <div
          className={`grid gap-2 text-sm ${
            graphLayout === "horizontal"
              ? "grid-cols-1 md:grid-cols-2 xl:grid-cols-3"
              : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
          }`}
        >
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-200 flex flex-col items-center justify-center text-center">
            <div className="font-semibold text-blue-800 text-xs">
              総イベント数
            </div>
            <div className="text-lg font-bold text-blue-900">{stats.count}</div>
          </div>
          <div className="bg-green-50 p-3 rounded-lg border border-green-200 flex flex-col items-center justify-center text-center">
            <div className="font-semibold text-green-800 text-xs">レート</div>
            <div className="text-sm font-bold text-green-900">
              {stats.countRate} /s
            </div>
          </div>
          <div className="bg-purple-50 p-3 rounded-lg border border-purple-200 flex flex-col items-center justify-center text-center">
            <div className="font-semibold text-purple-800 text-xs">平均値</div>
            <div className="text-sm font-bold text-purple-900">
              {stats.mean}
            </div>
          </div>
        </div>
      )}

      {/* ヒストグラム */}
      <div className="bg-white p-4 rounded-lg">
        <Plot
          revision={data.length}
          data={[
            {
              x: adcVals,
              type: "histogram",
              autobinx: false,
              xbins: { start: 0, end: 1023, size: binSize },
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

      {/* ADCビン幅設定 */}
      <div className="bg-teal-50 p-4 rounded-lg border border-teal-200">
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-teal-800">
              ADC ビン幅:
            </label>
            <input
              id="adcBinInput"
              type="number"
              min="1"
              max="100"
              value={binSize}
              onChange={(e) => {
                const value = Number(e.target.value);
                if (value >= 1 && value <= 100) {
                  setBinSize(value);
                }
              }}
              className="w-20 px-2 py-1 text-sm border border-teal-300 rounded focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            />
          </div>
          <div className="space-y-2">
            <input
              type="range"
              min="1"
              max="100"
              step="1"
              value={binSize}
              onChange={(e) => setBinSize(Number(e.target.value))}
              className="w-full h-3 bg-teal-200 rounded-lg appearance-none cursor-pointer slider-thumb:bg-teal-600"
            />
            <div className="flex justify-between text-xs text-teal-600">
              <span>1</span>
              <span>100</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
