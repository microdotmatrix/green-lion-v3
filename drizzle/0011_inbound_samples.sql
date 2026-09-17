CREATE TABLE "inbound_samples" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"manufacturer" text NOT NULL,
	"part_number" text NOT NULL,
	"image_url" text DEFAULT '' NOT NULL,
	"capacity" text DEFAULT '' NOT NULL,
	"voltage" text DEFAULT '' NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"testing_notes" text DEFAULT '' NOT NULL,
	"status" text DEFAULT 'received' NOT NULL,
	"uploaded_by" text,
	"uploader_name" text NOT NULL,
	"approved" boolean,
	"reviewed_by" text,
	"reviewer_name" text,
	"reviewed_at" timestamp,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "inbound_samples_status_check" CHECK ("inbound_samples"."status" IN ('received', 'pending_evaluation', 'testing', 'evaluated')),
	CONSTRAINT "inbound_samples_review_check" CHECK (("inbound_samples"."approved" IS NULL AND "inbound_samples"."reviewed_by" IS NULL AND "inbound_samples"."reviewer_name" IS NULL AND "inbound_samples"."reviewed_at" IS NULL) OR ("inbound_samples"."approved" IS NOT NULL AND "inbound_samples"."status" = 'evaluated' AND "inbound_samples"."reviewer_name" IS NOT NULL AND "inbound_samples"."reviewed_at" IS NOT NULL))
);
--> statement-breakpoint
ALTER TABLE "inbound_samples" ADD CONSTRAINT "inbound_samples_uploaded_by_user_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inbound_samples" ADD CONSTRAINT "inbound_samples_reviewed_by_user_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "inbound_samples_created_at_idx" ON "inbound_samples" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "inbound_samples_status_idx" ON "inbound_samples" USING btree ("status");