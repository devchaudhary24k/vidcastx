import { betterAuth } from "@server/auth";
import { Elysia } from "elysia";

export const userController = new Elysia({ prefix: "/users" })
  .use(betterAuth)
  .get("/:id", ({ params: { id } }) => `User ${id}`, { auth: false })
  .post("/", ({ body }) => body);
