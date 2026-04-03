import type { APIRoute } from "astro";

export const GET: APIRoute = async ({ url }) => {
  const target = url.searchParams.get("url");
  if (!target) return new Response("url required", { status: 400 });

  try {
    const res = await fetch(target, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; bot/1.0)" },
      signal: AbortSignal.timeout(8000),
    });
    const html = await res.text();

    const meta = (name: string): string => {
      const patterns = [
        new RegExp(`<meta[^>]+(?:property|name)=["']${name}["'][^>]+content=["']([^"']+)["']`, "i"),
        new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${name}["']`, "i"),
      ];
      for (const p of patterns) {
        const m = html.match(p);
        if (m?.[1]) return m[1].trim();
      }
      return "";
    };

    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);

    return new Response(
      JSON.stringify({
        url: target,
        title: meta("og:title") || titleMatch?.[1]?.trim() || target,
        description: meta("og:description") || meta("description") || "",
        image: meta("og:image") || "",
        siteName: meta("og:site_name") || new URL(target).hostname,
        favicon: `https://www.google.com/s2/favicons?domain=${new URL(target).hostname}&sz=32`,
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch {
    return new Response(
      JSON.stringify({
        url: target,
        title: target,
        description: "",
        image: "",
        siteName: new URL(target).hostname,
        favicon: `https://www.google.com/s2/favicons?domain=${new URL(target).hostname}&sz=32`,
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  }
};
