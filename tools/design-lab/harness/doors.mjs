#!/usr/bin/env node
/** Doors only, on identical empty tins, at both sizes — the "cover the board" test. */
import { readFile, writeFile, readdir } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
const run = promisify(execFile);
const HERE = dirname(fileURLToPath(import.meta.url)), SP = join(HERE, "..");
const order = ["00-current","plush","holo","riso","paper","deco","neon"];
const found = (await readdir(join(SP,"designs"))).filter(f=>f.endsWith(".js")).map(f=>f.slice(0,-3));
const slugs = order.filter(s=>found.includes(s));
const files = [];
for (const s of slugs) files.push(await readFile(join(SP,"designs",s+".js"),"utf8"));
const page = `<!doctype html><meta charset="utf-8"><style>
*{box-sizing:border-box;margin:0;padding:0}
body{background:#fdf6e9;padding:24px;font:400 14px/1.4 ui-rounded,-apple-system,sans-serif;color:#4a3520}
.g{display:grid;grid-template-columns:repeat(2,1fr);gap:26px 40px}
.c h3{font-size:14px;font-weight:800;margin-bottom:8px}
.pair{display:flex;gap:34px;align-items:flex-start}
.tin{position:relative;padding:11px;border-radius:20px;width:max-content;
  background:linear-gradient(145deg,#f2f4f7,#b9c0c9 45%,#dfe3e9 60%,#aeb5bd);
  box-shadow:0 12px 26px #c9a06033, inset 0 1px 0 #fff}
.tin-inner{position:relative;border-radius:10px;background:linear-gradient(160deg,#f0bd6d,#dc9c44);
  box-shadow:inset 0 2px 10px #00000026}
.clip{position:absolute;inset:0;border-radius:10px;overflow:hidden}
.grid i{position:absolute;background:#00000010}
.grid i.h{left:0;right:0;height:1px}.grid i.v{top:0;bottom:0;width:1px}
.doorlayer{position:absolute;inset:0;pointer-events:none}
</style><body><div class="g" id="g"></div>
<script>const DESIGNS={};const W=6,H=6;</script>
${files.map(f=>"<script>\n"+f+"\n</script>").join("\n")}
<script>
function tin(d,cell,row){
  const w=document.createElement("div");w.className="tin";
  const i=document.createElement("div");i.className="tin-inner";
  i.style.width=W*cell+"px";i.style.height=H*cell+"px";
  const c=document.createElement("div");c.className="clip";
  const g=document.createElement("div");g.className="grid";
  for(let r=1;r<H;r++){const e=document.createElement("i");e.className="h";e.style.top=r*cell+"px";g.append(e)}
  for(let k=1;k<W;k++){const e=document.createElement("i");e.className="v";e.style.left=k*cell+"px";g.append(e)}
  c.append(g);i.append(c);
  const l=document.createElement("div");l.className="doorlayer";
  l.style.setProperty("--cell",cell+"px");l.style.setProperty("--row",row);l.style.setProperty("--top",row*cell+"px");
  l.innerHTML=d.door?d.door({cell,W,H,row}):"";i.append(l);w.append(i);return w;
}
const g=document.getElementById("g");
for(const [slug,d] of Object.entries(DESIGNS)){
  const c=document.createElement("div");c.className="c dz-"+slug;
  if(d.css){const s=document.createElement("style");s.textContent=d.css;c.append(s)}
  const h=document.createElement("h3");h.textContent=d.name||slug;c.append(h);
  const p=document.createElement("div");p.className="pair";
  p.append(tin(d,56,2),tin(d,38,2));c.append(p);g.append(c);
}
</script>`;
const html=join(SP,"out","doors.html");await writeFile(html,page);
await run("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
 ["--headless","--disable-gpu","--hide-scrollbars","--force-color-profile=srgb","--virtual-time-budget=1600",
  "--screenshot="+join(SP,"out","doors.png"),"--window-size=1180,2000","file://"+html],{maxBuffer:1<<26}).catch(e=>{if(e.code&&!e.stdout)throw e});
console.log(join(SP,"out","doors.png"));
