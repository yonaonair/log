import { Extension, InputRule } from "@tiptap/core";

const markdownLinkRegex = /\[([^\]]+)\]\((\S+?)(?:\s+"([^"]+)")?\)$/;
const markdownImageRegex = /!\[([^\]]*)\]\((\S+?)(?:\s+"([^"]+)")?\)$/;

export const MarkdownTypingRules = Extension.create({
  name: "markdownTypingRules",

  addInputRules() {
    return [
      new InputRule({
        find: markdownLinkRegex,
        handler: ({ chain, range, match }) => {
          const [, text, href] = match;
          if (!text || !href) return;
          chain()
            .deleteRange(range)
            .insertContent({ type: "text", text, marks: [{ type: "link", attrs: { href } }] })
            .run();
        },
      }),
      new InputRule({
        find: markdownImageRegex,
        handler: ({ chain, range, match }) => {
          const [, alt, src, title] = match;
          if (!src) return;
          chain()
            .deleteRange(range)
            .insertContent({ type: "image", attrs: { src, alt: alt ?? "", title: title ?? null } })
            .run();
        },
      }),
      // => → →  (화살표 자동 변환)
      new InputRule({
        find: /=>$/,
        handler: ({ chain, range }) => {
          chain().deleteRange(range).insertContent("→").run();
        },
      }),
    ];
  },
});
