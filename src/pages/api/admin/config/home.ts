import type { APIRoute } from "astro";
import fs from "node:fs/promises";
import path from "node:path";
import { ghGetSHA, ghPutFile } from "../../../../utils/github";

const FILE_PATH = path.resolve("src/data/config/home.json");
const REPO_PATH = "src/data/config/home.json";

export const GET: APIRoute = async () => {
  const raw = await fs.readFile(FILE_PATH, "utf-8");
  return new Response(raw, { headers: { "Content-Type": "application/json" } });
};

export const PUT: APIRoute = async ({ request }) => {
  const body = await request.json();
  const content = JSON.stringify(body, null, 2) + "\n";
  const sha = await ghGetSHA(REPO_PATH);
  await ghPutFile(REPO_PATH, content, "config: update home content", sha ?? undefined);
  return new Response(JSON.stringify({ ok: true }), { headers: { "Content-Type": "application/json" } });
};
