"use client";

import { GripVertical, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ValueInput } from "./ValueInput";
import {
  getDefaultValueForType,
  operatorNeedsRange,
  operatorNeedsValue,
} from "../utils";
import type { QueryConditionProps, FilterValue } from "../types";

/**
 * Single query condition row
 */
export function QueryCondition({
  condition,
  fields,
  onUpdate,
  onRemove,
  disabled,
  showDragHandle = false,
}: QueryConditionProps): React.ReactElement {
  const selectedField = fields.find((f) => f.id === condition.field);
  const operators = selectedField?.operators ?? [];

  const handleFieldChange = (fieldId: string | null) => {
    if (!fieldId) return;
    const newField = fields.find((f) => f.id === fieldId);
    const defaultValue = getDefaultValueForType(newField?.type ?? "text");
    onUpdate(condition.id, {
      field: fieldId,
      operator: newField?.operators?.[0]?.value ?? "equals",
      value: defaultValue,
    });
  };

  const normalizeRangeValue = (input: FilterValue): FilterValue => {
    if (Array.isArray(input)) {
      return {
        from: input[0] !== undefined ? String(input[0]) : "",
        to: input[1] !== undefined ? String(input[1]) : "",
      };
    }
    if (input && typeof input === "object" && "from" in input && "to" in input) {
      return input;
    }
    return { from: "", to: "" };
  };

  const handleOperatorChange = (operator: string | null) => {
    if (!operator) return;
    if (!operatorNeedsValue(operator)) {
      onUpdate(condition.id, { operator, value: null });
      return;
    }

    if (operatorNeedsRange(operator)) {
      onUpdate(condition.id, {
        operator,
        value: normalizeRangeValue(condition.value),
      });
      return;
    }

    onUpdate(condition.id, { operator });
  };

  const handleValueChange = (value: FilterValue) => {
    onUpdate(condition.id, { value });
  };

  return (
    <div className="flex flex-wrap items-center gap-2 py-2 px-3 bg-card rounded-md border">
      {showDragHandle && (
        <div className="cursor-grab text-muted-foreground hover:text-foreground">
          <GripVertical size={16} />
        </div>
      )}

      <Select
        value={condition.field}
        onValueChange={handleFieldChange}
        disabled={disabled}
      >
        <SelectTrigger className="h-9 w-full sm:w-[180px]">
          <SelectValue placeholder="Select field...">
            {selectedField?.label}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {fields.map((field) => (
            <SelectItem key={field.id} value={field.id}>
              {field.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={condition.operator}
        onValueChange={handleOperatorChange}
        disabled={disabled || !condition.field}
      >
        <SelectTrigger className="h-9 w-full sm:w-[140px]">
          <SelectValue placeholder="Operator">
            {operators.find((op) => op.value === condition.operator)?.label}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {operators.map((op) => (
            <SelectItem key={op.value} value={op.value}>
              {op.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="flex-1 w-full sm:w-auto min-w-[150px]">
        {condition.field && selectedField && (
          <ValueInput
            field={selectedField}
            operator={condition.operator}
            value={condition.value}
            onChange={handleValueChange}
            disabled={disabled || !condition.field}
          />
        )}
      </div>

      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => onRemove(condition.id)}
        disabled={disabled}
        className="h-9 w-9 text-muted-foreground hover:text-destructive"
      >
        <Trash2 size={16} />
      </Button>
    </div>
  );
}
