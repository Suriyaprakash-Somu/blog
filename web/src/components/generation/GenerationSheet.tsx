"use client";

import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Sparkles } from "lucide-react";
import { useApiQuery } from "@/hooks/useApiQuery";
import { platformBlogPostsApi } from "@/lib/api/platform-blog-posts";
import { platformBlogCategoriesApi } from "@/lib/api/platform-blog-categories";
import { platformBlogTagsApi } from "@/lib/api/platform-blog-tags";

interface GenerationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGenerate: (
    title: string,
    additionalInstructions?: string,
    templateId?: string
  ) => Promise<void>;
  moduleType: "blog_post" | "blog_category" | "blog_tag";
  initialTitle?: string;
  isLoading: boolean;
  titleLabel?: string;
  titlePlaceholder?: string;
  instructionsPlaceholder?: string;
}

function getTemplatesApi(moduleType: string) {
  switch (moduleType) {
    case "blog_post":
      return platformBlogPostsApi.getGenerationTemplates;
    case "blog_category":
      return platformBlogCategoriesApi.getGenerationTemplates;
    case "blog_tag":
      return platformBlogTagsApi.getGenerationTemplates;
    default:
      return platformBlogPostsApi.getGenerationTemplates;
  }
}

interface Template {
  id: string;
  name: string;
  defaultInstructions: string;
  isDefault: boolean;
}

function getModuleLabel(moduleType: string) {
  switch (moduleType) {
    case "blog_post":
      return "Blog Post";
    case "blog_category":
      return "Category";
    case "blog_tag":
      return "Tag";
    default:
      return "Content";
  }
}

function getTitleLabel(moduleType: string) {
  switch (moduleType) {
    case "blog_post":
      return "Post Title";
    case "blog_category":
      return "Category Name";
    case "blog_tag":
      return "Tag Name";
    default:
      return "Title";
  }
}

function getMinLength(moduleType: string): number {
  switch (moduleType) {
    case "blog_post":
      return 10;
    case "blog_category":
      return 3;
    case "blog_tag":
      return 3;
    default:
      return 3;
  }
}

function getLengthLabel(moduleType: string): string {
  const min = getMinLength(moduleType);
  return `Minimum ${min} character${min > 1 ? 's' : ''} required`;
}

function getDefaultPlaceholder(moduleType: string) {
  switch (moduleType) {
    case "blog_post":
      return "e.g., Focus on React 19 features, include TypeScript examples, keep it beginner-friendly...";
    case "blog_category":
      return "e.g., Emphasize latest trends, include industry examples, target professional audience...";
    case "blog_tag":
      return "e.g., Cover advanced use cases, include best practices, focus on practical applications...";
    default:
      return "Enter additional instructions...";
  }
}

export function GenerationDialog({
  open,
  onOpenChange,
  onGenerate,
  moduleType,
  initialTitle,
  isLoading,
  titleLabel,
  titlePlaceholder,
  instructionsPlaceholder,
}: GenerationDialogProps) {
  const [title, setTitle] = useState(initialTitle || "");
  const [additionalInstructions, setAdditionalInstructions] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");

  // Fetch templates
  const templatesApi = getTemplatesApi(moduleType);
  const { data: templatesData } = useApiQuery<{ templates: Template[] }>({
    ...templatesApi,
    requireOrganization: false,
  });

  const templates = templatesData?.templates || [];
  const minLength = getMinLength(moduleType);

  // Auto-select default template on open
  useMemo(() => {
    if (templates.length > 0 && !selectedTemplateId) {
      const defaultTemplate = templates.find(t => t.isDefault);
      if (defaultTemplate) {
        setSelectedTemplateId(defaultTemplate.id);
        setAdditionalInstructions(defaultTemplate.defaultInstructions || "");
      }
    }
  }, [templates, selectedTemplateId]);

  // Handle template selection
  const handleTemplateChange = (templateId: string | null) => {
    if (!templateId) {
      setSelectedTemplateId("");
      setAdditionalInstructions("");
      return;
    }
    setSelectedTemplateId(templateId);
    const template = templates.find((t) => t.id === templateId);
    if (template?.defaultInstructions) {
      setAdditionalInstructions(template.defaultInstructions);
    }
  };

  // Preview text (user prompt only)
  const previewText = useMemo(() => {
    const topic = title || "...";
    const moduleLabel = getModuleLabel(moduleType).toLowerCase();
    const instructions = additionalInstructions ? `\n${additionalInstructions}` : "";
    return `Please generate the ${moduleLabel} for the topic: "${topic}".${instructions}`;
  }, [title, additionalInstructions, moduleType]);

  const isValid = title.length >= minLength && !isLoading;

  const handleSubmit = async () => {
    if (!isValid) return;
    const instructions = additionalInstructions.trim() || undefined;
    const templateId = selectedTemplateId || undefined;
    await onGenerate(title, instructions, templateId);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="sm:max-w-[600px]" 
        aria-describedby="dialog-description"
        aria-labelledby="dialog-title"
      >
        <DialogHeader>
          <DialogTitle id="dialog-title">Generate {getModuleLabel(moduleType)} with AI</DialogTitle>
          <DialogDescription id="dialog-description">
            Configure the AI generation parameters
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Template Selection */}
          {templates.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="template">Template (Optional)</Label>
              <Select value={selectedTemplateId || undefined} onValueChange={handleTemplateChange}>
                <SelectTrigger id="template" className="w-full" aria-label="Select generation template">
                  <SelectValue placeholder="Select a template..." />
                </SelectTrigger>
                <SelectContent className="w-[--radix-select-trigger-width]">
                  {templates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      <div className="flex items-center gap-2">
                        <span>{template.name}</span>
                        {template.isDefault && (
                          <span className="text-xs bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full">
                            Default
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Templates provide pre-configured system prompts and default instructions
              </p>
            </div>
          )}

          {/* Title Field */}
          <div className="space-y-2">
            <Label htmlFor="gen-title">{titleLabel || getTitleLabel(moduleType)} *</Label>
            <Input
              id="gen-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={titlePlaceholder || `Enter ${getModuleLabel(moduleType).toLowerCase()} ${titleLabel?.toLowerCase() || "name"}`}
              autoFocus
            />
            <div className="flex justify-between text-xs">
              <span className={title.length < minLength ? "text-destructive font-medium" : "text-muted-foreground"}>
                {title.length < minLength ? "⚠ " : ""}{getLengthLabel(moduleType)}
              </span>
              <span className="text-muted-foreground">{title.length} chars</span>
            </div>
          </div>

          {/* Additional Instructions */}
          <div className="space-y-2">
            <Label htmlFor="gen-instructions">Additional Instructions (Optional)</Label>
            <Textarea
              id="gen-instructions"
              value={additionalInstructions}
              onChange={(e) => setAdditionalInstructions(e.target.value)}
              placeholder={instructionsPlaceholder || getDefaultPlaceholder(moduleType)}
              className="min-h-[120px]"
            />
            <p className="text-xs text-muted-foreground">
              Provide specific guidance to tailor the AI-generated content
            </p>
          </div>

          {/* Preview */}
          <div className="space-y-2">
            <Label htmlFor="gen-preview">User Prompt Preview:</Label>
            <div 
              id="gen-preview"
              className="text-xs p-3 bg-muted rounded-md font-mono whitespace-pre-wrap break-words"
              role="region"
              aria-label="Preview of what will be sent to AI"
            >
              {previewText}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!isValid || isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate with AI
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
