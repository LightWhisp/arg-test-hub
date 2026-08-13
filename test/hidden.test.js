/* Reverse-at-speed and the permanent sub-audio unlock — regression test.

   Beat 1.12 hides a sub-audio behind holding the Tails capture in reverse
   at 0.5×. The rule from §8.7 is that no puzzle may be gated behind owning
   a tool, so the controls are on the site — and the rule from §8.1 is that
   reverse-at-speed is a first-class mechanic rather than a one-off, so the
   find has to survive a reload. Both are what this checks.

   Unlike the playback-bench harness, this one runs a CLOCK: Web Audio
   currentTime advances and requestAnimationFrame actually fires, because
   the unlock is measured in seconds held rather than in clicks.

   setup:  npm install jsdom
   run:    node test/hidden.test.js           (exits non-zero on failure)   */
const { JSDOM } = require("jsdom");
const fs = require("fs"), path = require("path"), assert = require("assert");
const R = path.join(__dirname, "..");

function fakeBuffer(peak = 0.5, dur = 18) {
  const len = 4096, data = new Float32Array(len).fill(peak * 0.5);
  data[0] = peak;
  return { duration: dur, length: len, sampleRate: 44100, numberOfChannels: 1,
           getChannelData: () => data, copyToChannel: () => {} };
}

async function boot({ localStore = {} } = {}) {
  const dom = new JSDOM(fs.readFileSync(path.join(R, "index.html"), "utf8"),
    { runScripts: "outside-only", pretendToBeVisual: true });
  const w = dom.window;
  const def = (k, v) => Object.defineProperty(w, k, { value: v, configurable: true });
  def("crypto", require("crypto").webcrypto);
  const ls = { ...localStore };
  def("localStorage", { getItem: k => ls[k] ?? null, setItem: (k, v) => ls[k] = String(v) });
  w.matchMedia = () => ({ matches: false, addListener() {}, removeListener() {} });
  w.Path2D = function () {}; w.devicePixelRatio = 1;
  w.HTMLCanvasElement.prototype.getContext = () => new Proxy({}, { get: (t, p) =>
    p === "createImageData" ? (a, b) => ({ data: new Uint8ClampedArray(a * b * 4) })
    : p === "createPattern" ? () => ({}) : () => {} });

  w.__clock = 0;                                   // seconds, advanced by tests
  w.requestAnimationFrame = cb => setTimeout(() => cb(0), 1);
  w.AudioContext = function () {
    Object.defineProperty(this, "currentTime", { get: () => w.__clock });
    this.state = "running"; this.destination = {}; this.resume = () => {};
    this.decodeAudioData = async () => fakeBuffer();
    this.createBuffer = () => fakeBuffer();
    this.createBufferSource = () => ({ buffer: null, playbackRate: { value: 1 },
      connect: n => n, start() {}, stop() {}, onended: null });
    this.createGain = () => ({ gain: { value: 1 }, connect: n => n });
  };
  w.fetch = async () => ({ ok: true, arrayBuffer: async () => new ArrayBuffer(8) });

  for (const f of ["config.js", "bench-data.js", "script.js"])
    w.eval(fs.readFileSync(path.join(R, f), "utf8"));
  await (w.__voidReady || new Promise(r => setTimeout(r, 120)));
  await new Promise(r => setTimeout(r, 20));
  return w;
}

const rec = (w, id) => w.document.querySelector(`.rec[data-id="${id}"]`);
const click = (w, el) => el.dispatchEvent(new w.Event("click", { bubbles: true }));

/* run the transport for `secs` of audio-clock time, letting rAF tick */
async function hold(w, secs, step = 0.5) {
  for (let t = 0; t < secs; t += step) {
    w.__clock += step;
    await new Promise(r => setTimeout(r, 4));
  }
}

/* park the playhead mid-file so reverse has somewhere to run */
function seekMiddle(w, r) {
  const bar = r.querySelector(".bar");
  bar.getBoundingClientRect = () => ({ left: 0, width: 100 });
  bar.dispatchEvent(new w.MouseEvent("click", { bubbles: true, clientX: 50 }));
}

async function findIt(w) {
  const r = rec(w, "fragment03");
  seekMiddle(w, r);
  click(w, r.querySelector(".rev"));
  click(w, r.querySelector('[data-rate="0.5"]'));
  click(w, r.querySelector(".pp"));
  await hold(w, 6);
  return r;
}

let pass = 0, fail = 0;
const it = async (n, f) => { try { await f(); console.log("  PASS  " + n); pass++; }
  catch (e) { console.log("  FAIL  " + n + "\n        " + e.message); fail++; } };

(async () => {
  console.log("\nreverse at speed\n");

  await it("nothing is hidden on a recording that declares nothing hidden", async () => {
    const w = await boot();
    const r = rec(w, "fragment02");
    seekMiddle(w, r);
    click(w, r.querySelector(".rev"));
    click(w, r.querySelector('[data-rate="0.5"]'));
    click(w, r.querySelector(".pp"));
    await hold(w, 6);
    assert.strictEqual(r.querySelector(".sub").innerHTML, "");
  });

  await it("holding the stated direction and rate unlocks the sub-audio", async () => {
    const w = await boot();
    const r = await findIt(w);
    assert.ok(r.classList.contains("has-sub"), "the find should be surfaced");
    assert.ok(r.querySelector(".sub").innerHTML.includes("sub-audio"));
    assert.ok(r.querySelector(".sub audio"), "the sub-audio gets its own player");
  });

  await it("reverse alone is not enough — the rate is part of the instruction", async () => {
    const w = await boot();
    const r = rec(w, "fragment03");
    seekMiddle(w, r);
    click(w, r.querySelector(".rev"));            // reverse, but left at 1×
    click(w, r.querySelector(".pp"));
    await hold(w, 6);
    assert.strictEqual(r.querySelector(".sub").innerHTML, "");
  });

  await it("the right rate playing forwards is not enough either", async () => {
    const w = await boot();
    const r = rec(w, "fragment03");
    seekMiddle(w, r);
    click(w, r.querySelector('[data-rate="0.5"]'));
    click(w, r.querySelector(".pp"));
    await hold(w, 6);
    assert.strictEqual(r.querySelector(".sub").innerHTML, "");
  });

  await it("a brush past the right state does not count — it has to be held", async () => {
    const w = await boot();
    const r = rec(w, "fragment03");
    seekMiddle(w, r);
    click(w, r.querySelector(".rev"));
    click(w, r.querySelector('[data-rate="0.5"]'));
    click(w, r.querySelector(".pp"));
    await hold(w, 1.5);                           // under `after`
    assert.strictEqual(r.querySelector(".sub").innerHTML, "");
  });

  await it("the find is permanent — it survives a reload", async () => {
    const w = await boot();
    await findIt(w);
    const saved = w.localStorage.getItem("void-found");
    assert.ok(saved, "the find is written down");
    const back = await boot({ localStore: { "void-found": saved } });
    assert.ok(rec(back, "fragment03").querySelector(".sub").innerHTML.includes("sub-audio"),
      "nobody should have to find the same thing twice");
  });

  await it("a find outlives the recording it was found in", async () => {
    /* the sub-audio file may not be cut yet, or the parent may 404 later.
       Neither should take away something already found. */
    const w = await boot();
    await findIt(w);
    const saved = w.localStorage.getItem("void-found");
    const dom = await boot({ localStore: { "void-found": saved } });
    dom.fetch = async () => ({ ok: false });
    assert.ok(rec(dom, "fragment03").classList.contains("has-sub"));
  });

  await it("no tool is required: the controls that find it are on the page", async () => {
    const w = await boot();
    const r = rec(w, "fragment03");
    assert.ok(r.querySelector(".rev"), "reverse is a button on the site");
    assert.ok(r.querySelector('[data-rate="0.5"]'), "0.5x is a button on the site");
  });

  console.log(`\n${pass} passed, ${fail} failed\n`);
  process.exit(fail ? 1 : 0);
})();
