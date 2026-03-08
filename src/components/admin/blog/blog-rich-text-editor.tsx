import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import FileHandler from "@tiptap/extension-file-handler";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import * as React from "react";

import { useUploadThing } from "@/lib/uploadthing";
import { cn } from "@/lib/utils";

import { BlogEditorToolbar } from "./blog-editor-toolbar";

interface BlogRichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export function BlogRichTextEditor({
  value,
  onChange,
}: BlogRichTextEditorProps) {
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
        allowedMimeTypes: [
          "image/png",
          "image/jpeg",
          "image/webp",
          "image/gif",
        ],
        onDrop: async (currentEditor, files) => {
          const uploaded = await startUpload(files);
          const imageUrl = uploaded?.[0]?.ufsUrl;
          if (!imageUrl) return;

          currentEditor.chain().focus().setImage({ src: imageUrl }).run();
        },
        onPaste: async (currentEditor, files) => {
          const uploaded = await startUpload(files);
          const imageUrl = uploaded?.[0]?.ufsUrl;
          if (!imageUrl) return;

          currentEditor.chain().focus().setImage({ src: imageUrl }).run();
        },
      }),
    ],
    content: value,
    immediatelyRender: false,
    onUpdate: ({ editor: currentEditor }) => onChange(currentEditor.getHTML()),
  });

  React.useEffect(() => {
    if (!editor) return;

    const currentValue = editor.getHTML();
    if (currentValue !== value) {
      editor.commands.setContent(value || "", { emitUpdate: false });
    }
  }, [editor, value]);

  return (
    <div
      className={cn(
        "rounded-md border",
        "focus-within:ring-1 focus-within:ring-ring",
      )}
    >
      <BlogEditorToolbar editor={editor} />
      <EditorContent
        editor={editor}
        className="blog-editor-content min-h-[400px] px-4 py-3 focus:outline-none [&_.tiptap]:min-h-[400px] [&_.tiptap]:outline-none"
      />
    </div>
  );
}
