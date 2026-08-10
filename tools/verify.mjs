#!/usr/bin/env node
/**
 * Verifies the ŠPROTAI "OIL LINE" generator.
 *
 * The generator is not reimplemented here — it is extracted verbatim from the
 * `generator:start` / `generator:end` block in index.html, so this can never
 * drift from the code that actually ships. The solver below IS independent:
 * it rebuilds the rules from scratch (volumes, exposure thresholds, straight
 * lift-out) and exhaustively searches rescue orders for a perfect clear, with
 * memoization on the set of rescued fish. A board passes only if a perfect
 * order exists.
 *
 * It also reports difficulty stats:
 *   traps   — states along the ideal line where a legal-but-fatal tap exists
 *   digger  — fraction saved by a player who always grabs the deepest fish
 *   random  — fraction saved by uniformly random legal taps (20 trials/board)
 *   greedy^ — boards where the in-page greedy policy fails but the exhaustive
 *             search still finds a perfect order (informational; should be 0,
 *             a nonzero count means the page's trap metric is approximate)
 *
 *   node tools/verify.mjs            # quick pass (400 boards per config)
 *   node tools/verify.mjs 2000       # deeper pass
 */

import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SAMPLES = Number(process.argv[2]) || 400;
const NODE_CAP = 2_000_000;

const src = await readFile(join(ROOT, "index.html"), "utf8");
const block = src.match(/generator:start[^\n]*\n([\s\S]*?)\n[^\n]*generator:end/);
if (!block) {
  console.error("Could not find the generator:start/end block in index.html.");
  process.exit(1);
}
for (const banned of ["Math.random", "Date.now", "new Date"]) {
  if (block[1].includes(banned)) {
    console.error(`Generator block contains ${banned} — it must stay deterministic.`);
    process.exit(1);
  }
}
const G = new Function(
  `${block[1]}\nreturn { UPC, SIZES, DAILY, xmur3, mulberry32, generate };`
)();

/* ---------- independent rules model ----------
 * Re-derived from the game rules, not from the generator's helpers:
 *   volume(f) = 2 * len            (units, half-cells)
 *   top(f)    = H + r * 2 * cols   (exposure threshold of f's top edge)
 *   f is liftable iff no fish remains in a row above f overlapping f's span
 *   after each rescue depth += volume; any remaining fish with top < depth
 *   dries out; a perfect clear means nobody ever dries.
 */
function model(board) {
  const { rows, cols, H, fish } = board;
  const F = fish.length;
  const vol = fish.map(f => 2 * f.len);
  const top = fish.map(f => H + f.r * 2 * cols);
  const blockers = fish.map(f => {
    let m = 0;
    for (const g of fish) {
      if (g.r < f.r && g.c < f.c + f.len && f.c < g.c + g.len) m |= 1 << g.id;
    }
    return m;
  });
  return { F, full: (1 << F) - 1, vol, top, blockers, fish, rows, cols, H };
}

/** Exhaustive: does any rescue order save every fish? Memoized on the set of
 *  rescued fish (depth is a function of that set, so the state is complete). */
function perfectExists(m) {
  const failed = new Set();
  let nodes = 0;
  function dfs(mask, depth) {
    if (mask === m.full) return true;
    if (failed.has(mask)) return false;
    if (++nodes > NODE_CAP) throw new Error("node cap exceeded");
    const order = [];
    for (let i = 0; i < m.F; i++) {
      if (mask & (1 << i)) continue;
      if (m.top[i] < depth) return false;            // someone already dried
      if ((m.blockers[i] & ~mask) === 0) order.push(i);
    }
    order.sort((a, b) => (m.top[a] + m.vol[a]) - (m.top[b] + m.vol[b]));
    for (const i of order) {
      if (dfs(mask | (1 << i), depth + m.vol[i])) return true;
    }
    failed.add(mask);
    return false;
  }
  const ok = dfs(0, 0);
  return { ok, nodes };
}

/** Play out a policy; returns number saved. policy(liftable[]) -> index. */
function play(m, policy) {
  let mask = 0, depth = 0, driedMask = 0, saved = 0;
  for (;;) {
    const liftable = [];
    for (let i = 0; i < m.F; i++) {
      if (mask & (1 << i)) continue;
      if (driedMask & (1 << i)) continue;
      if ((m.blockers[i] & ~mask) === 0) liftable.push(i);
    }
    if (!liftable.length) return saved;
    const i = policy(liftable);
    mask |= 1 << i;
    depth += m.vol[i];
    saved++;
    for (let j = 0; j < m.F; j++) {
      if (!(mask & (1 << j)) && !(driedMask & (1 << j)) && m.top[j] < depth) {
        driedMask |= 1 << j;
      }
    }
  }
}

const greedyPolicy = m => ls =>
  ls.reduce((a, b) => (m.top[a] + m.vol[a] <= m.top[b] + m.vol[b] ? a : b));
const diggerPolicy = m => ls =>
  ls.reduce((a, b) => (m.top[a] >= m.top[b] ? a : b));

const dayKey = i => {
  const d = new Date(Date.UTC(2026, 0, 1) + i * 86400000);
  return d.toISOString().slice(0, 10);
};

const CONFIGS = [
  { label: "daily", seed: i => `sprotai-daily-${dayKey(i)}`, cfg: G.DAILY },
  ...Object.entries(G.SIZES).map(([k, v]) => ({
    label: `endless:${k}`,
    seed: i => `sprotai-endless-${i}`,
    cfg: v,
  })),
];

let failed = 0;
for (const { label, seed, cfg } of CONFIGS) {
  const stats = { fish: 0, digger: 0, random: 0, nodes: 0, greedyGap: 0 };
  const broken = [];
  const rrng = G.mulberry32(G.xmur3("verify-random-" + label)());

  for (let i = 0; i < SAMPLES; i++) {
    const rng = G.mulberry32(G.xmur3(seed(i))());
    const board = G.generate(rng, cfg);
    const m = model(board);

    // structural sanity: full pack, every row sums to cols
    for (let r = 0; r < board.rows; r++) {
      const sum = board.fish.filter(f => f.r === r).reduce((s, f) => s + f.len, 0);
      if (sum !== board.cols) broken.push({ i, why: `row ${r} sums to ${sum}` });
    }

    let res;
    try { res = perfectExists(m); }
    catch (e) { broken.push({ i, why: e.message }); continue; }
    if (!res.ok) broken.push({ i, why: "no perfect order exists" });
    stats.nodes = Math.max(stats.nodes, res.nodes);

    if (play(m, greedyPolicy(m)) !== m.F && res.ok) stats.greedyGap++;

    stats.fish += m.F;
    stats.digger += play(m, diggerPolicy(m)) / m.F;
    let rsum = 0;
    for (let t = 0; t < 20; t++) {
      rsum += play(m, ls => ls[Math.floor(rrng() * ls.length)]) / m.F;
    }
    stats.random += rsum / 20;
  }

  const ok = broken.length === 0;
  if (!ok) failed++;
  console.log(
    `${ok ? "PASS" : "FAIL"}  ${label.padEnd(15)} ${cfg.cols}x${cfg.rows} ` +
    `slack=${cfg.slack}  fish=${(stats.fish / SAMPLES).toFixed(1)}  ` +
    `digger=${(stats.digger / SAMPLES).toFixed(2)}  ` +
    `random=${(stats.random / SAMPLES).toFixed(2)}  ` +
    `greedyGap=${stats.greedyGap}  maxNodes=${stats.nodes}`
  );
  for (const b of broken.slice(0, 3)) console.log(`      sample ${b.i}: ${b.why}`);
}

console.log(
  failed
    ? `\n${failed} config(s) FAILED across ${SAMPLES} samples each.`
    : `\nAll configs perfect-solvable across ${SAMPLES} samples each.`
);
process.exit(failed ? 1 : 0);
