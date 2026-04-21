import React from "react";
import { cn } from "@/lib/utils";
import { useBreadcrumbs } from "@/hooks/useBreadcrumbs";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { ChevronRight, Home } from "lucide-react";

export function PageHeader({
  title,
  description,
  actions,
  className,
  showBreadcrumbs = true,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
  showBreadcrumbs?: boolean;
}) {
  const breadcrumbs = useBreadcrumbs();

  return (
    <div className={cn("flex flex-col gap-4 mb-8", className)}>
      {showBreadcrumbs && (
        <Breadcrumb className="mb-2">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink
                href="/platform/dashboard"
                className="flex items-center gap-1.5 hover:text-primary transition-colors"
              >
                <Home className="h-3.5 w-3.5" />
                <span>Dashboard</span>
              </BreadcrumbLink>
            </BreadcrumbItem>
            {breadcrumbs.slice(2).map((crumb) => (
              <React.Fragment key={crumb.href}>
                <BreadcrumbSeparator>
                  <ChevronRight className="h-3.5 w-3.5" />
                </BreadcrumbSeparator>
                <BreadcrumbItem>
                  {crumb.isLast ? (
                    <BreadcrumbPage className="font-semibold text-foreground">
                      {crumb.label}
                    </BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink
                      href={crumb.href}
                      className="hover:text-primary transition-colors"
                    >
                      {crumb.label}
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
              </React.Fragment>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      )}

      <div
        className={cn(
          "flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between",
        )}
      >
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight sm:text-4xl">
            {title}
          </h1>
          {description ? (
            <p className="text-sm text-muted-foreground sm:text-base font-medium">
              {description}
            </p>
          ) : null}
        </div>
        {actions ? (
          <div className="flex items-center gap-2">{actions}</div>
        ) : null}
      </div>
    </div>
  );
}
