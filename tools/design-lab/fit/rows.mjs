#!/usr/bin/env node
/**
 * fit/rows.mjs — the door-budget measurement, but for EVERY hero row.
 *
 * door-budget.mjs samples rows 0, 2 and 5, which is where doors flip and so
 * where they break. This is the same measurement over all six rows and both
 * cell sizes, for spot-checking a door whose shape is row-dependent — the row
 * next to an extreme (1, 4) is the one a flip rule can get wrong.
 *
 *   node fit/rows.mjs            every design
 *   node fit/rows.mjs plush neon
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

const BUDGET = { right: 60, top: 24, bottom: 24 };  // must match door-budget.mjs
const CELLS = [38, 58], ROWS = [0, 1, 2, 3, 4, 5];
const BG = [0xfd, 0xf6, 0xe9], THRESH = 6;
const SLOT_W = 560, SLOT_H = 560, MARGIN = 100, REACH = 150;

let slugs = process.argv.slice(2);
if (!slugs.length)
  slugs = (await readdir(join(SP, "designs"))).filter(f => f.endsWith(".js")).map(f => f.slice(0, -3)).sort();

await mkdir(join(HERE, "out"), { recursive: true });
const W_PAGE = MARGIN * 2 + SLOT_W * ROWS.length, H_PAGE = MARGIN * 2 + SLOT_H * CELLS.length;
for (const slug of slugs) {
  const src = await readFile(join(SP, "designs", slug + ".js"), "utf8");
  const page = `<!doctype html><meta charset="utf-8"><style>
*{box-sizing:border-box;margin:0;padding:0}
html,body{background:#fdf6e9}
body{width:${W_PAGE}px;height:${H_PAGE}px;overflow:hidden;position:relative}
.case{position:absolute}
.tin-inner{position:relative;background:linear-gradient(160deg,#f0bd6d,#dc9c44)}
.doorlayer{position:absolute;inset:0;pointer-events:none}
</style><body><div id="stage"></div>
<script>const DESIGNS={};const W=6,H=6;</script>
<script>${src}</script>
<script>
const d=DESIGNS[${JSON.stringify(slug)}];
if(d.css){const s=document.createElement("style");s.textContent=d.css;document.head.append(s)}
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
  const html = join(HERE, "out", `rows-${slug}.html`), png = join(HERE, "out", `rows-${slug}.png`);
  await writeFile(html, page);
  await run(CHROME, ["--headless", "--disable-gpu", "--hide-scrollbars", "--force-color-profile=srgb",
    "--virtual-time-budget=1800", "--screenshot=" + png, `--window-size=${W_PAGE},${H_PAGE}`, "file://" + html],
    { maxBuffer: 1 << 26 }).catch(e => { if (e.code && !e.stdout) throw e; });
  const img = readPNG(await readFile(png));
  const painted = (x, y) => {
    if (x < 0 || y < 0 || x >= img.w || y >= img.h) return false;
    const i = (y * img.w + x) * img.ch;
    return Math.abs(img.data[i] - BG[0]) > THRESH || Math.abs(img.data[i+1] - BG[1]) > THRESH
        || Math.abs(img.data[i+2] - BG[2]) > THRESH;
  };
  const line = [];
  let worst = 0;
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
    const over = R > BUDGET.right || T > BUDGET.top || B > BUDGET.bottom;
    if (over) worst++;
    line.push(`  cell ${cell} row ${row}:  right ${String(R).padStart(3)}  above ${String(T).padStart(3)}  below ${String(B).padStart(3)}${over ? "  <<< OVER" : ""}`);
  }));
  console.log(`${worst ? "✗" : "✓"} ${slug}`);
  for (const l of line) console.log(l);
}
