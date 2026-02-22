"use client";

import dynamic from "next/dynamic";
import {
  Autocomplete,
  AutocompleteContent,
  AutocompleteEmpty,
  AutocompleteList,
  AutocompleteTrigger,
} from "@/components/ui/autocomplete";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MultiSelect } from "@/components/ui/multi-select";
import { PasswordInput } from "@/components/ui/password-input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { FieldArray } from "./FieldArray";
import { FieldErrors } from "./FieldErrors";
import { FileUploadField } from "./FileUploadField";
import type {
  ArrayFieldConfig,
  ArrayItemWithLocalId,
  FieldOption,
  FieldRendererProps,
  GroupedFieldOptions,
} from "./types";

// Dynamic import for MapPicker
const MapPicker = dynamic(() => import("./MapPicker"), {
  ssr: false,
  loading: () => (
    <div className="h-[300px] w-full animate-pulse rounded-md bg-muted flex items-center justify-center">
      Loading Map...
    </div>
  ),
});

/**
 * Check if options are grouped
 */
function isGroupedOptions(
  items: FieldOption[] | GroupedFieldOptions[],
): items is GroupedFieldOptions[] {
  return (
    items.length > 0 &&
    Object.prototype.hasOwnProperty.call(items[0], "heading")
  );
}

/**
 * Get label for a value from options
 */
function getLabelForValue(
  currentValue: unknown,
  flatOptions: FieldOption[],
): string {
  const match = flatOptions.find((option) => option.value === currentValue);
  if (match) return match.label;
  if (currentValue === null || currentValue === undefined) return "";
  return String(currentValue);
}

/**
 * Render form fields based on configuration
 */
export function FieldRenderer({
  cfg,
  id,
  value,
  onChange,
  onBlur,
  disabled,
  overrideOptions,
  errors,
  isSubmitted,
}: FieldRendererProps): React.ReactElement | null {
  const options =
    overrideOptions ?? (cfg as { options?: FieldOption[] }).options ?? [];

  const flatOptions: FieldOption[] = isGroupedOptions(options)
    ? options.flatMap((group) => group.options)
    : (options as FieldOption[]);

  const fieldId = id ?? cfg.name;

  const fieldErrors = isSubmitted ? (errors ?? []) : [];

  switch (cfg.type) {
    case "file":
      return (
        <div>
          <FileUploadField
            value={value as string | string[] | null}
            onChange={onChange}
            disabled={disabled}
            accept={cfg.accept}
            maxSizeBytes={cfg.maxSizeBytes}
            maxFiles={cfg.maxFiles}
            maxTotalSizeBytes={cfg.maxTotalSizeBytes}
            uploadMode={cfg.uploadMode}
          />
          <FieldErrors errors={fieldErrors} />
        </div>
      );

    case "array": {
      const arrayConfig = cfg as ArrayFieldConfig;
      const arrayValue = Array.isArray(value)
        ? (value as ArrayItemWithLocalId[])
        : [];

      return (
        <FieldArray
          name={cfg.name}
          label={cfg.label}
          singularLabel={arrayConfig.singularLabel}
          itemFields={arrayConfig.arrayItemSchema ?? []}
          value={arrayValue}
          onChange={onChange}
          onBlur={onBlur}
          errors={errors}
          disabled={disabled}
          isSubmitted={isSubmitted}
        />
      );
    }

    case "text":
    case "email":
      return (
        <div>
          <Input
            id={fieldId}
            type={cfg.type}
            value={(value as string) ?? ""}
            onChange={(e) => onChange(e.target.value)}
            onBlur={onBlur}
            placeholder={cfg.placeholder ?? ""}
            disabled={disabled}
            className="h-10"
          />
          <FieldErrors errors={fieldErrors} />
        </div>
      );

    case "password":
      return (
        <div>
          <PasswordInput
            id={fieldId}
            value={(value as string) ?? ""}
            onChange={(next) => onChange(next)}
            onBlur={onBlur}
            placeholder={cfg.placeholder ?? ""}
            disabled={disabled}
          />
          <FieldErrors errors={fieldErrors} />
        </div>
      );

    case "textarea":
      return (
        <div>
          <Textarea
            id={fieldId}
            value={(value as string) ?? ""}
            onChange={(e) => onChange(e.target.value)}
            onBlur={onBlur}
            placeholder={cfg.placeholder ?? ""}
            disabled={disabled}
            rows={4}
            className="resize-none"
          />
          <FieldErrors errors={fieldErrors} />
        </div>
      );

    case "number":
      return (
        <div>
          <Input
            id={fieldId}
            type="number"
            value={value === undefined || value === null ? "" : String(value)}
            onChange={(e) => onChange(e.target.value)}
            onBlur={onBlur}
            placeholder={cfg.placeholder ?? ""}
            disabled={disabled}
            inputMode="numeric"
            className="h-10"
          />
          <FieldErrors errors={fieldErrors} />
        </div>
      );

    case "date":
      return (
        <div>
          <Input
            id={fieldId}
            type="date"
            value={(value as string) ?? ""}
            onChange={(e) => onChange(e.target.value)}
            onBlur={onBlur}
            disabled={disabled}
            className="h-10"
          />
          <FieldErrors errors={fieldErrors} />
        </div>
      );

    case "time":
      return (
        <div>
          <Input
            id={fieldId}
            type="time"
            value={(value as string) ?? ""}
            onChange={(e) => onChange(e.target.value)}
            onBlur={onBlur}
            disabled={disabled}
            className="h-10"
          />
          <FieldErrors errors={fieldErrors} />
        </div>
      );

    case "select":
      return (
        <div>
          <Select
            value={(value as string) ?? ""}
            onValueChange={(v) => onChange(v)}
            disabled={disabled}
          >
            <SelectTrigger id={fieldId} className="h-10 w-full">
              <SelectValue placeholder={cfg.placeholder ?? "Select an option"}>
                {value ? getLabelForValue(value, flatOptions) : null}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {flatOptions.map((o) => (
                <SelectItem key={String(o.value)} value={String(o.value)}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldErrors errors={fieldErrors} />
        </div>
      );

    case "radio":
      return (
        <div>
          <RadioGroup
            value={(value as string) ?? ""}
            onValueChange={(v) => onChange(v)}
            disabled={disabled}
            className="space-y-2"
          >
            {flatOptions.map((o) => {
              const safeValue = String(o.value).replace(/[^a-zA-Z0-9-_]/g, "_");
              const radioId = `${fieldId}-${safeValue}`;
              return (
                <div key={String(o.value)} className="flex items-center gap-2">
                  <RadioGroupItem id={radioId} value={String(o.value)} />
                  <Label
                    htmlFor={radioId}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {o.label}
                  </Label>
                </div>
              );
            })}
          </RadioGroup>
          <FieldErrors errors={fieldErrors} />
        </div>
      );

    case "checkbox":
      return (
        <div>
          <div className="flex items-center gap-2">
            <Checkbox
              id={fieldId}
              checked={Boolean(value)}
              onCheckedChange={(v) => onChange(Boolean(v))}
              disabled={disabled}
            />
            <Label
              htmlFor={fieldId}
              className="text-sm font-normal cursor-pointer"
            >
              {cfg.placeholder ?? cfg.label}
            </Label>
          </div>
          <FieldErrors errors={fieldErrors} />
        </div>
      );

    case "switch":
      return (
        <div>
          <Switch
            id={fieldId}
            checked={Boolean(value)}
            onCheckedChange={(v) => onChange(Boolean(v))}
            disabled={disabled}
          />
          <FieldErrors errors={fieldErrors} />
        </div>
      );

    case "multiselect":
      return (
        <div>
          <MultiSelect
            options={options}
            onValueChange={(next) => onChange(next)}
            defaultValue={
              Array.isArray(value) ? (value as Array<string | number>) : []
            }
            placeholder={cfg.placeholder ?? "Select options"}
            variant="default"
            maxCount={cfg.maxCount ?? 3}
            disabled={disabled}
          />
          <FieldErrors errors={fieldErrors} />
        </div>
      );

    case "autocomplete":
      return (
        <div>
          <Autocomplete
            items={flatOptions}
            value={value as string | number | null}
            onValueChange={(nextValue) => {
              if (typeof nextValue === "object" && nextValue !== null) {
                onChange((nextValue as FieldOption).value);
              } else {
                onChange(nextValue as string | number | null);
              }
            }}
            placeholder={cfg.placeholder ?? "Search..."}
            disabled={disabled}
          >
            <AutocompleteTrigger id={fieldId} onBlur={onBlur} />
            <AutocompleteContent>
              <AutocompleteEmpty>
                {cfg.emptyIndicator ?? "No results found."}
              </AutocompleteEmpty>
              <AutocompleteList />
            </AutocompleteContent>
          </Autocomplete>
          <FieldErrors errors={fieldErrors} />
        </div>
      );

    case "map-picker":
      return (
        <div>
          <MapPicker
            value={value as { lat: number; lng: number } | null}
            onChange={onChange}
            disabled={disabled}
          />
          <FieldErrors errors={fieldErrors} />
        </div>
      );

    default:
      return null;
  }
}
