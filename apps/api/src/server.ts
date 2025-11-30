import bearer from "@elysiajs/bearer";
import { cors } from "@elysiajs/cors";
import { fromTypes, openapi } from "@elysiajs/openapi";
import { opentelemetry } from "@elysiajs/opentelemetry";
import { Elysia } from "elysia";

import { auth } from "./auth/auth";
import { env } from "./env";
import v1Router from "./modules/v1";

// Initialization
const server = new Elysia()
  .use(opentelemetry())
  .use(
    openapi({
      references: fromTypes(),
    }),
  )
  .use(v1Router)
  .use(bearer())
  .onBeforeHandle({ as: "global" }, ({ bearer, set, status }) => {
    if (!bearer) {
      set.headers["WWW-Authenticate"] =
        `Bearer realm="api", error="invalid_token"`;
      return status(401, "Unauthorized");
    }

    if (bearer !== env.AYYO) {
      set.headers["WWW-Authenticate"] =
        `Bearer realm="api", error="invalid_token", error_description="wrong token"`;
      return status(401, "Invalid Token");
    }
  })
  .use(
    cors({
      origin: ({ headers }) => {
        const allowedOrigins = [
          "https://vidcastx.daymlabs.com",
          ...(process.env.NODE_ENV === "development"
            ? ["http://localhost:3000", "http://localhost:5173"]
            : []),
        ];
        const origin = headers.get("origin");
        return !origin || allowedOrigins.includes(origin);
      },
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
      credentials: true,
      maxAge: 300, // 5 Minutes
    }),
  )
  .mount(auth.handler)
  .listen(3001);

console.log(
  `🦊 API server is running at ${server.server?.hostname}:${server.server?.port}`,
);
