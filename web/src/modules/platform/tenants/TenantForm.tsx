"use client";

import { toast } from "sonner";
import { z } from "zod";
import type { OperationComponentProps } from "@/components/dataTable/types";
import { SchemaForm } from "@/components/form/SchemaForm";
import { useApiMutation } from "@/hooks/useApiMutation";
import { platformTenantsApi } from "@/lib/api/platform-tenants";
import type { Tenant } from "./types";

const tenantFormSchema = z.object({
  name: z
    .string()
    .min(1, "Company name is required")
    .describe(
      JSON.stringify({ label: "Company Name", placeholder: "Acme Inc." }),
    ),
  status: z.enum(["pending", "active", "suspended"]).describe(
    JSON.stringify({
      label: "Status",
      inputType: "select",
      options: [
        { value: "pending", label: "Pending" },
        { value: "active", label: "Active" },
        { value: "suspended", label: "Suspended" },
      ],
    }),
  ),
});

type TenantFormData = z.infer<typeof tenantFormSchema>;

export function TenantForm({
  data,
  onSuccess,
  onCancel: _onCancel,
}: OperationComponentProps<Tenant>) {
  const isEdit = !!data;

  const mutation = useApiMutation<Tenant, TenantFormData>({
    method: isEdit ? "PATCH" : "POST",
    endpoint: isEdit
      ? platformTenantsApi.update.endpoint({ id: data.id })
      : platformTenantsApi.create.endpoint,
    revalidateTags: [platformTenantsApi.getList.key],
  });

  const handleSubmit = async (formData: TenantFormData) => {
    try {
      await mutation.mutateAsync(formData);
      toast.success(isEdit ? "Tenant updated" : "Tenant created");
      onSuccess();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to save tenant";
      toast.error(message);
    }
  };

  return (
    <SchemaForm
      schema={tenantFormSchema}
      defaultValues={
        isEdit
          ? { name: data.name, status: data.status }
          : { name: "", status: "pending" as const }
      }
      onSubmit={handleSubmit}
      submitLabel={isEdit ? "Update" : "Create"}
      isLoading={mutation.isPending}
    />
  );
}
