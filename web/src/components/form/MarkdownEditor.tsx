"use client";

import dynamic from "next/dynamic";

const MDEditor = dynamic(() => import("@uiw/react-md-editor"), {
  ssr: false,
  loading: () => (
    <div className="h-[400px] w-full animate-pulse rounded-md bg-muted flex items-center justify-center text-muted-foreground text-sm">
      Loading editor...
    </div>
  ),
});

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  height?: number;
}

export function MarkdownEditor({
  value,
  onChange,
  disabled,
  height = 400,
}: MarkdownEditorProps) {
  return (
    <div data-color-mode="light" className="w-full">
      <MDEditor
        value={value}
        onChange={(v) => onChange(v ?? "")}
        height={height}
        preview="live"
        hideToolbar={disabled}
        textareaProps={{
          disabled,
          placeholder: "Write your content in Markdown...",
        }}
      />
    </div>
  );
}
