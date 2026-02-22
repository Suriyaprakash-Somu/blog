import type { TableEmptyStateProps } from "../types";
import { EmptyState } from "@/components/feedback/EmptyState";

/**
 * TableEmptyState component displayed when no data is available
 */
export function TableEmptyState({
  colSpan,
  message,
}: TableEmptyStateProps): React.ReactElement {
  return (
    <tbody>
      <tr>
        <td colSpan={colSpan} className="p-8 text-center text-muted-foreground">
          <EmptyState
            title="No data available"
            description={message ?? "No records found to display"}
          />
        </td>
      </tr>
    </tbody>
  );
}
