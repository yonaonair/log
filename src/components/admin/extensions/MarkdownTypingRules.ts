import { Extension, InputRule } from "@tiptap/core";

const markdownLinkRegex = /\[([^\]]+)\]\((\S+?)(?:\s+"([^"]+)")?\)$/;
const markdownImageRegex = /!\[([^\]]*)\]\((\S+?)(?:\s+"([^"]+)")?\)$/;

export const MarkdownTypingRules = Extension.create({
  name: "markdownTypingRules",

  addInputRules() {
    return [
      new InputRule({
        find: markdownLinkRegex,
        handler: ({ editor, range, match }) => {
          const [, text, href] = match;

          if (!text || !href) return;

          editor
            .chain()
            .focus()
            .deleteRange(range)
            .insertContent({
              type: "text",
              text,
              marks: [{ type: "link", attrs: { href } }],
            })
            .run();
        },
      }),
      new InputRule({
        find: markdownImageRegex,
        handler: ({ editor, range, match }) => {
          const [, alt, src, title] = match;

          if (!src) return;

          editor
            .chain()
            .focus()
            .deleteRange(range)
            .insertContent({
              type: "image",
              attrs: {
                src,
                alt: alt ?? "",
                title: title ?? null,
              },
            })
            .run();
        },
      }),
    ];
  },
});
