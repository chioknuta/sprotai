# Status

_Last updated: 2026-08-10_

## Where things stand

A **v0 is built and works** — `index.html`, playable, verified, mobile-ready.
Daily tin (7×7, 30 fish) seeded from the date, Endless mode in three sizes,
streak counter, star rating, copyable share block.

**But the core loop is too boring, and that's the live problem.** v0 should be
treated as a working prototype that proved out the plumbing, not as the game.

## DECIDED (2026-08-10): rebuild the core loop as OIL LINE

v0's flaw: freeing a fish only ever *helps*, so no move has a downside, order
barely matters, and the board deflates. Ran two Fable ideation passes (one
physical-truth lens, one Wordle-ritual lens, 8 mechanics total) and picked:

### OIL LINE — the spec

- **Side-view** tin (v0 was top-down). Fish packed in rows, submerged in oil.
- Tap a fish whose path **upward** to the surface is clear → it lifts out.
- Its displacement leaves with it: the **oil level drops one notch** per rescue
  (tune: possibly per N cells of fish volume).
- Any fish now poking above the oil line **dries out and locks permanently** —
  visibly stiff/grey. It stays in the tin as an obstacle.
- Goal: save as many fish as possible. Perfect = full tin saved.
- **Score = fish saved / total.** Near-miss ("6/8") drives the run-it-back urge.
- No clock. Nothing moves until you tap. That's the relaxing half.

### Non-negotiables for the build

- Generator must **guarantee a perfect rescue order exists** (verify by search
  over the small discrete state space — extend tools/verify.mjs; keep the
  generator:start/end extraction pattern so shipped code is what's verified).
- The removal→oil-drop causality must be **unmissable**: animate the glug and
  the line ticking down after every rescue, before the drying lock applies.
- Undo-free, but instant "retry today's tin" button.
- Share block: e.g. `🥫 Šprotai #N  🐟🐟🐟🐟🐟🐟💀🐟 7/8` — saved fish in
  rescue order, skulls where fish dried. Positions stay unspoiled.
- Reuse from v0: seeded RNG, daily numbering, streak, stars, share plumbing,
  the sprat SVG (re-orient for side view), tin chrome. The v0 top-down loop
  and its generator get replaced.

### Benched for later (possible second daily on the same site)

**BONES**: rim counts say how many bony fish hide per row/column; eat fish,
bank anytime; biting a bone ends the run. Best pure ritual of the batch but
it's recognisably Voltorb Flip in a tin — fine as a companion game, not the
flagship. Full 8-idea shortlist lives in the 2026-08-10 conversation.

## Done

- Reverse-order generator; solvable by construction
- Cork bias for difficulty (tightness 0.50 → ~0.32)
- `tools/verify.mjs` extracts the shipped generator, checks it independently
- Sprat art with dark tail / pale head so facing reads at thumbnail size
- Daily seeding, streak, stars, emoji share strip
- Verified by real playthrough: bumps, escapes, win panel, share, mobile layout

## Known gaps

- Refreshing mid-puzzle restarts the day's tin (no partial-progress save)
- No sound
- Not deployed anywhere yet

## Decisions on record

- **Keep sprot.ai**, but not for typo traffic — for the word itself. Sunset if
  nothing ships by ~Aug 2027.
- **Single self-contained `index.html`**, no build step.
- **Procedural, not LLM, generation** — and don't market it as AI.
- Dropped an earlier tin-*packing* puzzle idea as too fiddly. (Worth revisiting
  as a *scoring* game rather than an exact-cover puzzle.)
