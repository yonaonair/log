import { defineConfig, envField } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import sitemap from "@astrojs/sitemap";
import remarkToc from "remark-toc";
import remarkCollapse from "remark-collapse";
import {
  transformerNotationDiff,
  transformerNotationHighlight,
  transformerNotationWordHighlight,
} from "@shikijs/transformers";
import { transformerFileName } from "./src/utils/transformers/fileName";
import { SITE } from "./src/config";
import vercel from "@astrojs/vercel";
import react from "@astrojs/react";
import mdx from "@astrojs/mdx";

// https://astro.build/config
export default defineConfig({
  site: SITE.website,
  output: "server",
  devToolbar: { enabled: false },
  adapter: vercel(),
  integrations: [
    sitemap({
      filter: page => SITE.showArchives || !page.endsWith("/archives"),
    }),
    react({}),
    mdx(),
  ],
  markdown: {
    remarkPlugins: [remarkToc, [remarkCollapse, { test: "Table of contents" }]],
    shikiConfig: {
      themes: { light: "min-light", dark: "night-owl" },
      defaultColor: false,
      wrap: false,
      transformers: [
        transformerFileName({ style: "v2", hideDot: false }),
        transformerNotationHighlight(),
        transformerNotationWordHighlight(),
        transformerNotationDiff({ matchAlgorithm: "v3" }),
      ],
    },
  },
  vite: {
    plugins: [
      tailwindcss(),
      {
        name: "vite6-env-plugin-compat",
        enforce: "pre",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        configResolved(config: any) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const allPlugins: any[] = config.plugins ?? [];
          for (const plugin of allPlugins) {
            if (!plugin || typeof plugin !== "object") continue;

            // 훅 객체 → 함수 unwrap
            for (const hookName of [
              "resolveId",
              "transform",
              "load",
            ] as const) {
              const hook = plugin[hookName];
              if (!hook || typeof hook === "function") continue;
              if (typeof hook.handler === "function") {
                plugin[hookName] = hook.handler;
              }
            }

            // MDX 플러그인이 가상 모듈을 파싱하지 않도록 패치
            if (plugin.name?.includes("mdx") && plugin.transform) {
              const origTransform = plugin.transform;
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              plugin.transform = async function (
                this: unknown,
                code: string,
                id: string,
                ...args: any[]
              ) {
                if (
                  id.startsWith("\0") ||
                  id.startsWith("virtual:") ||
                  id.includes("astro:")
                ) {
                  return null;
                }
                return origTransform.call(this, code, id, ...args);
              };
            }
          }
        },
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ] as any,
    optimizeDeps: {
      exclude: ["@resvg/resvg-js"],
      include: ["mermaid"],
    },
    ssr: {
      external: ["mermaid"],
    },
  },
  image: {
    responsiveStyles: true,
    layout: "constrained",
  },
  env: {
    schema: {
      PUBLIC_GOOGLE_SITE_VERIFICATION: envField.string({
        access: "public",
        context: "client",
        optional: true,
      }),
    },
  },
});
