import { db } from "@/lib/db";
import { sampleRequestItems, sampleRequests } from "@/lib/db/schema";
import type { APIRoute } from "astro";
import { eq } from "drizzle-orm";

export const GET: APIRoute = async ({ params, locals }) => {
  if (!locals.user || !locals.session) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { id } = params;
  if (!id) {
    return new Response(
      JSON.stringify({ error: "Sample request ID required" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  try {
    const [request] = await db
      .select()
      .from(sampleRequests)
      .where(eq(sampleRequests.id, id));

    if (!request) {
      return new Response(
        JSON.stringify({ error: "Sample request not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } },
      );
    }

    const items = await db
      .select()
      .from(sampleRequestItems)
      .where(eq(sampleRequestItems.sampleRequestId, id))
      .orderBy(sampleRequestItems.createdAt);

    return new Response(JSON.stringify({ ...request, items }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching sample request:", error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch sample request" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
};

export const PUT: APIRoute = async ({ params, request, locals }) => {
  if (!locals.user || !locals.session) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { id } = params;
  if (!id) {
    return new Response(
      JSON.stringify({ error: "Sample request ID required" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  try {
    const body = await request.json();
    const { status } = body;

    const validStatuses = ["pending", "printed", "packed"];
    if (!status || !validStatuses.includes(status)) {
      return new Response(JSON.stringify({ error: "Invalid status" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const [existing] = await db
      .select({ id: sampleRequests.id })
      .from(sampleRequests)
      .where(eq(sampleRequests.id, id));

    if (!existing) {
      return new Response(
        JSON.stringify({ error: "Sample request not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } },
      );
    }

    const [updated] = await db
      .update(sampleRequests)
      .set({ status })
      .where(eq(sampleRequests.id, id))
      .returning();

    return new Response(JSON.stringify(updated), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error updating sample request:", error);
    return new Response(
      JSON.stringify({ error: "Failed to update sample request" }),
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

  const { id } = params;
  if (!id) {
    return new Response(
      JSON.stringify({ error: "Sample request ID required" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  try {
    const [existing] = await db
      .select({ id: sampleRequests.id })
      .from(sampleRequests)
      .where(eq(sampleRequests.id, id));

    if (!existing) {
      return new Response(
        JSON.stringify({ error: "Sample request not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } },
      );
    }

    // Items are removed via ON DELETE CASCADE
    await db.delete(sampleRequests).where(eq(sampleRequests.id, id));

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error deleting sample request:", error);
    return new Response(
      JSON.stringify({ error: "Failed to delete sample request" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
};
