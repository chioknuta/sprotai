#!/usr/bin/env node
/**
 * fit/clipcheck.mjs — did anything actually get amputated?
 *
 * Reads the fit/out/ph-*.png shots (the real index.html in a viewport-sized
 * iframe) and asks one question per shot: is any pixel in the LAST column of
 * the viewport not the page background? html{overflow-x:clip} means a door
 * that runs past the edge stops dead there, so paint in the last column is
 * the signature of an amputation. Also reports how far in from the edge the
 * door's outermost paint sits, so a pass has a measured margin.
 */
import { readFile, readdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { readPNG } from "./png.mjs";
const HERE = dirname(fileURLToPath(import.meta.url));
const PADX = 10, PADY = 10;              // wrapper padding around the iframe
const BG = [0xfd,0xf6,0xe9];             // index.html page background at the rim
const K = process.argv[2] || "74";

const shots = (await readdir(join(HERE,"out"))).filter(f => f.endsWith(`-k${K}.png`)).sort();
console.log(`K=${K}    "clipped" = paint in the viewport's last column`);
console.log("skin        vw    outermost paint (px from left edge)   viewport   clipped?  margin");
for (const f of shots){
  const [, slug, vw] = f.match(/^ph-(.+)-(\d+)-k[\w]+\.png$/);
  const VW = Number(vw);
  const img = readPNG(await readFile(join(HERE,"out",f)));
  const at = (x,y) => { const i = (y*img.w+x)*img.ch; return [img.data[i],img.data[i+1],img.data[i+2]]; };
  const isBg = (x,y) => { const p = at(x,y); return Math.abs(p[0]-BG[0])<=6 && Math.abs(p[1]-BG[1])<=6 && Math.abs(p[2]-BG[2])<=6; };
  const lastCol = PADX + VW - 1;
  // the door lives beside the tin; scan the whole iframe height minus chrome
  let touch = 0, maxX = 0;
  for (let y = PADY+120; y < Math.min(img.h, PADY+560); y++){
    if (!isBg(lastCol, y)) touch++;
    for (let x = lastCol; x > PADX + VW - 120; x--) if (!isBg(x,y)){ if (x > maxX) maxX = x; break; }
  }
  const outermost = maxX - PADX + 1;
  console.log(slug.padEnd(12)+String(VW).padEnd(6)+String(outermost).padStart(10)+
    "                    "+String(VW).padStart(5)+
    (touch>0 ? `   CLIPPED (${touch} rows)` : `   clear      ${VW-outermost}px`));
}
