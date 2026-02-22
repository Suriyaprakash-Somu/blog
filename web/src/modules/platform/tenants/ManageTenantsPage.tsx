"use client";

import { z } from "zod";
import { LogIn } from "lucide-react";
import { DataTable } from "@/components/dataTable/DataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { platformTenantsApi } from "@/lib/api/platform-tenants";
import { clientFetch } from "@/lib/client-fetch";
import { Actions, Subjects, useAbility } from "@/lib/casl";
import { TenantForm } from "./TenantForm";
import type { Tenant } from "./types";

// Zod schema for QueryBuilder filtering
const tenantFilterSchema = z.object({
  name: z.string().optional().describe("Organization Name"),
  status: z
    .enum(["active", "pending", "suspended"])
    .optional()
    .describe("Status"),
});

export function ManageTenantsPage() {
  const ability = useAbility();
  const canImpersonate = ability.can(Actions.UPDATE, Subjects.TENANT);

  const handleImpersonate = async (tenant: Tenant) => {
    if (!tenant.ownerId) {
      toast.error("No active owner found for this tenant");
      return;
    }

    try {
      await clientFetch(platformTenantsApi.impersonateLogin.endpoint, {
        method: platformTenantsApi.impersonateLogin.method,
        body: {
          userId: tenant.ownerId,
          tenantId: tenant.id,
        },
      });
      window.location.href = "/tenant/dashboard";
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to impersonate tenant owner";
      toast.error(message);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Tenants</h1>
        <p className="text-muted-foreground mt-2">
          Manage tenant accounts and approval status
        </p>
      </div>

      <DataTable<Tenant>
        tag="platform-tenants"
        title="Tenants"
        moduleKey="platform.tenants"
        fetchData={{
          key: platformTenantsApi.getList.key,
          endpoint: platformTenantsApi.getList.endpoint,
          method: platformTenantsApi.getList.method,
        }}
        columnsConfig={[
          {
            id: "main",
            columns: [
              {
                id: "name",
                accessorKey: "name",
                header: "Organization",
                cell: ({ row }) => (
                  <div>
                    <div className="font-medium">{row.original.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {row.original.slug}
                    </div>
                  </div>
                ),
              },
              {
                id: "status",
                accessorKey: "status",
                header: "Status",
                cell: ({ row }) => (
                  <Badge
                    variant={
                      row.original.status === "active"
                        ? "default"
                        : row.original.status === "pending"
                          ? "secondary"
                          : "destructive"
                    }
                    className="capitalize"
                  >
                    {row.original.status}
                  </Badge>
                ),
              },
              {
                id: "owner",
                accessorKey: "ownerEmail",
                header: "Owner",
                cell: ({ row }) => (
                  <div>
                    <div className="text-sm font-medium">{row.original.ownerName || "-"}</div>
                    <div className="text-xs text-muted-foreground">{row.original.ownerEmail || "-"}</div>
                  </div>
                ),
              },
              {
                id: "createdAt",
                accessorKey: "createdAt",
                header: "Created",
                cell: ({ row }) => (
                  <span className="text-sm text-muted-foreground">
                    {row.original.createdAt
                      ? new Date(row.original.createdAt).toLocaleDateString()
                      : "-"}
                    </span>
                  ),
                },
              ...(canImpersonate
                ? [
                    {
                      id: "impersonate",
                      header: "Login",
                      cell: ({ row }: { row: { original: Tenant } }) => (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          title="Login as tenant owner"
                          onClick={() => handleImpersonate(row.original)}
                          disabled={!row.original.ownerId || row.original.status !== "active"}
                        >
                          <LogIn className="h-4 w-4" />
                        </Button>
                      ),
                    },
                  ]
                : []),
            ],
          },
        ]}
        operations={{
          edit: {
            component: TenantForm,
            displayMode: "sheet",
            label: "Edit",
          },
        }}
        filterConfig={{
          schema: tenantFilterSchema,
        }}
        showPagination={true}
        organizationRequired={false}
      />
    </div>
  );
}
