import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer, NodeViewWrapper } from "@tiptap/react";
import React from "react";

const BookmarkView = ({ node, selected }: any) => {
  const { url, title, description, image, siteName, favicon } = node.attrs;
  return (
    <NodeViewWrapper data-drag-handle>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="bookmark-card"
        style={{ outline: selected ? "2px solid #3b82f6" : "none" }}
        onClick={e => e.preventDefault()}
      >
        <div className="bookmark-body">
          <div className="bookmark-site">
            {favicon && <img src={favicon} alt="" className="bookmark-favicon" />}
            <span>{siteName}</span>
          </div>
          <div className="bookmark-title">{title}</div>
          {description && <div className="bookmark-desc">{description}</div>}
          <div className="bookmark-url">{url}</div>
        </div>
        {image && (
          <div className="bookmark-img">
            <img src={image} alt={title} />
          </div>
        )}
      </a>
    </NodeViewWrapper>
  );
};

export const Bookmark = Node.create({
  name: "bookmark",
  group: "block",
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      url: { default: "" },
      title: { default: "" },
      description: { default: "" },
      image: { default: "" },
      siteName: { default: "" },
      favicon: { default: "" },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="bookmark"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, { "data-type": "bookmark" })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(BookmarkView);
  },
});
