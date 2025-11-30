import { Elysia } from "elysia";

import { userController } from "./user";

const v1Router = new Elysia({
  prefix: "/v1",
}).use(userController);

export default v1Router;
