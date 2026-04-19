#!/usr/bin/env bash
# PreToolUse hook for Bash.
# Blocks Bash commands that read / display `.env*` contents.
# Allows the narrow case where env is SOURCED (values loaded into shell vars
# but never echoed) so downstream commands can use them.
#
# Rule reference: .claude/rules/env-safety.md
# Exit 2 blocks; exit 0 allows.
#
# Allowed patterns (illustrative — not exhaustive):
#   source .env
#   . ./.env
#   set -a; source .env; set +a                  # autoexport form
#   export $(grep -v '^#' .env | xargs)          # filtered autoexport
#   anything referencing ONLY .env.example
#
# Blocked patterns:
#   cat .env               head/tail/less/more/bat .env
#   grep X .env            (may print value to stdout)
#   awk/sed on .env        (may print values)
#   echo $(cat .env) ...
#   anything that pipes .env into a display channel

set -euo pipefail

payload="$(cat)"
command="$(printf '%s' "$payload" | grep -oE '"command":\s*"[^"]*"' | head -1 | sed -E 's/.*"command":\s*"(.*)"/\1/')"

[ -z "$command" ] && exit 0

# Does command reference any non-example .env file?
#   matches: .env, .env.local, .env.production, etc.
#   does NOT match: .env.example (handled by the negation below)
if ! printf '%s' "$command" | grep -qE '(^|[^a-zA-Z0-9_.-])\.env(\.[a-zA-Z_-]+)?\b'; then
  exit 0
fi

# If the ONLY env ref in the command is .env.example, allow.
# Strip .env.example occurrences and re-check.
stripped="$(printf '%s' "$command" | sed -E 's/\.env\.example//g')"
if ! printf '%s' "$stripped" | grep -qE '(^|[^a-zA-Z0-9_.-])\.env(\.[a-zA-Z_-]+)?\b'; then
  exit 0
fi

# Allow source / dot-source patterns.
#   source .env           . .env
#   source ./.env         . ./.env
#   source ../.env        (etc)
# Optionally prefixed with `set -a;` and optionally suffixed with `; set +a`.
if printf '%s' "$command" | grep -qE '(^|[;&|]|\bset\s+-a\s*;)\s*(source|\.)\s+[^;|&]*\.env(\.[a-zA-Z_-]+)?(\s|$|;)'; then
  exit 0
fi

# Allow `export $(grep ... .env | xargs)` style — values go to exported vars,
# never to stdout. Fragile but covers the common deployment snippet.
if printf '%s' "$command" | grep -qE '\bexport\s+\$\(\s*grep\s+[^)]*\.env(\.[a-zA-Z_-]+)?[^)]*\|\s*xargs\s*\)'; then
  exit 0
fi

# Otherwise: block.
cat <<EOF >&2
BLOCKED by .claude/hooks/block-env-bash.sh

Command touches a real env file in a way that could reveal secrets:
  $command

Allowed patterns (env loaded into shell vars, never echoed):
  source .env                                          # plain source
  . ./.env                                             # dot-source
  set -a; source .env; set +a                          # autoexport form
  export \$(grep -v '^#' .env | xargs)                  # filtered autoexport

Then USE the vars without printing them:
  curl -H "Authorization: Bearer \$API_TOKEN" ...
  psql "\$DATABASE_URL" -c "..."

Blocked: cat / head / tail / less / more / bat / grep / awk / sed on .env,
any pipe that lands env content on stdout, echo \$SECRET, etc.

.env.example is always allowed.
EOF

exit 2
