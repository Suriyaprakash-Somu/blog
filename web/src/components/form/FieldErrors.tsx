import type { FieldErrorsProps } from "./types";

/**
 * Display field validation errors
 */
export function FieldErrors({
  errors,
  testId,
}: FieldErrorsProps): React.ReactElement | null {
  if (!errors.length) return null;

  return (
    <div className="mt-1 space-y-1" data-testid={testId}>
      {errors.map((error, index) => (
        <p key={`${error}-${index}`} className="text-sm text-destructive">
          {error}
        </p>
      ))}
    </div>
  );
}
