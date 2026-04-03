import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer, NodeViewWrapper, NodeViewContent } from "@tiptap/react";
import React from "react";

const PALETTE: { id: string; bg: string; border: string }[] = [
  { id: "gray",   bg: "#f5f5f5", border: "#e5e5e5" },
  { id: "blue",   bg: "#eff6ff", border: "#bfdbfe" },
  { id: "green",  bg: "#f0fdf4", border: "#bbf7d0" },
  { id: "yellow", bg: "#fffbeb", border: "#fde68a" },
  { id: "red",    bg: "#fef2f2", border: "#fecaca" },
  { id: "purple", bg: "#faf5ff", border: "#e9d5ff" },
];

const getColor = (id: string) => PALETTE.find(p => p.id === id) ?? PALETTE[0];

const CalloutView = ({ node, updateAttributes }: any) => {
  const colorId = (node.attrs.color as string) || "gray";
  const color = getColor(colorId);

  return (
    <NodeViewWrapper>
      <div
        className="callout-block"
        style={{ background: color.bg, border: `1.5px solid ${color.border}`, borderRadius: 10, padding: "14px 18px", margin: "1em 0", position: "relative" }}
      >
        {/* Palette — shown via CSS :hover on .callout-block */}
        <div className="callout-palette" contentEditable={false}>
          {PALETTE.map(p => (
            <button
              key={p.id}
              className={`callout-swatch ${p.id === colorId ? "active" : ""}`}
              style={{ background: p.bg, border: `2px solid ${p.id === colorId ? "#555" : p.border}` }}
              onMouseDown={e => { e.preventDefault(); updateAttributes({ color: p.id }); }}
              title={p.id}
            />
          ))}
        </div>
        <NodeViewContent className="callout-content" style={{ fontSize: 14.5, lineHeight: 1.65, color: "#333" }} />
      </div>
    </NodeViewWrapper>
  );
};

export const Callout = Node.create({
  name: "callout",
  group: "block",
  content: "block+",
  draggable: true,

  addAttributes() {
    return {
      color: { default: "gray" },
      type: { default: null }, // backward compat
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="callout"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    const typeMap: Record<string, string> = { info: "blue", tip: "green", warning: "yellow", danger: "red" };
    const colorId: string = HTMLAttributes.color
      || (HTMLAttributes.type ? (typeMap[HTMLAttributes.type as string] ?? "gray") : "gray");
    return ["div", mergeAttributes(HTMLAttributes, {
      "data-type": "callout",
      "data-color": colorId,
      class: `callout callout-${colorId}`,
    }), 0];
  },

  addNodeView() {
    return ReactNodeViewRenderer(CalloutView);
  },
});
