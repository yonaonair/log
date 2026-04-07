import { Image } from "@tiptap/extension-image";
import { NodeViewWrapper, ReactNodeViewRenderer } from "@tiptap/react";
import { useState, useRef, useCallback, useEffect } from "react";
import { AlignLeft, AlignCenter, AlignRight } from "lucide-react";
import type { NodeViewProps } from "@tiptap/react";

type Align = "left" | "center" | "right" | null;

function ResizableImageView({ node, updateAttributes, selected }: NodeViewProps) {
  const { src, alt, title, width, align } = node.attrs as {
    src: string; alt: string; title: string; width: number | null; align: Align;
  };
  const [inputWidth, setInputWidth] = useState(width ? String(width) : "");
  const imgRef = useRef<HTMLImageElement>(null);
  const drag = useRef<{ startX: number; startW: number; dir: 1 | -1 } | null>(null);

  useEffect(() => {
    setInputWidth(width ? String(width) : "");
  }, [width]);

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

  const wrapperStyle: React.CSSProperties = {
    display: align ? "block" : "inline-block",
    position: "relative",
    verticalAlign: "middle",
    ...(align === "center" ? { marginLeft: "auto", marginRight: "auto" } : {}),
    ...(align === "right" ? { marginLeft: "auto" } : {}),
    ...(align === "left" ? { marginRight: "auto" } : {}),
    width: width ? `${width}px` : "fit-content",
    maxWidth: "100%",
  };

  return (
    <NodeViewWrapper style={wrapperStyle} className={`resizable-image-wrapper${selected ? " is-selected" : ""}`}>
      <img
        ref={imgRef}
        src={src}
        alt={alt ?? ""}
        title={title ?? undefined}
        style={{
          width: width ? "100%" : "auto",
          maxWidth: "100%",
          display: "block",
        }}
        draggable={false}
      />
      {selected && (
        <>
          <div className="resize-handle resize-handle-w" onMouseDown={e => startResize(e, -1)} />
          <div className="resize-handle resize-handle-e" onMouseDown={e => startResize(e, 1)} />
          <div className="image-toolbar" contentEditable={false}>
            <div className="image-align-btns">
              {(["left", "center", "right"] as const).map(a => (
                <button
                  key={a}
                  className={`img-toolbar-btn${align === a ? " active" : ""}`}
                  onMouseDown={e => { e.preventDefault(); updateAttributes({ align: align === a ? null : a }); }}
                  title={a === "left" ? "왼쪽 정렬" : a === "center" ? "가운데 정렬" : "오른쪽 정렬"}
                >
                  {a === "left" ? <AlignLeft size={12} /> : a === "center" ? <AlignCenter size={12} /> : <AlignRight size={12} />}
                </button>
              ))}
            </div>
            <div className="image-width-control">
              <input
                type="number"
                value={inputWidth}
                onChange={e => setInputWidth(e.target.value)}
                onBlur={() => {
                  if (!inputWidth.trim()) {
                    updateAttributes({ width: null });
                    setInputWidth("");
                    return;
                  }
                  const n = parseInt(inputWidth, 10);
                  if (!isNaN(n) && n >= 50) updateAttributes({ width: n });
                  else setInputWidth(width ? String(width) : "");
                }}
                onKeyDown={e => {
                  if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                  e.stopPropagation();
                }}
                min={50}
                placeholder="너비"
              />
              <span>px</span>
            </div>
          </div>
        </>
      )}
    </NodeViewWrapper>
  );
}

export const ResizableImage = Image.extend({
  addOptions() {
    return {
      ...this.parent?.(),
      inline: true,
    };
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
          node: {
            attrs: {
              src: string;
              alt?: string | null;
              title?: string | null;
              width?: number | null;
              align?: Align;
            };
          }
        ) {
          const { src, alt, title, width, align } = node.attrs;
          if (width || align) {
            let styleVal = "";
            if (align === "center") styleVal = "display:block;margin:0 auto";
            else if (align === "right") styleVal = "display:block;margin-left:auto";
            else if (align === "left") styleVal = "display:block;margin-right:auto";
            const attrs = [
              `src="${src}"`,
              alt ? `alt="${alt}"` : "",
              title ? `title="${title}"` : "",
              width ? `width="${width}"` : "",
              styleVal ? `style="${styleVal}"` : "",
            ].filter(Boolean).join(" ");
            state.write(`<img ${attrs}>`);
          } else {
            state.write(
              `![${(alt ?? "").replace(/[[\]]/g, "\\$&")}](${src}${title ? ` "${title}"` : ""})`
            );
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
