import { Node, mergeAttributes, InputRule } from "@tiptap/core";
import { ReactNodeViewRenderer, NodeViewWrapper } from "@tiptap/react";
import React from "react";

const WikiLinkView = ({ node }: any) => {
  const title = node.attrs.title as string;
  const slug = title
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9가-힣-]/g, "");

  return (
    <NodeViewWrapper as="span">
      <a
        href={`/posts/${slug}`}
        className="wiki-link"
        title={`→ ${title}`}
        onClick={e => e.preventDefault()} // prevent navigation while editing
      >
        {title}
      </a>
    </NodeViewWrapper>
  );
};

export const WikiLink = Node.create({
  name: "wikiLink",
  group: "inline",
  inline: true,
  atom: true,

  addAttributes() {
    return {
      title: { default: "" },
    };
  },

  parseHTML() {
    return [{ tag: "a[data-wikilink]" }];
  },

  renderHTML({ HTMLAttributes }) {
    const slug = (HTMLAttributes.title as string)
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9가-힣-]/g, "");
    return ["a", mergeAttributes(HTMLAttributes, {
      "data-wikilink": "",
      href: `/posts/${slug}`,
      class: "wiki-link",
    }), `[[${HTMLAttributes.title}]]`];
  },

  addInputRules() {
    return [
      // [[title]] → wikiLink node
      new InputRule({
        find: /\[\[([^\]]+)\]\]$/,
        handler: ({ state, range, match }) => {
          const title = match[1];
          if (!title) return null;
          const { tr } = state;
          const node = state.schema.nodes.wikiLink.create({ title });
          tr.replaceWith(range.from, range.to, node);
          return null;
        },
      }),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(WikiLinkView);
  },
});
