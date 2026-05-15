import type { Root, Element, ElementContent } from "hast";
import { visit } from "unist-util-visit";
import { createLowlight, common } from "lowlight";

const lowlight = createLowlight(common);

export function rehypeLowlight() {
  return (tree: Root) => {
    visit(tree, "element", (node: Element) => {
      if (node.tagName !== "pre") return;

      const code = node.children.find(
        (child): child is Element =>
          child.type === "element" && child.tagName === "code"
      );
      if (!code) return;

      // Extract raw text
      const text = extractText(code.children as ElementContent[]);
      if (!text.trim()) return;

      // Use class hint if present (e.g. language-typescript), otherwise auto-detect
      const classNames = (code.properties?.className as string[]) ?? [];
      const langHint = classNames
        .find(c => c.startsWith("language-"))
        ?.replace("language-", "");

      let result;
      try {
        if (langHint && lowlight.listLanguages().includes(langHint)) {
          result = lowlight.highlight(langHint, text);
        } else {
          result = lowlight.highlightAuto(text);
        }
      } catch {
        return;
      }

      const detected = result.data?.language as string | undefined;

      // Apply hljs class to pre
      node.properties = {
        ...node.properties,
        className: [
          "hljs",
          ...(detected ? [`language-${detected}`] : []),
        ],
      };

      // Replace code content with highlighted HAST children
      code.children = result.children as ElementContent[];
      code.properties = {};
    });
  };
}

function extractText(nodes: ElementContent[]): string {
  return nodes
    .map(n => {
      if (n.type === "text") return n.value;
      if (n.type === "element") return extractText(n.children as ElementContent[]);
      return "";
    })
    .join("");
}
