import { Extension } from "@tiptap/core";
import { InputRule } from "@tiptap/core";

// "text" → <mark class="highlight-yellow">text</mark>
export const YellowHighlightRule = Extension.create({
  name: "yellowHighlightRule",

  addInputRules() {
    return [
      new InputRule({
        find: /"([^"]+)"/g,
        handler: ({ state, range, match }) => {
          const { tr } = state;
          const text = match[1];
          if (!text) return;

          const highlightMark = state.schema.marks.highlight;
          if (!highlightMark) return;

          tr.replaceWith(range.from, range.to, state.schema.text(text, [highlightMark.create()]));
        },
      }),
    ];
  },
});
