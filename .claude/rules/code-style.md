---
description: Code style and formatting conventions for VidcastX
---

# Code Style

- Avoid deeply nested code — break logic into smaller, named functions
- Opening braces on the same line (K&R style)
- Catch specific error types, not generic `Error` or `catch (e)`
- Always log error messages and stack traces when catching
- Prefer `const` over `let`; avoid `var`
- Use `async/await` over raw Promises
