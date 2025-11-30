import { logger } from "@bogeychan/elysia-logger";
import { cors } from "@elysiajs/cors";
import { fromTypes, openapi } from "@elysiajs/openapi";
import { opentelemetry } from "@elysiajs/opentelemetry";
import { Elysia } from "elysia";

import { auth } from "./auth/auth";
import v1Router from "./modules/v1";

const server = new Elysia({
  prefix: "/api",
})
  .use(opentelemetry())
  .use(openapi({ references: fromTypes() }))
  .use(logger())
  .use(
    cors({
      origin: ({ headers }) => {
        const allowedOrigins = [
          "https://vidcastx.daymlabs.com",
          ...(process.env.NODE_ENV === "development"
            ? ["http://localhost:3000", "http://localhost:3001"]
            : []),
        ];
        const origin = headers.get("origin");
        return !origin || allowedOrigins.includes(origin);
      },
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
      credentials: true,
      maxAge: 300,
    }),
  )
  .use(v1Router)
  // Auth Routes
  .all("/auth/*", ({ request }) => {
    return auth.handler(request);
  })

  .listen(3001);

console.log(
  `🦊 API server is running at ${server.server?.hostname}:${server.server?.port}`,
);
