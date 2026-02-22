export function LoadingState({ label = "Loading..." }: { label?: string }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border bg-card px-4 py-3 text-sm text-muted-foreground">
      <div className="size-4 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-primary" />
      <span>{label}</span>
    </div>
  );
}
