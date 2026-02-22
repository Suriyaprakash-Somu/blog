"use client";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  operatorNeedsValue,
  operatorNeedsRange,
} from "../utils/operatorConfig";
import { MultiSelect } from "@/components/ui/multi-select";
import type { FilterValue, RangeValue, ValueInputProps } from "../types";

/**
 * Value input component for query conditions
 */
export function ValueInput({
  field,
  operator,
  value,
  onChange,
  disabled,
}: ValueInputProps): React.ReactElement | null {
  if (!operatorNeedsValue(operator)) {
    return null;
  }

  const isRange = operatorNeedsRange(operator);

  const normalizeRangeValue = (input: FilterValue): { from: string; to: string } => {
    if (Array.isArray(input)) {
      const range = input as RangeValue;
      return {
        from: range[0] ?? "",
        to: range[1] ?? "",
      };
    }

    if (input && typeof input === "object" && "from" in input && "to" in input) {
      const typed = input as { from?: string; to?: string };
      return {
        from: typed.from ?? "",
        to: typed.to ?? "",
      };
    }

    return { from: "", to: "" };
  };

  const handleRangeChange = (next: { from: string; to: string }) => {
    onChange({ from: next.from, to: next.to });
  };

  if (isRange) {
    const rangeValue = normalizeRangeValue(value);
    const inputType =
      field.type === "date"
        ? "date"
        : field.type === "time"
          ? "time"
          : field.type === "number"
            ? "number"
            : "text";

    return (
      <div className="flex items-center gap-2">
        <Input
          type={inputType}
          value={rangeValue.from}
          onChange={(e) => handleRangeChange({ ...rangeValue, from: e.target.value })}
          className="h-8"
          disabled={disabled}
        />
        <span className="text-muted-foreground">to</span>
        <Input
          type={inputType}
          value={rangeValue.to}
          onChange={(e) => handleRangeChange({ ...rangeValue, to: e.target.value })}
          className="h-8"
          disabled={disabled}
        />
      </div>
    );
  }

  // Select field
  if (field.type === "select" && field.options) {
    return (
      <Select
        value={String(value ?? "")}
        onValueChange={onChange}
        disabled={disabled}
      >
        <SelectTrigger className="h-8 min-w-[120px]">
          <SelectValue placeholder="Select..." />
        </SelectTrigger>
        <SelectContent>
          {field.options.map((opt) => (
            <SelectItem key={String(opt.value)} value={String(opt.value)}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  if (field.type === "multiselect" && field.options) {
    const selected = Array.isArray(value) ? value : [];
    return (
      <MultiSelect
        options={field.options}
        onValueChange={(next) => onChange(next)}
        defaultValue={selected}
        placeholder="Select options..."
        variant="default"
        maxCount={2}
        disabled={disabled}
        className="min-w-[200px]"
      />
    );
  }

  // Number field
  if (field.type === "number") {
    return (
      <Input
        type="number"
        value={String(value ?? "")}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Value..."
        className="h-8 min-w-[100px]"
        disabled={disabled}
      />
    );
  }

  // Date field
  if (field.type === "date") {
    if (isRange) {
      const rangeValue = (value as { from?: string; to?: string }) ?? {};
      return (
        <div className="flex items-center gap-2">
          <Input
            type="date"
            value={rangeValue.from ?? ""}
            onChange={(e) => onChange({ ...rangeValue, from: e.target.value })}
            className="h-8"
            disabled={disabled}
          />
          <span className="text-muted-foreground">to</span>
          <Input
            type="date"
            value={rangeValue.to ?? ""}
            onChange={(e) => onChange({ ...rangeValue, to: e.target.value })}
            className="h-8"
            disabled={disabled}
          />
        </div>
      );
    }
    return (
      <Input
        type="date"
        value={String(value ?? "")}
        onChange={(e) => onChange(e.target.value)}
        className="h-8"
        disabled={disabled}
      />
    );
  }

  // Time field
  if (field.type === "time") {
    return (
      <Input
        type="time"
        value={String(value ?? "")}
        onChange={(e) => onChange(e.target.value)}
        className="h-8"
        disabled={disabled}
      />
    );
  }

  // Default text field
  return (
    <Input
      type="text"
      value={String(value ?? "")}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Value..."
      className="h-8 min-w-[120px]"
      disabled={disabled}
    />
  );
}
