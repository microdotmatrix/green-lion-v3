ALTER TABLE "blog_posts" ADD COLUMN "read_time_minutes" integer DEFAULT 1 NOT NULL;
--> statement-breakpoint
UPDATE "blog_posts"
SET "read_time_minutes" = GREATEST(
  1,
  CEIL(
    COALESCE(
      array_length(
        regexp_split_to_array(
          NULLIF(trim(regexp_replace("body", '<[^>]*>', ' ', 'g')), ''),
          E'\\s+'
        ),
        1
      ),
      0
    ) / 200.0
  )::integer
);
