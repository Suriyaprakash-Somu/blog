"use client";
"use no memo";

import { flexRender } from "@tanstack/react-table";
import type { TableBodyProps, ColumnMeta } from "../types";

/**
 * TableBody component for rendering table rows
 */
export function TableBody<TData>({
  table,
}: TableBodyProps<TData>): React.ReactElement {
  const rows = table.getRowModel().rows;

  if (!rows.length) {
    return (
      <tbody>
        <tr>
          <td
            colSpan={table.getAllLeafColumns().length || 1}
            className="py-10 text-center text-muted-foreground"
          >
            No data available
          </td>
        </tr>
      </tbody>
    );
  }

  return (
    <tbody className="divide-y divide-border">
      {rows.map((row) => (
        <tr
          key={row.id}
          className="table-row-virtualized hover:bg-accent/50 transition-colors duration-150"
        >
          {row.getVisibleCells().map((cell) => {
            const meta = cell.column.columnDef.meta as ColumnMeta | undefined;
            const tdClass = meta?.tdClass ?? "";
            return (
              <td
                key={cell.id}
                className={`px-3 py-2 whitespace-nowrap text-sm text-foreground ${tdClass}`}
              >
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </td>
            );
          })}
        </tr>
      ))}
    </tbody>
  );
}
