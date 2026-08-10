#!/usr/bin/env node
/**
 * Verifies the ŠPROTAI tin generator.
 *
 * The generator is not reimplemented here — it is extracted verbatim from the
 * `generator:start` / `generator:end` block in index.html, so this can never
 * drift from the code that actually ships. The solver below IS independent:
 * it works on a plain 2D grid of cells with no bitmasks anywhere, re-derived
 * from the rules of the game rather than from the generator's own helpers.
 *
 * That independence is the whole point. An earlier version of the generator
 * packed occupancy into a single 32-bit word, and `1 << 35` is `1 << 3` in
 * JavaScript, so the bottom of the board silently aliased onto the top. The
 * shipped par was wrong on 259 of the first 300 tins and 9 tins shipped
 * already solved. Nothing caught it, because the only thing checking the
 * solver was the solver.
 *
 * For each tin this asserts:
 *   - the sprats do not overlap and all lie inside the tin
 *   - the little one is not already free at move zero
 *   - a solution exists
 *   - the shipped `par` equals the true minimum number of slides
 *
 *   node tools/verify.mjs           # quick pass (60 tins)
 *   node tools/verify.mjs 400       # deeper pass
 */

import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const COUNT = Number(process.argv[2]) || 60;

const src = await readFile(join(ROOT, "index.html"), "utf8");
const block = src.match(/generator:start[^\n]*\n([\s\S]*?)\n[^\n]*generator:end/);
if (!block) {
  console.error("Could not find the generator:start/end block in index.html.");
  process.exit(1);
}
for (const banned of ["document", "window", "Math.random", "Date.now", "new Date"]) {
  if (block[1].includes(banned)) {
    console.error(`Generator block contains ${banned} — it must stay pure and deterministic.`);
    process.exit(1);
  }
}
const W = 6, H = 6;
const G = new Function("W", "H", `${block[1]}\nreturn { makeTin, bandFor };`)(W, H);

/* ---------- independent solver: plain 2D grid, no bitmasks ---------- */
const isH = f => f.dir === "R" || f.dir === "L";
const posOf = f => (isH(f) ? f.c : f.r);
const cellsOf = (f, p) => {
  const out = [];
  for (let i = 0; i < f.len; i++) out.push(isH(f) ? [f.r, p + i] : [p + i, f.c]);
  return out;
};
function gridOf(fish, ps) {
  const g = Array.from({ length: H }, () => Array(W).fill(-1));
  for (let i = 0; i < fish.length; i++) {
    for (const [r, c] of cellsOf(fish[i], ps[i])) {
      if (r < 0 || r >= H || c < 0 || c >= W) return null;
      if (g[r][c] !== -1) return null;
      g[r][c] = i;
    }
  }
  return g;
}
/** The little one is free when her row is clear from her nose to the rim. */
function isFree(fish, ps, g) {
  const f = fish[0], head = ps[0] + f.len - 1;
  for (let c = head + 1; c < W; c++) if (g[f.r][c] !== -1) return false;
  return true;
}
/** Fewest slides to free her (a slide of any distance counts as one), or null. */
function trueMinimum(fish, cap = 400000) {
  const start = fish.map(posOf);
  const g0 = gridOf(fish, start);
  if (!g0) return "OVERLAP";
  if (isFree(fish, start, g0)) return 0;
  const key = ps => ps.join(",");
  const seen = new Set([key(start)]);
  let front = [start], depth = 0;
  while (front.length) {
    const next = [];
    for (const ps of front) {
      const g = gridOf(fish, ps);
      for (let i = 0; i < fish.length; i++) {
        const f = fish[i], max = (isH(f) ? W : H) - f.len;
        for (const d of [1, -1]) {
          for (let p = ps[i] + d; p >= 0 && p <= max; p += d) {
            let blocked = false;
            for (const [r, c] of cellsOf(f, p)) {
              const o = g[r][c];
              if (o !== -1 && o !== i) { blocked = true; break; }
            }
            if (blocked) break;
            const np = ps.slice(); np[i] = p;
            const k = key(np);
            if (seen.has(k)) continue;
            seen.add(k);
            const ng = gridOf(fish, np);
            if (ng && isFree(fish, np, ng)) return depth + 1;
            next.push(np);
          }
        }
      }
    }
    front = next; depth++;
    if (seen.size > cap) return null;
  }
  return null;
}

/* ---------- run ---------- */
let failures = 0, worstMs = 0, totalMs = 0;
const byBand = new Map();

for (let n = 1; n <= COUNT; n++) {
  const t0 = Date.now();
  const tin = G.makeTin(n);
  const ms = Date.now() - t0;
  totalMs += ms; worstMs = Math.max(worstMs, ms);

  const fail = msg => { failures++; console.log(`FAIL  tin ${n}: ${msg}`); };
  if (!tin) { fail("generator returned nothing"); continue; }

  const truth = trueMinimum(tin.fish);
  if (truth === "OVERLAP") { fail("sprats overlap or sit outside the tin"); continue; }
  if (truth === 0) { fail(`already solved at move zero (label says par ${tin.par})`); continue; }
  if (truth === null) { fail("no solution exists"); continue; }
  if (truth !== tin.par) { fail(`par says ${tin.par}, true minimum is ${truth}`); continue; }

  const b = byBand.get(tin.band) ?? { n: 0, min: 99, max: 0 };
  b.n++; b.min = Math.min(b.min, tin.par); b.max = Math.max(b.max, tin.par);
  byBand.set(tin.band, b);
}

for (const [band, b] of byBand) {
  console.log(`  ${band.padEnd(8)} ${String(b.n).padStart(3)} tins   par ${b.min}-${b.max}`);
}
console.log(
  `\ngeneration: ${(totalMs / COUNT).toFixed(0)}ms mean, ${worstMs}ms worst` +
  `\n${failures ? `${failures} of ${COUNT} tins FAILED` : `All ${COUNT} tins solvable, and every par is the proven minimum.`}`
);
process.exit(failures ? 1 : 0);
