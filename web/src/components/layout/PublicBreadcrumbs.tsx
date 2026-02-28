"use client";

import React from "react";
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
import { cn } from "@/lib/utils";

interface PublicBreadcrumbsProps {
  className?: string;
  homeLabel?: string;
  homeHref?: string;
  customCrumbs?: { label: string; href: string; isLast: boolean }[];
}

export function PublicBreadcrumbs({
  className,
  homeLabel = "Home",
  homeHref = "/",
  customCrumbs,
}: PublicBreadcrumbsProps) {
  const generatedCrumbs = useBreadcrumbs();
  const breadcrumbs = customCrumbs || generatedCrumbs;

  return (
    <Breadcrumb className={cn("mb-8", className)}>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink
            href={homeHref}
            className="flex items-center gap-1.5 hover:text-primary transition-colors"
          >
            <Home className="h-3.5 w-3.5" />
            <span>{homeLabel}</span>
          </BreadcrumbLink>
        </BreadcrumbItem>
        {breadcrumbs.map((crumb) => (
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
  );
}
