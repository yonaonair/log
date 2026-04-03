import type { APIRoute } from "astro";

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  const form = await request.formData();
  const password = form.get("password")?.toString() ?? "";

  const expected = import.meta.env.ADMIN_PASSWORD ?? process.env.ADMIN_PASSWORD;
  const secret = import.meta.env.SESSION_SECRET ?? process.env.SESSION_SECRET;

  if (!expected || password !== expected) {
    return redirect("/admin/login?error=1");
  }

  cookies.set("admin_session", secret, {
    httpOnly: true,
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
    sameSite: "strict",
  });

  return redirect("/admin");
};

export const DELETE: APIRoute = async ({ cookies, redirect }) => {
  cookies.delete("admin_session", { path: "/" });
  return redirect("/admin/login");
};
