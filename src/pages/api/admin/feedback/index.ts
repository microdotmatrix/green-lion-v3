import { db } from "@/lib/db";
import { contactSubmissions } from "@/lib/db/schema";
import type { APIRoute } from "astro";
import { desc, eq, ilike, or, sql } from "drizzle-orm";

export const GET: APIRoute = async ({ url, locals }) => {
  if (!locals.user || !locals.session) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const searchParams = url.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "25");
    const status = searchParams.get("status") || "";
    const type = searchParams.get("type") || "";
    const search = searchParams.get("search") || "";

    const offset = (page - 1) * limit;

    const conditions = [];
    if (status && status !== "all") {
      conditions.push(eq(contactSubmissions.status, status));
    }
    if (type && type !== "all") {
      conditions.push(eq(contactSubmissions.type, type));
    }
    if (search) {
      conditions.push(
        or(
          ilike(contactSubmissions.firstName, `%${search}%`),
          ilike(contactSubmissions.lastName, `%${search}%`),
          ilike(contactSubmissions.email, `%${search}%`),
          ilike(contactSubmissions.companyName, `%${search}%`),
          ilike(contactSubmissions.title, `%${search}%`),
        ),
      );
    }

    const whereClause =
      conditions.length > 0
        ? sql`${conditions.reduce((a, b) => sql`${a} AND ${b}`)}`
        : undefined;

    const submissionsQuery = db
      .select({
        id: contactSubmissions.id,
        firstName: contactSubmissions.firstName,
        lastName: contactSubmissions.lastName,
        email: contactSubmissions.email,
        phone: contactSubmissions.phone,
        companyName: contactSubmissions.companyName,
        title: contactSubmissions.title,
        type: contactSubmissions.type,
        status: contactSubmissions.status,
        createdAt: contactSubmissions.createdAt,
        replyCount:
          sql<number>`(SELECT COUNT(*) FROM feedback_replies WHERE feedback_replies.submission_id = ${contactSubmissions.id})`,
      })
      .from(contactSubmissions)
      .where(whereClause)
      .orderBy(desc(contactSubmissions.createdAt))
      .limit(limit)
      .offset(offset);

    const countQuery = db
      .select({ count: sql<number>`count(*)` })
      .from(contactSubmissions)
      .where(whereClause);

    const statusCountsQuery = db
      .select({
        status: contactSubmissions.status,
        count: sql<number>`count(*)`,
      })
      .from(contactSubmissions)
      .groupBy(contactSubmissions.status);

    const [submissions, countResult, statusCounts] = await db.batch([
      submissionsQuery,
      countQuery,
      statusCountsQuery,
    ] as const);

    const total = countResult[0]?.count ?? 0;
    const statusCountMap = Object.fromEntries(
      statusCounts.map((s) => [s.status, s.count]),
    );

    return new Response(
      JSON.stringify({
        submissions,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
        statusCounts: statusCountMap,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Error fetching feedback:", error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch feedback" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
};
