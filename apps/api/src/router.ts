// src/router.ts
import { Elysia } from "elysia";

import internalController from "./modules/internal";
import v1Router from "./modules/v1";

// 1. Define the pure router
export const apiRouter = new Elysia({ prefix: "/api" }).use(v1Router).use(internalController);

// 2. Export the type for Eden Treaty
export type App = typeof apiRouter;
