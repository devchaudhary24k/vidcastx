import { Elysia } from "elysia";

// Define routes for the user feature
export const userController = new Elysia({ prefix: "/users" })
  .get("/:id", ({ params: { id } }) => `User ${id}`)
  .post("/", ({ body }) => body);
