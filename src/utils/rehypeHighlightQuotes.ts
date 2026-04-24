import { visit } from "unist-util-visit";
import type { Root, Text, Element } from "hast";

const FORBIDDEN_TAGS = new Set(["code", "pre", "script", "style"]);

function isInsideForbidden(ancestors: (Root | Element)[]): boolean {
  return ancestors.some(
    a => "tagName" in a && FORBIDDEN_TAGS.has((a as Element).tagName)
  );
}

function makeSpan(className: string, text: string): Element {
  return {
    type: "element",
    tagName: "span",
    properties: { className: [className] },
    children: [{ type: "text", value: text }],
  };
}

function splitTextNode(value: string): (Text | Element)[] {
  const parts: (Text | Element)[] = [];
  // Match "double-quoted" → hl-yellow  OR  'single-quoted' → hl-blue
  const pattern = /"([^"\n]+)"|'([^'\n]+)'/g;
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

export function rehypeHighlightQuotes() {
  return (tree: Root) => {
    visit(tree, "text", (node: Text, index, parent) => {
      if (index == null || !parent) return;
      if (isInsideForbidden([] as any)) return;

      // Check immediate parent only (visit gives us the parent)
      if (
        parent.type === "element" &&
        FORBIDDEN_TAGS.has((parent as unknown as Element).tagName)
      )
        return;

      if (!/"[^"\n]+"/.test(node.value) && !/'[^'\n]+'/.test(node.value))
        return;

      const replacement = splitTextNode(node.value);
      if (replacement.length === 1 && replacement[0].type === "text") return;

      (parent as any).children.splice(index, 1, ...replacement);
      return index + replacement.length;
    });
  };
}
