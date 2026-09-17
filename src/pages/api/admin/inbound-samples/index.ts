import type { APIRoute } from "astro";
import { and, desc, eq, ilike, isNull, or, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { inboundSamples } from "@/lib/db/schema";
import { sampleInputSchema, sampleListSchema } from "@/lib/inbound-samples";
import {
  requireSampleAdmin,
  sampleError,
  sampleJson,
} from "@/server/inbound-samples";

export const GET: APIRoute = async ({ locals, url }) => {
  const denied = requireSampleAdmin(locals);
  if (denied) return denied;
  try {
    const { page, limit, search, status, approval } = sampleListSchema.parse(
      Object.fromEntries(url.searchParams),
    );
    const conditions = [];
    if (status !== "all") conditions.push(eq(inboundSamples.status, status));
    if (approval === "pending")
      conditions.push(isNull(inboundSamples.approved));
    if (approval === "approved" || approval === "not_approved")
      conditions.push(eq(inboundSamples.approved, approval === "approved"));
    if (search) {
      const pattern = `%${search.replace(/[\\%_]/g, "\\$&")}%`;
      conditions.push(
        or(
          ilike(inboundSamples.manufacturer, pattern),
          ilike(inboundSamples.partNumber, pattern),
        ),
      );
    }
    const where = and(...conditions);
    const [samples, count] = await db.batch([
      db
        .select()
        .from(inboundSamples)
        .where(where)
        .orderBy(desc(inboundSamples.createdAt), desc(inboundSamples.id))
        .limit(limit)
        .offset((page - 1) * limit),
      db
        .select({ total: sql<number>`count(*)::int` })
        .from(inboundSamples)
        .where(where),
    ]);
    const total = count[0]?.total ?? 0;
    return sampleJson({
      samples,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return sampleError(error);
  }
};

export const POST: APIRoute = async ({ locals, request }) => {
  const denied = requireSampleAdmin(locals);
  if (denied) return denied;
  try {
    const input = sampleInputSchema.parse(await request.json());
    const [sample] = await db
      .insert(inboundSamples)
      .values({
        ...input,
        uploadedBy: locals.user!.id,
        uploaderName: locals.user!.name,
      })
      .returning();
    return sampleJson(sample, 201);
  } catch (error) {
    return sampleError(error);
  }
};
