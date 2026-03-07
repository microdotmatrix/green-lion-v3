import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import FileHandler from "@tiptap/extension-file-handler";
import * as React from "react";

import { QueryProvider } from "@/components/providers/query-provider";
import { ImageUpload } from "@/components/admin/image-upload";
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
import { useUploadThing } from "@/lib/uploadthing";
import { cn } from "@/lib/utils";

import { BlogEditorToolbar } from "./blog-editor-toolbar";
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
  const [categoryId, setCategoryId] = React.useState<string | undefined>(undefined);
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

  const { startUpload } = useUploadThing("imageUploader");

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image,
      Link.configure({
        openOnClick: false,
        defaultProtocol: "https",
        autolink: true,
        linkOnPaste: true,
      }),
      Placeholder.configure({ placeholder: "Start writing your post..." }),
      FileHandler.configure({
        allowedMimeTypes: ["image/png", "image/jpeg", "image/webp", "image/gif"],
        onDrop: async (currentEditor, files, _pos) => {
          const uploaded = await startUpload(files);
          if (uploaded?.[0]?.ufsUrl) {
            currentEditor
              .chain()
              .focus()
              .setImage({ src: uploaded[0].ufsUrl })
              .run();
          }
        },
        onPaste: async (currentEditor, files) => {
          const uploaded = await startUpload(files);
          if (uploaded?.[0]?.ufsUrl) {
            currentEditor
              .chain()
              .focus()
              .setImage({ src: uploaded[0].ufsUrl })
              .run();
          }
        },
      }),
    ],
    content: body,
    immediatelyRender: false,
    onUpdate: ({ editor: e }) => setBody(e.getHTML()),
  });

  // Sync editor content when editing post loads
  React.useEffect(() => {
    if (editor && existingPost && mode === "edit") {
      const current = editor.getHTML();
      if (current !== existingPost.body) {
        editor.commands.setContent(existingPost.body, false);
      }
    }
  }, [editor, existingPost, mode]);

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
            <SelectTrigger>
              <SelectValue />
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
          placeholder="Brief summary of the post..."
          rows={3}
        />
      </div>

      {/* Editor */}
      <div className="space-y-1.5">
        <Label>Content</Label>
        <div
          className={cn(
            "rounded-md border",
            "focus-within:ring-1 focus-within:ring-ring",
          )}
        >
          <BlogEditorToolbar editor={editor} />
          <EditorContent
            editor={editor}
            className="min-h-[400px] px-4 py-3 prose prose-sm max-w-none focus:outline-none [&_.tiptap]:min-h-[400px] [&_.tiptap]:outline-none"
          />
        </div>
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
