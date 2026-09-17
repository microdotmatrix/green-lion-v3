import type { APIRoute } from "astro";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { inboundSamples } from "@/lib/db/schema";
import { canReviewSample, sampleReviewSchema } from "@/lib/inbound-samples";
import {
  requireSampleAdmin,
  sampleConflict,
  sampleError,
  sampleJson,
} from "@/server/inbound-samples";

export const POST: APIRoute = async ({ locals, params, request }) => {
  const denied = requireSampleAdmin(locals);
  if (denied) return denied;
  try {
    const { approved, version } = sampleReviewSchema.parse(
      await request.json(),
    );
    const [current] = await db
      .select()
      .from(inboundSamples)
      .where(eq(inboundSamples.id, params.id!));
    if (!current) return sampleJson({ error: "Sample not found" }, 404);
    if (current.version !== version) return sampleConflict();
    if (!canReviewSample(current.status, approved))
      return sampleJson(
        {
          error: "Mark the sample Evaluated before recording a final decision.",
        },
        400,
      );
    // An unchanged decision must not overwrite the original reviewer or date.
    if (current.approved === approved) return sampleJson(current);
    const [sample] = await db
      .update(inboundSamples)
      .set({
        approved,
        reviewedBy: approved === null ? null : locals.user!.id,
        reviewerName: approved === null ? null : locals.user!.name,
        reviewedAt: approved === null ? null : new Date(),
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
