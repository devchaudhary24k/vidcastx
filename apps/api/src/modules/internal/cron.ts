import { cron } from "@elysiajs/cron";
import { tryCatch } from "@server/utils/try-catch";
import Elysia from "elysia";

import { dispatchFairly } from "./dispatcher";

export const dispatcherCronPlugin = new Elysia().use(
  cron({
    name: "fairness-dispatcher",
    pattern: "*/5 * * * * *",
    async run() {
      const [, err] = await tryCatch(dispatchFairly());
      if (err) console.error("[CRON ERROR] Failed to execute dispatcher interval:", err);
    },
  }),
);
