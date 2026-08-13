/* Encrypted audio — regression test.

   Seals real bytes with node's WebCrypto exactly the way vault_tool.py
   --audio does, then checks the three states that matter:

     not yet recovered   there is no file
     sealed              the file is right there, downloadable, and useless
     recovered           a door handed over the key

   The key is never typed. It rides inside a door payload as
   <i hidden data-unlocks data-key>, which is the join between the puzzles
   and the recordings.

   setup:  npm install jsdom
   run:    node test/sealed.test.js           (exits non-zero on failure)   */
const { JSDOM } = require("jsdom");
const fs = require("fs"), path = require("path"), assert = require("assert");
const { webcrypto } = require("crypto");
const R = path.join(__dirname, "..");

const b64 = u => Buffer.from(u).toString("base64");
const RAW = new Uint8Array(512).map((_, i) => i & 0xff);   // stands in for an mp3
const TRACK_KEY = "Zm9vYmFyLXNlY3JldC1rZXk";               // as generated, not normalised

async function sealBytes(secret, bytes, iters = 600000) {
  const salt = webcrypto.getRandomValues(new Uint8Array(16));
  const iv = webcrypto.getRandomValues(new Uint8Array(12));
  const km = await webcrypto.subtle.importKey("raw",
    new TextEncoder().encode(secret), "PBKDF2", false, ["deriveKey"]);
  const key = await webcrypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: iters, hash: "SHA-256" },
    km, { name: "AES-GCM", length: 256 }, false, ["encrypt"]);
  const ct = await webcrypto.subtle.encrypt({ name: "AES-GCM", iv }, key, bytes);
  return { sealed: { salt: b64(salt), iv: b64(iv), iters }, ct };
}

/* a door sealed the way vault_tool.py seals one, so the key can be delivered
   through the real decrypt path rather than by poking innerHTML */
const PAD_BLOCK = 2048;
const normAns = a => a.toUpperCase().replace(/[^A-Z]/g, "");
async function sealText(answer, html, iters = 600000) {
  const body = new TextEncoder().encode(html);
  const padded = new Uint8Array(Math.ceil(body.length / PAD_BLOCK) * PAD_BLOCK);
  padded.set(body);
  const { sealed, ct } = await sealBytes(normAns(answer), padded, iters);
  return { ...sealed, ct: b64(new Uint8Array(ct)) };
}

let SEALED, KEYDOOR;

async function boot({ localStore = {}, fileMissing = false } = {}) {
  const dom = new JSDOM(fs.readFileSync(path.join(R, "index.html"), "utf8"),
    { runScripts: "outside-only", pretendToBeVisual: true });
  const w = dom.window;
  const def = (k, v) => Object.defineProperty(w, k, { value: v, configurable: true });
  def("crypto", webcrypto);
  const ls = { ...localStore };
  def("localStorage", { getItem: k => ls[k] ?? null, setItem: (k, v) => ls[k] = String(v) });
  w.matchMedia = () => ({ matches: false, addListener() {}, removeListener() {} });
  w.requestAnimationFrame = () => 0; w.devicePixelRatio = 1; w.Path2D = function () {};
  w.HTMLCanvasElement.prototype.getContext = () => new Proxy({}, { get: (t, p) =>
    p === "createImageData" ? (a, b) => ({ data: new Uint8ClampedArray(a * b * 4) })
    : p === "createPattern" ? () => ({}) : () => {} });

  /* decodeAudioData hands back what it was given, so the test can assert the
     bytes that reached it are the plaintext rather than the ciphertext */
  w.__decoded = [];
  w.AudioContext = function () {
    this.currentTime = 0; this.state = "running"; this.destination = {};
    this.resume = () => {};
    this.decodeAudioData = async buf => {
      w.__decoded.push(new Uint8Array(buf));
      return { duration: 12, length: 4096, sampleRate: 44100, numberOfChannels: 1,
               getChannelData: () => new Float32Array(4096).fill(0.4),
               copyToChannel: () => {} };
    };
    this.createBuffer = () => ({ duration: 12, length: 1, sampleRate: 44100,
      numberOfChannels: 1, getChannelData: () => new Float32Array(1), copyToChannel: () => {} });
    this.createBufferSource = () => ({ buffer: null, playbackRate: { value: 1 },
      connect: n => n, start() {}, stop() {}, onended: null });
    this.createGain = () => ({ gain: { value: 1 }, connect: n => n });
  };
  w.fetch = async url => {
    const u = String(url);
    if (u.includes("state.json")) return { ok: true, json: async () => ({ transcribed: {} }) };
    if (u.includes("fragment04.enc"))
      return fileMissing ? { ok: false } : { ok: true, arrayBuffer: async () => SEALED.ct };
    return { ok: true, arrayBuffer: async () => new ArrayBuffer(8) };
  };

  w.eval(fs.readFileSync(path.join(R, "config.js"), "utf8"));
  const f4 = Array.from(w.VOID_CONFIG.RECORDINGS).find(r => r.id === "fragment04");
  f4.sealed = JSON.parse(JSON.stringify(SEALED.sealed));
  /* a real door whose real payload carries the track key */
  w.VOID_CONFIG.VAULT.push({ id: "the-handshake", ...JSON.parse(JSON.stringify(KEYDOOR)) });
  w.VOID_CONFIG.DOOR_TEXT["the-handshake"] =
    { label: "entry 048", provenance: "recovered", prompt: "A shopfront, fully instanced." };
  w.eval(fs.readFileSync(path.join(R, "bench-data.js"), "utf8"));
  w.eval(fs.readFileSync(path.join(R, "script.js"), "utf8"));
  await (w.__voidReady || new Promise(r => setTimeout(r, 120)));
  await settle(w);
  return w;
}

const settle = async (w, ms = 6000) => {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) {
    await new Promise(r => setTimeout(r, 15));
    if (w.__voidIdle) await w.__voidIdle();
    if (!w.document.querySelector('.rec[data-id="fragment04"] .rec-state')) continue;
    const s = w.document.querySelector('.rec[data-id="fragment04"] .rec-state').textContent;
    if (s !== "loading") return;
  }
};
/* settle() only proves the door is done; the track reloads on its own after
   the key lands, so wait for the state it is supposed to reach. */
const waitState = async (w, want, ms = 6000) => {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) {
    if (state(w) === want) return true;
    await new Promise(r => setTimeout(r, 15));
  }
  return false;
};
const rec = (w, id) => w.document.querySelector(`.rec[data-id="${id}"]`);
const state = w => rec(w, "fragment04").querySelector(".rec-state").textContent;

let pass = 0, fail = 0;
const it = async (n, f) => { try { await f(); console.log("  PASS  " + n); pass++; }
  catch (e) { console.log("  FAIL  " + n + "\n        " + e.message); fail++; } };

(async () => {
  console.log("\nencrypted audio\n");
  SEALED = await sealBytes(TRACK_KEY, RAW);
  KEYDOOR = await sealText("A SHOPFRONT",
    `<h3>entry 048</h3><p>Something new is in the plane. A shopfront. He is furnishing.</p>` +
    `<i hidden data-unlocks="fragment04" data-key="${TRACK_KEY}"></i>`);

  await it("a sealed track without its key reads as sealed, not as missing", async () => {
    const w = await boot();
    assert.strictEqual(state(w), "sealed");
    assert.ok(rec(w, "fragment04").classList.contains("locked"));
    assert.ok(!rec(w, "fragment04").classList.contains("missing"),
      "sealed and not-yet-recovered are different states");
  });

  await it("its transport is dead, so the taunt cannot be mistaken for a bug", async () => {
    const w = await boot();
    const r = rec(w, "fragment04");
    assert.ok([...r.querySelectorAll("button")].every(b => b.disabled));
  });

  await it("no key means nothing is decoded — the ciphertext never reaches the decoder", async () => {
    const w = await boot();
    const unsealed = Array.from(w.VOID_CONFIG.RECORDINGS).filter(r => !r.sealed).length;
    assert.strictEqual(w.__decoded.length, unsealed,
      "only the unsealed recordings should have reached the decoder");
  });

  await it("opening the right door hands over the key and the track goes live", async () => {
    const w = await boot();
    assert.strictEqual(state(w), "sealed", "sealed before the door is opened");
    const i = w.document.querySelector('.door[data-id="the-handshake"] input');
    i.value = "A SHOPFRONT";
    i.dispatchEvent(new w.KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    await settle(w);
    assert.strictEqual(w.document.querySelector('.door[data-id="the-handshake"]').dataset.state,
      "read", "the door opened");
    assert.deepStrictEqual(JSON.parse(w.localStorage.getItem("void-keys")),
      { fragment04: TRACK_KEY }, "the payload handed the key over");
    assert.ok(await waitState(w, "handshake"), "and the track reloads itself");
    assert.ok(rec(w, "fragment04").classList.contains("live"));
  });

  await it("the key is not visible in the door payload a player can read", async () => {
    const w = await boot();
    const i = w.document.querySelector('.door[data-id="the-handshake"] input');
    i.value = "A SHOPFRONT";
    i.dispatchEvent(new w.KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    await settle(w);
    const pay = w.document.querySelector('.door[data-id="the-handshake"] .payload');
    assert.match(pay.textContent, /shopfront/, "her note is readable");
    assert.ok(!pay.textContent.includes(TRACK_KEY), "the key is not rendered as text");
  });

  await it("with the key present the plaintext bytes reach the decoder", async () => {
    const w = await boot({ localStore: {
      "void-keys": JSON.stringify({ fragment04: TRACK_KEY }) } });
    assert.ok(await waitState(w, "handshake"));
    assert.ok(rec(w, "fragment04").classList.contains("live"));
    const got = w.__decoded.find(b => b.length === RAW.length);
    assert.ok(got, "something the size of the plaintext was decoded");
    assert.deepStrictEqual([...got], [...RAW], "decoded bytes must be the original file");
  });

  await it("the unlock is permanent — it survives a reload", async () => {
    const w = await boot({ localStore: {
      "void-keys": JSON.stringify({ fragment04: TRACK_KEY }) } });
    assert.ok(rec(w, "fragment04").classList.contains("live"));
  });

  await it("a wrong key reads as sealed rather than as a broken player", async () => {
    const w = await boot({ localStore: {
      "void-keys": JSON.stringify({ fragment04: "not-the-key" }) } });
    assert.strictEqual(state(w), "sealed");
    assert.ok(rec(w, "fragment04").classList.contains("locked"));
  });

  await it("no file at all is still 'not yet recovered', key or no key", async () => {
    const w = await boot({ fileMissing: true, localStore: {
      "void-keys": JSON.stringify({ fragment04: TRACK_KEY }) } });
    assert.strictEqual(state(w), "not yet recovered");
    assert.ok(rec(w, "fragment04").classList.contains("missing"));
  });

  await it("the track key is nowhere in the repo", async () => {
    for (const f of ["config.js", "script.js", "index.html"]) {
      const src = fs.readFileSync(path.join(R, f), "utf8");
      assert.ok(!src.includes(TRACK_KEY), `${f} carries a track key`);
    }
    /* and the config slot ships empty, the same way FINALE does */
    const cfg = fs.readFileSync(path.join(R, "config.js"), "utf8");
    assert.match(cfg, /sealed:\s*null/);
  });

  console.log(`\n${pass} passed, ${fail} failed\n`);
  process.exit(fail ? 1 : 0);
})();
