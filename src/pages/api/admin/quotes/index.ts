import { db } from "@/lib/db";
import { quoteRequests } from "@/lib/db/schema";
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
    const search = searchParams.get("search") || "";

    const offset = (page - 1) * limit;

    // Build conditions
    const conditions = [];
    if (status && status !== "all") {
      conditions.push(eq(quoteRequests.status, status));
    }
    if (search) {
      conditions.push(
        or(
          ilike(quoteRequests.firstName, `%${search}%`),
          ilike(quoteRequests.lastName, `%${search}%`),
          ilike(quoteRequests.companyName, `%${search}%`),
          ilike(quoteRequests.email, `%${search}%`),
          ilike(quoteRequests.quoteNumber, `%${search}%`),
        ),
      );
    }

    // Fetch quotes with item counts
    const quotesQuery = db
      .select({
        id: quoteRequests.id,
        quoteNumber: quoteRequests.quoteNumber,
        firstName: quoteRequests.firstName,
        lastName: quoteRequests.lastName,
        email: quoteRequests.email,
        phone: quoteRequests.phone,
        companyName: quoteRequests.companyName,
        title: quoteRequests.title,
        estimatedTotal: quoteRequests.estimatedTotal,
        status: quoteRequests.status,
        createdAt: quoteRequests.createdAt,
        itemCount: sql<number>`(SELECT COUNT(*) FROM quote_items WHERE quote_items.quote_request_id = ${quoteRequests.id})`,
      })
      .from(quoteRequests)
      .where(
        conditions.length > 0
          ? sql`${conditions.reduce((a, b) => sql`${a} AND ${b}`)}`
          : undefined,
      )
      .orderBy(desc(quoteRequests.createdAt))
      .limit(limit)
      .offset(offset);

    const countQuery = db
      .select({ count: sql<number>`count(*)` })
      .from(quoteRequests)
      .where(
        conditions.length > 0
          ? sql`${conditions.reduce((a, b) => sql`${a} AND ${b}`)}`
          : undefined,
      );

    // Status counts for tabs
    const statusCounts = await db
      .select({
        status: quoteRequests.status,
        count: sql<number>`count(*)`,
      })
      .from(quoteRequests)
      .groupBy(quoteRequests.status);

    const [quotes, countResult] = await Promise.all([quotesQuery, countQuery]);
    const total = countResult[0]?.count ?? 0;

    const statusCountMap = Object.fromEntries(
      statusCounts.map((s) => [s.status, s.count]),
    );

    return new Response(
      JSON.stringify({
        quotes,
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
    console.error("Error fetching quotes:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch quotes" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
