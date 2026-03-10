import bearer from "@elysiajs/bearer";
import jwt from "@elysiajs/jwt";
import { InternalModel } from "@server/modules/internal/model";
import { VideoModel } from "@server/modules/v1/videos/model";
import { VideoService } from "@server/modules/v1/videos/service";
import { Elysia } from "elysia";

import { env } from "../../env";

// Define our allowed workers and their secure secrets.
const VALID_WORKERS: Record<string, string> = {
  "worker-transcoder": env.TRANSCODER_SECRET,
};

/**
 * Controller strictly for internal microservices (Workers).
 * Completely isolated from BetterAuth and v1 user routes.
 */
const internalController = new Elysia({ prefix: "/internal" })
  // Setup JWT generator (Tokens expire in 1 hour)
  .use(
    jwt({
      name: "m2mJwt",
      secret: env.JWT_SECRET,
      exp: "1h",
    }),
  )
  .use(bearer())

  // The Token Exchange Endpoint (OAuth2 Client Credentials Flow)
  .post(
    "/token",
    async ({ body, m2mJwt, set }) => {
      const expectedSecret = VALID_WORKERS[body.clientId];

      // Validate that the machine exists AND the secret matches
      if (!expectedSecret || body.clientSecret !== expectedSecret) {
        set.status = 401;
        return { error: "Invalid Machine Credentials" };
      }

      console.log(`Granting M2M access token to: ${body.clientId}`);

      const token = await m2mJwt.sign({
        role: "internal-worker",
        machine: body.clientId,
      });

      return {
        access_token: token,
        token_type: "Bearer",
        expires_in: 3600,
      };
    },
    {
      body: InternalModel.token,
    },
  )

  // Protected Routes (Require the Bearer Token we just generated)
  .guard(
    {
      async beforeHandle({ bearer, m2mJwt, set }) {
        if (!bearer) {
          set.status = 401;
          return { error: "Missing bearer token" };
        }

        const payload = await m2mJwt.verify(bearer);
        if (!payload || payload.role !== "internal-worker") {
          set.status = 403;
          return { error: "Invalid or expired machine token" };
        }

        console.log(`Request made by machine: ${payload.machine}`);
      },
    },
    (app) =>
      app.patch(
        "/videos/:id/status",
        ({ params, body }) => {
          return VideoService.updateProcessingStatus(params.id, body.status, {
            playbackUrl: body.playbackUrl,
            errorReason: body.errorReason,
          });
        },
        {
          body: VideoModel.updateProcessingStatus,
        },
      ),
  );

export default internalController;
