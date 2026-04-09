import type { APIRoute } from "astro";
import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import { ghGetSHA, ghPutFile, ghDeleteFile, toRepoPath } from "../../../../utils/github";

const BLOG_DIR = path.resolve("src/data/blog");

async function findFile(slug: string): Promise<string | null> {
  const exts = [".md", ".mdx"];
  for (const ext of exts) {
    const p = path.join(BLOG_DIR, `${slug}${ext}`);
    try {
      await fs.access(p);
      return p;
    } catch {}
  }
  // Search recursively
  const files = await fs.readdir(BLOG_DIR, { recursive: true });
  for (const f of files) {
    if (!/\.(md|mdx)$/.test(f)) continue;
    const fullPath = path.join(BLOG_DIR, f);
    const raw = await fs.readFile(fullPath, "utf-8");
    const { data } = matter(raw);
    const fileSlug = data.slug || path.basename(f).replace(/\.(md|mdx)$/, "");
    if (fileSlug === slug) return fullPath;
  }
  return null;
}

export const GET: APIRoute = async ({ params }) => {
  const { slug } = params;
  if (!slug) return new Response("not found", { status: 404 });

  const filePath = await findFile(slug);
  if (!filePath) return new Response("not found", { status: 404 });

  const raw = await fs.readFile(filePath, "utf-8");
  const { data, content } = matter(raw);

  return new Response(JSON.stringify({ frontmatter: data, content }), {
    headers: { "Content-Type": "application/json" },
  });
};

export const PUT: APIRoute = async ({ params, request }) => {
  const { slug } = params;
  if (!slug) return new Response("not found", { status: 404 });

  const body = await request.json();
  const { title, description, tags, featured, draft, pubDatetime, content, author, series, category, newSlug } = body;

  const existingPath = await findFile(slug);
  const targetSlug = newSlug ?? slug;
  const targetPath = path.join(BLOG_DIR, `${targetSlug}.md`);

  const frontmatter: Record<string, unknown> = {
    title,
    description: description ?? "",
    pubDatetime: pubDatetime ? new Date(pubDatetime) : new Date(),
    modDatetime: new Date(),
    slug: targetSlug,
    featured: featured ?? false,
    draft: draft ?? false,
    tags: tags ?? ["others"],
  };
  if (author) frontmatter.author = author;
  if (series) frontmatter.series = series;
  if (category) frontmatter.category = category;

  const fileContent = matter.stringify(content ?? "", frontmatter);
  const newRepoPath = `src/data/blog/${targetSlug}.md`;

  if (slug !== targetSlug) {
    // slug 변경: 새 파일 생성 후 기존 파일 삭제
    await ghPutFile(newRepoPath, fileContent, `post: rename ${slug} → ${targetSlug}`);
    if (existingPath) {
      const oldRepoPath = toRepoPath(existingPath);
      const oldSHA = await ghGetSHA(oldRepoPath);
      if (oldSHA) await ghDeleteFile(oldRepoPath, oldSHA, `post: remove ${slug} (renamed)`);
    }
  } else {
    const repoPath = existingPath ? toRepoPath(existingPath) : newRepoPath;
    const sha = await ghGetSHA(repoPath);
    await ghPutFile(repoPath, fileContent, `post: update ${slug}`, sha ?? undefined);
  }

  return new Response(JSON.stringify({ slug: targetSlug }), {
    headers: { "Content-Type": "application/json" },
  });
};

export const DELETE: APIRoute = async ({ params }) => {
  const { slug } = params;
  if (!slug) return new Response("not found", { status: 404 });

  const filePath = await findFile(slug);
  if (!filePath) return new Response("not found", { status: 404 });

  const repoPath = toRepoPath(filePath);
  const sha = await ghGetSHA(repoPath);
  if (!sha) return new Response("not found on GitHub", { status: 404 });
  await ghDeleteFile(repoPath, sha, `post: delete ${slug}`);

  return new Response(JSON.stringify({ ok: true }), {
    headers: { "Content-Type": "application/json" },
  });
};
