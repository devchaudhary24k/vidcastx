import { treaty } from "@elysiajs/eden";
import { describe, expect, it } from "bun:test";
import { Elysia } from "elysia";

import { userController } from "../src/modules/v1/user";

const app = new Elysia({ prefix: "/api/v1" }).use(userController);
const api = treaty(app);

describe("User Controller", () => {
  describe("GET /users/:id", () => {
    it("returns a user by id", async () => {
      const { data, status } = await api.api.v1.users({ id: "usr_abc123" }).get();

      expect(status).toBe(200);
      expect(data?.id).toBe("usr_abc123");
      expect(data?.name).toBe("User usr_abc123");
    });
  });

  describe("POST /users", () => {
    it("creates a user with valid email", async () => {
      const { data, status } = await api.api.v1.users.post({
        email: "new@vidcastx.com",
      });

      expect(status).toBe(200);
      expect(data?.email).toBe("new@vidcastx.com");
    });

    it("rejects invalid email format", async () => {
      const { status } = await api.api.v1.users.post({
        email: "not-an-email",
      });

      expect(status).toBe(422);
    });

    it("rejects missing email", async () => {
      const res = await app.handle(
        new Request("http://localhost/api/v1/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        }),
      );

      expect(res.status).toBe(422);
    });
  });
});
