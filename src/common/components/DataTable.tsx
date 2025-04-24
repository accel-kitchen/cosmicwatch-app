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

// 列定義をコンポーネント外に定義 (再レンダリングでの再生成を防ぐ)
const columns: ColumnDef<CosmicWatchData>[] = [
  { accessorKey: "runNumber", header: "Run" },
  { accessorKey: "eventNumber", header: "Event" },
  { accessorKey: "boardIndex", header: "Board" },
  {
    accessorKey: "date",
    header: "Date",
    cell: (info) => info.getValue() ?? "-", // dateがない場合もあるため
    enableHiding: true, // 非表示可能に
  },
  { accessorKey: "time", header: "Time" },
  {
    accessorKey: "totaltime",
    header: "Total Time (s)",
    cell: (info) => info.getValue() ?? "-", // totaltimeがない場合もあるため
    enableHiding: true, // 非表示可能に
  },
  { accessorKey: "adc", header: "ADC" },
  { accessorKey: "temp", header: "Temp (°C)" },
  { accessorKey: "deadtime", header: "Deadtime (ms)" },
];

export const DataTable = ({ data }: DataTableProps) => {
  // 最初のデータに基づいて表示する列を動的に決定
  const hasDateFormat = data.length > 0 && data[0].date !== undefined;

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    // 列の表示/非表示を制御
    initialState: {
      columnVisibility: {
        date: hasDateFormat,
        totaltime: hasDateFormat,
        time: !hasDateFormat, // dateがある場合はtimeを非表示にすることも検討
      },
    },
    // データが変わったら列表示も更新
    state: {
      columnVisibility: {
        date: hasDateFormat,
        totaltime: hasDateFormat,
        time: !hasDateFormat, // time は date がない場合のみ表示
      },
    },
  });

  return (
    // テーブル全体に適用するスタイル
    <div className="overflow-x-auto">
      {" "}
      {/* 横スクロールを可能に */}
      <table className="min-w-full divide-y divide-gray-200 border border-gray-200">
        <thead className="bg-gray-50">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  // ヘッダーセルのスタイル (パディング、文字揃え、文字スタイル)
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
            // 行スタイル (ホバー効果など)
            <tr
              key={row.id}
              className="hover:bg-gray-50 transition-colors duration-150 ease-in-out"
            >
              {row.getVisibleCells().map((cell) => (
                <td
                  key={cell.id}
                  // データセルのスタイル (パディング、文字スタイル、数値は右揃えなど)
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
