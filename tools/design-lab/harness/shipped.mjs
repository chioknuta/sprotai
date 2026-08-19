#!/usr/bin/env node
/**
 * Extracts the skins that actually ship, out of index.html.
 *
 * Same trick `tools/verify.mjs` uses on the generator, and for the same
 * reason: a gallery that keeps its own copy of the art will drift from the
 * game, and then it is lying. The four shipped looks are read from the
 * `skins:start` / `skins:end` block; the candidates that were NOT chosen still
 * come from `designs/`, clearly marked, because there is nowhere else for them
 * to live.
 *
 *   import { shippedSkins } from "./shipped.mjs";
 *   const { source, ids } = await shippedSkins();   // DESIGNS-shaped JS
 *
 * Run directly to see what it found:
 *   node harness/shipped.mjs
 */
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..", "..", "..");

/** The `const SKINS = {...}` block, verbatim, plus the ids it defines. */
export async function shippedSkins() {
  const html = await readFile(join(ROOT, "index.html"), "utf8");
  const m = html.match(/skins:start[^\n]*\n([\s\S]*?)\n[^\n]*skins:end/);
  if (!m) throw new Error("no skins:start/skins:end block in index.html — has the game been reskinned?");
  const block = m[1];

  // The gallery speaks DESIGNS; the game speaks SKINS. Adapt rather than
  // duplicate, so there is still exactly one copy of the art.
  const ids = await idsOf(block);
  const source = `${block}
for (const id of ${JSON.stringify(ids)}) {
  DESIGNS[id] = SKINS[id];
  // The game scopes to [data-skin="id"]; the gallery scopes to .dz-id.
  if (DESIGNS[id].css) DESIGNS[id].css = DESIGNS[id].css.replaceAll('[data-skin="' + id + '"]', '.dz-' + id);
}`;
  return { source, ids, block };
}

async function idsOf(block) {
  const SKINS = new Function(`${block}\nreturn SKINS;`)();
  return Object.keys(SKINS);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { ids, block } = await shippedSkins();
  console.log(`shipped skins (${block.length} bytes from index.html): ${ids.join(", ")}`);
}
