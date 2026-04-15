import { Mark, markInputRule } from "@tiptap/core";

// "text" → 노란 배경 + 진한 회색 글자 (inline code 스타일)
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
      markInputRule({ find: /"([^"]+)"/, type: this.type }),
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

// 'text' → 파란 배경 + 파란 글자 (inline code 스타일)
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
      markInputRule({ find: /'([^']+)'/, type: this.type }),
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
