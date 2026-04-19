## Summary

<!-- What does this PR do and why? Keep it under 3 sentences; reviewers should understand intent before reading the diff. -->

## Related

<!-- Link issues / discussions. `Closes #123` auto-closes on merge. -->

Closes #

## Type of change

<!-- Pick one. Multiple = split into separate PRs. -->

- [ ] `feat` — new capability
- [ ] `fix` — bug fix
- [ ] `refactor` — no behavior change
- [ ] `perf` — performance improvement
- [ ] `docs` / `chore` / `ci` / `test` / `style` / `build` / `revert`

## Scope

<!-- Which apps/packages are touched? -->

- [ ] `apps/api`
- [ ] `apps/app`
- [ ] `workers/transcoder`
- [ ] `packages/*`
- [ ] `tooling/*` / `.github/` / `.husky/` / `.claude/`

## Checklist

- [ ] Branch started from a fresh `dev` and is up to date with `dev`
- [ ] `pnpm check-types` passes
- [ ] `pnpm lint` passes with **zero warnings**
- [ ] `pnpm format` clean
- [ ] Relevant tests added / updated; `pnpm test` green
- [ ] No `any`, no non-null assertions, no `@ts-ignore` without a comment
- [ ] No `process.env.*` outside `env.ts`; no backend packages imported from `apps/app`
- [ ] Errors logged with message + stack; no swallowed catches
- [ ] No secrets, no `.env` file edited (except `.env.example`)
- [ ] Response shapes use `t.Pick` / `t.Omit` — never raw `createSelectSchema(table)`

### If schema changed

- [ ] Ran `pnpm run db:migrate -- --name="<snake_case>"`
- [ ] Generated migration staged **in this commit**
- [ ] Migration is idempotent + reversible where possible

### If UI changed

- [ ] Tested in the browser (golden path + edge cases)
- [ ] No new files under `apps/app/src/components/` (feature code belongs in `features/<name>/`)
- [ ] Did not edit `packages/ui/src/components/**` (vendored shadcn)

## Screenshots / recordings

<!-- For UI changes. -->

## Migration / rollout notes

<!-- Breaking changes? Feature flag? Config additions? One-line summary per item. -->

## Notes for reviewers

<!-- Anything you want flagged first, known unknowns, tradeoffs taken. -->
