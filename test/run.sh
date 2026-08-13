#!/usr/bin/env bash
# Every suite, one command. Exits non-zero if anything fails.
#   npm install jsdom
#   bash test/run.sh
set -u
cd "$(dirname "$0")/.."
total=0; bad=0
for t in doors bench audio catalogue finale hidden sealed; do
  printf '\n=== %s ===\n' "$t"
  if node "test/$t.test.js"; then :; else bad=$((bad+1)); fi
  n=$(node "test/$t.test.js" 2>/dev/null | grep -oE '^[0-9]+ passed' | grep -oE '^[0-9]+')
  total=$((total + ${n:-0}))
done
printf '\n---------------------------------\n'
if [ "$bad" -eq 0 ]; then
  printf '%s tests passing across 7 suites\n' "$total"
else
  printf '%s suite(s) FAILED\n' "$bad"
fi
exit "$bad"
