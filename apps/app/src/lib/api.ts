import type { App } from "@server/router";
import { treaty } from "@elysiajs/eden";

const client = treaty<App>("http://localhost:4000");

export default client;
