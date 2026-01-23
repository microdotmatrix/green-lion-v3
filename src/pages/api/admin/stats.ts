import { db } from "@/lib/db";
import {
  categories,
  products,
  quoteRequests,
  tradeshowLeads,
} from "@/lib/db/schema";
import type { APIRoute } from "astro";
import { count, desc, eq, gte } from "drizzle-orm";

export const GET: APIRoute = async ({ locals }) => {
  // Check authentication
  if (!locals.user || !locals.session) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    // Get current month start for leads count
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Fetch all stats in parallel
    const [
      productsCount,
      categoriesCount,
      pendingQuotesCount,
      reviewedQuotesCount,
      leadsThisMonth,
      recentQuotes,
      recentLeads,
    ] = await Promise.all([
      // Total products
      db.select({ count: count() }).from(products),

      // Total categories
      db.select({ count: count() }).from(categories),

      // Pending quotes
      db
        .select({ count: count() })
        .from(quoteRequests)
        .where(eq(quoteRequests.status, "pending")),

      // Reviewed quotes
      db
        .select({ count: count() })
        .from(quoteRequests)
        .where(eq(quoteRequests.status, "reviewed")),

      // Leads captured this month
      db
        .select({ count: count() })
        .from(tradeshowLeads)
        .where(gte(tradeshowLeads.createdAt, monthStart)),

      // Recent quotes (last 5)
      db
        .select({
          id: quoteRequests.id,
          quoteNumber: quoteRequests.quoteNumber,
          firstName: quoteRequests.firstName,
          lastName: quoteRequests.lastName,
          companyName: quoteRequests.companyName,
          status: quoteRequests.status,
          estimatedTotal: quoteRequests.estimatedTotal,
          createdAt: quoteRequests.createdAt,
        })
        .from(quoteRequests)
        .orderBy(desc(quoteRequests.createdAt))
        .limit(5),

      // Recent leads (last 5)
      db
        .select({
          id: tradeshowLeads.id,
          leadName: tradeshowLeads.leadName,
          leadCompany: tradeshowLeads.leadCompany,
          contactMethod: tradeshowLeads.contactMethod,
          createdAt: tradeshowLeads.createdAt,
        })
        .from(tradeshowLeads)
        .orderBy(desc(tradeshowLeads.createdAt))
        .limit(5),
    ]);

    const stats = {
      products: productsCount[0]?.count ?? 0,
      categories: categoriesCount[0]?.count ?? 0,
      activeQuotes:
        (pendingQuotesCount[0]?.count ?? 0) +
        (reviewedQuotesCount[0]?.count ?? 0),
      pendingQuotes: pendingQuotesCount[0]?.count ?? 0,
      leadsThisMonth: leadsThisMonth[0]?.count ?? 0,
      recentQuotes,
      recentLeads,
    };

    return new Response(JSON.stringify(stats), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching admin stats:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch stats" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
