import { Elysia } from "elysia";

import { folderController } from "./folders";
import { userController } from "./user";
import { videoController } from "./videos";

/**
 * V1 Router: Groups all v1 routes under /v1 prefix.
 * Auth and org validation are handled per-controller,
 * since not all routes require an active organization.
 */
const v1Router = new Elysia({
  prefix: "/v1",
  name: "v1-router",
})
  .use(userController)
  .use(videoController)
  .use(folderController);

export default v1Router;
