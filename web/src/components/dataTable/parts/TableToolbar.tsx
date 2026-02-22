"use client";

import { RefreshCw, Settings, ChevronDown, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
} from "@/components/ui/dropdown-menu";
import type { TableToolbarProps, ColumnMeta } from "../types";

/**
 * Extended column meta with label
 */
interface ExtendedColumnMeta extends ColumnMeta {
  label?: string;
}

/**
 * TableToolbar component with column visibility, refresh, and add actions
 */
export function TableToolbar<TData>({
  table,
  onRefresh,
  onAdd,
  addButtonText = "Add Item",
  showColumnMenu = true,
  visibilityState,
}: TableToolbarProps<TData>): React.ReactElement {
  return (
    <div className="flex flex-wrap items-center justify-end gap-3">
      {showColumnMenu && (
        <DropdownMenu>
          <DropdownMenuTrigger className="cursor-pointer inline-flex items-center justify-center whitespace-nowrap rounded-md border border-border bg-background hover:bg-muted hover:text-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 aria-expanded:bg-muted aria-expanded:text-foreground shadow-xs text-sm font-medium focus-visible:ring-[3px] transition-all disabled:pointer-events-none disabled:opacity-50 shrink-0 outline-none group/button select-none h-9 gap-2 px-2.5">
            <Settings size={16} />
            <span>Columns</span>
            <ChevronDown size={16} />
          </DropdownMenuTrigger>

          <DropdownMenuContent
            align="end"
            className="w-56 p-2 max-h-64 overflow-y-auto"
          >
            {table.getAllLeafColumns().map((col) => {
              const isVisible = visibilityState
                ? (visibilityState[col.id] ?? true)
                : col.getIsVisible();

              const checkboxId = `column-${col.id}`;
              const meta = col.columnDef.meta as ExtendedColumnMeta | undefined;
              const headerValue = col.columnDef.header;
              const label =
                meta?.label ??
                (typeof headerValue === "string" ? headerValue : col.id);

              return (
                <div
                  key={`${col.id}-${String(isVisible)}`}
                  className="px-2 py-1.5"
                >
                  <label
                    htmlFor={checkboxId}
                    className="flex items-center space-x-2 text-sm cursor-pointer capitalize"
                  >
                    <Checkbox
                      id={checkboxId}
                      checked={isVisible}
                      onCheckedChange={(checked) => {
                        col.toggleVisibility(Boolean(checked));
                      }}
                    />
                    <span>{label}</span>
                  </label>
                </div>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onRefresh}
        className="cursor-pointer h-9 gap-2"
      >
        <RefreshCw size={16} />
        <span>Refresh</span>
      </Button>

      {onAdd && (
        <Button type="button" onClick={onAdd} size="sm" className="cursor-pointer h-9 gap-2">
          <Plus size={16} />
          {addButtonText}
        </Button>
      )}
    </div>
  );
}
