#!/usr/bin/env node
/**
 * Verifies the ŠPROTAI puzzle generator.
 *
 * The generator is not reimplemented here — it is extracted verbatim from the
 * `generator:start` / `generator:end` block in index.html, so this can never
 * drift from the code that actually ships. The solver below IS independent: it
 * ignores how the puzzle was built and just repeatedly frees whatever can be
 * freed, which is exactly what a player can do.
 *
 *   node tools/verify.mjs            # quick pass
 *   node tools/verify.mjs 2000       # deeper pass (days per config)
 */

import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SAMPLES = Number(process.argv[2]) || 400;

const src = await readFile(join(ROOT, "index.html"), "utf8");
const block = src.match(/generator:start[^\n]*\n([\s\S]*?)\n[^\n]*generator:end/);
if (!block) {
  console.error("Could not find the generator:start/end block in index.html.");
  process.exit(1);
}
const G = new Function(
  `${block[1]}\nreturn { DIRS, SIZES, DAILY, xmur3, mulberry32, generate };`
)();

/** Independent solver: free anything freeable, repeat. Records difficulty. */
function solve(p) {
  const grid = Array.from({ length: p.rows }, () => Array(p.cols).fill(null));
  for (const f of p.fish) grid[f.r][f.c] = f;

  const canGo = f => {
    const [dr, dc] = G.DIRS[f.d];
    let r = f.r + dr, c = f.c + dc;
    while (r >= 0 && r < p.rows && c >= 0 && c < p.cols) {
      if (grid[r][c]) return false;
      r += dr; c += dc;
    }
    return true;
  };

  let left = p.fish.length;
  const perTurn = [];
  for (;;) {
    const free = p.fish.filter(f => grid[f.r][f.c] === f && canGo(f));
    if (!free.length) break;
    perTurn.push(free.length);
    grid[free[0].r][free[0].c] = null;
    left--;
  }
  return {
    solved: left === 0,
    stranded: left,
    opening: perTurn[0] ?? 0,
    // Average share of remaining fish that are legal on a given turn.
    // Lower = the order is more forced = the puzzle demands actual reading.
    tightness: perTurn.length
      ? perTurn.reduce((s, n, i) => s + n / (p.fish.length - i), 0) / perTurn.length
      : 0,
  };
}

const dayKey = i => {
  const d = new Date(Date.UTC(2026, 0, 1) + i * 86400000);
  return d.toISOString().slice(0, 10);
};

const CONFIGS = [
  { label: "daily", seed: i => `sprotai-daily-${dayKey(i)}`, ...G.DAILY },
  ...Object.entries(G.SIZES).map(([k, v]) => ({
    label: `endless:${k}`,
    seed: i => `sprotai-endless-${i}`,
    rows: v.rows, cols: v.cols, target: v.target,
  })),
];

let failed = 0;
for (const cfg of CONFIGS) {
  const stats = [];
  const broken = [];
  for (let i = 0; i < SAMPLES; i++) {
    const rng = G.mulberry32(G.xmur3(cfg.seed(i))());
    const p = G.generate(rng, cfg.rows, cfg.cols, cfg.target);
    const r = solve(p);
    if (!r.solved || p.fish.length !== cfg.target) broken.push({ i, ...r, n: p.fish.length });
    stats.push(r);
  }
  const avg = k => stats.reduce((s, r) => s + r[k], 0) / stats.length;
  const ok = broken.length === 0;
  if (!ok) failed++;
  console.log(
    `${ok ? "PASS" : "FAIL"}  ${cfg.label.padEnd(15)} ${cfg.cols}x${cfg.rows} ` +
    `${String(cfg.target).padStart(2)} fish  ` +
    `opening=${avg("opening").toFixed(1)} (min ${Math.min(...stats.map(s => s.opening))})  ` +
    `tightness=${avg("tightness").toFixed(2)}`
  );
  for (const b of broken.slice(0, 3)) {
    console.log(`      sample ${b.i}: ${b.stranded} fish stranded (generated ${b.n})`);
  }
}

console.log(
  failed
    ? `\n${failed} config(s) FAILED across ${SAMPLES} samples each.`
    : `\nAll configs solvable across ${SAMPLES} samples each.`
);
process.exit(failed ? 1 : 0);
