"use client";

import { useState, useMemo } from "react";
import { z } from "zod";
import { SchemaForm } from "@/components/form/SchemaForm";
import { useApiMutation } from "@/hooks/useApiMutation";
import { useApiQuery } from "@/hooks/useApiQuery";
import { platformFeaturedCollectionsApi } from "@/lib/api/platform-featured-collections";
import { platformFeaturedItemsApi } from "@/lib/api/platform-featured-items";
import { platformBlogPostsApi } from "@/lib/api/platform-blog-posts";
import { platformBlogCategoriesApi } from "@/lib/api/platform-blog-categories";
import { platformBlogTagsApi } from "@/lib/api/platform-blog-tags";
import type { PlatformFeaturedCollection } from "./types";
import type { PlatformFeaturedItem } from "../featuredItems/types";
import type { FieldOption } from "@/components/form/types";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// ─── Item schema (used inside array) ────────────────────────────────────────
const collectionItemSchema = z.object({
  id: z
    .string()
    .optional()
    .describe(JSON.stringify({ excludeFrom: "form" })),
  entityType: z
    .string()
    .optional()
    .describe(JSON.stringify({ excludeFrom: "form" })),
  entityId: z
    .string()
    .min(1, "Select an entity")
    .describe(
      JSON.stringify({
        label: "Entity",
        inputType: "select",
      }),
    ),
  isActive: z
    .boolean()
    .default(true)
    .describe(JSON.stringify({ label: "Active", inputType: "switch" })),
});

// ─── Collection schema ───────────────────────────────────────────────────────
const collectionSchema = z.object({
  name: z.string().min(1, "Name is required").describe("Name"),
  slug: z
    .string()
    .min(1, "Slug is required")
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens")
    .describe("Slug"),
  description: z
    .string()
    .optional()
    .describe(JSON.stringify({ label: "Description", inputType: "textarea" })),
  isActive: z
    .boolean()
    .default(true)
    .describe(JSON.stringify({ label: "Active", inputType: "switch" })),
  items: z
    .array(collectionItemSchema)
    .optional()
    .describe(
      JSON.stringify({
        label: "Featured Items",
        inputType: "array",
        sortable: true,
      }),
    ),
});

type CollectionFormData = z.infer<typeof collectionSchema>;

// Endpoint map for entity types
const ENTITY_ENDPOINTS = {
  POST: platformBlogPostsApi.getList.endpoint,
  CATEGORY: platformBlogCategoriesApi.getList.endpoint,
  TAG: platformBlogTagsApi.getList.endpoint,
} as const;

// ─── Inner Form ──────────────────────────────────────────────────────────────
interface FeaturedCollectionFormInnerProps {
  initialData?: PlatformFeaturedCollection;
  itemsData?: PlatformFeaturedItem[];
  onSuccess?: () => void;
  onCancel?: () => void;
}

function FeaturedCollectionFormInner({
  initialData,
  itemsData = [],
  onSuccess,
  onCancel,
}: FeaturedCollectionFormInnerProps) {
  const isEdit = Boolean(initialData);

  // Derive initial entity type from existing items or default to POST
  const initialEntityType =
    (itemsData[0]?.entityType as "POST" | "CATEGORY" | "TAG") ?? "POST";

  const [entityType, setEntityType] = useState<"POST" | "CATEGORY" | "TAG">(
    initialEntityType,
  );

  // Fetch entities based on selected type
  const { data: entitiesData } = useApiQuery<{
    rows: Array<{ id: string; title?: string; name?: string }>;
  }>({
    key: ["entity-list", entityType],
    endpoint: ENTITY_ENDPOINTS[entityType],
    enabled: true,
    requireOrganization: false,
  });

  // Map fetched entities to select options
  const entityOptions: FieldOption[] = useMemo(() => {
    const rows = entitiesData?.rows || [];
    return rows.map((entity) => ({
      label: entity.title || entity.name || entity.id,
      value: entity.id,
    }));
  }, [entitiesData]);

  const mutation = useApiMutation<
    PlatformFeaturedCollection,
    CollectionFormData & { id?: string }
  >({
    method: isEdit ? "PUT" : "POST",
    endpoint: isEdit
      ? platformFeaturedCollectionsApi.update.endpoint({ id: initialData!.id })
      : platformFeaturedCollectionsApi.create.endpoint,
    revalidateTags: [platformFeaturedCollectionsApi.getList.key],
  });

  const handleSubmit = async (values: CollectionFormData) => {
    try {
      // Stamp each item with the entity type and order; strip empty id for new items
      const itemsPayload = values.items?.map((item, index) => ({
        ...(item.id ? { id: item.id } : {}),
        entityId: item.entityId,
        isActive: item.isActive,
        entityType,
        order: index + 1,
      }));

      await mutation.mutateAsync({ ...values, items: itemsPayload });
      toast.success(isEdit ? "Collection updated" : "Collection created");
      if (onSuccess) onSuccess();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to save collection",
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Entity Type — collection-level, outside SchemaForm */}
      <div className="space-y-1.5">
        <Label className="text-sm font-medium">Content Type</Label>
        <Select
          value={entityType}
          onValueChange={(v) => setEntityType(v as "POST" | "CATEGORY" | "TAG")}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="POST">Posts</SelectItem>
            <SelectItem value="CATEGORY">Categories</SelectItem>
            <SelectItem value="TAG">Tags</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          All items in this collection will be of the same type.
        </p>
      </div>

      {/* SchemaForm handles everything: collection fields + items array */}
      <SchemaForm
        schema={collectionSchema}
        defaultValues={
          initialData
            ? {
                name: initialData.name,
                slug: initialData.slug,
                description: initialData.description ?? undefined,
                isActive: initialData.isActive,
                items: itemsData.map((item) => ({
                  id: item.id,
                  entityType: item.entityType,
                  entityId: item.entityId,
                  isActive: item.isActive,
                })),
              }
            : { isActive: true, items: [] }
        }
        onSubmit={handleSubmit}
        onCancel={onCancel}
        submitLabel={isEdit ? "Update Collection" : "Create Collection"}
        isLoading={mutation.isPending}
        fieldOptionsMap={{
          "items.entityId": entityOptions,
        }}
      />
    </div>
  );
}

// ─── Outer wrapper (fetches existing items) ──────────────────────────────────
interface FeaturedCollectionFormProps {
  data?: PlatformFeaturedCollection;
  initialData?: PlatformFeaturedCollection;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function FeaturedCollectionForm({
  data,
  initialData,
  onSuccess,
  onCancel,
}: FeaturedCollectionFormProps) {
  const collectionData = data || initialData;

  const { data: itemsResponse, isLoading } = useApiQuery<{
    rows: PlatformFeaturedItem[];
  }>({
    key: ["platform-featured-items", collectionData?.id || "new"],
    endpoint: platformFeaturedItemsApi.getList.endpoint,
    queryParams: {
      filters: JSON.stringify({ collectionId: collectionData?.id }),
      sorting: "order:asc",
    },
    enabled: Boolean(collectionData?.id),
    requireOrganization: false,
  });

  if (Boolean(collectionData?.id) && isLoading) {
    return (
      <div className="flex justify-center p-8 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading items...</span>
      </div>
    );
  }

  return (
    <FeaturedCollectionFormInner
      initialData={collectionData}
      itemsData={itemsResponse?.rows || []}
      onSuccess={onSuccess}
      onCancel={onCancel}
    />
  );
}
