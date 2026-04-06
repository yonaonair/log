import type { APIRoute } from "astro";
import fs from "node:fs/promises";
import path from "node:path";
import { ghGetSHA, ghPutFile } from "../../../../utils/github";

const FILE_PATH = path.resolve("src/pages/about.md");
const REPO_PATH = "src/pages/about.md";

export const GET: APIRoute = async () => {
  const content = await fs.readFile(FILE_PATH, "utf-8");
  // frontmatter 분리
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  const frontmatter = match?.[1] ?? "";
  const body = match?.[2]?.trim() ?? content;
  return new Response(JSON.stringify({ frontmatter, body }), {
    headers: { "Content-Type": "application/json" },
  });
};

export const PUT: APIRoute = async ({ request }) => {
  const { frontmatter, body } = await request.json();
  const content = `---\n${frontmatter}\n---\n\n${body}\n`;
  const sha = await ghGetSHA(REPO_PATH);
  await ghPutFile(REPO_PATH, content, "content: update about page", sha ?? undefined);
  return new Response(JSON.stringify({ ok: true }), { headers: { "Content-Type": "application/json" } });
};
