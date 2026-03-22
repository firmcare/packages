"use client";

import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer, NodeViewWrapper } from "@tiptap/react";
import { useRef, useCallback } from "react";

// ── React node view ───────────────────────────────────────────────────────────
function ResizableImageView({ node, updateAttributes, selected }: any) {
  const imgRef = useRef<HTMLImageElement>(null);

  const onDragHandle = useCallback(
    (e: React.MouseEvent<HTMLDivElement>, direction: "se" | "sw") => {
      e.preventDefault();
      const startX = e.clientX;
      const startWidth = imgRef.current?.offsetWidth ?? (node.attrs.width ?? 400);

      const onMove = (moveE: MouseEvent) => {
        const delta = direction === "se" ? moveE.clientX - startX : startX - moveE.clientX;
        const newWidth = Math.max(80, Math.round(startWidth + delta));
        updateAttributes({ width: newWidth });
      };

      const onUp = () => {
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
      };

      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
    },
    [node.attrs.width, updateAttributes]
  );

  const width = node.attrs.width ? `${node.attrs.width}px` : "auto";
  const align: string = node.attrs.align ?? "left";
  const justifyMap: Record<string, string> = {
    left: "flex-start",
    center: "center",
    right: "flex-end",
  };

  return (
    <NodeViewWrapper
      style={{ display: "flex", justifyContent: justifyMap[align] ?? "flex-start", padding: "4px 0" }}
    >
      <div
        style={{ position: "relative", display: "inline-block", width }}
        className={selected ? "ring-2 ring-primary ring-offset-1 rounded" : ""}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={imgRef}
          src={node.attrs.src}
          alt={node.attrs.alt ?? ""}
          style={{ width: "100%", height: "auto", display: "block", borderRadius: "0.375rem" }}
          draggable={false}
        />

        {/* Resize handles — only show when selected */}
        {selected && (
          <>
            {/* Bottom-right */}
            <div
              onMouseDown={(e) => onDragHandle(e, "se")}
              style={{
                position: "absolute", bottom: -5, right: -5,
                width: 12, height: 12, background: "white",
                border: "2px solid #9333ea", borderRadius: 2, cursor: "se-resize",
              }}
            />
            {/* Bottom-left */}
            <div
              onMouseDown={(e) => onDragHandle(e, "sw")}
              style={{
                position: "absolute", bottom: -5, left: -5,
                width: 12, height: 12, background: "white",
                border: "2px solid #9333ea", borderRadius: 2, cursor: "sw-resize",
              }}
            />
          </>
        )}
      </div>
    </NodeViewWrapper>
  );
}

// ── Tiptap extension ──────────────────────────────────────────────────────────
export const ResizableImage = Node.create({
  name: "image",
  group: "block",
  atom: true,
  draggable: true,
  selectable: true,

  addAttributes() {
    return {
      src:   { default: null },
      alt:   { default: null },
      title: { default: null },
      width: { default: null },
      align: { default: "left" },
    };
  },

  parseHTML() {
    return [{ tag: "img[src]" }];
  },

  renderHTML({ HTMLAttributes }) {
    const { width, align, ...rest } = HTMLAttributes;
    const style = [
      width ? `width:${width}px` : null,
      align === "center" ? "display:block;margin:0 auto" :
      align === "right"  ? "display:block;margin-left:auto" : null,
    ].filter(Boolean).join(";");
    return ["img", mergeAttributes(rest, { style: style || undefined, class: "max-w-full rounded-md" })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ResizableImageView);
  },
});
