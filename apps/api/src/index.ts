import { logger } from "@bogeychan/elysia-logger";
import { cors } from "@elysiajs/cors";
import { fromTypes, openapi } from "@elysiajs/openapi";
import { opentelemetry } from "@elysiajs/opentelemetry";
import { serverTiming } from "@elysiajs/server-timing";
import { Elysia } from "elysia";

import { auth } from "./auth/server";
import { env } from "./env";
import { dispatcherCronPlugin } from "./modules/internal/cron";
import { apiRouter } from "./router";

const server = new Elysia({ name: "api-server" })
  .use(opentelemetry())
  .use(openapi({ references: fromTypes() }))
  .use(logger())
  .use(serverTiming()) // Auto-disabled in production
  .use(
    cors({
      origin: ({ headers }) => {
        const origin = headers.get("origin");
        if (!origin) return true;
        if (env.NODE_ENV !== "production") return true;
        return ["https://vidcastx.daymlabs.com"].includes(origin);
      },
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
      credentials: true,
      maxAge: 300,
    }),
  )
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
