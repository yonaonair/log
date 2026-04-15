import { Node, InputRule } from "@tiptap/core";
import { NodeViewWrapper, ReactNodeViewRenderer } from "@tiptap/react";
import type { NodeViewProps } from "@tiptap/react";
import { useState, useEffect, useCallback, useRef } from "react";

// Lazy-load mermaid only in the browser (avoids SSR failures)
type MermaidType = typeof import("mermaid").default;
let mermaidInstance: MermaidType | null = null;
const getMermaid = async (): Promise<MermaidType> => {
  if (!mermaidInstance) {
    const m = await import("mermaid");
    mermaidInstance = m.default;
    mermaidInstance.initialize({ startOnLoad: false, theme: "neutral", securityLevel: "loose" });
  }
  return mermaidInstance;
};

let mermaidCounter = 0;

function MermaidView({ node, updateAttributes }: NodeViewProps) {
  const { code = "" } = node.attrs as { code: string };
  const [svg, setSvg] = useState("");
  const [renderError, setRenderError] = useState("");
  const [isEditing, setIsEditing] = useState(!code.trim());
  const [editValue, setEditValue] = useState(code);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Render diagram when code changes (lazy-load mermaid, browser only)
  useEffect(() => {
    if (!code.trim()) { setSvg(""); setRenderError(""); return; }
    const id = `mermaid-${++mermaidCounter}`;
    let cancelled = false;
    getMermaid().then(m =>
      m.render(id, code)
        .then(({ svg }) => { if (!cancelled) { setSvg(svg); setRenderError(""); } })
        .catch((e: Error) => { if (!cancelled) { setSvg(""); setRenderError(e.message ?? "렌더링 오류"); } })
    );
    return () => { cancelled = true; };
  }, [code]);

  const startEdit = useCallback(() => {
    setEditValue(code);
    setIsEditing(true);
    // Focus textarea after state update
    requestAnimationFrame(() => textareaRef.current?.focus());
  }, [code]);

  const commitEdit = useCallback(() => {
    updateAttributes({ code: editValue });
    setIsEditing(false);
  }, [editValue, updateAttributes]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Escape") {
        e.preventDefault();
        commitEdit();
      }
      // Tab → 2 spaces inside textarea
      if (e.key === "Tab") {
        e.preventDefault();
        const el = e.currentTarget;
        const start = el.selectionStart;
        const end = el.selectionEnd;
        const val = el.value;
        setEditValue(val.slice(0, start) + "  " + val.slice(end));
        requestAnimationFrame(() => {
          el.selectionStart = el.selectionEnd = start + 2;
        });
      }
    },
    [commitEdit]
  );

  const lineCount = editValue.split("\n").length;

  return (
    <NodeViewWrapper as="div" contentEditable={false} className="mermaid-block-wrapper">
      {isEditing ? (
        <div className="mermaid-editor">
          <div className="mermaid-editor-header">
            <span className="mermaid-lang-label">mermaid</span>
            <button
              className="mermaid-render-btn"
              onMouseDown={e => { e.preventDefault(); commitEdit(); }}
              title="렌더링 (Esc)"
            >
              렌더링
            </button>
          </div>
          <textarea
            ref={textareaRef}
            className="mermaid-textarea"
            value={editValue}
            onChange={e => setEditValue(e.target.value)}
            onBlur={commitEdit}
            onKeyDown={handleKeyDown}
            rows={Math.max(4, lineCount + 1)}
            spellCheck={false}
            autoCorrect="off"
            autoCapitalize="off"
          />
        </div>
      ) : (
        <div
          className={`mermaid-diagram${renderError ? " mermaid-error" : ""}`}
          onClick={startEdit}
          title="클릭하여 편집"
        >
          {renderError ? (
            <div className="mermaid-error-msg">
              <span className="mermaid-lang-label">mermaid — 오류</span>
              <pre>{renderError}</pre>
              <pre className="mermaid-source">{code}</pre>
            </div>
          ) : svg ? (
            <div dangerouslySetInnerHTML={{ __html: svg }} />
          ) : (
            <div className="mermaid-empty">
              <span>클릭하여 Mermaid 다이어그램 편집</span>
            </div>
          )}
        </div>
      )}
    </NodeViewWrapper>
  );
}

export const MermaidBlock = Node.create({
  name: "mermaidBlock",
  group: "block",
  atom: true,
  draggable: true,
  selectable: true,

  addAttributes() {
    return {
      code: { default: "graph TD\n  A --> B" },
    };
  },

  parseHTML() {
    return [
      {
        tag: "pre.mermaid-block",
        getAttrs: el => ({ code: (el as HTMLElement).textContent ?? "" }),
      },
      {
        // Parse from CodeBlockLowlight HTML output (for loading from markdown)
        tag: "pre",
        getAttrs: (el) => {
          const pre = el as HTMLElement;
          const code = pre.querySelector("code.language-mermaid");
          if (!code) return false;
          return { code: code.textContent ?? "" };
        },
      },
    ];
  },

  renderHTML({ node }) {
    return ["pre", { class: "mermaid-block" }, node.attrs.code as string];
  },

  addInputRules() {
    return [
      new InputRule({
        find: /^```mermaid[\s]$/,
        handler: ({ chain, range }) => {
          chain()
            .deleteRange(range)
            .insertContent({ type: "mermaidBlock", attrs: { code: "graph TD\n  A --> B" } })
            .run();
        },
      }),
    ];
  },

  addStorage() {
    return {
      markdown: {
        serialize(
          state: { write: (s: string) => void; ensureNewLine: () => void; closeBlock: (n: unknown) => void },
          node: { attrs: { code?: string } }
        ) {
          const code = (node.attrs.code ?? "").replace(/\n$/, "");
          state.write("```mermaid\n");
          state.write(code);
          state.ensureNewLine();
          state.write("```");
          state.closeBlock(node);
        },
        parse: {},
      },
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(MermaidView);
  },
});
