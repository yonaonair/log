import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer, NodeViewWrapper } from "@tiptap/react";
import React from "react";

const MessageBubbleView = ({ node, updateAttributes, selected }: any) => {
  const { side, text, sender } = node.attrs;
  return (
    <NodeViewWrapper className="message-bubble-wrapper" data-drag-handle>
      <div className={`msg-thread-item msg-${side}`} style={{ outline: selected ? "2px solid #3b82f6" : "none", borderRadius: 12 }}>
        {sender && <div className="msg-sender">{sender}</div>}
        <div
          className={`msg-bubble msg-bubble-${side}`}
          suppressContentEditableWarning
          contentEditable
          onBlur={e => updateAttributes({ text: e.currentTarget.textContent ?? "" })}
          dangerouslySetInnerHTML={{ __html: text }}
        />
        <div className="msg-controls">
          <button
            className={`msg-side-btn ${side === "left" ? "active" : ""}`}
            onClick={() => updateAttributes({ side: "left" })}
          >← 왼쪽</button>
          <button
            className={`msg-side-btn ${side === "right" ? "active" : ""}`}
            onClick={() => updateAttributes({ side: "right" })}
          >오른쪽 →</button>
        </div>
      </div>
    </NodeViewWrapper>
  );
};

export const MessageBubble = Node.create({
  name: "messageBubble",
  group: "block",
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      side: { default: "left" },
      text: { default: "" },
      sender: { default: "" },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="message-bubble"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, { "data-type": "message-bubble", class: `msg-bubble-${HTMLAttributes.side}` }),
      HTMLAttributes.text,
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(MessageBubbleView);
  },
});
