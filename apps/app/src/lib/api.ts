import type { App } from "@server/server";
import { treaty } from "@elysiajs/eden";

const client = treaty<App>("http://localhost:4000");

export default client;
