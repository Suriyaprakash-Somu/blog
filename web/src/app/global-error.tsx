"use client";

import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="bg-background text-foreground">
        <div className="min-h-screen flex items-center justify-center p-6">
          <div className="w-full max-w-md rounded-lg border bg-card p-6 text-center">
            <h1 className="text-xl font-semibold">App error</h1>
            <p className="text-muted-foreground mt-2 text-sm">
              {error?.message || "An unexpected error occurred."}
            </p>
            <div className="mt-4 flex justify-center">
              <Button onClick={() => reset()}>Reload</Button>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
