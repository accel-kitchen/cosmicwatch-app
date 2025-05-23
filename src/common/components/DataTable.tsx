import { useMemo } from "react";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  ColumnDef,
  SortingState,
} from "@tanstack/react-table";
import { CosmicWatchData } from "../../shared/types";
import { useSortedData } from "../hooks/useSortedData";

interface DataTableProps {
  data: CosmicWatchData[];
}

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
        header: "Time (s)",
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

export const DataTable = ({ data }: DataTableProps) => {
  // ソート済みのデータ（最新100件、event降順）
  const sortedData = useSortedData(data);

  // サンプルデータに基づいた列定義
  const columns = useColumnsDefinition(sortedData[0]);

  // デフォルトのソート状態（eventの降順）
  const initialSortState: SortingState = [{ id: "event", desc: true }];

  // テーブル初期化
  const table = useReactTable({
    data: sortedData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    initialState: {
      sorting: initialSortState,
    },
  });

  // データがない場合
  if (sortedData.length === 0) {
    return <EmptyDataDisplay />;
  }

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
            <tr
              key={row.id}
              className="hover:bg-gray-50 transition-colors duration-150 ease-in-out"
            >
              {row.getVisibleCells().map((cell) => {
                const value = cell.getValue();
                const isNumeric = typeof value === "number";

                return (
                  <td
                    key={cell.id}
                    className="px-4 py-3 whitespace-nowrap text-sm text-gray-700"
                    style={{ textAlign: isNumeric ? "right" : "left" }}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
