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

export const deviceTypeEnum = pgEnum("device_type", [
  "desktop",
  "mobile",
  "tablet",
  "tv",
  "console",
  "wearable",
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
  "social",
  "unknown",
]);

export const playerEventEnum = pgEnum("player_event_type", [
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
  "error",
  "buffer_start",
  "buffer_end",
]);

export const videoStats = pgTable(
  "video_stats",
  {
    id: text("id").primaryKey(), // Unique identifier for the video stats
    videoId: text("video_id")
      .notNull()
      .references(() => videos.id, { onDelete: "cascade" }), // The video associated with the stats
    date: timestamp("date").notNull(), // The date of the stats
    views: integer("views").default(0).notNull(), // The number of views
    uniqueViewers: integer("unique_viewers").default(0).notNull(), // The number of unique viewers
    totalWatchTimeSeconds: integer("total_watch_time_seconds")
      .default(0)
      .notNull(), // The total watch time in seconds
    avgWatchTimeSeconds: integer("avg_watch_time_seconds").default(0), // The average watch time in seconds
    avgPercentageWatched: real("avg_percentage_watched").default(0), // The average percentage of the video watched
    likes: integer("likes").default(0).notNull(), // The number of likes
    dislikes: integer("dislikes").default(0).notNull(), // The number of dislikes
    shares: integer("shares").default(0).notNull(), // The number of shares
    comments: integer("comments").default(0).notNull(), // The number of comments
    finishedCount: integer("finished_count").default(0), // The number of times the video was finished
    bounceCount: integer("bounce_count").default(0), // The number of times the video was bounced
    createdAt: timestamp("created_at").defaultNow().notNull(), // The timestamp when the stats were created
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(), // The timestamp when the stats were last updated
  },
  (table) => [
    index("video_stats_videoId_date_idx").on(table.videoId, table.date),
    index("video_stats_date_idx").on(table.date),
  ],
);

export const videoHeatmap = pgTable(
  "video_heatmap",
  {
    id: text("id").primaryKey(), // Unique identifier for the video heatmap
    videoId: text("video_id")
      .notNull()
      .references(() => videos.id, { onDelete: "cascade" }), // The video associated with the heatmap
    date: timestamp("date").notNull(), // The date of the heatmap
    segmentViews: jsonb("segment_views").default({}).notNull(), // The views for each segment of the video
    segmentRewatches: jsonb("segment_rewatches").default({}).notNull(), // The rewatches for each segment of the video
    dropOffPoints: jsonb("drop_off_points").default([]), // The points where viewers dropped off
    createdAt: timestamp("created_at").defaultNow().notNull(), // The timestamp when the heatmap was created
  },
  (table) => [
    index("video_heatmap_videoId_date_idx").on(table.videoId, table.date),
  ],
);

export const viewSessions = pgTable(
  "view_session",
  {
    id: text("id").primaryKey(), // Unique identifier for the view session
    videoId: text("video_id")
      .notNull()
      .references(() => videos.id, { onDelete: "cascade" }), // The video associated with the session
    viewerFingerprint: text("viewer_fingerprint"), // The fingerprint of the viewer
    userId: text("user_id"), // The ID of the user
    startedAt: timestamp("started_at").defaultNow().notNull(), // The timestamp when the session started
    endedAt: timestamp("ended_at"), // The timestamp when the session ended
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date()), // The timestamp when the session was last updated
    watchedSeconds: integer("watched_seconds").default(0), // The number of seconds watched
    percentageWatched: real("percentage_watched").default(0), // The percentage of the video watched
    watchedRanges: jsonb("watched_ranges").default([]), // The ranges of the video watched
    avgBitrate: integer("avg_bitrate"), // The average bitrate
    qualityChanges: integer("quality_changes").default(0), // The number of quality changes
    bufferingEvents: integer("buffering_events").default(0), // The number of buffering events
    bufferingDuration: integer("buffering_duration_ms").default(0), // The duration of buffering in milliseconds
    deviceType: deviceTypeEnum("device_type").default("unknown"), // The type of device used
    browser: text("browser"), // The browser used
    os: text("os"), // The operating system used
    userAgent: text("user_agent"), // The user agent string
    screenResolution: text("screen_resolution"), // The screen resolution
    trafficSource: trafficSourceEnum("traffic_source").default("unknown"), // The source of the traffic
    referrerUrl: text("referrer_url"), // The referrer URL
    referrerDomain: text("referrer_domain"), // The referrer domain
    country: text("country"), // The country of the viewer
    region: text("region"), // The region of the viewer
    city: text("city"), // The city of the viewer
    usedFullscreen: boolean("used_fullscreen").default(false), // Whether fullscreen was used
    usedPip: boolean("used_pip").default(false), // Whether picture-in-picture was used
    changedPlaybackSpeed: boolean("changed_playback_speed").default(false), // Whether playback speed was changed
    enabledSubtitles: boolean("enabled_subtitles").default(false), // Whether subtitles were enabled
    changedAudioTrack: boolean("changed_audio_track").default(false), // Whether audio track was changed
    createdAt: timestamp("created_at").defaultNow().notNull(), // The timestamp when the session was created
  },
  (table) => [
    index("view_session_videoId_idx").on(table.videoId),
    index("view_session_startedAt_idx").on(table.startedAt),
    index("view_session_fingerprint_idx").on(table.viewerFingerprint),
  ],
);

export const playerEvents = pgTable(
  "player_event",
  {
    id: text("id").primaryKey(), // Unique identifier for the player event
    sessionId: text("session_id")
      .notNull()
      .references(() => viewSessions.id, { onDelete: "cascade" }), // The session associated with the event
    videoId: text("video_id")
      .notNull()
      .references(() => videos.id, { onDelete: "cascade" }), // The video associated with the event
    event: playerEventEnum("event").notNull(), // The type of event
    timestamp: integer("timestamp").notNull(), // The timestamp of the event
    metadata: jsonb("metadata"), // Metadata associated with the event
    createdAt: timestamp("created_at").defaultNow().notNull(), // The timestamp when the event was created
  },
  (table) => [
    index("player_event_sessionId_idx").on(table.sessionId),
    index("player_event_videoId_idx").on(table.videoId),
  ],
);

export const videoStatsByDimension = pgTable(
  "video_stats_by_dimension",
  {
    id: text("id").primaryKey(), // Unique identifier for the video stats by dimension
    videoId: text("video_id")
      .notNull()
      .references(() => videos.id, { onDelete: "cascade" }), // The video associated with the stats
    date: timestamp("date").notNull(), // The date of the stats
    dimension: text("dimension").notNull(), // The dimension of the stats
    dimensionValue: text("dimension_value").notNull(), // The value of the dimension
    views: integer("views").default(0).notNull(), // The number of views
    uniqueViewers: integer("unique_viewers").default(0).notNull(), // The number of unique viewers
    watchTimeSeconds: integer("watch_time_seconds").default(0).notNull(), // The watch time in seconds
    avgPercentageWatched: real("avg_percentage_watched").default(0), // The average percentage of the video watched
    createdAt: timestamp("created_at").defaultNow().notNull(), // The timestamp when the stats were created
  },
  (table) => [
    index("stats_dimension_video_date_idx").on(
      table.videoId,
      table.date,
      table.dimension,
    ),
  ],
);

export const streamStats = pgTable(
  "stream_stats",
  {
    id: text("id").primaryKey(), // Unique identifier for the stream stats
    streamId: text("stream_id")
      .notNull()
      .references(() => streams.id, { onDelete: "cascade" }), // The stream associated with the stats
    viewerTimeline: jsonb("viewer_timeline").default([]), // The timeline of viewers
    peakViewers: integer("peak_viewers").default(0), // The peak number of viewers
    avgViewers: integer("avg_viewers").default(0), // The average number of viewers
    totalUniqueViewers: integer("total_unique_viewers").default(0), // The total number of unique viewers
    totalChatMessages: integer("total_chat_messages").default(0), // The total number of chat messages
    eventTimeline: jsonb("event_timeline").default([]), // The timeline of events
    createdAt: timestamp("created_at").defaultNow().notNull(), // The timestamp when the stats were created
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(), // The timestamp when the stats were last updated
  },
  (table) => [index("stream_stats_streamId_idx").on(table.streamId)],
);

export const orgStats = pgTable(
  "org_stats",
  {
    id: text("id").primaryKey(), // Unique identifier for the organization stats
    orgId: text("org_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }), // The organization associated with the stats
    date: timestamp("date").notNull(), // The date of the stats
    totalViews: integer("total_views").default(0).notNull(), // The total number of views
    totalUniqueViewers: integer("total_unique_viewers").default(0).notNull(), // The total number of unique viewers
    totalWatchTimeSeconds: integer("total_watch_time_seconds")
      .default(0)
      .notNull(), // The total watch time in seconds
    videosUploaded: integer("videos_uploaded").default(0), // The number of videos uploaded
    videosPublished: integer("videos_published").default(0), // The number of videos published
    streamsStarted: integer("streams_started").default(0), // The number of streams started
    totalLikes: integer("total_likes").default(0), // The total number of likes
    totalShares: integer("total_shares").default(0), // The total number of shares
    newSubscribers: integer("new_subscribers").default(0), // The number of new subscribers
    estimatedRevenueCents: integer("estimated_revenue_cents").default(0), // The estimated revenue in cents
    createdAt: timestamp("created_at").defaultNow().notNull(), // The timestamp when the stats were created
  },
  (table) => [index("org_stats_orgId_date_idx").on(table.orgId, table.date)],
);

export const channelSubscribers = pgTable(
  "channel_subscriber",
  {
    id: text("id").primaryKey(), // Unique identifier for the channel subscriber
    orgId: text("org_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }), // The organization associated with the subscriber
    userId: text("user_id"), // The ID of the user
    subscriberFingerprint: text("subscriber_fingerprint"), // The fingerprint of the subscriber
    subscribedAt: timestamp("subscribed_at").defaultNow().notNull(), // The timestamp when the user subscribed
    unsubscribedAt: timestamp("unsubscribed_at"), // The timestamp when the user unsubscribed
    isActive: boolean("is_active").default(true).notNull(), // Whether the subscription is active
    sourceVideoId: text("source_video_id").references(() => videos.id), // The video that led to the subscription
    trafficSource: trafficSourceEnum("traffic_source"), // The source of the traffic
  },
  (table) => [
    index("subscriber_orgId_idx").on(table.orgId),
    index("subscriber_active_idx").on(table.orgId, table.isActive),
  ],
);

export const searchQueries = pgTable(
  "search_query",
  {
    id: text("id").primaryKey(), // Unique identifier for the search query
    orgId: text("org_id").references(() => organization.id, {
      onDelete: "cascade",
    }), // The organization associated with the query
    query: text("query").notNull(), // The search query
    resultsCount: integer("results_count").default(0), // The number of results found
    clickedVideoId: text("clicked_video_id").references(() => videos.id), // The video clicked from the results
    clickedPosition: integer("clicked_position"), // The position of the clicked video
    wasSemanticSearch: boolean("was_semantic_search").default(false), // Whether the search was semantic
    clickedTimestamp: integer("clicked_timestamp"), // The timestamp of the clicked video
    createdAt: timestamp("created_at").defaultNow().notNull(), // The timestamp when the query was created
  },
  (table) => [
    index("search_query_orgId_idx").on(table.orgId),
    index("search_query_query_idx").on(table.query),
  ],
);

export const embedStats = pgTable(
  "embed_stats",
  {
    id: text("id").primaryKey(), // Unique identifier for the embed stats
    videoId: text("video_id")
      .notNull()
      .references(() => videos.id, { onDelete: "cascade" }), // The video associated with the stats
    date: timestamp("date").notNull(), // The date of the stats
    embedDomain: text("embed_domain").notNull(), // The domain where the video was embedded
    embedUrl: text("embed_url"), // The URL where the video was embedded
    views: integer("views").default(0).notNull(), // The number of views
    watchTimeSeconds: integer("watch_time_seconds").default(0).notNull(), // The watch time in seconds
    createdAt: timestamp("created_at").defaultNow().notNull(), // The timestamp when the stats were created
  },
  (table) => [
    index("embed_stats_videoId_date_idx").on(table.videoId, table.date),
    index("embed_stats_domain_idx").on(table.embedDomain),
  ],
);

export const realtimeMetrics = pgTable(
  "realtime_metrics",
  {
    id: text("id").primaryKey(), // Unique identifier for the realtime metrics
    entityType: text("entity_type").notNull(), // The type of entity
    entityId: text("entity_id").notNull(), // The ID of the entity
    currentViewers: integer("current_viewers").default(0), // The current number of viewers
    viewsLast5Min: integer("views_last_5_min").default(0), // The number of views in the last 5 minutes
    viewsLastHour: integer("views_last_hour").default(0), // The number of views in the last hour
    updatedAt: timestamp("updated_at").defaultNow().notNull(), // The timestamp when the metrics were last updated
  },
  (table) => [
    index("realtime_entity_idx").on(table.entityType, table.entityId),
  ],
);

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
