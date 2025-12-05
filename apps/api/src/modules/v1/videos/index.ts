import { betterAuth } from "@server/auth";
import { Elysia } from "elysia";

import { VideoModel } from "./model";
import { VideoService } from "./service";

export const videoController = new Elysia({ prefix: "/videos" })
  .use(betterAuth)
  .guard({ auth: true }, (app) =>
    app
      .get("/", ({ query }) => `Listing page ${query.page}`, {
        query: VideoModel.pagination,
      }) // List all videos for the current Organization (with pagination).
      .post(
        "/",
        async ({ body, user, session }) => {
          if (!session.activeOrganizationId)
            throw new Error("No Organization Found");

          const video = await VideoService.createDraft(
            user.id,
            session.activeOrganizationId,
            body,
          );

          return {
            status: "created",
            data: video,
          };
        },
        {
          body: VideoModel.create,
        },
      ) // Create a new "Draft" video. Returns a videoId to start uploading.
      .guard({ params: VideoModel.params }, (idScope) =>
        idScope
          .resolve(async ({ params, session }) => {
            if (!session.activeOrganizationId)
              throw new Error("No Organization Found");
            const video = await VideoService.getVideoIfOwner(
              params.id,
              session.activeOrganizationId,
            );

            if (!video) throw new Error("Video Found");
            return { video };
          })
          .get("/:id", ({ video }) => video) // Get details (status, playback URL, assets) for one video.
          .patch(
            "/:id",
            ({ video, body }) => {
              // TODO: Call Service update method
              return { status: "updated", id: video.id };
            },
            {
              body: VideoModel.update,
            },
          ) // Update metadata (Title, Description, Visibility, Schedule).
          .delete("/:id", async ({ video }) => {
            // TODO: Call Service softDelete method
            return { status: "deleted", id: video.id };
          }) // Soft delete a video (moves to trash).
          .post("/:id/restore", ({ params: { id } }) => `Video ${id}`) // Restore a video from trash.
          .group("/multipart", (uploadScope) =>
            uploadScope
              .post(
                "/init",
                async ({ video, body }) => {
                  return VideoService.initMultipart(video, body.contentType);
                },
                {
                  body: VideoModel.multipartInit,
                },
              )
              .get(
                "/sign-part",
                async ({ video, query }) => {
                  return VideoService.signPart(
                    video.masterAccessUrl!,
                    query.uploadId,
                    query.partNumber,
                  );
                },
                {
                  query: VideoModel.multipartSign,
                },
              )
              .post(
                "/complete",
                async ({ video, body }) => {
                  return VideoService.completeMultipart(
                    video,
                    body.uploadId,
                    body.parts,
                  );
                },
                {
                  body: VideoModel.multipartComplete,
                },
              ),
          ),
      ),
  );
