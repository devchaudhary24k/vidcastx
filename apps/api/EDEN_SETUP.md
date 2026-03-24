# Eden Treaty Setup for End-to-End Type Safety

This API exports its type signature for use with [Eden Treaty](https://elysiajs.com/eden/overview), enabling fully type-safe API calls from the dashboard (and other clients).

## In the Dashboard

```typescript
// apps/dashboard/src/utils/api-client.ts
import type { App } from "@server/src/server"; // Import API type
import { treaty } from "@elysiajs/eden";

const api = treaty<App>(process.env.NEXT_PUBLIC_API_URL);

// Now fully typed API calls:
const { data, error, status } = await api.api.v1.videos.get();
const { data: video } = await api.api.v1.videos({ id: "vid_123" }).get();
const { data: created } = await api.api.v1.videos.post({
  title: "My Video",
  filename: "video.mp4",
});
```

## Benefits

- **Full type safety**: No runtime type checks, TypeScript catches errors at compile time
- **IntelliSense**: Auto-complete for all routes and their parameters/responses
- **Automatic**: Routes defined in the API are immediately available in the dashboard
- **Validation**: Response types are validated at runtime by the API's Elysia validators

## How It Works

1. Server exports `export type App = typeof server` from `server.ts`
2. Dashboard imports `App` type
3. Eden Treaty creates a type-safe RPC client for the exported API type
4. All route parameters, request bodies, and response types are fully typed

## Limitations

- Only works with TypeScript projects
- Requires the API to be running (at least for development)
- Update dashboard imports if API type signature changes
