"use client";

import { useRef } from "react";
import { toast } from "sonner";
import { z } from "zod";
import type { OperationComponentProps } from "@/components/dataTable/types";
import { SchemaForm } from "@/components/form/SchemaForm";
import { type FormInstance } from "@/components/form/types";
import { useApiMutation } from "@/hooks/useApiMutation";
import { tenantBranchesApi } from "@/lib/api/tenant-branches";
import type { Branch } from "./types";
import { BRANCH_TYPES } from "./types";

// Zod schema for branch form
const branchFormSchema = z.object({
  name: z
    .string()
    .min(1, "Branch name is required")
    .describe(
      JSON.stringify({
        label: "Branch Name",
        placeholder: "Main Farm",
        colSpan: 6,
      }),
    ),
  code: z
    .string()
    .optional()
    .describe(
      JSON.stringify({
        label: "Branch Code",
        placeholder: "MF-001",
        colSpan: 6,
      }),
    ),
  type: z
    .enum(BRANCH_TYPES)
    .default("farm")
    .describe(
      JSON.stringify({
        label: "Branch Type",
        inputType: "select",
        options: [
          { value: "farm", label: "Farm" },
          { value: "outlet", label: "Outlet" },
          { value: "warehouse", label: "Warehouse" },
          { value: "office", label: "Office" },
        ],
        colSpan: 6,
      }),
    ),
  isHeadquarters: z
    .boolean()
    .default(false)
    .describe(
      JSON.stringify({
        label: "Is Headquarters",
        inputType: "switch",
        colSpan: 6,
      }),
    ),
  imageFileId: z
    .string()
    .min(1, "Branch image is required")
    .describe(
      JSON.stringify({
        label: "Branch Image",
        inputType: "file",
        accept: "image/*",
        maxSizeBytes: 5 * 1024 * 1024, // 5MB
        colSpan: 12,
      }),
    ),
  // Map picker field - used to populate other address fields
  mapLocation: z
    .object({
      lat: z.number().optional(),
      lng: z.number().optional(),
      addressLine: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      country: z.string().optional(),
      pincode: z.string().optional(),
    })
    .optional()
    .describe(
      JSON.stringify({
        label: "Location",
        inputType: "map-picker",
        colSpan: 12,
      }),
    ),
  addressLine1: z
    .string()
    .optional()
    .describe(
      JSON.stringify({
        label: "Address Line 1",
        placeholder: "Street address, building name",
        colSpan: 6,
      }),
    ),
  addressLine2: z
    .string()
    .optional()
    .describe(
      JSON.stringify({
        label: "Address Line 2",
        placeholder: "Area, landmark",
        colSpan: 6,
      }),
    ),
  city: z
    .string()
    .optional()
    .describe(
      JSON.stringify({
        label: "City",
        placeholder: "City name",
        colSpan: 6,
      }),
    ),
  state: z
    .string()
    .optional()
    .describe(
      JSON.stringify({
        label: "State",
        placeholder: "Populated from map",
        disabled: true,
        colSpan: 6,
      }),
    ),
  country: z
    .string()
    .optional()
    .describe(
      JSON.stringify({
        label: "Country",
        placeholder: "Populated from map",
        disabled: true,
        colSpan: 6,
      }),
    ),
  pincode: z
    .string()
    .optional()
    .describe(
      JSON.stringify({
        label: "Pincode",
        placeholder: "Postal code",
        colSpan: 6,
      }),
    ),
  latitude: z
    .string()
    .optional()
    .describe(
      JSON.stringify({
        label: "Latitude",
        disabled: true,
        colSpan: 6,
      }),
    ),
  longitude: z
    .string()
    .optional()
    .describe(
      JSON.stringify({
        label: "Longitude",
        disabled: true,
        colSpan: 6,
      }),
    ),
  phone: z
    .string()
    .optional()
    .describe(
      JSON.stringify({
        label: "Phone",
        placeholder: "+91 98765 43210",
        colSpan: 6,
      }),
    ),
  email: z
    .string()
    .email("Invalid email address")
    .describe(
      JSON.stringify({
        label: "Email",
        placeholder: "branch@example.com",
        colSpan: 6,
      }),
    ),
  gstin: z
    .string()
    .optional()
    .describe(
      JSON.stringify({
        label: "GSTIN",
        placeholder: "22AAAAA0000A1Z5",
        colSpan: 6,
      }),
    ),
});

type BranchFormData = z.infer<typeof branchFormSchema>;

export function BranchForm({
  data,
  onSuccess,
}: OperationComponentProps<Branch>) {
  const isEdit = !!data;
  const formRef = useRef<FormInstance>(null);

  const mutation = useApiMutation<Branch, BranchFormData>({
    method: isEdit ? "PUT" : "POST",
    endpoint: isEdit
      ? tenantBranchesApi.update.endpoint({ id: data.id })
      : tenantBranchesApi.create.endpoint,
    revalidateTags: [tenantBranchesApi.getList.key],
  });

  const handleSubmit = async (formData: BranchFormData) => {
    try {
      // Transform form data to API format (exclude mapLocation, use flat fields)
      const { mapLocation: _mapLocation, ...apiData } = formData;

      await mutation.mutateAsync(apiData as unknown as BranchFormData);
      toast.success(isEdit ? "Branch updated" : "Branch created");
      onSuccess();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to save branch";
      toast.error(message);
    }
  };

  return (
    <SchemaForm
      formRef={formRef}
      schema={branchFormSchema}
      defaultValues={
        isEdit
          ? {
              name: data.name,
              code: data.code ?? "",
              type: data.type,
              isHeadquarters: data.isHeadquarters,
              imageFileId: data.imageFileId ?? "",
              addressLine1: data.addressLine1 ?? "",
              addressLine2: data.addressLine2 ?? "",
              city: data.city ?? "",
              state: data.state ?? "",
              country: data.country ?? "",
              pincode: data.pincode ?? "",
              latitude: data.latitude ?? "",
              longitude: data.longitude ?? "",
              phone: data.phone ?? "",
              email: data.email ?? "",
              gstin: data.gstin ?? "",
              mapLocation:
                data.latitude && data.longitude
                  ? {
                      lat: parseFloat(data.latitude),
                      lng: parseFloat(data.longitude),
                      city: data.city ?? undefined,
                      state: data.state ?? undefined,
                      country: data.country ?? undefined,
                      pincode: data.pincode ?? undefined,
                    }
                  : undefined,
            }
          : {
              name: "",
              type: "farm" as const,
              isHeadquarters: false,
              imageFileId: "",
            }
      }
      onSubmit={handleSubmit}
      submitLabel={isEdit ? "Update Branch" : "Create Branch"}
      isLoading={mutation.isPending}
      onFieldChange={(fieldName, nextValue) => {
        // Sync map picker values to address fields
        if (fieldName === "mapLocation" && nextValue && formRef.current) {
          const { lat, lng, city, state, country, pincode, addressLine } =
            nextValue as {
              lat?: number;
              lng?: number;
              city?: string;
              state?: string;
              country?: string;
              pincode?: string;
              addressLine?: string;
            };

          if (lat) formRef.current.setFieldValue("latitude", String(lat));
          if (lng) formRef.current.setFieldValue("longitude", String(lng));
          if (city) formRef.current.setFieldValue("city", city);
          if (state) formRef.current.setFieldValue("state", state);
          if (country) formRef.current.setFieldValue("country", country);
          if (pincode) formRef.current.setFieldValue("pincode", pincode);
          if (addressLine)
            formRef.current.setFieldValue("addressLine1", addressLine);
        }
      }}
    />
  );
}
