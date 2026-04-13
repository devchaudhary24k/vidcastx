---
description: Never leak internal/secret fields to API consumers
---

# Response Hygiene

What the API returns is the API's contract with every consumer — the frontend, third parties, leaked logs, scraped responses. **Default to hiding. Add fields explicitly when they are needed.**

## The core rule

> A response should contain **only what the consumer needs to do its job** — never the full database row.

DB tables routinely contain fields that are **internal-only**:

- Storage keys (`masterAccessUrl`, `s3Key`) — leaks bucket layout, lets clients build their own download paths
- Internal IDs / foreign keys with no client meaning
- `metadata` / `params` / `config` JSONB blobs — often hold debug info, transcoder logs, internal flags
- Audit / soft-delete columns (`deletedAt`, `deletedBy`) where the consumer doesn't need them
- Hashed secrets, refresh tokens, m2m client secrets — **never** in any response
- Server-side state: `lastLoginIp`, `internalNotes`, `processingErrorStack`

If a column is on the table but not load-bearing for the client, **it does not belong in the response**.

## How to enforce in code

In Elysia + TypeBox, **never return raw `createSelectSchema(table)`** as the response schema. Always wrap it:

```ts
// ❌ NO — exposes every column, including internals
const _videoSelect = createSelectSchema(videos);
export const VideoResponse = _videoSelect;

// ✓ YES — explicit allowlist via Pick (preferred — fail closed)
export const VideoResponse = t.Pick(_videoSelect, ["id", "title", "status", "visibility", "createdAt"]);

// ✓ YES — explicit denylist via Omit (acceptable when the table is mostly safe)
export const VideoResponse = t.Omit(_videoSelect, [
  "masterAccessUrl", // S3 key — internal only
  "metadata", // jsonb blob — may contain debug data
]);
```

**Prefer `t.Pick` (allowlist) over `t.Omit` (denylist).** Allowlists fail closed: a new sensitive column added to the table is invisible to the client until you explicitly add it. Denylists fail open: forget to add a new column to the omit list and it leaks.

Use `t.Omit` only when the table is small and well-known and you're confident new columns will get reviewed for safety.

## Layering derived fields

Composite the public shape from two pieces:

```ts
export const VideoResponse = t.Composite([
  t.Omit(_videoSelect, ["masterAccessUrl", "metadata"]),
  t.Object({
    thumbnailUrl: t.Optional(t.Nullable(t.String())), // derived from assets
    playbackUrl: t.Optional(t.Nullable(t.String())), // signed, not a column
  }),
]);
```

- DB-shape fields stay autoderived from Drizzle — they never drift
- Derived fields (signed URLs, joined data) layer on top explicitly

## Other places this rule applies

This is not just about Elysia route schemas. Apply the same principle anywhere data crosses a trust boundary:

- **Server functions (`createServerFn`)** — return only what the route needs, not the raw API response if it's wider
- **TanStack Router `loader` data** — same; loader data is shipped to the client in HTML
- **WebSocket / SSE messages** — same
- **Logs / OTel spans** — never log full request bodies, full DB rows, or anything that could contain secrets / PII
- **Error messages** — never echo raw stack traces or internal field names back to the client. Return a generic message; log the detail server-side.

## Things never to put in any response

- Password hashes, password reset tokens, OAuth refresh tokens, M2M client secrets
- Webhook signing secrets
- Internal feature flags or experiment buckets the client shouldn't know about
- Raw stack traces or DB error strings
- Other tenants' data (always filter by `orgId` before returning)
- Anything you wouldn't want screenshotted in a public bug report

## Checklist before merging a new endpoint

- [ ] Response schema uses `t.Pick` or `t.Omit` — never raw `createSelectSchema`
- [ ] Every field in the response has a justification ("the client needs this for X")
- [ ] No storage keys, no internal IDs, no JSONB blobs unless explicitly needed
- [ ] Soft-delete / audit columns omitted unless the client UI uses them
- [ ] Errors return a generic message; details only in server logs

## Why this matters

A leaked storage key gives an attacker the bucket structure — start of a recon chain. A leaked `metadata` blob can carry transcoder error strings that reveal the internal pipeline, or worse, paths/credentials. A leaked `lastLoginIp` is a privacy violation. Once a field is in the response, **clients will start depending on it**, and removing it becomes a breaking change. Hide first, expose deliberately.
