#!/usr/bin/env node
/**
 * fit/measure.mjs — how far does each design's door() actually paint?
 *
 * Builds one page holding every (skin x cell x hero-row) case, renders it in
 * headless Chrome, and walks the painted DOM measuring real geometry against
 * the oil's rect. Chrome's getBoundingClientRect() on an SVG shape is the
 * GEOMETRY bbox — it does not include the stroke — so every stroked shape is
 * inflated by stroke-width/2 scaled through its own getScreenCTM().
 *
 *   node fit/measure.mjs            -> fit/out/measure.json  + table on stdout
 */
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
const run = promisify(execFile);
const HERE = dirname(fileURLToPath(import.meta.url)), SP = join(HERE, "..");
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

const SLUGS = ["00-current", "deco", "neon", "plush"];
const CELLS = [38, 44, 50, 58];
const ROWS  = [0, 1, 2, 3, 4, 5];

const files = [];
for (const s of SLUGS) files.push(await readFile(join(SP, "designs", s + ".js"), "utf8"));

const page = `<!doctype html><meta charset="utf-8"><style>
*{box-sizing:border-box;margin:0;padding:0}
body{background:#fdf6e9;font:12px monospace}
.case{position:absolute}
.tin{position:relative;padding:11px;border-radius:20px;width:max-content;
  background:linear-gradient(145deg,#f2f4f7,#b9c0c9 45%,#dfe3e9 60%,#aeb5bd)}
.tin-inner{position:relative;border-radius:10px;background:linear-gradient(160deg,#f0bd6d,#dc9c44)}
.clip{position:absolute;inset:0;border-radius:10px;overflow:hidden}
.grid i{position:absolute;background:#00000010}
.grid i.h{left:0;right:0;height:1px}.grid i.v{top:0;bottom:0;width:1px}
.doorlayer{position:absolute;inset:0;pointer-events:none}
</style><body><div id="stage"></div><pre id="out"></pre>
<script>const DESIGNS={};const W=6,H=6;</script>
${files.map(f => "<script>\n" + f + "\n</script>").join("\n")}
<script>
const SLUGS=${JSON.stringify(SLUGS)}, CELLS=${JSON.stringify(CELLS)}, ROWS=${JSON.stringify(ROWS)};
const stage=document.getElementById("stage");

/* elements that never paint */
const NOPAINT=new Set(["defs","lineargradient","radialgradient","stop","clippath","mask",
  "filter","pattern","symbol","marker","title","desc","metadata","style","script","use-shadow"]);
const SHAPES=new Set(["path","rect","circle","ellipse","line","polyline","polygon","text","g","svg","image"]);

function shadowSpread(cs){
  /* max outward reach of any box-shadow: |offset| + blur + spread, per side.
     Chrome serialises as "rgb(...) 0px 0px 14px 5px, ..." */
  const bs=cs.boxShadow; if(!bs||bs==="none") return null;
  let r={l:0,r:0,t:0,b:0};
  for(const part of bs.split(/,(?![^()]*\\))/)){
    if(/\\binset\\b/.test(part)) continue;
    const nums=(part.match(/-?[\\d.]+px/g)||[]).map(parseFloat);
    if(nums.length<2) continue;
    const [ox,oy,blur=0,spread=0]=nums;
    r.r=Math.max(r.r, ox+blur+spread); r.l=Math.max(r.l, -ox+blur+spread);
    r.b=Math.max(r.b, oy+blur+spread); r.t=Math.max(r.t, -oy+blur+spread);
  }
  return r;
}

function measure(layer, oil){
  const hard={R:-1e9,T:-1e9,B:-1e9,who:{R:"",T:"",B:""}};
  const glow={R:-1e9,T:-1e9,B:-1e9,who:{R:"",T:"",B:""}};
  const push=(acc,R,T,B,tag)=>{
    if(R>acc.R){acc.R=R;acc.who.R=tag}
    if(T>acc.T){acc.T=T;acc.who.T=tag}
    if(B>acc.B){acc.B=B;acc.who.B=tag}
  };
  const all=[layer,...layer.querySelectorAll("*")];
  for(const el of all){
    const tag=(el.tagName||"").toLowerCase();
    if(NOPAINT.has(tag)) continue;
    if(el.closest && el.closest("defs")) continue;
    const cs=getComputedStyle(el);
    if(cs.display==="none"||cs.visibility==="hidden") continue;
    if(parseFloat(cs.opacity)===0) continue;
    let r=el.getBoundingClientRect();
    let left=r.left,right=r.right,top=r.top,bottom=r.bottom;
    if(r.width===0&&r.height===0&&el!==layer) { /* still check pseudos below */ }

    /* --- SVG shapes: getBoundingClientRect() omits the stroke. Inflate. --- */
    const isSvgShape = el.ownerSVGElement && SHAPES.has(tag) && tag!=="svg";
    if(isSvgShape){
      const stroke=cs.stroke;
      const sw=parseFloat(cs.strokeWidth)||0;
      if(stroke && stroke!=="none" && sw>0 && el.getScreenCTM){
        const m=el.getScreenCTM();
        if(m){
          const sx=Math.hypot(m.a,m.b), sy=Math.hypot(m.c,m.d);
          left-=sw/2*sx; right+=sw/2*sx; top-=sw/2*sy; bottom+=sw/2*sy;
        }
      }
    }
    const idc=(el.className&&el.className.baseVal!==undefined?el.className.baseVal:el.className)||"";
    const label=tag+(idc?"."+String(idc).trim().split(/\\s+/).join("."):"");
    if(!(r.width===0&&r.height===0))
      push(hard, right-oil.right, oil.top-top, bottom-oil.bottom, label);

    /* --- box-shadow glow --- */
    const sh=shadowSpread(cs);
    if(sh && !(r.width===0&&r.height===0))
      push(glow, right+sh.r-oil.right, oil.top-(top-sh.t), bottom+sh.b-oil.bottom, label+"~shadow");

    /* --- ::before / ::after --- */
    for(const pe of ["::before","::after"]){
      const p=getComputedStyle(el,pe);
      if(!p||p.content==="none"||p.content==="normal") continue;
      if(p.display==="none"||p.visibility==="hidden"||parseFloat(p.opacity)===0) continue;
      const n=v=>{const f=parseFloat(v);return isFinite(f)?f:0};
      const wid=n(p.width)+n(p.borderLeftWidth)+n(p.borderRightWidth)+n(p.paddingLeft)+n(p.paddingRight);
      const hei=n(p.height)+n(p.borderTopWidth)+n(p.borderBottomWidth)+n(p.paddingTop)+n(p.paddingBottom);
      if(p.position==="absolute"||p.position==="fixed"){
        /* containing block = el's padding box (el is the offset parent here) */
        const pb={left:r.left+n(cs.borderLeftWidth),right:r.right-n(cs.borderRightWidth),
                  top:r.top+n(cs.borderTopWidth),bottom:r.bottom-n(cs.borderBottomWidth)};
        let pl,pr,pt,pbo;
        if(p.right!=="auto"){pr=pb.right-n(p.right); pl=pr-wid}
        else {pl=pb.left+n(p.left); pr=pl+wid}
        if(p.bottom!=="auto"&&p.top==="auto"){pbo=pb.bottom-n(p.bottom); pt=pbo-hei}
        else {pt=pb.top+n(p.top); pbo=pt+hei}
        push(hard, pr-oil.right, oil.top-pt, pbo-oil.bottom, label+pe);
        push(glow, pr-oil.right, oil.top-pt, pbo-oil.bottom, label+pe);
      } else {
        push(hard, r.right+0-oil.right, oil.top-r.top, r.bottom-oil.bottom, label+pe);
      }
    }
  }
  /* glow is a superset of hard */
  push(glow, hard.R, hard.T, hard.B, "(hard)");
  const rd=v=>Math.round(v*10)/10;
  return {hard:{R:rd(hard.R),T:rd(hard.T),B:rd(hard.B),who:hard.who},
          glow:{R:rd(glow.R),T:rd(glow.T),B:rd(glow.B),who:glow.who}};
}

const results=[]; let y=0;
for(const slug of SLUGS){
  const d=DESIGNS[slug];
  for(const cell of CELLS){
    for(const row of ROWS){
      const wrap=document.createElement("div");
      wrap.className="case dz-"+slug;
      wrap.style.left="60px"; wrap.style.top=y+"px"; y+=H*58+120;
      if(d.css){const s=document.createElement("style");s.textContent=d.css;wrap.append(s)}
      const t=document.createElement("div");t.className="tin";
      const inner=document.createElement("div");inner.className="tin-inner";
      inner.style.width=W*cell+"px";inner.style.height=H*cell+"px";
      const c=document.createElement("div");c.className="clip";
      const g=document.createElement("div");g.className="grid";
      for(let r=1;r<H;r++){const e=document.createElement("i");e.className="h";e.style.top=r*cell+"px";g.append(e)}
      for(let k=1;k<W;k++){const e=document.createElement("i");e.className="v";e.style.left=k*cell+"px";g.append(e)}
      c.append(g);inner.append(c);
      const l=document.createElement("div");l.className="doorlayer";
      l.style.setProperty("--cell",cell+"px");
      l.style.setProperty("--row",row);
      l.style.setProperty("--top",row*cell+"px");
      l.innerHTML=d.door?d.door({cell,W,H,row}):"";
      inner.append(l);t.append(inner);wrap.append(t);stage.append(wrap);
      const oil=inner.getBoundingClientRect();
      results.push({slug,cell,row,...measure(l,oil)});
    }
  }
}
document.getElementById("out").textContent=JSON.stringify({sanity:{innerWidth:innerWidth},results});
</script>`;

await mkdir(join(HERE, "out"), { recursive: true });
const html = join(HERE, "out", "measure.html");
await writeFile(html, page);
const { stdout } = await run(CHROME, ["--headless", "--disable-gpu", "--hide-scrollbars",
  "--force-color-profile=srgb", "--virtual-time-budget=2500", "--dump-dom", "file://" + html],
  { maxBuffer: 1 << 28 });
const m = stdout.match(/<pre id="out">([\s\S]*?)<\/pre>/);
if (!m) { console.error(stdout.slice(0, 2000)); throw new Error("no output"); }
const json = JSON.parse(m[1].replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"'));
await writeFile(join(HERE, "out", "measure.json"), JSON.stringify(json, null, 1));
console.log(JSON.stringify(json.sanity));
console.log("rows:", json.results.length, "->", join(HERE, "out", "measure.json"));
