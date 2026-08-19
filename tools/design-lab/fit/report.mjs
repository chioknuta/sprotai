import { readFile } from "node:fs/promises";
const K = process.argv[2] || "74";
const r = JSON.parse(await readFile(new URL(`./out/phone-k${K}.json`, import.meta.url)));
// worst-case door footprint (px past the OIL right edge), from fit/pixels.mjs
const px = JSON.parse(await readFile(new URL("./out/pixels.json", import.meta.url)));
const need = (slug, cell) => Math.max(...px.filter(p => p.slug === slug && p.cell === cell).map(p => p.px.t6.R));
const cells = [...new Set(px.map(p => p.cell))].sort((a,b)=>a-b);
const needAt = (slug, cell) => {            // interpolate between measured cell sizes
  if (cells.includes(cell)) return need(slug, cell);
  const lo = cells.filter(c=>c<cell).pop(), hi = cells.find(c=>c>cell);
  if (lo === undefined) return need(slug, cells[0]);
  if (hi === undefined) return need(slug, cells[cells.length-1]);
  const a = need(slug,lo), b = need(slug,hi);
  return Math.round(a + (b-a)*(cell-lo)/(hi-lo));
};
console.log(`K=${K}   (avail = innerWidth - K)`);
console.log("vw   vh   skin        cell  room→right-of-oil  door needs  CUT?   page h / vh   fits?");
for (const x of r){
  const nd = needAt(x.slug, x.cell), cut = nd - x.spaceRightOfOil;
  console.log(
    String(x.vw).padEnd(5)+String(x.vh).padEnd(5)+x.slug.padEnd(12)+String(x.cell).padEnd(6)+
    String(x.spaceRightOfOil).padStart(12)+String(nd).padStart(13)+
    (cut>0?("   -"+cut+"px").padEnd(9):"   ok    ")+
    (x.scrollH+" / "+x.vh).padStart(12)+ (x.fits?"   fits":"   SCROLLS +"+x.overflowY));
}
