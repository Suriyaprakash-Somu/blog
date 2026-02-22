"use client";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Loader2,
  FileText,
  FileBarChart2,
  FileSpreadsheet,
  Download,
} from "lucide-react";
import type { ExportsConfig } from "../types";
import type { ReactNode } from "react";

interface ExportsToolbarProps<TData> {
  exports?: ExportsConfig<TData>;
  onExport: (exportType: string) => Promise<void>;
  isExporting: string | null;
}

export function ExportsToolbar<TData>({
  exports,
  onExport,
  isExporting,
}: ExportsToolbarProps<TData>) {
  if (!exports || Object.keys(exports).length === 0) {
    return null;
  }

  // Helper to fallback icons if not provided
  const getIcon = (key: string, customIcon?: ReactNode) => {
    if (customIcon) return customIcon;
    switch (key) {
      case "pdf":
        return <FileText size={16} />;
      case "csv":
        return <FileBarChart2 size={16} />;
      case "excel":
        return <FileSpreadsheet size={16} />;
      default:
        return <Download size={16} />;
    }
  };

  return (
    <div className="py-2 px-4 flex justify-end">
      <div className="flex gap-1 items-center">
        <span className="text-sm text-muted-foreground mr-2">Export:</span>
        {Object.entries(exports).map(([key, config]) => {
          if (!config) return null;

          const Icon = getIcon(key, config.icon);
          const label = config.label ?? key.toUpperCase();
          const isCurrentlyExporting = isExporting === key;

          const button = (
            <Button
              key={key}
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => onExport(key)}
              disabled={Boolean(isExporting)}
              title={config.tooltip ?? `Export as ${label}`}
              className="relative"
            >
              {isCurrentlyExporting ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                Icon
              )}
            </Button>
          );

          // Wrap in tooltip if tooltip text provided
          if (config.tooltip) {
            return (
              <TooltipProvider key={key}>
                <Tooltip>
                  <TooltipTrigger>{button}</TooltipTrigger>
                  <TooltipContent>
                    <p>{config.tooltip}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            );
          }

          return button;
        })}
      </div>
    </div>
  );
}
