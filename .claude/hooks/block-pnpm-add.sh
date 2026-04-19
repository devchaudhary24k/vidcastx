#!/usr/bin/env bash
# PreToolUse hook for Bash. Blocks `pnpm add`, `pnpm install <pkg>`, `pnpm i <pkg>`
# unless the user has explicitly approved the install in this session.
#
# Rule reference: .claude/rules/dependencies.md — never install without permission.
# Reads a JSON tool_use payload from stdin; exit code 2 blocks, 0 allows.

set -euo pipefail

payload="$(cat)"
command="$(printf '%s' "$payload" | grep -oE '"command":\s*"[^"]*"' | head -1 | sed -E 's/.*"command":\s*"(.*)"/\1/')"

# Allow patterns that are NOT installs:
#   - pnpm install (no package args) is ok — refreshes lockfile
#   - pnpm add inside a script context (rare; the rule is "ask first" so we still block)
if printf '%s' "$command" | grep -qE '\bpnpm\s+(add|install\s+\S|i\s+\S)\b'; then
  cat <<EOF >&2
BLOCKED by .claude/hooks/block-pnpm-add.sh

This command would install a new dependency:
  $command

The dependencies.md rule requires explicit user approval before any install.
Stop, ask the user, and only proceed once they confirm.

If the user has already approved this install in the current turn, you can:
  - have them paste the command themselves with \`!\` prefix, OR
  - re-issue the command and the user will be prompted to allow it
EOF
  exit 2
fi

exit 0
