"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Trash2, Plus, GripVertical } from "lucide-react";
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
  FieldOption,
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
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

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
  sortable = false,
  fieldOptionsMap,
}: FieldArrayProps & { sortable?: boolean }): React.ReactElement {
  // Strip the array field prefix from fieldOptionsMap keys so sub-fields can match
  // e.g. { "items.entityId": [...] } becomes { "entityId": [...] }
  const subFieldOptions = useMemo(() => {
    if (!fieldOptionsMap) return undefined;
    const result: Record<string, FieldOption[]> = {};
    const prefix = `${name}.`;
    for (const [key, val] of Object.entries(fieldOptionsMap)) {
      if (key.startsWith(prefix)) {
        result[key.slice(prefix.length)] = val;
      } else {
        result[key] = val;
      }
    }
    return Object.keys(result).length > 0 ? result : undefined;
  }, [fieldOptionsMap, name]);
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

  // Drag and Drop handlers
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((i) => getItemId(i) === active.id);
      const newIndex = items.findIndex((i) => getItemId(i) === over.id);

      const reorderedItems = arrayMove(items, oldIndex, newIndex);

      // Update order field if it exists in the schema
      const orderField = itemFields.find((f) => f.name === "order");
      if (orderField) {
        const withUpdatedOrder = reorderedItems.map((item, index) => ({
          ...item,
          order: index + 1,
        }));
        onChange(withUpdatedOrder);
      } else {
        onChange(reorderedItems);
      }
    }
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
        {sortable ? (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={items.map((i) => getItemId(i))}
              strategy={verticalListSortingStrategy}
            >
              {items.map((item, index) => (
                <SortableArrayItem
                  key={getItemId(item)}
                  id={getItemId(item)}
                  item={item}
                  index={index}
                  name={name}
                  singularLabel={singularLabel}
                  label={label}
                  itemFields={itemFields}
                  disabled={disabled}
                  removeItem={removeItem}
                  updateItem={updateItem}
                  getItemErrors={getItemErrors}
                  onBlur={onBlur}
                  markTouched={markTouched}
                  subFieldOptions={subFieldOptions}
                />
              ))}
            </SortableContext>
          </DndContext>
        ) : (
          items.map((item, index) => (
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

                    // Skip rendering the 'order' field if sortable since it's managed via drag-and-drop
                    if (sortable && field.name === "order") return null;
                    // Skip fields excluded from form
                    if (field.excludeFrom === "form") return null;

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
                          overrideOptions={subFieldOptions?.[field.name]}
                        />
                        {fieldErrors && <FieldErrors errors={fieldErrors} />}
                      </div>
                    );
                  })}
              </div>
            </Card>
          ))
        )}
      </div>

      <FieldErrors errors={arrayErrors} />
    </div>
  );
}

// Sub-component for sortable item
function SortableArrayItem({
  id,
  item,
  index,
  name,
  singularLabel,
  label,
  itemFields,
  disabled,
  removeItem,
  updateItem,
  getItemErrors,
  onBlur,
  markTouched,
  subFieldOptions,
}: {
  id: string;
  item: ArrayItemWithLocalId;
  index: number;
  name: string;
  singularLabel?: string;
  label: string;
  itemFields: FieldConfig[];
  disabled?: boolean;
  removeItem: (index: number) => void;
  updateItem: (index: number, fieldName: string, fieldValue: unknown) => void;
  getItemErrors: (index: number, fieldName: string) => string[] | undefined;
  onBlur?: () => void;
  markTouched: (path: string) => void;
  subFieldOptions?: Record<string, FieldOption[]>;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 2 : 1,
    opacity: isDragging ? 0.8 : 1,
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`p-4 ${isDragging ? "shadow-md ring-2 ring-primary ring-opacity-50" : ""}`}
      data-testid={`${name}-item-${index}`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          {/* Drag Handle */}
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab hover:bg-muted p-1 rounded transition-colors"
          >
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </div>
          <h4 className="text-sm font-medium">
            {singularLabel ?? label} #{index + 1}
          </h4>
        </div>
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

            // Hide the 'order' field when sortable is true
            if (field.name === "order") return null;
            // Skip fields excluded from form
            if (field.excludeFrom === "form") return null;

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
                  overrideOptions={subFieldOptions?.[field.name]}
                />
                {fieldErrors && <FieldErrors errors={fieldErrors} />}
              </div>
            );
          })}
      </div>
    </Card>
  );
}
