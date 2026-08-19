#!/usr/bin/env node
/**
 * fit/phone.mjs — the real index.html, at a real phone viewport, with a real door.
 *
 * headless --dump-dom ignores --window-size, so the page under test lives in an
 * IFRAME whose pixel size IS the viewport (verified: the frame reports the width
 * we asked for). The wrapper reads the frame's live geometry back out and prints
 * it, so numbers come from getBoundingClientRect() on painted elements, not CSS.
 *
 *   node fit/phone.mjs [--k=74] [--shot]
 *     --k   subtrahend to simulate in `avail = innerWidth - K` (74 = today)
 *     --shot  also write a PNG per (skin,width)
 */
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
const run = promisify(execFile);
const HERE = dirname(fileURLToPath(import.meta.url)), SP = join(HERE, ".."), ROOT = join(SP, "..", "..");
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const args = process.argv.slice(2);
const K = Number((args.find(a => a.startsWith("--k=")) || "--k=74").slice(4));
const SHOT = args.includes("--shot");
/* Option B: keep the board size, shove the tin left so the right gutter grows.
   body is a column flex with align-items:center, so a margin-right of 2X on
   the tin re-centres (tin + 2X) and moves the tin itself X px left. */
const SHIFT = Number((args.find(a => a.startsWith("--shift=")) || "--shift=0").slice(8));

const SLUGS = ["00-current","deco","neon","plush"];
const ONLY = (args.find(a=>a.startsWith("--vw=")) || "").slice(5);
const VIEWS = [[320,568],[360,780],[375,667],[390,844],[412,915],[430,932]]
  .filter(v => !ONLY || ONLY.split(",").includes(String(v[0])));
const files = {};
for (const s of SLUGS) files[s] = await readFile(join(SP,"designs",s+".js"),"utf8");
await mkdir(join(HERE,"out"), { recursive:true });

const results = [];
for (const [vw, vh] of VIEWS){
  for (const slug of SLUGS){
    const wrapper = `<!doctype html><meta charset="utf-8"><style>
*{box-sizing:border-box;margin:0;padding:0}
body{background:#556;font:12px monospace;padding:10px}
iframe{width:${vw}px;height:${vh}px;border:0;display:block;background:#fff}
#out{color:#fff;white-space:pre;margin-top:8px}
</style><body>
<iframe id="f" src="file://${join(ROOT,"index.html")}"></iframe><pre id="out">pending</pre>
<script>
const DESIGNS={};
</script>
<script>
${files[slug]}
</script>
<script>
const f=document.getElementById("f");
f.addEventListener("load",()=>{ setTimeout(go,700); });
function go(){
  const w=f.contentWindow, D=w.document, d=DESIGNS[${JSON.stringify(slug)}];
  const rep={slug:${JSON.stringify(slug)}, vw:${vw}, vh:${vh}, K:${K}, shift:${SHIFT}};
  try{
    rep.frameInnerWidth=w.innerWidth; rep.frameInnerHeight=w.innerHeight;
    /* simulate 'avail = innerWidth - K' without touching index.html: feed
       layout() a narrower innerWidth. CSS still sees the real viewport. */
    if(${K}!==74) Object.defineProperty(w,"innerWidth",{configurable:true,get:()=>${vw}-(${K}-74)});
    /* graft the design in */
    if(d.css){const s=D.createElement("style");s.textContent=d.css;D.head.append(s)}
    D.body.classList.add("dz-"+${JSON.stringify(slug)});
    const st=D.createElement("style");
    st.textContent=".doorlayer{position:absolute;inset:0;pointer-events:none}"+
      (${JSON.stringify(slug)}==="00-current"?"":"#notch{display:none}");
    D.head.append(st);
    /* index.html is a classic script: top-level let-bindings (cell, fish) live in the
       global LEXICAL env, not on window, so it is unreachable from out here.
       Inject a script that runs inside the frame to hand them over. */
    const sc=D.createElement("script");
    sc.textContent="window.__probe=function(){return {cell:cell, heroRow:fish[0].r}};";
    D.body.append(sc);
    /* index.html transitions .fish left/top; a re-layout is mid-flight for
       ~0.2s and a screenshot catches fish outside the shrunken tin. Freeze
       them so the shot shows the settled board. */
    const fz=D.createElement("style");
    fz.textContent=".fish,.fish *{transition:none!important;animation:none!important}";
    D.head.append(fz);
    w.layout();
    if(${SHIFT}) D.querySelector(".tin").style.marginRight=(2*${SHIFT})+"px";
    const cell=w.__probe().cell;
    const inner=D.querySelector(".tin-inner");
    let l=D.querySelector(".doorlayer");
    if(!l){l=D.createElement("div");l.className="doorlayer";inner.append(l)}
    const heroRow=w.__probe().heroRow;
    l.style.setProperty("--cell",cell+"px");
    l.style.setProperty("--row",heroRow);
    l.style.setProperty("--top",heroRow*cell+"px");
    l.innerHTML=d.door?d.door({cell,W:6,H:6,row:heroRow}):"";
    rep.cell=cell; rep.heroRow=heroRow;
    const oil=inner.getBoundingClientRect(), tin=D.querySelector(".tin").getBoundingClientRect();
    rep.oilRight=Math.round(oil.right*10)/10;
    rep.spaceRightOfOil=Math.round((w.innerWidth===undefined?0:${vw})-oil.right);
    rep.spaceRightOfMetal=Math.round(${vw}-tin.right);
    rep.spaceLeftOfMetal=Math.round(tin.left);
    /* fold: does the whole page fit with no scrolling? */
    rep.scrollH=D.documentElement.scrollHeight;
    rep.fits=rep.scrollH<=w.innerHeight;
    rep.overflowY=rep.scrollH-w.innerHeight;
    /* what is the last thing on the page, and where does it end? */
    const kids=[...D.body.children].filter(e=>e.getBoundingClientRect().height>0);
    const last=kids[kids.length-1];
    rep.lastEl=last?last.tagName+"."+(last.className||last.id):"?";
    rep.lastBottom=last?Math.round(last.getBoundingClientRect().bottom):0;
    rep.bodyPadBottom=parseFloat(w.getComputedStyle(D.body).paddingBottom);
    rep.ladder=kids.map(e=>{const b=e.getBoundingClientRect();
      return (e.tagName+(e.id?"#"+e.id:(e.className?"."+String(e.className).split(" ")[0]:"")))
        +" "+Math.round(b.top)+"-"+Math.round(b.bottom);});
    const tools=D.querySelector(".tools")||D.querySelector("#tools");
    rep.toolsBottom=tools?Math.round(tools.getBoundingClientRect().bottom):null;
  }catch(e){ rep.error=String(e)+" @ "+(e.stack||"").split("\\n")[1]; }
  document.getElementById("out").textContent=JSON.stringify(rep);
  document.title="done";
}
</script>`;
    const html = join(HERE,"out",`ph-${slug}-${vw}-k${K}${SHIFT?"s"+SHIFT:""}.html`);
    await writeFile(html, wrapper);
    const flags = ["--headless","--disable-gpu","--hide-scrollbars","--force-color-profile=srgb",
      "--allow-file-access-from-files","--virtual-time-budget=4000"];
    const { stdout } = await run(CHROME, [...flags, "--dump-dom", "file://"+html], { maxBuffer: 1<<26 });
    const m = stdout.match(/<pre id="out">([\s\S]*?)<\/pre>/);
    if (!m) throw new Error("no readout for "+slug+" "+vw);
    const txt = m[1].replace(/&amp;/g,"&").replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&quot;/g,'"');
    if (txt === "pending") throw new Error("frame never reported: "+slug+" "+vw);
    results.push(JSON.parse(txt));
    if (SHOT){
      const png = join(HERE,"out",`ph-${slug}-${vw}-k${K}${SHIFT?"s"+SHIFT:""}.png`);
      await run(CHROME,[...flags,"--screenshot="+png,`--window-size=${vw+24},${vh+70}`,"file://"+html],
        {maxBuffer:1<<26}).catch(e=>{ if(e.code&&!e.stdout) throw e; });
    }
  }
}
await writeFile(join(HERE,"out",`phone-k${K}${SHIFT?"s"+SHIFT:""}.json`), JSON.stringify(results,null,1));
console.log(JSON.stringify(results,null,1));
