import { Node, mergeAttributes, InputRule } from "@tiptap/core";
import { ReactNodeViewRenderer, NodeViewWrapper } from "@tiptap/react";
import React, { useState, useRef } from "react";
import { createPortal } from "react-dom";

const AnnotationView = ({ node, getPos, editor }: any) => {
  const [tip, setTip] = useState<{ x: number; y: number } | null>(null);
  const spanRef = useRef<HTMLSpanElement>(null);

  // Count annotation index by scanning doc up to this node's position
  let index = 1;
  try {
    const pos = typeof getPos === "function" ? getPos() : 0;
    editor.state.doc.nodesBetween(0, pos, (n: any) => {
      if (n.type.name === "annotation") index++;
    });
  } catch {}

  const handleEnter = () => {
    if (!spanRef.current) return;
    const rect = spanRef.current.getBoundingClientRect();
    setTip({ x: rect.left + rect.width / 2, y: rect.top });
  };

  return (
    <NodeViewWrapper as="span" style={{ display: "inline" }}>
      <span
        ref={spanRef}
        className="annotation-text"
        onMouseEnter={handleEnter}
        onMouseLeave={() => setTip(null)}
      >
        {node.attrs.text}
        <sup className="annotation-num">{index}</sup>
      </span>
      {tip && node.attrs.note && createPortal(
        <div
          className="annotation-tooltip"
          style={{ position: "fixed", top: tip.y - 6, left: tip.x, transform: "translate(-50%, -100%)" }}
        >
          <span className="annotation-tooltip-num">{index}</span>
          {node.attrs.note}
        </div>,
        document.body
      )}
    </NodeViewWrapper>
  );
};

export const Annotation = Node.create({
  name: "annotation",
  group: "inline",
  inline: true,
  atom: true,

  addAttributes() {
    return {
      text: { default: "" },
      note: { default: "" },
    };
  },

  parseHTML() {
    return [{ tag: "span[data-annotation]" }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["span", mergeAttributes(HTMLAttributes, {
      "data-annotation": "",
      "data-note": HTMLAttributes.note,
      class: "annotation-text",
    }), HTMLAttributes.text];
  },

  addNodeView() {
    return ReactNodeViewRenderer(AnnotationView);
  },

  // Input rules:
  //   word^[footnote content]   (Pandoc inline footnote style)
  //   [annotated text](^note)   (legacy style)
  addInputRules() {
    return [
      // word^[content] → annotation { text: word, note: content }
      new InputRule({
        find: /(\S+)\^\[([^\]]+)\]$/,
        handler: ({ chain, range, match }) => {
          const text = match[1];
          const note = match[2];
          if (!text || !note) return;
          chain()
            .deleteRange(range)
            .insertContent({ type: "annotation", attrs: { text, note } })
            .run();
        },
      }),
      // [text](^note) → annotation (legacy syntax)
      new InputRule({
        find: /\[([^\]]+)\]\(\^([^)]+)\)$/,
        handler: ({ chain, range, match }) => {
          const text = match[1];
          const note = match[2];
          if (!text || !note) return;
          chain()
            .deleteRange(range)
            .insertContent({ type: "annotation", attrs: { text, note } })
            .run();
        },
      }),
    ];
  },
});
