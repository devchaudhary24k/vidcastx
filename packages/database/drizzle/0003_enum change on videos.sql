ALTER TABLE "video" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "video" ALTER COLUMN "status" SET DEFAULT 'draft'::text;--> statement-breakpoint
DROP TYPE "public"."video_status";--> statement-breakpoint
CREATE TYPE "public"."video_status" AS ENUM('draft', 'uploaded', 'queued', 'dispatch', 'processing', 'ready', 'failed');--> statement-breakpoint
ALTER TABLE "video" ALTER COLUMN "status" SET DEFAULT 'draft'::"public"."video_status";--> statement-breakpoint
ALTER TABLE "video" ALTER COLUMN "status" SET DATA TYPE "public"."video_status" USING "status"::"public"."video_status";