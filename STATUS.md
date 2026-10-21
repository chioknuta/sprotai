# Status

_Last updated: 2026-10-21_

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

## Four looks, and the player picks (2026-08-19)

Asked for on 2026-08-18: make the door visible — "an opened can thingy" — and
make the fish hipper, with the little one "unicorny, glittery, special". Six
directions were drawn; four are now **in the game and switchable**: `classic`
(the original), `deco` (Tin Label 1936), `neon` (Night Catch) and `plush`
(Sprat Plush). The palette button in the tools row opens the picker; the choice
is stored and survives a reload.

**A skin is paint and nothing else.** It cannot reach the generator, the solver
or par — `spratSVG` always sat below the `generator:end` marker, and the skins
replaced it in place. So no choice of look can make a tin unsolvable or a par
dishonest, and everyone still plays the same daily. The generator block is
**byte-identical** to the version before this change, and `node tools/verify.mjs`
passes unchanged.

- **`SKINS` in index.html is the source of truth for the art**, between
  `skins:start` / `skins:end`. `tools/design-lab` reads the shipped skins back
  out of it, the same trick `verify.mjs` uses on the generator, so the gallery
  cannot drift from the game. The three unshipped directions still live in
  `design-lab/designs/` and are labelled.
- **Switching does not rebuild the board.** `applySkin()` repaints the fish art
  and the door and nothing else — `build()` would clear an escape in flight (so
  a win would never show its panel), reset `done`, hide the win panel and re-read
  a save that is already deleted. Measured: board state, history, par, moves and
  best come through byte-identical across all four skins, and Undo still walks
  back afterwards. 0.6–6.9ms.
- **A skin switch mid-escape ends the escape rather than corrupting it.**
  `gaze()` writes inline transforms onto the `.eye` groups, and replacing the SVG
  under them would strand the pupils, so `applySkin` calls `skipEscape()` first.
  Verified: the win panel still shows, `freeze` clears, no stranded transforms.
- **The stored skin name is validated against `SKIN_IDS`, never used.** Ten
  hostile values were tried (`"toString"`, `"constructor"`, `"__proto__"`, a
  number, an object, a trailing space); every one falls back to `classic`
  without throwing. Without the allow-list `SKINS[x].sprat` throws inside
  `build()` before any board draws — a bricked game that survives a refresh.

### The doors did not fit on a phone, and that was true with or without skins

`layout()` centres the tin and left **~27px** to the right of it. The opened
lids need up to **59px**. `html{overflow-x:clip}` means the excess does not
scroll — it stops dead, so deco's winding key was being sliced in half on every
phone width and the design lab never showed it, because it renders on a 1400px
page.

**`layout()` now subtracts 120 instead of 74.** Derived, not chosen: the room
right of the oil is `27 + (K - 54)/2`, a floor independent of cell size, so
K=120 buys 60px against a worst case of 59. It costs ~7px of cell on a phone —
and it also removed a **15px vertical scroll the page had at 375×667**.

- Vertical overflow needed fixing separately, since no horizontal gutter helps
  it: plush's key painted 44px above the oil at hero row 0 and **landed on the
  date line**. Both plush and neon now mirror their hardware at the extreme rows.
- **The budget is enforced, not remembered**: `design-lab/fit/door-budget.mjs`
  measures every door from rendered pixels against 60px right / 24px above /
  24px below, and `--self-test` proves the check still fires.
  `fit/ship-check.mjs` is the acceptance test — every shipped skin, every phone
  width, hero on rows 0/2/5.
- **Known residual at 320px**, the smallest phones: deco loses ~4px off the
  outer edge of its key and neon ~10px of outer glow. The metal fits. Everything
  at 360px and up is clear. The only levers left there are a smaller cell floor
  or an off-centre tin, and both were measured and judged worse.

### Two things that quietly assumed one palette

- **The bubbles were hardcoded honey** (`#f0bd6d45`) — the game's per-move
  feedback, which went muddy grey-brown on a dark brine and read as grit. Now
  `--bub-tint`, set per skin.
- **`gaze()` moved pupils a fixed 5 units** regardless of the eye drawn around
  them. Now `SKINS[skin].gaze ?? 5`.

Also checked: no id collisions in the live DOM, `.fish` box geometry identical
across skins (so `onUp()`'s tap-direction split is unaffected), every animated
skin honours `prefers-reduced-motion`, and nothing animates across all 14 fish.

**Cost:** index.html 58KB → 121KB raw, 20.5KB → 40.5KB gzipped. Still one file,
still no build step, still runs off a disk.

**Not changed, and worth knowing:** `og.jpg`, the PWA icons and `theme-color`
are single-look, so `classic` is still the identity anyone meets from a link.
Sharing is text-only, so four looks does not fragment what gets shared.

## The health check, and what it found (2026-10-21)

Two months dormant, and nothing had rotted: the live site was byte-identical to
the repo, `node tools/verify.mjs` passed, and the generator and skins blocks
were untouched. Both are still byte-identical after everything below — checked
by hash, not by eye. What the audit did find was two bugs that silently cost a
player her streak, a dead acceptance test, and a win panel most phone players
never saw.

### The daily never rolled over unless the page was reloaded

`dayK` was stamped once, in `setMode("daily")`, and nothing read the clock
again — there was no `visibilitychange`, `pageshow` or interval anywhere. A
page left open across local midnight went on serving the previous day's tin for
as long as it stayed open, and a win was recorded against **yesterday's** row,
which already existed, so no row was written for the day actually played.
Verified arithmetic: play the 19th, 20th and 21st, leave it open, play on the
22nd, and on the 23rd the streak reads **1 instead of 5**. Every day played.

The streak chip made it worse — it counts back from yesterday when today is
unplayed, so a stale page cheerfully showed the streak intact on the very day
it was being lost.

**This is the normal path for the thing she asked about.** A phone does not
reload a page it returns to, and an installed app is resumed from the app
switcher rather than launched. `checkRollover()` now runs on
`visibilitychange`, on `pageshow`, and on a 60s interval. Two outcomes, because
her moves are hers: nothing invested (untouched or finished) moves her straight
on; mid-solve **offers** it as a tappable "Today's tin is ready →" in the date
line. All three cases tested.

### The writers were never tokened — bug #3, reopened through the packing path

`modeRun` guards the *build*. It was never consulted by the *writers*.
`setMode` assigns `mode` and `dayK` immediately, then waits seconds for a tin
to climb; for that whole window the old board is on screen with the old fish and
the old history while `boardId()` already names the incoming tin. So `commit`,
`undo`, `recordWin`, `saveRun` and `showWin` all filed the old board's state
under the new board's key.

`.tin.busy{pointer-events:none}` was not the whole fix: pointermove/pointerup
are bound to `window` so a drag in flight keeps being delivered, the tools row
sits outside `.tin`, and Cmd+Z reaches `undo()` through the document handler.

Fixed with `builtId` — the id the board on screen was actually built from — and
a one-line `onLiveBoard()` check in all five writers. **Verified:** during a
simulated pack, `undo` + `saveRun` + `commit` + `recordWin` + `showWin` all
wrote nothing under the daily's id, and the ladder's moves were untouched.
`enterBusy()` also drops any drag in flight, releases pointer capture, and
disables Undo/Reset so a dead button does not look live.

### The win panel was below the fold, and nothing scrolled to it

No `scrollIntoView` anywhere in the file. At 375x553 — an iPhone SE with
Safari's toolbars up — **ten pixels** of the panel were visible: the
congratulation, the streak, the share grid and the Share button were all off
screen with no scrollbar and nothing to suggest more page. The share grid is
the growth path and most players never saw it. The board itself fits above the
fold at every portrait width, which is exactly why nobody noticed: the promise
holds right up until she wins.

`revealWin()` fixes it, and **the deferral is the fix** — called synchronously
it loses the race with the browser's own scroll restoration, which puts the
page back to the top once loading finishes, leaving the panel precisely where
it started. It now waits for `load` and a frame, bails if the panel has since
been put away, and honours `prefers-reduced-motion`.

### `ship-check.mjs` was dead, and Chrome killed it

The named acceptance test for the door budget returned **72 of 72 "no
reading"** and exited 1. Not a silent pass — a loud failure nobody had run in
two months. The cause was outside this repo: Chrome stopped honouring
`--virtual-time-budget` for `--dump-dom`, so the DOM was dumped before a single
`setTimeout` had run and every page that measures itself asynchronously
returned its placeholder. Chrome 155, updated the morning of the audit.

Rewritten on the DevTools protocol (`fit/cdp.mjs`, no dependencies — Node has a
global `WebSocket`). Three things fell out of that:

- **The iframe is gone.** `Emulation.setDeviceMetricsOverride` sets a real
  viewport, so `innerWidth` is the width asked for by construction.
- **It measures paint, not rects.** The page is diffed against itself with the
  door layer hidden, so a gradient counts where it stops being visible. This
  killed two false alarms the rect-union raised and the old script would have
  raised too: neon reported as landing on the date line at every width from 360
  up (the date is centred; the lid is at the right-hand edge) and on the Moves
  row at row 5 (`neon-spill`'s box overlaps "Best —" by 18px while its paint
  has faded to nothing). **No shipped skin touches the furniture.**
- **Landscape is in the matrix**, and `scrolls` is no longer a failure —
  How to play and the footer are *meant* to be below the fold, and failing on
  that red-lights the footer forever. What is enforced is that the tin and its
  controls are reachable.

The 320px residual (deco ~4px of key, neon ~10px of glow) is now an explicit
logged ALLOW rather than a silent pass. **All 96 checks pass.**

`door-budget.mjs` was measuring `designs/*.js` — frozen copies — so a door
edited the way CLAUDE.md says to edit one was invisible to its own budget
check. It now reads the shipped `skins:` block for the four that ship and
`designs/` only for the candidates, and prints which source each came from.
All four shipped skins pass: classic 13/0/0, deco 57/1/1, neon 53/17/17,
plush 59/20/20 against 60/24/24. **Plush has 1px of horizontal headroom** —
worth knowing before anyone touches that door.

### `verify.mjs` ran the generator in sloppy mode

`new Function(body)` is sloppy by default; in index.html the same text sits
below `"use strict";`. So the verified code and the shipped code did not
execute under the same rules — the exact drift the extraction exists to
prevent. A one-character typo creating an implicit global printed "All 60 tins
solvable", would have been pushed, and would have shown every visitor a blank
page. Now prefixed with the directive, with `W`/`H` declared inside the body as
`const` rather than passed as mutable parameters. **Proven:** the same injected
typo now exits 1 with a ReferenceError.

### It is an app now, and that was the honest answer to "could this be my first app"

**Do not build a native app yet.** Apple's guideline 4.2 is hostile to thin web
wrappers and a bare WKWebView over a responsive site is close to an automatic
rejection; it costs $99/year and a review queue to find out. Google Play is $25
once, but a personal account created now cannot ship to production until it has
run a closed test with **12 testers for 14 unbroken days**. The only thing a
native build buys this game that the web cannot is a scheduled local "today's
tin is ready" notification. Revisit if retention ever proves that is the
difference — and then as a real native shell, not a wrapper.

What shipped instead is `sw.js`, and it is the whole gap: the game needs no
network to generate, play, persist or score a puzzle, yet an installed copy
showed the browser's offline error page. **Verified by stopping the server and
reloading: full board, correct date, par 11, served by the service worker.**

- **Network-first for the page, deliberately.** Cache-first is the usual advice
  and the usual footgun — it pins everyone to the version they first loaded.
  For a game that ships by `git push` with no CI, being one push behind is the
  failure that cannot be debugged remotely. Cache-first only for the icons.
- Registered behind a protocol guard, so running off a disk still works, and
  every failure is swallowed.
- Cross-origin requests are not touched, so turning on the `CFA` beacon later
  is not intercepted.

Also: **the asset paths were root-absolute.** `/icon-192.png` and
`/manifest.webmanifest` quietly narrowed "drop it on any static host" to hosts
serving it at the domain **root** — in a project subpath or off a disk the
icons and the manifest 404 and the install prompt goes with them. Now relative,
along with the manifest's own `start_url` and `scope`. And a **maskable icon**
was added: both existing icons declare `purpose: "any"` and bake their rounded
corners in as opaque white, which Android inscribes inside the safe area over a
white plate — the shrunken already-rounded tile that reads as a web shortcut.
`icon-512-maskable.png` is full-bleed with the fish inset to 0.92 so its
farthest point sits 203.1px from centre against a safe radius of 204.8.

### Accessibility, and the touch handling underneath it

- **The game could not be played by keyboard at all.** Every sprat was already
  a `<button>` with a label and a focus ring, but the only listener was
  `pointerdown` — and a button turns Enter and Space into a `click`, which
  nothing listened for. Eight of sixteen tab stops were controls that looked
  live and did nothing. Arrows along the lane, Enter and Space to shuffle,
  both routed through the same `commit`/`bump` the drag uses so legality is
  decided in one place.
- **The labels went stale on the first move.** Written once in `build()` from
  the sprat's *base* row and column, so they described the tin before anything
  slid — and `off` is not zero to begin with when a save is restored. Now
  rebuilt in `paint()`, and they say which way a sprat can still go:
  "Sprat, 2 long, lying down at row 1 column 5. Slides down."
- **`pointercancel` was routed to `onUp`**, so a gesture the OS took away —
  a system edge-swipe, a call, the app backgrounding — committed a move she
  never made. It now snaps back.
- **A second finger hijacked the drag**: `drag` was overwritten outright, so
  the new sprat answered the old finger and the first was left wearing
  `.dragging`. One pointer at a time now, matched on `pointerId`.
- **A drag across the lane counted as a tap.** `moved` only ever tracked the
  along-lane component, so a swipe perpendicular to a sprat fell through to the
  tap branch and shuffled it a square — and since `.tin` sets
  `touch-action:none`, that swipe was often someone trying to scroll. Measured:
  a 90px drag straight down on a horizontal sprat committed a move. Abandoned
  now, and the sprat snaps back.
- **The shake on a blocked move** was the last thing still moving under
  `prefers-reduced-motion`, and it is the animation that fires most often. The
  feedback survives: the sound plays and the blocker still flashes, which is
  brightness and glow rather than movement.
- **Contrast: every text element on the page now passes WCAG AA**, swept
  rather than spot-checked. It did not before — footer 2.03, the mode tabs
  2.55 and 2.60, How to play 2.72, the Moves/Best labels 3.09, Undo and Reset
  4.08. Each was moved to the **lightest** value on its own hue that reaches
  4.5:1 against the background it actually sits on, so this is legibility, not
  a recolour. `--accent` itself is untouched — a new `--accent-txt` carries the
  small-text cases. No skin overrides `:root`, so it holds under all four.
- Tap targets: the three icon buttons were 38x39 and How to play was 20px
  tall, under even the 24px floor. Both now 44.

### `replay()` accepted moves the board could never make

The hardened save path recomputes `from` and calls `gridValid()` after every
move — but `gridValid()` checks the resulting **state**, never the
**transition**, so a saved move could teleport a sprat straight through a
blocker and land somewhere perfectly legal. `hist.length` is what the game
banks as the move count, writes into the day record and draws in the share
grid, so a forged save could report finishing an 11-move daily in 4 — below a
par the generator exists to prove is a minimum. Three lines, using the same
`rangeOf()` the drag already trusts.

**This matters beyond one device:** the leaderboard plan on record is to submit
the move list and replay it server-side, and a server running the old
`replay()` would have accepted the forgery.

### Smaller, all verified

- `build()` dereferenced `currentTin()` unchecked, so Reset or "Try again"
  landing during a pack threw a TypeError and the button did nothing.
- Share silently did nothing with no Clipboard API: optional chaining
  short-circuited past the `window.prompt` fallback. Not exotic — the Clipboard
  API needs a secure context and this file is meant to run off a disk.
- `Snd.init()` returned early on an existing context and nothing resumed it, so
  iOS killed the per-move bubble for the rest of the session after any lock or
  backgrounding.
- `layout()` sized the cell from width alone, so a sideways phone clamped to
  the 58px maximum and put the tin in a 375px-tall screen. Now clamped on
  height too. It does not bite in portrait at any phone width.

### The three she sent back, all fixed the same day

**The Share button.** She said the orange could change, and the answer turned
out not to need it darkened. White needed the gradient taken to roughly
`#9d6c26`→`#b85d27` — brown — and even `#cc5c12` still failed at the top stop
(4.11). So it went the other way: the orange got **brighter**
(`#f9b44a`→`#f08a34`) and the brand's own ink carries the label. 6.4:1 at the
top, 5.43 at the midpoint, 4.61 at the bottom — checked across the gradient,
not just at the ends, because a gradient can pass at both ends and sag in the
middle. `--accent` is untouched; this is `.go` only, so Share, Next tin, Close
and Done all move together.

**Landscape is laid out sideways now.** Stacked in one column the arithmetic
could not close — ~185px of header above the tin plus a 38px cell floor wants
413px of a 375px-tall screen — so sideways the page becomes two columns, tin on
the left and everything else beside it. CSS only, no DOM restructuring: `body`
becomes a grid with one row per in-flow child and the tin spanning the column
beside them. Three things that are load-bearing rather than stylistic:

- **The row count is pinned to the children.** An open-ended `span 24` left
  eighteen empty rows absorbing the tin's height, which pushed the board 97px
  down with 2px under it. `repeat(9, auto)` plus `grid-row:1 / -1` centres it:
  45px above, 55px below.
- **The column gap is a door clearance, not a margin.** The opened lid paints
  up to 59px right of the oil and overflows the tin's box, so a narrow gap
  would land the door on the controls. 64px minimum.
- **`max-height:600px` keeps it off tall windows.** A desktop browser is
  landscape too and has room to stack.

`layout()` sizes the cell for it — the vertical budget collapses to the page
padding, and the binding constraint becomes leaving the other column width, so
the tin takes 45%. Cell 46 at 667x375, 58 at 844x390. **ship-check now holds
landscape to the same above-the-fold line as portrait** rather than exempting
it, and all 96 pass.

**Discoverability, the half that is code.** `robots.txt` and `sitemap.xml` did
not exist (both 404). A missing robots.txt already means "crawl everything", so
that was never the blocker — the blocker is that **nothing on the web links
here**, and Google discovers by following links. The sitemap exists so it can
be handed to Search Console, which is what gets a linkless domain crawled.
Also added inline JSON-LD (`VideoGame`, free, browser, single-player) so a
result can show as a game rather than an untitled page. It claims nothing
untrue: no invented author, no ratings nobody has given. Canonical, title,
description and `lang` were already correct.

**Submitted to listdle.com on 2026-10-21**, with her go-ahead on the exact
wording: URL `https://sprot.ai/`, title Šprotai, category LOGIC, the standard
description plus "No login, no ads, free.", contact `aistelei@gmail.com` (her
personal address, given for this). Their acceptance bar is "a free-to-play
daily game which does not require log in", which this clears. Acknowledged:
"We'll review the game and add it to Listdle within a week or so." Their
consent dialog was set to **Reject all**, not accepted.

**Google Search Console is the one thing still outstanding, and it needs her
Google account** — nobody else can do it. Add `sprot.ai`, verify by TXT record
(the DNS is already at Cloudflare), submit `https://sprot.ai/sitemap.xml`. That
is what gets a domain crawled when nothing links to it, and until it is done
the sitemap added today is just sitting there. Confirmed by search on the day:
sprot.ai returned nothing at all.

### Still open, deliberately

- Domain confirmed independently by whois: expiry **2027-11-20**, ACTIVE,
  Spaceship — STATUS was accurate. Auto-renew is still off, so that wants a
  calendar reminder rather than a code change. The sunset decision ("sunset if
  nothing ships by ~Aug 2027") is now stale: something shipped.
- `AGENTS.md` was an untracked near-copy of CLAUDE.md whose only edit was a
  `.Codex/` path matching no directory here. It is now a pointer, because a
  second copy of a 7KB instruction file is a second thing to update and nobody
  does. `.codex/` is left untracked — that is tooling, and whether it belongs
  in the repo is a call for whoever uses it.

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

GitHub Pages, from the `chioknuta/sprotai` repo. **See "LIVE at
https://sprot.ai" at the top of this file for the current state** — the DNS was
switched on 2026-08-10 and this section used to still say it had not been,
which is the kind of thing that sends someone off to re-point a domain that is
already pointed.

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
