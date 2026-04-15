import { Mark } from "@tiptap/core";
import { InputRule } from "@tiptap/core";

// "text" → 노란 배경 + 빨간 글자
export const HlYellow = Mark.create({
  name: "hlYellow",

  renderHTML() {
    return ["span", { class: "hl-yellow" }, 0];
  },

  parseHTML() {
    return [{ tag: "span.hl-yellow" }];
  },

  addInputRules() {
    return [
      new InputRule({
        find: /"([^"]+)"/,
        handler: ({ state, range, match }) => {
          const text = match[1];
          if (!text) return;
          state.tr.replaceWith(
            range.from,
            range.to,
            state.schema.text(text, [this.type.create()])
          );
        },
      }),
    ];
  },

  addStorage() {
    return {
      markdown: {
        serialize: { open: '"', close: '"', mixable: true, expelEnclosingWhitespace: true },
        parse: {},
      },
    };
  },
});

// 'text' → 파란 배경 + 파란 글자
export const HlBlue = Mark.create({
  name: "hlBlue",

  renderHTML() {
    return ["span", { class: "hl-blue" }, 0];
  },

  parseHTML() {
    return [{ tag: "span.hl-blue" }];
  },

  addInputRules() {
    return [
      new InputRule({
        find: /'([^']+)'/,
        handler: ({ state, range, match }) => {
          const text = match[1];
          if (!text) return;
          state.tr.replaceWith(
            range.from,
            range.to,
            state.schema.text(text, [this.type.create()])
          );
        },
      }),
    ];
  },

  addStorage() {
    return {
      markdown: {
        serialize: { open: "'", close: "'", mixable: true, expelEnclosingWhitespace: true },
        parse: {},
      },
    };
  },
});

// 하위 호환
export const YellowHighlightRule = HlYellow;
