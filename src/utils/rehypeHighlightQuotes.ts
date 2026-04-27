import type { Root, Text, Element } from "hast";

const FORBIDDEN_TAGS = new Set(["code", "pre", "script", "style"]);

function makeSpan(className: string, text: string): Element {
  return {
    type: "element",
    tagName: "span",
    properties: { className: [className] },
    children: [{ type: "text", value: text }],
  };
}

// Matches both ASCII quotes ("...") and typographic curly quotes (“…” / ‘…’)
const DOUBLE_QUOTE_RE = /["“]([^"“”\n]+)["”]/g;
const SINGLE_QUOTE_RE = /['‘]([^'‘’\n]+)['’]/g;
const EITHER_RE = /["“]([^"“”\n]+)["”]|['‘]([^'‘’\n]+)['’]/g;

function splitTextNode(value: string): (Text | Element)[] {
  const parts: (Text | Element)[] = [];
  const pattern = new RegExp(EITHER_RE.source, "g");
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = pattern.exec(value)) !== null) {
    if (m.index > last) {
      parts.push({ type: "text", value: value.slice(last, m.index) });
    }
    if (m[1] !== undefined) {
      parts.push(makeSpan("hl-yellow", m[1]));
    } else if (m[2] !== undefined) {
      parts.push(makeSpan("hl-blue", m[2]));
    }
    last = m.index + m[0].length;
  }
  if (last < value.length) {
    parts.push({ type: "text", value: value.slice(last) });
  }
  return parts;
}

function hasQuotes(value: string): boolean {
  DOUBLE_QUOTE_RE.lastIndex = 0;
  SINGLE_QUOTE_RE.lastIndex = 0;
  return DOUBLE_QUOTE_RE.test(value) || SINGLE_QUOTE_RE.test(value);
}

function processNode(node: Root | Element, insideForbidden: boolean): void {
  const children = node.children as (Root | Element | Text)[];
  let i = 0;
  while (i < children.length) {
    const child = children[i];
    if (child.type === "element") {
      const el = child as Element;
      processNode(el, insideForbidden || FORBIDDEN_TAGS.has(el.tagName));
      i++;
    } else if (child.type === "text" && !insideForbidden) {
      const textNode = child as Text;
      if (hasQuotes(textNode.value)) {
        const replacement = splitTextNode(textNode.value);
        if (!(replacement.length === 1 && replacement[0].type === "text")) {
          (children as unknown[]).splice(i, 1, ...replacement);
          i += replacement.length;
          continue;
        }
      }
      i++;
    } else {
      i++;
    }
  }
}

export function rehypeHighlightQuotes() {
  return (tree: Root) => {
    processNode(tree, false);
  };
}
