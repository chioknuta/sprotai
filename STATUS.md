# Status

_Last updated: 2026-08-10_

## Where things stand

**The game is now a sliding puzzle: a tin of sprats, and one little pink one
who has to get out.** `index.html` is the whole thing. Sprats are 2–3 cells
long, slide along their own lane both ways, and can't turn — Rush Hour, in a
tin. Tins are numbered, endless, and generated deterministically from the tin
number, so tin #12 is the same tin for everyone.

Every tin is solved exhaustively before it ships, so it is provably winnable
and its **par is a proven minimum**, not a designer's guess. `node
tools/verify.mjs` re-checks this with a solver that shares no code with the
generator.

Feel: every move, the little one blows a bubble with a soft rising *bloop*.
When she gets out, the tin holds still for a beat, every other sprat turns its
**pupils** to watch her, she gathers herself backwards and darts out at full
size, and the oil closes over the gap while the tin rings. Sound is
synthesised in-page; there are no assets.

## Deployed

GitHub Pages, from the `chioknuta/sprotai` repo. `sprot.ai` is not pointed at
it yet — that needs DNS records in Spaceship.

---

# Retired prototype: OIL LINE

Kept because the analysis below is what led to the current game.

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
