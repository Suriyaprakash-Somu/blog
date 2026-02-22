"use client";

import { useState, useMemo } from "react";
import { Search, X, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { QueryGroup } from "./parts/QueryGroup";
import { useQueryBuilder } from "./hooks/useQueryBuilder";
import { zodToFilterFields } from "./utils/zodToFilterFields";
import type { QueryBuilderProps } from "./types";
import { EmptyState } from "@/components/feedback/EmptyState";

/**
 * QueryBuilder - Visual filter builder from Zod schemas
 */
export function QueryBuilder({
  schema,
  onSubmit,
  className,
  disabled = false,
  defaultOpen = false,
  initialValue,
}: QueryBuilderProps): React.ReactElement | null {
  const fields = useMemo(() => zodToFilterFields(schema), [schema]);

  const {
    query,
    updateCondition,
    addCondition,
    removeCondition,
    addGroup,
    removeGroup,
    toggleGroupLogic,
    clearQuery,
    buildFilterOutput,
    hasConditions,
  } = useQueryBuilder(fields, { initialQuery: initialValue });

  const [search, setSearch] = useState(
    (initialValue as { search?: string })?.search ?? "",
  );

  const handleSubmit = () => {
    const filters = buildFilterOutput();
    onSubmit?.({ ...filters, search });
  };

  const handleClear = () => {
    clearQuery();
    setSearch("");
    onSubmit?.(null);
  };

  if (fields.length === 0) {
    return (
      <EmptyState
        title="No filters available"
        description="This dataset does not expose filterable fields yet."
      />
    );
  }

  return (
    <Collapsible defaultOpen={defaultOpen} className={cn("w-full", className)}>
      <div className="flex items-center gap-2 mb-2 justify-end">
        <CollapsibleTrigger
          render={<Button variant="outline" size="sm" className="gap-2" />}
        >
          <Filter size={14} />
          Filters
          {hasConditions && (
            <span className="h-2 w-2 rounded-full bg-primary" />
          )}
        </CollapsibleTrigger>
      </div>

      <CollapsibleContent>
        <div className="space-y-4 p-4 border rounded-lg bg-card">
          <div className="relative w-full">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-9"
            />
          </div>

          <QueryGroup
            group={query}
            fields={fields}
            onUpdateCondition={updateCondition}
            onAddCondition={addCondition}
            onRemoveCondition={removeCondition}
            onAddGroup={addGroup}
            onRemoveGroup={removeGroup}
            onToggleLogic={toggleGroupLogic}
            isRoot={true}
            disabled={disabled}
          />

          <div className="flex items-center justify-end gap-2 pt-2 border-t">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClear}
              disabled={disabled || (!hasConditions && !search?.trim())}
              className="text-muted-foreground"
            >
              <X size={14} className="mr-1" />
              Clear
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSubmit}
              disabled={disabled || (!hasConditions && !search?.trim())}
              className="gap-2"
            >
              <Search size={14} />
              Filter
            </Button>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
