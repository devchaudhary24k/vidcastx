import { logger } from "@bogeychan/elysia-logger";
import { cors } from "@elysiajs/cors";
import { fromTypes, openapi } from "@elysiajs/openapi";
import { opentelemetry } from "@elysiajs/opentelemetry";
import { serverTiming } from "@elysiajs/server-timing";
import { Elysia } from "elysia";

import { auth } from "@vidcastx/auth";

import { env } from "./env";
import internalController from "./modules/internal";
import { dispatcherCronPlugin } from "./modules/internal/cron";
import v1Router from "./modules/v1";

const apiRouter = new Elysia({ prefix: "/api" }).use(v1Router).use(internalController);

const server = new Elysia({ name: "api-server" })
  .use(opentelemetry())
  .use(openapi({ references: fromTypes() }))
  .use(logger())
  .use(serverTiming()) // Auto-disabled in production
  // .use(
  //   cors({
  //     origin: ({ headers }) => {
  //       const allowedOrigins =
  //         env.NODE_ENV === "production"
  //           ? ["https://vidcastx.daymlabs.com"]
  //           : ["https://vidcastx.daymlabs.com", "http://localhost:3000"];
  //       const origin = headers.get("origin");
  //       return !origin || allowedOrigins.includes(origin);
  //     },
  //     methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS"],
  //     allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  //     credentials: true,
  //     maxAge: 300,
  //   }),
  // )
  // Centralized error handling — registered before routes so it catches all of them
  .onError(({ code, error, status }) => {
    // Schema validation failed (body, query, params, headers)
    if (code === "VALIDATION") {
      const first =
        "all" in error && Array.isArray(error.all) ? (error.all[0] as { message?: string } | undefined) : undefined;
      return status(400, { error: first?.message ?? "Validatiion failed" });
    }

    // Body could not be parsed (malformed JSON, wrong content-type, etc.)
    if (code === "PARSE") {
      return status(400, { error: "Could not parse request body" });
    }

    // No route matched
    if (code === "NOT_FOUND") {
      return status(404, { error: "Endpoint not found" });
    }

    // Anything else is unexpected — log it and return a generic 500
    console.error("[API Error]", code, error);
    return status(500, { error: "Internal server error" });
  })
  .use(apiRouter)
  .use(dispatcherCronPlugin)
  .mount(auth.handler)
  .listen(env.PORT);

console.log(`🦊 API server is running at ${server.server?.hostname}:${server.server?.port}`);

/**
 * Export full server type for Eden Treaty (end-to-end type safety)
 * Use in dashboard: import type { App } from '@api'; const api = treaty<App>(url);
 */
export type App = typeof server;
