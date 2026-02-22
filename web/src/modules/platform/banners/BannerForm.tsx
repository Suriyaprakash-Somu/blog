"use client";

import { useRef } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { SchemaForm } from "@/components/form/SchemaForm";
import { type FormInstance } from "@/components/form/types";
import { useApiMutation } from "@/hooks/useApiMutation";
import { platformBannersApi } from "@/lib/api/platform-banners";
import type { OperationComponentProps } from "@/components/dataTable/types";
import type { BannerTargetSegment, PlatformBanner } from "./types";

const bannerFormSchema = z.object({
  title: z.string().min(2, "Title is required").describe("Title"),
  description: z.string().optional().describe("Description"),
  pathPattern: z.string().min(1, "Path pattern is required").describe("Path Pattern"),
  type: z
    .enum(["HEADER", "CTA"])
    .default("HEADER")
    .describe(
      JSON.stringify({
        label: "Type",
        inputType: "select",
        options: [
          { value: "HEADER", label: "Header" },
          { value: "CTA", label: "CTA" },
        ],
      }),
    ),
  slot: z.string().optional().describe("Slot"),
  targetSegments: z
    .array(z.enum(["GUEST", "USER"]))
    .default([])
    .describe(
      JSON.stringify({
        label: "Target Audience",
        inputType: "multiselect",
        options: [
          { value: "GUEST", label: "Guest" },
          { value: "USER", label: "User" },
        ],
      }),
    ),
  imageFileId: z
    .string()
    .optional()
    .describe(
      JSON.stringify({
        label: "Background Image",
        inputType: "file",
        accept: "image/jpeg,image/png,image/webp,image/gif",
        minFiles: 0,
        maxFiles: 1,
      }),
    ),
  variant: z
    .enum(["banner", "hero", "fullscreen"])
    .default("banner")
    .describe(
      JSON.stringify({
        label: "Variant",
        inputType: "select",
        options: [
          { value: "banner", label: "Banner" },
          { value: "hero", label: "Hero" },
          { value: "fullscreen", label: "Fullscreen" },
        ],
      }),
    ),
  align: z
    .enum(["left", "center", "right"])
    .default("left")
    .describe(
      JSON.stringify({
        label: "Align",
        inputType: "select",
        options: [
          { value: "left", label: "Left" },
          { value: "center", label: "Center" },
          { value: "right", label: "Right" },
        ],
      }),
    ),
  verticalAlign: z
    .enum(["top", "center", "bottom"])
    .default("center")
    .describe(
      JSON.stringify({
        label: "Vertical Align",
        inputType: "select",
        options: [
          { value: "top", label: "Top" },
          { value: "center", label: "Center" },
          { value: "bottom", label: "Bottom" },
        ],
      }),
    ),
  overlay: z.coerce.number().min(0).max(1).default(0).describe("Overlay (0 to 1)"),
  theme: z
    .enum(["light", "dark"])
    .default("light")
    .describe(
      JSON.stringify({
        label: "Theme",
        inputType: "select",
        options: [
          { value: "light", label: "Light" },
          { value: "dark", label: "Dark" },
        ],
      }),
    ),
  linkUrl: z.string().optional().describe("Banner Link URL"),
  action1Label: z.string().optional().describe("Button 1 Label"),
  action1Url: z.string().optional().describe("Button 1 URL"),
  action2Label: z.string().optional().describe("Button 2 Label"),
  action2Url: z.string().optional().describe("Button 2 URL"),
  startDate: z.string().optional().describe("Start Date"),
  endDate: z.string().optional().describe("End Date"),
  isActive: z.boolean().default(true).describe("Active"),
});

type BannerFormData = z.infer<typeof bannerFormSchema>;

type BannerAction = {
  label: string;
  href: string;
  variant: "default" | "outline";
};

type BannerBackground = {
  type: "color" | "image" | "gradient";
  value: string;
  overlay?: number;
};

type BannerProps = {
  variant: "banner" | "hero" | "fullscreen";
  align: "left" | "center" | "right";
  verticalAlign: "top" | "center" | "bottom";
  theme: "light" | "dark";
  href?: string | null;
  actions?: BannerAction[];
  background?: BannerBackground;
};

type BannerPayload = {
  title: string;
  description: string | null;
  pathPattern: string;
  type: BannerFormData["type"];
  slot: string | null;
  targetSegments: BannerTargetSegment[];
  imageFileId: string | null;
  isActive: boolean;
  startDate: string | null;
  endDate: string | null;
  props: BannerProps;
};

export function BannerForm({ data, onSuccess }: OperationComponentProps<PlatformBanner>) {
  const formRef = useRef<FormInstance>(null);
  const isEdit = Boolean(data);

  const mutation = useApiMutation<PlatformBanner, BannerPayload & { id?: string }>({
    method: isEdit ? "PUT" : "POST",
    endpoint: isEdit
      ? platformBannersApi.update.endpoint({ id: data!.id })
      : platformBannersApi.create.endpoint,
    revalidateTags: [platformBannersApi.getList.key, platformBannersApi.getActive.key],
  });

  const handleSubmit = async (values: BannerFormData) => {
    const props: BannerProps = {
      variant: values.variant,
      align: values.align,
      verticalAlign: values.verticalAlign,
      theme: values.theme,
      href: values.linkUrl || null,
      actions: [
        values.action1Label
          ? {
              label: values.action1Label,
              href: values.action1Url || values.linkUrl || "#",
              variant: "default",
            }
          : null,
        values.action2Label
          ? {
              label: values.action2Label,
              href: values.action2Url || values.linkUrl || "#",
              variant: "outline",
            }
          : null,
      ].filter((action): action is BannerAction => Boolean(action)),
      background: {
        type: values.imageFileId ? "image" : "color",
        value: values.imageFileId || "",
        overlay: values.overlay,
      },
    };

    const payload: BannerPayload = {
      title: values.title,
      description: values.description || null,
      pathPattern: values.pathPattern,
      type: values.type,
      slot: values.slot || null,
      targetSegments: values.targetSegments,
      imageFileId: values.imageFileId || null,
      isActive: values.isActive,
      startDate: values.startDate || null,
      endDate: values.endDate || null,
      props,
    };

    try {
      await mutation.mutateAsync(payload as BannerPayload & { id?: string });
      toast.success(isEdit ? "Banner updated" : "Banner created");
      onSuccess();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save banner");
    }
  };

  const props = (data?.props || {}) as Record<string, unknown>;
  const actions = Array.isArray(props.actions) ? (props.actions as BannerAction[]) : [];
  const background: BannerBackground =
    (props.background as BannerBackground | undefined) ?? {
      type: "color",
      value: "",
      overlay: 0,
    };
  const targetSegments = (data?.targetSegments || []).filter(
    (segment): segment is BannerTargetSegment => segment === "USER" || segment === "GUEST",
  );

  return (
    <SchemaForm
      formRef={formRef}
      schema={bannerFormSchema}
      defaultValues={
        data
          ? {
              title: data.title,
              description: data.description || "",
              pathPattern: data.pathPattern,
              type: data.type,
              slot: data.slot || "",
              targetSegments,
              imageFileId: data.imageFileId || "",
              variant: (props.variant as "banner" | "hero" | "fullscreen") || "banner",
              align: (props.align as "left" | "center" | "right") || "left",
              verticalAlign: (props.verticalAlign as "top" | "center" | "bottom") || "center",
              overlay: typeof background.overlay === "number" ? background.overlay : 0,
              theme: (props.theme as "light" | "dark") || "light",
              linkUrl: (props.href as string) || "",
              action1Label: actions[0]?.label || "",
              action1Url: actions[0]?.href || "",
              action2Label: actions[1]?.label || "",
              action2Url: actions[1]?.href || "",
              startDate: data.startDate ? new Date(data.startDate).toISOString().slice(0, 10) : "",
              endDate: data.endDate ? new Date(data.endDate).toISOString().slice(0, 10) : "",
              isActive: Boolean(data.isActive),
            }
          : {
              type: "HEADER",
              targetSegments: [],
              variant: "banner",
              align: "left",
              verticalAlign: "center",
              overlay: 0,
              theme: "light",
              isActive: true,
            }
      }
      onSubmit={handleSubmit}
      submitLabel={isEdit ? "Update Banner" : "Create Banner"}
      isLoading={mutation.isPending}
    />
  );
}
