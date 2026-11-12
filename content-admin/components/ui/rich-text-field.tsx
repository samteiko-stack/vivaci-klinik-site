"use client";

import { useEffect, type ReactNode } from "react";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  Bold,
  Italic,
  Link2,
  List,
  ListOrdered,
  Quote,
  Redo2,
  Strikethrough,
  Underline as UnderlineIcon,
  Undo2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
  minHeightClassName?: string;
};

function normalizeOutgoing(html: string): string {
  const trimmed = html.trim();
  if (!trimmed || trimmed === "<p></p>" || trimmed === "<p><br></p>") return "";
  return html;
}

function looksLikeHtml(text: string): boolean {
  return /<[a-z][\s\S]*>/i.test(text.trim());
}

function toEditorContent(value: string): string {
  const v = value.trim();
  if (!v) return "";
  if (looksLikeHtml(v)) return v;
  const parts = v.split(/\n\n+/).filter(Boolean);
  if (parts.length <= 1) return `<p>${escapeForParagraph(parts[0] ?? v)}</p>`;
  return parts.map((p) => `<p>${escapeForParagraph(p)}</p>`).join("");
}

function escapeForParagraph(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\n/g, "<br>");
}

function ToolbarButton({
  active,
  disabled,
  label,
  onClick,
  children,
}: {
  active?: boolean;
  disabled?: boolean;
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <Button
      type="button"
      variant={active ? "secondary" : "ghost"}
      size="icon-sm"
      className="size-8"
      disabled={disabled}
      aria-label={label}
      title={label}
      onClick={onClick}
    >
      {children}
    </Button>
  );
}

export function RichTextField({
  value,
  onChange,
  placeholder = "Skriv brödtext…",
  className,
  minHeightClassName = "min-h-[14rem]",
}: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3, 4] },
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: "underline underline-offset-2" },
      }),
      Placeholder.configure({ placeholder }),
    ],
    content: toEditorContent(value),
    immediatelyRender: false,
    onUpdate: ({ editor: ed }) => {
      onChange(normalizeOutgoing(ed.getHTML()));
    },
    editorProps: {
      attributes: {
        class: cn(
          "tiptap focus:outline-none px-3 py-3 text-sm leading-relaxed text-foreground",
          minHeightClassName,
          "[&_h2]:mt-4 [&_h2]:mb-2 [&_h2]:text-lg [&_h2]:font-semibold",
          "[&_h3]:mt-3 [&_h3]:mb-1.5 [&_h3]:text-base [&_h3]:font-semibold",
          "[&_h4]:mt-2 [&_h4]:mb-1 [&_h4]:text-sm [&_h4]:font-semibold",
          "[&_p]:my-2 [&_p:first-child]:mt-0",
          "[&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5",
          "[&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-5",
          "[&_blockquote]:border-l-2 [&_blockquote]:border-border [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:text-muted-foreground",
          "[&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2"
        ),
      },
    },
  });

  useEffect(() => {
    if (!editor) return;
    const next = toEditorContent(value);
    const current = editor.getHTML();
    if (normalizeOutgoing(current) === normalizeOutgoing(next)) return;
    editor.commands.setContent(next || "<p></p>", { emitUpdate: false });
  }, [editor, value]);

  if (!editor) {
    return (
      <div
        className={cn(
          "animate-pulse rounded-lg border border-input bg-muted/30",
          minHeightClassName,
          className
        )}
      />
    );
  }

  const setLink = () => {
    const prev = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Länk (URL)", prev ?? "https://");
    if (url === null) return;
    if (url.trim() === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url.trim() }).run();
  };

  return (
    <div
      className={cn(
        "rich-text-field flex flex-col overflow-hidden rounded-lg border border-input bg-background shadow-xs",
        className
      )}
    >
      <div className="flex flex-wrap items-center gap-0.5 border-b border-input bg-muted/40 px-1.5 py-1">
        <ToolbarButton
          label="Fet"
          active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold aria-hidden />
        </ToolbarButton>
        <ToolbarButton
          label="Kursiv"
          active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic aria-hidden />
        </ToolbarButton>
        <ToolbarButton
          label="Understruken"
          active={editor.isActive("underline")}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        >
          <UnderlineIcon aria-hidden />
        </ToolbarButton>
        <ToolbarButton
          label="Genomstruken"
          active={editor.isActive("strike")}
          onClick={() => editor.chain().focus().toggleStrike().run()}
        >
          <Strikethrough aria-hidden />
        </ToolbarButton>
        <span className="mx-1 h-5 w-px bg-border" aria-hidden />
        <ToolbarButton
          label="Rubrik 2"
          active={editor.isActive("heading", { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          <span className="text-xs font-semibold">H2</span>
        </ToolbarButton>
        <ToolbarButton
          label="Rubrik 3"
          active={editor.isActive("heading", { level: 3 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        >
          <span className="text-xs font-semibold">H3</span>
        </ToolbarButton>
        <span className="mx-1 h-5 w-px bg-border" aria-hidden />
        <ToolbarButton
          label="Punktlista"
          active={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List aria-hidden />
        </ToolbarButton>
        <ToolbarButton
          label="Numrerad lista"
          active={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered aria-hidden />
        </ToolbarButton>
        <ToolbarButton
          label="Citat"
          active={editor.isActive("blockquote")}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        >
          <Quote aria-hidden />
        </ToolbarButton>
        <ToolbarButton label="Länk" active={editor.isActive("link")} onClick={setLink}>
          <Link2 aria-hidden />
        </ToolbarButton>
        <span className="mx-1 h-5 w-px bg-border" aria-hidden />
        <ToolbarButton
          label="Ångra"
          disabled={!editor.can().undo()}
          onClick={() => editor.chain().focus().undo().run()}
        >
          <Undo2 aria-hidden />
        </ToolbarButton>
        <ToolbarButton
          label="Gör om"
          disabled={!editor.can().redo()}
          onClick={() => editor.chain().focus().redo().run()}
        >
          <Redo2 aria-hidden />
        </ToolbarButton>
      </div>
      <EditorContent editor={editor} className="max-h-[min(70vh,36rem)] overflow-y-auto" />
    </div>
  );
}
