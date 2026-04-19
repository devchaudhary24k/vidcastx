#!/usr/bin/env bash
# PreToolUse hook for Bash.
# Blocks `git rebase` onto or of a shared branch (main, dev, master, develop).
# Mirrors .husky/pre-rebase — but Claude may invoke git directly, bypassing
# the git-hook layer, so this gives Claude-level defense-in-depth.
#
# Rule reference: .claude/rules/git-workflow.md
# Exit 2 blocks; exit 0 allows.

set -euo pipefail

payload="$(cat)"
command="$(printf '%s' "$payload" | grep -oE '"command":\s*"[^"]*"' | head -1 | sed -E 's/.*"command":\s*"(.*)"/\1/')"

[ -z "$command" ] && exit 0

# Only inspect `git rebase ...`.
if ! printf '%s' "$command" | grep -qE '\bgit\s+rebase\b'; then
  exit 0
fi

# Block `git rebase main`, `git rebase origin/main`, `git rebase dev`, etc.
if printf '%s' "$command" | grep -qE '\bgit\s+rebase\b[^|;&]*\b(origin/)?(main|master|dev|develop)\b'; then
  cat <<EOF >&2
BLOCKED by .claude/hooks/block-rebase-shared.sh

Rebase onto / of a shared branch detected:
  $command

Per .claude/rules/git-workflow.md, rebasing against / of main|dev|master|develop
rewrites history others depend on. Use \`git merge origin/<base>\` into your
feature branch instead.

If the user has explicitly asked to rebase (rare, on a purely local topic
branch), have them run the command themselves with the \`!\` prefix.
EOF
  exit 2
fi

# Also block if currently ON a protected branch and doing `git rebase` with no arg
# (rebases the current branch onto its upstream — rewriting shared history).
current_branch="$(git symbolic-ref --short HEAD 2>/dev/null || echo '')"
case "$current_branch" in
  main|master|dev|develop)
    cat <<EOF >&2
BLOCKED by .claude/hooks/block-rebase-shared.sh

Attempted to rebase while checked out on '$current_branch':
  $command

Protected branches should never be rebased. Switch to a feature branch first.
EOF
    exit 2
    ;;
esac

exit 0
