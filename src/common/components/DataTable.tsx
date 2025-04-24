import { useMemo } from "react";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  ColumnDef,
} from "@tanstack/react-table";
import { CosmicWatchData } from "../../shared/types";

interface DataTableProps {
  data: CosmicWatchData[];
}

// ヘルパー関数: カラム定義を生成
const generateColumns = (
  sampleData?: CosmicWatchData
): ColumnDef<CosmicWatchData>[] => {
  const baseColumns: ColumnDef<CosmicWatchData>[] = [
    { accessorKey: "event", header: "Event" },
  ];

  // データ形式に応じて列を追加
  if (sampleData?.date !== undefined) {
    baseColumns.push({ accessorKey: "date", header: "Date" });
    baseColumns.push({
      accessorKey: "totaltime",
      header: "Total Time (s)",
      cell: (info) => info.getValue() ?? "-",
    });
  } else if (sampleData?.time !== undefined) {
    baseColumns.push({ accessorKey: "time", header: "Time" });
  }

  // 共通の列を追加
  baseColumns.push(
    { accessorKey: "adc", header: "ADC" },
    {
      accessorKey: "sipm",
      header: "SiPM",
      cell: (info) => {
        const value = info.getValue();
        return typeof value === "number" ? value.toFixed(2) : "-";
      },
    },
    { accessorKey: "deadtime", header: "Deadtime (ms)" },
    { accessorKey: "temp", header: "Temperature (°C)" }
  );

  // 追加センサーデータがあれば列を追加
  if (sampleData?.hum !== undefined) {
    baseColumns.push({
      accessorKey: "hum",
      header: "Humidity (%)",
      cell: (info) => {
        const value = info.getValue();
        return typeof value === "number" ? value.toFixed(1) : "-";
      },
    });
  }
  if (sampleData?.press !== undefined) {
    baseColumns.push({
      accessorKey: "press",
      header: "Pressure (hPa)",
      cell: (info) => {
        const value = info.getValue();
        return typeof value === "number" ? value.toFixed(1) : "-";
      },
    });
  }

  return baseColumns;
};

export const DataTable = ({ data }: DataTableProps) => {
  // データに基づいて動的に列定義を生成
  const columns = useMemo(() => generateColumns(data[0]), [data[0]]);

  const table = useReactTable({
    data,
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
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap"
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
              {row.getVisibleCells().map((cell) => (
                <td
                  key={cell.id}
                  className="px-4 py-3 whitespace-nowrap text-sm text-gray-700"
                  style={{
                    textAlign:
                      typeof cell.getValue() === "number" ? "right" : "left",
                  }}
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
};
