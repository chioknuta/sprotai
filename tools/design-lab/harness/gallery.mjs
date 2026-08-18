#!/usr/bin/env node
/**
 * Builds the design-review page: every candidate direction on the same real
 * tin, at a size the client can switch between phone and laptop, plus the cast
 * at large scale.
 *
 *   node harness/gallery.mjs            → out/gallery.html
 *
 * Emits page content only (no doctype/html/head/body) so it can be published as
 * an Artifact as-is; it also opens fine in a browser on its own.
 *
 * Design note: the page chrome is a cool proofing grey and follows the reader's
 * theme, but the surface each tin sits on is pinned to #fdf6e9 in BOTH themes —
 * that is the game's own page background, and six directions with palettes this
 * different can only be compared on the ground they will actually ship against.
 */
import { readFile, writeFile, readdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const SP = join(HERE, "..");

const order = ["00-current", "riso", "deco", "neon", "holo", "paper", "plush"];
const found = (await readdir(join(SP, "designs"))).filter(f => f.endsWith(".js")).map(f => f.slice(0, -3));
const slugs = [...order.filter(s => found.includes(s)), ...found.filter(s => !order.includes(s))];
const files = [];
for (const s of slugs) files.push(await readFile(join(SP, "designs", s + ".js"), "utf8"));

const TIN = JSON.parse(await readFile(join(HERE, "tin.json"), "utf8"));
let NOTES = {};
try { NOTES = JSON.parse(await readFile(join(SP, "notes.json"), "utf8")); } catch {}

const page = `<title>Šprotai Proof Sheets</title>
<style>
  :root{
    --ground:#e8eaee; --panel:#fbfcfd; --rule:#d0d5dc; --rule-soft:#e2e6ec;
    --ink:#191d24; --muted:#69717d; --faint:#98a0ac;
    --accent:#c2571f; --accent-soft:#f2e0d3;
    --good:#2f6f57; --cost:#a8562c;
    /* The game's own page background. Pinned — never themed. */
    --proof:#fdf6e9;
    --serif:ui-serif,"New York",Georgia,"Times New Roman",serif;
    --sans:ui-sans-serif,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;
  }
  @media (prefers-color-scheme: dark){
    :root:not([data-theme="light"]){
      --ground:#15171b; --panel:#1d2026; --rule:#31363f; --rule-soft:#262a31;
      --ink:#e7eaef; --muted:#98a0ac; --faint:#6c7480;
      --accent:#e88a4d; --accent-soft:#3a2a1e;
      --good:#6fbf98; --cost:#e0996b;
    }
  }
  :root[data-theme="dark"]{
    --ground:#15171b; --panel:#1d2026; --rule:#31363f; --rule-soft:#262a31;
    --ink:#e7eaef; --muted:#98a0ac; --faint:#6c7480;
    --accent:#e88a4d; --accent-soft:#3a2a1e;
    --good:#6fbf98; --cost:#e0996b;
  }

  *{box-sizing:border-box; margin:0; padding:0}
  body{
    background:var(--ground); color:var(--ink);
    font:400 15.5px/1.6 var(--sans);
    -webkit-font-smoothing:antialiased; padding-bottom:80px;
  }
  .wrap{max-width:1120px; margin:0 auto; padding:0 22px}
  ::selection{background:var(--accent-soft); color:var(--ink)}
  :focus-visible{outline:2px solid var(--accent); outline-offset:3px; border-radius:3px}

  /* ---------- masthead ---------- */
  header{padding:64px 0 0}
  .eyebrow{
    font-size:10.5px; font-weight:600; letter-spacing:.16em; text-transform:uppercase;
    color:var(--faint);
  }
  h1{
    font-family:var(--serif); font-weight:600; font-size:clamp(34px,6vw,54px);
    letter-spacing:-.015em; line-height:1.04; margin-top:12px; text-wrap:balance;
  }
  h1 span{color:var(--muted)}
  .standfirst{
    max-width:56ch; margin-top:16px; font-size:17px; line-height:1.55; color:var(--muted);
  }
  .standfirst b{color:var(--ink); font-weight:600}

  .brief{
    margin-top:34px; border-top:1px solid var(--rule); border-bottom:1px solid var(--rule);
    display:grid; grid-template-columns:repeat(3,1fr);
  }
  @media (max-width:760px){ .brief{grid-template-columns:1fr} }
  .brief > div{padding:20px 26px 22px; border-left:1px solid var(--rule-soft)}
  .brief > div:first-child{border-left:0; padding-left:0}
  .brief h3{
    font-size:10.5px; font-weight:700; letter-spacing:.13em; text-transform:uppercase;
    color:var(--accent); margin-bottom:7px;
  }
  .brief p{font-size:14px; color:var(--muted); line-height:1.5}
  .brief p b{color:var(--ink); font-weight:600}

  /* ---------- the size control ---------- */
  .toolbar{
    position:sticky; top:0; z-index:30; margin-top:0;
    display:flex; gap:14px; align-items:center; flex-wrap:wrap;
    padding:14px 0 13px; background:var(--ground);
    border-bottom:1px solid var(--rule);
  }
  .seg{display:flex; border:1px solid var(--rule); border-radius:7px; overflow:hidden}
  .seg button{
    font:inherit; font-size:13px; font-weight:600; color:var(--muted); cursor:pointer;
    background:none; border:0; border-left:1px solid var(--rule); padding:7px 14px;
    font-variant-numeric:tabular-nums;
  }
  .seg button:first-child{border-left:0}
  .seg button[aria-pressed="true"]{background:var(--accent); color:#fff}
  .toolbar .hint{font-size:13px; color:var(--faint)}

  /* ---------- proof sheets ---------- */
  .sheets{display:flex; flex-direction:column; gap:26px; margin-top:26px}
  .sheet{
    background:var(--panel); border:1px solid var(--rule); border-radius:4px;
    display:grid; grid-template-columns:minmax(0,auto) minmax(290px,1fr);
    align-items:start;
  }
  @media (max-width:860px){ .sheet{grid-template-columns:1fr} }
  /* No dimming on the control — it is being compared, not eulogised. */

  /* the artwork, on the game's own ground */
  .stage{
    position:relative; background:var(--proof);
    padding:30px 78px 30px 26px; border-right:1px solid var(--rule);
    display:flex; align-items:center; justify-content:center; min-height:100%;
    overflow:hidden;
  }
  @media (max-width:860px){ .stage{border-right:0; border-bottom:1px solid var(--rule)} }
  /* crop marks — this is a proof of artwork, and it is pinned to the game's ground */
  .stage::before,.stage::after{
    content:""; position:absolute; width:11px; height:11px; pointer-events:none;
    border-color:#c9b795; border-style:solid;
  }
  .stage::before{top:9px; left:9px; border-width:1px 0 0 1px}
  .stage::after{bottom:9px; right:9px; border-width:0 1px 1px 0}

  .info{padding:26px 28px 28px; display:flex; flex-direction:column; min-height:100%}
  .info h2{
    font-family:var(--serif); font-weight:600; font-size:27px; letter-spacing:-.012em;
    line-height:1.1;
  }
  .tagline{margin-top:5px; font-size:14.5px; color:var(--muted)}
  .mark{
    display:inline-block; margin-left:9px; vertical-align:2px;
    font-family:var(--sans); font-size:9.5px; font-weight:700; letter-spacing:.11em;
    text-transform:uppercase; color:var(--muted);
    border:1px solid var(--rule); border-radius:3px; padding:2px 7px;
  }

  .cap{
    font-size:10px; font-weight:700; letter-spacing:.13em; text-transform:uppercase;
    color:var(--faint); margin-bottom:11px;
  }
  .cast{margin-top:24px; padding-top:20px; border-top:1px solid var(--rule-soft)}
  .castrow{
    display:flex; align-items:center; gap:16px; flex-wrap:wrap;
    background:var(--proof); border:1px solid var(--rule-soft); border-radius:3px;
    padding:12px 14px;
  }

  .ledger{margin-top:auto; padding-top:22px; font-size:14px; line-height:1.5}
  .ledger div{display:grid; grid-template-columns:52px 1fr; gap:10px; align-items:baseline}
  .ledger div + div{margin-top:8px}
  .ledger i{
    font-style:normal; font-size:9.5px; font-weight:700; letter-spacing:.11em;
    text-transform:uppercase; padding-top:3px;
  }
  .ledger .w i{color:var(--good)}
  .ledger .c i{color:var(--cost)}
  .ledger span{color:var(--muted)}
  .ledger .w span{color:var(--ink)}

  /* ---------- the tin: identical geometry to index.html ---------- */
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
  .swatch .rot{position:static; transform:none !important; margin:0 !important}

  footer{
    margin-top:40px; padding-top:22px; border-top:1px solid var(--rule);
    font-size:13px; color:var(--faint); display:flex; gap:22px; flex-wrap:wrap;
  }
</style>

<div class="wrap">
<header>
  <p class="eyebrow">Šprotai · art direction · six candidates</p>
  <h1>Pick the tin.<br><span>And pick the way out of it.</span></h1>
  <p class="standfirst">Two decisions, drawn six ways. Every sheet below is the <b>same real tin — number 12</b>, dealt by the game's own generator, so nothing here is a mock-up and nothing is flattered by a friendlier board.</p>

  <div class="brief">
    <div>
      <h3>The fish</h3>
      <p>Hip and beautiful, and the little one <b>unicorny, glittery, special</b> — she is the one you have to get out, and today she is just a pink version of everyone else.</p>
    </div>
    <div>
      <h3>The way out</h3>
      <p>Today it is an 11px sliver on the right rim. Every direction redraws it as <b>an opened tin</b> — lid sheared and wound back, mostly on a key.</p>
    </div>
    <div>
      <h3>How to judge</h3>
      <p>Set it to <b>Phone</b> and find the little one without hunting. That is the whole game, and it is where these separate hardest.</p>
    </div>
  </div>
</header>

<div class="toolbar">
  <div class="seg" role="group" aria-label="Cell size">
    <button id="sz-phone" aria-pressed="false">Phone · 38px</button>
    <button id="sz-mid" aria-pressed="true">Real size · 50px</button>
    <button id="sz-big" aria-pressed="false">Close up · 62px</button>
  </div>
  <span class="hint">Shown on the game's own background, in both themes.</span>
</div>

<div class="sheets" id="sheets"></div>

<footer>
  <span>Tin 12 · par 7 · 11 sprats</span>
  <span>Boards from the shipping generator</span>
  <span>The fish and the door are separable — you can mix two directions</span>
</footer>
</div>

<script>
const DESIGNS = {};
const TIN = ${JSON.stringify(TIN)};
const NOTES = ${JSON.stringify(NOTES)};
const SPIN = { R:"", L:"scaleX(-1)", D:"rotate(90deg)", U:"rotate(-90deg)" };
const W = 6, H = 6;
</script>
${files.map(f => "<script>\n" + f + "\n</script>").join("\n")}
<script>
const horiz = f => f.dir === "R" || f.dir === "L";

function buildTin(design, tin){
  const wrap = document.createElement("div");
  wrap.className = "tin";
  const inner = document.createElement("div");
  inner.className = "tin-inner";
  const clip = document.createElement("div"); clip.className = "clip";
  const grid = document.createElement("div"); grid.className = "grid";
  clip.append(grid); inner.append(clip);
  const layer = document.createElement("div"); layer.className = "doorlayer";
  inner.append(layer);
  const fishEls = tin.fish.map((f, i) => {
    const el = document.createElement("div");
    el.className = "fish" + (i === 0 ? " hero" : "");
    const rot = document.createElement("span");
    rot.className = "rot";
    rot.innerHTML = design.sprat(f.len, i === 0);
    rot.style.transform = SPIN[f.dir];
    el.append(rot); inner.append(el);
    return el;
  });
  wrap.append(inner);
  wrap._lay = c => {
    inner.style.width = W*c+"px"; inner.style.height = H*c+"px";
    grid.innerHTML = "";
    for (let r=1;r<H;r++){ const i=document.createElement("i"); i.className="h"; i.style.top=r*c+"px"; grid.append(i); }
    for (let k=1;k<W;k++){ const i=document.createElement("i"); i.className="v"; i.style.left=k*c+"px"; grid.append(i); }
    const row = tin.fish[0].r;
    layer.style.setProperty("--cell", c+"px");
    layer.style.setProperty("--row", row);
    layer.style.setProperty("--top", (row*c)+"px");
    layer.innerHTML = design.door ? design.door({ cell:c, W, H, row }) : "";
    tin.fish.forEach((f, i) => {
      const el = fishEls[i];
      el.style.width  = (horiz(f) ? f.len*c : c)+"px";
      el.style.height = (horiz(f) ? c : f.len*c)+"px";
      el.style.left = f.c*c+"px"; el.style.top = f.r*c+"px";
      const rot = el.firstChild, sw = f.len*c, sh = c;
      rot.style.width=sw+"px"; rot.style.height=sh+"px";
      rot.style.marginLeft=(-sw/2)+"px"; rot.style.marginTop=(-sh/2)+"px";
    });
  };
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

const host = document.getElementById("sheets");
const tins = [];
for (const [slug, d] of Object.entries(DESIGNS)){
  const control = slug === "00-current";
  const sheet = document.createElement("section");
  sheet.className = "sheet dz-" + slug + (control ? " control" : "");
  if (d.css){ const st = document.createElement("style"); st.textContent = d.css; sheet.append(st); }

  const stage = document.createElement("div"); stage.className = "stage";
  const t = buildTin(d, TIN.t12);
  stage.append(t); tins.push(t);
  sheet.append(stage);

  const info = document.createElement("div"); info.className = "info";
  const h = document.createElement("h2");
  h.textContent = d.name || slug;
  if (control){
    const m = document.createElement("span"); m.className = "mark"; m.textContent = "shipping now";
    h.append(m);
  }
  info.append(h);
  const tag = document.createElement("p"); tag.className = "tagline"; tag.textContent = d.blurb || "";
  info.append(tag);

  const cast = document.createElement("div"); cast.className = "cast";
  cast.innerHTML = '<p class="cap">the cast, up close</p>';
  const row = document.createElement("div"); row.className = "castrow";
  row.append(swatch(d, 2, true, 78), swatch(d, 3, false, 60), swatch(d, 2, false, 60));
  cast.append(row);
  info.append(cast);

  const n = NOTES[slug];
  if (n && (n.wins || n.costs)){
    const led = document.createElement("div"); led.className = "ledger";
    if (n.wins)  led.insertAdjacentHTML("beforeend", '<div class="w"><i>Wins</i><span>' + n.wins + '</span></div>');
    if (n.costs) led.insertAdjacentHTML("beforeend", '<div class="c"><i>Costs</i><span>' + n.costs + '</span></div>');
    info.append(led);
  }
  sheet.append(info);
  host.append(sheet);
}

let cell = 50;
const relay = () => tins.forEach(t => t._lay(cell));
relay();
const sizes = { "sz-phone":38, "sz-mid":50, "sz-big":62 };
for (const [id, c] of Object.entries(sizes)){
  document.getElementById(id).addEventListener("click", () => {
    cell = c; relay();
    for (const k of Object.keys(sizes)) document.getElementById(k).setAttribute("aria-pressed", String(k === id));
  });
}
</script>`;

await writeFile(join(SP, "out", "gallery.html"), page);
console.log(join(SP, "out", "gallery.html"));
