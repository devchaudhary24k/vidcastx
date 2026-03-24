import { t } from "elysia";

/**
 * Response schemas for Internal (M2M) API
 * Exported to controller for proper type inference
 */
export const TokenResponse = t.Object({
  access_token: t.String(),
  token_type: t.Literal("Bearer"),
  expires_in: t.Numeric(),
});

export const ErrorResponse = t.Object({
  error: t.String(),
});

export const UpdateStatusResponse = t.Object({
  success: t.Boolean(),
});

/**
 * Internal (M2M) API request schemas using TypeBox
 * For machine-to-machine authentication and video status updates
 */
export const InternalModel = {
  // OAuth2 Client Credentials request
  token: t.Object({
    clientId: t.String({ minLength: 1 }),
    clientSecret: t.String({ minLength: 1 }),
  }),

  // Video status update request
  updateProcessingStatus: t.Object({
    status: t.Union([t.Literal("processing"), t.Literal("ready"), t.Literal("failed")]),
    playbackUrl: t.Optional(t.String({ format: "uri" })),
    errorReason: t.Optional(t.String()),
  }),
};
