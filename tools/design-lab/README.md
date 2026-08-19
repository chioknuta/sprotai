# Design lab

Where the art was designed, and where it is checked.

**Four looks now ship** — `classic`, `deco`, `neon`, `plush` — and they live in
`index.html`, between the `skins:start` / `skins:end` markers. **That block is
the source of truth.** The gallery reads the shipped skins straight back out of
it (`harness/shipped.mjs`), the same trick `tools/verify.mjs` uses on the
generator, so this folder can never show art the game does not draw.

`designs/` holds the seven candidates as originally drawn. Three of them —
`riso`, `holo`, `paper` — were not chosen and exist nowhere else, so the gallery
still reads those from here and labels them "not shipped". The four that did
ship are kept for history; **edit the game, not those files.**

## What is here

| Path | What |
|---|---|
| `BRIEF.md` | The brief every direction was drawn to, and the contract each file obeys |
| `designs/*.js` | The seven candidates as drawn. History for the four that shipped; the only home of the three that did not |
| `harness/shipped.mjs` | Reads the live skins out of `index.html` — why the gallery cannot drift |
| `harness/emit-skins.mjs` | One-time aid that turned candidates into the shipped `SKINS` block. Not run again |
| `fit/door-budget.mjs` | Is any door bigger than the space the page actually has? |
| `fit/ship-check.mjs` | The acceptance test: every shipped skin, every phone width, hero on the extreme rows |
| `notes.json` | The wins/costs ledger shown on each card in the gallery |
| `harness/render.mjs` | Renders a direction on real tins at 56px and 38px, plus the cast |
| `harness/doors.mjs` | Every door, no fish, on identical tins — the "cover the rim" test |
| `harness/gallery.mjs` | Builds the review page |
| `harness/validate.mjs` | The contract check (see below) |
| `harness/tin.json` | Tins 4, 12 and 40, dealt by the real generator via `tin.mjs` |

## Commands

Everything renders through headless Chrome; there is no build step and no
dependency.

```bash
node harness/render.mjs deco
```

```bash
node harness/doors.mjs
```

```bash
node harness/gallery.mjs
```

```bash
node harness/validate.mjs
```

```bash
node fit/door-budget.mjs
```

```bash
node fit/ship-check.mjs
```

`out/gallery.html` is page content only — no doctype or `<body>` — so it can be
published as an artifact as-is. It still opens fine in a browser on its own.

## The contract a design must keep

`validate.mjs` checks the things that look fine in a gallery and break the real
game:

- **`<g class="eye">` around every pupil.** `gaze()` in `index.html` translates
  that group by 5 user units so every other sprat turns to watch her leave on
  the winning move. A design without it silently loses the best moment in the
  game. (`gaze()` skips the hero, so *her* eye never moves — a hero with a jewel
  for an eye costs nothing mechanically.)
- **No id collisions.** Many copies of the same string land in the DOM at once,
  so an id must always mean the same definition. Same id, different content, is
  the one thing that visibly breaks.
- **No external references.** The game must run off a disk with the network
  unplugged; that is what the single-file rule buys.
- **No filters on the ordinary sprats.** Up to 14 are live and re-laid-out on
  every drag. The hero may carry one.
- **CSS scoped to `.dz-<slug>`**, and `@keyframes` names slug-prefixed, because
  a keyframes name is global. Every design's animation is confined to the hero
  and the door, and every one honours `prefers-reduced-motion`.

## The door budget, and why it exists

Every new door was being **silently amputated on phones**. `layout()` centres
the tin and left ~27px to the right of it; the opened lids need up to 59px; and
`html{overflow-x:clip}` means the excess does not scroll, it just stops. Deco's
key was sliced in half on every phone and nobody had noticed, because the design
lab renders on a 1400px page.

`layout()` now subtracts **120** instead of 74. That number is derived: the room
right of the oil is `27 + (K - 54)/2`, a floor independent of cell size, so
K=120 buys 60px. It costs about 7px of cell on a phone — and it also removed a
15px vertical scroll the page had at 375×667.

The budget is therefore **60px right of the oil, 24px above, 24px below** (above
and below are where the date line and the Moves row sit). `fit/door-budget.mjs`
enforces it from rendered pixels, and `--self-test` proves the check still
fires. Known residual: at **320px** — the smallest phones — deco loses ~4px off
the outer edge of its key and neon ~10px of outer glow. The metal fits;
everything at 360px and up is clear.

## Adding or changing a look

The fish and the door are independent — a pair need not come from the same
direction.

Edit the `SKINS` block in `index.html` directly. A skin is
`{ name, blurb, swatch, css, sprat(len, hero), door(g) }`:

1. `css` is scoped to `[data-skin="id"]`, which sits on `<html>`. All four are
   injected once at boot and coexist, so switching is one attribute. `@keyframes`
   names are global — prefix them with the id.
2. `sprat(len, hero)` returns the fish as SVG. Keep `<g class="eye">` around each
   pupil; `gaze()` translates it so every other sprat turns to watch her leave.
   `gaze` on the skin tunes how far, in user units (default 5).
3. `door(g)` gets `{cell, W, H, row}` and fills a `.doorlayer` that is
   `position:absolute; inset:0` over `.tin-inner`, with `--cell`, `--row` and
   `--top` set on it. Size in `calc()` off `--cell`: the door is re-rendered in
   `build()`, not `layout()`, so a resize must not need new markup.
4. Set `--bub-tint` if the oil is not honey, or the per-move bubbles read as grit.
5. Skin CSS must never give `.fish` padding, border, margin or a transform —
   `onUp()` splits tap direction on `getBoundingClientRect()`, so that would
   change how the game reads a tap.
6. Then: `node harness/validate.mjs`, `node fit/door-budget.mjs`,
   `node fit/ship-check.mjs`, and `node tools/verify.mjs` from the repo root.
