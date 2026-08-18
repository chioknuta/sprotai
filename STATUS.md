# Status

_Last updated: 2026-08-18_

## LIVE at https://sprot.ai

Deployed on GitHub Pages from `chioknuta/sprotai` (public). HTTPS on, HTTP
redirects to it. **Deploying is just `git push`** — Pages builds from `main`.

DNS: sprot.ai sits on Cloudflare (nameservers `meadow`/`patryk.ns.cloudflare.com`,
switched at Spaceship on 2026-08-10). Four A records to GitHub Pages plus a
`www` CNAME, all **DNS-only on purpose** — Cloudflare's orange-cloud proxy
blocks GitHub's certificate issuance. The Google MX record is preserved; the
domain never had SPF/DKIM/DMARC. `CNAME` in the repo root is what tells Pages
the domain, and it must survive any restructure.

Two gotchas already paid for: GitHub stalled issuing the certificate and only
retried after the custom domain was **removed and re-added**; and auto-renew
on sprot.ai is **off**, expiring 2027-11-20.

## Two modes

- **Today's tin** — one daily puzzle seeded from the local date, same for
  everyone, fixed band (par 10–18, median 10) that deliberately never
  escalates. Sharing is score-only; it must never leak the board or the par.
- **All tins** — the endless numbered ladder, par climbing 3 → 27ish.

A half-played tin survives a refresh, saved **per board**, so a daily and a
ladder tin can both be mid-solve. Saves are untrusted input: `replay()`
recomputes `from` rather than reading it, revalidates after every move, and
throws the whole save away on anything odd.

## Streaks, stats, and the share grid (2026-08-17)

The retention pass, all client-side — no backend, no accounts, no new network
requests.

- **The day record** (`sprotai.slide.days`) is one row per finished daily:
  moves *and the par they were measured against*. Par is **stored, never
  recomputed** — recomputing means re-running the hill-climb for every day she
  has ever played. Rows are re-validated on read like every other save.
- **It back-fills itself.** `seedDays()` sweeps the old `best.d:` keys on
  start, so an existing player sees the streak she already earned. Seeded rows
  have no par, so they count as played but never as perfect, and the stats
  panel says so in a footnote rather than quietly under-counting.
- **A streak survives an unplayed today** — it counts back from today if done,
  from yesterday if not. Today unfinished is a streak in progress, not a broken
  one.
- **The share grid is her move count drawn six across**, because the tin is six
  across: `🟡` per move, `🐟` last, capped at six rows. Fewer rows is visibly
  better. It encodes **only her own moves — never par**, which keeps the
  spoiler-free promise the share text already made.
- The streak chip in the daily header is repainted on win as well as on build,
  or the header sits one behind the panel that just congratulated her.
- The countdown to the next tin needs no staleness token: it holds the element
  it writes into and stops when that element leaves the document. `build()`
  also calls `stopTick()`.
- **The social preview is `og.jpg`, not `og.png`** — 84KB instead of 436KB, at
  the same 1200×630 and no visible loss. The old PNG was over the size at which
  some chat apps quietly decline to render a link preview at all, which matters
  now that the share grid is the growth path. `og.png` is kept, unreferenced, so
  anything re-crawling an old link still resolves.

## The daily no longer stalls (2026-08-18)

Generating a tin was a synchronous hill-climb on the main thread. Measured over
1096 dates on a laptop: **median 98ms, p99 991ms, worst 1557ms** — and a phone
is several times slower again. It fires on first load, before anyone has seen
the game work once, so the worst case was a new visitor watching a dead page.

Two changes, and **not** the Worker that was on the shelf: a blob-URL Worker is
exactly what `file://` blocks, and the single-file rule means its source would
have to be smuggled in as a string. Neither was needed.

**The climb is a coroutine.** `climbBoard` and `solveSteps` are generator
functions; `makeBoard` and `minSlides` are two-line drivers that run them
straight through, so the verifier and every blocking caller are unchanged. The
UI drives them in ~8ms slices instead, with the page live in between.

- **The tins are byte-identical.** Where a yield falls cannot change what comes
  out — same rng order, same accept/reject order. Proved, not assumed: 360
  boards generated from the old block and the new one and diffed, fish and par,
  zero differences. `node tools/verify.mjs 400` is clean.
- **Yielding is free.** Same hard tin, in the same browser: 4404ms in one
  block, 4413ms in 200ms slices. The cost is zero; only the blocking is gone.
- **The atom is one BFS chunk, not one solver call.** A single call on a
  tangled board walks a quarter-million states — measured at **123ms**, a
  visible stutter on its own. So the search yields every 256 nodes too, which
  brings the longest the page is ever held down to single-figure milliseconds.
- **Hidden tabs get 250ms slices**, because a browser deprioritises a
  background renderer between tasks and handing the thread back is then pure
  loss. Measured, hidden, one hard tin: 4.4s in one block, 4.4s at 200ms
  slices, 15s at 40ms, 23.5s at 8ms. Visible, that penalty is not there.

**A tin is climbed once per device, then kept.** Finished tins go to
localStorage under `sprotai.slide.tins`, capped at 48, oldest evicted.

- **Climbing costs thousands of solver calls; checking costs one.** A cached
  tin is re-solved on the way in and dropped unless its par is exactly the
  minimum the solver proves. Warm read: **2.5ms** for a daily, **4.8ms** for a
  hard ladder tin that costs **4433ms** to climb cold in the same browser.
- That check is the point, not a formality — the cache is user-editable, and
  the game's two promises are that every board is solvable and every par is a
  true minimum. Nine tampered rows were tried (par bent up and down, a sprat
  shoved off the board, two overlapping, the little one lengthened, blockers
  deleted, par as a string, empty list): every one rejected, the untouched row
  accepted, and a bad row is deleted from storage rather than left to fail
  again. Storage that refuses or throws degrades to "climb it", tested.
- Band is recomputed from the tin number, never stored, so nothing on screen
  comes from the cache except the board itself.

**The board is inert while packing** (`pointer-events:none`). A pack can now
last seconds, and a drag landing on the board it is about to replace would have
saved those moves under the new tin's id — the same shape as the three deferred
-callback bugs already on record.

**Prefetch goes through the same queue**, worked from the back so the tin she
is actually waiting for overtakes anything speculative. On the ladder it warms
the next tin *and* today's daily; on the daily it warms the ladder tin she left.
Coming back to the other tab measured **0.9ms with no wait shown at all**.

Also fixed on the way past: the ladder tab called `build()` without waiting for
its tin, which with a cold cache read an unpacked board straight out of the map.
On the boot path — a returning ladder player — that was a white screen.

## Open thread: login and a leaderboard

Asked for on 2026-08-17 after friends played. Assessed, not built:

- **Login is the wrong tool.** Progress already persists; login only adds
  cross-device sync, and it buys a permanent support burden (resets, recovery,
  personal data). If sync is ever really wanted, ship a **sync code** — one
  random string, one row, no identity.
- **A leaderboard needs a backend** (Cloudflare Workers + D1 is the fit — the
  DNS is already there). The hard part is cheating, and this game has an
  unusually clean answer: **submit the move list, not the score**, and let the
  server replay it against the same deterministic tin. `replay()` already does
  exactly this validation client-side.
- **Time is the weak half.** There is no timer in the game at all today, a move
  list can't prove elapsed time, and a clock changes the game's feel. Moves are
  server-verifiable; time is not.
- **A live leaderboard leaks par**, which the share text deliberately hides.
  Friends-only, or unlocked after you have played.

## Open thread: analytics is built but switched off

**Set `CFA` in index.html to the Cloudflare Web Analytics token and it starts
counting.** Same idiom as `KOFI`: empty means the page makes **no external
request at all**, which is what keeps index.html runnable straight off a disk.
Setting it is the one deliberate exception to that rule, and even then the game
still plays with the network unplugged — the beacon just fails.

To get the token: Cloudflare → Web Analytics → Add a site → `sprot.ai`, then
copy the token out of the snippet it shows. It **must** be the manual JS beacon,
not the automatic orange-cloud injection: the DNS records are DNS-only by
design (the proxy blocks GitHub's certificate issuance), so there is nothing
proxied to inject into.

What it answers: is anyone playing, and do they come back. What it **cannot**
answer: what share of players finish the daily, or whether streaks retain
anyone — Cloudflare Web Analytics has no custom events. That needs a Worker of
our own, which is the same infrastructure the leaderboard would need, so the
two should be decided together rather than built twice.

## Open thread

**Ko-fi tip jar is built but switched off.** Set the `KOFI` constant in
index.html to the handle and links appear in the footer and the daily win
panel. Aiste was signing up. Placement is deliberate: never before play,
never a popup, never gating anything.

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

## DECIDED: the difficulty spikes stay (2026-08-10)

Par varies wildly *inside* a band — a "tricky" tin can be par 11 or par 32,
because the hill-climber accepts the first board at or above the band's floor
and sometimes overshoots hard on the final jump. This was offered as a bug to
fix (give each band a ceiling, keep climbing past overshoots) and Aiste
declined: **she likes it.** Verified across tins 1–100: every one solvable,
every par the proven minimum, so the spikes are honest difficulty, not broken
tins.

**Do not "fix" this.** Uneven difficulty is a deliberate property of the game,
and it matches how the genre's best-liked entries actually feel — the research
pass found players praising *Arrows* specifically because consecutive levels
differ in difficulty rather than ramping smoothly.

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

- No analytics, so there is no idea whether anyone plays. Cloudflare gives
  this free without tracking individuals; the proxy is off, so it needs
  turning on (safe now the certificate exists).
- The page has never been opened from `file://` in a browser since the packing
  change. The preview pane refuses to run file URLs, so it was reasoned about
  and tested sideways instead (see above), not exercised. One click to check.
- Mobile fold-fit verified in an emulated 375px viewport, not yet on a
  physical phone.

## Lesson that keeps repeating — read before adding any setTimeout

Three separate bugs, all the same shape: a deferred callback fired onto a
board that had since been rebuilt. It has caused a permanent unbeatable best
of 0, dried-out sprats on a live board, and a daily Share publishing a ladder
tin's score as the day's result. **Any deferred work must capture a token and
bail if it is stale** — `escRun` for animation, `modeRun` for builds. Also:
localStorage is user-editable, so treat every value in it as hostile input.
Both classes of bug were found by adversarial review, not by testing.

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
