/**
 * fit/cdp.mjs — drive headless Chrome over the DevTools protocol.
 *
 * WHY THIS EXISTS. The fit scripts used to run Chrome as
 * `--dump-dom --virtual-time-budget=N` and read the finished DOM off stdout.
 * Chrome stopped honouring the virtual-time budget for `--dump-dom`: the DOM
 * is now dumped before a single `setTimeout` has run, so every page that
 * measures itself asynchronously dumps its placeholder instead of a reading.
 * That took out `ship-check.mjs` completely — 72 of 72 rows came back
 * "no reading" — and it did it on a Chrome update, with no change to this
 * repo. Virtual time is not a thing to depend on again.
 *
 * So: launch Chrome once with a debugging port, and talk to it. Two things
 * fall out of that which are worth more than the bug fix.
 *
 *   - `Emulation.setDeviceMetricsOverride` sets a REAL viewport, so
 *     `window.innerWidth` inside the page is exactly the width asked for.
 *     The old scripts had to load the page in an iframe sized in CSS pixels,
 *     because `--window-size` is ignored under `--dump-dom`, and then assert
 *     `innerWidth === vw` before trusting any number. The iframe is gone.
 *   - `Runtime.evaluate` runs in the page's own global scope, which is where
 *     index.html's top-level `let` bindings live. `fish`, `cell`, `off`,
 *     `applySkin` and `build` are all directly reachable, so the measuring
 *     code no longer has to be stringified into an injected `<script>`.
 *
 * No dependencies: Node has had a global `WebSocket` since 22, and Chrome's
 * `/json/version` is a plain HTTP endpoint.
 *
 *   const chrome = await launch();
 *   const page = await chrome.page({ width: 375, height: 667 });
 *   await page.goto(url);
 *   await page.waitFor(`document.querySelectorAll(".fish").length > 0`);
 *   const r = await page.json(`({ cell, moves: hist.length })`);
 *   await chrome.close();
 */
import { spawn } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

export const CHROME = process.env.CHROME_BIN
  || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

const sleep = ms => new Promise(r => setTimeout(r, ms));

/** Launch headless Chrome on an ephemeral profile and attach to it. */
export async function launch({ port = 9333 + (process.pid % 500) } = {}) {
  // A throwaway profile, so a run never inherits state from the user's own
  // Chrome and two runs can never fight over the same lock.
  const profile = await mkdtemp(join(tmpdir(), "sprotai-fit-"));
  const proc = spawn(CHROME, [
    "--headless=new", "--disable-gpu", "--hide-scrollbars",
    "--force-color-profile=srgb", "--allow-file-access-from-files",
    "--no-first-run", "--no-default-browser-check",
    `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`,
    "about:blank",
  ], { stdio: "ignore" });

  // Chrome writes the port file and opens the socket a moment after exec.
  let version;
  for (let i = 0; i < 150; i++) {
    try {
      version = await (await fetch(`http://127.0.0.1:${port}/json/version`)).json();
      if (version.webSocketDebuggerUrl) break;
    } catch { /* not up yet */ }
    await sleep(100);
  }
  if (!version?.webSocketDebuggerUrl) {
    proc.kill();
    throw new Error(`Chrome did not open a debugging port on ${port}. Is ${CHROME} there?`);
  }

  const ws = new WebSocket(version.webSocketDebuggerUrl);
  await new Promise((ok, bad) => { ws.onopen = ok; ws.onerror = bad; });

  let nextId = 0;
  const waiting = new Map();
  ws.onmessage = e => {
    const msg = JSON.parse(e.data);
    const settle = waiting.get(msg.id);
    if (!settle) return;                         // an event, not a reply
    waiting.delete(msg.id);
    msg.error ? settle.bad(new Error(msg.error.message)) : settle.ok(msg.result);
  };
  const send = (method, params = {}, sessionId) => new Promise((ok, bad) => {
    const id = ++nextId;
    waiting.set(id, { ok, bad });
    ws.send(JSON.stringify({ id, method, params, sessionId }));
  });

  return {
    /** A fresh tab at a fixed CSS viewport. `mobile` so media queries agree. */
    async page({ width, height, mobile = true } = {}) {
      const { targetId } = await send("Target.createTarget", { url: "about:blank" });
      const { sessionId } = await send("Target.attachToTarget", { targetId, flatten: true });
      await send("Page.enable", {}, sessionId);
      await send("Runtime.enable", {}, sessionId);
      if (width) {
        await send("Emulation.setDeviceMetricsOverride",
          { width, height, deviceScaleFactor: 1, mobile }, sessionId);
      }
      const evaluate = async (expression) => {
        const r = await send("Runtime.evaluate",
          { expression, returnByValue: true, awaitPromise: true }, sessionId);
        if (r.exceptionDetails) {
          throw new Error(r.exceptionDetails.exception?.description
            || r.exceptionDetails.text || "evaluate threw");
        }
        return r.result?.value;
      };
      return {
        sessionId,
        evaluate,
        /** Evaluate an EXPRESSION and bring it back as structured data. */
        json: expr => evaluate(`JSON.stringify(${expr})`).then(s => s == null ? null : JSON.parse(s)),
        async goto(url) {
          await send("Page.navigate", { url }, sessionId);
          // Navigation resolves before the document is interactive; callers
          // wait on something real with waitFor() rather than on a delay.
          for (let i = 0; i < 200; i++) {
            try {
              if (await evaluate(`document.readyState !== "loading"`)) return;
            } catch { /* context still swapping */ }
            await sleep(25);
          }
          throw new Error(`timed out loading ${url}`);
        },
        /** Poll a boolean expression in the page. Returns false on timeout. */
        async waitFor(expr, { tries = 400, every = 25 } = {}) {
          for (let i = 0; i < tries; i++) {
            try { if (await evaluate(expr)) return true; } catch { /* retry */ }
            await sleep(every);
          }
          return false;
        },
        /** PNG bytes of the current viewport. */
        async screenshot() {
          const { data } = await send("Page.captureScreenshot",
            { format: "png", captureBeyondViewport: false }, sessionId);
          return Buffer.from(data, "base64");
        },
        close: () => send("Target.closeTarget", { targetId }),
      };
    },
    async close() {
      try { ws.close(); } catch { /* already gone */ }
      proc.kill();
      await rm(profile, { recursive: true, force: true }).catch(() => {});
    },
  };
}
