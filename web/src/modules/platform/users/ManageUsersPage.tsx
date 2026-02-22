"use client";

import { useMemo } from "react";
import { z } from "zod";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/dataTable/DataTable";
import { useApiQuery } from "@/hooks/useApiQuery";
import { platformUsersApi } from "@/lib/api/platform-users";
import { PlatformUserForm } from "./UserForm";
import type { PlatformUser, RoleOption } from "./types";

const filterSchema = z.object({
  name: z.string().optional().describe("Name"),
  email: z.string().optional().describe("Email"),
  roleId: z.string().optional().describe("Role"),
});

export function ManagePlatformUsersPage() {
  const { data: roles } = useApiQuery<RoleOption[]>({
    ...platformUsersApi.roles,
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
        <h1 className="text-3xl font-bold tracking-tight">Platform Users</h1>
        <p className="text-muted-foreground mt-2">
          Manage platform admins and credentials
        </p>
      </div>

      <DataTable<PlatformUser>
        tag={platformUsersApi.getList.key}
        title="Platform Users"
        moduleKey="platform.users"
        fetchData={{
          key: platformUsersApi.getList.key,
          endpoint: platformUsersApi.getList.endpoint,
          method: platformUsersApi.getList.method,
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
                id: "emailVerified",
                accessorKey: "emailVerified",
                header: "Verified",
                cell: ({ row }) =>
                  row.original.emailVerified ? (
                    <Badge>Yes</Badge>
                  ) : (
                    <Badge variant="secondary">No</Badge>
                  ),
              },
            ],
          },
        ]}
        operations={{
          add: {
            component: PlatformUserForm,
            displayMode: "sheet",
            label: "Add User",
          },
          edit: {
            component: PlatformUserForm,
            displayMode: "sheet",
            label: "Edit",
          },
          delete: {
            api: {
              endpoint: platformUsersApi.delete.endpoint,
              method: platformUsersApi.delete.method,
              key: platformUsersApi.delete.key,
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
