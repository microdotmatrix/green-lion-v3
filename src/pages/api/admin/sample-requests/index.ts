import { db } from "@/lib/db";
import { products, sampleRequestItems, sampleRequests } from "@/lib/db/schema";
import type { APIRoute } from "astro";
import { desc, eq, ilike, inArray, or, sql } from "drizzle-orm";

const MAX_PAGE_LIMIT = 100;

interface SampleRequestItemInput {
  productId: string;
  capacity?: string;
  quantity: number;
}

interface SampleRequestInput {
  recipientName: string;
  companyName?: string;
  email?: string;
  phone?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state?: string;
  postalCode: string;
  country?: string;
  notes?: string;
  items: SampleRequestItemInput[];
}

// Generate request number in SMP-10001 format. Uses a dedicated Postgres
// sequence so concurrent requests can never collide on the unique constraint.
async function generateSampleRequestNumber(): Promise<string> {
  const result = await db.execute<{ val: string }>(
    sql`SELECT nextval('sample_request_seq') AS val`,
  );
  return `SMP-${result.rows[0].val}`;
}

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
    const limit = Math.min(
      parseInt(searchParams.get("limit") || "25"),
      MAX_PAGE_LIMIT,
    );
    const status = searchParams.get("status") || "";
    const search = searchParams.get("search") || "";

    const offset = (page - 1) * limit;

    const conditions = [];
    if (status && status !== "all") {
      conditions.push(eq(sampleRequests.status, status));
    }
    if (search) {
      conditions.push(
        or(
          ilike(sampleRequests.recipientName, `%${search}%`),
          ilike(sampleRequests.companyName, `%${search}%`),
          ilike(sampleRequests.requestNumber, `%${search}%`),
        ),
      );
    }

    const requestsQuery = db
      .select({
        id: sampleRequests.id,
        requestNumber: sampleRequests.requestNumber,
        recipientName: sampleRequests.recipientName,
        companyName: sampleRequests.companyName,
        city: sampleRequests.city,
        state: sampleRequests.state,
        status: sampleRequests.status,
        createdAt: sampleRequests.createdAt,
        itemCount: sql<number>`(SELECT COUNT(*) FROM sample_request_items WHERE sample_request_items.sample_request_id = ${sampleRequests.id})`,
      })
      .from(sampleRequests)
      .where(
        conditions.length > 0
          ? sql`${conditions.reduce((a, b) => sql`${a} AND ${b}`)}`
          : undefined,
      )
      .orderBy(desc(sampleRequests.createdAt))
      .limit(limit)
      .offset(offset);

    const countQuery = db
      .select({ count: sql<number>`count(*)` })
      .from(sampleRequests)
      .where(
        conditions.length > 0
          ? sql`${conditions.reduce((a, b) => sql`${a} AND ${b}`)}`
          : undefined,
      );

    const statusCountsQuery = db
      .select({
        status: sampleRequests.status,
        count: sql<number>`count(*)`,
      })
      .from(sampleRequests)
      .groupBy(sampleRequests.status);

    const [requests, countResult, statusCounts] = await db.batch([
      requestsQuery,
      countQuery,
      statusCountsQuery,
    ] as const);
    const total = countResult[0]?.count ?? 0;

    const statusCountMap = Object.fromEntries(
      statusCounts.map((s) => [s.status, s.count]),
    );

    return new Response(
      JSON.stringify({
        sampleRequests: requests,
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
    console.error("Error fetching sample requests:", error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch sample requests" }),
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
    const body: SampleRequestInput = await request.json();

    if (!body.recipientName?.trim()) {
      return new Response(
        JSON.stringify({ error: "Recipient name is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }
    if (!body.addressLine1?.trim()) {
      return new Response(JSON.stringify({ error: "Address is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
    if (!body.city?.trim()) {
      return new Response(JSON.stringify({ error: "City is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
    if (!body.postalCode?.trim()) {
      return new Response(
        JSON.stringify({ error: "Postal code is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }
    if (!body.items || body.items.length === 0) {
      return new Response(
        JSON.stringify({ error: "At least one product is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }
    for (const item of body.items) {
      if (!item.productId) {
        return new Response(
          JSON.stringify({ error: "Each item must have a product" }),
          { status: 400, headers: { "Content-Type": "application/json" } },
        );
      }
      if (!Number.isInteger(item.quantity) || item.quantity < 1) {
        return new Response(
          JSON.stringify({ error: "Item quantity must be at least 1" }),
          { status: 400, headers: { "Content-Type": "application/json" } },
        );
      }
    }
    if (body.email?.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(body.email.trim())) {
        return new Response(JSON.stringify({ error: "Invalid email format" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    // Snapshot SKU and name from the live catalog so printed labels remain
    // accurate even if the product is edited or deleted later
    const productIds = [...new Set(body.items.map((item) => item.productId))];
    const productRows = await db
      .select({ id: products.id, sku: products.sku, name: products.name })
      .from(products)
      .where(inArray(products.id, productIds));
    const productMap = new Map(productRows.map((p) => [p.id, p]));

    const missing = productIds.filter((id) => !productMap.has(id));
    if (missing.length > 0) {
      return new Response(
        JSON.stringify({ error: "One or more products no longer exist" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    const requestNumber = await generateSampleRequestNumber();

    const [createdRequest] = await db
      .insert(sampleRequests)
      .values({
        requestNumber,
        recipientName: body.recipientName.trim(),
        companyName: body.companyName?.trim() || null,
        email: body.email?.trim().toLowerCase() || null,
        phone: body.phone?.trim() || null,
        addressLine1: body.addressLine1.trim(),
        addressLine2: body.addressLine2?.trim() || null,
        city: body.city.trim(),
        state: body.state?.trim() || null,
        postalCode: body.postalCode.trim(),
        country: body.country?.trim() || "US",
        notes: body.notes?.trim() || null,
      })
      .returning();

    const itemsToInsert = body.items.map((item) => {
      const product = productMap.get(item.productId)!;
      return {
        sampleRequestId: createdRequest.id,
        productId: item.productId,
        sku: product.sku,
        productName: product.name,
        capacity: item.capacity?.trim() || null,
        quantity: item.quantity,
      };
    });

    await db.insert(sampleRequestItems).values(itemsToInsert);

    return new Response(
      JSON.stringify({
        success: true,
        sampleRequest: {
          id: createdRequest.id,
          requestNumber: createdRequest.requestNumber,
          status: createdRequest.status,
        },
      }),
      { status: 201, headers: { "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Error creating sample request:", error);
    return new Response(
      JSON.stringify({ error: "Failed to create sample request" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
};
