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
        name: "keystatic-rolldown-compat",
        enforce: "pre",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        configResolved(config: any) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const allPlugins: any[] = config.plugins ?? [];

          for (const plugin of allPlugins) {
            if (!plugin?.name?.includes("keystatic")) continue;
            if (!plugin.resolveId) continue;
            const orig = plugin.resolveId;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            plugin.resolveId = async function (this: unknown, ...args: any[]) {
              const fn = typeof orig === "function" ? orig : orig.handler;
              const result = await fn.call(this, ...args);
              if (
                result &&
                typeof result === "object" &&
                typeof result.id === "string"
              ) {
                return result.id;
              }
              return result;
            };
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
