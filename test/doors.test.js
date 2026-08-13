/* Door state machine — regression test.
   Runs the real script.js against the real config.js in jsdom with real
   WebCrypto, so decryption is genuine rather than mocked.

   setup:  npm install jsdom
   run:    node test/doors.test.js          (exits non-zero on failure)      */
const { JSDOM } = require("jsdom");
const fs = require("fs"), path = require("path"), assert = require("assert");
const R = path.join(__dirname, "..");

async function boot({ localStore = {}, community = { "the-rules": "WITNESS" }, act } = {}) {
  const dom = new JSDOM(fs.readFileSync(path.join(R, "index.html"), "utf8"),
    { runScripts: "outside-only", pretendToBeVisual: true });
  const w = dom.window;
  const def = (k, v) => Object.defineProperty(w, k, { value: v, configurable: true });
  def("crypto", require("crypto").webcrypto);          // jsdom's is a getter, no .subtle
  const ls = { ...localStore };
  def("localStorage", { getItem: k => ls[k] ?? null, setItem: (k, v) => ls[k] = v });
  w.matchMedia = () => ({ matches: false, addListener() {}, removeListener() {} });
  w.fetch = async () => ({ ok: true, json: async () => ({ transcribed: community }) });
  w.requestAnimationFrame = () => 0;
  w.devicePixelRatio = 1;
  w.Path2D = function () {};
  w.HTMLCanvasElement.prototype.getContext = () => new Proxy({}, { get: (t, p) =>
    p === "createImageData" ? (a, b) => ({ data: new Uint8ClampedArray(a * b * 4) })
    : p === "createPattern" ? () => ({}) : () => {} });

  w.eval(fs.readFileSync(path.join(R, "config.js"), "utf8"));
  w.eval(fs.readFileSync(path.join(R, "script.js"), "utf8"));
  await (w.__voidReady || new Promise(r => setTimeout(r, 120)));
  await new Promise(r => setTimeout(r, 0));
  /* Key derivation is deliberately slow, so "type an answer then sleep
     150ms" was a race that held only while the machine was idle — under
     any real load it failed as a wrong answer, which looks identical to a
     bug. Wait for the door to actually settle instead. At 600k iterations
     a fixed sleep would be hopeless. */
  if (act) { await act(w); await settle(w); }
  return w;
}

/* script.js counts decrypt attempts in flight and resolves __voidIdle when
   none are left. Awaiting that is exact; the 150ms sleep this replaces was
   a guess that held only while the machine was idle. */
const settle = async w => {
  await new Promise(r => setTimeout(r, 0));
  await (w.__voidIdle ? w.__voidIdle() : new Promise(r => setTimeout(r, 150)));
  await new Promise(r => setTimeout(r, 0));
};

const door = (w, id) => [...w.document.querySelectorAll(".door")].find(d => d.dataset.id === id);
const type = (w, id, val) => {
  const i = door(w, id).querySelector("input");
  i.value = val;
  i.dispatchEvent(new w.KeyboardEvent("keydown", { key: "Enter" }));
};

let pass = 0, fail = 0;
async function it(name, fn) {
  try { await fn(); console.log("  PASS  " + name); pass++; }
  catch (e) { console.log("  FAIL  " + name + "\n        " + e.message); fail++; }
}

(async () => {
  console.log("\ndoor state machine\n");

  await it("first visit: held / transcribed / not indexed resolve correctly", async () => {
    const w = await boot();
    assert.strictEqual(door(w, "the-emptied").dataset.state, "held");
    assert.strictEqual(door(w, "the-rules").dataset.state, "transcribed");
    assert.strictEqual(door(w, "the-unwritten").dataset.state, "not-indexed");
  });

  await it("phantom door renders its number with nothing behind it", async () => {
    const w = await boot();
    const d = door(w, "the-unwritten");
    assert.strictEqual(d.querySelector(".id").textContent, "entry 900");
    assert.strictEqual(d.querySelector(".status").textContent, "not indexed");
    assert.strictEqual(d.querySelector(".payload").innerHTML.trim(), "");
  });

  await it("solving yourself opens to read, without the transcript flag", async () => {
    const w = await boot({ act: async w => type(w, "the-rules", "WITNESS") });
    const d = door(w, "the-rules");
    assert.strictEqual(d.dataset.state, "read");
    assert.ok(d.querySelector(".payload").innerHTML.includes("THE RULES"));
    assert.ok(!d.classList.contains("via-transcript"), "should not be flagged as transcript");
  });

  await it("taking the transcription opens to read WITH the transcript flag", async () => {
    const w = await boot({ act: async w =>
      door(w, "the-rules").querySelector(".tbtn").dispatchEvent(new w.Event("click")) });
    const d = door(w, "the-rules");
    assert.strictEqual(d.dataset.state, "read");
    assert.ok(d.classList.contains("via-transcript"), "margins should be revealed");
  });

  await it("her margins exist in the payload either way — CSS gates them", async () => {
    const w = await boot({ act: async w => type(w, "the-rules", "WITNESS") });
    assert.ok(door(w, "the-rules").querySelector(".payload .margin"));
  });

  await it("the emptied door opens onto nothing", async () => {
    const w = await boot({ act: async w => type(w, "the-emptied", "six ninety nine hundred") });
    const d = door(w, "the-emptied");
    assert.strictEqual(d.dataset.state, "emptied");
    assert.strictEqual(d.querySelector(".payload").innerHTML.trim(), "",
      "the emptied marker must never reach the DOM");
  });

  await it("answer normalisation ignores case and spacing", async () => {
    const w = await boot({ act: async w => type(w, "the-emptied", "SixNinetyNineHundred") });
    assert.strictEqual(door(w, "the-emptied").dataset.state, "emptied");
  });

  await it("a wrong answer holds the door and speaks in her register", async () => {
    const w = await boot({ act: async w => type(w, "the-emptied", "NOPE") });
    const d = door(w, "the-emptied");
    assert.strictEqual(d.dataset.state, "held");
    assert.strictEqual(d.querySelector(".whisper").textContent, "no match in index.");
  });

  await it("returning visitor: legacy string in localStorage still restores", async () => {
    const w = await boot({ localStore: { "void-vault": JSON.stringify({ "the-rules": "WITNESS" }) } });
    assert.strictEqual(door(w, "the-rules").dataset.state, "read");
  });

  await it("returning visitor: new object format preserves how it was opened", async () => {
    const w = await boot({ localStore: { "void-vault":
      JSON.stringify({ "the-rules": { a: "WITNESS", t: true } }) } });
    assert.ok(door(w, "the-rules").classList.contains("via-transcript"));
  });

  await it("no state.json: doors fall back to held rather than breaking", async () => {
    const w = await boot({ community: {} });
    assert.strictEqual(door(w, "the-rules").dataset.state, "held");
  });

  console.log(`\n${pass} passed, ${fail} failed\n`);
  process.exit(fail ? 1 : 0);
})();
