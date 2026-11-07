#!/usr/bin/env bash
# Fails if user-facing calls contain a literal string with accented characters
# (strong signal of untranslated PT-BR in UI chrome).
set -euo pipefail

# Patterns to flag: Molecules.toast / alert / confirm / prompt with a PT literal.
# Skips the dictionary module itself and test files.
# Uses Python for portable accented-char detection (avoids grep locale/collation issues).
HITS=$(python3 - <<'PY'
import os, re, sys
pat = re.compile(r"(Molecules\.toast|alert|confirm|prompt)\(\s*['\"][^'\"]*[À-ÿ]")
root = 'src'
hits = []
for dirpath, _, files in os.walk(root):
    for fn in files:
        if not fn.endswith('.js'): continue
        path = os.path.join(dirpath, fn)
        if path.endswith('src/i18n.js'): continue
        with open(path, encoding='utf-8', errors='ignore') as f:
            for i, line in enumerate(f, 1):
                if pat.search(line):
                    hits.append(f"{path}:{i}:{line.rstrip()}")
print('\n'.join(hits))
PY
)

if [[ -n "$HITS" ]]; then
  echo "❌ Untranslated PT-BR literal detected in user-facing call:"
  echo "$HITS"
  echo ""
  echo "→ Use I18n.t('key') and add the key to src/i18n.js (both pt-BR and en)."
  exit 1
fi

echo "✅ i18n check passed (no PT literals in user-facing calls)."
