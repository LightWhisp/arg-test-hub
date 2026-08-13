const { JSDOM } = require("jsdom");
const fs = require("fs"), path = require("path"), assert = require("assert");
const R = path.join(__dirname, "..");

async function boot(store = {}) {
  const dom = new JSDOM(fs.readFileSync(path.join(R, "index.html"), "utf8"),
    { runScripts: "outside-only", pretendToBeVisual: true });
  const w = dom.window;
  const def = (k, v) => Object.defineProperty(w, k, { value: v, configurable: true });
  def("crypto", require("crypto").webcrypto);
  const ls = { ...store };
  def("localStorage", { getItem: k => ls[k] ?? null, setItem: (k, v) => ls[k] = v });
  w.matchMedia = () => ({ matches: false, addListener(){}, removeListener(){} });
  w.fetch = async () => ({ ok: true, json: async () => ({ transcribed: {} }) });
  w.requestAnimationFrame = () => 0; w.devicePixelRatio = 1; w.Path2D = function(){};
  w.HTMLCanvasElement.prototype.getContext = () => new Proxy({}, { get: (t,p) =>
    p === "createImageData" ? (a,b)=>({data:new Uint8ClampedArray(a*b*4)})
    : p === "createPattern" ? ()=>({}) : ()=>{} });
  for (const f of ["config.js","bench-data.js","script.js"])
    w.eval(fs.readFileSync(path.join(R, f), "utf8"));
  await (w.__voidReady || new Promise(r => setTimeout(r, 120)));
  await new Promise(r => setTimeout(r, 0));
  return w;
}
const click = (w, cell) => w.document.querySelector(`.cell[data-cell="${cell}"]`)
  .dispatchEvent(new w.Event("click", { bubbles: true }));
const read = w => w.document.querySelector(".readout").textContent.trim();

let pass = 0, fail = 0;
const it = async (n, f) => { try { await f(); console.log("  PASS  " + n); pass++; }
  catch (e) { console.log("  FAIL  " + n + "\n        " + e.message); fail++; } };

(async () => {
  console.log("\nthe bench\n");

  await it("opens with his mistake baked in — the passage reads wrong", async () => {
    const w = await boot();
    const t = read(w);
    assert.ok(t.startsWith("M AC N"), "expected the near-miss, got: " + t.slice(0, 40));
    assert.strictEqual(w.document.querySelector(".bench-state").textContent, "provisional");
  });

  await it("renders one cell per living letter, none marked as wrong", async () => {
    const w = await boot();
    assert.strictEqual(w.document.querySelectorAll(".cell").length, 23);
    assert.strictEqual(w.document.querySelectorAll(".cell.wrong").length, 0);
  });

  await it("TH shows as unknown — it is not in his key", async () => {
    const w = await boot();
    assert.ok(read(w).includes("?"), "TH should read as an unlisted mark");
  });

  await it("one swap changes the transcription live", async () => {
    const w = await boot();
    const before = read(w);
    click(w, "I"); click(w, "M");
    assert.notStrictEqual(read(w), before);
  });

  await it("clicking the same cell twice deselects", async () => {
    const w = await boot();
    const before = read(w);
    click(w, "I"); click(w, "I"); click(w, "O");
    assert.strictEqual(read(w), before, "no swap should have happened");
  });

  await it("undoing the cycle resolves the passage to plain English", async () => {
    const w = await boot();
    // a 4-cycle undoes in exactly three transpositions, all pivoting on I
    click(w, "I"); click(w, "O");
    click(w, "I"); click(w, "C");
    click(w, "I"); click(w, "M");
    const t = read(w);
    assert.ok(t.startsWith("I AM NOBODY."), "got: " + t.slice(0, 40));
    assert.strictEqual(w.document.querySelector(".bench-state").textContent, "resolved");
    assert.ok(w.document.getElementById("bench").classList.contains("resolved"));
  });

  await it("resolving reveals her entry, and only then", async () => {
    const w0 = await boot();
    assert.strictEqual(w0.document.querySelector(".bench-note").innerHTML.trim(), "");
    const w = await boot();
    click(w,"I");click(w,"O");click(w,"I");click(w,"C");click(w,"I");click(w,"M");
    assert.ok(w.document.querySelector(".bench-note").textContent.includes("entry 024"));
  });

  await it("progress survives a reload", async () => {
    const w = await boot();
    click(w, "I"); click(w, "M");
    const saved = w.localStorage.getItem("void-bench");
    const w2 = await boot({ "void-bench": saved });
    assert.strictEqual(read(w2), read(w));
  });

  await it("a solved bench ignores further clicks", async () => {
    const w = await boot();
    click(w,"I");click(w,"O");click(w,"I");click(w,"C");click(w,"I");click(w,"M");
    const t = read(w);
    click(w, "A"); click(w, "B");
    assert.strictEqual(read(w), t);
  });

  await it("no deep or hollow forms leak into the shipped data", async () => {
    const src = fs.readFileSync(path.join(R, "bench-data.js"), "utf8");
    for (const bad of ["a_alt","e_alt","o_alt","i_alt","n_alt","s_alt","t_alt","null_one","null_two"])
      assert.ok(!src.includes(bad), "hollow form leaked: " + bad);
    assert.ok(!src.includes('"J"') && !src.includes('"Q"') && !src.includes('"V"'),
      "a dead letter leaked into the published key");
  });

  console.log(`\n${pass} passed, ${fail} failed\n`);
  process.exit(fail ? 1 : 0);
})();
