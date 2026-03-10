"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { updatePlatformSetting } from "@/lib/api/platform-settings";
import { FileUploadField } from "@/components/form/FileUploadField";
import { revalidateCache } from "@/actions/cache-actions";

export function SettingsForm({
  settingKey,
  title,
  description,
  initialValue,
  isPublic,
  type,
}: {
  settingKey: string;
  title: string;
  description: string;
  initialValue: any;
  isPublic: boolean;
  type: "json" | "image" | "string";
}) {
  const [value, setValue] = useState<any>(
    initialValue ?? (type === "json" ? "{}" : ""),
  );
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      let payload = value;
      if (type === "json" && typeof value === "string") {
        payload = JSON.parse(value);
      }
      await updatePlatformSetting(settingKey, {
        value: payload,
        isPublic,
        description,
      });
      await revalidateCache({ tags: ["public_settings"] });
      toast.success(`${title} saved successfully`);
    } catch (e) {
      toast.error(`Failed to save ${title}`);
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {type === "string" && (
          <Input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={`Enter ${title.toLowerCase()}`}
          />
        )}
        {type === "json" && (
          <textarea
            className="w-full min-h-[150px] p-3 rounded-md border border-input bg-transparent text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            value={
              typeof value === "string" ? value : JSON.stringify(value, null, 2)
            }
            onChange={(e) => setValue(e.target.value)}
          />
        )}
        {type === "image" && (
          <div className="space-y-4">
            {value && typeof value === "string" && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={value}
                alt={title}
                className="max-h-32 object-contain rounded-md border"
              />
            )}
            <FileUploadField
              value={undefined}
              onChange={(fileId: string | string[] | null) => {
                if (fileId && typeof fileId === "string") setValue(fileId);
              }}
              accept="image/*"
              maxSizeBytes={5 * 1024 * 1024}
              uploadMode="auth"
            />
          </div>
        )}
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={loading}>
            {loading ? "Saving..." : "Save Configuration"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
