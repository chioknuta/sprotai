import { readFile, writeFile } from "node:fs/promises";
const ROOT = "/Users/aiste/Desktop/Claude Projects./Shprotai";
const src = await readFile(ROOT + "/index.html", "utf8");
const block = src.match(/generator:start[^\n]*\n([\s\S]*?)\n[^\n]*generator:end/)[1];
const W = 6, H = 6;
const G = new Function("W","H",`${block}\nreturn { makeTin, bandFor };`)(W,H);
const out = {};
for (const n of [4, 12, 40]) out["t"+n] = G.makeTin(n);
console.log(JSON.stringify(out, null, 1));
