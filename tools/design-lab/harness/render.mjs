#!/usr/bin/env node
/**
 * Design lab renderer.
 *
 *   node harness/render.mjs <slug> [<slug>...]   → out/<slug>.png  (+ .html)
 *   node harness/render.mjs all                  → out/all.png
 *
 * Loads each designs/<slug>.js, drops it into a page that lays out a REAL tin
 * exactly the way index.html does (same cell size, same .rot wrapper, same
 * SPIN transforms), then screenshots it with headless Chrome so a designer can
 * look at what they actually drew.
 */
import { readFile, writeFile, readdir } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const run = promisify(execFile);
const HERE = dirname(fileURLToPath(import.meta.url));
const SP = join(HERE, "..");
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

let slugs = process.argv.slice(2).filter(a => !a.startsWith("--"));
const all = slugs[0] === "all" || slugs.length === 0;
if (all) {
  slugs = (await readdir(join(SP, "designs"))).filter(f => f.endsWith(".js")).map(f => f.slice(0, -3)).sort();
}
if (!slugs.length) { console.error("no designs found in designs/"); process.exit(1); }

const files = [];
for (const s of slugs) {
  files.push(await readFile(join(SP, "designs", s + ".js"), "utf8"));
}

const TIN = JSON.parse(await readFile(join(HERE, "tin.json"), "utf8"));

const page = `<!doctype html><meta charset="utf-8">
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{
    background:radial-gradient(120% 70% at 50% 0%, #fffaf0 0%, #fdf6e9 70%);
    color:#4a3520; padding:26px 30px 40px;
    font:400 15px/1.5 ui-rounded,"SF Pro Rounded",-apple-system,"Segoe UI",Roboto,sans-serif;
  }
  h2{font-size:19px; font-weight:800; letter-spacing:.02em}
  h2 em{font-style:normal; font-weight:500; font-size:14px; color:#a08a68; margin-left:9px}
  section{margin-bottom:34px}
  .row{display:flex; align-items:flex-start; gap:46px; margin-top:14px}
  .cap{font-size:11px; letter-spacing:.06em; text-transform:uppercase; color:#bda882; margin-bottom:7px}

  /* --- the tin: identical geometry to index.html --- */
  .tin{
    position:relative; padding:11px; border-radius:20px; width:max-content;
    background:linear-gradient(145deg,#f2f4f7,#b9c0c9 45%,#dfe3e9 60%,#aeb5bd);
    box-shadow:0 12px 26px #c9a06033, inset 0 1px 0 #fff;
  }
  .tin-inner{
    position:relative; border-radius:10px;
    background:linear-gradient(160deg,#f0bd6d,#dc9c44);
    box-shadow:inset 0 2px 10px #00000026;
  }
  .clip{position:absolute; inset:0; border-radius:10px; overflow:hidden}
  .grid i{position:absolute; background:#00000010}
  .grid i.h{left:0; right:0; height:1px}
  .grid i.v{top:0; bottom:0; width:1px}
  .doorlayer{position:absolute; inset:0; pointer-events:none}
  .fish{position:absolute; border:0; padding:0; background:none}
  .rot{position:absolute; left:50%; top:50%; transform-origin:center center}
  .art{width:100%; height:100%; display:block; overflow:visible}

  /* --- the silhouette strip: one of each at board scale and small --- */
  .strip{display:flex; flex-direction:column; gap:12px}
  .swatch{position:relative}
  .swatch .rot{position:static; transform:none !important; margin:0 !important}
</style>
<body>
<div id="lab"></div>
<script>
const DESIGNS = {};
const TIN = ${JSON.stringify(TIN)};
const SPIN = { R:"", L:"scaleX(-1)", D:"rotate(90deg)", U:"rotate(-90deg)" };
const W = 6, H = 6;
</script>
${files.map(f => "<script>\n" + f + "\n</script>").join("\n")}
<script>
const horiz = f => f.dir === "R" || f.dir === "L";
function tinEl(design, tin, cell){
  const wrap = document.createElement("div");
  wrap.className = "tin";
  const inner = document.createElement("div");
  inner.className = "tin-inner";
  inner.style.width = W*cell+"px"; inner.style.height = H*cell+"px";
  const clip = document.createElement("div"); clip.className = "clip";
  const grid = document.createElement("div"); grid.className = "grid";
  for (let r=1;r<H;r++){ const i=document.createElement("i"); i.className="h"; i.style.top=r*cell+"px"; grid.append(i); }
  for (let c=1;c<W;c++){ const i=document.createElement("i"); i.className="v"; i.style.left=c*cell+"px"; grid.append(i); }
  clip.append(grid); inner.append(clip);

  const layer = document.createElement("div");
  layer.className = "doorlayer";
  const row = tin.fish[0].r;
  layer.style.setProperty("--cell", cell+"px");
  layer.style.setProperty("--row", row);
  layer.style.setProperty("--top", (row*cell)+"px");
  layer.innerHTML = design.door ? design.door({ cell, W, H, row }) : "";
  inner.append(layer);

  tin.fish.forEach((f,i) => {
    const el = document.createElement("div");
    el.className = "fish" + (i===0 ? " hero" : "");
    const b = horiz(f) ? {w:f.len*cell, h:cell} : {w:cell, h:f.len*cell};
    el.style.width=b.w+"px"; el.style.height=b.h+"px";
    el.style.left=f.c*cell+"px"; el.style.top=f.r*cell+"px";
    const rot = document.createElement("span");
    rot.className = "rot";
    rot.innerHTML = design.sprat(f.len, i===0);
    const sw=f.len*cell, sh=cell;
    rot.style.width=sw+"px"; rot.style.height=sh+"px";
    rot.style.marginLeft=(-sw/2)+"px"; rot.style.marginTop=(-sh/2)+"px";
    rot.style.transform = SPIN[f.dir];
    el.append(rot); inner.append(el);
  });
  wrap.append(inner);
  return wrap;
}
function swatch(design, len, hero, cell){
  const d = document.createElement("div");
  d.className = "swatch";
  d.style.width = len*cell+"px"; d.style.height = cell+"px";
  const rot = document.createElement("span");
  rot.className = "rot";
  rot.style.width = len*cell+"px"; rot.style.height = cell+"px";
  rot.innerHTML = design.sprat(len, hero);
  d.append(rot);
  return d;
}
const lab = document.getElementById("lab");
for (const [slug, d] of Object.entries(DESIGNS)){
  const sec = document.createElement("section");
  sec.className = "dz dz-" + slug;
  if (d.css){ const st = document.createElement("style"); st.textContent = d.css; sec.append(st); }
  const h = document.createElement("h2");
  h.innerHTML = (d.name || slug) + (d.blurb ? "<em>" + d.blurb + "</em>" : "");
  sec.append(h);
  const row = document.createElement("div"); row.className = "row";

  const c1 = document.createElement("div");
  c1.innerHTML = '<div class="cap">tin 12 · 56px cells</div>';
  c1.append(tinEl(d, TIN.t12, 56));
  row.append(c1);

  const c2 = document.createElement("div");
  c2.innerHTML = '<div class="cap">tin 40 · 38px cells (small phone)</div>';
  c2.append(tinEl(d, TIN.t40, 38));
  row.append(c2);

  const c3 = document.createElement("div");
  c3.innerHTML = '<div class="cap">the cast</div>';
  const strip = document.createElement("div"); strip.className = "strip";
  strip.append(swatch(d, 2, true, 96), swatch(d, 3, false, 96), swatch(d, 2, false, 56), swatch(d, 2, true, 38));
  c3.append(strip);
  row.append(c3);

  sec.append(row);
  lab.append(sec);
}
document.title = "designs";
</script>`;

const name = all ? "all" : slugs.join("_");
const htmlPath = join(SP, "out", name + ".html");
await writeFile(htmlPath, page);
const png = join(SP, "out", name + ".png");
const h = Math.min(16000, 210 + slugs.length * 560);
await run(CHROME, [
  "--headless", "--disable-gpu", "--hide-scrollbars", "--force-color-profile=srgb",
  "--virtual-time-budget=1600", "--screenshot=" + png,
  "--window-size=1400," + h, "file://" + htmlPath,
], { maxBuffer: 1 << 26 }).catch(e => { if (!e.stdout && e.code) throw e; });
console.log(png);
