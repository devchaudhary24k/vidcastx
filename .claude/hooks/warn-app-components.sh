#!/usr/bin/env bash
# PreToolUse hook for Write / Edit.
# Warns (does not block) when a new file is being created directly under
# apps/app/src/components/ — that directory is reserved for genuinely global
# components, not feature code.
#
# Rule reference: .claude/rules/features.md, .claude/rules/file-conventions.md
# Exit 0 always — this is a nudge, not a hard block, since legitimate global
# components do exist there (theme-toggle, avatar-uploader, etc.).

set -euo pipefail

payload="$(cat)"
tool_name="$(printf '%s' "$payload" | grep -oE '"tool_name":\s*"[^"]*"' | head -1 | sed -E 's/.*"tool_name":\s*"(.*)"/\1/')"
file_path="$(printf '%s' "$payload" | grep -oE '"file_path":\s*"[^"]*"' | head -1 | sed -E 's/.*"file_path":\s*"(.*)"/\1/')"

if [[ -z "$file_path" ]]; then
  exit 0
fi

# Only nudge for the Write tool (new file). Edits to existing files are fine.
if [[ "$tool_name" != "Write" ]]; then
  exit 0
fi

# Match files DIRECTLY under apps/app/src/components/ (not nested deeper)
if [[ "$file_path" =~ apps/app/src/components/[^/]+\.(ts|tsx)$ ]]; then
  cat <<EOF
[hook: warn-app-components]

You are about to create a new file directly under apps/app/src/components/:
  $file_path

That directory is reserved for genuinely global components (error boundaries,
root layouts, theme primitives). Feature components belong in:
  apps/app/src/features/<feature-name>/components/

If this really is a global, app-wide component, proceed. Otherwise, move it
into the appropriate feature first. See .claude/rules/file-conventions.md.
EOF
fi

exit 0
