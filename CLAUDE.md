# ŠPROTAI

A daily browser puzzle for the domain **sprot.ai**. Theme: a tin of Baltic
smoked sprats (Lithuanian *šprotai*). Aiming for the Wordle slot — one small
puzzle a day, ~2 minutes, shareable result.

**Read [STATUS.md](STATUS.md) first.** It holds current state, open decisions,
and what's next. Update it before the context window gets cleared.

## Hard constraints

- **`index.html` ships as one self-contained file.** No build step, no
  dependencies, no external network requests. It must run by opening the file.
  This is what lets the whole game be dropped on any static host.
- **Every generated puzzle must be solvable**, with no possibility of a
  player-created dead end. This is a correctness property, not a nice-to-have —
  an unsolvable daily puzzle is seen by everyone at once.
- **The daily puzzle is seeded from the date**, so everyone gets the same one
  with no server involved. Generation must stay deterministic: no `Math.random`
  and no wall-clock reads inside the generator.
- Keep it playable one-handed on a phone. The board should fit above the fold.

## Layout

| Path | What |
|---|---|
| `index.html` | The entire game |
| `tools/verify.mjs` | Solvability + difficulty verifier |
| `.claude/hooks/context-nudge.sh` | Stop hook: says when to `/clear` |
| `.claude/launch.json` | Local preview server config |

## Commands

Verify every puzzle config is solvable (run this after touching the generator):

```bash
node tools/verify.mjs
```

Deeper pass: `node tools/verify.mjs 2000`

Preview locally — use the `sprotai` config via the preview tool, or:

```bash
python3 -m http.server 4173
```

## The generator contract

The pure, DOM-free generator lives between `generator:start` and
`generator:end` markers in `index.html`. `tools/verify.mjs` **extracts that
exact block** and runs it against an independent solver, so the verified code
and the shipped code can't drift. Keep that block DOM-free or verification
breaks.

Puzzles are built in reverse escape order — each fish is placed only where its
path out is already clear — so the placement order is itself a solution.
Placement is biased toward cells that block already-placed fish, which is what
forces a real solving order instead of random clicking. `tightness` in the
verifier output is the share of fish legal on an average turn; lower is more
demanding. Around 0.3 is the current target.

## Notes

- Don't claim the puzzles are "AI-generated" in user-facing copy. Generation is
  deterministic and procedural — that's a feature (instant, free, provable),
  but it isn't an LLM and shouldn't be marketed as one.
- Test gameplay by driving the real DOM handlers rather than clicking pixels;
  browser click coordinates are in screenshot space, not CSS pixels.
