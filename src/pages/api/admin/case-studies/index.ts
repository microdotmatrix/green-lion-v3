import { db } from "@/lib/db";
import { caseStudies, insertCaseStudySchema } from "@/lib/db/schema";
import type { APIRoute } from "astro";
import { desc } from "drizzle-orm";

export const GET: APIRoute = async ({ locals }) => {
  if (!locals.user || !locals.session) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const studies = await db
      .select()
      .from(caseStudies)
      .orderBy(caseStudies.displayOrder, desc(caseStudies.createdAt));

    return new Response(JSON.stringify(studies), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching case studies:", error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch case studies" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
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
    const parsed = insertCaseStudySchema.safeParse(body);

    if (!parsed.success) {
      return new Response(
        JSON.stringify({
          error: "Invalid data",
          details: parsed.error.flatten(),
        }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    const [newStudy] = await db
      .insert(caseStudies)
      .values(parsed.data)
      .returning();

    return new Response(JSON.stringify(newStudy), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error creating case study:", error);
    return new Response(
      JSON.stringify({ error: "Failed to create case study" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
};
