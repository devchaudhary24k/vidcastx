import { Elysia, t } from "elysia";

/**
 * User Controller: User-related endpoints (stub implementation)
 * Uses method chaining for proper type inference.
 */
export const userController = new Elysia({
  prefix: "/users",
  name: "user-controller",
})
  // Get user by ID (public, no auth required)
  .get(
    "/:id",
    ({ params }) => ({
      id: params.id,
      name: `User ${params.id}`,
    }),
    {
      params: t.Object({ id: t.String() }),
      response: {
        200: t.Object({ id: t.String(), name: t.String() }),
      },
      auth: false,
    },
  )

  // Create user
  .post("/", async ({ body }) => body, {
    body: t.Object({ email: t.String({ format: "email" }) }),
    response: {
      200: t.Object({ email: t.String() }),
    },
  });
