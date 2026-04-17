import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { promptFormSchema, type PromptFormData, type PlatformPrompt } from "./types";
import { Loader2, Save } from "lucide-react";
import { useApiMutation } from "@/hooks/useApiMutation";
import { platformPromptsApi } from "@/lib/api/prompts-api";
import { toast } from "sonner";
import type { OperationComponentProps } from "@/components/dataTable/types";

const MODULE_OPTIONS = [
  { value: "prompt_blog_post", label: "Blog Post" },
  { value: "prompt_blog_category", label: "Blog Category" },
  { value: "prompt_blog_tag", label: "Blog Tag" },
  { value: "prompt_rss_topic", label: "RSS Topic" },
];

export function PromptForm({
  data,
  onSuccess,
}: OperationComponentProps<PlatformPrompt>) {
  const form = useForm<PromptFormData>({
    resolver: zodResolver(promptFormSchema),
    defaultValues: {
      module: data?.module || "prompt_blog_post",
      name: data?.id ? `${data.name} (Copy)` : data?.name || "",
      content: data?.content || "",
    },
  });

  const mutation = useApiMutation({
    method: "POST", // Always POST to create a new version
    endpoint: platformPromptsApi.create.endpoint,
    onSuccess: () => {
      toast.success(data?.id ? "New version created" : "Prompt created");
      onSuccess();
    },
    onError: (err) => {
      toast.error(err.message || "Failed to save prompt");
    },
  });

  const handleSubmit = async (values: PromptFormData) => {
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    const { id: _id, ...payload } = values as any;
    mutation.mutate(payload);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="module"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Module</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
                disabled={!!data?.id}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a module" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {MODULE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                The area of the platform this prompt applies to.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Version Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g. V2 SEO Optimized" {...field} />
              </FormControl>
              <FormDescription>
                A descriptive name for this version of the prompt.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Prompt Content</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Enter the system prompt content..."
                  className="min-h-[400px] font-mono text-xs leading-relaxed"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end pt-4">
          <Button type="submit" disabled={mutation.isPending} className="gap-2">
            {mutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {data?.id ? "Clone & Save as New Version" : "Save Prompt"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
