import { betterAuth } from "@server/auth";
import { Elysia } from "elysia";

import {
  BrowseQuery,
  BrowseResponse,
  CreateFolderBody,
  DeleteResponse,
  ErrorResponse,
  FolderDetail,
  FolderIdParam,
  UpdateFolderBody,
} from "./model";
import { FolderService } from "./service";

const folderItemController = new Elysia({
  prefix: "/:id",
  name: "folder-item-controller",
})
  .use(betterAuth)
  .guard({ auth: true, params: FolderIdParam })
  .resolve(({ session, status }) => {
    if (!session.activeOrganizationId) {
      return status(400, { error: "No active organization. Please select an organization first." });
    }
    return { orgId: session.activeOrganizationId };
  })
  .resolve(async ({ params, orgId, status }) => {
    const folder = await FolderService.getByIdIfOwner(params.id, orgId);
    if (!folder) return status(404, { error: "Folder not found" });
    return { folder };
  })

  .get("/", ({ folder }) => folder, {
    response: { 200: FolderDetail, 404: ErrorResponse },
  })

  .patch(
    "/",
    async ({ folder, body, orgId, status }) => {
      try {
        const updated = await FolderService.update(folder.id, orgId, body);
        if (!updated) return status(404, { error: "Folder not found" });
        return updated;
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to update folder";
        return status(400, { error: message });
      }
    },
    {
      body: UpdateFolderBody,
      response: { 200: FolderDetail, 400: ErrorResponse, 404: ErrorResponse },
    },
  )

  .delete(
    "/",
    async ({ folder, orgId, status }) => {
      const ok = await FolderService.delete(folder.id, orgId);
      if (!ok) return status(404, { error: "Folder not found" });
      return { status: "deleted" as const, folderId: folder.id };
    },
    {
      response: { 200: DeleteResponse, 404: ErrorResponse },
    },
  );

export const folderController = new Elysia({
  prefix: "/folders",
  name: "folder-controller",
})
  .use(betterAuth)
  .guard({ auth: true })
  .resolve(({ session, status }) => {
    if (!session.activeOrganizationId) {
      return status(400, { error: "No active organization. Please select an organization first." });
    }
    return { orgId: session.activeOrganizationId };
  })

  .get(
    "/browse",
    async ({ query, orgId }) => {
      const parentId = query.parentId ?? null;
      return await FolderService.browse(orgId, parentId);
    },
    {
      query: BrowseQuery,
      response: { 200: BrowseResponse, 400: ErrorResponse },
    },
  )

  .post(
    "/",
    async ({ body, user, orgId, status }) => {
      try {
        return await FolderService.create(orgId, user.id, body);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to create folder";
        return status(400, { error: message });
      }
    },
    {
      body: CreateFolderBody,
      response: { 200: FolderDetail, 400: ErrorResponse },
    },
  )

  .use(folderItemController);
