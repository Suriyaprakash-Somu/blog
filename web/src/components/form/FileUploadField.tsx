"use client";

import * as React from "react";
import Image from "next/image";
import { useDropzone, type Accept } from "react-dropzone";
import { Download, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { clientFetch } from "@/lib/client-fetch";
import { fetchCore } from "@/lib/fetch-core";

interface UploadMeta {
  fileId: string;
  originalName: string;
  contentType?: string;
  sizeBytes?: number;
  url?: string;
  downloadUrl?: string;
  status?: string;
}

export interface FileUploadFieldProps {
  value?: string | string[] | null;
  onChange?: (value: string | string[] | null) => void;
  disabled?: boolean;
  accept?: string | Accept;
  maxSizeBytes?: number;
  maxFiles?: number;
  maxTotalSizeBytes?: number;
  uploadMode?: "auth" | "public";
}

function getApiBaseUrl(): string {
  return process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:3005";
}

function isImageContentType(contentType?: string): boolean {
  return typeof contentType === "string" && contentType.startsWith("image/");
}

async function fetchUploadMeta(id: string): Promise<UploadMeta> {
  return clientFetch<UploadMeta>(`/api/uploads/${id}`, {
    method: "GET",
  });
}

export function FileUploadField({
  value,
  onChange,
  disabled,
  accept,
  maxSizeBytes,
  maxFiles = 1,
  maxTotalSizeBytes,
  uploadMode = "auth",
}: FileUploadFieldProps): React.ReactElement {
  const apiBaseUrl = getApiBaseUrl();
  const uploadEndpoint = uploadMode === "public" ? "/api/public/uploads" : "/api/uploads";
  const resolveAssetUrl = (url?: string): string | undefined => {
    if (!url) return undefined;
    if (url.startsWith("http")) return url;
    return `${apiBaseUrl}${url}`;
  };
  const [metaList, setMetaList] = React.useState<UploadMeta[]>([]);
  const [removedMeta, setRemovedMeta] = React.useState<UploadMeta[]>([]);
  const [isUploading, setIsUploading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const fileIds = React.useMemo(() => {
    if (Array.isArray(value)) {
      return value.filter(Boolean);
    }
    if (typeof value === "string" && value) {
      return [value];
    }
    return [];
  }, [value]);

  React.useEffect(() => {
    let cancelled = false;
    setError(null);

    if (fileIds.length === 0) {
      setMetaList([]);
      return;
    }

    Promise.all(fileIds.map((id) => fetchUploadMeta(id)))
      .then((data) => {
        if (!cancelled) setMetaList(data);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      });

    return () => {
      cancelled = true;
    };
  }, [fileIds]);

  const resolvedMaxFiles = typeof maxFiles === "number" ? maxFiles : 1;

  React.useEffect(() => {
    setRemovedMeta((prev) =>
      prev.filter((meta) => !fileIds.includes(meta.fileId)),
    );
  }, [fileIds]);

  const onDrop = React.useCallback(
    async (acceptedFiles: File[]) => {
      if (!acceptedFiles?.length || disabled) return;

      setIsUploading(true);
      setError(null);

      try {
        const availableSlots = Math.max(resolvedMaxFiles - fileIds.length, 0);
        if (availableSlots === 0) {
          setError(`You can upload up to ${resolvedMaxFiles} file(s).`);
          return;
        }

        const filesToUpload = acceptedFiles.slice(0, availableSlots);
        if (typeof maxTotalSizeBytes === "number") {
          const currentSize = metaList.reduce(
            (sum, meta) => sum + (meta?.sizeBytes || 0),
            0,
          );
          const newSize = filesToUpload.reduce(
            (sum, file) => sum + file.size,
            0,
          );
          if (currentSize + newSize > maxTotalSizeBytes) {
            setError("Total file size exceeds the allowed limit.");
            return;
          }
        }

        const uploadedIds = await Promise.all(
          filesToUpload.map(async (file) => {
            const formData = new FormData();
            formData.append("file", file);

            if (uploadMode === "auth") {
              const uploaded = await clientFetch<{ fileId: string }>(
                uploadEndpoint,
                {
                  method: "POST",
                  body: formData,
                },
              );
              return uploaded.fileId;
            }

            const uploaded = await fetchCore<{ fileId: string }>(uploadEndpoint, {
              method: "POST",
              body: formData,
              baseUrl: apiBaseUrl,
              credentials: "omit",
            });

            return uploaded.fileId;
          }),
        );

        if (Array.isArray(value) || resolvedMaxFiles > 1) {
          const next = [...fileIds, ...uploadedIds].slice(0, resolvedMaxFiles);
          onChange?.(next);
        } else {
          onChange?.(uploadedIds[0] ?? null);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        setError(message || "Upload failed.");
      } finally {
        setIsUploading(false);
      }
    },
    [
      apiBaseUrl,
      disabled,
      fileIds,
      maxTotalSizeBytes,
      metaList,
      onChange,
      resolvedMaxFiles,
      uploadEndpoint,
      uploadMode,
      value,
    ],
  );

  const dropzoneAccept = React.useMemo<Accept | undefined>(() => {
    if (!accept) return undefined;
    if (typeof accept === "string") {
      return { [accept]: [] };
    }
    return accept;
  }, [accept]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    disabled: disabled || isUploading,
    maxFiles: resolvedMaxFiles,
    multiple: resolvedMaxFiles > 1,
    accept: dropzoneAccept,
    maxSize: typeof maxSizeBytes === "number" ? maxSizeBytes : undefined,
    onDropRejected: (rejections) => {
      if (!rejections?.length) return;
      const rejection = rejections[0];
      if (!rejection) return;
      const dropError = rejection.errors?.[0];
      if (
        dropError?.code === "file-too-large" &&
        typeof maxSizeBytes === "number"
      ) {
        const readableLimit =
          maxSizeBytes >= 1024 * 1024
            ? `${(maxSizeBytes / (1024 * 1024)).toFixed(1)} MB`
            : `${Math.round(maxSizeBytes / 1024)} KB`;
        setError(`File exceeds ${readableLimit} limit.`);
        return;
      }
      setError(
        dropError?.message || "File rejected. Please check size/type limits.",
      );
    },
  });

  const removeFile = async (id: string) => {
    if (!id) return;

    const meta = metaList.find((item) => item.fileId === id);

    try {
      if (meta?.status === "ATTACHED") {
        if (uploadMode === "auth") {
          await clientFetch(`/api/uploads/${id}/detach`, {
            method: "POST",
          });
        }
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to detach file";
      setError(message);
      toast.error(message);
    }

    if (meta) {
      setRemovedMeta((prev) => [
        meta,
        ...prev.filter((item) => item.fileId !== id),
      ]);
    }

    if (Array.isArray(value)) {
      const next = value.filter((item) => item !== id);
      onChange?.(next);
    } else {
      onChange?.(null);
    }
  };

  const handleUndo = (meta: UploadMeta) => {
    if (!meta?.fileId) return;

    if (Array.isArray(value) || resolvedMaxFiles > 1) {
      if (fileIds.length >= resolvedMaxFiles) {
        setError(`You can upload up to ${resolvedMaxFiles} file(s).`);
        return;
      }
      onChange?.([...fileIds, meta.fileId]);
    } else {
      onChange?.(meta.fileId);
    }

    setRemovedMeta((prev) =>
      prev.filter((item) => item.fileId !== meta.fileId),
    );
  };

  return (
    <div className="space-y-2">
      <div
        {...getRootProps()}
        className={`rounded-md border border-dashed p-3 text-sm transition-colors ${
          disabled
            ? "opacity-60"
            : isDragActive
              ? "border-primary bg-muted"
              : "border-muted-foreground/30"
        }`}
      >
        <input {...getInputProps()} />
        {isUploading ? (
          <div>Uploading…</div>
        ) : metaList.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {metaList.map((meta) => {
              const isImage = isImageContentType(meta?.contentType);
              return (
                <div
                  key={meta.fileId}
                  className="relative overflow-hidden rounded-md border bg-muted"
                >
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={(event) => {
                      event.stopPropagation();
                      void removeFile(meta.fileId);
                    }}
                    disabled={disabled}
                    className="absolute right-1 top-1 z-10 bg-card/90 text-foreground shadow hover:bg-accent size-6 cursor-pointer"
                    title="Remove"
                  >
                    <Trash2 className="h-4 w-4 stroke-destructive" />
                  </Button>
                  {meta.downloadUrl &&
                    !["DELETED", "PURGED", "MISSING"].includes(
                      meta.status ?? "",
                    ) && (
                      <Button
                        type="button"
                        variant="secondary"
                        className="absolute left-1 top-1 z-10 bg-card/90 text-foreground shadow hover:bg-accent size-6"
                        title="Download"
                      >
                        <a
                          href={resolveAssetUrl(meta.downloadUrl)}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(event) => event.stopPropagation()}
                        >
                          <Download className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                  <div className="flex h-24 w-full items-center justify-center bg-muted">
                    {isImage && meta.url ? (
                      <div className="relative h-full w-full">
                        <Image
                          src={resolveAssetUrl(meta.url) ?? ""}
                          alt={meta.originalName}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                    ) : (
                      <div className="px-2 text-center text-xs text-muted-foreground">
                        {meta.originalName}
                      </div>
                    )}
                  </div>
                  <div className="px-2 py-1 text-[11px] text-muted-foreground">
                    {meta.originalName}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div>
            <div className="font-medium">
              Drop a file here, or click to select
            </div>
            <div className="text-xs text-muted-foreground">
              Images preview inline; others download only.
            </div>
          </div>
        )}
      </div>

      {removedMeta.length > 0 && (
        <div className="space-y-2 text-xs text-muted-foreground">
          <div>Removed (undo before saving):</div>
          {removedMeta.map((meta) => (
            <div
              key={meta.fileId}
              className="flex items-center justify-between"
            >
              <span className="truncate">{meta.originalName}</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleUndo(meta)}
                disabled={disabled}
              >
                Undo
              </Button>
            </div>
          ))}
        </div>
      )}

      {error && <div className="text-xs text-destructive">{error}</div>}
    </div>
  );
}
