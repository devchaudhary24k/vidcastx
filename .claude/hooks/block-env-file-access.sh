#!/usr/bin/env bash
# PreToolUse hook for Read / Write / Edit.
# Blocks reading or writing `.env*` files. Explicit exemption: `.env.example`
# is always allowed (it's the placeholder committed to git).
#
# Rule reference: .claude/rules/env-safety.md
# Exit 2 blocks; exit 0 allows.

set -euo pipefail

payload="$(cat)"
tool_name="$(printf '%s' "$payload" | grep -oE '"tool_name":\s*"[^"]*"' | head -1 | sed -E 's/.*"tool_name":\s*"(.*)"/\1/')"
file_path="$(printf '%s' "$payload" | grep -oE '"file_path":\s*"[^"]*"' | head -1 | sed -E 's/.*"file_path":\s*"(.*)"/\1/')"

[ -z "$file_path" ] && exit 0

# Only care about files whose basename starts with `.env`.
base="$(basename "$file_path")"
[[ "$base" == .env* ]] || exit 0

# `.env.example` is the shared placeholder — always allowed.
[ "$base" = ".env.example" ] && exit 0

# Block everything else.
action="read"
case "$tool_name" in
  Write|Edit|NotebookEdit) action="write" ;;
esac

cat <<EOF >&2
BLOCKED by .claude/hooks/block-env-file-access.sh

Attempted to $action an env file:
  $file_path

Env files may contain real secrets. Per .claude/rules/env-safety.md:
  • Never read/display/log the contents of .env / .env.local / .env.<stage>
  • Never write to them directly — update .env.example to document new keys,
    and ask the user to put the real value in their local .env

If you genuinely need env values at runtime, source them in a subshell
instead of displaying them (see the bash-side hook for allowed patterns).
EOF

exit 2
