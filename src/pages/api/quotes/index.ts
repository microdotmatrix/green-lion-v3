import { db } from "@/lib/db";
import { quoteItems, quoteRequests } from "@/lib/db/schema";
import type { APIRoute } from "astro";
import { count, desc } from "drizzle-orm";

interface QuoteItemInput {
  productId: string;
  quantity: number;
  unitPrice: string;
}

interface QuoteRequestInput {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  companyName: string;
  title?: string;
  items: QuoteItemInput[];
  status?: string;
}

// Generate quote number in GLI-10001 format
async function generateQuoteNumber(): Promise<string> {
  const result = await db.select({ total: count() }).from(quoteRequests);
  const total = result[0]?.total || 0;
  const nextNumber = 10001 + Number(total);
  return `GLI-${nextNumber}`;
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const body: QuoteRequestInput = await request.json();

    // Validate required fields
    if (!body.firstName?.trim()) {
      return new Response(JSON.stringify({ error: "First name is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
    if (!body.lastName?.trim()) {
      return new Response(JSON.stringify({ error: "Last name is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
    if (!body.email?.trim()) {
      return new Response(JSON.stringify({ error: "Email is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
    if (!body.companyName?.trim()) {
      return new Response(
        JSON.stringify({ error: "Company name is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }
    if (!body.items || body.items.length === 0) {
      return new Response(
        JSON.stringify({ error: "At least one product is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return new Response(JSON.stringify({ error: "Invalid email format" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Calculate estimated total
    let estimatedTotal = 0;
    const itemsWithTotals = body.items.map((item) => {
      const unitPrice = parseFloat(item.unitPrice) || 0;
      const lineTotal = unitPrice * item.quantity;
      estimatedTotal += lineTotal;
      return {
        ...item,
        lineTotal: lineTotal.toFixed(2),
      };
    });

    // Generate quote number
    const quoteNumber = await generateQuoteNumber();

    // Create quote request
    const [createdQuote] = await db
      .insert(quoteRequests)
      .values({
        quoteNumber,
        firstName: body.firstName.trim(),
        lastName: body.lastName.trim(),
        email: body.email.trim().toLowerCase(),
        phone: body.phone?.trim() || null,
        companyName: body.companyName.trim(),
        title: body.title?.trim() || "",
        estimatedTotal: estimatedTotal.toFixed(2),
        status: body.status || "pending",
      })
      .returning();

    // Create quote items
    const itemsToInsert = itemsWithTotals.map((item) => ({
      quoteRequestId: createdQuote.id,
      productId: item.productId,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      customizations: {},
      lineTotal: item.lineTotal,
    }));

    await db.insert(quoteItems).values(itemsToInsert);

    return new Response(
      JSON.stringify({
        success: true,
        quote: {
          id: createdQuote.id,
          quoteNumber: createdQuote.quoteNumber,
          estimatedTotal: createdQuote.estimatedTotal,
          status: createdQuote.status,
        },
      }),
      {
        status: 201,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Error creating quote:", error);
    return new Response(
      JSON.stringify({ error: "Failed to create quote request" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
};

export const GET: APIRoute = async ({ url }) => {
  try {
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "10");
    const offset = (page - 1) * limit;

    const quotes = await db
      .select()
      .from(quoteRequests)
      .orderBy(desc(quoteRequests.createdAt))
      .limit(limit)
      .offset(offset);

    const countResult = await db.select({ total: count() }).from(quoteRequests);

    const total = Number(countResult[0]?.total || 0);

    return new Response(
      JSON.stringify({
        quotes,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
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
