import { describe, expect, it, mock } from "bun:test";

// Mock DB and storage before importing the controller
mock.module("@vidcastx/database/client", () => ({
  db: {
    update: () => ({
      set: () => ({
        where: () => Promise.resolve(),
      }),
    }),
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

mock.module("@vidcastx/database/schema/video-schema", () => ({
  videos: {
    id: "id",
    status: "status",
    playbackUrl: "playback_url",
    errorReason: "error_reason",
  },
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

// Provide env vars the controller expects
const TEST_JWT_SECRET = "test-jwt-secret-for-testing-only-32chars!";
const TEST_TRANSCODER_SECRET = "test-transcoder-secret";

mock.module("../src/env", () => ({
  env: {
    JWT_SECRET: TEST_JWT_SECRET,
    TRANSCODER_SECRET: TEST_TRANSCODER_SECRET,
    PORT: 3001,
    NODE_ENV: "test",
  },
}));

// Import after mocks
const { default: internalController } = await import("../src/modules/internal");

function req(path: string, init?: RequestInit) {
  return new Request(`http://localhost${path}`, init);
}

function jsonPost(path: string, body: Record<string, unknown>, headers?: Record<string, string>) {
  return req(path, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
}

function jsonPatch(path: string, body: Record<string, unknown>, headers?: Record<string, string>) {
  return req(path, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
}

describe("Internal Controller — M2M Authentication", () => {
  describe("POST /internal/token", () => {
    it("grants token with valid credentials", async () => {
      const res = await internalController.handle(
        jsonPost("/internal/token", {
          clientId: "worker-transcoder",
          clientSecret: TEST_TRANSCODER_SECRET,
        }),
      );

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.access_token).toBeDefined();
      expect(data.token_type).toBe("Bearer");
      expect(data.expires_in).toBe(3600);
    });

    it("rejects invalid client secret", async () => {
      const res = await internalController.handle(
        jsonPost("/internal/token", {
          clientId: "worker-transcoder",
          clientSecret: "wrong-secret",
        }),
      );

      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.error).toBe("Invalid client credentials");
    });

    it("rejects unknown client ID", async () => {
      const res = await internalController.handle(
        jsonPost("/internal/token", {
          clientId: "unknown-worker",
          clientSecret: "some-secret",
        }),
      );

      expect(res.status).toBe(401);
    });

    it("rejects empty credentials", async () => {
      const res = await internalController.handle(
        jsonPost("/internal/token", {
          clientId: "",
          clientSecret: "",
        }),
      );

      // Elysia returns 422 for TypeBox validation failures (minLength: 1)
      expect(res.status).toBe(422);
    });
  });

  describe("PATCH /internal/videos/:id/status", () => {
    async function getValidToken(): Promise<string> {
      const res = await internalController.handle(
        jsonPost("/internal/token", {
          clientId: "worker-transcoder",
          clientSecret: TEST_TRANSCODER_SECRET,
        }),
      );
      const data = await res.json();
      return data.access_token;
    }

    it("updates video status with valid token", async () => {
      const token = await getValidToken();

      const res = await internalController.handle(
        jsonPatch(
          "/internal/videos/vid_test123/status",
          { status: "processing" },
          { Authorization: `Bearer ${token}` },
        ),
      );

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
    });

    it("marks video as ready with playback URL", async () => {
      const token = await getValidToken();

      const res = await internalController.handle(
        jsonPatch(
          "/internal/videos/vid_test123/status",
          {
            status: "ready",
            playbackUrl: "processed/org_123/vid_test123/master.m3u8",
          },
          { Authorization: `Bearer ${token}` },
        ),
      );

      expect(res.status).toBe(200);
    });

    it("marks video as failed with error reason", async () => {
      const token = await getValidToken();

      const res = await internalController.handle(
        jsonPatch(
          "/internal/videos/vid_test123/status",
          {
            status: "failed",
            errorReason: "FFmpeg encoding failed",
          },
          { Authorization: `Bearer ${token}` },
        ),
      );

      expect(res.status).toBe(200);
    });

    it("rejects invalid status value", async () => {
      const token = await getValidToken();

      const res = await internalController.handle(
        jsonPatch(
          "/internal/videos/vid_test123/status",
          { status: "nonexistent" },
          { Authorization: `Bearer ${token}` },
        ),
      );

      // Elysia returns 422 for TypeBox validation failures
      expect(res.status).toBe(422);
    });

    it("rejects request without bearer token", async () => {
      const res = await internalController.handle(
        jsonPatch("/internal/videos/vid_test123/status", { status: "processing" }),
      );

      // Should fail auth — either 401 or 403
      expect(res.status).toBeGreaterThanOrEqual(400);
    });

    it("rejects request with invalid token", async () => {
      const res = await internalController.handle(
        jsonPatch(
          "/internal/videos/vid_test123/status",
          { status: "processing" },
          { Authorization: "Bearer fake-jwt-token" },
        ),
      );

      expect(res.status).toBeGreaterThanOrEqual(400);
    });
  });
});
