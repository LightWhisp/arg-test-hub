/* ============================================================
   the void — script.js  (engine — you should not need to edit this)
   All content lives in config.js.
   ============================================================ */
(() => {
  const CFG = window.VOID_CONFIG;
  const REDUCED = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------------- ambient field: omnipresent fog + rune apparitions ----- */
  (function field() {
    const F = Object.assign(
      { RUNE_COUNT: 9, RUNE_GLOW_CHANCE: 0.35, FOG_INTENSITY: 1.0, FOG_SPEED: 1.0, FOG_VIDEO: null },
      CFG.FIELD || {});
    const cv = document.getElementById("field");
    const ctx = cv.getContext("2d");
    let W, H;

    /* optional pre-rendered fog video (e.g. an AE loop) beneath the canvas */
    if (F.FOG_VIDEO) {
      const v = document.createElement("video");
      Object.assign(v, { src: F.FOG_VIDEO, muted: true, loop: true, autoplay: true, playsInline: true });
      Object.assign(v.style, { position: "fixed", inset: "0", width: "100vw", height: "100vh",
        objectFit: "cover", zIndex: "0", pointerEvents: "none" });
      document.body.prepend(v);
      v.play().catch(() => {});
    }

    /* seamless soft noise tile — engine-independent.
       Earlier versions let the browser upscale a tiny grid, which Safari/WebKit
       renders as hard blocks when it falls back to nearest-neighbour. This
       version samples the value-noise itself with smoothstep interpolation and
       wraparound, writing every pixel directly, so the result is identical in
       every engine and tiles seamlessly by construction. Runs once at load. */
    function noiseTile(size, cells) {
      const g = new Float32Array(cells * cells);
      for (let i = 0; i < g.length; i++) g[i] = Math.pow(Math.random(), 1.5);
      const at = (x, y) => g[(((y % cells) + cells) % cells) * cells + (((x % cells) + cells) % cells)];
      const fade = u => u * u * (3 - 2 * u);              // smoothstep

      const cv2 = document.createElement("canvas");
      cv2.width = cv2.height = size;
      const c2 = cv2.getContext("2d");
      const img = c2.createImageData(size, size);
      const scale = cells / size;

      for (let py = 0; py < size; py++) {
        const gy = py * scale, y0 = Math.floor(gy), fy = fade(gy - y0);
        for (let px = 0; px < size; px++) {
          const gx = px * scale, x0 = Math.floor(gx), fx = fade(gx - x0);
          const v00 = at(x0, y0),     v10 = at(x0 + 1, y0);
          const v01 = at(x0, y0 + 1), v11 = at(x0 + 1, y0 + 1);
          const top = v00 + (v10 - v00) * fx;
          const bot = v01 + (v11 - v01) * fx;
          const v = (top + (bot - top) * fy) * 240;
          const i = (py * size + px) * 4;
          img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
          img.data[i + 3] = 255;
        }
      }
      c2.putImageData(img, 0, 0);
      return cv2;
    }

    const TILE = 768;
    const patA = ctx.createPattern(noiseTile(TILE, 7), "repeat");   // broad billows
    const patB = ctx.createPattern(noiseTile(TILE, 15), "repeat");  // finer churn

    function fogLayer(pat, ox, oy, alpha, t, ph) {
      ctx.save();
      ctx.globalAlpha = alpha * (0.78 + 0.22 * Math.sin(t * 0.00021 + ph));
      ctx.translate(((ox % TILE) + TILE) % TILE - TILE, ((oy % TILE) + TILE) % TILE - TILE);
      ctx.fillStyle = pat;
      ctx.fillRect(0, 0, W + TILE * 2, H + TILE * 2);
      ctx.restore();
    }

    /* runes pre-rendered to sprites: crisp thick strokes + baked glow halo.
       (live Path2D hairlines proved sub-pixel faint on high-DPI screens) */
    const SPR = 112, GS = 2.6;                             // sprite box, glyph scale inside it
    const sprites = CFG.GLYPH_PATHS.map(d => {
      const p = new Path2D(d);
      function paint(glow) {
        const c = document.createElement("canvas");
        c.width = c.height = SPR;
        const g = c.getContext("2d");
        g.translate((SPR - 24 * GS) / 2, (SPR - 32 * GS) / 2);
        g.scale(GS, GS);
        g.lineCap = "round"; g.lineJoin = "round";
        g.lineWidth = glow ? 1.15 : 0.95;
        g.strokeStyle = glow ? "#FFFFFF" : "#E9E4D6";
        if (glow) { g.shadowColor = "rgba(255,255,255,0.95)"; g.shadowBlur = 9; g.stroke(p); }
        g.stroke(p);
        return c;
      }
      return { base: paint(false), glow: paint(true) };
    });

    const runes = [];
    function makeRune(now, stagger) {
      const life = 1200 + Math.random() * 1100;           // ~1.2-2.3s apparitions
      const gap  = 150 + Math.random() * 1100;            // silence before rebirth
      const speed = (28 + Math.random() * 48) / 60 * devicePixelRatio;
      const dir = Math.random() * Math.PI * 2;
      return {
        spr: sprites[(Math.random() * sprites.length) | 0],
        x: Math.random() * W, y: Math.random() * H,
        s: (0.9 + Math.random() * 1.4) * devicePixelRatio,
        vx: Math.cos(dir) * speed, vy: Math.sin(dir) * speed,
        r: Math.random() * Math.PI * 2, vr: (Math.random() - 0.5) * 0.002,
        a: 0.18 + Math.random() * 0.16,
        born: stagger ? now - Math.random() * (life + gap) : now + gap,
        life,
        glows: Math.random() < F.RUNE_GLOW_CHANCE,
      };
    }

    function size() {
      W = cv.width = innerWidth * devicePixelRatio;
      H = cv.height = innerHeight * devicePixelRatio;
      cv.style.width = innerWidth + "px";
      cv.style.height = innerHeight + "px";
    }
    function spawn() {
      runes.length = 0;
      for (let i = 0; i < F.RUNE_COUNT; i++) runes.push(makeRune(0, true));
    }

    function frame(t) {
      ctx.clearRect(0, 0, W, H);

      /* the veil: two counter-drifting noise layers, always present, breathing */
      if (!F.FOG_VIDEO) {
        const sp = F.FOG_SPEED * devicePixelRatio;
        ctx.globalCompositeOperation = "lighter";
        fogLayer(patA,  t * 0.030 * sp,  t * 0.011 * sp, 0.052 * F.FOG_INTENSITY, t, 0);
        fogLayer(patB, -t * 0.018 * sp, -t * 0.015 * sp, 0.038 * F.FOG_INTENSITY, t, 2.1);
      }

      /* rune apparitions: one smooth breath each — in, glide, (glow), out */
      ctx.globalCompositeOperation = "source-over";
      for (let i = 0; i < runes.length; i++) {
        const d = runes[i];
        const t0 = t - d.born;
        if (t0 > d.life) { runes[i] = makeRune(t); continue; }
        if (t0 < 0) continue;
        const env = Math.sin(Math.PI * t0 / d.life);
        d.x = (d.x + d.vx + W) % W; d.y = (d.y + d.vy + H) % H; d.r += d.vr;

        const w = SPR * d.s / GS;
        ctx.save();
        ctx.translate(d.x, d.y); ctx.rotate(d.r);
        ctx.globalAlpha = d.a * env;
        ctx.drawImage(d.spr.base, -w / 2, -w / 2, w, w);
        if (d.glows) {
          const g = Math.pow(env, 3);                      // flare rides the peak
          if (g > 0.02) {
            ctx.globalAlpha = Math.min(0.95, 0.1 + 0.75 * g);
            ctx.globalCompositeOperation = "lighter";
            ctx.drawImage(d.spr.glow, -w / 2, -w / 2, w, w);
            ctx.globalCompositeOperation = "source-over";
          }
        }
        ctx.restore();
      }
    }

    size(); spawn();
    addEventListener("resize", () => { size(); spawn(); if (REDUCED) frame(2500); });
    if (REDUCED) { frame(2500); return; }                  // one still mid-breath frame
    (function tick(t) { frame(t || 0); requestAnimationFrame(tick); })();
  })();

  /* ---------------- audio fragments ---------------- */
  (function frags() {
    const host = document.getElementById("fragments");
    for (const f of CFG.FRAGMENTS) {
      const row = document.createElement("div");
      row.className = "frag";
      row.innerHTML = `<span class="dot"></span><span>${f.title}</span>`;
      const a = new Audio();
      a.controls = true; a.preload = "metadata"; a.src = f.file;
      a.onerror = () => {
        const m = document.createElement("span");
        m.className = "missing"; m.textContent = "not yet recovered";
        row.appendChild(m);
      };
      a.onloadedmetadata = () => { row.classList.add("live"); row.appendChild(a); };
      host.appendChild(row);
    }
  })();

  /* ---------------- the sealed vault ---------------- */
  const b64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
  const norm = s => s.toUpperCase().replace(/[^A-Z]/g, "");

  async function tryOpen(entry, answer) {
    const enc = new TextEncoder();
    const km = await crypto.subtle.importKey("raw", enc.encode(norm(answer)), "PBKDF2", false, ["deriveKey"]);
    const key = await crypto.subtle.deriveKey(
      { name: "PBKDF2", salt: b64(entry.salt), iterations: 100000, hash: "SHA-256" },
      km, { name: "AES-GCM", length: 256 }, false, ["decrypt"]);
    const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv: b64(entry.iv) }, key, b64(entry.ct));
    return new TextDecoder().decode(pt);
  }

  const store = {
    key: "void-vault",
    read() { try { return JSON.parse(localStorage.getItem(this.key)) || {}; } catch { return {}; } },
    save(o) { try { localStorage.setItem(this.key, JSON.stringify(o)); } catch {} },
  };

  (function vault() {
    const host = document.getElementById("vault");
    const known = store.read();
    for (const entry of CFG.VAULT) {
      const t = CFG.DOOR_TEXT[entry.id] || { label: entry.id, prompt: "" };
      const door = document.createElement("div");
      door.className = "door";
      door.innerHTML = `
        <div class="head"><span class="mono">${t.label}</span>
          <span class="status">${t.status || "sealed"}</span></div>
        <p class="prompt">${t.prompt}</p>
        <div class="speak"><input type="text" autocomplete="off" spellcheck="false"
             placeholder="speak" aria-label="answer for ${t.label}"></div>
        <div class="whisper" aria-live="polite"></div>
        <div class="payload"></div>`;
      host.appendChild(door);
      const input = door.querySelector("input");
      const whisper = door.querySelector(".whisper");
      const payload = door.querySelector(".payload");

      async function attempt(ans, silent) {
        try {
          const html = await tryOpen(entry, ans);
          payload.innerHTML = html;
          door.classList.add("open");
          door.querySelector(".status").textContent = "open";
          input.closest(".speak").style.display = "none";
          whisper.textContent = "";
          const k = store.read(); k[entry.id] = ans; store.save(k);
        } catch {
          if (silent) return;
          door.classList.add("shake");
          setTimeout(() => door.classList.remove("shake"), 450);
          whisper.textContent = "the void does not answer.";
          whisper.classList.add("show");
          setTimeout(() => whisper.classList.remove("show"), 2600);
        }
      }

      input.addEventListener("keydown", e => {
        if (e.key === "Enter" && input.value.trim()) attempt(input.value);
      });
      if (known[entry.id]) attempt(known[entry.id], true);
    }
  })();

  /* ---------------- he notices ---------------- */
  (function iam() {
    let buf = "";
    addEventListener("keydown", e => {
      if (e.target.tagName === "INPUT") return;
      buf = (buf + e.key.toLowerCase()).slice(-3);
      if (buf === "iam") {
        const el = document.getElementById("iam");
        el.classList.add("on");
        setTimeout(() => el.classList.remove("on"), 2400);
        buf = "";
      }
    });
  })();
})();
