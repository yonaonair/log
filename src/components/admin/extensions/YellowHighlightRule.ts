import { Mark, Extension, InputRule } from "@tiptap/core";

// ── Mark 정의 (렌더링 + 직렬화) ──────────────────────────────────────────────

// "text" → 노란 배경 + 빨간 글자
export const HlYellow = Mark.create({
  name: "hlYellow",

  renderHTML() {
    return ["span", { class: "hl-yellow" }, 0];
  },

  parseHTML() {
    return [{ tag: "span.hl-yellow" }];
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

  addStorage() {
    return {
      markdown: {
        serialize: { open: "'", close: "'", mixable: true, expelEnclosingWhitespace: true },
        parse: {},
      },
    };
  },
});

// ── 입력 규칙 (editor.chain() 패턴) ──────────────────────────────────────────

export const HlInputRules = Extension.create({
  name: "hlInputRules",

  addInputRules() {
    return [
      // "text" → hlYellow
      new InputRule({
        find: /"([^"]+)"$/,
        handler: ({ chain, range, match }) => {
          const text = match[1];
          if (!text) return;
          chain()
            .deleteRange(range)
            .insertContent({ type: "text", text, marks: [{ type: "hlYellow" }] })
            .run();
        },
      }),
      // 'text' → hlBlue
      new InputRule({
        find: /'([^']+)'$/,
        handler: ({ chain, range, match }) => {
          const text = match[1];
          if (!text) return;
          chain()
            .deleteRange(range)
            .insertContent({ type: "text", text, marks: [{ type: "hlBlue" }] })
            .run();
        },
      }),
    ];
  },
});

// 하위 호환
export const YellowHighlightRule = HlYellow;
