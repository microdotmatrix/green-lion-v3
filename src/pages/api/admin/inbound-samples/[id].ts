import type { APIRoute } from "astro";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { inboundSamples } from "@/lib/db/schema";
import {
  sampleEvidenceChanged,
  sampleUpdateSchema,
} from "@/lib/inbound-samples";
import {
  requireSampleAdmin,
  sampleConflict,
  sampleError,
  sampleJson,
} from "@/server/inbound-samples";

export const GET: APIRoute = async ({ locals, params }) => {
  const denied = requireSampleAdmin(locals);
  if (denied) return denied;
  try {
    const [sample] = await db
      .select()
      .from(inboundSamples)
      .where(eq(inboundSamples.id, params.id!));
    return sample
      ? sampleJson(sample)
      : sampleJson({ error: "Sample not found" }, 404);
  } catch (error) {
    return sampleError(error);
  }
};

export const PUT: APIRoute = async ({ locals, params, request }) => {
  const denied = requireSampleAdmin(locals);
  if (denied) return denied;
  try {
    const { version, ...input } = sampleUpdateSchema.parse(
      await request.json(),
    );
    const [current] = await db
      .select()
      .from(inboundSamples)
      .where(eq(inboundSamples.id, params.id!));
    if (!current) return sampleJson({ error: "Sample not found" }, 404);
    if (current.version !== version) return sampleConflict();
    const changed = sampleEvidenceChanged(current, input);
    const [sample] = await db
      .update(inboundSamples)
      .set({
        ...input,
        ...(changed
          ? {
              approved: null,
              reviewedBy: null,
              reviewerName: null,
              reviewedAt: null,
            }
          : {}),
        updatedAt: new Date(),
        version: sql`${inboundSamples.version} + 1`,
      })
      .where(
        and(
          eq(inboundSamples.id, current.id),
          eq(inboundSamples.version, version),
        ),
      )
      .returning();
    return sample ? sampleJson(sample) : sampleConflict();
  } catch (error) {
    return sampleError(error);
  }
};
