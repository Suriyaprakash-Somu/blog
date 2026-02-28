import type { ReactNode, RefObject } from "react";
import type { z } from "zod";

// =============================================================================
// Field Types
// =============================================================================

/**
 * All supported field types
 */
export type FieldType =
  | "text"
  | "email"
  | "password"
  | "number"
  | "date"
  | "time"
  | "datetime"
  | "textarea"
  | "select"
  | "multiselect"
  | "radio"
  | "checkbox"
  | "switch"
  | "file"
  | "array"
  | "autocomplete"
  | "map-picker"
  | "markdown"
  | "icon-picker";

/**
 * Option for select/radio/multiselect fields
 */
export interface FieldOption {
  label: string;
  value: string | number;
  [key: string]: unknown;
}

/**
 * Grouped options for select fields
 */
export interface GroupedFieldOptions {
  heading: string;
  options: FieldOption[];
}

/**
 * Visibility condition for conditional fields
 */
export interface VisibilityCondition {
  field: string;
  operator:
  | "equals"
  | "notEquals"
  | "contains"
  | "notContains"
  | "greaterThan"
  | "lessThan";
  value: unknown;
}

/**
 * Filter configuration for dependent dropdowns
 */
export interface FilterByConfig {
  field: string;
  optionKey: string;
}

// =============================================================================
// Field Configuration
// =============================================================================

/**
 * Base field configuration
 */
export interface BaseFieldConfig {
  name: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  colSpan?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
  order?: number;
  visibleWhen?: VisibilityCondition;
  excludeFrom?: string;
  filterBy?: FilterByConfig;
}

/**
 * Text field configuration
 */
export interface TextFieldConfig extends BaseFieldConfig {
  type: "text" | "email" | "password" | "textarea";
}

/**
 * Number field configuration
 */
export interface NumberFieldConfig extends BaseFieldConfig {
  type: "number";
  min?: number;
  max?: number;
  step?: number;
}

/**
 * Date/Time field configuration
 */
export interface DateFieldConfig extends BaseFieldConfig {
  type: "date" | "time" | "datetime";
}

/**
 * Select field configuration
 */
export interface SelectFieldConfig extends BaseFieldConfig {
  type: "select" | "radio" | "autocomplete";
  options?: FieldOption[] | GroupedFieldOptions[];
  emptyIndicator?: string;
}

/**
 * MultiSelect field configuration
 */
export interface MultiSelectFieldConfig extends BaseFieldConfig {
  type: "multiselect";
  options?: FieldOption[];
  maxCount?: number;
}

/**
 * Checkbox/Switch field configuration
 */
export interface BooleanFieldConfig extends BaseFieldConfig {
  type: "checkbox" | "switch";
}

/**
 * File field configuration
 */
export interface FileFieldConfig extends BaseFieldConfig {
  type: "file";
  accept?: string;
  maxSizeBytes?: number;
  maxFiles?: number;
  maxTotalSizeBytes?: number;
  minFiles?: number;
  uploadMode?: "auth" | "public";
}

/**
 * Array field configuration
 */
export interface ArrayFieldConfig extends BaseFieldConfig {
  type: "array";
  singularLabel?: string;
  arrayItemSchema: FieldConfig[];
  sortable?: boolean;
}

/**
 * Map picker field configuration
 */
export interface MapPickerFieldConfig extends BaseFieldConfig {
  type: "map-picker";
}

export interface MarkdownFieldConfig extends BaseFieldConfig {
  type: "markdown";
  height?: number;
}

export interface IconPickerFieldConfig extends BaseFieldConfig {
  type: "icon-picker";
}


export interface MapValue {
  lat: number;
  lng: number;
  addressLine?: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;
}

/**
 * Union of all field configurations
 */
export type FieldConfig =
  | TextFieldConfig
  | NumberFieldConfig
  | DateFieldConfig
  | SelectFieldConfig
  | MultiSelectFieldConfig
  | BooleanFieldConfig
  | FileFieldConfig
  | ArrayFieldConfig
  | MapPickerFieldConfig
  | MarkdownFieldConfig
  | IconPickerFieldConfig;

// =============================================================================
// Form Values
// =============================================================================

/**
 * Form values type
 */
export type FormValues = Record<string, unknown>;

/**
 * Array item with local ID for tracking
 */
export interface ArrayItemWithLocalId {
  __localId: string;
  [key: string]: unknown;
}

/**
 * Typed map of values for each field config
 */
export type FieldValueByConfig<C extends FieldConfig> =
  C extends TextFieldConfig
  ? string
  : C extends NumberFieldConfig
  ? string
  : C extends DateFieldConfig
  ? string
  : C extends SelectFieldConfig
  ? string | number
  : C extends MultiSelectFieldConfig
  ? Array<string | number>
  : C extends BooleanFieldConfig
  ? boolean
  : C extends FileFieldConfig
  ? string | string[] | null
  : C extends ArrayFieldConfig
  ? ArrayItemWithLocalId[]
  : C extends MapPickerFieldConfig
  ? MapValue | null
  : C extends IconPickerFieldConfig
  ? string
  : string;

// =============================================================================
// Validation
// =============================================================================

/**
 * Field errors map
 */
export type FieldErrors = Record<string, string[]>;

/**
 * Validation result
 */
export interface ValidationResult<T = unknown> {
  success: boolean;
  data?: T;
  errors?: FieldErrors;
}

// =============================================================================
// Schema Form Props
// =============================================================================

/**
 * Form instance reference
 */
export interface FormInstance {
  reset: (options?: { values?: FormValues }) => void;
  handleSubmit: () => Promise<void>;
  setFieldValue: (field: string, value: unknown) => void;
  state: {
    isDirty: boolean;
    isSubmitting: boolean;
    canSubmit: boolean;
    values: FormValues;
  };
}

/**
 * Custom render actions props
 */
export interface RenderActionsProps {
  form: FormInstance;
  canSubmit: boolean;
  isSubmitting: boolean;
  onCancel?: () => void;
  onReset?: () => void;
}

/**
 * SchemaForm component props
 */
export interface SchemaFormProps<T extends z.ZodTypeAny = z.ZodTypeAny> {
  /** Zod schema for validation */
  schema: T;
  /** Submit handler */
  onSubmit?: (data: z.infer<T>) => void | Promise<void>;
  /** Submit button label */
  submitLabel?: string;
  /** Custom className for form */
  className?: string;
  /** Default values */
  defaultValues?: Partial<z.infer<T>>;
  /** Key to trigger form reset */
  formKey?: string | number;
  /** Cancel handler */
  onCancel?: () => void;
  /** Reset handler */
  onReset?: () => void;
  /** Custom actions renderer */
  renderActions?: (props: RenderActionsProps) => ReactNode;
  /** Fields that should be disabled */
  disabledFields?: string[];
  /** Field change callback */
  onFieldChange?: (name: string, value: unknown) => void;
  /** Loading state */
  isLoading?: boolean;
  /** Loading message */
  loadingMessage?: string;
  /** Disable entire form */
  disabled?: boolean;
  /** Enable navigation guard */
  enableNavigationGuard?: boolean;
  /** Navigation guard message */
  navigationGuardMessage?: string;
  /** Form instance ref */
  formRef?: RefObject<FormInstance | null>;
  /** Dynamic options for fields inside arrays: { "arrayName.fieldName": options } */
  fieldOptionsMap?: Record<string, FieldOption[]>;
}

// =============================================================================
// Field Renderer Props
// =============================================================================

/**
 * FieldRenderer component props
 */
export type FieldValue = FieldValueByConfig<FieldConfig>;

export interface FieldRendererProps {
  cfg: FieldConfig;
  id?: string;
  value: FieldValue;
  onChange: (value: FieldValue) => void;
  onBlur?: () => void;
  disabled?: boolean;
  overrideOptions?: FieldOption[] | GroupedFieldOptions[];
  errors?: string[];
  isSubmitted?: boolean;
  /** Dynamic options for sub-fields inside arrays */
  fieldOptionsMap?: Record<string, FieldOption[]>;
}

/**
 * FieldArray component props
 */
export interface FieldArrayProps {
  name: string;
  label: string;
  singularLabel?: string;
  itemFields: FieldConfig[];
  value: ArrayItemWithLocalId[];
  onChange: (value: ArrayItemWithLocalId[]) => void;
  onBlur?: () => void;
  errors?: string[];
  disabled?: boolean;
  isSubmitted?: boolean;
  /** Dynamic options for sub-fields: { "fieldName": options } */
  fieldOptionsMap?: Record<string, FieldOption[]>;
}

/**
 * FieldErrors component props
 */
export interface FieldErrorsProps {
  errors: string[];
  testId?: string;
}

/**
 * FileUploadField props
 */
export interface FileUploadFieldProps {
  value: string | string[] | null;
  onChange: (value: string | string[] | null) => void;
  disabled?: boolean;
  accept?: string;
  maxSizeBytes?: number;
  maxFiles?: number;
  maxTotalSizeBytes?: number;
  uploadMode?: "auth" | "public";
}

/**
 * MapPicker props
 */
export interface MapPickerProps {
  value: MapValue | null;
  onChange: (value: MapValue | null) => void;
  disabled?: boolean;
}

/**
 * LoadingOverlay props
 */
export interface LoadingOverlayProps {
  visible: boolean;
  message?: string;
}
