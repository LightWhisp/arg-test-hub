/* Playback bench — regression test.
   Web Audio does not exist in jsdom, so AudioContext is stubbed. What is
   under test is the wiring: normalisation, cues, volume fan-out, transport
   state, and the missing-file path.                                        */
const { JSDOM } = require("jsdom");
const fs = require("fs"), path = require("path"), assert = require("assert");
const R = path.join(__dirname, "..");

/* a buffer whose peak we control, so normalisation is checkable */
function fakeBuffer(peak, dur = 18) {
  const len = 4096, data = new Float32Array(len).fill(peak * 0.5);
  data[0] = peak;
  return { duration: dur, length: len, sampleRate: 44100, numberOfChannels: 1,
           getChannelData: () => data, copyToChannel: () => {} };
}

async function boot({ peak = 0.27, missing = [], store = {} } = {}) {
  const dom = new JSDOM(fs.readFileSync(path.join(R, "index.html"), "utf8"),
    { runScripts: "outside-only", pretendToBeVisual: true });
  const w = dom.window;
  const def = (k, v) => Object.defineProperty(w, k, { value: v, configurable: true });
  def("crypto", require("crypto").webcrypto);
  const ls = { ...store };
  def("localStorage", { getItem: k => ls[k] ?? null, setItem: (k, v) => ls[k] = String(v) });
  w.matchMedia = () => ({ matches: false, addListener(){}, removeListener(){} });
  w.requestAnimationFrame = () => 0; w.devicePixelRatio = 1; w.Path2D = function(){};
  w.HTMLCanvasElement.prototype.getContext = () => new Proxy({}, { get: (t,p) =>
    p === "createImageData" ? (a,b)=>({data:new Uint8ClampedArray(a*b*4)})
    : p === "createPattern" ? ()=>({}) : ()=>{} });

  w.__gains = [];
  w.AudioContext = function () {
    this.currentTime = 0; this.state = "running"; this.destination = {};
    this.resume = () => {};
    this.decodeAudioData = async () => fakeBuffer(peak);
    this.createBuffer = () => fakeBuffer(peak);
    this.createBufferSource = () => ({ buffer: null, playbackRate: { value: 1 },
      connect: n => n, start(){}, stop(){}, onended: null });
    this.createGain = () => { const g = { gain: { value: 1 }, connect: n => n };
      w.__gains.push(g); return g; };
  };
  w.fetch = async url => missing.some(m => String(url).includes(m))
    ? { ok: false } : { ok: true, arrayBuffer: async () => new ArrayBuffer(8) };

  for (const f of ["config.js","bench-data.js","script.js"])
    w.eval(fs.readFileSync(path.join(R, f), "utf8"));
  await (w.__voidReady || new Promise(r => setTimeout(r, 120)));
  await new Promise(r => setTimeout(r, 0));
  return w;
}
const rec = (w, id) => w.document.querySelector(`.rec[data-id="${id}"]`);
const click = (w, el) => el.dispatchEvent(new w.Event("click", { bubbles: true }));

let pass = 0, fail = 0;
const it = async (n, f) => { try { await f(); console.log("  PASS  " + n); pass++; }
  catch (e) { console.log("  FAIL  " + n + "\n        " + e.message); fail++; } };

(async () => {
  console.log("\nplayback bench\n");

  await it("one player per entry in CFG.RECORDINGS — adding audio is config only", async () => {
    const w = await boot();
    /* driven off the config, not a magic number — adding a recording should
       never mean editing this line */
    const ids = Array.from(w.VOID_CONFIG.RECORDINGS).map(r => r.id);
    assert.strictEqual(w.document.querySelectorAll(".rec").length, ids.length);
    for (const id of ids) assert.ok(rec(w, id), `no player for ${id}`);
  });

  await it("a loaded recording goes live and reports its duration and structure", async () => {
    const w = await boot();
    const r = rec(w, "fragment02");
    assert.ok(r.classList.contains("live"));
    assert.strictEqual(r.querySelector(".dur").textContent, "0:18");
    assert.strictEqual(r.querySelector(".rec-state").textContent, "rupture");
  });

  await it("a missing file is a teaser, not an error", async () => {
    const w = await boot({ missing: ["fragment03"] });
    const r = rec(w, "fragment03");
    assert.ok(r.classList.contains("missing"));
    assert.strictEqual(r.querySelector(".rec-state").textContent, "not yet recovered");
    assert.ok([...r.querySelectorAll("button")].every(b => b.disabled), "controls must be dead");
  });

  await it("subtitles are disabled when a recording has no cues", async () => {
    const w = await boot();
    assert.ok(rec(w, "fragment03").querySelector(".cc").disabled);
    assert.ok(!rec(w, "fragment02").querySelector(".cc").disabled);
  });

  await it("a quiet track is normalised up; the gain is clamped, not unbounded", async () => {
    const w = await boot({ peak: 0.27 });
    click(w, rec(w, "fragment02").querySelector(".pp"));
    const g = w.__gains.at(-1).gain.value;          // norm * volume
    assert.ok(Math.abs(g - (0.9 / 0.27) * 0.8) < 0.01, "gain was " + g);
    const w2 = await boot({ peak: 0.001 });         // near-silence must not explode
    click(w2, rec(w2, "fragment02").querySelector(".pp"));
    assert.ok(w2.__gains.at(-1).gain.value <= 6 * 0.8 + 1e-9, "clamp breached");
  });

  await it("a hot track is normalised down", async () => {
    const w = await boot({ peak: 1.0 });
    click(w, rec(w, "fragment02").querySelector(".pp"));
    assert.ok(w.__gains.at(-1).gain.value < 0.8, "should be attenuated below unity volume");
  });

  await it("volume is one preference, shared across every player and persisted", async () => {
    const w = await boot();
    const v = rec(w, "fragment02").querySelector(".v");
    v.value = "0.35";
    v.dispatchEvent(new w.Event("input", { bubbles: true }));
    assert.strictEqual(rec(w, "fragment03").querySelector(".v").value, "0.35", "did not fan out");
    assert.strictEqual(w.localStorage.getItem("void-volume"), "0.35");
  });

  await it("a stored volume is restored on the next visit", async () => {
    const w = await boot({ store: { "void-volume": "0.25" } });
    assert.strictEqual(rec(w, "fragment02").querySelector(".v").value, "0.25");
  });

  await it("play and pause flip the transport state", async () => {
    const w = await boot();
    const r = rec(w, "fragment02"), pp = r.querySelector(".pp");
    click(w, pp);
    assert.ok(r.classList.contains("playing"));
    assert.strictEqual(pp.getAttribute("aria-label"), "pause");
    click(w, pp);
    assert.ok(!r.classList.contains("playing"));
    assert.strictEqual(pp.getAttribute("aria-label"), "play");
  });

  await it("speed selection moves the active segment", async () => {
    const w = await boot();
    const seg = rec(w, "fragment02").querySelector(".seg");
    click(w, seg.querySelector('[data-rate="0.5"]'));
    assert.ok(seg.querySelector('[data-rate="0.5"]').classList.contains("on"));
    assert.ok(!seg.querySelector('[data-rate="1"]').classList.contains("on"));
  });

  await it("reverse is a pressed toggle and marks the track", async () => {
    const w = await boot();
    const r = rec(w, "fragment02"), rev = r.querySelector(".rev");
    click(w, rev);
    assert.strictEqual(rev.getAttribute("aria-pressed"), "true");
    assert.ok(r.classList.contains("reversed"));
    click(w, rev);
    assert.strictEqual(rev.getAttribute("aria-pressed"), "false");
  });

  await it("subtitles show the cue for the current position, and nothing when off", async () => {
    const w = await boot();
    const r = rec(w, "fragment02");
    assert.strictEqual(r.querySelector(".cue").textContent, "", "should start silent");
    click(w, r.querySelector(".cc"));
    assert.ok(r.querySelector(".cue").textContent.includes("the ark"),
      "at 0s the first cue should show, got: " + r.querySelector(".cue").textContent);
    click(w, r.querySelector(".cc"));
    assert.strictEqual(r.querySelector(".cue").textContent, "");
  });

  await it("the scrub bar is reachable and announced for keyboard users", async () => {
    const w = await boot();
    const bar = rec(w, "fragment02").querySelector(".bar");
    assert.strictEqual(bar.getAttribute("role"), "slider");
    assert.strictEqual(bar.getAttribute("tabindex"), "0");
    assert.ok(bar.hasAttribute("aria-valuenow"));
  });

  console.log(`\n${pass} passed, ${fail} failed\n`);
  process.exit(fail ? 1 : 0);
})();
