"use client";

import * as React from "react";
import { useForm } from "@tanstack/react-form";
import type { z } from "zod";

import { FieldRenderer } from "./FieldRenderer";
import { FieldErrors } from "./FieldErrors";
import { LoadingOverlay } from "./components/LoadingOverlay";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { EmptyState } from "@/components/feedback/EmptyState";
import { InlineError } from "@/components/feedback/InlineError";

import { parseZodSchema } from "./logic/schemaParser";
import {
  addLocalIdsToArrayItems,
  buildDefaultValues,
  normalizeValues,
} from "./logic/formLogic";
import { removeInternalFields } from "./logic/dataCleanup";
import { validateWithZod, getFieldErrors } from "./logic/validationLogic";
import { isFieldVisible } from "./logic/conditionLogic";
import { getColSpanClass, clamp } from "./logic/gridLogic";
import { useFormGuard } from "./hooks/useFormGuard";

import type {
  SchemaFormProps,
  FormInstance,
  FieldConfig,
  FieldOption,
  GroupedFieldOptions,
  FormValues,
  FieldErrors as FieldErrorsType,
  FieldValue,
} from "./types";

/**
 * SchemaForm - Dynamic form generator from Zod schemas
 */
export function SchemaForm<T extends z.ZodObject<z.ZodRawShape>>({
  schema,
  onSubmit,
  submitLabel = "Submit",
  className,
  defaultValues: initialValues,
  formKey,
  onCancel,
  onReset,
  renderActions,
  disabledFields = [],
  onFieldChange,
  isLoading = false,
  loadingMessage,
  disabled = false,
  enableNavigationGuard = false,
  navigationGuardMessage,
  formRef,
}: SchemaFormProps<T>): React.ReactElement {
  const fields = React.useMemo(() => parseZodSchema(schema), [schema]);

  const defaultValues = React.useMemo(() => {
    const defaults = buildDefaultValues(fields);
    if (initialValues) {
      const withIds = addLocalIdsToArrayItems(
        initialValues as FormValues,
        fields,
      );
      return { ...defaults, ...withIds };
    }
    return defaults;
  }, [fields, initialValues]);

  const validateFileRequirements = React.useCallback(
    (values: FormValues): FieldErrorsType | null => {
      const errors: FieldErrorsType = {};

      for (const field of fields) {
        if (field.type !== "file") continue;

        const minFiles =
          typeof (field as { minFiles?: number }).minFiles === "number"
            ? (field as { minFiles: number }).minFiles
            : 1;
        if (minFiles <= 0) continue;

        const rawValue = values?.[field.name];
        const count = Array.isArray(rawValue)
          ? rawValue.filter(Boolean).length
          : rawValue
            ? 1
            : 0;

        if (count < minFiles) {
          errors[field.name] = [
            `Please upload at least ${minFiles} file${minFiles === 1 ? "" : "s"}.`,
          ];
        }
      }

      return Object.keys(errors).length > 0 ? errors : null;
    },
    [fields],
  );

  const form = useForm({
    defaultValues,
    onSubmit: async ({ value }) => {
      const normalized = normalizeValues(value as FormValues, fields);
      const sanitized = removeInternalFields(normalized);
      const result = validateWithZod(schema, sanitized);

      if (!result.success) {
        return;
      }

      const fileErrors = validateFileRequirements(sanitized);
      if (fileErrors) {
        return;
      }

      if (result.data && onSubmit) {
        await onSubmit(result.data);
      }
    },
    validators: {
      onSubmit: ({ value }) => {
        const normalized = normalizeValues(value as FormValues, fields);
        const sanitized = removeInternalFields(normalized);

        const result = validateWithZod(schema, sanitized);
        const fileErrors = validateFileRequirements(sanitized);

        if (!result.success) {
          return fileErrors
            ? { ...result.errors, ...fileErrors }
            : result.errors;
        }

        return fileErrors ?? undefined;
      },
    },
  });

  // Expose form instance via ref
  React.useImperativeHandle(formRef, () => form as unknown as FormInstance);

  // Track previous formKey
  const prevFormKeyRef = React.useRef(formKey);

  // Reset form when formKey changes
  React.useEffect(() => {
    if (formKey !== undefined && formKey !== prevFormKeyRef.current) {
      form.reset({ values: defaultValues });
      prevFormKeyRef.current = formKey;
    }
  }, [formKey, form, defaultValues]);

  // Navigation guard
  useFormGuard({
    enabled: enableNavigationGuard && form.state.isDirty,
    message: navigationGuardMessage,
  });

  const [submitError, setSubmitError] = React.useState<string | null>(null);

  if (!fields.length) {
    return (
      <EmptyState
        title="No fields to show"
        description="This form has no configurable fields yet."
      />
    );
  }

  const isFormDisabled = disabled || isLoading;

  return (
    <div className="relative" data-testid="schema-form">
      <LoadingOverlay visible={isLoading} message={loadingMessage} />

      <form
        className={className ?? "space-y-6"}
        data-testid="schema-form-element"
        onSubmit={async (e) => {
          e.preventDefault();
          e.stopPropagation();
          try {
            setSubmitError(null);
            await form.handleSubmit();
          } catch (err) {
            const message =
              err instanceof Error
                ? err.message
                : "Unable to submit the form. Please try again.";
            setSubmitError(message);
          }
        }}
      >
        {submitError ? <InlineError message={submitError} /> : null}
        <div className="grid grid-cols-12 gap-x-4 gap-y-5">
          {[...fields]
            .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
            .map((cfg: FieldConfig) => (
              <form.Field key={cfg.name} name={cfg.name}>
                {(field) => {
                  const span = clamp(cfg.colSpan ?? 12, 1, 12);
                  const colClass = getColSpanClass(span);
                  const isRequired = Boolean(cfg.required);
                  const fieldValue = field.state.value as FieldValue;

                  return (
                    <form.Subscribe
                      selector={(s) => ({
                        errors: s.errors,
                        isSubmitted: s.isSubmitted,
                        values: s.values,
                      })}
                    >
                      {({ errors: formErrors, isSubmitted, values }) => {
                        // Check visibility
                        if (
                          !isFieldVisible(
                            cfg.name,
                            cfg.visibleWhen,
                            values as FormValues,
                          )
                        ) {
                          return null;
                        }

                        const extraErrors = getFieldErrors(
                          formErrors as unknown[],
                          cfg.name,
                        );
                        const allErrors: string[] = [
                          ...((field.state.meta.errors ??
                            []) as unknown as string[]),
                          ...extraErrors.map((e) => e.message),
                        ];

                        const showErrors =
                          (field.state.meta.isTouched || isSubmitted) &&
                          allErrors.length > 0;

                        // Filter options based on excludeFrom field
                        const hasOptions =
                          "options" in cfg && Array.isArray(cfg.options);

                        const isGroupedOptions = (
                          items: FieldOption[] | GroupedFieldOptions[],
                        ): items is GroupedFieldOptions[] => {
                          const first = items[0];
                          if (!first) return false;
                          return "heading" in first;
                        };

                        const filterOptions = (
                          items: FieldOption[] | GroupedFieldOptions[],
                          predicate: (option: FieldOption) => boolean,
                        ): FieldOption[] | GroupedFieldOptions[] => {
                          if (isGroupedOptions(items)) {
                            return items
                              .map((group) => ({
                                ...group,
                                options: group.options.filter(predicate),
                              }))
                              .filter((group) => group.options.length > 0);
                          }

                          return items.filter(predicate);
                        };

                        let filteredOptions: FieldOption[]
                          | GroupedFieldOptions[]
                          | undefined = hasOptions
                          ? (cfg.options as FieldOption[] | GroupedFieldOptions[])
                          : undefined;

                        if (cfg.excludeFrom && filteredOptions) {
                          const excludeValue = values?.[cfg.excludeFrom];
                          if (excludeValue !== undefined && excludeValue !== null) {
                            filteredOptions = filterOptions(
                              filteredOptions,
                              (opt) => opt.value !== excludeValue,
                            );
                          }
                        }

                        // Filter options based on filterBy field
                        if (cfg.filterBy && filteredOptions) {
                          const { field, optionKey } = cfg.filterBy;
                          const filterValue = values?.[field];
                          if (filterValue !== undefined && filterValue !== null) {
                            filteredOptions = filterOptions(
                              filteredOptions,
                              (opt) => opt[optionKey] === filterValue,
                            );
                          }
                        }

                        // Handle switch layout
                        if (cfg.type === "switch") {
                          return (
                            <div className={`col-span-12 ${colClass}`}>
                              <div className="flex items-center justify-between py-2">
                                <Label
                                  htmlFor={cfg.name}
                                  className="text-sm font-medium flex items-center gap-1 cursor-pointer"
                                >
                                  {cfg.label}
                                  {isRequired && (
                                    <span className="text-destructive text-sm">
                                      *
                                    </span>
                                  )}
                                </Label>

                             <FieldRenderer
                               cfg={cfg}
                               value={fieldValue}
                               onChange={(val) => {
                                 field.handleChange(val);
                                 onFieldChange?.(cfg.name, val);
                               }}
                               onBlur={field.handleBlur}
                               disabled={
                                 isFormDisabled ||
                                 cfg.disabled ||
                                 disabledFields.includes(cfg.name)
                               }
                             />
                              </div>
                              {showErrors && (
                                <FieldErrors
                                  errors={allErrors}
                                  testId={`error-${cfg.name}`}
                                />
                              )}
                            </div>
                          );
                        }

                        // Handle array type
                        if (cfg.type === "array") {
                          return (
                            <div
                              className={`col-span-12 ${colClass} space-y-1.5`}
                            >
                              <FieldRenderer
                                cfg={cfg}
                                value={fieldValue}
                                onChange={(val) => {
                                  field.handleChange(val);
                                  onFieldChange?.(cfg.name, val);
                                }}
                                onBlur={field.handleBlur}
                                errors={showErrors ? allErrors : []}
                                isSubmitted={isSubmitted}
                                disabled={isFormDisabled || cfg.disabled}
                              />
                            </div>
                          );
                        }

                        // Default layout
                        return (
                          <div
                            className={`col-span-12 ${colClass} space-y-1.5`}
                          >
                            <Label
                              htmlFor={cfg.name}
                              className="text-sm font-medium flex items-center gap-1"
                            >
                              {cfg.label}
                              {isRequired && (
                                <span className="text-destructive text-sm">
                                  *
                                </span>
                              )}
                            </Label>

                            <FieldRenderer
                              cfg={cfg}
                              value={fieldValue}
                              onChange={(val) => {
                                field.handleChange(val);
                                onFieldChange?.(cfg.name, val);
                              }}
                              onBlur={field.handleBlur}
                              disabled={
                                isFormDisabled ||
                                cfg.disabled ||
                                disabledFields.includes(cfg.name)
                              }
                              overrideOptions={filteredOptions}
                            />

                            {showErrors && (
                              <FieldErrors
                                errors={allErrors}
                                testId={`error-${cfg.name}`}
                              />
                            )}
                          </div>
                        );
                      }}
                    </form.Subscribe>
                  );
                }}
              </form.Field>
            ))}
        </div>

        <Separator className="mb-3" />

        <form.Subscribe selector={(s) => [s.canSubmit, s.isSubmitting]}>
          {([canSubmit, isSubmitting]) => {
            if (renderActions) {
              return renderActions({
                form: form as unknown as FormInstance,
                canSubmit: Boolean(canSubmit),
                isSubmitting: Boolean(isSubmitting),
                onCancel,
                onReset,
              });
            }

            return (
              <div className="flex items-center justify-end gap-2">
                {onCancel && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onCancel}
                    disabled={Boolean(isSubmitting) || isFormDisabled}
                  >
                    Cancel
                  </Button>
                )}
                {onReset && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      onReset();
                      form.reset();
                    }}
                    disabled={Boolean(isSubmitting) || isFormDisabled}
                  >
                    Reset
                  </Button>
                )}
                <Button
                  type="submit"
                  disabled={Boolean(isSubmitting) || isFormDisabled}
                  className={onCancel || onReset ? "" : "w-full"}
                >
                  {isSubmitting ? "Submitting…" : submitLabel}
                </Button>
              </div>
            );
          }}
        </form.Subscribe>
      </form>
    </div>
  );
}
