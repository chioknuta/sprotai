# Status

_Last updated: 2026-08-10 (afternoon — OIL LINE built)_

## Where things stand

**OIL LINE is built and is the game now.** `index.html` was rewritten around
the side-view tin: tap a sprat with a clear path up, it lifts out, the oil
drops by the sprat's own volume, and anything left poking above the line dries
out and locks. Score is saved/total, instant retry, best-of-day share block,
streak and stars carried over from v0. The v0 top-down loop is gone.

Verified: `node tools/verify.mjs 2000` — 8,000 boards across all four configs,
every one has a perfect rescue order (exhaustive independent search, not the
generator's own logic). Played in the real DOM: perfect run, botched run with
drying cascade + stranding, retry, best-of-day, storage.

An adversarial review pass (10 agents: logic, math, UX finders + independent
verification of each claim) confirmed 7 issues, all fixed same day: stale
animation timers leaking into a rebuilt board after instant Retry (the big
one — could corrupt the daily record), midnight rollover misattributing a
run to the wrong day's record, missing aria-live/star semantics for screen
readers, undersized Retry/size buttons, stale streak flame. The math finder
tried and failed to refute the minimum-headroom proof and the greedy-policy
claim by brute force — both held.

## How the build works (decisions made 2026-08-10, PM)

- **Units.** Integer half-cells. A length-L fish has volume 2L; a full row of
  a `cols`-wide tin holds 2·cols units; oil starts H units above row 0. Fish
  are length 2–4, packed into full rows (compositions of `cols`).
- **Solvable by construction.** The witness order — rows top-down, shortest
  fish first within a row — is provably the most oil-efficient order (the
  mechanic maps to single-machine scheduling with start-deadlines; blockers
  always have strictly earlier deadlines, so Jackson's rule applies). The
  generator computes the minimum headroom that order needs and ships
  H = minimum + slack. The witness itself is the proof a perfect clear exists.
- **Slack is the difficulty dial.** Daily/medium slack 1: digs are always
  fatal and the longest fish of a (2,2,3)-type row must go last. Small slack
  2 (forgiving), large slack 0 (any wrong within-row order kills).
- **Board selection.** 16 candidate packings per day, scored by "traps" —
  states along the ideal line where a legal-but-fatal tap exists — so the
  daily punishes casual clicking. Difficulty stats from the verifier:
  deepest-first player saves ~33%, random tapping ~47%.
- Verifier stats: `digger`/`random` = saved fraction under those policies;
  `greedyGap` should stay 0; `maxNodes` = fish count means zero backtracking.

## CONFIRMED FLAW: the loop is solved by a fixed rule

Measured, not suspected: the static rule **"topmost row first, shortest fish
first within the row"** clears **100%** of generated boards (200-board harness
run, 7×5). Jackson's rule ties it at 100%. Random tapping gets 1%, so the rule
isn't free to find — but it is one sentence long, and once found the daily is
execution, not thought. Aiste hit it on day one: _"all you have to do is tap
the smaller fishes first and you'll be fine."_

**Why, structurally:** fish escape upward and exposure also comes from above,
so the fish blocking you is always the fish that dries first. Precedence and
urgency are aligned, and any such design has a provably optimal fixed priority
order. This is a theorem about the mechanic, not a difficulty setting — no
amount of generator tuning fixes it. Escape requires either (A) **dynamic
deadlines** (choices change who is in danger) or (B) **precedence crossing
deadlines** (the fish in your way is sometimes safer than you).

## Mechanic spike, 2026-08-10 PM: 4 candidates built and audited

Harness in scratchpad (`harness.mjs` / `baseline.mjs` / `run.mjs`): generates
boards, verifies a perfect line exists, then throws a battery of dumb static
rules at them. **Headline metric = share of boards the best static rule clears
perfectly.** Baseline scores 1.00. Target was <0.35. Each candidate was then
handed to a skeptic whose sole job was to find a better dumb rule.

| candidate | builder claimed | skeptic found | verdict |
|---|---|---|---|
| **SETTLING** (fish sink into gaps) | 0.175 | **0.761** | dead |
| **TILT** (tin rocks toward the heavy side) | 0.148 | **0.517** | dead |
| **SURFACE GRAB** (liftable only near the line) | 0.133 | **0.407** | weak |
| **THE MOUTH** (escape via a rolled-lid opening) | 0.208 | **0.254** | only survivor |

**SETTLING IS VACUOUS — this kills the fix previously recorded here.** Under
"lift straight up needs a clear shaft", nothing can ever sink. Proof: a fish
`g` sinks only once every fish beneath and overlapping its span is gone; but
any such fish is directly under `g`, so `g` blocks its upward path. Nothing
under `g` can leave while `g` is there, so `g` never moves. Verified
empirically too — with settling bolted on, the harness reproduces baseline
digit for digit (density 0.6478, maxNodes 19). Settling only becomes live if
fish stop leaving vertically, which is a different game, and once repaired
that way the rule _"save the fat sprats for last; else take a row's last
sprat; else take the smallest"_ clears 76%.

**Why the others died — the useful pattern.** TILT is the sharpest lesson: a
plain left-to-right sweep is *self-protecting*, because clearing one end makes
it light, the tin rocks the other way, and the oil rolls over exactly the fish
you haven't reached. The physics rewarded the dumbest possible rule. In every
case the crack was a feature the harness battery couldn't express — "last fish
in its row", "furthest from the row centre" — which is the real lesson: a
static-rule battery only disproves the rules it contains.

**THE MOUTH survived but is marginal**: 0.254 only *with* trappiest-of-8 board
selection (~70 solver calls per board); 0.351 without it, and 0.343 at an arch
shallow enough to actually draw. A search-free "pressure" heuristic hits 0.498.

## The open decision: ordering puzzle vs. deduction puzzle

Four for four, mechanics that keep the **fully-visible ordering-puzzle frame**
got cracked by rules a person finds by feel. That looks structural: these
boards are small, visible and monotone, and monotone systems have greedy
optima. Pushing harder buys depth only by demanding lookahead, which is
homework, not delight.

The untested alternative is to change genre: **the oil is opaque.** You can
only read the band near the surface, so draining is how you *see* — and
draining is also what kills. Information versus safety, straight out of the
physical truth of the material. The structural argument for it: a static rule
must read board features to work, so if the load-bearing features are hidden,
**no static rule can be optimal by construction** — exactly the property this
whole spike failed to find in full-information designs. It is also the genre
the daily-puzzle slot actually rewards (Wordle, Minesweeper, Voltorb Flip).

Cost: hidden information admits *luck*, which collides with the no-dead-ends
constraint. Resolution if we go this way: generate boards that are guaranteed
**deducible** — solvable with no guessing, the way no-guess Minesweeper boards
are — so the guarantee becomes "never need to gamble" rather than "never get
stuck". That is a harder generator, and it is the thing to prototype next.

## Known gaps

- Refreshing mid-puzzle restarts the run (board is identical; best-of-day
  survives — only the in-progress attempt is lost)
- No sound
- Not deployed anywhere yet
- Mobile fold-fit verified in an emulated 375px viewport, not yet on a
  physical phone

## Decisions on record

- **Keep sprot.ai**, but not for typo traffic — for the word itself. Sunset if
  nothing ships by ~Aug 2027.
- **Single self-contained `index.html`**, no build step.
- **Procedural, not LLM, generation** — and don't market it as AI.
- Benched: **BONES** (Voltorb-Flip-in-a-tin) as a possible companion daily;
  the 2026-08-10 morning conversation has the full 8-idea shortlist. Worth
  re-reading in light of the spike above — it was benched for being derivative,
  but the *principle* it carries (deduction under hidden information) is the
  thing the spike says is missing, and that principle is not owned by Voltorb.
- **Retired:** "settling as the fix on the shelf" — proven vacuous, see above.
  Do not re-propose it without also changing how fish leave the tin.
- Dropped an earlier tin-*packing* puzzle idea as too fiddly.
