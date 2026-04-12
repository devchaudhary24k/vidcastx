---
description: Strict TypeScript — no any, no unknown, no type escape hatches
---

# Type Safety

VidcastX aims for **100% type safety**. We chose TanStack Start specifically to get end-to-end typed routing, loaders, and server functions — don't undermine that with escape hatches.

## The rules

- **NEVER** use `any`. ESLint will fail the build via `@typescript-eslint/no-explicit-any`.
- **NEVER** use `unknown` as a lazy fallback. `unknown` is only acceptable at true boundaries (e.g. `JSON.parse`, `catch (err: unknown)`) and must be narrowed immediately with a type guard or schema parse.
- **NEVER** use non-null assertions (`value!`) to silence the compiler. If a value can be nullish, narrow it.
- **NEVER** use `as SomeType` to force a cast. The only acceptable casts are:
  - `as const` for literal narrowing
  - Casts explicitly justified by a narrowing guard the compiler can't see (add a one-line comment explaining why)
- **NEVER** use `@ts-ignore` / `@ts-expect-error` without an inline comment explaining the specific compiler limitation being worked around.
- **NEVER** use `Function`, `Object`, or `{}` as types — these are effectively `any`.

## Do this instead

```ts
// ❌ NO
function process(data: any) { ... }
const result: any = getValue();
const user = data as User;

// ✓ YES — concrete types or generics
function process<T>(data: T) { ... }
function process(data: unknown) {
  const parsed = UserSchema.parse(data); // now typed
}
const result: string | number = getValue();
```

## In TanStack Start

- Let route loaders, `beforeLoad`, and server functions infer their return types — don't manually annotate them with `any`/`unknown`. The router generates a fully typed route tree; trust it.
- Server function inputs should be validated with a Zod/Valibot schema — the parsed output is the typed input, no casting needed.
- When reading route context in a component, use `useRouteContext({ from: "..." })` which returns typed context — don't cast.

## In Elysia handlers

Let Elysia infer context types from schemas instead of manual typing:

```ts
// ❌ NO
.post('/videos', ({ body, params }: { body: any; params: any }) => { ... })

// ✓ YES — inline handler, Elysia infers from schemas
.post('/videos', ({ body, params }) => { ... }, {
  body: CreateVideoSchema,
  params: t.Object({ id: t.String() }),
})
```

## Why we care

- Type safety catches bugs at compile time, not after a prod deploy
- IDE IntelliSense, go-to-definition, and refactors only work with precise types
- `any` and casts rot silently — a renamed field masked by a cast won't blow up until a user hits it
- TanStack Start's value proposition (typed routes, typed loaders, typed server fns) disappears the moment you cast
