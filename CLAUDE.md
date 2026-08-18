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
| `oil-line.html` | Retired prototype, kept for reference (see STATUS.md) |
| `tools/verify.mjs` | Solvability + par verifier |
| `.claude/hooks/context-nudge.sh` | Stop hook: says when to `/clear` |
| `.claude/launch.json` | Local preview server config |

## Commands

Verify every tin is solvable and every par is honest (run after touching the
generator — and if the change was meant to be a refactor, also diff the boards
it emits against the previous revision's, because a daily that quietly changes
changes it for everybody):

```bash
node tools/verify.mjs
```

Deeper pass: `node tools/verify.mjs 400`

Preview locally — use the `sprotai` config via the preview tool, or:

```bash
python3 -m http.server 4173
```

## The game

A 6×6 tin packed with sprats. Each sprat is 2–3 cells long and slides along its
own lane, both ways; it can't turn. One little pink sprat has to reach the gap
in the rim. Rush Hour, in a tin. Tins are numbered and endless.

## The generator contract

The pure, DOM-free generator lives between `generator:start` and
`generator:end` markers in `index.html`. `tools/verify.mjs` **extracts that
exact block** and runs it against an independent solver, so the verified code
and the shipped code can't drift. Keep that block DOM-free or verification
breaks. Keep `generator:start` on its own closed comment line, or extraction
produces a syntax error.

`makeBoard` and `minSlides` are **two-line drivers over the generator
functions** `climbBoard` and `solveSteps`, which yield so the page can pack a
tin across frames instead of freezing. Keep it that way: a yield must never be
able to change the result, and anything that consumes the rng or accepts a
board has to sit in the same order regardless of where control is handed back.

Tin *N* is seeded from *N* alone, so everyone gets the same tin *N*. Sprats are
scattered, then the board is solved exhaustively; a tin only ships once a
solution is proven, and its `par` is that proven minimum. Random scattering
almost never produces a hard tin (70% of random boards are par ≤3), so the
generator **hill-climbs**: it mutates one sprat at a time and keeps changes
that raise par, restarting when it plateaus. The climb budget is counted in
**solver calls, never milliseconds**, so a tin is identical on a fast laptop
and a slow phone.

Two traps, both of which have already bitten:

- **Occupancy must stay a two-word bitmask.** JS shifts modulo 32, so on a
  36-cell board `1 << 35` is `1 << 3` and the bottom of the tin aliases onto
  the top. A single word silently corrupted par on 259 of the first 300 tins.
- **A cached tin is not a tin until it has been re-solved.** Finished tins are
  kept in localStorage, which is user-editable. Reading one back costs a single
  solver call against thousands to climb it, so `decodeTin` re-proves par and
  throws the row away unless it matches exactly. Never shortcut that.
- **The verifier's solver must not share code with the generator's.** The bug
  above survived a "zero mismatches" test that checked the solver against
  itself. `verify.mjs` uses a plain 2D grid and no bitmasks for this reason.

## Notes

- Don't claim the puzzles are "AI-generated" in user-facing copy. Generation is
  deterministic and procedural — that's a feature (instant, free, provable),
  but it isn't an LLM and shouldn't be marketed as one.
- Test gameplay by driving the real DOM handlers rather than clicking pixels;
  browser click coordinates are in screenshot space, not CSS pixels.
