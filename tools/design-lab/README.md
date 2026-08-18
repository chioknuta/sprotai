# Design lab

Six candidate art directions for the sprats and the escape door, drawn against
the real board so nothing here is a mock-up. Nothing in this folder ships —
`index.html` is untouched until a direction is chosen and lifted into it.

## What is here

| Path | What |
|---|---|
| `BRIEF.md` | The brief every direction was drawn to, and the contract each file obeys |
| `designs/00-current.js` | The design shipping today, as the control |
| `designs/*.js` | One candidate direction each |
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

## Lifting a direction into the game

The fish and the door are independent — a chosen pair need not come from the
same direction.

1. `sprat(len, hero)` replaces `spratSVG(len, hero)` in `index.html`. Same
   signature, same `viewBox`, same `preserveAspectRatio="none"`, so `layout()`
   and the `.rot` wrapper need no changes.
2. The door is the one structural change. Today `.notch` is a single div that
   `layout()` positions by writing `top` and `height`. A design's `door(g)`
   expects a `.doorlayer` that is `position:absolute; inset:0` over `.tin-inner`
   with `--cell`, `--row` and `--top` set on it, and fills it with its own
   markup. That is a few lines in `layout()`.
3. The design's `css` is merged into the stylesheet with the `.dz-<slug>` scope
   stripped. Where a direction restyles the tin itself — `deco`, `neon` and
   `riso` all do — those rules are load-bearing and must be lifted with it.
4. Hero markup runs 3.7–5.1KB against the current 1.2KB. That is one fish per
   board, so it is not a real cost; the ordinary sprat is the one to watch.
