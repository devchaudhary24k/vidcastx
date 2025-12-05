CREATE TYPE "public"."asset_type" AS ENUM('hls_playlist', 'thumbnail', 'preview_gif', 'audio_track', 'subtitle_track', 'storyboard', 'source_file');--> statement-breakpoint
CREATE TYPE "public"."video_status" AS ENUM('waiting_upload', 'processing', 'ready', 'failed');--> statement-breakpoint
CREATE TYPE "public"."visibility" AS ENUM('public', 'private', 'unlisted');--> statement-breakpoint
CREATE TYPE "public"."ai_job_status" AS ENUM('pending', 'processing', 'completed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."ai_job_type" AS ENUM('transcribe', 'translate', 'dub', 'clean_mode', 'generate_metadata');--> statement-breakpoint
CREATE TYPE "public"."distribution_status" AS ENUM('pending', 'processing', 'success', 'failed');--> statement-breakpoint
CREATE TYPE "public"."integration_provider" AS ENUM('youtube', 'twitch', 'tiktok', 'facebook');--> statement-breakpoint
CREATE TYPE "public"."invoice_status" AS ENUM('draft', 'open', 'paid', 'void', 'uncollectible');--> statement-breakpoint
CREATE TYPE "public"."subscription_status" AS ENUM('active', 'canceled', 'past_due', 'trialing', 'paused', 'incomplete', 'incomplete_expired');--> statement-breakpoint
CREATE TYPE "public"."usage_type" AS ENUM('encoding_minutes', 'storage_gb', 'ai_tokens', 'bandwidth_gb', 'live_streaming_minutes', 'api_requests');--> statement-breakpoint
CREATE TYPE "public"."transcript_status" AS ENUM('pending', 'processing', 'completed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."device_type" AS ENUM('desktop', 'mobile', 'tablet', 'tv', 'console', 'wearable', 'unknown');--> statement-breakpoint
CREATE TYPE "public"."player_event_type" AS ENUM('play', 'pause', 'seek', 'quality_change', 'fullscreen', 'pip_enter', 'pip_exit', 'playback_rate_change', 'audio_track_change', 'subtitle_toggle', 'error', 'buffer_start', 'buffer_end');--> statement-breakpoint
CREATE TYPE "public"."traffic_source" AS ENUM('direct', 'search', 'external', 'suggested', 'playlist', 'channel_page', 'embedded', 'notification', 'social', 'unknown');--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invitation" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"email" text NOT NULL,
	"role" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"inviter_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "member" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"user_id" text NOT NULL,
	"role" text DEFAULT 'member' NOT NULL,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organization" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"logo" text,
	"created_at" timestamp NOT NULL,
	"metadata" text,
	"deleted_at" timestamp,
	CONSTRAINT "organization_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	"active_organization_id" text,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"first_name" text,
	"last_name" text,
	"deleted_at" timestamp,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "asset" (
	"id" text PRIMARY KEY NOT NULL,
	"video_id" text NOT NULL,
	"type" "asset_type" NOT NULL,
	"storage_key" text NOT NULL,
	"playback_url" text,
	"byte_size" bigint DEFAULT 0 NOT NULL,
	"language" text DEFAULT 'en',
	"label" text,
	"is_original" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "video" (
	"id" text PRIMARY KEY NOT NULL,
	"org_id" text NOT NULL,
	"uploader_id" text,
	"folder_id" text,
	"title" text DEFAULT 'Untitled Video' NOT NULL,
	"description" text,
	"visibility" "visibility" DEFAULT 'private' NOT NULL,
	"scheduled_at" timestamp,
	"published_at" timestamp,
	"status" "video_status" DEFAULT 'waiting_upload' NOT NULL,
	"error_reason" text,
	"duration" integer,
	"resolution" text,
	"aspect_ratio" text,
	"frame_count" integer,
	"master_access_url" text,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "ai_job" (
	"id" text PRIMARY KEY NOT NULL,
	"org_id" text NOT NULL,
	"video_id" text,
	"params" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"type" "ai_job_type" NOT NULL,
	"provider" text NOT NULL,
	"tokens_used" integer DEFAULT 0,
	"cost_in_cents" integer DEFAULT 0,
	"execution_time_ms" integer,
	"status" "ai_job_status" DEFAULT 'pending' NOT NULL,
	"error_log" text,
	"output_asset_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "distribution_log" (
	"id" text PRIMARY KEY NOT NULL,
	"video_id" text NOT NULL,
	"integration_id" text NOT NULL,
	"external_video_id" text,
	"external_url" text,
	"status" "distribution_status" DEFAULT 'pending' NOT NULL,
	"error_log" text,
	"synced_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "integration" (
	"id" text PRIMARY KEY NOT NULL,
	"org_id" text NOT NULL,
	"provider" "integration_provider" NOT NULL,
	"refresh_token" text NOT NULL,
	"access_token" text,
	"expires_at" timestamp,
	"external_channel_id" text,
	"external_name" text,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "channel" (
	"id" text PRIMARY KEY NOT NULL,
	"org_id" text NOT NULL,
	"name" text NOT NULL,
	"stream_key" text NOT NULL,
	"is_live" boolean DEFAULT false NOT NULL,
	"last_live_at" timestamp,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "channel_stream_key_unique" UNIQUE("stream_key")
);
--> statement-breakpoint
CREATE TABLE "stream" (
	"id" text PRIMARY KEY NOT NULL,
	"channel_id" text NOT NULL,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"ended_at" timestamp,
	"viewer_peak" integer DEFAULT 0,
	"recording_video_id" text,
	"duration_seconds" integer
);
--> statement-breakpoint
CREATE TABLE "webhook" (
	"id" text PRIMARY KEY NOT NULL,
	"org_id" text NOT NULL,
	"url" text NOT NULL,
	"secret" text NOT NULL,
	"events" jsonb NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"failure_count" integer DEFAULT 0,
	"last_triggered_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "credit" (
	"id" text PRIMARY KEY NOT NULL,
	"org_id" text NOT NULL,
	"type" text NOT NULL,
	"amount_cents" integer NOT NULL,
	"balance_after_cents" integer NOT NULL,
	"description" text,
	"reference_type" text,
	"reference_id" text,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoice" (
	"id" text PRIMARY KEY NOT NULL,
	"org_id" text NOT NULL,
	"subscription_id" text,
	"stripe_invoice_id" text,
	"stripe_payment_intent_id" text,
	"status" "invoice_status" DEFAULT 'draft' NOT NULL,
	"currency" text DEFAULT 'usd' NOT NULL,
	"subtotal_cents" integer DEFAULT 0 NOT NULL,
	"tax_cents" integer DEFAULT 0,
	"discount_cents" integer DEFAULT 0,
	"total_cents" integer DEFAULT 0 NOT NULL,
	"period_start" timestamp NOT NULL,
	"period_end" timestamp NOT NULL,
	"line_items" jsonb DEFAULT '[]'::jsonb,
	"invoice_pdf_url" text,
	"hosted_invoice_url" text,
	"paid_at" timestamp,
	"due_date" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payment_method" (
	"id" text PRIMARY KEY NOT NULL,
	"org_id" text NOT NULL,
	"stripe_payment_method_id" text NOT NULL,
	"type" text NOT NULL,
	"brand" text,
	"last4" text,
	"expiry_month" integer,
	"expiry_year" integer,
	"is_default" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "subscription" (
	"id" text PRIMARY KEY NOT NULL,
	"org_id" text NOT NULL,
	"stripe_customer_id" text,
	"stripe_subscription_id" text,
	"stripe_price_id" text,
	"plan_name" text NOT NULL,
	"status" "subscription_status" DEFAULT 'active' NOT NULL,
	"current_period_start" timestamp NOT NULL,
	"current_period_end" timestamp NOT NULL,
	"trial_start" timestamp,
	"trial_end" timestamp,
	"cancel_at_period_end" boolean DEFAULT false,
	"canceled_at" timestamp,
	"limits" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "usage_record" (
	"id" text PRIMARY KEY NOT NULL,
	"org_id" text NOT NULL,
	"type" "usage_type" NOT NULL,
	"quantity" integer NOT NULL,
	"unit_cost_cents" integer,
	"period_start" timestamp NOT NULL,
	"period_end" timestamp NOT NULL,
	"resource_type" text,
	"resource_id" text,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "usage_summary" (
	"id" text PRIMARY KEY NOT NULL,
	"org_id" text NOT NULL,
	"date" timestamp NOT NULL,
	"encoding_minutes" integer DEFAULT 0 NOT NULL,
	"storage_gb" integer DEFAULT 0 NOT NULL,
	"ai_tokens" integer DEFAULT 0 NOT NULL,
	"bandwidth_gb" integer DEFAULT 0 NOT NULL,
	"live_streaming_minutes" integer DEFAULT 0 NOT NULL,
	"api_requests" integer DEFAULT 0 NOT NULL,
	"encoding_cost_cents" integer DEFAULT 0,
	"storage_cost_cents" integer DEFAULT 0,
	"ai_cost_cents" integer DEFAULT 0,
	"bandwidth_cost_cents" integer DEFAULT 0,
	"streaming_cost_cents" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transcript_embedding" (
	"id" text PRIMARY KEY NOT NULL,
	"transcript_id" text NOT NULL,
	"video_id" text NOT NULL,
	"segment_index" integer NOT NULL,
	"start_time" integer NOT NULL,
	"end_time" integer NOT NULL,
	"text" text NOT NULL,
	"embedding" vector(1536),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transcript" (
	"id" text PRIMARY KEY NOT NULL,
	"video_id" text NOT NULL,
	"language" text DEFAULT 'en' NOT NULL,
	"is_original" boolean DEFAULT true NOT NULL,
	"is_auto_generated" boolean DEFAULT true NOT NULL,
	"content" text NOT NULL,
	"segments" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"word_timings" jsonb DEFAULT '[]'::jsonb,
	"status" "transcript_status" DEFAULT 'pending' NOT NULL,
	"provider" text,
	"confidence" integer,
	"duration_processed" integer,
	"error_log" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "video_chapter" (
	"id" text PRIMARY KEY NOT NULL,
	"video_id" text NOT NULL,
	"timestamp" integer NOT NULL,
	"end_timestamp" integer,
	"title" text NOT NULL,
	"description" text,
	"thumbnail_url" text,
	"is_auto_generated" boolean DEFAULT true NOT NULL,
	"confidence" integer,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "video_summary" (
	"id" text PRIMARY KEY NOT NULL,
	"video_id" text NOT NULL,
	"language" text DEFAULT 'en' NOT NULL,
	"short_summary" text,
	"medium_summary" text,
	"long_summary" text,
	"key_points" jsonb DEFAULT '[]'::jsonb,
	"topics" jsonb DEFAULT '[]'::jsonb,
	"seo_description" text,
	"provider" text,
	"model_used" text,
	"tokens_used" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "channel_subscriber" (
	"id" text PRIMARY KEY NOT NULL,
	"org_id" text NOT NULL,
	"user_id" text,
	"subscriber_fingerprint" text,
	"subscribed_at" timestamp DEFAULT now() NOT NULL,
	"unsubscribed_at" timestamp,
	"is_active" boolean DEFAULT true NOT NULL,
	"source_video_id" text,
	"traffic_source" "traffic_source"
);
--> statement-breakpoint
CREATE TABLE "embed_stats" (
	"id" text PRIMARY KEY NOT NULL,
	"video_id" text NOT NULL,
	"date" timestamp NOT NULL,
	"embed_domain" text NOT NULL,
	"embed_url" text,
	"views" integer DEFAULT 0 NOT NULL,
	"watch_time_seconds" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "org_stats" (
	"id" text PRIMARY KEY NOT NULL,
	"org_id" text NOT NULL,
	"date" timestamp NOT NULL,
	"total_views" integer DEFAULT 0 NOT NULL,
	"total_unique_viewers" integer DEFAULT 0 NOT NULL,
	"total_watch_time_seconds" integer DEFAULT 0 NOT NULL,
	"videos_uploaded" integer DEFAULT 0,
	"videos_published" integer DEFAULT 0,
	"streams_started" integer DEFAULT 0,
	"total_likes" integer DEFAULT 0,
	"total_shares" integer DEFAULT 0,
	"new_subscribers" integer DEFAULT 0,
	"estimated_revenue_cents" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "player_event" (
	"id" text PRIMARY KEY NOT NULL,
	"session_id" text NOT NULL,
	"video_id" text NOT NULL,
	"event" "player_event_type" NOT NULL,
	"timestamp" integer NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "realtime_metrics" (
	"id" text PRIMARY KEY NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" text NOT NULL,
	"current_viewers" integer DEFAULT 0,
	"views_last_5_min" integer DEFAULT 0,
	"views_last_hour" integer DEFAULT 0,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "search_query" (
	"id" text PRIMARY KEY NOT NULL,
	"org_id" text,
	"query" text NOT NULL,
	"results_count" integer DEFAULT 0,
	"clicked_video_id" text,
	"clicked_position" integer,
	"was_semantic_search" boolean DEFAULT false,
	"clicked_timestamp" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stream_stats" (
	"id" text PRIMARY KEY NOT NULL,
	"stream_id" text NOT NULL,
	"viewer_timeline" jsonb DEFAULT '[]'::jsonb,
	"peak_viewers" integer DEFAULT 0,
	"avg_viewers" integer DEFAULT 0,
	"total_unique_viewers" integer DEFAULT 0,
	"total_chat_messages" integer DEFAULT 0,
	"event_timeline" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "video_heatmap" (
	"id" text PRIMARY KEY NOT NULL,
	"video_id" text NOT NULL,
	"date" timestamp NOT NULL,
	"segment_views" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"segment_rewatches" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"drop_off_points" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "video_stats" (
	"id" text PRIMARY KEY NOT NULL,
	"video_id" text NOT NULL,
	"date" timestamp NOT NULL,
	"views" integer DEFAULT 0 NOT NULL,
	"unique_viewers" integer DEFAULT 0 NOT NULL,
	"total_watch_time_seconds" integer DEFAULT 0 NOT NULL,
	"avg_watch_time_seconds" integer DEFAULT 0,
	"avg_percentage_watched" real DEFAULT 0,
	"likes" integer DEFAULT 0 NOT NULL,
	"dislikes" integer DEFAULT 0 NOT NULL,
	"shares" integer DEFAULT 0 NOT NULL,
	"comments" integer DEFAULT 0 NOT NULL,
	"finished_count" integer DEFAULT 0,
	"bounce_count" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "video_stats_by_dimension" (
	"id" text PRIMARY KEY NOT NULL,
	"video_id" text NOT NULL,
	"date" timestamp NOT NULL,
	"dimension" text NOT NULL,
	"dimension_value" text NOT NULL,
	"views" integer DEFAULT 0 NOT NULL,
	"unique_viewers" integer DEFAULT 0 NOT NULL,
	"watch_time_seconds" integer DEFAULT 0 NOT NULL,
	"avg_percentage_watched" real DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "view_session" (
	"id" text PRIMARY KEY NOT NULL,
	"video_id" text NOT NULL,
	"viewer_fingerprint" text,
	"user_id" text,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"ended_at" timestamp,
	"updated_at" timestamp DEFAULT now(),
	"watched_seconds" integer DEFAULT 0,
	"percentage_watched" real DEFAULT 0,
	"watched_ranges" jsonb DEFAULT '[]'::jsonb,
	"avg_bitrate" integer,
	"quality_changes" integer DEFAULT 0,
	"buffering_events" integer DEFAULT 0,
	"buffering_duration_ms" integer DEFAULT 0,
	"device_type" "device_type" DEFAULT 'unknown',
	"browser" text,
	"os" text,
	"user_agent" text,
	"screen_resolution" text,
	"traffic_source" "traffic_source" DEFAULT 'unknown',
	"referrer_url" text,
	"referrer_domain" text,
	"country" text,
	"region" text,
	"city" text,
	"used_fullscreen" boolean DEFAULT false,
	"used_pip" boolean DEFAULT false,
	"changed_playback_speed" boolean DEFAULT false,
	"enabled_subtitles" boolean DEFAULT false,
	"changed_audio_track" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "folder" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"parent_id" text,
	"org_id" text NOT NULL,
	"created_by_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitation" ADD CONSTRAINT "invitation_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitation" ADD CONSTRAINT "invitation_inviter_id_user_id_fk" FOREIGN KEY ("inviter_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member" ADD CONSTRAINT "member_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member" ADD CONSTRAINT "member_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset" ADD CONSTRAINT "asset_video_id_video_id_fk" FOREIGN KEY ("video_id") REFERENCES "public"."video"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "video" ADD CONSTRAINT "video_org_id_organization_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "video" ADD CONSTRAINT "video_uploader_id_user_id_fk" FOREIGN KEY ("uploader_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "video" ADD CONSTRAINT "video_folder_id_folder_id_fk" FOREIGN KEY ("folder_id") REFERENCES "public"."folder"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_job" ADD CONSTRAINT "ai_job_org_id_organization_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_job" ADD CONSTRAINT "ai_job_video_id_video_id_fk" FOREIGN KEY ("video_id") REFERENCES "public"."video"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_job" ADD CONSTRAINT "ai_job_output_asset_id_asset_id_fk" FOREIGN KEY ("output_asset_id") REFERENCES "public"."asset"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "distribution_log" ADD CONSTRAINT "distribution_log_video_id_video_id_fk" FOREIGN KEY ("video_id") REFERENCES "public"."video"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "distribution_log" ADD CONSTRAINT "distribution_log_integration_id_integration_id_fk" FOREIGN KEY ("integration_id") REFERENCES "public"."integration"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "integration" ADD CONSTRAINT "integration_org_id_organization_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "channel" ADD CONSTRAINT "channel_org_id_organization_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stream" ADD CONSTRAINT "stream_channel_id_channel_id_fk" FOREIGN KEY ("channel_id") REFERENCES "public"."channel"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stream" ADD CONSTRAINT "stream_recording_video_id_video_id_fk" FOREIGN KEY ("recording_video_id") REFERENCES "public"."video"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "webhook" ADD CONSTRAINT "webhook_org_id_organization_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit" ADD CONSTRAINT "credit_org_id_organization_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice" ADD CONSTRAINT "invoice_org_id_organization_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice" ADD CONSTRAINT "invoice_subscription_id_subscription_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."subscription"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_method" ADD CONSTRAINT "payment_method_org_id_organization_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscription" ADD CONSTRAINT "subscription_org_id_organization_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usage_record" ADD CONSTRAINT "usage_record_org_id_organization_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usage_summary" ADD CONSTRAINT "usage_summary_org_id_organization_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transcript_embedding" ADD CONSTRAINT "transcript_embedding_transcript_id_transcript_id_fk" FOREIGN KEY ("transcript_id") REFERENCES "public"."transcript"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transcript_embedding" ADD CONSTRAINT "transcript_embedding_video_id_video_id_fk" FOREIGN KEY ("video_id") REFERENCES "public"."video"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transcript" ADD CONSTRAINT "transcript_video_id_video_id_fk" FOREIGN KEY ("video_id") REFERENCES "public"."video"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "video_chapter" ADD CONSTRAINT "video_chapter_video_id_video_id_fk" FOREIGN KEY ("video_id") REFERENCES "public"."video"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "video_summary" ADD CONSTRAINT "video_summary_video_id_video_id_fk" FOREIGN KEY ("video_id") REFERENCES "public"."video"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "channel_subscriber" ADD CONSTRAINT "channel_subscriber_org_id_organization_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "channel_subscriber" ADD CONSTRAINT "channel_subscriber_source_video_id_video_id_fk" FOREIGN KEY ("source_video_id") REFERENCES "public"."video"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "embed_stats" ADD CONSTRAINT "embed_stats_video_id_video_id_fk" FOREIGN KEY ("video_id") REFERENCES "public"."video"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_stats" ADD CONSTRAINT "org_stats_org_id_organization_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_event" ADD CONSTRAINT "player_event_session_id_view_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."view_session"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_event" ADD CONSTRAINT "player_event_video_id_video_id_fk" FOREIGN KEY ("video_id") REFERENCES "public"."video"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "search_query" ADD CONSTRAINT "search_query_org_id_organization_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "search_query" ADD CONSTRAINT "search_query_clicked_video_id_video_id_fk" FOREIGN KEY ("clicked_video_id") REFERENCES "public"."video"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stream_stats" ADD CONSTRAINT "stream_stats_stream_id_stream_id_fk" FOREIGN KEY ("stream_id") REFERENCES "public"."stream"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "video_heatmap" ADD CONSTRAINT "video_heatmap_video_id_video_id_fk" FOREIGN KEY ("video_id") REFERENCES "public"."video"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "video_stats" ADD CONSTRAINT "video_stats_video_id_video_id_fk" FOREIGN KEY ("video_id") REFERENCES "public"."video"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "video_stats_by_dimension" ADD CONSTRAINT "video_stats_by_dimension_video_id_video_id_fk" FOREIGN KEY ("video_id") REFERENCES "public"."video"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "view_session" ADD CONSTRAINT "view_session_video_id_video_id_fk" FOREIGN KEY ("video_id") REFERENCES "public"."video"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "folder" ADD CONSTRAINT "folder_org_id_organization_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "folder" ADD CONSTRAINT "folder_created_by_id_user_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "folder" ADD CONSTRAINT "folders_parent_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."folder"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "account_userId_idx" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "invitation_organizationId_idx" ON "invitation" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "invitation_email_idx" ON "invitation" USING btree ("email");--> statement-breakpoint
CREATE INDEX "member_organizationId_idx" ON "member" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "member_userId_idx" ON "member" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "session_userId_idx" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" USING btree ("identifier");--> statement-breakpoint
CREATE INDEX "asset_videoId_idx" ON "asset" USING btree ("video_id");--> statement-breakpoint
CREATE INDEX "video_orgId_idx" ON "video" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "video_status_idx" ON "video" USING btree ("status");--> statement-breakpoint
CREATE INDEX "video_folderId_idx" ON "video" USING btree ("folder_id");--> statement-breakpoint
CREATE INDEX "channel_orgId_idx" ON "channel" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "channel_streamKey_idx" ON "channel" USING btree ("stream_key");--> statement-breakpoint
CREATE INDEX "stream_channelId_idx" ON "stream" USING btree ("channel_id");--> statement-breakpoint
CREATE INDEX "webhook_orgId_idx" ON "webhook" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "credit_orgId_idx" ON "credit" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "credit_orgId_createdAt_idx" ON "credit" USING btree ("org_id","created_at");--> statement-breakpoint
CREATE INDEX "invoice_orgId_idx" ON "invoice" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "invoice_status_idx" ON "invoice" USING btree ("status");--> statement-breakpoint
CREATE INDEX "invoice_stripeId_idx" ON "invoice" USING btree ("stripe_invoice_id");--> statement-breakpoint
CREATE INDEX "payment_method_orgId_idx" ON "payment_method" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "subscription_orgId_idx" ON "subscription" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "subscription_stripeCustomerId_idx" ON "subscription" USING btree ("stripe_customer_id");--> statement-breakpoint
CREATE INDEX "usage_orgId_period_idx" ON "usage_record" USING btree ("org_id","period_start");--> statement-breakpoint
CREATE INDEX "usage_orgId_type_idx" ON "usage_record" USING btree ("org_id","type");--> statement-breakpoint
CREATE INDEX "usage_period_idx" ON "usage_record" USING btree ("period_start","period_end");--> statement-breakpoint
CREATE INDEX "usage_summary_orgId_date_idx" ON "usage_summary" USING btree ("org_id","date");--> statement-breakpoint
CREATE INDEX "embedding_transcriptId_idx" ON "transcript_embedding" USING btree ("transcript_id");--> statement-breakpoint
CREATE INDEX "embedding_videoId_idx" ON "transcript_embedding" USING btree ("video_id");--> statement-breakpoint
CREATE INDEX "transcript_videoId_idx" ON "transcript" USING btree ("video_id");--> statement-breakpoint
CREATE INDEX "transcript_videoId_language_idx" ON "transcript" USING btree ("video_id","language");--> statement-breakpoint
CREATE INDEX "chapter_videoId_idx" ON "video_chapter" USING btree ("video_id");--> statement-breakpoint
CREATE INDEX "chapter_videoId_timestamp_idx" ON "video_chapter" USING btree ("video_id","timestamp");--> statement-breakpoint
CREATE INDEX "summary_videoId_idx" ON "video_summary" USING btree ("video_id");--> statement-breakpoint
CREATE INDEX "summary_videoId_language_idx" ON "video_summary" USING btree ("video_id","language");--> statement-breakpoint
CREATE INDEX "subscriber_orgId_idx" ON "channel_subscriber" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "subscriber_active_idx" ON "channel_subscriber" USING btree ("org_id","is_active");--> statement-breakpoint
CREATE INDEX "embed_stats_videoId_date_idx" ON "embed_stats" USING btree ("video_id","date");--> statement-breakpoint
CREATE INDEX "embed_stats_domain_idx" ON "embed_stats" USING btree ("embed_domain");--> statement-breakpoint
CREATE INDEX "org_stats_orgId_date_idx" ON "org_stats" USING btree ("org_id","date");--> statement-breakpoint
CREATE INDEX "player_event_sessionId_idx" ON "player_event" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "player_event_videoId_idx" ON "player_event" USING btree ("video_id");--> statement-breakpoint
CREATE INDEX "realtime_entity_idx" ON "realtime_metrics" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "search_query_orgId_idx" ON "search_query" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "search_query_query_idx" ON "search_query" USING btree ("query");--> statement-breakpoint
CREATE INDEX "stream_stats_streamId_idx" ON "stream_stats" USING btree ("stream_id");--> statement-breakpoint
CREATE INDEX "video_heatmap_videoId_date_idx" ON "video_heatmap" USING btree ("video_id","date");--> statement-breakpoint
CREATE INDEX "video_stats_videoId_date_idx" ON "video_stats" USING btree ("video_id","date");--> statement-breakpoint
CREATE INDEX "video_stats_date_idx" ON "video_stats" USING btree ("date");--> statement-breakpoint
CREATE INDEX "stats_dimension_video_date_idx" ON "video_stats_by_dimension" USING btree ("video_id","date","dimension");--> statement-breakpoint
CREATE INDEX "view_session_videoId_idx" ON "view_session" USING btree ("video_id");--> statement-breakpoint
CREATE INDEX "view_session_startedAt_idx" ON "view_session" USING btree ("started_at");--> statement-breakpoint
CREATE INDEX "view_session_fingerprint_idx" ON "view_session" USING btree ("viewer_fingerprint");--> statement-breakpoint
CREATE INDEX "folder_parentId_idx" ON "folder" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "folder_orgId_idx" ON "folder" USING btree ("org_id");