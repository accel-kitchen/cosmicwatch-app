import { useState, useEffect, useRef } from "react";
import { CosmicWatchData } from "../../shared/types";
import { SectionTitle } from "./Layout";
import { ChartBarIcon, ClockIcon, CogIcon } from "@heroicons/react/24/outline";
import { ADCHistogram } from "./ADCHistogram";
import { TimeHistogram } from "./TimeHistogram";

interface DataHistogramsProps {
  data: CosmicWatchData[];
  startTime: Date | null;
}

export const DataHistograms = ({ data, startTime }: DataHistogramsProps) => {
  const [samples, setSamples] = useState<CosmicWatchData[]>([]);
  const lastRef = useRef<number>(Date.now());
  const timerRef = useRef<number | null>(null);
  const [updateInterval, setUpdateInterval] = useState<number>(10); // 秒単位

  // ヒストグラム設定の状態
  const [adcBinSize, setAdcBinSize] = useState(20);
  const [timeBinSize, setTimeBinSize] = useState(20); // ms単位

  // 更新周期は選択可能
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);

    // 常時更新モード（updateInterval = 0）の場合は即座に更新
    if (updateInterval === 0) {
      setSamples(data);
      lastRef.current = Date.now();
      return;
    }

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

  if (!samples.length) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-md">
        <SectionTitle>
          <div className="flex items-center">
            <ChartBarIcon className="h-6 w-6 mr-2 text-gray-600" />
            データ解析
          </div>
        </SectionTitle>
        <div className="p-8 text-gray-500 text-center h-40 flex flex-col items-center justify-center space-y-2">
          <ChartBarIcon className="h-12 w-12 text-gray-300" />
          <p className="text-lg">データ受信待ち...</p>
          <p className="text-sm">
            CosmicWatchからデータを受信すると、ここにヒストグラムが表示されます
          </p>
        </div>
      </div>
    );
  }

  const formatElapsedTime = () => {
    if (!startTime) return "---";
    const elapsed = (Date.now() - startTime.getTime()) / 1000;

    const months = Math.floor(elapsed / (30 * 24 * 3600));
    const days = Math.floor((elapsed % (30 * 24 * 3600)) / (24 * 3600));
    const hours = Math.floor((elapsed % (24 * 3600)) / 3600);
    const minutes = Math.floor((elapsed % 3600) / 60);
    const seconds = Math.floor(elapsed % 60);

    const parts = [];
    if (months > 0) parts.push(`${months}か月`);
    if (days > 0) parts.push(`${days}日`);
    if (hours > 0) parts.push(`${hours}時間`);
    if (minutes > 0) parts.push(`${minutes}分`);
    if (seconds > 0 || parts.length === 0) parts.push(`${seconds}秒`);

    return parts.join("");
  };

  return (
    <div className="flex-1 overflow-hidden">
      {/* ヘッダーセクション */}
      <div className="p-4 pb-2">
        <SectionTitle>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <ChartBarIcon className="h-6 w-6 mr-2 text-gray-600" />
              データ解析
            </div>
            <div className="flex items-center space-x-8">
              {/* 測定時間 */}
              <div className="flex items-center space-x-3">
                <ClockIcon className="h-5 w-5 text-gray-500" />
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-500">測定時間:</span>
                  <span className="text-2xl font-bold text-gray-800">
                    {formatElapsedTime()}
                  </span>
                </div>
              </div>

              {/* 更新間隔設定 */}
              <div className="flex items-center space-x-3">
                <CogIcon className="h-5 w-5 text-gray-500" />
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-500">更新間隔:</span>
                  <select
                    id="updateInterval"
                    value={updateInterval}
                    onChange={(e) => setUpdateInterval(Number(e.target.value))}
                    className="px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value={0}>常時</option>
                    <option value={10}>10秒</option>
                    <option value={60}>1分</option>
                    <option value={600}>10分</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </SectionTitle>
      </div>

      {/* ヒストグラム表示エリア - レスポンシブグリッド */}
      <div className="p-4">
        <div className="grid grid-cols-1 2xl:grid-cols-2 gap-6 divide-y-2 2xl:divide-y-0 2xl:divide-x-2 divide-gray-200">
          {/* ADC ヒストグラム */}
          <div className="min-w-0 pb-6 2xl:pb-0 2xl:pr-6">
            <ADCHistogram
              data={samples}
              binSize={adcBinSize}
              setBinSize={setAdcBinSize}
              startTime={startTime}
            />
          </div>

          {/* 時刻ヒストグラム */}
          <div className="min-w-0 pt-6 2xl:pt-0 2xl:pl-6">
            <TimeHistogram
              data={samples}
              binSize={timeBinSize}
              setBinSize={setTimeBinSize}
              startTime={startTime}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
