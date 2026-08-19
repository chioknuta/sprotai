#!/usr/bin/env node
/**
 * fit/ship-check.mjs — the acceptance test for the shipped skins.
 *
 * Loads the REAL index.html at real phone viewports, switches through every
 * skin the game actually ships using the game's own `applySkin()`, and asks
 * the three questions that decide whether this change is safe:
 *
 *   1. Is the door amputated? `html{overflow-x:clip}` means an overrunning lid
 *      does not scroll, it stops dead — so paint touching the viewport's last
 *      column is the signature. Measured from rendered pixels, not DOM rects,
 *      because a rect knows nothing about how far a box-shadow is visible.
 *   2. Does the door land on the furniture? The date line sits above the tin
 *      and the Moves/Best row below it; the lid draws outside the oil at hero
 *      rows 0 and 5.
 *   3. Does the page still fit above the fold, with no scrolling?
 *
 * Headless `--dump-dom` ignores `--window-size`, so the page under test lives
 * in an iframe sized in CSS pixels — inside it `window.innerWidth` really is
 * the width asked for, which the script asserts before trusting a number.
 *
 *   node fit/ship-check.mjs [--shot]
 */
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const run = promisify(execFile);
const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..", "..", "..");
const OUT = join(HERE, "out");
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const SHOT = process.argv.includes("--shot");

const WIDTHS = [320, 360, 375, 390, 412, 430];
const HEIGHTS = { 320: 568, 360: 780, 375: 667, 390: 844, 412: 915, 430: 932 };
const SKINS = ["classic", "deco", "neon", "plush"];

await mkdir(OUT, { recursive: true });

const rows = [];
for (const vw of WIDTHS) {
  const vh = HEIGHTS[vw];
  for (const skin of SKINS) {
    // Hero row 0 and 5 are where the lid draws past the top and bottom of the
    // oil; the default board rarely puts her there, so force each.
    for (const row of [0, 2, 5]) {
      const page = `<!doctype html><meta charset="utf-8"><style>
        html,body{margin:0;background:#888}
        iframe{width:${vw}px;height:${vh}px;border:0;display:block}
      </style>
      <iframe id="f" src="${pathToFileURL(join(ROOT, "index.html")).href}"></iframe>
      <pre id="out">pending</pre>
      <script>
      const f = document.getElementById("f");
      /* The tin is packed across frames now, so no fixed delay is safe —
         poll until a board actually exists, then measure. */
      let tries = 0;
      const ready = () => {
        try { const w = f.contentWindow;
          // NOT w.fish -- that binding is script-scoped and never on window.
          return w && w.document && w.document.querySelectorAll(".fish").length > 0; }
        catch { return false; }
      };
      const tick = () => {
        if (ready()) return measure();
        if (++tries > 150) {
          document.getElementById("out").textContent = "R" + JSON.stringify(
            { vw, skin: ${JSON.stringify(skin)}, row: ${row}, error: "board never appeared" });
          return;
        }
        setTimeout(tick, 20);
      };
      setTimeout(tick, 20);
      /* index.html is a classic script, so its top-level let-bindings (fish,
         cell, off) live in script scope and are NOT properties of window --
         frame.contentWindow.fish is undefined. The measuring code therefore
         has to run INSIDE the frame, where those bindings are in scope. */
      function measure(){
        const w = f.contentWindow, D = w.document;
        const pre = D.createElement("pre"); pre.id = "probe"; D.body.append(pre);
        const s = D.createElement("script");
        s.textContent = "(" + inner.toString() + ")(" + JSON.stringify(${JSON.stringify(skin)}) + "," + ${row} + "," + vw + ");";
        D.body.append(s);
        document.getElementById("out").textContent = "R" + (pre.textContent || '{"error":"probe silent"}');
      }
      function inner(skin, row, vw){
        const res = { vw, skin, row };
        try {
          res.innerWidth = window.innerWidth;          // must equal vw or nothing counts
          applySkin(skin);
          fish[0].r = row;                              // put her on the row under test
          build();
          layout();
          const D = document;
          const oil = D.getElementById("tin").getBoundingClientRect();
          const door = D.getElementById("door");
          // Union of every painted leaf in the door layer.
          let L = Infinity, R = -Infinity, T = Infinity, B = -Infinity;
          for (const el of door.querySelectorAll("*")) {
            const r = el.getBoundingClientRect();
            if (!r.width && !r.height) continue;
            L = Math.min(L, r.left); R = Math.max(R, r.right);
            T = Math.min(T, r.top);  B = Math.max(B, r.bottom);
          }
          res.rightOfOil  = Math.round(R - oil.right);
          res.aboveOil    = Math.round(oil.top - T);
          res.belowOil    = Math.round(B - oil.bottom);
          res.roomToEdge  = Math.round(window.innerWidth - oil.right);
          res.clippedBy   = Math.max(0, Math.round(R - window.innerWidth));
          // furniture the lid could land on
          const date  = D.getElementById("dailyhead")?.getBoundingClientRect();
          const bar   = D.querySelector(".bar")?.getBoundingClientRect();
          res.hitsDate = !!(date && date.height && T < date.bottom && R > date.left && L < date.right);
          res.hitsBar  = !!(bar && bar.height && B > bar.top && R > bar.left && L < bar.right);
          // fold
          res.pageH = D.documentElement.scrollHeight;
          res.viewH = window.innerHeight;
          res.scrolls = D.documentElement.scrollHeight > window.innerHeight + 1;
          res.sideways = D.documentElement.scrollWidth > window.innerWidth + 1;
          res.cell = Math.round(D.getElementById("tin").getBoundingClientRect().width / 6);
        } catch (e) { res.error = e.message; }
        document.getElementById("probe").textContent = JSON.stringify(res);
      }
      </script>`;
      const p = join(OUT, `sc-${vw}-${skin}-${row}.html`);
      await writeFile(p, page);
      const args = ["--headless=new", "--disable-gpu", "--hide-scrollbars",
        "--allow-file-access-from-files", "--virtual-time-budget=60000",
        "--dump-dom", "--window-size=1200,1400", pathToFileURL(p).href];
      const { stdout } = await run(CHROME, args, { maxBuffer: 1 << 28 });
      const m = stdout.match(/R(\{[\s\S]*?\})<\/pre>/);
      if (!m) { rows.push({ vw, skin, row, error: "no reading" }); continue; }
      const txt = m[1].replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"');
      rows.push(JSON.parse(txt));
    }
  }
}

let bad = 0;
console.log("vw   skin     row  cell  right  above  below  edge  clip  date  bar   scroll");
for (const r of rows) {
  if (r.error) { console.log(`${r.vw} ${r.skin} ${r.row}  ERROR ${r.error}`); bad++; continue; }
  if (r.innerWidth !== r.vw) { console.log(`${r.vw} ${r.skin} ${r.row}  BAD METHOD innerWidth=${r.innerWidth}`); bad++; continue; }
  const fail = r.clippedBy > 0 || r.hitsDate || r.hitsBar || r.scrolls || r.sideways;
  if (fail) bad++;
  console.log(
    `${String(r.vw).padEnd(4)} ${r.skin.padEnd(8)} ${r.row}    ${String(r.cell).padEnd(4)} ` +
    `${String(r.rightOfOil).padStart(5)} ${String(r.aboveOil).padStart(6)} ${String(r.belowOil).padStart(6)} ` +
    `${String(r.roomToEdge).padStart(5)} ${String(r.clippedBy).padStart(5)} ` +
    `${String(r.hitsDate).padStart(5)} ${String(r.hitsBar).padStart(5)} ${String(r.scrolls).padStart(6)}` +
    (fail ? "   <-- FAIL" : ""));
}
console.log(bad ? `\n${bad} of ${rows.length} failing.` : `\nAll ${rows.length} checks pass: no amputation, no collision, no scroll.`);
process.exit(bad ? 1 : 0);
