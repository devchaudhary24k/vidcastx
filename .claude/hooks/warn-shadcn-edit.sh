#!/usr/bin/env bash
# PreToolUse hook for Write / Edit.
# Nudge (non-blocking) when editing vendored shadcn components. Upstream code
# gets overwritten by `pnpm bump-ui` — fixes belong at the use site.
#
# Rule reference: .claude/rules/shadcn.md
# Exit 0 always — this is a warning, not a block.

set -euo pipefail

payload="$(cat)"
file_path="$(printf '%s' "$payload" | grep -oE '"file_path":\s*"[^"]*"' | head -1 | sed -E 's/.*"file_path":\s*"(.*)"/\1/')"

[ -z "$file_path" ] && exit 0

if [[ "$file_path" == *"packages/ui/src/components/"* ]]; then
  cat <<EOF
[hook: warn-shadcn-edit]

You are editing a vendored shadcn component:
  $file_path

Per .claude/rules/shadcn.md this directory is upstream code. Your edit will
be clobbered the next time someone runs \`pnpm bump-ui\`.

Prefer to fix the issue at the use site (componentProps, className override,
wrapper component). If the change truly must live here — genuine upstream
bug or project-wide policy — confirm with the user first.
EOF
fi

exit 0
