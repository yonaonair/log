import { Extension } from "@tiptap/core";
import { InputRule } from "@tiptap/core";

// "text" → <mark class="highlight-yellow">text</mark>
// Triggered when user types closing " after opening "
export const YellowHighlightRule = Extension.create({
  name: "yellowHighlightRule",

  addInputRules() {
    return [
      new InputRule({
        find: /"([^"]+)"/,
        handler: ({ state, range, match }) => {
          const { tr } = state;
          const start = range.from;
          const end = range.to;
          const text = match[1];

          if (!text) return null;

          const highlightMark = state.schema.marks.highlight;
          if (!highlightMark) return null;

          tr.replaceWith(start, end, state.schema.text(text, [highlightMark.create()]));
          return null;
        },
      }),
    ];
  },
});
