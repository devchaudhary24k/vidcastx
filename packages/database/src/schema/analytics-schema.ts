import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  real,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

import { organization } from "./auth-schema";
import { streams } from "./live-schema";
import { videos } from "./video-schema";

// Enums
export const deviceTypeEnum = pgEnum("device_type", [
  "desktop",
  "mobile",
  "tablet",
  "tv",
  "unknown",
]);

export const trafficSourceEnum = pgEnum("traffic_source", [
  "direct",
  "search",
  "external",
  "suggested",
  "playlist",
  "channel_page",
  "embedded",
  "notification",
  "unknown",
]);

export const playerEventEnum = pgEnum("player_event", [
  "play",
  "pause",
  "seek",
  "quality_change",
  "fullscreen",
  "pip_enter",
  "pip_exit",
  "playback_rate_change",
  "audio_track_change",
  "subtitle_toggle",
]);

// ============================================
// VIDEO ANALYTICS
// ============================================

/**
 * Aggregated daily stats per video - for fast dashboard queries
 */
export const videoStats = pgTable(
  "video_stats",
  {
    id: text("id").primaryKey(),
    videoId: text("video_id")
      .notNull()
      .references(() => videos.id, { onDelete: "cascade" }),
    date: timestamp("date").notNull(), // Truncated to day

    // Core Metrics
    views: integer("views").default(0).notNull(),
    uniqueViewers: integer("unique_viewers").default(0).notNull(),
    totalWatchTimeSeconds: integer("total_watch_time_seconds")
      .default(0)
      .notNull(),
    avgWatchTimeSeconds: integer("avg_watch_time_seconds").default(0),
    avgPercentageWatched: real("avg_percentage_watched").default(0), // 0-100

    // Engagement
    likes: integer("likes").default(0).notNull(),
    dislikes: integer("dislikes").default(0).notNull(),
    shares: integer("shares").default(0).notNull(),
    comments: integer("comments").default(0).notNull(),

    // Retention
    finishedCount: integer("finished_count").default(0), // Watched >90%
    bounceCount: integer("bounce_count").default(0), // Left within 10 seconds

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("video_stats_videoId_date_idx").on(table.videoId, table.date),
    index("video_stats_date_idx").on(table.date),
  ],
);

/**
 * Heatmap data - segment-level engagement
 * Stores which 5-second segments are watched/rewatched
 */
export const videoHeatmap = pgTable(
  "video_heatmap",
  {
    id: text("id").primaryKey(),
    videoId: text("video_id")
      .notNull()
      .references(() => videos.id, { onDelete: "cascade" }),
    date: timestamp("date").notNull(),

    // Segment data: { "0": 1500, "5": 1400, "10": 1350 }
    // Key = start second, Value = view count for that segment
    segmentViews: jsonb("segment_views").default({}).notNull(),

    // Rewatch data for identifying "golden moments"
    segmentRewatches: jsonb("segment_rewatches").default({}).notNull(),

    // Drop-off points: [15, 120, 340] - seconds where many viewers left
    dropOffPoints: jsonb("drop_off_points").default([]),

    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("video_heatmap_videoId_date_idx").on(table.videoId, table.date),
  ],
);

/**
 * Individual view sessions - for detailed analysis
 */
export const viewSessions = pgTable(
  "view_session",
  {
    id: text("id").primaryKey(),
    videoId: text("video_id")
      .notNull()
      .references(() => videos.id, { onDelete: "cascade" }),

    // Viewer identification (anonymous-friendly)
    viewerFingerprint: text("viewer_fingerprint"), // Hashed browser fingerprint
    userId: text("user_id"), // Optional: logged-in user

    // Session Data
    startedAt: timestamp("started_at").defaultNow().notNull(),
    endedAt: timestamp("ended_at"),
    watchedSeconds: integer("watched_seconds").default(0),
    percentageWatched: real("percentage_watched").default(0),

    // Watched ranges: [[0, 30], [45, 120]] - for accurate unique watch time
    watchedRanges: jsonb("watched_ranges").default([]),

    // Quality metrics
    avgBitrate: integer("avg_bitrate"), // kbps
    qualityChanges: integer("quality_changes").default(0),
    bufferingEvents: integer("buffering_events").default(0),
    bufferingDuration: integer("buffering_duration_ms").default(0),

    // Device & Context
    deviceType: deviceTypeEnum("device_type").default("unknown"),
    browser: text("browser"),
    os: text("os"),
    screenResolution: text("screen_resolution"), // "1920x1080"

    // Traffic
    trafficSource: trafficSourceEnum("traffic_source").default("unknown"),
    referrerUrl: text("referrer_url"),
    referrerDomain: text("referrer_domain"),

    // Geo (store country/region, not IP)
    country: text("country"), // ISO code: "US", "DE"
    region: text("region"),
    city: text("city"),

    // Player interactions
    usedFullscreen: boolean("used_fullscreen").default(false),
    usedPip: boolean("used_pip").default(false),
    changedPlaybackSpeed: boolean("changed_playback_speed").default(false),
    enabledSubtitles: boolean("enabled_subtitles").default(false),
    changedAudioTrack: boolean("changed_audio_track").default(false),

    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("view_session_videoId_idx").on(table.videoId),
    index("view_session_startedAt_idx").on(table.startedAt),
    index("view_session_fingerprint_idx").on(table.viewerFingerprint),
  ],
);

/**
 * Player events for granular interaction tracking
 */
export const playerEvents = pgTable(
  "player_event",
  {
    id: text("id").primaryKey(),
    sessionId: text("session_id")
      .notNull()
      .references(() => viewSessions.id, { onDelete: "cascade" }),
    videoId: text("video_id")
      .notNull()
      .references(() => videos.id, { onDelete: "cascade" }),

    event: playerEventEnum("event").notNull(),
    timestamp: integer("timestamp").notNull(), // Video timestamp in seconds
    metadata: jsonb("metadata"), // { from: "720p", to: "1080p" }

    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("player_event_sessionId_idx").on(table.sessionId),
    index("player_event_videoId_idx").on(table.videoId),
  ],
);

// ============================================
// DEMOGRAPHIC BREAKDOWNS (Aggregated)
// ============================================

/**
 * Daily aggregated stats by dimension (for fast charting)
 */
export const videoStatsByDimension = pgTable(
  "video_stats_by_dimension",
  {
    id: text("id").primaryKey(),
    videoId: text("video_id")
      .notNull()
      .references(() => videos.id, { onDelete: "cascade" }),
    date: timestamp("date").notNull(),

    // Dimension type: "country", "device", "traffic_source", "browser"
    dimension: text("dimension").notNull(),
    dimensionValue: text("dimension_value").notNull(), // "US", "mobile", "youtube"

    views: integer("views").default(0).notNull(),
    uniqueViewers: integer("unique_viewers").default(0).notNull(),
    watchTimeSeconds: integer("watch_time_seconds").default(0).notNull(),
    avgPercentageWatched: real("avg_percentage_watched").default(0),

    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("stats_dimension_video_date_idx").on(
      table.videoId,
      table.date,
      table.dimension,
    ),
  ],
);

// ============================================
// LIVE STREAM ANALYTICS
// ============================================

export const streamStats = pgTable(
  "stream_stats",
  {
    id: text("id").primaryKey(),
    streamId: text("stream_id")
      .notNull()
      .references(() => streams.id, { onDelete: "cascade" }),

    // Concurrent viewer snapshots (sampled every 30 seconds)
    // [{ t: 1701234567, v: 150 }, { t: 1701234597, v: 175 }]
    viewerTimeline: jsonb("viewer_timeline").default([]),

    peakViewers: integer("peak_viewers").default(0),
    avgViewers: integer("avg_viewers").default(0),
    totalUniqueViewers: integer("total_unique_viewers").default(0),
    totalChatMessages: integer("total_chat_messages").default(0),

    // Engagement events timeline
    // [{ t: 1701234567, type: "raid", data: { from: "channel_x", viewers: 50 }}]
    eventTimeline: jsonb("event_timeline").default([]),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("stream_stats_streamId_idx").on(table.streamId)],
);

// ============================================
// ORGANIZATION-LEVEL ANALYTICS
// ============================================

export const orgStats = pgTable(
  "org_stats",
  {
    id: text("id").primaryKey(),
    orgId: text("org_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    date: timestamp("date").notNull(),

    // Aggregate metrics across all videos
    totalViews: integer("total_views").default(0).notNull(),
    totalUniqueViewers: integer("total_unique_viewers").default(0).notNull(),
    totalWatchTimeSeconds: integer("total_watch_time_seconds")
      .default(0)
      .notNull(),

    // Content metrics
    videosUploaded: integer("videos_uploaded").default(0),
    videosPublished: integer("videos_published").default(0),
    streamsStarted: integer("streams_started").default(0),

    // Engagement
    totalLikes: integer("total_likes").default(0),
    totalShares: integer("total_shares").default(0),
    newSubscribers: integer("new_subscribers").default(0),

    // Revenue (if monetized)
    estimatedRevenueCents: integer("estimated_revenue_cents").default(0),

    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("org_stats_orgId_date_idx").on(table.orgId, table.date)],
);

/**
 * Track subscriber/follower growth
 */
export const channelSubscribers = pgTable(
  "channel_subscriber",
  {
    id: text("id").primaryKey(),
    orgId: text("org_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    userId: text("user_id"), // Can be null for anonymous tracking
    subscriberFingerprint: text("subscriber_fingerprint"),

    subscribedAt: timestamp("subscribed_at").defaultNow().notNull(),
    unsubscribedAt: timestamp("unsubscribed_at"),
    isActive: boolean("is_active").default(true).notNull(),

    // How they found the channel
    sourceVideoId: text("source_video_id").references(() => videos.id),
    trafficSource: trafficSourceEnum("traffic_source"),
  },
  (table) => [
    index("subscriber_orgId_idx").on(table.orgId),
    index("subscriber_active_idx").on(table.orgId, table.isActive),
  ],
);

// ============================================
// SEARCH & DISCOVERY ANALYTICS
// ============================================

export const searchQueries = pgTable(
  "search_query",
  {
    id: text("id").primaryKey(),
    orgId: text("org_id").references(() => organization.id, {
      onDelete: "cascade",
    }),

    query: text("query").notNull(),
    resultsCount: integer("results_count").default(0),
    clickedVideoId: text("clicked_video_id").references(() => videos.id),
    clickedPosition: integer("clicked_position"), // Which result they clicked (1st, 2nd, etc.)

    // For semantic search insights
    wasSemanticSearch: boolean("was_semantic_search").default(false),
    clickedTimestamp: integer("clicked_timestamp"), // If they clicked a specific timestamp

    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("search_query_orgId_idx").on(table.orgId),
    index("search_query_query_idx").on(table.query),
  ],
);

// ============================================
// EMBED & EXTERNAL ANALYTICS
// ============================================

export const embedStats = pgTable(
  "embed_stats",
  {
    id: text("id").primaryKey(),
    videoId: text("video_id")
      .notNull()
      .references(() => videos.id, { onDelete: "cascade" }),
    date: timestamp("date").notNull(),

    embedDomain: text("embed_domain").notNull(), // "medium.com", "blog.example.com"
    embedUrl: text("embed_url"),

    views: integer("views").default(0).notNull(),
    watchTimeSeconds: integer("watch_time_seconds").default(0).notNull(),

    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("embed_stats_videoId_date_idx").on(table.videoId, table.date),
    index("embed_stats_domain_idx").on(table.embedDomain),
  ],
);

// ============================================
// REAL-TIME METRICS (for live dashboards)
// ============================================

export const realtimeMetrics = pgTable(
  "realtime_metrics",
  {
    id: text("id").primaryKey(),
    entityType: text("entity_type").notNull(), // "video", "stream", "org"
    entityId: text("entity_id").notNull(),

    currentViewers: integer("current_viewers").default(0),
    viewsLast5Min: integer("views_last_5_min").default(0),
    viewsLastHour: integer("views_last_hour").default(0),

    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("realtime_entity_idx").on(table.entityType, table.entityId),
  ],
);

// ============================================
// RELATIONS
// ============================================

export const videoStatsRelations = relations(videoStats, ({ one }) => ({
  video: one(videos, {
    fields: [videoStats.videoId],
    references: [videos.id],
  }),
}));

export const videoHeatmapRelations = relations(videoHeatmap, ({ one }) => ({
  video: one(videos, {
    fields: [videoHeatmap.videoId],
    references: [videos.id],
  }),
}));

export const viewSessionsRelations = relations(
  viewSessions,
  ({ one, many }) => ({
    video: one(videos, {
      fields: [viewSessions.videoId],
      references: [videos.id],
    }),
    events: many(playerEvents),
  }),
);

export const playerEventsRelations = relations(playerEvents, ({ one }) => ({
  session: one(viewSessions, {
    fields: [playerEvents.sessionId],
    references: [viewSessions.id],
  }),
  video: one(videos, {
    fields: [playerEvents.videoId],
    references: [videos.id],
  }),
}));

export const videoStatsByDimensionRelations = relations(
  videoStatsByDimension,
  ({ one }) => ({
    video: one(videos, {
      fields: [videoStatsByDimension.videoId],
      references: [videos.id],
    }),
  }),
);

export const streamStatsRelations = relations(streamStats, ({ one }) => ({
  stream: one(streams, {
    fields: [streamStats.streamId],
    references: [streams.id],
  }),
}));

export const orgStatsRelations = relations(orgStats, ({ one }) => ({
  organization: one(organization, {
    fields: [orgStats.orgId],
    references: [organization.id],
  }),
}));

export const channelSubscribersRelations = relations(
  channelSubscribers,
  ({ one }) => ({
    organization: one(organization, {
      fields: [channelSubscribers.orgId],
      references: [organization.id],
    }),
    sourceVideo: one(videos, {
      fields: [channelSubscribers.sourceVideoId],
      references: [videos.id],
    }),
  }),
);

export const searchQueriesRelations = relations(searchQueries, ({ one }) => ({
  organization: one(organization, {
    fields: [searchQueries.orgId],
    references: [organization.id],
  }),
  clickedVideo: one(videos, {
    fields: [searchQueries.clickedVideoId],
    references: [videos.id],
  }),
}));

export const embedStatsRelations = relations(embedStats, ({ one }) => ({
  video: one(videos, {
    fields: [embedStats.videoId],
    references: [videos.id],
  }),
}));
