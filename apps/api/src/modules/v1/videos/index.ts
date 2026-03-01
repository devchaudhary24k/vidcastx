import { betterAuth } from "@server/auth";
import { Elysia } from "elysia";

import { VideoModel } from "./model";
import { VideoService } from "./service";

/**
 * Controller handling all video-related operations including CRUD
 * and multipart AWS S3/storage uploads.
 */
export const videoController = new Elysia({ prefix: "/videos" })
  .use(betterAuth)
  .guard({ auth: true })

  /**
   * Middleware to ensure the user has an active organization selected.
   * Derives `orgId` for downstream routes.
   */
  .derive(({ session }) => {
    if (!session?.activeOrganizationId) {
      throw new Error("No Organization Found");
    }
    return { orgId: session.activeOrganizationId };
  })

  /**
   * Retrieve a paginated list of all videos belonging to the current organization.
   */
  .get("/", ({ query }) => `Listing page ${query.page}`, {
    query: VideoModel.pagination,
  })

  /**
   * Create a new "Draft" video.
   * Returns a newly created video object containing the ID needed to start uploading.
   */
  .post(
    "/",
    async ({ body, user, orgId }) => {
      const video = await VideoService.createDraft(user.id, orgId, body);
      return { status: "created", data: video };
    },
    { body: VideoModel.create },
  )

  /**
   * Scope for operations on a specific video by its ID.
   */
  .group("/:id", (app) =>
    app
      .guard({ params: VideoModel.params })

      /**
       * Resolves the video by ID and verifies that the current organization owns it.
       * Passes the resolved `video` entity to all downstream routes in this group.
       */
      .resolve(async ({ params, orgId }) => {
        const video = await VideoService.getVideoIfOwner(params.id, orgId);
        if (!video) throw new Error("Video Not Found");
        return { video };
      })

      /**
       * Get complete details (status, playback URL, assets) for the requested video.
       */
      .get("/", ({ video }) => video)

      /**
       * Update video metadata (e.g., Title, Description, Visibility, Schedule).
       */
      .patch(
        "/",
        ({ video, body }) => {
          // TODO: Call Service update method
          return { status: "updated", id: video.id };
        },
        { body: VideoModel.update },
      )

      /**
       * Soft delete the video (moves it to the trash).
       */
      .delete("/", async ({ video }) => {
        // TODO: Call Service softDelete method
        return { status: "deleted", id: video.id };
      })

      /**
       * Restore a previously soft-deleted video from the trash.
       */
      .post("/restore", ({ video }) => `Video ${video.id}`)

      /**
       * Scope for multipart upload operations for the specific video.
       */
      .group("/multipart", (multipartApp) =>
        multipartApp

          /**
           * Initialize a new multipart upload session.
           * Returns an upload ID required for subsequent part uploads.
           */
          .post(
            "/init",
            async ({ video, body }) => {
              return VideoService.initMultipart(video, body.contentType);
            },
            { body: VideoModel.multipartInit },
          )

          /**
           * Generate a presigned URL for uploading a specific chunk/part of the video.
           */
          .get(
            "/sign-part",
            async ({ video, query }) => {
              return VideoService.signPart(
                video.masterAccessUrl!,
                query.uploadId,
                query.partNumber,
              );
            },
            { query: VideoModel.multipartSign },
          )

          /**
           * Finalize the multipart upload after all parts have been successfully uploaded.
           */
          .post(
            "/complete",
            async ({ video, body }) => {
              return VideoService.completeMultipart(
                video,
                body.uploadId,
                body.parts,
              );
            },
            { body: VideoModel.multipartComplete },
          )

          /**
           * Retrieve a list of all successfully uploaded parts for a specific upload session.
           */
          .get(
            "/list-parts",
            async ({ video, query }) => {
              return VideoService.listParts(video, query.uploadId);
            },
            { query: VideoModel.multipartListParts },
          )

          /**
           * Cancel an ongoing multipart upload and discard any uploaded parts.
           */
          .delete(
            "/abort",
            async ({ video, query }) => {
              return VideoService.abortMultipart(video, query.uploadId);
            },
            { query: VideoModel.multipartAbort },
          ),
      ),
  );
