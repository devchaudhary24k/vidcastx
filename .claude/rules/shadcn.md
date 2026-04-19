# Shadcn / UI Component Gotchas

Lessons learned overriding or composing components in `packages/ui`. Read before touching a shadcn-derived component or its className.

## tailwind-merge only dedupes classes with the **same variant prefix**

`tailwind-merge` (via `cn`) treats a class and its variant form as **separate rules**. It will _not_ drop `self-stretch` when you pass `self-center`, because the base component's class is `data-vertical:self-stretch` and yours is plain `self-center` — different variant keys.

With both classes on the element, CSS source order decides → base class wins → your override silently does nothing.

**Fix:** match the variant prefix on your override.

```tsx
// Base component has: data-vertical:self-stretch

// ❌ doesn't override — different variant keys
<Separator className="self-center" />

// ✓ overrides — same variant key, tailwind-merge dedupes
<Separator className="data-vertical:self-center" />
```

Same trap applies to responsive prefixes:

```tsx
// DialogContent has: w-full max-w-[calc(100%-2rem)] sm:max-w-sm

// ❌ on ≥640px `sm:max-w-sm` still wins
<CommandDialog className="max-w-2xl" />

// ✓ same sm: key, overrides
<CommandDialog className="sm:max-w-2xl" />
```

**Rule of thumb:** before overriding, grep the base component for the class you're trying to change. Copy the exact variant prefix it uses.

## Dialog width is driven by `max-w`, not `w`

shadcn `DialogContent` is `w-full max-w-[calc(100%-2rem)] sm:max-w-sm`. `w-full` makes it want full width; `max-w-*` caps it. Raising `max-w` widens the dialog; it does **not** change height.

Height is content-driven unless you also set `h-*` / `max-h-*`.

## Never edit files in `packages/ui/src/components/`

`packages/ui` is the shadcn-derived component library. Treat every file there as **vendored upstream code**. If a shadcn/radix/base-ui/cmdk component misbehaves, fix it at the **use site**, not by modifying the library file.

Reasons:

- Upstream changes (shadcn CLI re-adds / user runs `pnpm bump-ui`) will clobber your edit
- Other consumers across the monorepo rely on the stock behavior
- Divergence from shadcn docs makes the code harder for anyone following tutorials

If a fix truly needs to live in `packages/ui` (rare — genuine upstream bug, or project-wide policy change), call it out and get explicit approval first.

### Example: cmdk "undefined.subscribe" error

cmdk subcomponents (`CommandInput`, `CommandList`, `CommandItem`, `CommandGroup`, `CommandEmpty`) all consume a store provided by the `<Command>` root. If you see:

> `can't access property "subscribe", o is undefined`

it means you rendered cmdk subcomponents without a `<Command>` ancestor. Our `CommandDialog` deliberately does **not** wrap its children in `<Command>` (it mirrors a specific shadcn variant). So the fix is at the caller:

```tsx
// ❌ don't edit packages/ui/src/components/command.tsx
// ✓ wrap at the use site
<CommandDialog open={open} onOpenChange={setOpen}>
  <Command>
    <CommandInput ... />
    <CommandList> ... </CommandList>
  </Command>
</CommandDialog>
```

Per the shadcn docs the expected composition is:

```
Command
├── CommandInput
└── CommandList
    ├── CommandEmpty
    ├── CommandGroup ...
    └── CommandGroup ...
```

## Never wrap a `CommandItem` in a router `<Link>`

cmdk uses `CommandItem` to drive keyboard selection, fuzzy matching, and the `onSelect` event. Wrapping it in `<Link>` breaks selection highlighting and onSelect semantics, and sometimes swallows matches.

**Fix:** use `onSelect` with `useNavigate()` from TanStack Router.

```tsx
const navigate = useNavigate();

// ❌ wrapping Item in Link breaks cmdk
<Link to={item.url}>
  <CommandItem>{item.title}</CommandItem>
</Link>

// ✓ onSelect drives navigation
<CommandItem
  value={item.title}
  onSelect={() => {
    setOpen(false);
    void navigate({ to: item.url });
  }}
>
  {item.title}
</CommandItem>;
```

## Base-UI `useRender` / `render` prop

Several components in `packages/ui` (e.g. `BreadcrumbLink`, `SidebarMenuButton`, `DialogTrigger`) use base-ui's `useRender` and accept a `render` prop instead of `asChild`. Pass an element:

```tsx
<BreadcrumbLink render={<Link to="/dashboard" />}>Dashboard</BreadcrumbLink>
<SidebarMenuButton render={<Link to={item.url} />}>...</SidebarMenuButton>
```

This is not the same as Radix's `asChild` pattern. If you're unsure which a component expects, read its source — don't guess.

## General debugging flow when an override "does nothing"

1. Inspect the rendered element in devtools. Look at the actual `class` attribute.
2. Find both the class you added and the class you expected to override.
3. If both are present, it's a tailwind-merge variant-prefix mismatch — fix with matching prefix.
4. If only the base class is present, your className isn't being forwarded — check the component's prop spreading.
5. If only your class is present but the style is wrong, the issue is elsewhere (specificity from an ancestor selector, CSS layer ordering, or `!important` on another rule).
