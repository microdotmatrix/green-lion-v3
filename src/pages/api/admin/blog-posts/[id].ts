import { db } from "@/lib/db";
import { blogPosts } from "@/lib/db/schema";
import { readingTimeMinutes } from "@/lib/reading-time";
import type { APIRoute } from "astro";
import { eq } from "drizzle-orm";
import sanitizeHtml from "sanitize-html";
import { z } from "zod";

const sanitizeConfig: sanitizeHtml.IOptions = {
  allowedTags: [
    ...sanitizeHtml.defaults.allowedTags,
    "img",
    "h1",
    "h2",
    "h3",
    "h4",
  ],
  allowedAttributes: {
    ...sanitizeHtml.defaults.allowedAttributes,
    img: ["src", "alt", "title", "width", "height"],
    a: ["href", "name", "target", "rel"],
  },
};

const updatePostSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  body: z.string().min(1).optional(),
  excerpt: z.string().min(1).optional(),
  coverImageUrl: z.string().nullable().optional(),
  categoryId: z.string().nullable().optional(),
  status: z.enum(["draft", "published"]).optional(),
});

export const GET: APIRoute = async ({ params, locals }) => {
  if (!locals.user || !locals.session) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
  try {
    const { id } = params;
    if (!id) {
      return new Response(JSON.stringify({ error: "Missing post id" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const [post] = await db
      .select()
      .from(blogPosts)
      .where(eq(blogPosts.id, id));

    if (!post) {
      return new Response(JSON.stringify({ error: "Post not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(post), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching blog post:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch blog post" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

export const PUT: APIRoute = async ({ params, request, locals }) => {
  if (!locals.user || !locals.session) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
  try {
    const { id } = params;
    if (!id) {
      return new Response(JSON.stringify({ error: "Missing post id" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const [existing] = await db
      .select()
      .from(blogPosts)
      .where(eq(blogPosts.id, id));

    if (!existing) {
      return new Response(JSON.stringify({ error: "Post not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body = await request.json();
    const parsed = updatePostSchema.safeParse(body);
    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: "Invalid data", details: parsed.error.flatten() }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    const updates: Record<string, unknown> = {};

    if (parsed.data.title !== undefined) {
      updates.title = parsed.data.title;
      // Do NOT regenerate slug on PUT
    }
    if (parsed.data.body !== undefined) {
      const cleanBody = sanitizeHtml(parsed.data.body, sanitizeConfig);
      updates.body = cleanBody;
      updates.readTimeMinutes = readingTimeMinutes(cleanBody);
    }
    if (parsed.data.excerpt !== undefined) {
      updates.excerpt = parsed.data.excerpt;
    }
    if (parsed.data.coverImageUrl !== undefined) {
      updates.coverImageUrl = parsed.data.coverImageUrl;
    }
    if (parsed.data.categoryId !== undefined) {
      updates.categoryId = parsed.data.categoryId;
    }
    if (parsed.data.status !== undefined) {
      updates.status = parsed.data.status;
      // Set publishedAt on first draft→published transition; do NOT clear on unpublish
      if (parsed.data.status === "published" && existing.publishedAt === null) {
        updates.publishedAt = new Date();
      }
    }

    const [updatedPost] = await db
      .update(blogPosts)
      .set(updates)
      .where(eq(blogPosts.id, id))
      .returning();

    return new Response(JSON.stringify(updatedPost), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error updating blog post:", error);
    return new Response(
      JSON.stringify({ error: "Failed to update blog post" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
};

export const DELETE: APIRoute = async ({ params, locals }) => {
  if (!locals.user || !locals.session) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
  try {
    const { id } = params;
    if (!id) {
      return new Response(JSON.stringify({ error: "Missing post id" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const [existing] = await db
      .select()
      .from(blogPosts)
      .where(eq(blogPosts.id, id));

    if (!existing) {
      return new Response(JSON.stringify({ error: "Post not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    await db.delete(blogPosts).where(eq(blogPosts.id, id));

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error deleting blog post:", error);
    return new Response(
      JSON.stringify({ error: "Failed to delete blog post" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
};
