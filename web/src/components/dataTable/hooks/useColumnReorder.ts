import type { Table } from "@tanstack/react-table";
import type { SetStateAction, Dispatch } from "react";
import type { TableState } from "../types";

/**
 * Hook for handling column reordering via drag and drop
 */
export function useColumnReorder<TData>(
  setTableState: Dispatch<SetStateAction<TableState>>,
  leafIds: string[],
  table: Table<TData>
): (sourceId: string, targetId: string) => void {
  return (sourceId: string, targetId: string) => {
    setTableState((prev) => {
      const current =
        prev.columnOrder.length > 0 ? [...prev.columnOrder] : [...leafIds];

      const getLeafsForId = (id: string): string[] => {
        const col = table.getColumn(id);
        if (!col) return [];
        return col.getLeafColumns().map((colItem) => colItem.id);
      };

      const sourceLeafs = getLeafsForId(sourceId);
      const targetLeafs = getLeafsForId(targetId);

      if (!sourceLeafs.length || !targetLeafs.length) return prev;

      const newOrder = current.filter((id) => !sourceLeafs.includes(id));

      const firstTargetId = targetLeafs[0];
      let targetIndex = firstTargetId ? newOrder.indexOf(firstTargetId) : -1;

      if (targetIndex === -1) targetIndex = newOrder.length;

      newOrder.splice(targetIndex, 0, ...sourceLeafs);

      return { ...prev, columnOrder: newOrder };
    });
  };
}
