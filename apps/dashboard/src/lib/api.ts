import { treaty } from "@elysiajs/eden";
import { type App } from "@server/server";

const client = treaty<App>("http://localhost:3000");

export default client;
