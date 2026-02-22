"use client";

import { Plus, FolderPlus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { QueryCondition } from "./QueryCondition";
import type { QueryGroupProps } from "../types";

/**
 * QueryGroup component for grouping conditions with AND/OR logic
 */
export function QueryGroup({
  group,
  fields,
  onUpdateCondition,
  onAddCondition,
  onRemoveCondition,
  onAddGroup,
  onRemoveGroup,
  onToggleLogic,
  isRoot = false,
  disabled,
  depth = 0,
}: QueryGroupProps): React.ReactElement {
  const maxDepth = 2;

  return (
    <div
      className={cn(
        "rounded-lg border",
        isRoot ? "bg-muted/30" : "bg-muted/50",
        depth === 1 && "ml-6 border-l-4 border-l-primary/30",
        depth === 2 && "ml-6 border-l-4 border-l-secondary/50",
      )}
    >
      <div className="flex items-center gap-3 px-4 py-2 border-b bg-muted/50 rounded-t-lg">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onToggleLogic(group.id)}
          disabled={disabled}
          className={cn(
            "h-7 px-3 font-medium text-xs",
            group.logic === "AND"
              ? "bg-primary/10 text-primary border-primary/30"
              : "bg-secondary text-secondary-foreground border-secondary",
          )}
        >
          {group.logic}
        </Button>

        <span className="text-sm text-muted-foreground">
          {group.logic === "AND"
            ? "Match all conditions"
            : "Match any condition"}
        </span>

        <div className="flex-1" />

        {!isRoot && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onRemoveGroup(group.id)}
            disabled={disabled}
            className="h-7 w-7 text-muted-foreground hover:text-destructive"
          >
            <Trash2 size={14} />
          </Button>
        )}
      </div>

      <div className="p-3 space-y-2">
        {group.conditions.length === 0 ? (
          <div className="text-center py-4 text-sm text-muted-foreground">
            No conditions. Add one below.
          </div>
        ) : (
          group.conditions.map((item) => {
            if (item.type === "group") {
              return (
                <QueryGroup
                  key={item.id}
                  group={item}
                  fields={fields}
                  onUpdateCondition={onUpdateCondition}
                  onAddCondition={onAddCondition}
                  onRemoveCondition={onRemoveCondition}
                  onAddGroup={onAddGroup}
                  onRemoveGroup={onRemoveGroup}
                  onToggleLogic={onToggleLogic}
                  isRoot={false}
                  disabled={disabled}
                  depth={depth + 1}
                />
              );
            }

            return (
              <QueryCondition
                key={item.id}
                condition={item}
                fields={fields}
                onUpdate={(id, updates) => onUpdateCondition(id, updates)}
                onRemove={() => onRemoveCondition(item.id)}
                disabled={disabled}
              />
            );
          })
        )}
      </div>

      <div className="flex items-center gap-2 px-4 py-2 border-t bg-muted/30 rounded-b-lg">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onAddCondition(group.id)}
          disabled={disabled}
          className="h-8 text-primary hover:text-primary hover:bg-primary/10"
        >
          <Plus size={14} className="mr-1" />
          Add condition
        </Button>

        {depth < maxDepth && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() =>
              onAddGroup(group.id, group.logic === "AND" ? "OR" : "AND")
            }
            disabled={disabled}
            className="h-8 text-muted-foreground hover:text-foreground"
          >
            <FolderPlus size={14} className="mr-1" />
            Add group
          </Button>
        )}
      </div>
    </div>
  );
}
