import { Image } from "@tiptap/extension-image";
import { NodeViewWrapper, ReactNodeViewRenderer } from "@tiptap/react";
import { useState, useRef, useCallback } from "react";
import { AlignLeft, AlignCenter, AlignRight } from "lucide-react";
import type { NodeViewProps } from "@tiptap/react";

type Align = "left" | "center" | "right" | null;

function ResizableImageView({
  node,
  updateAttributes,
  selected,
  editor,
  getPos,
}: NodeViewProps) {
  const { src, alt, title, width, align } = node.attrs as {
    src: string;
    alt: string;
    title: string;
    width: number | null;
    align: Align;
  };
  const [isDragging, setIsDragging] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const drag = useRef<{ startX: number; startW: number; dir: 1 | -1 } | null>(null);

  const startResize = useCallback(
    (e: React.MouseEvent, dir: 1 | -1) => {
      e.preventDefault();
      e.stopPropagation();
      const startW = width ?? imgRef.current?.offsetWidth ?? 300;
      drag.current = { startX: e.clientX, startW, dir };

      const onMove = (me: MouseEvent) => {
        if (!drag.current) return;
        const dx = (me.clientX - drag.current.startX) * drag.current.dir;
        const newW = Math.max(50, Math.round(drag.current.startW + dx));
        updateAttributes({ width: newW });
      };

      const onUp = () => {
        drag.current = null;
        document.removeEventListener("mousemove", onMove);
        document.removeEventListener("mouseup", onUp);
      };

      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onUp);
    },
    [width, updateAttributes]
  );

  const selectCurrentNode = useCallback(() => {
    const pos = typeof getPos === "function" ? getPos() : getPos;
    if (typeof pos !== "number") return;
    editor.commands.setNodeSelection(pos);
  }, [editor, getPos]);

  const wrapperStyle: React.CSSProperties = {
    display: "inline-block",
    position: "relative",
    verticalAlign: "middle",
    lineHeight: 0,
    width: width ? `${width}px` : "auto",
    maxWidth: "100%",
  };

  const outlineStyle: React.CSSProperties = {
    position: "absolute",
    inset: 0,
    border: "1px solid #c7c7cc",
    borderRadius: 0,
    pointerEvents: "none",
    zIndex: 10,
  };

  const handleStyle = (side: "left" | "right"): React.CSSProperties => ({
    position: "absolute",
    top: "50%",
    [side]: -5,
    transform: "translateY(-50%)",
    width: 10,
    height: 36,
    borderRadius: 0,
    background: "#f5f5f7",
    border: "1px solid #d2d2d7",
    boxShadow: "0 2px 8px rgba(0,0,0,.06)",
    cursor: "ew-resize",
    zIndex: 25,
  });

  const toolbarStyle: React.CSSProperties = {
    position: "absolute",
    top: "calc(100% + 8px)",
    left: "50%",
    transform: "translateX(-50%)",
    display: "inline-flex",
    alignItems: "center",
    gap: 2,
    padding: "4px",
    borderRadius: 999,
    border: "1px solid rgba(60,60,67,.16)",
    background: "rgba(255,255,255,.98)",
    boxShadow: "0 4px 16px rgba(0,0,0,.08)",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    zIndex: 30,
  };

  return (
    <NodeViewWrapper
      as="span"
      style={wrapperStyle}
      className={`resizable-image-wrapper${selected ? " is-selected" : ""}`}
      onMouseDown={() => {
        if (!selected) selectCurrentNode();
      }}
    >
      <img
        ref={imgRef}
        src={src}
        alt={alt ?? ""}
        title={title ?? undefined}
        data-drag-handle
        draggable={true}
        style={{ width: width ? "100%" : "auto", maxWidth: "100%", display: "block" }}
        onDragStart={e => {
          selectCurrentNode();
          setIsDragging(true);
          e.dataTransfer.effectAllowed = "move";
        }}
        onDragEnd={() => setIsDragging(false)}
      />
      {(selected || isDragging) && <span style={outlineStyle} />}
      {selected && (
        <>
          <span
            style={handleStyle("left")}
            onMouseDown={e => startResize(e, -1)}
          />
          <span
            style={handleStyle("right")}
            onMouseDown={e => startResize(e, 1)}
          />
          <span style={toolbarStyle} contentEditable={false}>
            {(["left", "center", "right"] as const).map(a => (
              <button
                key={a}
                onMouseDown={e => {
                  e.preventDefault();
                  const newAlign = align === a ? null : a;
                  updateAttributes({ align: newAlign });
                  // 단락 text-align을 함께 변경해야 인라인 이미지가 실제로 정렬됨
                  editor.chain().setTextAlign(newAlign ?? "left").run();
                }}
                title={a === "left" ? "왼쪽" : a === "center" ? "가운데" : "오른쪽"}
                style={{
                  width: 24,
                  height: 24,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: 999,
                  border: "none",
                  background: align === a ? "#1d1d1f" : "transparent",
                  color: align === a ? "#fff" : "#6e6e73",
                  cursor: "pointer",
                  transition: "background 120ms ease, color 120ms ease",
                }}
              >
                {a === "left" ? <AlignLeft size={11} /> : a === "center" ? <AlignCenter size={11} /> : <AlignRight size={11} />}
              </button>
            ))}
          </span>
        </>
      )}
    </NodeViewWrapper>
  );
}

export const ResizableImage = Image.extend({
  inline() {
    return true;
  },

  group() {
    return "inline";
  },

  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: null,
        parseHTML: el => {
          const w = el.getAttribute("width");
          return w ? Number(w) : null;
        },
        renderHTML: attrs => (attrs.width ? { width: String(attrs.width) } : {}),
      },
      align: {
        default: null,
        parseHTML: el => {
          const style = el.getAttribute("style") ?? "";
          if (/margin:\s*0\s+auto|margin-left:\s*auto.*margin-right:\s*auto/.test(style)) return "center";
          if (/margin-left:\s*auto/.test(style)) return "right";
          if (/float:\s*right/.test(style)) return "right";
          if (/float:\s*left/.test(style)) return "left";
          return null;
        },
        renderHTML: () => ({}),
      },
    };
  },

  addStorage() {
    return {
      markdown: {
        serialize(
          state: { write: (value: string) => void },
          node: { attrs: { src: string; alt?: string | null; title?: string | null; width?: number | null; align?: Align } }
        ) {
          const { src, alt, title, width, align } = node.attrs;
          if (width || align) {
            let styleVal = "";
            if (align === "center") styleVal = "display:block;margin:0 auto";
            else if (align === "right") styleVal = "display:block;margin-left:auto";
            else if (align === "left") styleVal = "display:block;margin-right:auto";
            const attrStr = [
              `src="${src}"`,
              alt ? `alt="${alt}"` : "",
              title ? `title="${title}"` : "",
              width ? `width="${width}"` : "",
              styleVal ? `style="${styleVal}"` : "",
            ].filter(Boolean).join(" ");
            state.write(`<img ${attrStr}>`);
          } else {
            state.write(`![${(alt ?? "").replace(/[[\]]/g, "\\$&")}](${src}${title ? ` "${title}"` : ""})`);
          }
        },
        parse: {},
      },
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(ResizableImageView);
  },
});
