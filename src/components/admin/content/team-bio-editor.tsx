import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import * as React from "react";
import { Bold, Italic, Link as LinkIcon } from "lucide-react";
import { BubbleMenu } from "@tiptap/react/menus";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface TeamBioEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export function TeamBioEditor({ value, onChange }: TeamBioEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        bulletList: false,
        orderedList: false,
        blockquote: false,
        codeBlock: false,
        code: false,
        horizontalRule: false,
        listItem: false,
      }),
      Link.configure({
        openOnClick: false,
        defaultProtocol: "https",
        autolink: true,
        linkOnPaste: true,
      }),
      Placeholder.configure({ placeholder: "Write a brief bio summary..." }),
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

  const handleLinkToggle = () => {
    if (!editor) return;
    if (editor.isActive("link")) {
      editor.chain().focus().unsetLink().run();
    } else {
      const href = prompt("URL:");
      if (href) {
        editor.chain().focus().toggleLink({ href }).run();
      }
    }
  };

  return (
    <div
      className={cn(
        "rounded-md border",
        "focus-within:ring-1 focus-within:ring-ring",
      )}
    >
      {/* Fixed mini toolbar */}
      <div className="flex items-center gap-0.5 border-b p-1 bg-background">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn("h-7 w-7", editor?.isActive("bold") && "bg-accent")}
          onClick={() => editor?.chain().focus().toggleBold().run()}
          title="Bold"
          disabled={!editor}
        >
          <Bold className="h-3.5 w-3.5" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn("h-7 w-7", editor?.isActive("italic") && "bg-accent")}
          onClick={() => editor?.chain().focus().toggleItalic().run()}
          title="Italic"
          disabled={!editor}
        >
          <Italic className="h-3.5 w-3.5" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn("h-7 w-7", editor?.isActive("link") && "bg-accent")}
          onClick={handleLinkToggle}
          title="Link"
          disabled={!editor}
        >
          <LinkIcon className="h-3.5 w-3.5" />
        </Button>
      </div>

      {editor && (
        <BubbleMenu
          editor={editor}
          className="flex items-center gap-0.5 rounded-md border bg-background p-1 shadow-md"
        >
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={cn("h-7 w-7", editor.isActive("bold") && "bg-accent")}
            onClick={() => editor.chain().focus().toggleBold().run()}
            title="Bold"
          >
            <Bold className="h-3.5 w-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={cn("h-7 w-7", editor.isActive("italic") && "bg-accent")}
            onClick={() => editor.chain().focus().toggleItalic().run()}
            title="Italic"
          >
            <Italic className="h-3.5 w-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={cn("h-7 w-7", editor.isActive("link") && "bg-accent")}
            onClick={handleLinkToggle}
            title="Link"
          >
            <LinkIcon className="h-3.5 w-3.5" />
          </Button>
        </BubbleMenu>
      )}

      <EditorContent
        editor={editor}
        className="min-h-[120px] px-4 py-3 focus:outline-none [&_.tiptap]:min-h-[120px] [&_.tiptap]:outline-none"
      />
    </div>
  );
}
