#!/usr/bin/env node
/**
 * Contract check on every candidate design. These are the rules that break the
 * real game rather than merely looking wrong, so they are checked mechanically
 * instead of by eye: the pupil group the escape animation drives, id collisions
 * across the many copies that share a page, external references (the game must
 * run off a disk), filters on the ordinary sprats, and CSS that escapes its own
 * card.
 *
 *   node harness/validate.mjs
 */
import { readFile, readdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const SP = join(HERE, "..");
const slugs = (await readdir(join(SP, "designs"))).filter(f => f.endsWith(".js")).map(f => f.slice(0, -3)).sort();

let bad = 0;
for (const slug of slugs) {
  const src = await readFile(join(SP, "designs", slug + ".js"), "utf8");
  const DESIGNS = {};
  new Function("DESIGNS", src)(DESIGNS);
  const d = DESIGNS[slug];
  const fail = [];
  const warn = [];
  if (!d) { console.log(`✗ ${slug}: does not register DESIGNS["${slug}"]`); bad++; continue; }

  for (const k of ["name", "blurb", "sprat", "door"]) if (!d[k]) fail.push(`missing ${k}`);

  // every (len, hero) variant
  const ids = new Map();
  for (const len of [2, 3]) for (const hero of [true, false]) {
    const s = d.sprat(len, hero);
    const tag = `sprat(${len},${hero})`;
    if (!/^\s*<svg[^>]*class="art"/.test(s)) fail.push(`${tag}: root is not <svg class="art">`);
    if (!s.includes(`viewBox="0 0 ${len * 100} 100"`)) fail.push(`${tag}: wrong viewBox`);
    if (!s.includes('preserveAspectRatio="none"')) fail.push(`${tag}: missing preserveAspectRatio="none"`);
    if (!/<g[^>]*class="[^"]*\beye\b/.test(s)) fail.push(`${tag}: no <g class="eye"> — the escape animation drives it`);
    if (/(?:src|href|xlink:href)\s*=\s*["']?(?:https?:)?\/\//.test(s)) fail.push(`${tag}: external reference`);
    if (/url\(\s*["']?(?:https?:)?\/\//.test(s)) fail.push(`${tag}: external url()`);
    if (!hero && /<filter\b/.test(s)) fail.push(`${tag}: <filter> on an ordinary sprat`);
    if (/feTurbulence|feDisplacementMap/.test(s)) fail.push(`${tag}: banned filter primitive`);
    const n = new TextEncoder().encode(s).length;
    if (n > 3400) warn.push(`${tag}: ${n} bytes, over the ~2.5KB guidance`);
    for (const m of s.matchAll(/\sid="([^"]+)"/g)) {
      const id = m[1];
      if (!id.startsWith(slug)) warn.push(`${tag}: id "${id}" is not prefixed with the slug`);
      // The same id must always mean the same definition: many copies share a page.
      const body = defOf(s, id);
      if (ids.has(id) && ids.get(id).body !== body) fail.push(`id "${id}" differs between ${ids.get(id).tag} and ${tag}`);
      else if (!ids.has(id)) ids.set(id, { tag, body });
    }
  }

  // css scoping. An at-rule cannot carry a class, so @keyframes is checked the
  // only way it can be: its NAME is global, so it must be slug-prefixed.
  const css = d.css || "";
  for (const sel of selectorsOf(css)) {
    if (!sel.startsWith(`.dz-${slug}`)) fail.push(`css selector "${sel}" is not scoped to .dz-${slug}`);
  }
  for (const m of css.matchAll(/@keyframes\s+([\w-]+)/g)) {
    if (!m[1].toLowerCase().startsWith(slug)) fail.push(`@keyframes "${m[1]}" is a global name and is not slug-prefixed`);
  }
  if (/animation|transition/.test(css) && !/prefers-reduced-motion/.test(css)) {
    warn.push("css animates but has no prefers-reduced-motion block");
  }
  if (/(?:https?:)?\/\/[a-z]/.test(css.replace(/\/\/.*$/gm, ""))) warn.push("css may contain an external URL");

  const door = d.door({ cell: 50, W: 6, H: 6, row: 2 });
  if (!/var\(--cell\)|var\(--top\)|var\(--row\)/.test(door + css)) {
    warn.push("door never reads --cell/--top/--row, so it will not follow the hero's row or the cell size");
  }

  if (fail.length) bad++;
  console.log(`${fail.length ? "✗" : "✓"} ${slug}  ${d.name || ""}`);
  for (const f of fail) console.log(`    FAIL  ${f}`);
  for (const w of warn) console.log(`    warn  ${w}`);
}
console.log(bad ? `\n${bad} design(s) with failures.` : `\nAll ${slugs.length} designs pass the contract.`);

/** The markup of the element carrying this id — enough to tell two defs apart. */
function defOf(svg, id) {
  const i = svg.indexOf(`id="${id}"`);
  const start = svg.lastIndexOf("<", i);
  const tag = svg.slice(start + 1).match(/^[\w:-]+/)?.[0] || "";
  const close = svg.indexOf(`</${tag}>`, i);
  return svg.slice(start, close === -1 ? svg.indexOf(">", i) + 1 : close + tag.length + 3);
}

/** Top-level selectors, ignoring at-rule prelude and declaration bodies. */
function selectorsOf(css) {
  const out = [];
  const stripped = css.replace(/\/\*[\s\S]*?\*\//g, "");
  for (const m of stripped.matchAll(/(^|[{}])\s*([^{}@][^{}]*?)\s*\{/g)) {
    for (const part of m[2].split(",")) {
      const s = part.trim().replace(/\s+/g, " ");
      if (!s || /^[@\d]|^(from|to)$/.test(s) || s.includes(":root")) continue;
      out.push(s);
    }
  }
  return out;
}
