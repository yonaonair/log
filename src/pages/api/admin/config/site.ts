import type { APIRoute } from "astro";
import fs from "node:fs/promises";
import path from "node:path";
import { ghGetSHA, ghPutFile } from "../../../../utils/github";

const FILE_PATH = path.resolve("src/config.ts");
const REPO_PATH = "src/config.ts";

function extractString(src: string, key: string): string {
  return src.match(new RegExp(`${key}:\\s*"([^"]*)"`)) ?.[1] ?? "";
}
function extractBool(src: string, key: string): boolean {
  return src.match(new RegExp(`${key}:\\s*(true|false)`))?.[1] === "true";
}
function extractNumber(src: string, key: string): number {
  const m = src.match(new RegExp(`${key}:\\s*(\\d+)`));
  return m ? parseInt(m[1]) : 0;
}

function replaceString(src: string, key: string, value: string): string {
  return src.replace(new RegExp(`(${key}:\\s*)"[^"]*"`), `$1"${value}"`);
}
function replaceBool(src: string, key: string, value: boolean): string {
  return src.replace(new RegExp(`(${key}:\\s*)(true|false)`), `$1${value}`);
}
function replaceNumber(src: string, key: string, value: number): string {
  return src.replace(new RegExp(`(${key}:\\s*)\\d+`), `$1${value}`);
}

export const GET: APIRoute = async () => {
  const src = await fs.readFile(FILE_PATH, "utf-8");
  const data = {
    website: extractString(src, "website"),
    author: extractString(src, "author"),
    profile: extractString(src, "profile"),
    desc: extractString(src, "desc"),
    title: extractString(src, "title"),
    postPerIndex: extractNumber(src, "postPerIndex"),
    postPerPage: extractNumber(src, "postPerPage"),
    showArchives: extractBool(src, "showArchives"),
    showBackButton: extractBool(src, "showBackButton"),
    lang: extractString(src, "lang"),
    timezone: extractString(src, "timezone"),
  };
  return new Response(JSON.stringify(data), { headers: { "Content-Type": "application/json" } });
};

export const PUT: APIRoute = async ({ request }) => {
  const body = await request.json();
  let src = await fs.readFile(FILE_PATH, "utf-8");

  const strings = ["website", "author", "profile", "desc", "title", "lang", "timezone"];
  const bools = ["showArchives", "showBackButton"];
  const numbers = ["postPerIndex", "postPerPage"];

  for (const key of strings) {
    if (body[key] !== undefined) src = replaceString(src, key, String(body[key]));
  }
  for (const key of bools) {
    if (body[key] !== undefined) src = replaceBool(src, key, Boolean(body[key]));
  }
  for (const key of numbers) {
    if (body[key] !== undefined) src = replaceNumber(src, key, Number(body[key]));
  }

  const sha = await ghGetSHA(REPO_PATH);
  await ghPutFile(REPO_PATH, src, "config: update site settings", sha ?? undefined);
  return new Response(JSON.stringify({ ok: true }), { headers: { "Content-Type": "application/json" } });
};
