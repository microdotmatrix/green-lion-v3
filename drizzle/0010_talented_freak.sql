CREATE SEQUENCE IF NOT EXISTS "sample_request_seq" START WITH 10001;--> statement-breakpoint
CREATE TABLE "sample_request_items" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sample_request_id" varchar NOT NULL,
	"product_id" varchar,
	"sku" text NOT NULL,
	"product_name" text NOT NULL,
	"capacity" text,
	"quantity" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sample_requests" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"request_number" text,
	"recipient_name" text NOT NULL,
	"company_name" text,
	"email" text,
	"phone" text,
	"address_line1" text NOT NULL,
	"address_line2" text,
	"city" text NOT NULL,
	"state" text,
	"postal_code" text NOT NULL,
	"country" text DEFAULT 'US' NOT NULL,
	"notes" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "sample_requests_request_number_unique" UNIQUE("request_number")
);
--> statement-breakpoint
ALTER TABLE "sample_request_items" ADD CONSTRAINT "sample_request_items_sample_request_id_sample_requests_id_fk" FOREIGN KEY ("sample_request_id") REFERENCES "public"."sample_requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sample_request_items" ADD CONSTRAINT "sample_request_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "sample_request_items_sampleRequestId_idx" ON "sample_request_items" USING btree ("sample_request_id");