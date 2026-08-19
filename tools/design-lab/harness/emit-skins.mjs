#!/usr/bin/env node
/**
 * One-time authoring aid: turns chosen candidates in `designs/` into the
 * `SKINS` block that lives in index.html.
 *
 *   node harness/emit-skins.mjs 00-current=classic deco neon plush > /tmp/skins.js
 *
 * `design=skin` renames on the way through, because the lab's control is called
 * `00-current` — fine as a filename, wrong as a name a player sees and not a
 * legal identifier.
 *
 * After the block is in index.html, **index.html is the source of truth** and
 * this script is not run again — the lab reads the shipped skins back out of
 * it (see `shipped.mjs`), the same trick `tools/verify.mjs` uses on the
 * generator, so the gallery can never drift from the game.
 *
 * What it rewrites:
 *   - `DESIGNS["slug"] = {...}` becomes an entry in one `SKINS` object.
 *   - `.dz-slug` scoping becomes `[data-skin="slug"]`, which is how one
 *     document carries four looks.
 *   - `.dz-slug .tin` and friends keep working because the attribute sits on
 *     <html> and the tin is inside it.
 */
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const SP = join(HERE, "..");
const slugs = process.argv.slice(2);
if (!slugs.length) { console.error("usage: emit-skins.mjs <slug> [<slug>...]"); process.exit(1); }

const parts = [];
for (const arg of slugs) {
  const [slug, renamed] = arg.split("=");
  const id = renamed || slug;
  let src = await readFile(join(SP, "designs", slug + ".js"), "utf8");

  // `.dz-<slug>` is the gallery's scope; `[data-skin="<id>"]` is the game's.
  const scoped = new RegExp("\\.dz-" + slug.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g");
  src = src.replace(scoped, `[data-skin="${id}"]`);
  // @keyframes names are global; keep them collision-proof under the new id.
  src = src.replaceAll(slug + "-", id + "-");

  // Pull the object literal out of `DESIGNS["slug"] = { ... };`
  const open = src.indexOf("{", src.indexOf(`DESIGNS["${slug}"]`));
  if (open < 0) { console.error(`${slug}: no DESIGNS["${slug}"] assignment`); process.exit(1); }
  // Comments must be skipped, not just strings: an apostrophe in a prose
  // comment ("the tin's rim") otherwise opens a string that never closes and
  // the brace count runs off the end of the file.
  let depth = 0, end = -1, str = null, line = false, block = false;
  for (let i = open; i < src.length; i++) {
    const c = src[i], n = src[i + 1], p = src[i - 1];
    if (line) { if (c === "\n") line = false; continue; }
    if (block) { if (c === "*" && n === "/") { block = false; i++; } continue; }
    if (str) {
      if (c === "\\") { i++; continue; }
      if (c === str) str = null;
      continue;
    }
    if (c === "/" && n === "/") { line = true; i++; continue; }
    if (c === "/" && n === "*") { block = true; i++; continue; }
    if (c === '"' || c === "'" || c === "`") { str = c; continue; }
    if (c === "{") depth++;
    else if (c === "}" && --depth === 0) { end = i; break; }
  }
  if (end < 0) { console.error(`${slug}: unbalanced object literal`); process.exit(1); }

  const body = src.slice(open, end + 1);
  const key = /^[A-Za-z_$][\w$]*$/.test(id) ? id : JSON.stringify(id);
  parts.push(`  ${key}: ${body},`);
}

console.log("const SKINS = {");
console.log(parts.join("\n\n"));
console.log("};");
