# ŠPROTAI — art direction brief

You are designing the look of a daily browser puzzle at **sprot.ai**. A 6×6 tin
of Baltic smoked sprats. Every sprat is 2–3 cells long and slides along its own
lane. One little pink sprat — **the hero** — has to reach the gap in the rim and
get out. Rush Hour, in a tin.

Two things are being redesigned, and you deliver **both**:

1. **The fish.** The client's words: *"more hip and beautiful"*, and the hero
   *"more unicorny, glittery, special"*. Right now the hero is a pink version of
   the same fish and she barely reads as the protagonist.
2. **The door.** The way out is currently an 11px sliver on the right rim with a
   faint arrow. Nobody sees it. The client's words: *"more visible, like maybe
   an opened can thingy"* — so: **a tin lid actually opened**, peeled or rolled
   back, the way a key-opened sardine tin looks. It must say "this is the way
   out" in the first half-second, at phone size, without a caption.

You get one design direction (below, in your prompt). Commit to it hard. A
timid version of a strong direction is the worst outcome here — there are five
other directions being drawn in parallel and the client picks between them.

---

## What you write

Exactly one file: `designs/<your-slug>.js`. Plain browser JS, no modules.

```js
DESIGNS["<your-slug>"] = {
  name:  "Holo Foil",                 // 1–3 words, how it gets referred to
  blurb: "iridescent chrome, one pearl horn",   // ≤ 60 chars
  css:   `...`,                        // extra CSS (see rules)
  door(g){ return `<div class="lid">…</div>`; },   // g = {cell, W, H, row}
  sprat(len, hero){ return `<svg class="art" …>…</svg>`; }
};
```

### `sprat(len, hero)`

- `len` is 2 or 3. `hero` is `true` for exactly one fish per board.
- Return an SVG string whose root is
  `<svg class="art" viewBox="0 0 ${len*100} 100" preserveAspectRatio="none" aria-hidden="true">`.
  The aspect ratio always matches the box it lands in, so nothing distorts.
- **The fish faces right.** Head at the right end (around `x = w*0.8`), tail at
  the left. The game mirrors and rotates the whole strip for the other three
  directions — a vertical fish is this same strip rotated 90°.
- **It must fill the strip.** Roughly `x ∈ [4, w-4]`, `y ∈ [6, 94]`. The tin has
  to look *packed*; a fish with polite margins leaves the board looking empty
  and breaks the "no room to turn around" premise the puzzle rests on.
- **Keep `<g class="eye">`.** Wrap the pupil (and its catchlight, not the white)
  in `<g class="eye">`. On the winning move the game translates that group by up
  to 5 user units so every sprat turns its pupils to watch her leave. It is the
  single most-loved detail in the game. It must survive your redesign, and the
  pupil must have room to move ~5 units in any direction inside the eye white.
- **ID hygiene.** Many copies of the same string land in the DOM at once, so
  every `id` must be (a) prefixed with your slug and (b) unique per
  `(len, hero)` pair — e.g. `id="holo-body-h2"`. Same id must always mean the
  same definition. Duplicate ids with *different* content is the one thing that
  will visibly break.
- **No external anything.** No `<image>`, no `url(http…)`, no web fonts, no
  emoji glyphs. The whole game ships as one file that must run off a disk with
  the network unplugged.

### `door(g)`

- Returns markup that is dropped into a `.doorlayer` — `position:absolute;
  inset:0; pointer-events:none`, laid over the oil, **overflow visible**, so you
  may draw outside the tin. Stay within ~44px to the right of the rim.
- The layer carries `--cell` (px), `--row` (the hero's row index), and `--top`
  (`row*cell` px). Position off those, never off hardcoded pixels — the cell is
  38px on a small phone and 58px on a laptop.
- The opening is on the **right rim, at the hero's row**. The hero darts about
  1.4 cells past the rim on the winning move, so the door must read as *open* —
  do not put anything solid in her path.
- Outside the oil there is 11px of metal rim, then the page background
  (`#fdf6e9`, warm cream).

### `css`

- **Every selector must start with `.dz-<your-slug>`** — six designs render on
  one page and must not touch each other.
- You may restyle the tin itself here: `.dz-slug .tin` (the metal frame),
  `.dz-slug .tin-inner` (the oil), `.dz-slug .grid i` (the lane lines). If your
  direction wants dark oil or a different metal, take it — just say so in a
  comment so it can be lifted to the real stylesheet later.
- Any idle animation must be switched off under
  `@media (prefers-reduced-motion: reduce)`, inside your own `css`.

---

## Hard constraints — these are not style notes

1. **The hero must be unmistakable at 38px.** This is the real test and most
   designs fail it. Up to 14 fish are on screen; a player must find her in a
   glance on a phone in bad light. Silhouette and hue both have to do work —
   a pink version of the same shape is not enough. Look at your own 38px render
   before you call it done.
2. **Two-cell and three-cell fish must be told apart instantly**, because
   length is the puzzle information. Don't let a decorative treatment blur that.
3. **Performance.** Up to 14 SVGs live, on a phone, re-laid-out on every drag.
   No `feTurbulence`, no `feGaussianBlur`, no `feDisplacementMap` on the ordinary
   sprats. The hero may carry **one** modest filter or CSS animation. Keep each
   fish under ~2.5KB of markup. Prefer gradients and flat shapes to filters.
4. **It stays a tin of Baltic smoked sprats.** Warm, oily, slightly deadpan.
   Charming, not saccharine. Lithuanian heritage is welcome; a flag is not.
5. **The eye is the soul.** Big, glossy, alive. It carries the joke that these
   are canned fish having a normal day.

---

## How to work — you can see your own output

You are not drawing blind. Render and **look**:

```bash
cd <scratchpad> && node harness/render.mjs <your-slug>
```

That writes `out/<your-slug>.png` — a real tin at 56px cells, a real tin at
38px cells, and a size ladder of the cast. **Read that PNG with the Read tool.**

Iterate at least **four** times. Each pass, look at the image and ask:

- Can I find the hero instantly in the 38px tin? (If not, nothing else matters.)
- Do the vertical fish look right, or did rotation break something?
- Does the door read as an opened tin, or as a decoration on the edge?
- Is anything clipped, doubled, mispositioned, or accidentally invisible?
- Is it actually beautiful — would this make someone screenshot it?

Fix what you see. Do not report done until the last render genuinely looks good.
Never claim a fix you have not looked at.

`designs/00-current.js` is the design shipping today — read it for the exact
mechanics, then do not imitate it.

## What you return

A short report: the slug, what the direction is in two sentences, what the hero
treatment is, what the door does, how many passes you made, and anything you
tried that did not work. Be honest about weaknesses — a critic reads this next.
