CREATE TYPE "public"."folder_visibility" AS ENUM('private', 'public');--> statement-breakpoint
ALTER TABLE "video" ALTER COLUMN "visibility" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "video" ALTER COLUMN "visibility" SET DEFAULT 'private'::text;--> statement-breakpoint
-- Collapse legacy 'unlisted' to 'private' so the new enum cast succeeds
UPDATE "video" SET "visibility" = 'private' WHERE "visibility" = 'unlisted';--> statement-breakpoint
DROP TYPE "public"."visibility";--> statement-breakpoint
CREATE TYPE "public"."visibility" AS ENUM('public', 'private');--> statement-breakpoint
ALTER TABLE "video" ALTER COLUMN "visibility" SET DEFAULT 'private'::"public"."visibility";--> statement-breakpoint
ALTER TABLE "video" ALTER COLUMN "visibility" SET DATA TYPE "public"."visibility" USING "visibility"::"public"."visibility";--> statement-breakpoint
ALTER TABLE "video" ADD COLUMN "pinned" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "folder" ADD COLUMN "visibility" "folder_visibility" DEFAULT 'private' NOT NULL;--> statement-breakpoint
ALTER TABLE "folder" ADD COLUMN "color" varchar(7) DEFAULT '#64748b' NOT NULL;--> statement-breakpoint
ALTER TABLE "folder" ADD COLUMN "cover_image_url" text;--> statement-breakpoint
ALTER TABLE "folder" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "folder" ADD COLUMN "pinned" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "folder" ADD COLUMN "default_video_private" boolean DEFAULT true NOT NULL;--> statement-breakpoint
CREATE INDEX "video_pinned_idx" ON "video" USING btree ("org_id","pinned") WHERE "video"."pinned" = true;--> statement-breakpoint
CREATE INDEX "folder_orgId_parentId_idx" ON "folder" USING btree ("org_id","parent_id");--> statement-breakpoint
CREATE INDEX "folder_pinned_idx" ON "folder" USING btree ("org_id","pinned") WHERE "folder"."pinned" = true;