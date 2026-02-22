import type { Row } from "@tanstack/react-table";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  MoreVertical,
  Eye,
  Pencil,
  Trash2,
  Download,
  Printer,
  Mail,
  CheckCircle,
  XCircle,
  ThumbsUp,
  ThumbsDown,
  X,
} from "lucide-react";
import type { OperationsConfig } from "../types";

interface RowWithId {
  id: string | number;
  [key: string]: unknown;
}

interface RowActionsProps<TData extends RowWithId> {
  row: Row<TData>;
  operations?: OperationsConfig<TData>;
  onOperationClick: (operationType: string, rowData: TData) => void;
}

export function RowActions<TData extends RowWithId>({
  row,
  operations,
  onOperationClick,
}: RowActionsProps<TData>): React.ReactElement | null {
  const data = row.original;

  if (!operations) return null;

  // Filter out 'add' (table-level) and any operations that shouldn't appear in row actions
  const rowLevelOperations = Object.entries(operations).filter(([key, operation]) => {
    if (key === "add") return false;
    if (!operation) return false;
    if (operation.isVisible && !operation.isVisible(data)) return false;
    return true;
  });

  if (rowLevelOperations.length === 0) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="cursor-pointer p-1 text-muted-foreground hover:text-foreground hover:bg-accent rounded-md">
        <MoreVertical size={18} />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-48">
        {rowLevelOperations.map(([key, operation]) => {
          if (!operation) return null;

          const Icon = operation.icon ?? getDefaultIcon(key);
          // Capitalize first letter if no label
          const label =
            operation.label ?? key.charAt(0).toUpperCase() + key.slice(1);
          const colorClass = getOperationColorClass(key);

          return (
            <DropdownMenuItem
              key={key}
              onClick={() => onOperationClick(key, data)}
              onSelect={() => onOperationClick(key, data)}
              className={`flex items-center gap-2 cursor-pointer ${colorClass}`}
            >
              {Icon && <span className="text-inherit">{Icon}</span>}
              <span>{label}</span>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function getDefaultIcon(operationType: string): React.ReactNode {
  const iconMap: Record<string, React.ReactNode> = {
    view: <Eye className="h-4 w-4" />,
    edit: <Pencil className="h-4 w-4" />,
    delete: <Trash2 className="h-4 w-4" />,
    download: <Download className="h-4 w-4" />,
    print: <Printer className="h-4 w-4" />,
    email: <Mail className="h-4 w-4" />,
    complete: <CheckCircle className="h-4 w-4" />,
    approve: <ThumbsUp className="h-4 w-4" />,
    reject: <ThumbsDown className="h-4 w-4" />,
    dismiss: <X className="h-4 w-4" />,
    cancel: <XCircle className="h-4 w-4" />,
  };

  return iconMap[operationType] ?? null;
}

function getOperationColorClass(operationType: string): string {
  const colorMap: Record<string, string> = {
    view: "text-primary focus:text-primary focus:bg-primary/10",
    edit: "text-primary focus:text-primary focus:bg-primary/10",
    delete: "text-destructive focus:text-destructive focus:bg-destructive/10",
    complete: "text-foreground focus:text-foreground focus:bg-accent",
    dismiss: "text-muted-foreground focus:text-foreground focus:bg-muted",
    download: "text-primary focus:text-primary focus:bg-primary/10",
    print: "text-primary focus:text-primary focus:bg-primary/10",
    email: "text-primary focus:text-primary focus:bg-primary/10",
    approve: "text-foreground focus:text-foreground focus:bg-accent",
    reject: "text-destructive focus:text-destructive focus:bg-destructive/10",
  };

  return colorMap[operationType] ?? "text-foreground focus:bg-accent";
}
