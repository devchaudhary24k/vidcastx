import { betterAuth } from "@server/auth";
import { Elysia } from "elysia";

import {
  CreateVideoBody,
  CreateVideoResponse,
  ErrorResponse,
  MultipartAbortBody,
  MultipartCompleteBody,
  MultipartInitBody,
  MultipartListPartsQuery,
  MultipartSignQuery,
  PaginationQuery,
  SuccessResponse,
  UpdateVideoBody,
  VideoIdParam,
  VideoListResponse,
  VideoResponse,
} from "./model-typebox";
import { VideoService } from "./service";

/**
 * Video Controller: Handles all video-related operations including CRUD
 * and multipart AWS S3/storage uploads.
 *
 * Owns its own auth and org validation so the v1 router
 * can serve non-org routes without forcing org context on all routes.
 */
export const videoController = new Elysia({
  prefix: "/videos",
  name: "video-controller",
})
  .use(betterAuth)
  .guard({ auth: true })
  // Inject orgId — all video routes require an active organization
  .resolve(({ session, status }) => {
    if (!session?.activeOrganizationId) {
      return status(400, {
        error: "No active organization. Please select an organization first.",
      });
    }
    return { orgId: session.activeOrganizationId };
  })

  // List videos (paginated)
  .get(
    "/",
    async ({ query, orgId }) => ({
      page: query.page || 1,
      limit: query.limit || 10,
      total: 0,
      videos: [],
    }),
    {
      query: PaginationQuery,
      response: { 200: VideoListResponse, 400: ErrorResponse },
    },
  )

  // Create draft video
  .post(
    "/",
    async ({ body, user, orgId }) => {
      const video = await VideoService.createDraft(user.id, orgId, body);
      return { status: "created", data: video };
    },
    {
      body: CreateVideoBody,
      response: { 200: CreateVideoResponse, 400: ErrorResponse },
    },
  )

  // Single video operations group
  .group("/:id", (app) =>
    app
      .guard({ params: VideoIdParam })
      // Video ownership middleware — resolves video entity for all routes in this group
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
        async ({ video, body }) => ({
          status: "updated",
          videoId: video.id,
        }),
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
      .group("/multipart", (multipartApp) =>
        multipartApp
          // Initialize multipart upload
          .post(
            "/init",
            async ({ video, body }) => {
              await VideoService.initMultipart(video, body.contentType);
              return { status: "success", videoId: video.id };
            },
            {
              body: MultipartInitBody,
              response: { 200: SuccessResponse, 400: ErrorResponse },
            },
          )

          // Get presigned URL for part
          .get(
            "/sign-part",
            async ({ video, query }) => {
              await VideoService.signPart(video.masterAccessUrl!, query.uploadId, query.partNumber);
              return { status: "success", videoId: video.id };
            },
            {
              query: MultipartSignQuery,
              response: { 200: SuccessResponse, 400: ErrorResponse },
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
              await VideoService.listParts(video, query.uploadId);
              return { status: "success", videoId: video.id };
            },
            {
              query: MultipartListPartsQuery,
              response: { 200: SuccessResponse, 400: ErrorResponse },
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
      ),
  );
