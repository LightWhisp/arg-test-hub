/* Visual smoke check. Not part of the suite — a human looks at the output.
   node test/shot.js            (needs: python3 -m http.server 8899 in repo) */
const { chromium } = require("playwright");

(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const p = await b.newPage({ viewport: { width: 1100, height: 900 } });
  const errs = [];
  p.on("pageerror", e => errs.push("PAGEERROR " + e.message));
  p.on("console", m => { if (m.type() === "error") errs.push("CONSOLE " + m.text()); });

  await p.goto("http://localhost:8899/index.html", { waitUntil: "networkidle" });
  await p.waitForTimeout(1200);

  for (const [name, sel] of [
    ["order", "#ordering"], ["filing", "#filing"],
    ["index", "#index"], ["sealed", "#sealed"], ["bench", "#workbench"],
  ]) {
    await p.locator(sel).scrollIntoViewIfNeeded();
    await p.waitForTimeout(350);
    await p.locator(sel).screenshot({ path: `/home/claude/work/shots/${name}.png` });
  }

  /* the modal, caught mid-resolve. The glitch runs 560ms, so sample it
     early and settled — a still of the settled card tells you nothing
     about whether the animation actually fires. */
  await p.locator("#index").scrollIntoViewIfNeeded();
  await p.waitForTimeout(300);
  await p.locator('button.cat-num[data-n="24"]').click();
  for (const [name, at] of [["glitch-1", 70], ["glitch-2", 150],
                            ["glitch-3", 260], ["modal", 900]]) {
    await p.waitForTimeout(name === "glitch-1" ? at : 0);
    await p.screenshot({ path: `/home/claude/work/shots/${name}.png` });
    if (name !== "modal") await p.waitForTimeout(90);
  }
  const settled = await p.locator("#cat-card-n").textContent();
  const glitching = await p.locator(".cat-modal.glitching").count();
  console.log("number settled to:", JSON.stringify(settled),
              "| still glitching:", glitching);
  await p.keyboard.press("Escape");
  await p.waitForTimeout(500);
  console.log("card removed after close:", (await p.locator(".cat-card").count()) === 0);

  /* --rust must actually resolve now */
  const rust = await p.evaluate(() =>
    getComputedStyle(document.documentElement).getPropertyValue("--rust").trim());
  const catN = await p.evaluate(() =>
    getComputedStyle(document.querySelector("button.cat-num")).color);

  console.log("--rust =", JSON.stringify(rust));
  console.log("live number colour =", catN);
  console.log("live numbers:", await p.locator("button.cat-num").count(),
              "absent:", await p.locator(".cat-num.absent").count(),
              "seats:", await p.locator(".ord-slot").count(),
              "boxes:", await p.locator(".cls-box").count());
  console.log(errs.length ? errs.join("\n") : "no page errors");
  await b.close();
})();
