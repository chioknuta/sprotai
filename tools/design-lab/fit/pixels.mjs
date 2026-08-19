#!/usr/bin/env node
/**
 * fit/pixels.mjs — ground-truth door footprint, read off the rendered pixels.
 *
 * DOM rects over-report a div whose background is a gradient fading to
 * transparent (neon's spill/beam/out) and under-report a box-shadow glow
 * (neon's gap). So: paint each door on a flat #fdf6e9 page at a known origin,
 * screenshot, and find the outermost pixel that differs from the page
 * background by more than a threshold. Everything is included — gradients,
 * glows, strokes, pseudo-elements.
 *
 *   node fit/pixels.mjs   ->  fit/out/pixels.json
 */
import { writeFile, readFile, mkdir } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { readPNG } from "./png.mjs";
const run = promisify(execFile);
const HERE = dirname(fileURLToPath(import.meta.url)), SP = join(HERE, "..");
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const SLUGS = ["00-current","deco","neon","plush"], CELLS = [38,44,50,58], ROWS = [0,1,2,3,4,5];
const BG = [0xfd,0xf6,0xe9];
const X0 = 220, PAD = 11, GAP = 150;      // tin left edge, tin padding, gap between cases
const THRESHOLDS = [6, 20];

const files = [];
for (const s of SLUGS) files.push(await readFile(join(SP,"designs",s+".js"),"utf8"));
await mkdir(join(HERE,"out"), { recursive:true });

const out = [];
for (const slug of SLUGS){
  for (const cell of CELLS){
    const caseH = 6*cell + 2*PAD, pitch = caseH + GAP;
    const H_PAGE = ROWS.length*pitch + GAP, W_PAGE = 900;
    const page = `<!doctype html><meta charset="utf-8"><style>
*{box-sizing:border-box;margin:0;padding:0}
html,body{background:#fdf6e9}
body{width:${W_PAGE}px;height:${H_PAGE}px;overflow:hidden;position:relative}
.case{position:absolute;left:${X0}px}
.tin{position:relative;padding:${PAD}px;border-radius:20px;width:max-content;
  background:linear-gradient(145deg,#f2f4f7,#b9c0c9 45%,#dfe3e9 60%,#aeb5bd)}
.tin-inner{position:relative;border-radius:10px;background:linear-gradient(160deg,#f0bd6d,#dc9c44)}
.clip{position:absolute;inset:0;border-radius:10px;overflow:hidden}
.grid i{position:absolute;background:#00000010}
.grid i.h{left:0;right:0;height:1px}.grid i.v{top:0;bottom:0;width:1px}
.doorlayer{position:absolute;inset:0;pointer-events:none}
</style><body><div id="stage"></div>
<script>const DESIGNS={};const W=6,H=6;</script>
${files.map(f=>"<script>\n"+f+"\n</script>").join("\n")}
<script>
const d=DESIGNS[${JSON.stringify(slug)}], cell=${cell}, PAD=${PAD}, pitch=${pitch}, GAP=${GAP};
const stage=document.getElementById("stage");
if(d.css){const s=document.createElement("style");s.textContent=d.css;document.head.append(s)}
/* the tin's own drop-shadow is not the door: it exists today too. Kill it so
   what is left outside the metal is exactly what door() painted. */
const k=document.createElement("style");k.textContent=".tin{box-shadow:none!important}";document.head.append(k);
document.body.classList.add("dz-"+${JSON.stringify(slug)});
${JSON.stringify(ROWS)}.forEach((row,k)=>{
  const wrap=document.createElement("div");wrap.className="case";wrap.style.top=(GAP/2+k*pitch)+"px";
  const t=document.createElement("div");t.className="tin";
  const inner=document.createElement("div");inner.className="tin-inner";
  inner.style.width=W*cell+"px";inner.style.height=H*cell+"px";
  const c=document.createElement("div");c.className="clip";
  const g=document.createElement("div");g.className="grid";
  for(let r=1;r<H;r++){const e=document.createElement("i");e.className="h";e.style.top=r*cell+"px";g.append(e)}
  for(let m=1;m<W;m++){const e=document.createElement("i");e.className="v";e.style.left=m*cell+"px";g.append(e)}
  c.append(g);inner.append(c);
  const l=document.createElement("div");l.className="doorlayer";
  l.style.setProperty("--cell",cell+"px");l.style.setProperty("--row",row);
  l.style.setProperty("--top",row*cell+"px");
  l.innerHTML=d.door?d.door({cell,W,H,row}):"";
  inner.append(l);t.append(inner);wrap.append(t);stage.append(wrap);
});
</script>`;
    const html = join(HERE,"out",`px-${slug}-${cell}.html`);
    const png  = join(HERE,"out",`px-${slug}-${cell}.png`);
    await writeFile(html, page);
    await run(CHROME,["--headless","--disable-gpu","--hide-scrollbars","--force-color-profile=srgb",
      "--virtual-time-budget=1800","--screenshot="+png,`--window-size=${W_PAGE},${H_PAGE}`,"file://"+html],
      {maxBuffer:1<<26}).catch(e=>{ if(e.code&&!e.stdout) throw e; });
    const img = readPNG(await readFile(png));
    if (img.w !== W_PAGE || img.h !== H_PAGE)
      throw new Error(`screenshot ${img.w}x${img.h} != requested ${W_PAGE}x${H_PAGE}`);
    const at = (x,y) => { const i = (y*img.w + x)*img.ch; return [img.data[i],img.data[i+1],img.data[i+2]]; };
    const diff = (x,y) => { const p = at(x,y); return Math.max(Math.abs(p[0]-BG[0]),Math.abs(p[1]-BG[1]),Math.abs(p[2]-BG[2])); };

    ROWS.forEach((row,k)=>{
      const oilL = X0+PAD, oilT = GAP/2 + k*pitch + PAD, oilR = oilL+6*cell, oilB = oilT+6*cell;
      const bandT = Math.max(0, oilT - GAP/2 + 2), bandB = Math.min(img.h-1, oilB + GAP/2 - 2);
      const bandL = Math.max(0, oilL - 40), bandR = img.w-1;
      const rec = { slug, cell, row, px:{} };
      for (const th of THRESHOLDS){
        let R=-1e9,T=-1e9,B=-1e9;
        for (let y=bandT; y<=bandB; y++)
          for (let x=bandL; x<=bandR; x++)
            if (diff(x,y) > th){ if (x+1-oilR > R) R = x+1-oilR; }
        for (let y=bandT; y<=bandB; y++){
          let any=false;
          for (let x=bandL; x<=bandR; x++) if (diff(x,y) > th){ any=true; break; }
          if (any){ if (oilT-y > T) T = oilT-y; if (y+1-oilB > B) B = y+1-oilB; }
        }
        rec.px["t"+th] = { R:Math.round(R), T:Math.round(T), B:Math.round(B) };
      }
      out.push(rec);
    });
    process.stderr.write(`${slug} cell=${cell} ok\n`);
  }
}
await writeFile(join(HERE,"out","pixels.json"), JSON.stringify(out,null,1));
console.log("wrote", join(HERE,"out","pixels.json"), out.length, "cases");
