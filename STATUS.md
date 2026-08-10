# Status

_Last updated: 2026-08-10_

## Where things stand

A **v0 is built and works** — `index.html`, playable, verified, mobile-ready.
Daily tin (7×7, 30 fish) seeded from the date, Endless mode in three sizes,
streak counter, star rating, copyable share block.

**But the core loop is too boring, and that's the live problem.** v0 should be
treated as a working prototype that proved out the plumbing, not as the game.

## The design problem (open — decide before building more)

Diagnosis: freeing a fish only ever *helps* — it can never block anything. So
there is no tension, no risk, and no consequence to move order. The board also
gets monotonically easier as it empties, so the game deflates instead of
escalating. Wrong clicks are the only cost, which is a weak hook.

Goal: **relaxing but addictive**, and ideally mechanically unique.

Candidate directions are in the conversation; the leading one is a *wake /
slipstream cascade* — an escaping sprat drags along the fish it passes,
recursively, so one tap can chain the whole tin and the game becomes "find the
tap that frees the most" rather than "clear the list".

**Next action: pick a direction, then rebuild the core loop.** Keep the
generator, art, daily seeding, and share plumbing — all of that is reusable.

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
