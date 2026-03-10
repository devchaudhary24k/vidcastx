import type { App } from "@server/server";
import { treaty } from "@elysiajs/eden";

const client = treaty<App>("http://localhost:3000");

export default client;
