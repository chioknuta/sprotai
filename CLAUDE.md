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
| `tools/design-lab/` | Where the art lives and is checked — see its README |
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

## The skin contract

Four looks ship — `classic`, `deco`, `neon`, `plush` — in the `skins:start` /
`skins:end` block. **That block is the source of truth for the art**;
`tools/design-lab` reads it back out of index.html the same way `verify.mjs`
reads the generator, so the gallery cannot drift. Do not edit
`design-lab/designs/*.js` to change a shipped look — edit the game.

A skin is `{ name, blurb, swatch, css, sprat(len, hero), door(g) }` and is pure
presentation: it sits below `generator:end` and cannot reach the generator, the
solver or par. Keep it that way — everyone must play the same daily whichever
look they pick.

Four rules that are load-bearing rather than stylistic:

- **`<g class="eye">` around every pupil.** `gaze()` translates it so all the
  other sprats turn to watch her leave — the most-loved detail in the game.
  `gaze` on the skin tunes the distance in user units (default 5), because the
  skins draw different eyes.
- **Skin CSS must never give `.fish` padding, border, margin or a transform.**
  `onUp()` splits tap direction on `getBoundingClientRect()`, so that would
  change how the game reads a tap.
- **Set `--bub-tint` if the oil is not honey.** The per-move bubble is oil with
  a light in it; hardcoded honey reads as grit on a dark brine.
- **The door has a budget: 60px right of the oil, 24px above, 24px below.**
  `layout()` centres the tin and there is no more room; `html{overflow-x:clip}`
  means an overrun is silently amputated rather than scrolled, which is how
  deco's key shipped sliced in half. Above and below is where the date line and
  the Moves row sit. Enforced by `design-lab/fit/door-budget.mjs`; the
  acceptance test is `design-lab/fit/ship-check.mjs`.

`applySkin()` deliberately does not call `build()` — `build()` clears an escape
in flight (so a win would never show its panel), resets `done`, hides the win
panel and re-reads a save that is already deleted. And the stored skin name is
validated against `SKIN_IDS`, never used: localStorage is user-editable, and
`SKINS[junk].sprat` throws inside `build()` before any board draws.

## Notes

- Don't claim the puzzles are "AI-generated" in user-facing copy. Generation is
  deterministic and procedural — that's a feature (instant, free, provable),
  but it isn't an LLM and shouldn't be marketed as one.
- Test gameplay by driving the real DOM handlers rather than clicking pixels;
  browser click coordinates are in screenshot space, not CSS pixels.
