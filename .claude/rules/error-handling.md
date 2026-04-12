---
description: How to catch, log, and surface errors
---

# Error Handling

Errors that are silently swallowed are worse than crashes — they rot the product from the inside. Every `catch` block must do something meaningful.

## The core rules

- **Never swallow errors.** Empty `catch {}` and `catch (e) {}` without any handling are forbidden.
- **Catch the narrowest type you can.** Prefer specific error classes (e.g. `HTTPError`, `ZodError`, `DrizzleQueryError`) over generic `Error` or untyped `catch`.
- **Always log what happened.** When catching, log at minimum the error message AND stack trace. Use a structured logger if the app has one; otherwise `console.error(err)` with the full error object (not `err.message` alone).
- **Always propagate or handle deliberately.** Either:
  - Recover (fallback value, retry, user-facing error message), OR
  - Re-throw, OR
  - Return a typed error result (see `try-catch.ts`)

  Pick one on purpose — don't catch just to prevent a crash.

## Shape of a good catch

```ts
try {
  await uploadVideo(file);
} catch (error) {
  if (error instanceof UploadAbortedError) {
    toast.info("Upload cancelled");
    return;
  }
  if (error instanceof NetworkError) {
    console.error("upload failed: network", error);
    toast.error("Upload failed — check your connection");
    return;
  }
  console.error("upload failed: unexpected", error);
  throw error; // genuinely unknown → let it bubble to an error boundary / reporter
}
```

Things this does right: specific types, user-facing feedback where appropriate, logged with context, unknown errors re-thrown instead of silently eaten.

## Result-style error handling

The app has `apps/app/src/utils/try-catch.ts`, which returns `[data, null] | [null, error]`. Use it for sequential operations where you want linear control flow instead of nested try/catch:

```ts
const [user, err] = await tryCatch(getUser(id));
if (err) {
  console.error("failed to load user", err);
  return null;
}
// user is typed and non-null here
```

This is preferred for "expected" failures (network fetches, missing rows). Reserve `try/catch` for boundaries where you explicitly want to handle multiple exception types.

## Boundaries

- **At UI boundaries** (routes, forms, mutations): catch, log, show the user something useful. Don't let a raw stack trace reach them.
- **At server function / API boundaries**: validate inputs with Zod first (so bad input is never an "exception" — it's a typed validation failure). Map caught errors to proper HTTP status codes. See `api.md` for Elysia conventions.
- **At module boundaries**: prefer returning typed errors over throwing. Throwing is for truly unexpected states.
- **At top-level / unhandled**: TanStack Router has `errorComponent`, Elysia has `onError`. Wire these up — don't leave them as the framework default.

## Never

- ❌ `catch (e) {}` — empty body
- ❌ `catch (e) { /* ignore */ }` — a comment is not handling
- ❌ `catch (e) { console.log(e.message) }` — lost the stack, and `console.log` is not an error channel
- ❌ `catch (e) { return null }` — you just told the caller "everything's fine" when it wasn't
- ❌ `catch (e: any)` — use `unknown` and narrow, or catch a specific class
- ❌ Catching purely to satisfy a linter or "defensive programming" instinct. If the code doesn't throw, don't catch it.

## Logging

- Log the **full error object**, not `err.message`. Stack traces are load-bearing during incident response.
- Include context: what were you doing? which entity? which user/org? But **never log secrets or PII** (tokens, passwords, full request bodies).
- In production the API uses OpenTelemetry — errors logged at boundaries will be captured automatically. Make sure the log happens.
