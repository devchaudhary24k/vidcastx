import { describe, expect, it, mock } from "bun:test";

import { mockVideo } from "./helpers/mock-video";

// Mock external dependencies before importing controllers
mock.module("@vidcastx/database/client", () => ({
  db: {
    insert: () => ({
      values: () => ({
        returning: () => [mockVideo],
      }),
    }),
    update: () => ({
      set: () => ({
        where: () => Promise.resolve(),
      }),
    }),
    query: {
      videos: {
        findFirst: () => Promise.resolve(mockVideo),
      },
    },
  },
}));

// Mock drizzle-orm operators — needed because VideoService imports from both
// @vidcastx/database and drizzle-orm depending on the module resolution path
const drizzleStubs = {
  eq: (a: unknown, b: unknown) => ({ a, b }),
  and: (...args: unknown[]) => args,
  asc: (col: unknown) => col,
  inArray: (col: unknown, vals: unknown[]) => ({ col, vals }),
};

mock.module("@vidcastx/database", () => ({
  ...drizzleStubs,
  alias: () => ({}),
  sql: {},
}));

mock.module("drizzle-orm", () => drizzleStubs);

mock.module("drizzle-orm/sql", () => ({
  sql: {},
}));

mock.module("drizzle-orm/pg-core", () => ({
  alias: () => ({}),
}));

mock.module("@vidcastx/storage", () => ({
  initMultipartUpload: () => Promise.resolve("mock-upload-id"),
  signMultipartPart: () => Promise.resolve("https://s3.example.com/signed-url"),
  completeMultipartUpload: () => Promise.resolve(),
  listParts: () => Promise.resolve([{ PartNumber: 1, ETag: "abc", Size: 1024 }]),
  abortMultipartUpload: () => Promise.resolve(),
}));

mock.module("@vidcastx/database/utils/id", () => ({
  generateId: (prefix: string) => `${prefix}_testgenerated123`,
}));

mock.module("@vidcastx/database/schema/video-schema", () => ({
  videos: {
    id: "id",
    orgId: "org_id",
    status: "status",
    masterAccessUrl: "master_access_url",
    $inferSelect: {} as typeof mockVideo,
  },
}));

// Mock drizzle-typebox to avoid deep drizzle-orm internals (getTableColumns etc.)
mock.module("drizzle-typebox", () => {
  const { t } = require("elysia");
  return {
    createSelectSchema: () =>
      t.Object({
        id: t.String(),
        orgId: t.String(),
        uploaderId: t.String(),
        folderId: t.Nullable(t.String()),
        title: t.String(),
        description: t.Nullable(t.String()),
        visibility: t.String(),
        scheduledAt: t.Nullable(t.String()),
        publishedAt: t.Nullable(t.String()),
        status: t.String(),
        errorReason: t.Nullable(t.String()),
        duration: t.Nullable(t.Number()),
        resolution: t.Nullable(t.String()),
        aspectRatio: t.Nullable(t.String()),
        frameCount: t.Nullable(t.Number()),
        masterAccessUrl: t.Nullable(t.String()),
        playbackUrl: t.Nullable(t.String()),
        metadata: t.Any(),
        createdAt: t.Any(),
        updatedAt: t.Any(),
        trashedAt: t.Nullable(t.String()),
        fileSize: t.Nullable(t.Number()),
      }),
  };
});

// Import AFTER mocks are set up
const { Elysia } = await import("elysia");
const { mockAuth, mockAuthNoOrg } = await import("./helpers/mock-auth");
const { VideoService } = await import("../src/modules/v1/videos/service");
const {
  CreateVideoBody,
  CreateVideoResponse,
  ErrorResponse,
  MultipartInitBody,
  MultipartInitResponse,
  PaginationQuery,
  SuccessResponse,
  VideoIdParam,
  VideoListResponse,
} = await import("../src/modules/v1/videos/model");

// ---- Helpers ----

/** Build a testable video controller with mocked auth */
function createVideoApp(authPlugin = mockAuth()) {
  return new Elysia({ prefix: "/api/v1/videos", name: "test-video-controller" })
    .use(authPlugin)
    .guard({ auth: true })
    .resolve(({ session, error }) => {
      if (!session?.activeOrganizationId) {
        return error(400, { error: "No active organization. Please select an organization first." });
      }
      return { orgId: session.activeOrganizationId };
    })
    .get(
      "/",
      async ({ query }) => ({
        page: query.page || 1,
        limit: query.limit || 10,
        total: 0,
        videos: [],
      }),
      { query: PaginationQuery, response: { 200: VideoListResponse, 400: ErrorResponse } },
    )
    .post(
      "/",
      async ({ body, user, orgId, status }) => {
        const video = await VideoService.createDraft(user.id, orgId, body);
        if (!video) return status(500, { error: "Failed to create video" });
        return { status: "created" as const, data: video };
      },
      { body: CreateVideoBody, response: { 200: CreateVideoResponse, 400: ErrorResponse, 500: ErrorResponse } },
    );
}

/** Build a testable video item controller with mocked auth */
function createVideoItemApp(authPlugin = mockAuth()) {
  return new Elysia({ prefix: "/api/v1/videos/:id", name: "test-video-item-controller" })
    .use(authPlugin)
    .guard({ auth: true, params: VideoIdParam })
    .resolve(({ session, error }) => {
      if (!session?.activeOrganizationId) {
        return error(400, { error: "No active organization." });
      }
      return { orgId: session.activeOrganizationId };
    })
    .resolve(async ({ params, orgId, error }) => {
      const video = await VideoService.getVideoIfOwner(params.id, orgId);
      if (!video) return error(404, { error: "Video not found" });
      return { video };
    })
    .post(
      "/multipart/init",
      async ({ video, body }) => {
        return await VideoService.initMultipart(video, body.contentType);
      },
      { body: MultipartInitBody, response: { 200: MultipartInitResponse, 400: ErrorResponse } },
    );
}

function req(path: string, init?: RequestInit) {
  return new Request(`http://localhost${path}`, init);
}

function jsonPost(path: string, body: Record<string, unknown>) {
  return req(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

// ---- Tests ----

describe("Video Controller — collection routes", () => {
  describe("GET /api/v1/videos", () => {
    it("returns paginated list", async () => {
      const app = createVideoApp();
      const res = await app.handle(req("/api/v1/videos"));

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.page).toBe(1);
      expect(data.limit).toBe(10);
      expect(data.videos).toEqual([]);
    });

    it("accepts page and limit query params", async () => {
      const app = createVideoApp();
      const res = await app.handle(req("/api/v1/videos?page=2&limit=5"));

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.page).toBe(2);
      expect(data.limit).toBe(5);
    });
  });

  describe("POST /api/v1/videos", () => {
    it("creates a draft video", async () => {
      const app = createVideoApp();
      const res = await app.handle(
        jsonPost("/api/v1/videos", {
          filename: "test.mp4",
          contentType: "video/mp4",
          title: "My Test Video",
        }),
      );

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.status).toBe("created");
      expect(data.data.id).toBeDefined();
    });

    it("rejects non-video content type", async () => {
      const app = createVideoApp();
      const res = await app.handle(
        jsonPost("/api/v1/videos", {
          filename: "test.txt",
          contentType: "text/plain",
        }),
      );

      // Elysia returns 422 for TypeBox validation failures
      expect(res.status).toBe(422);
    });

    it("rejects missing filename", async () => {
      const app = createVideoApp();
      const res = await app.handle(jsonPost("/api/v1/videos", { contentType: "video/mp4" }));

      // Elysia returns 422 for TypeBox validation failures
      expect(res.status).toBe(422);
    });
  });
});

describe("Video Item Controller — single video routes", () => {
  describe("POST /api/v1/videos/:id/multipart/init", () => {
    it("initializes multipart upload for owned video", async () => {
      const app = createVideoItemApp();
      const res = await app.handle(
        jsonPost("/api/v1/videos/vid_testmockvideo123/multipart/init", {
          contentType: "video/mp4",
        }),
      );

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.uploadId).toBe("mock-upload-id");
      expect(data.key).toBe("raw/org_testorg123/vid_testmockvideo123.mp4");
    });

    it("rejects invalid video ID format", async () => {
      const app = createVideoItemApp();
      const res = await app.handle(
        jsonPost("/api/v1/videos/invalid-id/multipart/init", {
          contentType: "video/mp4",
        }),
      );

      // Elysia returns 422 for TypeBox validation failures
      expect(res.status).toBe(422);
    });

    it("rejects non-video content type", async () => {
      const app = createVideoItemApp();
      const res = await app.handle(
        jsonPost("/api/v1/videos/vid_testmockvideo123/multipart/init", {
          contentType: "image/png",
        }),
      );

      // Elysia returns 422 for TypeBox validation failures
      expect(res.status).toBe(422);
    });
  });
});
