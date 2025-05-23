import { useMemo, useState, useEffect, useRef } from "react";
import { CosmicWatchData } from "../../shared/types";
import { SectionTitle } from "./Layout";
import Plot from "react-plotly.js";
import { ChartBarIcon } from "@heroicons/react/24/outline";

interface PlotlyADCHistogramProps {
  data: CosmicWatchData[];
}

export const ADCHistogram = ({
  data,
}: PlotlyADCHistogramProps) => {
  const [samples, setSamples] = useState<CosmicWatchData[]>([]);
  const lastRef = useRef<number>(Date.now());
  const timerRef = useRef<number | null>(null);
  const [updateInterval, setUpdateInterval] = useState<number>(10); // 秒単位

  // 更新周期は選択可能
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    const now = Date.now();
    const intervalMs = updateInterval * 1000;
    if (now - lastRef.current >= intervalMs) {
      setSamples(data);
      lastRef.current = now;
    }
    timerRef.current = window.setTimeout(() => {
      setSamples(data);
      lastRef.current = Date.now();
    }, intervalMs);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [data, updateInterval]);

  const adcVals = useMemo(() => samples.map((d) => d.adc), [samples]);
  // 秒単位に変換
  const timeVals = useMemo(
    () => samples.map((d) => (d.time ?? d.totaltime ?? 0) / 1000),
    [samples]
  );

  const [adcBinSize, setAdcBinSize] = useState(1023 / 25);
  const [timeBinSize, setTimeBinSize] = useState(1); // 秒単位

  const layoutCommon = {
    autosize: true,
    paper_bgcolor: "#fff",
    plot_bgcolor: "#f8fafc",
    margin: { t: 30, r: 20, l: 50, b: 50 },
  } as any;

  if (!samples.length) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-md">
        <SectionTitle>
          <div className="flex items-center">
            <ChartBarIcon className="h-6 w-6 mr-2 text-gray-600" />
            データ解析
          </div>
        </SectionTitle>
        <div className="p-6 text-gray-500 text-center h-40 flex items-center justify-center">
          データ受信待ち...
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 bg-white rounded-lg shadow-md space-y-6">
      <SectionTitle>
        <div className="flex items-center">
          <ChartBarIcon className="h-6 w-6 mr-2 text-gray-600" />
          ヒストグラム設定
        </div>
      </SectionTitle>
      <div className="space-y-4">
      <div className="flex items-center space-x-2 bg-white border border-gray-200 rounded px-3 py-2">
        <label htmlFor="updateInterval" className="mr-2 text-sm text-gray-700">
          更新間隔
        </label>
        <select
          id="updateInterval"
          value={updateInterval}
          onChange={(e) => setUpdateInterval(Number(e.target.value))}
          className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
        >
            {[1, 10, 60, 300, 600].map((v) => (
              <option key={v} value={v}>
                {v === 1 ? "1秒" : v === 60 ? "1分" : `${v}秒`}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm">ADC ビン幅: {adcBinSize.toFixed(0)}</label>
          <input
            type="range"
            min="1"
            max="200"
            step="1"
            value={adcBinSize}
            onChange={(e) => setAdcBinSize(Number(e.target.value))}
            className="w-full"
          />
        </div>
        <div>
          <label className="text-sm">時間ビン幅 (秒): {timeBinSize}</label>
          <input
            type="range"
            min="1"
            max="600"
            step="1"
            value={timeBinSize}
            onChange={(e) => setTimeBinSize(Number(e.target.value))}
            className="w-full"
          />
        </div>
      </div>

      {/* ADC ヒストグラム */}
      <div>
        <Plot
          revision={samples.length}
          data={[
            {
              x: adcVals,
              type: "histogram",
              autobinx: false,
              xbins: { start: 0, end: 1023, size: adcBinSize },
              marker: { color: "rgba(75,192,192,0.6)", line: { width: 1 } },
            },
          ]}
          layout={{
            ...layoutCommon,
            xaxis: { title: "ADC", gridcolor: "#e2e8f0" },
            yaxis: { title: "Count", gridcolor: "#e2e8f0" },
            title: { text: "ADC ヒストグラム" },
          }}
          config={{ responsive: true, displaylogo: false }}
          style={{ width: "100%", height: 300 }}
        />
      </div>

      {/* 時刻ヒストグラム */}
      <div>
          <Plot
            revision={samples.length}
            data={[
              {
                x: timeVals,
                type: "histogram",
                autobinx: false,
              xbins: { start: 0, end: Math.max(...timeVals), size: timeBinSize },
                marker: { color: "rgba(153,102,255,0.6)", line: { width: 1 } },
              },
            ]}
            layout={{
              ...layoutCommon,
              xaxis: { title: "Time (s)", gridcolor: "#e2e8f0" },
            yaxis: { title: "Count", gridcolor: "#e2e8f0" },
            title: { text: "時刻ヒストグラム" },
          }}
          config={{ responsive: true, displaylogo: false }}
          style={{ width: "100%", height: 300 }}
        />
      </div>
    </div>
  );
};
