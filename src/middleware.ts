import { defineMiddleware } from "astro:middleware";

const PROTECTED = /^\/admin(\/|$)/;
const PUBLIC = ["/admin/login", "/api/admin/auth"];

export const onRequest = defineMiddleware(async ({ request, cookies, redirect }, next) => {
  const url = new URL(request.url);
  const path = url.pathname;

  if (!PROTECTED.test(path)) return next();
  if (PUBLIC.some(p => path.startsWith(p))) return next();

  const session = cookies.get("admin_session")?.value;
  const expected = import.meta.env.SESSION_SECRET ?? process.env.SESSION_SECRET;

  if (!expected || session !== expected) {
    return redirect("/admin/login");
  }

  return next();
});
