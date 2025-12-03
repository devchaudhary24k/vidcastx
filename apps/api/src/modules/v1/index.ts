import { Elysia } from "elysia";

import { userController } from "./user";
import { videoController } from "./videos";

const v1Router = new Elysia({
  prefix: "/v1",
})
  .use(userController)
  .use(videoController);

export default v1Router;
