#!/usr/bin/env node
/**
 * fit/door-budget.mjs — does door() stay inside the room layout() can promise?
 *
 * validate.mjs checks everything about a door except the thing that gets it
 * amputated: how far it paints. A footprint is emergent — CSS position, SVG
 * overflow, stroke width, a gradient that fades out somewhere, a box-shadow
 * glow — so it is measured the only way that cannot be argued with: paint the
 * door on a flat page beside a bare oil rectangle, screenshot, and find the
 * outermost pixel that is not the page background.
 *
 * (getBoundingClientRect() is not enough: on an SVG shape it is the geometry
 * box with no stroke, it counts the whole box of a gradient that fades to
 * transparent, and it says nothing about how far a box-shadow is actually
 * visible. All three were off by 5-40px on the designs in this folder.)
 *
 * THE BUDGET, derived from layout():
 *   avail = min(innerWidth - K, 372);  cell = clamp(38, 58, floor(avail/6))
 *   tin   = 6*cell + 22 (11px rim a side), centred in a body with 16px padding
 *   room right of the oil = 27 + (innerWidth - 54 - 6*cell)/2
 *   Unclamped, innerWidth - K - 6*cell lands in [0,6), so that room has a floor
 *   of 27 + (K - 54)/2 no matter the cell size:  K=74 -> 37px,  K=120 -> 60px.
 * Vertically nothing is clipped (overflow-x:clip clips one axis), but the tin's
 * neighbours sit 13px away past the 11px rim, so more than 24px above or below
 * the oil lands on the date line or on the Moves/Best row.
 *
 *   node fit/door-budget.mjs               check designs/
 *   node fit/door-budget.mjs --self-test   prove the check actually fires
 */
import { readFile, writeFile, readdir, mkdir } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { readPNG } from "./png.mjs";
const run = promisify(execFile);
const HERE = dirname(fileURLToPath(import.meta.url)), SP = join(HERE, "..");
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

export const BUDGET = { right: 60, top: 24, bottom: 24 };  // px past the oil's edge
const CELLS = [38, 58], ROWS = [0, 2, 5];                  // extremes are where doors flip
const BG = [0xfd, 0xf6, 0xe9], THRESH = 6;                 // page cream, "visible" delta
const SLOT_W = 560, SLOT_H = 560, MARGIN = 100, REACH = 150;

const SELFTEST = process.argv.includes("--self-test");
const slugs = (await readdir(join(SP, "designs"))).filter(f => f.endsWith(".js")).map(f => f.slice(0, -3)).sort();
const sources = {};
for (const s of slugs) sources[s] = await readFile(join(SP, "designs", s + ".js"), "utf8");
if (SELFTEST) {
  slugs.push("zz-toowide");
  sources["zz-toowide"] = `DESIGNS["zz-toowide"]={name:"Too Wide",blurb:"deliberately over budget",
    css:".dz-zz-toowide .tw{position:absolute;left:100%;top:var(--top);width:80px;height:var(--cell);background:#c33}",
    door(){return '<div class="tw"></div>'}, sprat(){return '<svg class="art"></svg>'}};`;
}

await mkdir(join(HERE, "out"), { recursive: true });
const W_PAGE = MARGIN * 2 + SLOT_W * ROWS.length, H_PAGE = MARGIN * 2 + SLOT_H * CELLS.length;
const results = [];
for (const slug of slugs) {
  const page = `<!doctype html><meta charset="utf-8"><style>
*{box-sizing:border-box;margin:0;padding:0}
html,body{background:#fdf6e9}
body{width:${W_PAGE}px;height:${H_PAGE}px;overflow:hidden;position:relative}
.case{position:absolute}
.tin-inner{position:relative;background:linear-gradient(160deg,#f0bd6d,#dc9c44)}
.doorlayer{position:absolute;inset:0;pointer-events:none}
</style><body><div id="stage"></div>
<script>const DESIGNS={};const W=6,H=6;</script>
<script>
${sources[slug]}
</script>
<script>
const d=DESIGNS[${JSON.stringify(slug)}];
if(d.css){const s=document.createElement("style");s.textContent=d.css;document.head.append(s)}
/* the tin's frame and its drop-shadow exist with or without a door; measure the
   door alone, against a bare oil rectangle. */
document.body.classList.add("dz-"+${JSON.stringify(slug)});
const st=document.createElement("style");
st.textContent=".tin{box-shadow:none!important;background:none!important}";
document.head.append(st);
const stage=document.getElementById("stage");
${JSON.stringify(CELLS)}.forEach((cell,ci)=>${JSON.stringify(ROWS)}.forEach((row,ri)=>{
  const wrap=document.createElement("div");wrap.className="case";
  wrap.style.left=(${MARGIN}+ri*${SLOT_W})+"px"; wrap.style.top=(${MARGIN}+ci*${SLOT_H})+"px";
  const inner=document.createElement("div");inner.className="tin-inner";
  inner.style.width=6*cell+"px";inner.style.height=6*cell+"px";
  const l=document.createElement("div");l.className="doorlayer";
  l.style.setProperty("--cell",cell+"px");l.style.setProperty("--row",row);
  l.style.setProperty("--top",row*cell+"px");
  l.innerHTML=d.door?d.door({cell,W:6,H:6,row}):"";
  inner.append(l);wrap.append(inner);stage.append(wrap);
}));
</script>`;
  const html = join(HERE, "out", `budget-${slug}.html`), png = join(HERE, "out", `budget-${slug}.png`);
  await writeFile(html, page);
  await run(CHROME, ["--headless", "--disable-gpu", "--hide-scrollbars", "--force-color-profile=srgb",
    "--virtual-time-budget=1800", "--screenshot=" + png, `--window-size=${W_PAGE},${H_PAGE}`, "file://" + html],
    { maxBuffer: 1 << 26 }).catch(e => { if (e.code && !e.stdout) throw e; });
  const img = readPNG(await readFile(png));
  if (img.w !== W_PAGE || img.h !== H_PAGE) throw new Error(`shot ${img.w}x${img.h} != ${W_PAGE}x${H_PAGE}`);
  const painted = (x, y) => {
    if (x < 0 || y < 0 || x >= img.w || y >= img.h) return false;
    const i = (y * img.w + x) * img.ch;
    return Math.abs(img.data[i] - BG[0]) > THRESH || Math.abs(img.data[i+1] - BG[1]) > THRESH
        || Math.abs(img.data[i+2] - BG[2]) > THRESH;
  };
  CELLS.forEach((cell, ci) => ROWS.forEach((row, ri) => {
    const oilL = MARGIN + ri * SLOT_W, oilT = MARGIN + ci * SLOT_H;
    const oilR = oilL + 6 * cell, oilB = oilT + 6 * cell;
    let R = 0, T = 0, B = 0;
    for (let y = oilT - REACH; y < oilB + REACH; y++) {
      for (let x = oilR + REACH; x >= oilR; x--) if (painted(x, y)) { R = Math.max(R, x + 1 - oilR); break; }
      let any = false;
      for (let x = oilL - REACH; x < oilR + REACH; x++) if (painted(x, y)) { any = true; break; }
      if (any) { T = Math.max(T, oilT - y); B = Math.max(B, y + 1 - oilB); }
    }
    results.push({ slug, cell, row, R, T, B });
  }));
}

let bad = 0;
for (const slug of slugs) {
  const rs = results.filter(r => r.slug === slug);
  const pick = k => rs.reduce((a, b) => b[k] > a[k] ? b : a);
  const wR = pick("R"), wT = pick("T"), wB = pick("B");
  const fail = [];
  if (wR.R > BUDGET.right)
    fail.push(`paints ${wR.R}px right of the oil (budget ${BUDGET.right}) at cell ${wR.cell}, hero row ${wR.row}. layout() never leaves more, and html{overflow-x:clip} cuts the rest off silently.`);
  if (wT.T > BUDGET.top)
    fail.push(`paints ${wT.T}px above the oil (budget ${BUDGET.top}) at cell ${wT.cell}, hero row ${wT.row}. It lands on the date line.`);
  if (wB.B > BUDGET.bottom)
    fail.push(`paints ${wB.B}px below the oil (budget ${BUDGET.bottom}) at cell ${wB.cell}, hero row ${wB.row}. It lands on the Moves/Best row.`);
  if (fail.length) bad++;
  console.log(`${fail.length ? "✗" : "✓"} ${slug.padEnd(11)} right ${String(wR.R).padStart(3)}   above ${String(wT.T).padStart(3)}   below ${String(wB.B).padStart(3)}`);
  for (const f of fail) console.log("    FAIL  door " + f);
}
console.log(bad ? `\n${bad} design(s) over the door budget.` : `\nEvery door fits the ${BUDGET.right}/${BUDGET.top}/${BUDGET.bottom}px budget.`);
if (SELFTEST) {
  const caught = results.some(r => r.slug === "zz-toowide" && r.R > BUDGET.right);
  console.log(caught ? "\nself-test: the 80px door was caught. The check fires."
                     : "\nself-test: FAILED — the 80px door slipped through.");
  process.exit(caught ? 0 : 1);
}
process.exit(bad ? 1 : 0);
