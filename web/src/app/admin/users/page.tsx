"use client";

import { Suspense, useCallback, useMemo, useState } from "react";
import { z } from "zod";
import { Badge } from "@/components/ui/badge";
import { QueryBuilder } from "@/components/queryBuilder/QueryBuilder";
import { DataTable } from "@/components/dataTable/DataTable";
import type { ColumnGroup } from "@/components/dataTable/types";
import { SchemaForm } from "@/components/form/SchemaForm";
import type { SchemaFormProps } from "@/components/form/types";
import { fieldMeta } from "@/components/form/fieldMeta";
import { useApiQuery } from "@/hooks/useApiQuery";
import { useApiMutation } from "@/hooks/useApiMutation";
import { getQueryClient } from "@/lib/queryClient";
import type { FilterOutput } from "@/components/queryBuilder/types";
import { PageShell } from "@/components/layout/PageShell";
import { PageHeader } from "@/components/layout/PageHeader";

interface RoleOption {
  id: string;
  name: string;
  slug: string;
}

interface TagOption {
  label: string;
  value: string;
}

interface UserRow {
  id: string;
  name: string;
  email: string;
  roleId: string;
  roleName: string;
  tags: string[];
  image: string | string[] | null;
  createdAt: string;
  updatedAt: string;
  [key: string]: unknown;
}

interface RolesResponse {
  roles: RoleOption[];
}

interface TagsResponse {
  tags: TagOption[];
}

type UserFormValues = {
  name: string;
  email: string;
  roleId: string;
  tags: string[];
  image: string | string[] | null;
};

function buildUserSchema(roleOptions: TagOption[], tagOptions: TagOption[]) {
  return z.object({
    name: z
      .string()
      .min(2, "Name must be at least 2 characters")
      .describe(
        fieldMeta({
          label: "Name",
          placeholder: "Enter full name",
          colSpan: 6,
        }),
      ),
    email: z
      .string()
      .email("Enter a valid email")
      .describe(
        fieldMeta({
          label: "Email",
          placeholder: "name@company.com",
          colSpan: 6,
        }),
      ),
    roleId: z
      .string()
      .min(1, "Select a role")
      .describe(
        fieldMeta({
          label: "Role",
          inputType: "select",
          options: roleOptions,
          placeholder: "Select role",
          colSpan: 6,
        }),
      ),
    tags: z
      .array(z.string())
      .optional()
      .describe(
        fieldMeta({
          label: "Tags",
          inputType: "multiselect",
          options: tagOptions,
          colSpan: 6,
        }),
      ),
    image: z
      .union([z.string(), z.array(z.string())])
      .nullable()
      .optional()
      .describe(
        fieldMeta({
          label: "Image",
          inputType: "file",
          accept: "image/*",
          minFiles: 0,
          maxFiles: 1,
        }),
      ),
  });
}

function buildFilterSchema(roleOptions: TagOption[], tagOptions: TagOption[]) {
  return z.object({
    name: z
      .string()
      .optional()
      .describe(
        fieldMeta({
          label: "Name",
          inputType: "text",
        }),
      ),
    email: z
      .string()
      .optional()
      .describe(
        fieldMeta({
          label: "Email",
          inputType: "email",
        }),
      ),
    roleName: z
      .string()
      .optional()
      .describe(
        fieldMeta({
          label: "Role",
          inputType: "select",
          options: roleOptions.map((role) => ({
            label: role.label,
            value: role.label,
          })),
        }),
      ),
    tags: z
      .array(z.string())
      .optional()
      .describe(
        fieldMeta({
          label: "Tags",
          inputType: "multiselect",
          options: tagOptions,
        }),
      ),
  });
}

function UserForm({
  mode,
  data,
  onSuccess,
  onCancel,
  roleOptions,
  tagOptions,
}: {
  mode: "add" | "edit";
  data?: UserRow;
  onSuccess: () => void;
  onCancel: () => void;
  roleOptions: TagOption[];
  tagOptions: TagOption[];
}): React.ReactElement {
  const schema = useMemo(
    () => buildUserSchema(roleOptions, tagOptions),
    [roleOptions, tagOptions],
  );

  const mutation = useApiMutation<unknown, UserFormValues & { id?: string }>({
    endpoint: (values) =>
      mode === "edit" && values.id ? `/api/users/${values.id}` : "/api/users",
    method: mode === "edit" ? "PATCH" : "POST",
    onSuccess: () => {
      const queryClient = getQueryClient();
      void queryClient.invalidateQueries({
        queryKey: ["users"],
        exact: false,
        refetchType: "all",
      });
      onSuccess();
    },
  });

  const defaults: SchemaFormProps<typeof schema>["defaultValues"] =
    mode === "edit" && data
      ? {
          name: data.name,
          email: data.email,
          roleId: data.roleId,
          tags: data.tags ?? [],
          image: data.image ?? null,
        }
      : undefined;

  return (
    <SchemaForm
      schema={schema}
      defaultValues={defaults}
      submitLabel={mode === "edit" ? "Save Changes" : "Create User"}
      onSubmit={async (values) => {
        await mutation.mutateAsync({
          ...(values as UserFormValues),
          id: mode === "edit" ? data?.id : undefined,
        });
      }}
      onCancel={onCancel}
      isLoading={mutation.isPending}
    />
  );
}

export default function UsersPage(): React.ReactElement {
  const [filters, setFilters] = useState<
    (FilterOutput & { search: string }) | null
  >(null);

  const { data: rolesData } = useApiQuery<RolesResponse>({
    key: ["roles"],
    endpoint: "/api/roles",
    requireOrganization: false,
  });

  const { data: tagsData } = useApiQuery<TagsResponse>({
    key: ["tags"],
    endpoint: "/api/tags",
    requireOrganization: false,
  });

  const roleOptions = useMemo<TagOption[]>(
    () =>
      (rolesData?.roles ?? []).map((role) => ({
        label: role.name,
        value: role.id,
      })),
    [rolesData],
  );

  const tagOptions = useMemo<TagOption[]>(
    () => tagsData?.tags ?? [],
    [tagsData],
  );

  const filterSchema = useMemo(
    () => buildFilterSchema(roleOptions, tagOptions),
    [roleOptions, tagOptions],
  );

  const addUserComponent = useCallback(
    ({ onSuccess, onCancel }: { onSuccess: () => void; onCancel: () => void }) => (
      <UserForm
        mode="add"
        onSuccess={onSuccess}
        onCancel={onCancel}
        roleOptions={roleOptions}
        tagOptions={tagOptions}
      />
    ),
    [roleOptions, tagOptions],
  );

  const editUserComponent = useCallback(
    ({ data, onSuccess, onCancel }: { data?: UserRow; onSuccess: () => void; onCancel: () => void }) => (
      <UserForm
        mode="edit"
        data={data}
        onSuccess={onSuccess}
        onCancel={onCancel}
        roleOptions={roleOptions}
        tagOptions={tagOptions}
      />
    ),
    [roleOptions, tagOptions],
  );

  const operations = useMemo(
    () => ({
      add: {
        displayMode: "sheet" as const,
        component: addUserComponent,
      },
      edit: {
        displayMode: "sheet" as const,
        component: editUserComponent,
      },
      delete: {
        displayMode: "dialog" as const,
        api: {
          endpoint: "/api/users/:id",
          method: "DELETE" as const,
          key: ["users"],
        },
        confirmation: {
          title: "Delete user",
          message: "Are you sure you want to delete this user?",
          confirmText: "Delete",
          cancelText: "Cancel",
        },
      },
    }),
    [addUserComponent, editUserComponent],
  );

  const columns = useMemo<ColumnGroup<UserRow>[]>(
    () => [
      {
        id: "user",
        header: null,
        columns: [
          { accessorKey: "name", header: "Name" },
          { accessorKey: "email", header: "Email" },
          { accessorKey: "roleName", header: "Role" },
          {
            accessorKey: "tags",
            header: "Tags",
            cell: ({ row }) => (
              <div className="flex flex-wrap gap-1">
                {(row.original.tags ?? []).map((tag) => (
                  <Badge key={tag} variant="outline">
                    {tag}
                  </Badge>
                ))}
              </div>
            ),
          },
          {
            accessorKey: "image",
            header: "Image",
            cell: ({ row }) =>
              row.original.image ? (
                <Badge variant="secondary">Uploaded</Badge>
              ) : (
                <span className="text-xs text-muted-foreground">None</span>
              ),
          },
        ],
      },
    ],
    [],
  );

  const filtersParam = filters ? JSON.stringify(filters) : undefined;

  return (
    <PageShell>
      <div className="space-y-6">
        <PageHeader
          title="Users"
          description="Manage platform users, roles, and access tags."
        />

        <QueryBuilder
          schema={filterSchema}
          onSubmit={(payload) => setFilters(payload)}
        />

        <Suspense fallback={<div className="text-sm text-muted-foreground">Loading...</div>}>
          <DataTable<UserRow>
            tag="users"
            title="Users"
            moduleKey="platform.users"
            organizationRequired={false}
            fetchData={{
              endpoint: "/api/users",
              method: "GET",
              key: ["users"],
              params: filtersParam ? { filters: filtersParam } : undefined,
            }}
            columnsConfig={columns}
            operations={operations}
          />
        </Suspense>
      </div>
    </PageShell>
  );
}
