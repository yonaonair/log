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

            // Vite 내장 플러그인(vite:*)은 Rolldown 신형 훅 포맷을 이미 사용 중 → 건드리지 않음
            // 단, vite:json 만 가상 모듈 bypass 패치 적용
            if (typeof plugin.name === "string" && plugin.name.startsWith("vite:")) {
              // vite:json 플러그인이 가상 모듈(virtual:astro:manifest 등)을 JSON으로 파싱하지 않도록 패치
              if (plugin.name === "vite:json") {
                const jsonHook = plugin.transform;
                // Rolldown 신형 { filter, handler } 객체인 경우만 핸들러 교체
                if (jsonHook && typeof jsonHook !== "function" && typeof jsonHook.handler === "function") {
                  const origHandler = jsonHook.handler;
                  // 필터(jsonExtRE)는 유지하되, 가상 모듈에서는 null 반환
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  (jsonHook as any).handler = function (this: unknown, code: string, id: string, ...args: any[]) {
                    if (
                      id.startsWith("\0") ||
                      id.startsWith("virtual:") ||
                      id.includes("astro:")
                    ) {
                      return null;
                    }
                    return origHandler.call(this, code, id, ...args);
                  };
                }
              }
              continue; // 나머지 vite:* 플러그인은 건드리지 않음
            }

            // 서드파티 플러그인: 훅 객체 → 함수 unwrap
            // 단, filter가 있는 훅은 Rolldown이 네이티브로 처리하므로 건드리지 않음
            for (const hookName of [
              "resolveId",
              "transform",
              "load",
            ] as const) {
              const hook = (plugin as any)[hookName];
              if (!hook || typeof hook === "function") continue;
              if (typeof hook.handler !== "function") continue;
              // filter가 있으면 Rolldown 네이티브 포맷 → 건드리지 않음
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              if ((hook as any).filter) continue;
              plugin[hookName] = hook.handler;
            }

            // MDX 플러그인이 가상 모듈을 파싱하지 않도록 패치
            if (plugin.name?.includes("mdx") && plugin.transform) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const transformHook = (plugin as any).transform;
              // filter가 있는 Rolldown 신형 훅이면 handler를 교체, 없으면 함수 자체를 래핑
              if (transformHook && typeof transformHook !== "function" && typeof transformHook.handler === "function") {
                const origHandler = transformHook.handler;
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                transformHook.handler = async function (this: unknown, code: string, id: string, ...args: any[]) {
                  if (
                    id.startsWith("\0") ||
                    id.startsWith("virtual:") ||
                    id.includes("astro:")
                  ) {
                    return null;
                  }
                  return origHandler.call(this, code, id, ...args);
                };
              } else if (typeof transformHook === "function") {
                const origTransform = transformHook;
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                plugin.transform = async function (this: unknown, code: string, id: string, ...args: any[]) {
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
