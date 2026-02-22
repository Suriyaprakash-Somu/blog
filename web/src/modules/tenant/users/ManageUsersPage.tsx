"use client";

import { useMemo } from "react";
import { z } from "zod";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/dataTable/DataTable";
import { useApiQuery } from "@/hooks/useApiQuery";
import { tenantUsersApi } from "@/lib/api/tenant-users";
import { TenantUserForm } from "./UserForm";
import type { RoleOption, TenantUser } from "./types";

const filterSchema = z.object({
  name: z.string().optional().describe("Name"),
  email: z.string().optional().describe("Email"),
  roleId: z.string().optional().describe("Role"),
  status: z.enum(["active", "inactive"]).optional().describe("Status"),
});

export function ManageTenantUsersPage() {
  const { data: roles } = useApiQuery<RoleOption[]>({
    ...tenantUsersApi.roles,
    requireOrganization: false,
  });

  const roleNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const role of roles ?? []) {
      map.set(role.id, role.name);
    }
    return map;
  }, [roles]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Users</h1>
        <p className="text-muted-foreground mt-2">
          Manage users in your organization
        </p>
      </div>

      <DataTable<TenantUser>
        tag={tenantUsersApi.getList.key}
        title="Tenant Users"
        moduleKey="tenant.users"
        fetchData={{
          key: tenantUsersApi.getList.key,
          endpoint: tenantUsersApi.getList.endpoint,
          method: tenantUsersApi.getList.method,
        }}
        columnsConfig={[
          {
            id: "main",
            columns: [
              {
                id: "name",
                accessorKey: "name",
                header: "Name",
              },
              {
                id: "email",
                accessorKey: "email",
                header: "Email",
              },
              {
                id: "roleId",
                accessorKey: "roleId",
                header: "Role",
                cell: ({ row }) => {
                  const roleId = row.original.roleId;
                  const roleLabel = roleId ? roleNameById.get(roleId) : undefined;
                  return (
                    <Badge variant="outline">{roleLabel ?? "Unassigned"}</Badge>
                  );
                },
              },
              {
                id: "status",
                accessorKey: "status",
                header: "Status",
                cell: ({ row }) => (
                  <Badge
                    variant={
                      row.original.status === "active" ? "default" : "secondary"
                    }
                  >
                    {row.original.status}
                  </Badge>
                ),
              },
            ],
          },
        ]}
        operations={{
          add: {
            component: TenantUserForm,
            displayMode: "sheet",
            label: "Add User",
          },
          edit: {
            component: TenantUserForm,
            displayMode: "sheet",
            label: "Edit",
          },
          delete: {
            api: {
              endpoint: tenantUsersApi.delete.endpoint,
              method: tenantUsersApi.delete.method,
              key: tenantUsersApi.delete.key,
            },
            confirmation: {
              title: "Delete User",
              message:
                "Are you sure you want to delete this user? Owner users cannot be deleted.",
              confirmText: "Delete",
              cancelText: "Cancel",
            },
          },
        }}
        filterConfig={{
          schema: filterSchema,
        }}
        showPagination={true}
        organizationRequired={false}
      />
    </div>
  );
}
