#!/usr/bin/env bash
# Stop hook: nudge when the conversation has grown big enough that clearing the
# window is worth it.
#
# Estimates context from the transcript's TEXT volume, not its file size —
# screenshots are megabytes on disk but comparatively cheap in tokens, so raw
# bytes overstate usage by ~4x. Strings >20k chars are treated as image blobs
# and excluded.
#
# Fires at ~110k tokens, then again every +25k, so it nudges rather than nags.
set -uo pipefail

INPUT=$(cat)
TRANSCRIPT=$(printf '%s' "$INPUT" | jq -r '.transcript_path // empty' 2>/dev/null)
SESSION=$(printf '%s' "$INPUT" | jq -r '.session_id // "unknown"' 2>/dev/null)
[ -n "$TRANSCRIPT" ] && [ -f "$TRANSCRIPT" ] || exit 0

THRESHOLD=110000
STEP=25000

# Text content can never exceed the file's raw size, so if even raw bytes are
# under the threshold we can skip the full scan. Keeps early turns instant.
RAW=$(wc -c < "$TRANSCRIPT" 2>/dev/null | tr -dc '0-9')
[ "${RAW:-0}" -ge "$(( THRESHOLD * 4 ))" ] || exit 0

CHARS=$(jq -c '[.. | strings] | map(select(length < 20000) | length) | add // 0' \
  "$TRANSCRIPT" 2>/dev/null | awk '{s+=$1} END {print s+0}')
[ -n "$CHARS" ] && [ "$CHARS" -gt 0 ] 2>/dev/null || exit 0

TOKENS=$(( CHARS / 4 ))

STATE="${TMPDIR:-/tmp}/claude-ctx-nudge-${SESSION}"
LAST=0
[ -f "$STATE" ] && LAST=$(cat "$STATE" 2>/dev/null | tr -dc '0-9')
[ -n "$LAST" ] || LAST=0

if [ "$TOKENS" -ge "$THRESHOLD" ] && [ "$TOKENS" -ge "$(( LAST + STEP ))" ]; then
  printf '%s' "$TOKENS" > "$STATE"
  jq -n --arg k "$(( TOKENS / 1000 ))" '{
    systemMessage: ("Context is around \($k)k tokens. Good moment to /clear — "
      + "check STATUS.md is current and the work is committed first. "
      + "A fresh window picks the project back up from CLAUDE.md.")
  }'
fi
exit 0
