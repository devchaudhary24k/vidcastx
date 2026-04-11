#!/usr/bin/env bash
# PostToolUse hook for Edit / Write / NotebookEdit.
# When a file under packages/database/src/schema/ is modified, prints a reminder
# to run the migration workflow before committing.
#
# Rule reference: .claude/rules/database.md, .claude/rules/git-workflow.md
# Exit 0 always — this is a non-blocking nudge, not an enforcement gate.

set -euo pipefail

payload="$(cat)"
file_path="$(printf '%s' "$payload" | grep -oE '"file_path":\s*"[^"]*"' | head -1 | sed -E 's/.*"file_path":\s*"(.*)"/\1/')"

if [[ -z "$file_path" ]]; then
  exit 0
fi

if [[ "$file_path" == *"packages/database/src/schema/"* ]]; then
  cat <<EOF
[hook: schema-migration-reminder]

You just modified a Drizzle schema file:
  $file_path

Before you commit, run the migration workflow:
  pnpm run db:migrate -- --name="<descriptive_snake_case_name>"

Or invoke the migration-runner agent / \`/migrate <name>\` slash command.
The schema change and the generated SQL must be staged together.
EOF
fi

exit 0
