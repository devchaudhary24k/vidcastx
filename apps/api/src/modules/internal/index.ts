import bearer from "@elysiajs/bearer";
import jwt from "@elysiajs/jwt";
import { Elysia } from "elysia";

import { env } from "../../env";
import { VideoService } from "../v1/videos/service";
import { ErrorResponse, InternalModel, TokenResponse, UpdateStatusResponse } from "./model";

interface M2MPayload {
  role: string;
  machine: string;
}

/**
 * Rate limiter for M2M token endpoint (in-memory, per-IP)
 * Limits to 10 requests per minute per IP
 */
class RateLimiter {
  private readonly attempts = new Map<string, number[]>();
  private readonly limit = 10;
  private readonly windowMs = 60_000; // 1 minute

  isAllowed(ip: string): boolean {
    const now = Date.now();

    if (!this.attempts.has(ip)) {
      this.attempts.set(ip, []);
    }

    const timestamps = this.attempts.get(ip)!;
    const recent = timestamps.filter((t) => now - t < this.windowMs);

    if (recent.length >= this.limit) {
      return false;
    }

    recent.push(now);
    this.attempts.set(ip, recent);
    return true;
  }
}

const rateLimiter = new RateLimiter();

// Allowed workers and their shared secrets
const VALID_WORKERS: Record<string, string> = {
  "worker-transcoder": env.TRANSCODER_SECRET,
};

/**
 * Internal Controller: Strictly for inter-service communication (M2M).
 * Isolated from BetterAuth and v1 user routes.
 *
 * Endpoints:
 * - POST /internal/token — OAuth2 Client Credentials (rate-limited)
 * - PATCH /internal/videos/:id/status — Status updates (requires M2M bearer token)
 */
export default new Elysia({
  prefix: "/internal",
  name: "internal-controller",
})
  .use(
    jwt({
      name: "m2mJwt",
      secret: env.JWT_SECRET,
      exp: "1h",
    }),
  )
  .use(bearer())

  // POST /internal/token — OAuth2 Client Credentials exchange
  .post(
    "/token",
    async ({ body, m2mJwt, status, request }) => {
      const clientIp = request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip") ?? "unknown";

      if (!rateLimiter.isAllowed(clientIp)) {
        console.warn(`[M2M] Rate limit exceeded for IP: ${clientIp}`);
        return status(429, { error: "Too many requests. Try again later." });
      }

      const expectedSecret = VALID_WORKERS[body.clientId];

      if (!expectedSecret || body.clientSecret !== expectedSecret) {
        console.warn(`[M2M] Invalid credentials for client: ${body.clientId}`);
        return status(401, { error: "Invalid client credentials" });
      }

      console.log(`[M2M] Granting token to: ${body.clientId}`);

      const token = await m2mJwt.sign({
        role: "internal-worker",
        machine: body.clientId,
      });

      return {
        access_token: token,
        token_type: "Bearer" as const,
        expires_in: 3600,
      };
    },
    {
      body: InternalModel.token,
      response: {
        200: TokenResponse,
        401: ErrorResponse,
        429: ErrorResponse,
      },
    },
  )

  /**
   * Protected scope: requires a valid M2M bearer token.
   * Uses resolve (not beforeHandle) so `machine` is injected into context.
   */
  .resolve(async ({ bearer, m2mJwt, status }) => {
    if (!bearer) {
      return status(401, { error: "Missing bearer token" });
    }

    const raw = await m2mJwt.verify(bearer);
    if (!raw) {
      return status(403, { error: "Invalid or expired token" });
    }

    const payload = raw as unknown as M2MPayload;

    if (payload.role !== "internal-worker") {
      return status(403, { error: "Invalid or expired token" });
    }

    return { machine: payload.machine };
  })

  // PATCH /internal/videos/:id/status
  .patch(
    "/videos/:id/status",
    async ({ params, body, machine }) => {
      console.log(`[M2M] Status update from ${machine} for video ${params.id}`);
      if (body.thumbnailKey || body.previewKey || body.playbackKey) {
        await VideoService.addProcessingAssets(params.id, {
          thumbnailKey: body.thumbnailKey,
          previewKey: body.previewKey,
          playbackKey: body.playbackKey,
        });
      }
      return VideoService.updateProcessingStatus(params.id, body.status, {
        errorReason: body.errorReason,
        duration: body.duration,
        resolution: body.resolution,
      });
    },
    {
      body: InternalModel.updateProcessingStatus,
      response: {
        200: UpdateStatusResponse,
        401: ErrorResponse,
        403: ErrorResponse,
      },
    },
  );
