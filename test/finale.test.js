/* The last door — regression test.

   Seals real nested ciphertexts with node's WebCrypto, mirroring
   vault_tool.py exactly (PBKDF2-SHA256 → AES-GCM, NUL-padded to a block),
   then drives the real script.js through both stages. Nothing is mocked:
   if the padding, the iteration count or the alias prefix is wrong, this
   fails the same way a player would.

   setup:  npm install jsdom
   run:    node test/finale.test.js            (exits non-zero on failure)  */
const { JSDOM } = require("jsdom");
const fs = require("fs"), path = require("path"), assert = require("assert");
const { webcrypto } = require("crypto");
const R = path.join(__dirname, "..");

const PAD_BLOCK = 2048;
const norm = s => s.toUpperCase().replace(/[^A-Z]/g, "");
const b64 = u => Buffer.from(u).toString("base64");

async function seal(answer, text, iters = 600000) {
  const salt = webcrypto.getRandomValues(new Uint8Array(16));
  const iv = webcrypto.getRandomValues(new Uint8Array(12));
  const km = await webcrypto.subtle.importKey("raw",
    new TextEncoder().encode(norm(answer)), "PBKDF2", false, ["deriveKey"]);
  const key = await webcrypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: iters, hash: "SHA-256" },
    km, { name: "AES-GCM", length: 256 }, false, ["encrypt"]);
  const body = new TextEncoder().encode(text);
  const padded = new Uint8Array(Math.ceil(body.length / PAD_BLOCK) * PAD_BLOCK);
  padded.set(body);                                     // remainder is NUL
  const ct = new Uint8Array(await webcrypto.subtle.encrypt(
    { name: "AES-GCM", iv }, key, padded));
  return { salt: b64(salt), iv: b64(iv), ct: b64(ct), iters };
}

/* stage one's plaintext IS stage two's door */
async function sealNested(a1, html1, a2, html2) {
  const next = await seal(a2, html2);
  return seal(a1, JSON.stringify({ html: html1, next }));
}

const STAGE1 = "<p>stage one landed</p>";
const STAGE2 = "<p>the name, handed back</p>";

async function boot({ arm = true, localStore = {}, hint = "" } = {}) {
  const dom = new JSDOM(fs.readFileSync(path.join(R, "index.html"), "utf8"),
    { runScripts: "outside-only", pretendToBeVisual: true });
  const w = dom.window;
  const def = (k, v) => Object.defineProperty(w, k, { value: v, configurable: true });
  def("crypto", webcrypto);
  const ls = { ...localStore };
  def("localStorage", { getItem: k => ls[k] ?? null, setItem: (k, v) => ls[k] = String(v) });
  w.matchMedia = () => ({ matches: false, addListener() {}, removeListener() {} });
  w.fetch = async () => ({ ok: true, json: async () => ({ transcribed: {} }) });
  w.requestAnimationFrame = () => 0; w.devicePixelRatio = 1; w.Path2D = function () {};
  w.HTMLCanvasElement.prototype.getContext = () => new Proxy({}, { get: (t, p) =>
    p === "createImageData" ? (a, b) => ({ data: new Uint8ClampedArray(a * b * 4) })
    : p === "createPattern" ? () => ({}) : () => {} });

  w.eval(fs.readFileSync(path.join(R, "config.js"), "utf8"));
  if (arm) {
    w.VOID_CONFIG.FINALE.enabled = true;
    w.VOID_CONFIG.FINALE.stage1 = JSON.parse(JSON.stringify(SEALED));
    w.VOID_CONFIG.FINALE.hint = hint;
  }
  w.eval(fs.readFileSync(path.join(R, "bench-data.js"), "utf8"));
  w.eval(fs.readFileSync(path.join(R, "script.js"), "utf8"));
  await (w.__voidReady || new Promise(r => setTimeout(r, 120)));
  await new Promise(r => setTimeout(r, 0));
  return w;
}

const $ = (w, s) => w.document.querySelector(s);
const door = w => $(w, '.door[data-id="the-unwritten"]');
/* 600k PBKDF2 iterations is the point of 600k PBKDF2 iterations: a fixed
   sleep is not long enough, and a sleep long enough for the slowest machine
   makes the suite crawl. Poll instead — fast when it lands, patient when
   the box is loaded. */
const waitFor = async (fn, ms = 6000) => {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) {
    if (fn()) return true;
    await new Promise(r => setTimeout(r, 15));
  }
  return false;
};
const enter = async (w, sel, value, until) => {
  const i = $(w, sel);
  i.value = value;
  i.dispatchEvent(new w.KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
  await waitFor(until || (() => false), until ? 6000 : 1200);
};

let SEALED;
let pass = 0, fail = 0;
const it = async (n, f) => { try { await f(); console.log("  PASS  " + n); pass++; }
  catch (e) { console.log("  FAIL  " + n + "\n        " + e.message); fail++; } };

(async () => {
  console.log("\nthe last door\n");
  SEALED = await sealNested("I AM NOBODY", STAGE1, "I AM VOID", STAGE2);

  await it("the phantom: visible, labelled, and uncrackable because it is not there", async () => {
    const w = await boot({ arm: false });
    const d = door(w);
    assert.ok(d, "the door is on the page from act I");
    assert.strictEqual(d.dataset.state, "not-indexed");
    assert.strictEqual(d.querySelector(".status").textContent, "not indexed");
    await enter(w, '.door[data-id="the-unwritten"] input', "I AM NOBODY");
    assert.ok(!$(w, "#black"), "nothing can open a door with no ciphertext behind it");
  });

  await it("no part of the finale sits in config.js before reveal day", async () => {
    const src = fs.readFileSync(path.join(R, "config.js"), "utf8");
    assert.ok(!/IAMVOID|I AM VOID/i.test(src), "his name must not be in the config");
    assert.ok(/enabled:\s*false/.test(src) && /stage1:\s*null/.test(src));
  });

  await it("the knock: I AM NOBODY takes the world away", async () => {
    const w = await boot();
    assert.strictEqual(door(w).dataset.state, "held");
    await enter(w, '.door[data-id="the-unwritten"] input', "I AM NOBODY", () => $(w, "#black"));
    assert.ok(w.document.body.classList.contains("blackout"), "the site goes black");
    const b = $(w, "#black");
    assert.ok(b, "one line and one input remain");
    assert.strictEqual(b.querySelector(".bq").textContent, w.VOID_CONFIG.FINALE.prompt);
    assert.ok(b.querySelector(".bspeak input"), "stage two takes an answer");
    assert.ok(!b.textContent.includes("stage one landed"),
      "stage one's plaintext is a door, not a payload");
  });

  await it("stage two: the full sentence opens it", async () => {
    const w = await boot();
    await enter(w, '.door[data-id="the-unwritten"] input', "I AM NOBODY", () => $(w, "#black"));
    await enter(w, "#black input", "I AM VOID", () => $(w, ".bpay").innerHTML);
    assert.match($(w, ".bpay").textContent, /the name, handed back/);
    assert.ok($(w, "#black").classList.contains("answered"));
    assert.ok(!$(w, "#black .bspeak"), "the input goes once it has been answered");
  });

  await it("stage two: VOID alone is accepted — no correct answer dies on a technicality", async () => {
    const w = await boot();
    await enter(w, '.door[data-id="the-unwritten"] input', "I AM NOBODY", () => $(w, "#black"));
    await enter(w, "#black input", "void", () => $(w, ".bpay").innerHTML);
    assert.match($(w, ".bpay").textContent, /the name, handed back/);
  });

  await it("stage two: a wrong word is refused and the door stays open", async () => {
    const w = await boot();
    await enter(w, '.door[data-id="the-unwritten"] input', "I AM NOBODY", () => $(w, "#black"));
    await enter(w, "#black input", "I AM NOBODY");
    assert.strictEqual($(w, ".bpay").innerHTML, "", "nothing lands");
    assert.ok($(w, "#black .bspeak input"), "they can try again");
  });

  await it("the contingency is words, because the black screen is the design", async () => {
    const w = await boot({ hint: "he is waiting for a name." });
    await enter(w, '.door[data-id="the-unwritten"] input', "I AM NOBODY", () => $(w, "#black"));
    assert.match($(w, ".bhint").textContent, /waiting for a name/);
  });

  await it("a returning visitor comes back to the ending, not to the knock", async () => {
    const w = await boot();
    await enter(w, '.door[data-id="the-unwritten"] input', "I AM NOBODY", () => $(w, "#black"));
    await enter(w, "#black input", "VOID", () => $(w, ".bpay").innerHTML);
    const saved = w.localStorage.getItem("void-vault");
    const back = await boot({ localStore: { "void-vault": saved } });
    await waitFor(() => $(back, ".bpay") && $(back, ".bpay").innerHTML);
    assert.ok(back.document.body.classList.contains("blackout"));
    assert.match($(back, ".bpay").textContent, /the name, handed back/);
    assert.ok($(back, "#black").classList.contains("instant"),
      "the world does not strip away a second time");
  });

  console.log("\npadding and iterations\n");

  await it("payload padding is stripped on the way out", async () => {
    const w = await boot();
    await enter(w, '.door[data-id="the-unwritten"] input', "I AM NOBODY");
    await enter(w, "#black input", "I AM VOID");
    assert.strictEqual($(w, ".bpay").innerHTML.trim(), STAGE2,
      "no trailing NULs should survive into the DOM");
  });

  await it("padding makes a short payload weigh the same as a long one", async () => {
    const short = await seal("SAME", "<p>x</p>");
    const long = await seal("SAME", "<p>" + "x".repeat(1500) + "</p>");
    assert.strictEqual(short.ct.length, long.ct.length,
      "ciphertext length must stop leaking how much sits behind a door");
  });

  await it("600k entries open, and the two legacy 100k entries still do too", async () => {
    const w = await boot();                         // finale is sealed at 600k
    await enter(w, '.door[data-id="the-unwritten"] input', "I AM NOBODY", () => $(w, "#black"));
    assert.ok($(w, "#black"), "an explicit iters is honoured");

    const legacy = w.VOID_CONFIG.VAULT.find(v => v.id === "the-rules");
    assert.strictEqual(legacy.iters, undefined, "the originals carry no iters");
    await enter(w, '.door[data-id="the-rules"] input', "WITNESS",
      () => $(w, '.door[data-id="the-rules"]').dataset.state === "read");
    assert.strictEqual($(w, '.door[data-id="the-rules"]').dataset.state, "read",
      "absent iters must fall back to 100000");
  });

  console.log(`\n${pass} passed, ${fail} failed\n`);
  process.exit(fail ? 1 : 0);
})();
