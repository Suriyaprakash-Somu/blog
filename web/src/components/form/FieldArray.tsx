"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Trash2, Plus } from "lucide-react";
import { FieldRenderer } from "./FieldRenderer";
import { FieldErrors } from "./FieldErrors";
import { Label } from "@/components/ui/label";
import { colSpanClass } from "./utils/gridHelpers";
import { getItemId, ensureLocalIds } from "./utils/formHelpers";
import type {
  FieldArrayProps,
  ArrayItemWithLocalId,
  FieldConfig,
  FieldValue,
} from "./types";

/**
 * Normalized error structure
 */
interface NormalizedError {
  path: string;
  message: string;
}

/**
 * FieldArray component for managing arrays of items
 */
export function FieldArray({
  name,
  label,
  singularLabel,
  itemFields,
  value = [],
  onChange,
  onBlur,
  errors,
  disabled,
  isSubmitted,
}: FieldArrayProps): React.ReactElement {
  // Ensure all items have IDs
  const items = useMemo(
    () => ensureLocalIds(Array.isArray(value) ? value : []),
    [value],
  );

  const [touchedFields, setTouchedFields] = useState<Set<string>>(
    () => new Set(),
  );

  const markTouched = (path: string) => {
    setTouchedFields((prev) => {
      const next = new Set(prev);
      next.add(path);
      return next;
    });
  };

  const addItem = () => {
    const newItem: ArrayItemWithLocalId = {
      __localId: getItemId({}),
    };
    for (const field of itemFields) {
      switch (field.type) {
        case "number":
          newItem[field.name] = undefined;
          break;
        case "checkbox":
        case "switch":
          newItem[field.name] = false;
          break;
        default:
          newItem[field.name] = "";
      }
    }
    onChange([...items, newItem]);
  };

  const removeItem = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  const updateItem = (
    index: number,
    fieldName: string,
    fieldValue: unknown,
  ) => {
    const updated = [...items];
    const currentItem = updated[index];
    if (currentItem) {
      updated[index] = { ...currentItem, [fieldName]: fieldValue };
    }
    onChange(updated);
    markTouched(`${name}.${index}.${fieldName}`);
  };

  // Separate array-level errors from item-level errors
  const arrayErrors = useMemo(() => {
    if (!errors) return [];

    const messages: string[] = [];
    for (const e of errors) {
      if (typeof e === "string") {
        messages.push(e);
      } else if (typeof e === "object" && e !== null) {
        const err = e as NormalizedError;
        if (typeof err.message === "string") {
          const path = err.path ?? "";
          if (path === name || path === "" || !path.includes(".")) {
            messages.push(err.message);
          }
        }
      }
    }
    return messages;
  }, [errors, name]);

  const itemErrorsMap = useMemo(() => {
    const map = new Map<string, string[]>();
    if (!errors) return map;

    for (const e of errors) {
      if (typeof e === "object" && e !== null) {
        const err = e as NormalizedError;
        if (err.path && err.message) {
          const existing = map.get(err.path) ?? [];
          existing.push(err.message);
          map.set(err.path, existing);
        }
      }
    }
    return map;
  }, [errors]);

  const getItemErrors = (
    index: number,
    fieldName: string,
  ): string[] | undefined => {
    const path = `${name}.${index}.${fieldName}`;
    const hasErrors = itemErrorsMap.has(path);
    if (!hasErrors) return undefined;

    const isTouched = touchedFields.has(path);
    if (isTouched || isSubmitted) {
      return itemErrorsMap.get(path);
    }
    return undefined;
  };

  return (
    <div className="space-y-3" data-testid={`field-array-${name}`}>
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">{label}</Label>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={addItem}
          disabled={disabled}
          data-testid={`add-${name}-item`}
        >
          <Plus className="h-4 w-4 mr-1" />
          Add {singularLabel ?? label}
        </Button>
      </div>

      {items.length === 0 && (
        <div className="text-sm text-muted-foreground italic">
          No items added yet. Click &quot;Add {singularLabel ?? label}&quot; to
          begin.
        </div>
      )}

      <div className="space-y-3">
        {items.map((item, index) => (
          <Card
            key={getItemId(item)}
            className="p-4"
            data-testid={`${name}-item-${index}`}
          >
            <div className="flex items-start justify-between mb-3">
              <h4 className="text-sm font-medium">
                {singularLabel ?? label} #{index + 1}
              </h4>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => removeItem(index)}
                disabled={disabled}
                className="h-8 w-8 p-0"
                data-testid={`remove-${name}-item-${index}`}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid grid-cols-12 gap-4">
              {[...itemFields]
                .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                .map((field: FieldConfig) => {
                  const span = field.colSpan ?? 12;
                  const colClass = colSpanClass(span);
                  const fieldErrors = getItemErrors(index, field.name);

                  return (
                    <div
                      key={field.name}
                      className={`col-span-12 ${colClass} space-y-1.5`}
                    >
                      <Label
                        htmlFor={`${name}.${index}.${field.name}`}
                        className="text-sm"
                      >
                        {field.label}
                        {field.required && (
                          <span className="text-destructive ml-1">*</span>
                        )}
                      </Label>
                      <FieldRenderer
                        cfg={field}
                        id={`${name}.${index}.${field.name}`}
                        value={item[field.name] as FieldValue}
                        onChange={(v) => updateItem(index, field.name, v)}
                        onBlur={() => {
                          onBlur?.();
                          markTouched(`${name}.${index}.${field.name}`);
                        }}
                        disabled={disabled}
                      />
                      {fieldErrors && <FieldErrors errors={fieldErrors} />}
                    </div>
                  );
                })}
            </div>
          </Card>
        ))}
      </div>

      <FieldErrors errors={arrayErrors} />
    </div>
  );
}
