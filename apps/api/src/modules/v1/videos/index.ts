import { betterAuth } from "@server/auth";
import { Elysia } from "elysia";

import {
  CreateVideoBody,
  CreateVideoResponse,
  ErrorResponse,
  MultipartAbortBody,
  MultipartCompleteBody,
  MultipartInitBody,
  MultipartInitResponse,
  MultipartListPartsQuery,
  MultipartPartsResponse,
  MultipartSignQuery,
  MultipartSignResponse,
  PaginationQuery,
  SuccessResponse,
  UpdateVideoBody,
  VideoIdParam,
  VideoListResponse,
  VideoResponse,
} from "./model";
import { VideoService } from "./service";

/**
 * Handles all operations on a single video (/:id and sub-routes).
 * Resolve is at the top level (not inside a .group() callback) to work
 * around an Elysia v1.4 bug where resolve hooks inside group callbacks
 * are silently skipped at runtime.
 */
const videoItemController = new Elysia({
  prefix: "/:id",
  name: "video-item-controller",
})
  .use(betterAuth)
  .guard({ auth: true, params: VideoIdParam })
  // Re-derive orgId from session (same logic as videoController)
  .resolve(({ session, status }) => {
    if (!session.activeOrganizationId) {
      return status(400, {
        error: "No active organization. Please select an organization first.",
      });
    }
    return { orgId: session.activeOrganizationId };
  })
  // Video ownership middleware at the top level — injects video into context
  .resolve(async ({ params, orgId, status }) => {
    const video = await VideoService.getVideoIfOwner(params.id, orgId);
    if (!video) return status(404, { error: "Video not found" });
    return { video };
  })

  // Get video details
  .get("/", ({ video }) => video, {
    response: { 200: VideoResponse, 404: ErrorResponse },
  })

  // Update metadata
  .patch(
    "/",
    async ({ video, body, orgId }) => {
      await VideoService.updateMetadata(video.id, orgId, body);
      return { status: "updated", videoId: video.id };
    },
    {
      body: UpdateVideoBody,
      response: { 200: SuccessResponse, 400: ErrorResponse, 404: ErrorResponse },
    },
  )

  // Delete video (soft delete)
  .delete(
    "/",
    async ({ video }) => ({
      status: "deleted",
      videoId: video.id,
    }),
    {
      response: { 200: SuccessResponse, 404: ErrorResponse },
    },
  )

  // Restore deleted video
  .post(
    "/restore",
    async ({ video }) => ({
      status: "restored",
      videoId: video.id,
    }),
    {
      response: { 200: SuccessResponse, 404: ErrorResponse },
    },
  )

  // Multipart upload operations
  .group("/multipart", (app) =>
    app
      // Initialize multipart upload
      .post(
        "/init",
        async ({ video, body }) => {
          return await VideoService.initMultipart(video, body.contentType);
        },
        {
          body: MultipartInitBody,
          response: { 200: MultipartInitResponse, 400: ErrorResponse },
        },
      )

      // Get presigned URL for part
      .get(
        "/sign-part",
        async ({ video, query }) => {
          if (!video.masterAccessUrl) throw new Error("Video has no access URL");
          const url = await VideoService.signPart(video.masterAccessUrl, query.uploadId, query.partNumber);
          return { url };
        },
        {
          query: MultipartSignQuery,
          response: { 200: MultipartSignResponse, 400: ErrorResponse },
        },
      )

      // Complete multipart upload
      .post(
        "/complete",
        async ({ video, body }) => {
          await VideoService.completeMultipart(video, body.uploadId, body.parts);
          return { status: "success", videoId: video.id };
        },
        {
          body: MultipartCompleteBody,
          response: { 200: SuccessResponse, 400: ErrorResponse },
        },
      )

      // List uploaded parts
      .get(
        "/list-parts",
        async ({ video, query }) => {
          return await VideoService.listParts(video, query.uploadId);
        },
        {
          query: MultipartListPartsQuery,
          response: { 200: MultipartPartsResponse, 400: ErrorResponse },
        },
      )

      // Abort multipart upload
      .delete(
        "/abort",
        async ({ video, body }) => {
          await VideoService.abortMultipart(video, body.uploadId);
          return { status: "success", videoId: video.id };
        },
        {
          body: MultipartAbortBody,
          response: { 200: SuccessResponse, 400: ErrorResponse },
        },
      ),
  );

/**
 * Video Controller: collection-level routes (/videos, /videos/*)
 * and mounts the item controller for single-video operations.
 */
export const videoController = new Elysia({
  prefix: "/videos",
  name: "video-controller",
})
  .use(betterAuth)
  .guard({ auth: true })
  // Inject orgId — all video routes require an active organization
  .resolve(({ session, status }) => {
    if (!session.activeOrganizationId) {
      return status(400, {
        error: "No active organization. Please select an organization first.",
      });
    }
    return { orgId: session.activeOrganizationId };
  })

  // List videos (paginated)
  .get(
    "/",
    async ({ query, orgId }) => {
      const page = query.page ?? 1;
      const limit = query.limit ?? 10;
      const { videos, total } = await VideoService.listByOrg(orgId, page, limit);
      return { page, limit, total, videos };
    },
    {
      query: PaginationQuery,
      response: { 200: VideoListResponse, 400: ErrorResponse },
    },
  )

  // Create draft video
  .post(
    "/",
    async ({ body, user, orgId, status }) => {
      const video = await VideoService.createDraft(user.id, orgId, body);
      if (!video) return status(500, { error: "Failed to create video" });
      return { status: "created", data: video };
    },
    {
      body: CreateVideoBody,
      response: { 200: CreateVideoResponse, 400: ErrorResponse, 500: ErrorResponse },
    },
  )

  // Single-video operations (mounted as a separate plugin to avoid
  // Elysia v1.4 bug where .resolve() inside .group() callbacks is skipped)
  .use(videoItemController);
