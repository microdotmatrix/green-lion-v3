ALTER TABLE "user" ADD COLUMN "approved" boolean DEFAULT false NOT NULL;
--> statement-breakpoint
UPDATE "user" SET "approved" = true;
--> statement-breakpoint
CREATE TABLE "admin_invite" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"token_hash" text NOT NULL,
	"invited_by" text,
	"accepted_by" text,
	"expires_at" timestamp NOT NULL,
	"used_at" timestamp,
	"revoked_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "admin_invite_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
ALTER TABLE "admin_invite" ADD CONSTRAINT "admin_invite_invited_by_user_id_fk" FOREIGN KEY ("invited_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "admin_invite" ADD CONSTRAINT "admin_invite_accepted_by_user_id_fk" FOREIGN KEY ("accepted_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "admin_invite_email_idx" ON "admin_invite" USING btree ("email");
--> statement-breakpoint
CREATE INDEX "admin_invite_invitedBy_idx" ON "admin_invite" USING btree ("invited_by");
