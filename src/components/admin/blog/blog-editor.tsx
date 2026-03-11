import { ImageUpload } from "@/components/admin/image-upload";
import { QueryProvider } from "@/components/providers/query-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import * as React from "react";
import { CategoryCombobox } from "./category-combobox";
import {
  useBlogCategories,
  useBlogMutations,
  useBlogPost,
  useCategoryMutations,
} from "./hooks";
import type { BlogPostFormData } from "./types";

interface BlogEditorProps {
  mode: "create" | "edit";
  postId?: string;
}

const BlogRichTextEditor = React.lazy(async () => {
  const module = await import("./blog-rich-text-editor");
  return { default: module.BlogRichTextEditor };
});

interface PlainTextFallbackProps {
  value: string;
  onChange: (value: string) => void;
  message?: string;
}

function PlainTextEditorFallback({
  value,
  onChange,
  message,
}: PlainTextFallbackProps) {
  return (
    <div className="space-y-3 rounded-md border p-4">
      {message ? (
        <p className="text-sm text-muted-foreground">{message}</p>
      ) : null}
      <Textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={16}
        className="min-h-[400px]"
        placeholder="Write your post content here..."
      />
    </div>
  );
}

class BlogEditorErrorBoundary extends React.Component<
  React.PropsWithChildren<{ fallback: React.ReactNode }>,
  { hasError: boolean }
> {
  override state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  override componentDidCatch(error: unknown) {
    console.error("Failed to load blog rich text editor", error);
  }

  override render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }

    return this.props.children;
  }
}

function BlogEditorInner({ mode, postId }: BlogEditorProps) {
  const { data: existingPost } = useBlogPost(
    mode === "edit" ? postId : undefined,
  );
  const { data: categories = [] } = useBlogCategories();
  const { createPostMut, updatePostMut } = useBlogMutations();
  const { createCategoryMut } = useCategoryMutations();

  // Form state
  const [title, setTitle] = React.useState("");
  const [body, setBody] = React.useState("");
  const [excerpt, setExcerpt] = React.useState("");
  const [coverImageUrl, setCoverImageUrl] = React.useState("");
  const [categoryId, setCategoryId] = React.useState<string | undefined>(
    undefined,
  );
  const [status, setStatus] = React.useState<"draft" | "published">("draft");

  // Prefill form when editing and data loads
  const prefilled = React.useRef(false);
  React.useEffect(() => {
    if (mode === "edit" && existingPost && !prefilled.current) {
      prefilled.current = true;
      setTitle(existingPost.title);
      setBody(existingPost.body);
      setExcerpt(existingPost.excerpt);
      setCoverImageUrl(existingPost.coverImageUrl ?? "");
      setCategoryId(existingPost.categoryId ?? undefined);
      setStatus(existingPost.status);
    }
  }, [mode, existingPost]);

  const handleSave = () => {
    const formData: BlogPostFormData = {
      title,
      body,
      excerpt,
      status,
      ...(coverImageUrl ? { coverImageUrl } : {}),
      ...(categoryId ? { categoryId } : {}),
    };

    if (mode === "create") {
      createPostMut.mutate(formData, {
        onSuccess: () => {
          window.location.href = "/admin/blog";
        },
      });
    } else {
      updatePostMut.mutate({ id: postId!, data: formData });
    }
  };

  const isSaving = createPostMut.isPending || updatePostMut.isPending;
  const pageTitle = mode === "create" ? "New Post" : "Edit Post";

  return (
    <div className="flex flex-col gap-6 pb-12">
      {/* Header bar */}
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">{pageTitle}</h1>
        <div className="flex items-center gap-2">
          <a
            href="/admin/blog"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Cancel
          </a>
          <Button
            type="button"
            onClick={handleSave}
            disabled={isSaving || !title.trim()}
          >
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>

      {/* Title */}
      <div className="space-y-1.5">
        <Label htmlFor="blog-title">Title</Label>
        <Input
          id="blog-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Post title"
          className="text-lg font-medium"
        />
      </div>

      {/* Status + Category row */}
      <div className="flex flex-wrap items-end gap-4">
        <div className="space-y-1.5 min-w-[160px]">
          <Label>Status</Label>
          <Select
            value={status}
            onValueChange={(v) => setStatus(v as "draft" | "published")}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="published">Published</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5 flex-1 min-w-[200px]">
          <Label>Category</Label>
          <CategoryCombobox
            value={categoryId}
            onChange={(id) => setCategoryId(id || undefined)}
            categories={categories}
            onCreateCategory={async (name) => {
              const cat = await createCategoryMut.mutateAsync({ name });
              return cat;
            }}
          />
        </div>
      </div>

      {/* Excerpt */}
      <div className="space-y-1.5">
        <Label htmlFor="blog-excerpt">Excerpt</Label>
        <Textarea
          id="blog-excerpt"
          value={excerpt}
          onChange={(e) => setExcerpt(e.target.value)}
          placeholder="Brief summary of the post... (If left empty, a truncated clip of the first paragraph will be used)"
          rows={3}
        />
      </div>

      {/* Editor */}
      <div className="space-y-1.5">
        <Label>Content</Label>
        <BlogEditorErrorBoundary
          fallback={
            <PlainTextEditorFallback
              value={body}
              onChange={setBody}
              message="The rich text editor could not load, so the content field has fallen back to a plain textarea."
            />
          }
        >
          <React.Suspense
            fallback={
              <PlainTextEditorFallback
                value={body}
                onChange={setBody}
                message="Loading the rich text editor..."
              />
            }
          >
            <BlogRichTextEditor value={body} onChange={setBody} />
          </React.Suspense>
        </BlogEditorErrorBoundary>
      </div>

      {/* Cover image */}
      <ImageUpload
        value={coverImageUrl}
        onChange={setCoverImageUrl}
        label="Cover Image"
        description="Recommended: 1200x630px, JPG or PNG"
      />
    </div>
  );
}

export function BlogEditor(props: BlogEditorProps) {
  return (
    <QueryProvider>
      <BlogEditorInner {...props} />
    </QueryProvider>
  );
}
