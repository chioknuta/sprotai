# ŠPROTAI — agent instructions

**The instructions live in [CLAUDE.md](CLAUDE.md). Read that, then
[STATUS.md](STATUS.md).** Everything in them applies here regardless of which
agent or CLI is reading this file.

This file is deliberately a pointer and not a copy. It *was* a copy — a
near-verbatim duplicate of CLAUDE.md — and the duplication had already gone
wrong in the one place it differed: it rewrote the `.claude/hooks/` paths to
`.Codex/hooks/`, with a capital C that matches no directory in this repo (the
real one is `.codex/`). It also silently went stale, because a second copy of
a 7KB instruction file is a second thing to remember to update, and nobody
does.

The hard constraints are worth repeating here only because getting one wrong
is expensive:

- `index.html` ships as **one self-contained file** — no build step, no
  dependencies, no external network requests. It must run by opening the file.
  (A service worker and the manifest are separate files beside it; the rule is
  that index.html itself fetches nothing.)
- **Every generated puzzle must be solvable**, and every `par` must be a proven
  minimum. Run `node tools/verify.mjs` after touching the generator.
- **Generation is deterministic** — no `Math.random`, no wall-clock reads
  inside the generator block.
- Keep it playable one-handed on a phone, board above the fold.
