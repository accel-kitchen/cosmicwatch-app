import { useMemo, memo } from "react";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  ColumnDef,
} from "@tanstack/react-table";
import { CosmicWatchData } from "../../shared/types";

// Redux関連のimport
import { useAppSelector } from "../../store/hooks";
import { selectDataTableData } from "../../store/selectors";

/**
 * セルの値をフォーマットする関数
 */
const formatCellValue = (value: unknown, precision = 0): string => {
  if (value === null || value === undefined) return "-";

  if (typeof value === "number") {
    return precision > 0 ? value.toFixed(precision) : value.toString();
  }

  return String(value);
};

/**
 * データテーブルの列定義を生成する
 */
const useColumnsDefinition = (sampleData?: CosmicWatchData) => {
  return useMemo(() => {
    const columns: ColumnDef<CosmicWatchData>[] = [
      {
        accessorKey: "event",
        header: "Event",
        cell: (info) => formatCellValue(info.getValue()),
      },
    ];

    // 日付/時間関連の列
    if (sampleData?.date) {
      columns.push({
        accessorKey: "date",
        header: "Date",
        cell: (info) => formatCellValue(info.getValue()),
      });
    }

    if (sampleData?.time !== undefined) {
      columns.push({
        accessorKey: "time",
        header: "Time (ms)",
        cell: (info) => formatCellValue(info.getValue()),
      });
    }

    // 共通の測定データ列
    columns.push(
      {
        accessorKey: "adc",
        header: "ADC",
        cell: (info) => formatCellValue(info.getValue()),
      },
      {
        accessorKey: "sipm",
        header: "SiPM (mV)",
        cell: (info) => formatCellValue(info.getValue(), 2),
      },
      {
        accessorKey: "deadtime",
        header: "Deadtime (ms)",
        cell: (info) => formatCellValue(info.getValue()),
      },
      {
        accessorKey: "temp",
        header: "Temperature (°C)",
        cell: (info) => formatCellValue(info.getValue(), 1),
      }
    );

    // 追加センサーデータがある場合
    if (sampleData?.hum !== undefined) {
      columns.push({
        accessorKey: "hum",
        header: "Humidity (%)",
        cell: (info) => formatCellValue(info.getValue(), 1),
      });
    }

    if (sampleData?.press !== undefined) {
      columns.push({
        accessorKey: "press",
        header: "Pressure (hPa)",
        cell: (info) => formatCellValue(info.getValue(), 1),
      });
    }

    return columns;
  }, [sampleData]);
};

/**
 * 空データ表示コンポーネント
 */
const EmptyDataDisplay = () => (
  <div className="p-6 text-gray-500 text-center flex items-center justify-center h-full">
    データ受信待ち...
  </div>
);

/**
 * データテーブルコンポーネント（メモ化済み）
 */
export const DataTable = memo(() => {
  // Redux storeから表示用データを取得（統合selector使用）
  const { displayData, hasData, sampleData } =
    useAppSelector(selectDataTableData);

  // 列定義を生成（サンプルデータを使用）
  const columns = useColumnsDefinition(sampleData);

  // React Tableの設定
  const table = useReactTable({
    data: displayData,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 border border-gray-200">
        <thead className="bg-gray-50">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  className="px-4 py-3 text-center text-xs font-medium text-gray-600 tracking-wider whitespace-nowrap"
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id} className="hover:bg-gray-50">
              {row.getVisibleCells().map((cell) => (
                <td
                  key={cell.id}
                  className="px-4 py-3 text-center text-sm text-gray-900 whitespace-nowrap"
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
});

DataTable.displayName = "DataTable";
