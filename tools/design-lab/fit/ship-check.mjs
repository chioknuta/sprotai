#!/usr/bin/env node
/**
 * fit/ship-check.mjs — the acceptance test for the shipped skins.
 *
 * Loads the REAL index.html at real phone viewports, switches through every
 * skin the game actually ships using the game's own `applySkin()`, and asks
 * the three questions that decide whether this change is safe:
 *
 *   1. Is the door amputated? `html{overflow-x:clip}` means an overrunning lid
 *      does not scroll, it stops dead — so paint reaching past the viewport's
 *      last column is the signature.
 *   2. Does the door land on the furniture? The date line sits above the tin
 *      and the Moves/Best row below it; the lid draws outside the oil at hero
 *      rows 0 and 5.
 *   3. Does the page still fit above the fold, with no scrolling?
 *
 * HOW IT TALKS TO CHROME. It used to be `--dump-dom --virtual-time-budget`,
 * with the page under test in an iframe because `--window-size` is ignored
 * under `--dump-dom`. Chrome stopped honouring the virtual-time budget, so the
 * DOM came back before any timer had run and all 72 rows read "no reading" —
 * see fit/cdp.mjs. It now drives Chrome over the DevTools protocol, which sets
 * a real viewport (no iframe, and `innerWidth` is the width asked for by
 * construction) and evaluates in the page's own scope, where index.html's
 * top-level `fish` / `cell` / `applySkin` bindings actually live.
 *
 * LANDSCAPE IS IN THE MATRIX. The portrait promise was the only one checked,
 * and `layout()` sized the board from width alone — so a sideways phone put
 * half the tin and the whole Moves/Undo/Reset row below the fold. The two
 * landscape pairs below are what keep that fixed.
 *
 *   node fit/ship-check.mjs [--shot]
 */
import { writeFile, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { launch } from "./cdp.mjs";
import { readPNG } from "./png.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..", "..", "..");
const OUT = join(HERE, "out");
const SHOT = process.argv.includes("--shot");

// Portrait is the promise; landscape only has to stay playable and unclipped.
const VIEWPORTS = [
  [320, 568], [360, 780], [375, 667], [390, 844], [412, 915], [430, 932],
  [667, 375], [844, 390],
];
const SKINS = ["classic", "deco", "neon", "plush"];
const ROWS = [0, 2, 5];

/* Put the page in the state under test and report the geometry that pixels
   cannot give us: where the oil is, where the furniture's INK is, and whether
   the controls are reachable.

   `build()` rebuilds `fish` from the tin, so the hero row has to be forced
   AFTER it and the door re-rendered at that row — setting it first was
   silently overwritten by the rebuild.

   Animation is frozen first. The collision test below works by diffing the
   page against itself with the door hidden, and a pulsing glow or a drifting
   bubble elsewhere on the page would otherwise show up in that diff as door
   ink. */
const SETUP = (skin, row) => `(() => {
  const res = { skin: ${JSON.stringify(skin)}, row: ${row} };
  try {
    let f = document.getElementById("fit-freeze");
    if (!f) {
      f = document.createElement("style");
      f.id = "fit-freeze";
      f.textContent = "*,*::before,*::after{animation:none !important;transition:none !important}";
      document.head.append(f);
    }
    res.innerWidth = window.innerWidth;
    res.innerHeight = window.innerHeight;
    applySkin(${JSON.stringify(skin)});
    build();
    fish[0].r = ${row};
    document.getElementById("door").innerHTML =
      SKINS[${JSON.stringify(skin)}].door({ cell, W, H, row: ${row} });
    layout();
    const D = document;
    const oil = D.getElementById("tin").getBoundingClientRect();
    const box = r => ({ left: Math.round(r.left), right: Math.round(r.right),
                        top: Math.round(r.top), bottom: Math.round(r.bottom) });
    res.oil = box(oil);
    /* The furniture's INK, not its container. #dailyhead and .bar are
       full-width block elements, so testing against their rects makes every
       horizontal overlap trivially true — which reported neon's lid as landing
       on the date at every width from 360 up, when the date is centred and the
       lid is out at the right-hand edge. */
    const inkOf = sel => [...D.querySelectorAll(sel)]
      .map(e => e.getBoundingClientRect())
      .filter(r => r.width && r.height)
      .map(box);
    res.dateInk = inkOf("#dailyhead #dailydate, #dailyhead #dailystreak");
    res.barInk  = inkOf(".bar span");
    res.pageH  = D.documentElement.scrollHeight;
    res.viewH  = window.innerHeight;
    res.scrolls  = D.documentElement.scrollHeight > window.innerHeight + 1;
    res.sideways = D.documentElement.scrollWidth > window.innerWidth + 1;
    res.cell = Math.round(oil.width / 6);
    // The controls are no use below the fold, so assert them explicitly
    // rather than inferring it from the page height.
    const tools = D.querySelector(".bar.tools")?.getBoundingClientRect();
    res.toolsBottom = tools ? Math.round(tools.bottom) : null;
    res.toolsBelowFold = !!(tools && tools.bottom > window.innerHeight + 1);
  } catch (e) { res.error = e.message; }
  return res;
})()`;

/** Where the door's INK actually is: the page diffed against itself with the
    door layer hidden. A DOM rect knows nothing about how far a box-shadow
    stays visible — and nothing about where a gradient fades out either, which
    is the direction that cries wolf: neon's `neon-spill` box overlaps the
    "Best —" text by 18px while its paint has faded to nothing long before. */
function doorInk(withDoor, without) {
  const a = readPNG(withDoor), b = readPNG(without);
  if (a.w !== b.w || a.h !== b.h) throw new Error("screenshot size changed mid-measure");
  let L = Infinity, R = -Infinity, T = Infinity, B = -Infinity;
  const hit = new Set();
  for (let y = 0; y < a.h; y++) {
    for (let x = 0; x < a.w; x++) {
      const ia = (y * a.w + x) * a.ch, ib = (y * b.w + x) * b.ch;
      // 6 absorbs PNG/AA jitter; real door paint is far above it.
      if (Math.abs(a.data[ia] - b.data[ib]) <= 6 &&
          Math.abs(a.data[ia + 1] - b.data[ib + 1]) <= 6 &&
          Math.abs(a.data[ia + 2] - b.data[ib + 2]) <= 6) continue;
      if (x < L) L = x; if (x > R) R = x;
      if (y < T) T = y; if (y > B) B = y;
      hit.add(y * a.w + x);
    }
  }
  return {
    empty: R < 0, L, R, T, B, w: a.w, h: a.h,
    touches: boxes => boxes.some(r => {
      for (let y = Math.max(0, r.top); y < Math.min(a.h, r.bottom); y++) {
        for (let x = Math.max(0, r.left); x < Math.min(a.w, r.right); x++) {
          if (hit.has(y * a.w + x)) return true;
        }
      }
      return false;
    }),
  };
}

await mkdir(OUT, { recursive: true });

const chrome = await launch();
const url = pathToFileURL(join(ROOT, "index.html")).href;
const rows = [];

try {
  for (const [vw, vh] of VIEWPORTS) {
    /* mobile:false deliberately. Under mobile emulation Chrome WIDENS the
       layout viewport to fit horizontal overflow, so a door overrunning a
       320px screen came back as innerWidth 324 or 330 instead of as a clipped
       door — it hid the exact failure this script exists to catch. With it off
       the viewport is fixed and overflow clips, which is what
       `html{overflow-x:clip}` does on the phone. Nothing is lost: index.html
       has no width-, pointer- or hover-based media queries at all. */
    const page = await chrome.page({ width: vw, height: vh, mobile: false });
    try {
      await page.goto(url);
      // The tin is packed across frames, so no fixed delay is safe.
      if (!await page.waitFor(`document.querySelectorAll(".fish").length > 0`)) {
        for (const skin of SKINS) for (const row of ROWS) {
          rows.push({ vw, skin, row, error: "board never appeared" });
        }
        continue;
      }
      for (const skin of SKINS) {
        for (const row of ROWS) {
          const g = await page.json(SETUP(skin, row));
          if (g.error) { rows.push({ vw, ...g }); continue; }
          const shown = await page.screenshot();
          await page.evaluate(`document.getElementById("door").style.visibility = "hidden"`);
          const hidden = await page.screenshot();
          await page.evaluate(`document.getElementById("door").style.visibility = ""`);
          const ink = doorInk(shown, hidden);
          const r = {
            vw, ...g,
            // All four measured from paint, so a gradient that has faded to
            // nothing stops counting where it stops being visible.
            rightOfOil: ink.empty ? null : ink.R - g.oil.right,
            aboveOil:   ink.empty ? null : g.oil.top - ink.T,
            belowOil:   ink.empty ? null : ink.B - g.oil.bottom,
            roomToEdge: g.innerWidth - g.oil.right,
            /* Paint REACHING the viewport's last column is the amputation
               signature, not paint past it: `html{overflow-x:clip}` stops an
               overrun dead, so the lost pixels were never drawn and cannot be
               measured. Touching column innerWidth-1 is the tell. */
            clipped: !ink.empty && ink.R >= g.innerWidth - 1,
            clippedBy: ink.empty ? 0 : Math.max(0, ink.R - (g.innerWidth - 1)),
            hitsDate:   ink.touches(g.dateInk),
            hitsBar:    ink.touches(g.barInk),
          };
          rows.push(r);
          if (SHOT) {
            await writeFile(join(OUT, `sc-${vw}x${vh}-${skin}-${row}.png`), shown);
          }
        }
      }
    } finally { await page.close(); }
  }
} finally { await chrome.close(); }

/* THE ONE DOCUMENTED ALLOWANCE. At 320px — the smallest phones still in use —
   deco loses ~4px off the outer edge of its winding key and neon ~10px of
   outer glow. That was measured when the door gutter was derived, and both
   remaining levers (a smaller cell floor, or an off-centre tin) were judged
   worse. The metal fits; it is the glow and the key's rim that go. So it is
   allowed here rather than silently passing: the rows are printed as ALLOW,
   and anything at 360 or above is still a hard failure. */
const allowedClip = r => r.vw === 320 && (r.skin === "deco" || r.skin === "neon");

let bad = 0, allowed = 0;
console.log("vw    skin     row  cell  right  above  below  edge  clip  date  bar  scroll  tools");
for (const r of rows) {
  if (r.error) { console.log(`${r.vw} ${r.skin} ${r.row}  ERROR ${r.error}`); bad++; continue; }
  if (r.innerWidth !== r.vw) {
    console.log(`${r.vw} ${r.skin} ${r.row}  BAD METHOD innerWidth=${r.innerWidth}`); bad++; continue;
  }
  /* `scrolls` is reported but is NOT a failure. The page is taller than a
     short viewport on purpose — How to play and the footer live below the
     fold, and at 320x568 that is 90px of deliberate content. The promise in
     CLAUDE.md is that the BOARD fits above the fold, so what has to hold is
     that the tin and its controls are reachable without scrolling: that is
     `toolsBelowFold`. Failing on `scrolls` would red-light the footer forever. */
  /* Above the fold is now a promise in BOTH orientations. It used not to be:
     stacked in one column the arithmetic sideways could not close, and the
     controls sat 272px below the fold. Since landscape lays the board out
     beside the controls instead of above them, there is no longer any reason
     to exempt it, so it is held to the same line as portrait. */
  const amputated = r.clipped || r.sideways;
  const foldBroken = r.toolsBelowFold;
  const allow = amputated && allowedClip(r)
    && !r.hitsDate && !r.hitsBar && !foldBroken;
  const fail = !allow && (amputated || r.hitsDate || r.hitsBar || foldBroken);
  if (fail) bad++;
  if (allow) allowed++;
  // A null reading means the door layer painted nothing at all at this row —
  // legitimate for a skin whose lid is entirely inside the oil.
  const n = (v, w) => String(v === null ? "·" : v).padStart(w);
  console.log(
    `${String(r.vw).padEnd(5)} ${r.skin.padEnd(8)} ${r.row}    ${String(r.cell).padEnd(4)} ` +
    `${n(r.rightOfOil, 5)} ${n(r.aboveOil, 6)} ${n(r.belowOil, 6)} ` +
    `${n(r.roomToEdge, 5)} ${n(r.clippedBy, 5)} ` +
    `${String(r.hitsDate).padStart(5)} ${String(r.hitsBar).padStart(5)} ` +
    `${String(r.scrolls).padStart(6)} ${String(r.toolsBelowFold).padStart(6)}` +
    (fail ? "   <-- FAIL" : allow ? "   <-- ALLOW (320px residual, on record)" : ""));
}
const note = allowed ? ` ${allowed} allowed 320px rows (deco/neon residual, on record).` : "";
console.log(bad
  ? `\n${bad} of ${rows.length} failing.${note}`
  : `\nAll ${rows.length} checks pass: no amputation, no collision, controls reachable.${note}`);
process.exit(bad ? 1 : 0);
