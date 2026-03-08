import { db } from "@/lib/db";
import { blogCategories, blogPosts } from "@/lib/db/schema";
import { readingTimeMinutes } from "@/lib/reading-time";
import type { APIRoute } from "astro";
import { desc, eq, sql } from "drizzle-orm";
import sanitizeHtml from "sanitize-html";
import slugify from "slugify";
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

const createPostSchema = z.object({
  title: z.string().min(1).max(500),
  body: z.string().min(1),
  excerpt: z.string().optional().default(""),
  coverImageUrl: z.string().optional(),
  categoryId: z.string().optional(),
  status: z.enum(["draft", "published"]).optional().default("draft"),
});

export const GET: APIRoute = async ({ request, locals }) => {
  if (!locals.user || !locals.session) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
  try {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get("page") ?? 1);
    const limit = 25;
    const offset = (page - 1) * limit;

    const posts = await db
      .select({
        id: blogPosts.id,
        title: blogPosts.title,
        slug: blogPosts.slug,
        body: blogPosts.body,
        excerpt: blogPosts.excerpt,
        coverImageUrl: blogPosts.coverImageUrl,
        categoryId: blogPosts.categoryId,
        authorId: blogPosts.authorId,
        status: blogPosts.status,
        readTimeMinutes: blogPosts.readTimeMinutes,
        publishedAt: blogPosts.publishedAt,
        createdAt: blogPosts.createdAt,
        updatedAt: blogPosts.updatedAt,
        categoryName: blogCategories.name,
      })
      .from(blogPosts)
      .leftJoin(blogCategories, eq(blogPosts.categoryId, blogCategories.id))
      .orderBy(desc(blogPosts.createdAt))
      .limit(limit)
      .offset(offset);

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(blogPosts);

    const totalPages = Math.ceil(count / limit);

    return new Response(
      JSON.stringify({ posts, total: count, totalPages, page }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Error fetching blog posts:", error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch blog posts" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
};

export const POST: APIRoute = async ({ request, locals }) => {
  if (!locals.user || !locals.session) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
  try {
    const body = await request.json();
    const parsed = createPostSchema.safeParse(body);
    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: "Invalid data", details: parsed.error.flatten() }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    const { title, body: rawBody, excerpt, coverImageUrl, categoryId, status } =
      parsed.data;

    const slug = slugify(title, { lower: true, strict: true, trim: true });
    const cleanBody = sanitizeHtml(rawBody, sanitizeConfig);
    const readTime = readingTimeMinutes(cleanBody);

    const [newPost] = await db
      .insert(blogPosts)
      .values({
        title,
        slug,
        body: cleanBody,
        excerpt,
        coverImageUrl: coverImageUrl ?? null,
        categoryId: categoryId ?? null,
        authorId: locals.user.id,
        status,
        readTimeMinutes: readTime,
      })
      .returning();

    return new Response(JSON.stringify(newPost), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    if (error?.code === "23505") {
      return new Response(
        JSON.stringify({ error: "A post with this title already exists" }),
        { status: 409, headers: { "Content-Type": "application/json" } },
      );
    }
    console.error("Error creating blog post:", error);
    return new Response(
      JSON.stringify({ error: "Failed to create blog post" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
};
