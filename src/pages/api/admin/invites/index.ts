import { randomBytes, createHash } from "crypto";
import type { APIRoute } from "astro";
import { and, desc, eq, gt, isNull } from "drizzle-orm";

import { db } from "@/lib/db";
import { adminInvite } from "@/lib/db/schema";

const DEFAULT_EXPIRES_DAYS = 7;

const hashToken = (token: string) =>
  createHash("sha256").update(token).digest("hex");

const getBaseURL = (request: Request) => {
  const envBase = import.meta.env.BETTER_AUTH_URL || import.meta.env.SITE_URL;
  if (envBase) return envBase;
  return new URL(request.url).origin;
};

export const GET: APIRoute = async ({ locals }) => {
  if (!locals.user || !locals.session) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!locals.user.approved) {
    return new Response(JSON.stringify({ error: "Approval required" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const invites = await db
      .select({
        id: adminInvite.id,
        email: adminInvite.email,
        invitedBy: adminInvite.invitedBy,
        acceptedBy: adminInvite.acceptedBy,
        createdAt: adminInvite.createdAt,
        expiresAt: adminInvite.expiresAt,
        usedAt: adminInvite.usedAt,
        revokedAt: adminInvite.revokedAt,
      })
      .from(adminInvite)
      .orderBy(desc(adminInvite.createdAt));

    const now = new Date();
    const payload = invites.map((invite) => {
      let status: "pending" | "accepted" | "revoked" | "expired" = "pending";
      if (invite.revokedAt) status = "revoked";
      else if (invite.usedAt) status = "accepted";
      else if (invite.expiresAt <= now) status = "expired";

      return {
        ...invite,
        status,
      };
    });

    return new Response(JSON.stringify(payload), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching invites:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch invites" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

export const POST: APIRoute = async ({ locals, request }) => {
  if (!locals.user || !locals.session) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!locals.user.approved) {
    return new Response(JSON.stringify({ error: "Approval required" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const body = await request.json();
    const email =
      typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const rawExpires = Number(body.expiresInDays ?? DEFAULT_EXPIRES_DAYS);
    const expiresInDays = Number.isFinite(rawExpires)
      ? rawExpires
      : DEFAULT_EXPIRES_DAYS;

    if (!email) {
      return new Response(JSON.stringify({ error: "Email is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const now = new Date();
    const [existing] = await db
      .select({ id: adminInvite.id })
      .from(adminInvite)
      .where(
        and(
          eq(adminInvite.email, email),
          isNull(adminInvite.usedAt),
          isNull(adminInvite.revokedAt),
          gt(adminInvite.expiresAt, now),
        ),
      )
      .limit(1);

    if (existing) {
      return new Response(
        JSON.stringify({ error: "Active invite already exists" }),
        {
          status: 409,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const token = randomBytes(32).toString("hex");
    const tokenHash = hashToken(token);
    const expiresAt = new Date(
      Date.now() + Math.max(1, expiresInDays) * 24 * 60 * 60 * 1000,
    );

    const [invite] = await db
      .insert(adminInvite)
      .values({
        email,
        tokenHash,
        invitedBy: locals.user.id,
        expiresAt,
      })
      .returning();

    const baseURL = getBaseURL(request);
    const inviteUrl = new URL(`/signup?invite=${token}`, baseURL).toString();

    return new Response(
      JSON.stringify({
        id: invite.id,
        email: invite.email,
        expiresAt: invite.expiresAt,
        inviteUrl,
      }),
      {
        status: 201,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Error creating invite:", error);
    return new Response(JSON.stringify({ error: "Failed to create invite" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
