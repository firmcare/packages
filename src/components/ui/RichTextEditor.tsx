"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import { ResizableImage } from "@/components/ui/ResizableImageExtension";
import { useEffect, useRef, useState } from "react";
import {
  Bold, Italic, UnderlineIcon, Strikethrough, Link2, AlignLeft, AlignCenter,
  AlignRight, List, ListOrdered, Quote, Minus, Undo, Redo, Highlighter,
  ImageIcon, X, Loader2, MoveLeft, MoveRight,
} from "lucide-react";

interface Props {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: number;
}

// ── Toolbar button ────────────────────────────────────────────────────────────
function ToolbarButton({
  onClick, active, title, children,
}: {
  onClick: () => void;
  active?: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      onMouseDown={(e) => { e.preventDefault(); onClick(); }}
      className={`p-1.5 rounded transition-colors ${active ? "bg-primary text-white" : "text-gray-600 hover:bg-gray-100"}`}
    >
      {children}
    </button>
  );
}

// ── Inline popover dialog ─────────────────────────────────────────────────────
function Popover({
  title, onClose, children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="absolute left-0 top-full mt-1 z-50 bg-white border border-gray-200 rounded-xl shadow-lg p-4 w-80">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-semibold text-gray-800">{title}</p>
        <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <X className="w-4 h-4" />
        </button>
      </div>
      {children}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function RichTextEditor({ value, onChange, placeholder, minHeight = 240 }: Props) {
  const [linkPopover, setLinkPopover]   = useState(false);
  const [imagePopover, setImagePopover] = useState(false);
  const [linkUrl, setLinkUrl]           = useState("");
  const [imageUrl, setImageUrl]         = useState("");
  const [imageAlign, setImageAlign]     = useState<"left" | "center" | "right">("left");
  const [uploading, setUploading]       = useState(false);
  const [uploadError, setUploadError]   = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const toolbarRef   = useRef<HTMLDivElement>(null);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Underline,
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      Link.configure({ openOnClick: false, HTMLAttributes: { class: "text-primary underline" } }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      ResizableImage,
    ],
    content: value || "",
    editorProps: {
      attributes: {
        class: "prose prose-sm max-w-none focus:outline-none px-4 py-3",
        style: `min-height: ${minHeight}px`,
        "data-placeholder": placeholder ?? "Compose your message…",
      },
    },
    onUpdate({ editor }) {
      onChange(editor.getHTML());
    },
  });

  // Sync external reset (e.g. after send)
  useEffect(() => {
    if (editor && value === "" && editor.getText() !== "") {
      editor.commands.clearContent();
    }
  }, [value, editor]);

  // Prefill link URL when popover opens
  useEffect(() => {
    if (linkPopover && editor) {
      setLinkUrl(editor.getAttributes("link").href ?? "");
    }
  }, [linkPopover, editor]);

  // Close popovers on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (toolbarRef.current && !toolbarRef.current.contains(e.target as Node)) {
        setLinkPopover(false);
        setImagePopover(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const applyLink = () => {
    if (!editor) return;
    if (!linkUrl.trim()) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
    } else {
      editor.chain().focus().extendMarkRange("link").setLink({ href: linkUrl.trim() }).run();
    }
    setLinkPopover(false);
  };

  const insertImage = (src: string) => {
    if (!editor || !src.trim()) return;
    editor.chain().focus().insertContent({
      type: "image",
      attrs: { src: src.trim(), align: imageAlign },
    }).run();
    setImageUrl("");
    setImagePopover(false);
  };

  const uploadImageFile = async (file: File) => {
    setUploading(true);
    setUploadError(null);
    try {
      // Hash file content so identical files always map to the same public_id
      const hashBuffer = await crypto.subtle.digest("SHA-256", await file.arrayBuffer());
      const publicId   = Array.from(new Uint8Array(hashBuffer))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");

      const sigRes = await fetch("/api/upload/signature", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publicId }),
      });
      if (!sigRes.ok) throw new Error("Could not get upload credentials.");
      const { signature, timestamp, apiKey, cloudName, folder } = await sigRes.json();

      const form = new FormData();
      form.append("file", file);
      form.append("api_key", apiKey);
      form.append("timestamp", String(timestamp));
      form.append("signature", signature);
      form.append("folder", folder);
      form.append("public_id", publicId);
      form.append("overwrite", "false");

      const upRes = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        { method: "POST", body: form }
      );

      if (!upRes.ok) {
        const errData = await upRes.json().catch(() => ({}));
        // Cloudinary returns 400 "public_id already exists" when overwrite=false
        if (errData?.error?.message?.toLowerCase().includes("already exists")) {
          // Reuse the existing asset — no new upload needed
          const existingUrl = `https://res.cloudinary.com/${cloudName}/image/upload/${folder}/${publicId}`;
          insertImage(existingUrl);
          return;
        }
        throw new Error(errData?.error?.message ?? "Upload failed.");
      }

      const { secure_url } = await upRes.json();
      insertImage(secure_url);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  if (!editor) return null;

  const iconSize = "w-4 h-4";

  return (
    <div className="border border-gray-200 rounded-xl overflow-visible focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-colors">
      {/* Toolbar */}
      <div ref={toolbarRef} className="relative flex flex-wrap items-center gap-0.5 px-2 py-1.5 bg-gray-50 border-b border-gray-200 rounded-t-xl">

        {/* History */}
        <ToolbarButton title="Undo" onClick={() => editor.chain().focus().undo().run()}>
          <Undo className={iconSize} />
        </ToolbarButton>
        <ToolbarButton title="Redo" onClick={() => editor.chain().focus().redo().run()}>
          <Redo className={iconSize} />
        </ToolbarButton>

        <div className="w-px h-5 bg-gray-200 mx-1" />

        {/* Headings */}
        {([1, 2, 3] as const).map((level) => (
          <ToolbarButton
            key={level}
            title={`Heading ${level}`}
            onClick={() => editor.chain().focus().toggleHeading({ level }).run()}
            active={editor.isActive("heading", { level })}
          >
            <span className="text-xs font-bold px-0.5">H{level}</span>
          </ToolbarButton>
        ))}

        <div className="w-px h-5 bg-gray-200 mx-1" />

        {/* Inline marks */}
        <ToolbarButton title="Bold" onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")}>
          <Bold className={iconSize} />
        </ToolbarButton>
        <ToolbarButton title="Italic" onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")}>
          <Italic className={iconSize} />
        </ToolbarButton>
        <ToolbarButton title="Underline" onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive("underline")}>
          <UnderlineIcon className={iconSize} />
        </ToolbarButton>
        <ToolbarButton title="Strikethrough" onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive("strike")}>
          <Strikethrough className={iconSize} />
        </ToolbarButton>
        <ToolbarButton title="Highlight" onClick={() => editor.chain().focus().toggleHighlight().run()} active={editor.isActive("highlight")}>
          <Highlighter className={iconSize} />
        </ToolbarButton>

        {/* Link popover */}
        <ToolbarButton
          title="Link"
          onClick={() => { setImagePopover(false); setLinkPopover((v) => !v); }}
          active={editor.isActive("link") || linkPopover}
        >
          <Link2 className={iconSize} />
        </ToolbarButton>

        {linkPopover && (
          <Popover title="Insert Link" onClose={() => setLinkPopover(false)}>
            <input
              autoFocus
              type="url"
              placeholder="https://example.com"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && applyLink()}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary mb-3"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={applyLink}
                className="flex-1 py-2 bg-primary text-white text-xs font-semibold rounded-lg hover:bg-primary-dark transition-colors"
              >
                Apply
              </button>
              {editor.isActive("link") && (
                <button
                  type="button"
                  onClick={() => {
                    editor.chain().focus().extendMarkRange("link").unsetLink().run();
                    setLinkPopover(false);
                  }}
                  className="flex-1 py-2 bg-red-50 text-red-600 text-xs font-semibold rounded-lg hover:bg-red-100 transition-colors"
                >
                  Remove
                </button>
              )}
            </div>
          </Popover>
        )}

        <div className="w-px h-5 bg-gray-200 mx-1" />

        {/* Text colour */}
        <label title="Text colour" className="p-1.5 rounded hover:bg-gray-100 cursor-pointer relative">
          <span className="text-xs font-bold text-gray-600">A</span>
          <input
            type="color"
            className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
            value={editor.getAttributes("textStyle").color ?? "#000000"}
            onInput={(e) => editor.chain().focus().setColor((e.target as HTMLInputElement).value).run()}
          />
        </label>

        <div className="w-px h-5 bg-gray-200 mx-1" />

        {/* Alignment */}
        <ToolbarButton title="Align left" onClick={() => editor.chain().focus().setTextAlign("left").run()} active={editor.isActive({ textAlign: "left" })}>
          <AlignLeft className={iconSize} />
        </ToolbarButton>
        <ToolbarButton title="Align centre" onClick={() => editor.chain().focus().setTextAlign("center").run()} active={editor.isActive({ textAlign: "center" })}>
          <AlignCenter className={iconSize} />
        </ToolbarButton>
        <ToolbarButton title="Align right" onClick={() => editor.chain().focus().setTextAlign("right").run()} active={editor.isActive({ textAlign: "right" })}>
          <AlignRight className={iconSize} />
        </ToolbarButton>

        <div className="w-px h-5 bg-gray-200 mx-1" />

        {/* Lists */}
        <ToolbarButton title="Bullet list" onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive("bulletList")}>
          <List className={iconSize} />
        </ToolbarButton>
        <ToolbarButton title="Numbered list" onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive("orderedList")}>
          <ListOrdered className={iconSize} />
        </ToolbarButton>
        <ToolbarButton title="Blockquote" onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive("blockquote")}>
          <Quote className={iconSize} />
        </ToolbarButton>
        <ToolbarButton title="Divider" onClick={() => editor.chain().focus().setHorizontalRule().run()}>
          <Minus className={iconSize} />
        </ToolbarButton>

        <div className="w-px h-5 bg-gray-200 mx-1" />

        {/* Image popover */}
        <ToolbarButton
          title="Insert image"
          onClick={() => { setLinkPopover(false); setImagePopover((v) => !v); setUploadError(null); }}
          active={imagePopover}
        >
          <ImageIcon className={iconSize} />
        </ToolbarButton>

        {imagePopover && (
          <Popover title="Insert Image" onClose={() => setImagePopover(false)}>
            {/* Alignment */}
            <p className="text-xs font-semibold text-gray-500 mb-1.5">Alignment</p>
            <div className="flex gap-1 mb-3">
              {(["left", "center", "right"] as const).map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => setImageAlign(a)}
                  className={`flex-1 flex items-center justify-center py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                    imageAlign === a ? "bg-primary text-white border-primary" : "border-gray-200 text-gray-600 hover:border-primary/40"
                  }`}
                >
                  {a === "left" ? <MoveLeft className="w-3.5 h-3.5" /> : a === "right" ? <MoveRight className="w-3.5 h-3.5" /> : <AlignCenter className="w-3.5 h-3.5" />}
                </button>
              ))}
            </div>

            {/* Upload from device */}
            <p className="text-xs font-semibold text-gray-500 mb-1.5">Upload from device</p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) uploadImageFile(file);
                e.target.value = "";
              }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="w-full flex items-center justify-center gap-2 py-2 border-2 border-dashed border-gray-200 rounded-lg text-sm text-gray-500 hover:border-primary/40 hover:text-primary transition-colors disabled:opacity-50 mb-3"
            >
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
              {uploading ? "Uploading…" : "Choose image"}
            </button>

            {uploadError && <p className="text-xs text-red-500 mb-2">{uploadError}</p>}

            {/* Or insert by URL */}
            <p className="text-xs font-semibold text-gray-500 mb-1.5">Or paste image URL</p>
            <input
              type="url"
              placeholder="https://example.com/image.png"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && insertImage(imageUrl)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary mb-3"
            />
            <button
              type="button"
              onClick={() => insertImage(imageUrl)}
              disabled={!imageUrl.trim()}
              className="w-full py-2 bg-primary text-white text-xs font-semibold rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-40"
            >
              Insert
            </button>
          </Popover>
        )}
      </div>

      {/* Editor canvas */}
      <EditorContent editor={editor} />
    </div>
  );
}
