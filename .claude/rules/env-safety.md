---
description: Environment variable handling, secrets, and .env safety
---

# Environment Variable Safety

## Never touch `.env` files directly

- **Never read, display, echo, `cat`, or log** the contents of `.env`, `.env.local`, `.env.production`, or any file containing real secrets. Not in tool output, not in commit messages, not in PR descriptions, not in chat.
- If you need to know whether an env var is set, check `.env.example` (which must only contain placeholder values) or ask the user.
- **Never commit** `.env*` files containing real values. `.env.example` is the only `.env`-shaped file that belongs in git.
- If you discover a real secret has been committed, stop and tell the user immediately — don't just delete it from the next commit, because it's already in history.

## Every env var must go through `env.ts`

Every app/package that reads env vars must have an `env.ts` that validates them with [`@t3-oss/env-core`](https://env.t3.gg/) + Zod:

```ts
// apps/app/src/env.ts
import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  server: {
    API_URL: z.string().url(),
    AUTH_SECRET: z.string().min(32),
  },
  client: {
    VITE_API_URL: z.string().url(),
  },
  clientPrefix: "VITE_",
  runtimeEnv: import.meta.env,
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
});
```

Rules:

- **Never read `process.env.FOO` directly** in application code. Always `import { env } from "#app/env"` (or the equivalent path) and read `env.FOO`.
- If an `env.ts` doesn't exist in a package/app that needs env vars, **create one** before using any env var.
- Server-only vars go in the `server` block. Client-exposed vars go in `client` and must be prefixed (e.g. `VITE_` for Vite, `NEXT_PUBLIC_` for Next). Never leak a server-only var into the client bundle.
- Every var gets a Zod schema — `z.string().url()`, `z.coerce.number()`, `z.enum([...])`, etc. Not `z.string()` on everything.
- Update `.env.example` whenever you add a new env var so onboarding works.

## Hardcoded values

- **Never hardcode values that should be configurable** — API URLs, secrets, org IDs, feature flags, timeouts, etc.
- If you encounter a hardcoded value that looks config-shaped (URL, token, magic number, path to an external resource), **flag it** to the user and suggest promoting it to an env var.
- Literal constants that are genuinely part of the code (e.g. `MAX_VIDEO_SIZE_BYTES = 5_000_000_000`) belong in a `constants/` file, not `env.ts`. Env vars are for things that differ between environments.

## Runtime

- `env.ts` throws at startup if validation fails — leave that behavior in place. Don't wrap it in a try/catch to "make the app boot anyway." Fail fast.
- `skipValidation` is only for build-time where vars aren't present (e.g. Docker builds). Don't set it in runtime.
