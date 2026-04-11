#!/usr/bin/env bash
# PreToolUse hook for Bash.
# Blocks `git push` to main or dev branches. Force-pushes to any branch are
# also blocked here as a belt-and-suspenders alongside the settings.json deny
# list. Pushes to feature branches (anything other than main/dev) are allowed.
#
# Rule reference: .claude/rules/git-workflow.md
# Exit 2 blocks; exit 0 allows.

set -euo pipefail

payload="$(cat)"
command="$(printf '%s' "$payload" | grep -oE '"command":\s*"[^"]*"' | head -1 | sed -E 's/.*"command":\s*"(.*)"/\1/')"

# Not a git push? Allow.
if ! printf '%s' "$command" | grep -qE '\bgit\s+push\b'; then
  exit 0
fi

# Force push to anything? Block. The settings.json deny list covers --force /
# -f, but this hook gives a clearer message.
if printf '%s' "$command" | grep -qE '\-\-force\b|\-f\b'; then
  cat <<EOF >&2
BLOCKED by .claude/hooks/block-push-protected.sh

Force push detected:
  $command

Force pushing rewrites history and is forbidden by .claude/rules/git-workflow.md
unless the user has explicitly asked for it. If they have, ask them to run the
command themselves with the \`!\` prefix.
EOF
  exit 2
fi

# Push to main or dev? Block.
if printf '%s' "$command" | grep -qE '\bgit\s+push\b.*\b(origin\s+)?(main|master|dev)\b'; then
  cat <<EOF >&2
BLOCKED by .claude/hooks/block-push-protected.sh

Direct push to a protected branch detected:
  $command

main and dev are protected. Push to your own feature branch and open a PR
instead. See .claude/rules/git-workflow.md.
EOF
  exit 2
fi

exit 0
