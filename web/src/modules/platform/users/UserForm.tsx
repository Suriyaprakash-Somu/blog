"use client";

import { useMemo } from "react";
import { toast } from "sonner";
import { z } from "zod";
import type { OperationComponentProps } from "@/components/dataTable/types";
import { SchemaForm } from "@/components/form/SchemaForm";
import { useApiMutation } from "@/hooks/useApiMutation";
import { useApiQuery } from "@/hooks/useApiQuery";
import { platformUsersApi } from "@/lib/api/platform-users";
import { PASSWORD_REQUIREMENTS_TEXT, passwordSchema } from "@/lib/validation/password";
import type { PlatformUser, PlatformUserFormData, RoleOption } from "./types";

type RoleSlug = "owner" | "admin" | "manager" | "member";

const baseSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .describe(
      JSON.stringify({
        label: "Name",
        placeholder: "User name",
        colSpan: 6,
      })
    ),
  email: z
    .string()
    .email("Valid email is required")
    .describe(
      JSON.stringify({
        label: "Email",
        placeholder: "user@example.com",
        inputType: "email",
        colSpan: 6,
      })
    ),
  emailVerified: z
    .boolean()
    .default(false)
    .describe(
      JSON.stringify({
        label: "Email verified",
        inputType: "switch",
        colSpan: 6,
      })
    ),
  roleSlug: z
    .enum(["owner", "admin", "manager", "member"])
    .describe(
      JSON.stringify({
        label: "Role",
        inputType: "select",
        options: [],
        colSpan: 6,
      })
    ),
  password: passwordSchema()
    .optional()
    .describe(
      JSON.stringify({
        label: "Password",
        placeholder: PASSWORD_REQUIREMENTS_TEXT,
        inputType: "password",
        colSpan: 12,
      })
    ),
});

export function PlatformUserForm({
  data,
  onSuccess,
}: OperationComponentProps<PlatformUser>) {
  const isEdit = Boolean(data);
  const editData = data;

  const { data: roles } = useApiQuery<RoleOption[]>({
    ...platformUsersApi.roles,
    requireOrganization: false,
  });

  const roleOptions = useMemo(
    () =>
      (roles ?? []).map((role) => ({
        value: role.slug,
        label: role.name,
      })),
    [roles]
  );

  const roleSlugById = useMemo(() => {
    const map = new Map<string, RoleSlug>();
    for (const role of roles ?? []) {
      map.set(role.id, role.slug as RoleSlug);
    }
    return map;
  }, [roles]);

  const schema = useMemo(
    () =>
      baseSchema.extend({
        roleSlug: z
          .enum(["owner", "admin", "manager", "member"])
          .describe(
            JSON.stringify({
              label: "Role",
              inputType: "select",
              options: roleOptions,
              colSpan: 6,
            })
          ),
      }),
    [roleOptions]
  );

  const mutation = useApiMutation<PlatformUser, PlatformUserFormData>({
    endpoint: isEdit
      ? platformUsersApi.update.endpoint({ id: editData!.id })
      : platformUsersApi.create.endpoint,
    method: isEdit ? "PUT" : "POST",
    revalidateTags: [platformUsersApi.getList.key],
  });

  const handleSubmit = async (values: PlatformUserFormData) => {
    try {
      const payload: PlatformUserFormData = {
        ...values,
        password: values.password?.trim() ? values.password : undefined,
      };

      if (!isEdit && !payload.password) {
        toast.error("Password is required for new users");
        return;
      }

      await mutation.mutateAsync(payload);
      toast.success(isEdit ? "User updated" : "User created");
      onSuccess();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to save user";
      toast.error(message);
    }
  };

  return (
    <SchemaForm
      schema={schema}
      defaultValues={
        isEdit
          ? {
              name: editData!.name,
              email: editData!.email,
              emailVerified: editData!.emailVerified,
              roleSlug:
                (editData!.roleId ? roleSlugById.get(editData!.roleId) : undefined) ??
                "member",
              password: "",
            }
          : {
              name: "",
              email: "",
              roleSlug: "member" as const,
              emailVerified: false,
              password: "",
            }
      }
      onSubmit={handleSubmit}
      submitLabel={isEdit ? "Update User" : "Create User"}
      isLoading={mutation.isPending}
    />
  );
}
