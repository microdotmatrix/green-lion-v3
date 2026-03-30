import { db } from "@/lib/db";
import { insertTeamMemberSchema, teamMembers } from "@/lib/db/schema";
import type { APIRoute } from "astro";
import { desc } from "drizzle-orm";
import sanitizeHtml from "sanitize-html";

const bioSanitizeConfig: sanitizeHtml.IOptions = {
  allowedTags: ["p", "strong", "em", "a", "br"],
  allowedAttributes: {
    a: ["href", "target", "rel"],
  },
};

export const GET: APIRoute = async ({ locals }) => {
  if (!locals.user || !locals.session) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const items = await db
      .select()
      .from(teamMembers)
      .orderBy(teamMembers.displayOrder, desc(teamMembers.createdAt));
    return new Response(JSON.stringify(items), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    return new Response(
      JSON.stringify({ error: "Failed to fetch team members" }),
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
    const parsed = insertTeamMemberSchema.safeParse(body);
    if (!parsed.success) {
      return new Response(
        JSON.stringify({
          error: "Invalid data",
          details: parsed.error.flatten(),
        }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    const data = {
      ...parsed.data,
      summaryHtml: sanitizeHtml(parsed.data.summaryHtml ?? "", bioSanitizeConfig),
    };

    const [newItem] = await db.insert(teamMembers).values(data).returning();
    return new Response(JSON.stringify(newItem), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    return new Response(
      JSON.stringify({ error: "Failed to create team member" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
};
