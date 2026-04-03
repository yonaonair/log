import type { APIRoute } from "astro";
import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";

const BLOG_DIR = path.resolve("src/data/blog");

export const GET: APIRoute = async () => {
  const files = await fs.readdir(BLOG_DIR, { recursive: true });
  const mdFiles = files.filter(f => /\.(md|mdx)$/.test(f) && !path.basename(f).startsWith("_"));

  const posts = await Promise.all(
    mdFiles.map(async f => {
      const fullPath = path.join(BLOG_DIR, f);
      const raw = await fs.readFile(fullPath, "utf-8");
      const { data } = matter(raw);
      const slug = data.slug || path.basename(f).replace(/\.(md|mdx)$/, "");
      return {
        slug,
        title: data.title ?? "Untitled",
        description: data.description ?? "",
        pubDatetime: data.pubDatetime ?? null,
        modDatetime: data.modDatetime ?? null,
        draft: data.draft ?? false,
        featured: data.featured ?? false,
        tags: data.tags ?? [],
        series: data.series ?? "",
        file: f,
      };
    })
  );

  posts.sort((a, b) => {
    const da = a.pubDatetime ? new Date(a.pubDatetime).getTime() : 0;
    const db = b.pubDatetime ? new Date(b.pubDatetime).getTime() : 0;
    return db - da;
  });

  return new Response(JSON.stringify(posts), {
    headers: { "Content-Type": "application/json" },
  });
};

export const POST: APIRoute = async ({ request }) => {
  const body = await request.json();
  const { title, slug, description, tags, featured, draft, pubDatetime, content, author, series } = body;

  if (!slug) return new Response("slug required", { status: 400 });

  const frontmatter: Record<string, unknown> = {
    title,
    description: description ?? "",
    pubDatetime: pubDatetime ? new Date(pubDatetime) : new Date(),
    modDatetime: new Date(),
    slug,
    featured: featured ?? false,
    draft: draft ?? false,
    tags: tags ?? ["others"],
  };
  if (author) frontmatter.author = author;
  if (series) frontmatter.series = series;

  const fileContent = matter.stringify(content ?? "", frontmatter);
  const filePath = path.join(BLOG_DIR, `${slug}.md`);

  await fs.writeFile(filePath, fileContent, "utf-8");

  return new Response(JSON.stringify({ slug }), {
    headers: { "Content-Type": "application/json" },
  });
};
