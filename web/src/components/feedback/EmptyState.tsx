import { Button } from "@/components/ui/button";

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
}) {
  return (
    <div className="rounded-lg border bg-card p-6 text-center">
      <h3 className="text-base font-semibold">{title}</h3>
      {description ? (
        <p className="text-muted-foreground mt-2 text-sm">{description}</p>
      ) : null}
      {action ? (
        <div className="mt-4 flex justify-center">
          <Button onClick={action.onClick} size="sm">
            {action.label}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
