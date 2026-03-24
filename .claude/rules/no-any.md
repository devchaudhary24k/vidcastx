---
description: Never use explicit 'any' type - always specify concrete types
---

# No Explicit 'any' Type

- **NEVER** use `any` type in TypeScript code
- Always specify concrete, strict types
- Use generics, unions, or `unknown` if needed
- ESLint will catch and fail builds with `@typescript-eslint/no-explicit-any`

## Examples

```ts
// ❌ NO
function process(data: any) { ... }
const result: any = getValue();

// ✓ YES
function process<T>(data: T) { ... }
function process(data: unknown) { ... }
const result: string | number = getValue();
```

## In Elysia Route Handlers

Let Elysia infer context types instead of manual typing:

```ts
// ❌ NO
.post('/videos', ({ body, params }: { body: any; params: any }) => { ... })

// ✓ YES - inline handler, Elysia infers types
.post('/videos', ({ body, params }) => { ... }, {
  body: CreateVideoSchema,
  params: t.Object({ id: t.String() })
})
```

## Why

- Type safety catches bugs at compile time, not runtime
- IDE IntelliSense only works with specific types
- Breaks when code changes, type `any` masks errors
- Makes refactoring dangerous (no type guidance)
