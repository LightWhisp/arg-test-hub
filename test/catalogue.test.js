/* The index, the order and the filing — regression test.

   Runs the real script.js against the real config.js in jsdom. The act dial
   and the margins toggle are mutated on the live config before script.js is
   evaluated, so these tests exercise the shipping content rather than a
   fixture that can drift away from it.

   setup:  npm install jsdom
   run:    node test/catalogue.test.js        (exits non-zero on failure)   */
const { JSDOM } = require("jsdom");
const fs = require("fs"), path = require("path"), assert = require("assert");
const R = path.join(__dirname, "..");

async function boot({ act, margins, motion, reduced = false, localStore = {}, opened = {} } = {}) {
  const dom = new JSDOM(fs.readFileSync(path.join(R, "index.html"), "utf8"),
    { runScripts: "outside-only", pretendToBeVisual: true });
  const w = dom.window;
  const def = (k, v) => Object.defineProperty(w, k, { value: v, configurable: true });
  def("crypto", require("crypto").webcrypto);
  const ls = { ...localStore };
  def("localStorage", { getItem: k => ls[k] ?? null, setItem: (k, v) => ls[k] = String(v) });
  w.matchMedia = () => ({ matches: reduced, addListener() {}, removeListener() {} });
  w.fetch = async () => ({ ok: true, json: async () => ({ transcribed: {} }) });
  w.requestAnimationFrame = () => 0; w.devicePixelRatio = 1; w.Path2D = function () {};
  w.HTMLCanvasElement.prototype.getContext = () => new Proxy({}, { get: (t, p) =>
    p === "createImageData" ? (a, b) => ({ data: new Uint8ClampedArray(a * b * 4) })
    : p === "createPattern" ? () => ({}) : () => {} });

  w.eval(fs.readFileSync(path.join(R, "config.js"), "utf8"));
  if (act != null) w.VOID_CONFIG.ACT = act;
  if (margins != null) w.VOID_CONFIG.MARGINS = margins;
  if (motion != null) w.VOID_CONFIG.MOTION = motion;
  w.eval(fs.readFileSync(path.join(R, "bench-data.js"), "utf8"));
  w.eval(fs.readFileSync(path.join(R, "script.js"), "utf8"));
  await (w.__voidReady || new Promise(r => setTimeout(r, 120)));
  await new Promise(r => setTimeout(r, 0));
  return w;
}

const $ = (w, s) => w.document.querySelector(s);
const $$ = (w, s) => [...w.document.querySelectorAll(s)];
const type = (w, sel, v) => { const i = $(w, sel); i.value = v;
  i.dispatchEvent(new w.Event("input", { bubbles: true })); };
const click = (w, el) => el.dispatchEvent(new w.Event("click", { bubbles: true }));
const tick = (ms = 340) => new Promise(r => setTimeout(r, ms));
/* a number you can click is a record she wrote whose act has landed */
const nums = w => $$(w, "button.cat-num").map(b => +b.dataset.n);
const absent = w => $$(w, ".cat-num.absent").length;
const chip = (w, n) => $(w, `.cat-num[data-n="${n}"]`);
const card = w => $(w, ".cat-card");
const openN = async (w, n) => { click(w, chip(w, n)); await tick(0); return card(w); };

let pass = 0, fail = 0;
const it = async (n, f) => { try { await f(); console.log("  PASS  " + n); pass++; }
  catch (e) { console.log("  FAIL  " + n + "\n        " + e.message); fail++; } };

(async () => {
  console.log("\nthe index — the number log\n");
  const w0 = await boot({ act: 99 });   // every entry visible, for file-wide checks

  await it("the log is numbers and nothing else — no record text on the page", async () => {
    const w = await boot({ act: 1 });
    const txt = $(w, "#catalogue").textContent;
    assert.ok(!txt.includes("insufficient sample"),
      "entry bodies must not be in the log itself");
    assert.ok(nums(w).length, "some numbers should be live");
  });

  await it("the whole ladder is on the wall, most of it dark", async () => {
    const w = await boot({ act: 1 });
    const L = w.VOID_CONFIG.CATALOGUE_LADDER;
    const rungs = Math.floor((L.to - L.from) / L.step) + 1;
    assert.strictEqual(nums(w).length + absent(w), rungs,
      "records plus absences must account for every rung");
    assert.ok(absent(w) > nums(w).length * 10, "found, not given");
  });

  await it("the act dial gates the archive: act 1 lights only act-1 records", async () => {
    const w = await boot({ act: 1 });
    /* Array.from: config arrays live in the jsdom realm, and deepStrictEqual
       compares prototypes. Same values, different Array constructor. */
    const expected = Array.from(w.VOID_CONFIG.CATALOGUE)
      .filter(e => !e.secret && (e.act == null ? 1 : e.act) <= 1).map(e => e.n);
    assert.deepStrictEqual(nums(w), expected.sort((a, b) => a - b));
  });

  await it("advancing the dial is the only edit needed to release act 2", async () => {
    const a1 = nums(await boot({ act: 1 })).length;
    const a2 = nums(await boot({ act: 2 })).length;
    assert.ok(a2 > a1, `act 2 (${a2}) should light more than act 1 (${a1})`);
  });

  await it("clicking a number expands it into a modal carrying the record", async () => {
    const w = await boot({ act: 1 });
    assert.ok(!card(w), "nothing is open to begin with");
    const c = await openN(w, 6);
    assert.ok(c, "a card appears");
    assert.strictEqual(c.getAttribute("role"), "dialog");
    assert.strictEqual(c.getAttribute("aria-modal"), "true");
    assert.match($(w, "#cat-card-n").textContent, /entry 006/);
    assert.match(c.textContent, /insufficient sample/);
  });

  await it("escape closes it and focus goes back to the number", async () => {
    const w = await boot({ act: 1 });
    await openN(w, 6);
    $(w, ".cat-modal").dispatchEvent(
      new w.KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    await tick();
    assert.ok(!card(w), "the card is gone");
    assert.strictEqual(w.document.activeElement, chip(w, 6),
      "focus returns to the number that opened it");
  });

  await it("the scrim closes it too", async () => {
    const w = await boot({ act: 1 });
    await openN(w, 6);
    click(w, $(w, ".cat-scrim"));
    await tick();
    assert.ok(!card(w));
  });

  await it("tab does not leak out of the card", async () => {
    const w = await boot({ act: 1 });
    const c = await openN(w, 6);
    const f = [...c.querySelectorAll("button")];
    assert.ok(f.length, "there is something focusable");
    f[f.length - 1].focus();
    $(w, ".cat-modal").dispatchEvent(
      new w.KeyboardEvent("keydown", { key: "Tab", bubbles: true, cancelable: true }));
    assert.strictEqual(w.document.activeElement, f[0], "tab wraps to the first control");
  });

  await it("a gated record shows its number as held and withholds the body", async () => {
    /* entry 018 sits behind the-rules. Act 3 lights it; the door being shut
       is what keeps it unreadable. */
    const w = await boot({ act: 3 });
    assert.ok(chip(w, 18).classList.contains("held"), "018 reads as held");
    const c = await openN(w, 18);
    assert.match(c.textContent, /not transcribed/);
    assert.ok(!c.textContent.includes("ornamental"), "its body must not leak");
  });

  await it("opening the door in front of a record indexes it", async () => {
    const w = await boot({ act: 3, localStore: { "void-vault":
      JSON.stringify({ "the-rules": { a: "WITNESS", t: false } }) } });
    assert.ok(!chip(w, 18).classList.contains("held"));
    const c = await openN(w, 18);
    assert.match(c.textContent, /ornamental/);
  });

  await it("the dead-letter trap: 996 is unlisted but an exact query finds it", async () => {
    /* J Q V are gone as letters and survive as six, ninety, nine hundred, so
       V Q J is 996 and 996 is a query. Act 3, because until the dead letters
       surface there is no message carrying dead glyphs to misread. */
    const w = await boot({ act: 3 });
    assert.ok(!nums(w).includes(996), "996 must never appear on the wall");
    type(w, ".cat-search input", "996");
    assert.deepStrictEqual(nums(w), [996]);
    const c = await openN(w, 996);
    assert.ok(c, "and it opens like any other record");
  });

  await it("996 stays out of reach until the dead letters have surfaced", async () => {
    const w = await boot({ act: 1 });
    type(w, ".cat-search input", "996");
    assert.deepStrictEqual(nums(w), []);
    /* 996 sits past the end of her ladder, so before act 3 the index denies
       it exists at all rather than admitting to a hole. She stopped at 894
       and never wrote 900; there is no reason for her file to know about
       anything above it. */
    assert.match($(w, ".cat-foot").textContent, /996 is not on the index/);
  });

  await it("a number on the ladder with nothing behind it says so", async () => {
    const w = await boot({ act: 1 });
    type(w, ".cat-search input", "066");
    assert.match($(w, ".cat-foot").textContent, /no record at 066/);
  });

  await it("a number that is not a multiple of six is not on her index at all", async () => {
    const w = await boot({ act: 1 });
    type(w, ".cat-search input", "17");
    assert.match($(w, ".cat-foot").textContent, /not on the index/);
  });

  await it("text search reaches only records that are already legible", async () => {
    const w = await boot({ act: 1 });
    type(w, ".cat-search input", "insufficient sample");
    assert.deepStrictEqual(nums(w), [6]);
  });

  await it("corrections cross-link only when both ends are legible", async () => {
    const one = await boot({ act: 1 });
    assert.ok(!(await openN(one, 12)).querySelector(".cat-jump"),
      "012 must not advertise 060 before 060 exists");
    const two = await boot({ act: 2 });
    assert.match((await openN(two, 12)).querySelector(".cat-jump").textContent, /060/);
  });

  await it("a cross-link jumps to the record it names", async () => {
    const w = await boot({ act: 2 });
    const c = await openN(w, 12);
    click(w, c.querySelector(".cat-jump"));
    await tick();
    assert.match($(w, "#cat-card-n").textContent, /entry 060/);
  });

  await it("Lord-X stays out of the room unless MARGINS is on", async () => {
    const off = await boot({ act: 4, margins: false });
    await openN(off, 894);
    assert.ok(!$(off, ".cat-modal").classList.contains("margins-on"));
    const on = await boot({ act: 4, margins: true });
    const c = await openN(on, 894);
    assert.ok($(on, ".cat-modal").classList.contains("margins-on"));
    assert.ok(c.querySelector(".cat-margin"), "his line rides on 894");
  });

  await it("NO DRAFT SHIPS BY ACCIDENT — nothing marked draft is released", async () => {
    /* Every Act II entry currently in config.js is a proposal in her voice,
       not Josh's words. Bumping CFG.ACT will break this test until each one
       has been read and either rewritten or had `draft: true` removed.
       That is the whole point of the flag. Do not "fix" this by loosening
       the assertion. */
    const w = await boot();                                  // shipping ACT
    const act = w.VOID_CONFIG.ACT;
    const leaked = Array.from(w.VOID_CONFIG.CATALOGUE)
      .filter(e => e.draft && (e.act == null ? 1 : e.act) <= act)
      .map(e => String(e.n).padStart(3, "0"));
    assert.deepStrictEqual(leaked, [],
      `unreviewed drafts released at act ${act}: ${leaked.join(", ")}`);
  });

  await it("her voice rules hold across every entry in the file", async () => {
    /* §7.2 — first person, never "she", never the word Archivist, never
       addresses a reader. Cheap to check, easy to break while drafting. */
    for (const e of Array.from(w0.VOID_CONFIG.CATALOGUE)) {
      const t = ((e.text || "") + " " + (e.addendum || ""));
      const plain = t.replace(/<[^>]+>/g, "");
      assert.ok(!/\bArchivist\b/i.test(plain), `entry ${e.n} names the Archivist`);
      assert.ok(!/\byou\b/i.test(plain), `entry ${e.n} addresses a reader`);
      assert.ok(!/\bshe\b|\bher\b/i.test(plain), `entry ${e.n} writes in third person`);
    }
  });

  console.log("\nthe glitch\n");

  await it("the card resolves rather than fades: the glitch class goes on and comes off", async () => {
    const w = await boot({ act: 1 });
    await openN(w, 24);
    assert.ok($(w, ".cat-modal").classList.contains("glitching"),
      "it should be resolving on arrival");
    assert.ok($(w, ".cat-tear"), "the sweep band is in the card");
    await tick(700);
    assert.ok(!$(w, ".cat-modal").classList.contains("glitching"),
      "and it must settle — a card left mid-glitch is unreadable");
  });

  await it("THE NUMBER IS NEVER WRONG ON SCREEN, at any point", async () => {
    /* The scramble writes to the DOM on a timer, so the failure mode is a
       card showing entry 584 when the record is 024. Two rails: the element
       holds the right value before the scramble starts, and a hard timeout
       forces it back regardless of whether frames ever ran. Check both ends. */
    const w = await boot({ act: 1 });
    await openN(w, 24);
    assert.strictEqual($(w, "#cat-card-n").textContent, "entry 024",
      "correct from the first frame");
    await tick(700);
    assert.strictEqual($(w, "#cat-card-n").textContent, "entry 024",
      "and correct once it has settled");
  });

  await it("the accessible name never tumbles, even while the number does", async () => {
    const w = await boot({ act: 1 });
    const c = await openN(w, 24);
    assert.strictEqual(c.getAttribute("aria-label"), "entry 024");
    assert.ok(!c.hasAttribute("aria-labelledby"),
      "labelling by the scrambling element would read the flicker aloud");
  });

  await it("closing glitches out and still removes the card", async () => {
    const w = await boot({ act: 1 });
    await openN(w, 24);
    $(w, ".cat-modal").dispatchEvent(
      new w.KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    await tick(60);
    assert.ok($(w, ".cat-modal").classList.contains("closing"));
    await tick(400);
    assert.ok(!card(w), "the card is gone");
  });

  await it("MOTION.glitch false turns all of it off", async () => {
    const w = await boot({ act: 1, motion: { glitch: false } });
    await openN(w, 24);
    assert.ok(!$(w, ".cat-modal").classList.contains("glitching"));
    assert.strictEqual($(w, "#cat-card-n").textContent, "entry 024");
  });

  await it("reduced motion turns it off without touching the config", async () => {
    const w = await boot({ act: 1, reduced: true });
    await openN(w, 24);
    assert.ok(!$(w, ".cat-modal").classList.contains("glitching"),
      "nobody gets a strobing card because a config flag was left on");
    assert.strictEqual($(w, "#cat-card-n").textContent, "entry 024");
  });

  await it("a card removed mid-scramble does not keep writing to a dead node", async () => {
    const w = await boot({ act: 1 });
    await openN(w, 24);
    const n = $(w, "#cat-card-n");
    click(w, $(w, ".cat-scrim"));
    await tick(700);
    assert.ok(!n.isConnected, "the node is detached");
    assert.ok(!card(w), "and nothing re-created it");
  });

  console.log("\nthe order\n");

  await it("eleven seats, and only the recovered ones are occupied", async () => {
    const w = await boot({ act: 1 });
    assert.strictEqual($$(w, ".ord-slot").length, 11);
    const live = w.VOID_CONFIG.CAPTURE.filter(c => (c.act == null ? 1 : c.act) <= 1).length;
    assert.strictEqual($$(w, ".ord-slot:not(.empty)").length, live);
  });

  await it("the answer is not in the page: no slot advertises a position", async () => {
    const w = await boot({ act: 2 });
    const src = fs.readFileSync(path.join(R, "config.js"), "utf8");
    assert.ok(!/IAMNOTALONE/i.test(src), "the composite key must not be in config.js");
    assert.ok(!/position|order\s*:/i.test(JSON.stringify(w.VOID_CONFIG.CAPTURE)),
      "no capture carries its position");
  });

  await it("two clicks trade two seats, and the readout follows", async () => {
    const w = await boot({ act: 2 });
    const before = $(w, ".ord-readout").textContent;
    const slots = $$(w, ".ord-slot[data-i]");
    click(w, slots[0]); click(w, $$(w, ".ord-slot[data-i]")[3]);
    const after = $(w, ".ord-readout").textContent;
    assert.notStrictEqual(before, after, "swapping must change what it reads");
  });

  await it("nothing on the bench says whether the arrangement is right", async () => {
    const w = await boot({ act: 2 });
    const txt = $(w, "#order").textContent.toLowerCase();
    for (const tell of ["correct", "solved", "resolved", "well done"])
      assert.ok(!txt.includes(tell), `the bench must not say "${tell}"`);
  });

  console.log("\nthe filing\n");

  await it("two boxes, and no third one appears no matter what you file", async () => {
    const w = await boot({ act: 2 });
    assert.strictEqual($$(w, ".cls-box").length, 2);
    for (const c of $$(w, ".cls-chip")) { click(w, c); click(w, c); }
    assert.strictEqual($$(w, ".cls-box").length, 2, "the schema must not grow a column");
  });

  await it("a record's fields stay hidden until it is filed", async () => {
    const w = await boot({ act: 2 });
    assert.strictEqual($$(w, ".cls-pool .cls-fields").length, 0,
      "handing the fields over would give away the gap before anyone touches it");
    click(w, $(w, '.cls-pool .cls-chip[data-id="shadow"]'));
    assert.ok($(w, '.cls-box[data-box="one"] .cls-chip[data-id="shadow"] .cls-fields'));
  });

  await it("a record that fits its box is not flagged", async () => {
    const w = await boot({ act: 2 });
    click(w, $(w, '.cls-chip[data-id="shadow"]'));          // → set one, interrupted
    assert.ok(!$(w, '.cls-chip[data-id="shadow"]').classList.contains("malformed"));
  });

  await it("the four exceptions are malformed in BOTH boxes — that is the gap", async () => {
    const w = await boot({ act: 2 });
    const exceptions = w.VOID_CONFIG.CLASSIFY
      .filter(r => r.exception && (r.act == null ? 1 : r.act) <= 2).map(r => r.id);
    assert.strictEqual(exceptions.length, 4);
    for (const id of exceptions) {
      click(w, $(w, `.cls-chip[data-id="${id}"]`));         // set one
      assert.ok($(w, `.cls-chip[data-id="${id}"]`).classList.contains("malformed"),
        `${id} should not fit set one`);
      click(w, $(w, `.cls-chip[data-id="${id}"]`));         // set two
      assert.ok($(w, `.cls-chip[data-id="${id}"]`).classList.contains("malformed"),
        `${id} should not fit set two either`);
    }
    assert.ok($(w, "#classify").classList.contains("flagged"));
    assert.match($(w, ".cls-note").textContent, /third case/,
      "entry 156 lands once all four are filed");
  });

  await it("filing survives a reload", async () => {
    const w = await boot({ act: 2 });
    click(w, $(w, '.cls-chip[data-id="shadow"]'));
    const saved = w.localStorage.getItem("void-classify");
    const back = await boot({ act: 2, localStore: { "void-classify": saved } });
    assert.ok($(back, '.cls-box[data-box="one"] .cls-chip[data-id="shadow"]'));
  });

  console.log(`\n${pass} passed, ${fail} failed\n`);
  process.exit(fail ? 1 : 0);
})();
