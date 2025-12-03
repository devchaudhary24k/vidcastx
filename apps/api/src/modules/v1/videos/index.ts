import { betterAuth } from "@/auth";
import { Elysia } from "elysia";

import { VideoModel } from "./model";

export const videoController = new Elysia({ prefix: "/videos" })
  .use(betterAuth)
  .guard({ auth: true }, (app) =>
    app
      .get("/", ({ query }) => `Listing page ${query.page}`, {
        query: VideoModel.pagination,
      }) // List all videos for the current Organization (with pagination).
      .post("/", ({ body }) => body, {
        body: VideoModel.create,
      }) // Create a new "Draft" video. Returns a videoId to start uploading.
      .guard(
        { params: VideoModel.params },
        (idScope) =>
          idScope
            .get("/:id", ({ params: { id } }) => `Video ${id}`) // Get details (status, playback URL, assets) for one video.
            .patch("/:id", ({ params: { id }, body }) => `Video ${id}`, {
              body: VideoModel.update,
            }) // Update metadata (Title, Description, Visibility, Schedule).
            .delete("/:id", ({ params: { id } }) => `Video ${id}`) // Soft delete a video (moves to trash).
            .post("/:id/restore", ({ params: { id } }) => `Video ${id}`), // Restore a video from trash.
      ),
  );
