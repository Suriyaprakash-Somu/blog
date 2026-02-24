"use client";

import { useCallback, useEffect, useState } from "react";
import { PageShell } from "@/components/layout/PageShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { FileUploadField } from "@/components/form/FileUploadField";
import { toast } from "sonner";
import {
  getPlatformSettings,
  updatePlatformSetting,
  getLlmProviders,
  fetchLlmModels,
  type PlatformSetting,
  type LlmProviderMeta,
  type LlmModel,
} from "@/lib/api/platform-settings";
import {
  Globe,
  Image as ImageIcon,
  Key,
  Loader2,
  Save,
  Twitter,
  Instagram,
  Youtube,
  Linkedin,
  Facebook,
  Check,
  CircleDot,
  Circle,
  RefreshCw,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */

interface SocialLinks {
  twitter?: string;
  facebook?: string;
  instagram?: string;
  youtube?: string;
  linkedin?: string;
  website?: string;
}

interface LogosValue {
  lightLogoFileId?: string | null;
  darkLogoFileId?: string | null;
  faviconFileId?: string | null;
}

interface ProviderConfig {
  apiKey: string;
  model: string;
}

interface LlmConfig {
  activeProvider: string;
  providers: Record<string, ProviderConfig>;
}

/* ------------------------------------------------------------------ */
/*  Main Page                                                         */
/* ------------------------------------------------------------------ */

export default function PlatformSettingsPage() {
  const [settings, setSettings] = useState<PlatformSetting[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const data = await getPlatformSettings();
      setSettings(data);
    } catch {
      toast.error("Failed to load settings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const getSettingValue = <T,>(key: string, fallback: T): T => {
    const s = settings.find((x) => x.key === key);
    return s ? (s.value as T) : fallback;
  };

  if (loading) {
    return (
      <PageShell>
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div className="flex flex-col gap-8">
        <PageHeader
          title="Settings"
          description="Configure your platform's branding, social presence, and integrations."
        />

        <Tabs defaultValue="branding">
          <TabsList variant="line">
            <TabsTrigger value="branding">
              <ImageIcon className="mr-1.5 h-4 w-4" /> Branding
            </TabsTrigger>
            <TabsTrigger value="social">
              <Globe className="mr-1.5 h-4 w-4" /> Social Media
            </TabsTrigger>
            <TabsTrigger value="integrations">
              <Key className="mr-1.5 h-4 w-4" /> Integrations
            </TabsTrigger>
          </TabsList>

          {/* ── Branding ───────────────────────────────────────── */}
          <TabsContent value="branding">
            <BrandingSection
              initialValue={getSettingValue<LogosValue>("logos", {})}
              onSaved={load}
            />
          </TabsContent>

          {/* ── Social Media ───────────────────────────────────── */}
          <TabsContent value="social">
            <SocialMediaSection
              initialValue={getSettingValue<SocialLinks>("social_media", {})}
              onSaved={load}
            />
          </TabsContent>

          {/* ── Integrations ───────────────────────────────────── */}
          <TabsContent value="integrations">
            <IntegrationsSection
              initialValue={getSettingValue<LlmConfig>("llm_config", {
                activeProvider: "",
                providers: {},
              })}
              onSaved={load}
            />
          </TabsContent>
        </Tabs>
      </div>
    </PageShell>
  );
}

/* ================================================================== */
/*  ── Branding Section                                               */
/* ================================================================== */

function BrandingSection({
  initialValue,
  onSaved,
}: {
  initialValue: LogosValue;
  onSaved: () => void;
}) {
  const [logos, setLogos] = useState<LogosValue>(initialValue);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updatePlatformSetting("logos", {
        value: logos,
        isPublic: true,
        description: "Platform logo assets",
      });
      toast.success("Branding saved");
      onSaved();
    } catch {
      toast.error("Failed to save branding");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid gap-6 max-w-3xl pt-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Light Logo</CardTitle>
          <CardDescription>
            Used on light backgrounds. Recommended size: 200×60 px, PNG or SVG.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FileUploadField
            value={logos.lightLogoFileId ?? undefined}
            onChange={(v) =>
              setLogos((prev) => ({
                ...prev,
                lightLogoFileId: typeof v === "string" ? v : null,
              }))
            }
            accept="image/*"
            maxSizeBytes={5 * 1024 * 1024}
            uploadMode="auth"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Dark Logo</CardTitle>
          <CardDescription>
            Used on dark backgrounds and dark mode. Same recommended dimensions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FileUploadField
            value={logos.darkLogoFileId ?? undefined}
            onChange={(v) =>
              setLogos((prev) => ({
                ...prev,
                darkLogoFileId: typeof v === "string" ? v : null,
              }))
            }
            accept="image/*"
            maxSizeBytes={5 * 1024 * 1024}
            uploadMode="auth"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Favicon</CardTitle>
          <CardDescription>
            Browser tab icon. Recommended: 32×32 or 64×64 px, PNG or ICO.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FileUploadField
            value={logos.faviconFileId ?? undefined}
            onChange={(v) =>
              setLogos((prev) => ({
                ...prev,
                faviconFileId: typeof v === "string" ? v : null,
              }))
            }
            accept="image/*"
            maxSizeBytes={2 * 1024 * 1024}
            uploadMode="auth"
          />
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Save Branding
        </Button>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  ── Social Media Section                                           */
/* ================================================================== */

const SOCIAL_FIELDS: {
  key: keyof SocialLinks;
  label: string;
  icon: React.ElementType;
  placeholder: string;
}[] = [
  {
    key: "twitter",
    label: "Twitter / X",
    icon: Twitter,
    placeholder: "https://twitter.com/yourhandle",
  },
  {
    key: "facebook",
    label: "Facebook",
    icon: Facebook,
    placeholder: "https://facebook.com/yourpage",
  },
  {
    key: "instagram",
    label: "Instagram",
    icon: Instagram,
    placeholder: "https://instagram.com/yourhandle",
  },
  {
    key: "youtube",
    label: "YouTube",
    icon: Youtube,
    placeholder: "https://youtube.com/@yourchannel",
  },
  {
    key: "linkedin",
    label: "LinkedIn",
    icon: Linkedin,
    placeholder: "https://linkedin.com/company/yourcompany",
  },
  {
    key: "website",
    label: "Website",
    icon: Globe,
    placeholder: "https://yourwebsite.com",
  },
];

function SocialMediaSection({
  initialValue,
  onSaved,
}: {
  initialValue: SocialLinks;
  onSaved: () => void;
}) {
  const [links, setLinks] = useState<SocialLinks>(initialValue);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updatePlatformSetting("social_media", {
        value: links,
        isPublic: true,
        description: "Social media profile links",
      });
      toast.success("Social media links saved");
      onSaved();
    } catch {
      toast.error("Failed to save social media links");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl pt-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Social Media Links</CardTitle>
          <CardDescription>
            Add your social media profiles. These will be displayed in the
            footer and other public areas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-5">
            {SOCIAL_FIELDS.map(({ key, label, icon: Icon, placeholder }) => (
              <div key={key} className="grid gap-1.5">
                <Label
                  htmlFor={`social-${key}`}
                  className="flex items-center gap-2 text-sm font-medium"
                >
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  {label}
                </Label>
                <Input
                  id={`social-${key}`}
                  type="url"
                  placeholder={placeholder}
                  value={links[key] ?? ""}
                  onChange={(e) =>
                    setLinks((prev) => ({ ...prev, [key]: e.target.value }))
                  }
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end mt-6">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Save Social Links
        </Button>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  ── Integrations Section                                           */
/* ================================================================== */

function IntegrationsSection({
  initialValue,
  onSaved,
}: {
  initialValue: LlmConfig;
  onSaved: () => void;
}) {
  const [config, setConfig] = useState<LlmConfig>(initialValue);
  const [providers, setProviders] = useState<LlmProviderMeta[]>([]);
  const [modelsByProvider, setModelsByProvider] = useState<
    Record<string, LlmModel[]>
  >({});
  const [fetchingModels, setFetchingModels] = useState<Record<string, boolean>>(
    {},
  );
  const [saving, setSaving] = useState(false);
  const [loadingProviders, setLoadingProviders] = useState(true);

  // Load provider metadata from server on mount
  useEffect(() => {
    getLlmProviders()
      .then(setProviders)
      .catch(() => toast.error("Failed to load LLM providers"))
      .finally(() => setLoadingProviders(false));
  }, []);

  // Auto-fetch models for providers that already have a saved API key
  useEffect(() => {
    if (providers.length === 0) return;
    const entries = Object.entries(config.providers);
    for (const [providerId, conf] of entries) {
      if (conf.apiKey && !modelsByProvider[providerId]) {
        fetchLlmModels(providerId, conf.apiKey)
          .then((models) =>
            setModelsByProvider((prev) => ({ ...prev, [providerId]: models })),
          )
          .catch(() => {
            /* silently ignore — user can retry manually */
          });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [providers]);

  const updateProvider = (
    providerId: string,
    patch: Partial<ProviderConfig>,
  ) => {
    setConfig((prev) => ({
      ...prev,
      providers: {
        ...prev.providers,
        [providerId]: {
          apiKey: prev.providers[providerId]?.apiKey ?? "",
          model: prev.providers[providerId]?.model ?? "",
          ...patch,
        },
      },
    }));
  };

  const setActive = (providerId: string) => {
    setConfig((prev) => ({ ...prev, activeProvider: providerId }));
  };

  const handleFetchModels = async (providerId: string) => {
    const apiKey = config.providers[providerId]?.apiKey;
    if (!apiKey) {
      toast.error("Enter an API key first");
      return;
    }
    setFetchingModels((prev) => ({ ...prev, [providerId]: true }));
    try {
      const models = await fetchLlmModels(providerId, apiKey);
      setModelsByProvider((prev) => ({ ...prev, [providerId]: models }));
      if (models.length > 0) {
        toast.success(`Loaded ${models.length} models`);
      } else {
        toast.info("No models returned for this key");
      }
    } catch {
      toast.error("Failed to fetch models — check your API key");
    } finally {
      setFetchingModels((prev) => ({ ...prev, [providerId]: false }));
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updatePlatformSetting("llm_config", {
        value: config,
        isPublic: false,
        description: "LLM provider configurations",
      });
      toast.success("Integration settings saved");
      onSaved();
    } catch {
      toast.error("Failed to save integration settings");
    } finally {
      setSaving(false);
    }
  };

  if (loadingProviders) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl pt-4">
      <div className="mb-4">
        <p className="text-sm text-muted-foreground">
          Configure multiple LLM providers below. Only one provider can be
          active at a time — click the radio to enable it. Enter your API key
          then click &ldquo;Fetch Models&rdquo; to load available models.
        </p>
      </div>

      <div className="grid gap-4">
        {providers.map((provider) => {
          const providerConf = config.providers[provider.id];
          const isActive = config.activeProvider === provider.id;
          const hasKey = !!providerConf?.apiKey;
          const models = modelsByProvider[provider.id] ?? [];
          const isFetching = fetchingModels[provider.id] ?? false;

          return (
            <Card
              key={provider.id}
              className={`transition-colors ${
                isActive ? "border-primary/50 bg-primary/2" : "border-border"
              }`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setActive(provider.id)}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      {isActive ? (
                        <CircleDot className="h-5 w-5 text-primary" />
                      ) : (
                        <Circle className="h-5 w-5 text-muted-foreground/50" />
                      )}
                    </button>
                    <div>
                      <CardTitle className="text-base">
                        {provider.name}
                      </CardTitle>
                      <CardDescription className="text-xs mt-0.5">
                        {provider.description}
                      </CardDescription>
                    </div>
                  </div>
                  {isActive && hasKey && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                      <Check className="h-3 w-3" />
                      Active
                    </span>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {/* API Key row */}
                  <div className="grid gap-1.5">
                    <Label
                      htmlFor={`key-${provider.id}`}
                      className="text-xs font-medium"
                    >
                      API Key
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        id={`key-${provider.id}`}
                        type="password"
                        placeholder={provider.keyPlaceholder}
                        value={providerConf?.apiKey ?? ""}
                        className="flex-1"
                        onChange={(e) =>
                          updateProvider(provider.id, {
                            apiKey: e.target.value,
                          })
                        }
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={!hasKey || isFetching}
                        onClick={() => handleFetchModels(provider.id)}
                        className="shrink-0"
                      >
                        {isFetching ? (
                          <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                        )}
                        Fetch Models
                      </Button>
                    </div>
                  </div>

                  {/* Model dropdown — shows after fetching */}
                  <div className="grid gap-1.5">
                    <Label
                      htmlFor={`model-${provider.id}`}
                      className="text-xs font-medium"
                    >
                      Model
                      {models.length > 0 && (
                        <span className="ml-1.5 text-muted-foreground font-normal">
                          ({models.length} available)
                        </span>
                      )}
                    </Label>
                    {models.length > 0 ? (
                      <Select
                        value={providerConf?.model ?? ""}
                        onValueChange={(v) =>
                          updateProvider(provider.id, { model: v ?? "" })
                        }
                      >
                        <SelectTrigger
                          id={`model-${provider.id}`}
                          className="w-full"
                        >
                          <SelectValue placeholder="Select a model" />
                        </SelectTrigger>
                        <SelectContent className="min-w-[400px]">
                          {models.map((m) => (
                            <SelectItem key={m.id} value={m.id}>
                              {m.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        id={`model-${provider.id}`}
                        placeholder={
                          providerConf?.model
                            ? providerConf.model
                            : "Enter API key and click Fetch Models"
                        }
                        value={providerConf?.model ?? ""}
                        onChange={(e) =>
                          updateProvider(provider.id, { model: e.target.value })
                        }
                      />
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="flex justify-end mt-6">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Save Integrations
        </Button>
      </div>
    </div>
  );
}
