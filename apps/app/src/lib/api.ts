import type { App } from "@server/router";
import { treaty } from "@elysiajs/eden";
import { env } from "#app/env";

const client = treaty<App>(env.VITE_API_URL);

export default client;
