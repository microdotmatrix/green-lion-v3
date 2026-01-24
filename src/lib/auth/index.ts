import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { createHash } from "crypto";
import { and, eq, gt, isNull } from "drizzle-orm";
import { db } from "../db"; // your drizzle instance
import { adminInvite } from "../db/schema";

const hashInviteToken = (token: string) =>
  createHash("sha256").update(token).digest("hex");

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg", // or "mysql", "sqlite"
  }),
  emailAndPassword: {
    enabled: true,
  },
  user: {
    additionalFields: {
      approved: {
        type: "boolean",
        input: false,
        required: false,
        defaultValue: false,
        fieldName: "approved",
      },
    },
  },
  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      if (ctx.path !== "/sign-up/email") return;

      const inviteToken =
        typeof ctx.body?.inviteToken === "string" ? ctx.body.inviteToken : "";
      const email = typeof ctx.body?.email === "string" ? ctx.body.email : "";

      if (!inviteToken) {
        throw new APIError("BAD_REQUEST", {
          message: "Invite token required",
        });
      }

      if (!email) {
        throw new APIError("BAD_REQUEST", {
          message: "Email required",
        });
      }

      const tokenHash = hashInviteToken(inviteToken);
      const [invite] = await db
        .select({
          id: adminInvite.id,
          email: adminInvite.email,
          expiresAt: adminInvite.expiresAt,
          usedAt: adminInvite.usedAt,
          revokedAt: adminInvite.revokedAt,
        })
        .from(adminInvite)
        .where(eq(adminInvite.tokenHash, tokenHash));

      if (!invite) {
        throw new APIError("BAD_REQUEST", {
          message: "Invite not found",
        });
      }

      if (invite.email.toLowerCase() !== email.toLowerCase()) {
        throw new APIError("BAD_REQUEST", {
          message: "Invite email does not match",
        });
      }

      if (invite.revokedAt) {
        throw new APIError("BAD_REQUEST", {
          message: "Invite was revoked",
        });
      }

      if (invite.usedAt) {
        throw new APIError("BAD_REQUEST", {
          message: "Invite already used",
        });
      }

      if (invite.expiresAt <= new Date()) {
        throw new APIError("BAD_REQUEST", {
          message: "Invite expired",
        });
      }

      (ctx.context as { inviteToken?: string; inviteId?: string }).inviteId =
        invite.id;
      (ctx.context as { inviteToken?: string }).inviteToken = inviteToken;
      if (ctx.body && "inviteToken" in ctx.body) {
        delete (ctx.body as Record<string, unknown>).inviteToken;
      }
    }),
    after: createAuthMiddleware(async (ctx) => {
      if (ctx.path !== "/sign-up/email") return;

      const inviteToken = (ctx.context as { inviteToken?: string }).inviteToken;
      const newSession = ctx.context.newSession;

      if (!inviteToken || !newSession?.user?.email) return;

      const tokenHash = hashInviteToken(inviteToken);
      await db
        .update(adminInvite)
        .set({
          usedAt: new Date(),
          acceptedBy: newSession.user.id,
        })
        .where(
          and(
            eq(adminInvite.tokenHash, tokenHash),
            eq(adminInvite.email, newSession.user.email),
            gt(adminInvite.expiresAt, new Date()),
            isNull(adminInvite.usedAt),
            isNull(adminInvite.revokedAt),
          ),
        );
    }),
  },
});
