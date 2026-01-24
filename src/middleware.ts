import { auth } from "@/lib/auth";
import { defineMiddleware } from "astro:middleware";

export const onRequest = defineMiddleware(async (context, next) => {
  // Skip auth check on prerendered pages - headers aren't available at build time
  if (context.isPrerendered) {
    context.locals.user = null;
    context.locals.session = null;
    return next();
  }

  const url = new URL(context.request.url);
  const isAdminApi = url.pathname.startsWith("/api/admin");
  const isAdminPage = url.pathname.startsWith("/admin");

  const isAuthed = await auth.api.getSession({
    headers: context.request.headers,
  });

  if (isAuthed) {
    context.locals.user = isAuthed.user;
    context.locals.session = isAuthed.session;
  } else {
    context.locals.user = null;
    context.locals.session = null;
  }

  if (isAdminApi) {
    if (!isAuthed?.user || !isAuthed?.session) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!isAuthed.user.approved) {
      return new Response(JSON.stringify({ error: "Approval required" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  if (isAdminPage) {
    if (!isAuthed?.user || !isAuthed?.session) {
      const redirect = new URL(
        `/signin?redirect=${encodeURIComponent(url.pathname)}`,
        url,
      );
      return Response.redirect(redirect, 302);
    }

    if (!isAuthed.user.approved) {
      const redirect = new URL("/signin?pending=1", url);
      return Response.redirect(redirect, 302);
    }
  }

  return next();
});
