#!/usr/bin/env node
/**
 * fit/probe.mjs — WHICH element in a door paints out of bounds?
 *
 * door-budget.mjs says a door is 20px over; it does not say what is over. This
 * renders the same flat page, but paints ONE leaf element of the door at a time
 * (visibility:hidden on the layer, visibility:visible on the one element and its
 * ancestors) and reports each element's own footprint past the oil.
 *
 *   node fit/probe.mjs plush 0        # hero row 0, worst cell (58)
 *   node fit/probe.mjs neon 5 38
 */
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { readPNG } from "./png.mjs";
const run = promisify(execFile);
const HERE = dirname(fileURLToPath(import.meta.url)), SP = join(HERE, "..");
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

const slug = process.argv[2] || "plush";
const row = Number(process.argv[3] ?? 0);
const cell = Number(process.argv[4] ?? 58);
const src = await readFile(join(SP, "designs", slug + ".js"), "utf8");

const SLOT = 700, MARGIN = 120, COLS = 5, REACH = 120;
const BG = [0xfd, 0xf6, 0xe9], THRESH = 6;

// pass 1: how many leaves are there, and what are they called?
const listPage = mk(src, slug, row, cell, 0, 0, true);
await mkdir(join(HERE, "out"), { recursive: true });
const lp = join(HERE, "out", `probe-${slug}-list.html`);
await writeFile(lp, listPage);
const { stdout } = await run(CHROME, ["--headless", "--disable-gpu", "--dump-dom",
  "--virtual-time-budget=1200", "file://" + lp], { maxBuffer: 1 << 26 });
const names = JSON.parse(stdout.match(/<pre id="names">([\s\S]*?)<\/pre>/)[1]
  .replace(/&quot;/g, '"').replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">"));

const rows = Math.ceil(names.length / COLS);
const W = MARGIN * 2 + SLOT * COLS, H = MARGIN * 2 + SLOT * rows;
const page = mk(src, slug, row, cell, MARGIN, SLOT, false, names.length, COLS, W, H);
const hp = join(HERE, "out", `probe-${slug}.html`), pp = join(HERE, "out", `probe-${slug}.png`);
await writeFile(hp, page);
await run(CHROME, ["--headless", "--disable-gpu", "--hide-scrollbars", "--force-color-profile=srgb",
  "--virtual-time-budget=1800", "--screenshot=" + pp, `--window-size=${W},${H}`, "file://" + hp],
  { maxBuffer: 1 << 26 }).catch(e => { if (e.code && !e.stdout) throw e; });
const img = readPNG(await readFile(pp));
const painted = (x, y) => {
  if (x < 0 || y < 0 || x >= img.w || y >= img.h) return false;
  const i = (y * img.w + x) * img.ch;
  return Math.abs(img.data[i] - BG[0]) > THRESH || Math.abs(img.data[i+1] - BG[1]) > THRESH
      || Math.abs(img.data[i+2] - BG[2]) > THRESH;
};
console.log(`${slug}  hero row ${row}  cell ${cell}   (budget: right 60, above 24, below 24)\n`);
const out = [];
names.forEach((n, i) => {
  const c = i % COLS, r = (i / COLS) | 0;
  const oilL = MARGIN + c * SLOT, oilT = MARGIN + r * SLOT;
  const oilR = oilL + 6 * cell, oilB = oilT + 6 * cell;
  let R = 0, T = 0, B = 0;
  for (let y = oilT - REACH; y < oilB + REACH; y++) {
    for (let x = oilR + REACH; x >= oilR; x--) if (painted(x, y)) { R = Math.max(R, x + 1 - oilR); break; }
    let any = false;
    for (let x = oilL - REACH; x < oilR + REACH; x++) if (painted(x, y)) { any = true; break; }
    if (any) { T = Math.max(T, oilT - y); B = Math.max(B, y + 1 - oilB); }
  }
  out.push({ n, R, T, B });
});
out.sort((a, b) => Math.max(b.T, b.B) - Math.max(a.T, a.B));
for (const o of out) {
  const flag = (o.T > 24 || o.B > 24 || o.R > 60) ? " <<<" : "";
  console.log(`  right ${String(o.R).padStart(3)}  above ${String(o.T).padStart(3)}  below ${String(o.B).padStart(3)}   ${o.n}${flag}`);
}

function mk(src, slug, row, cell, margin, slot, listOnly, n = 1, cols = 1, W = 400, H = 400) {
  return `<!doctype html><meta charset="utf-8"><style>
*{box-sizing:border-box;margin:0;padding:0}
html,body{background:#fdf6e9}
body{width:${W}px;height:${H}px;overflow:hidden;position:relative}
.case{position:absolute}
.tin-inner{position:relative;background:linear-gradient(160deg,#f0bd6d,#dc9c44)}
.doorlayer{position:absolute;inset:0;pointer-events:none}
</style><body><div id="stage"></div><pre id="names"></pre>
<script>const DESIGNS={};const W=6,H=6;</script>
<script>${src}</script>
<script>
const d=DESIGNS[${JSON.stringify(slug)}];
if(d.css){const s=document.createElement("style");s.textContent=d.css;document.head.append(s)}
document.body.classList.add("dz-"+${JSON.stringify(slug)});
const st=document.createElement("style");
st.textContent=".tin{box-shadow:none!important;background:none!important}";
document.head.append(st);
const cell=${cell}, row=${row};
function build(){
  const wrap=document.createElement("div");wrap.className="case";
  const inner=document.createElement("div");inner.className="tin-inner";
  inner.style.width=6*cell+"px";inner.style.height=6*cell+"px";
  const l=document.createElement("div");l.className="doorlayer";
  l.style.setProperty("--cell",cell+"px");l.style.setProperty("--row",row);
  l.style.setProperty("--top",row*cell+"px");
  l.innerHTML=d.door?d.door({cell,W:6,H:6,row}):"";
  inner.append(l);wrap.append(inner);
  return {wrap,l};
}
function leaves(root){
  const out=[];
  root.querySelectorAll("*").forEach(e=>{
    if(e.tagName==="defs"||e.closest("defs"))return;
    if(e.children.length===0)out.push(e);
  });
  return out;
}
function label(e){
  let s=e.tagName.toLowerCase();
  if(e.getAttribute&&e.getAttribute("class"))s+="."+String(e.getAttribute("class")).trim().replace(/\\s+/g,".");
  const d=e.getAttribute&&(e.getAttribute("d")||e.getAttribute("cx")||e.getAttribute("x")||"");
  if(d)s+=" ["+String(d).slice(0,34)+"]";
  return s;
}
const probe=build();
const ls=leaves(probe.l);
if(${listOnly}){
  document.getElementById("names").textContent=JSON.stringify(ls.map(label));
}else{
  document.getElementById("names").remove();
  const stage=document.getElementById("stage");
  for(let i=0;i<ls.length;i++){
    const {wrap,l}=build();
    wrap.style.left=(${margin}+(i%${cols})*${slot})+"px";
    wrap.style.top=(${margin}+Math.floor(i/${cols})*${slot})+"px";
    stage.append(wrap);
    const mine=leaves(l);
    l.style.visibility="hidden";
    l.querySelectorAll("*").forEach(e=>{e.style.visibility="hidden"});
    let e=mine[i];
    while(e&&e!==l){ e.style.visibility="visible"; e=e.parentElement||e.parentNode; }
  }
}
</script>`;
}
