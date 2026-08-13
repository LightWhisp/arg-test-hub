/* ============================================================
   the void — script.js  (engine — you should not need to edit this)
   All content lives in config.js.
   ============================================================ */
(() => {
  const CFG = window.VOID_CONFIG;
  const REDUCED = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ================= shared registries =================================
     Three things more than one module needs to know about. Kept in this
     closure rather than on window: no globals, no event bus, no ordering
     problem between the modules below.
     ==================================================================== */

  /* WHICH DOORS ARE OPEN. The index gates her records on this — a record is
     indexed when the door in front of it has been opened, so an answer that
     came from another channel is what files her paperwork. */
  const OPENED = new Set();
  const openWatchers = [];
  function markOpen(id) { OPENED.add(id); for (const f of openWatchers) f(id); }
  function onOpen(f) { openWatchers.push(f); OPENED.forEach(f); }

  /* TRACK KEYS. A door payload may carry the key to a sealed recording:
     any element with data-unlocks / data-key in an opened payload hands the
     key over here, and the playback bench picks the track up. This is the
     join between the puzzles and the recordings — an unreleased track can
     then sit in assets/audio in public, fully downloadable, and be useless.
     Solvers can see the file exists and cannot hear it. That is a taunt. */
  const KEYS = (() => {
    const K = "void-keys";
    try { return JSON.parse(localStorage.getItem(K)) || {}; } catch { return {}; }
  })();
  const keyWatchers = [];
  function grantKey(recId, key) {
    if (KEYS[recId] === key) return;
    KEYS[recId] = key;
    try { localStorage.setItem("void-keys", JSON.stringify(KEYS)); } catch {}
    for (const f of keyWatchers) f(recId, key);
  }
  function onKey(f) { keyWatchers.push(f); }
  /* scan a decrypted payload for keys it is carrying */
  function harvestKeys(root) {
    for (const el of root.querySelectorAll("[data-unlocks][data-key]"))
      grantKey(el.dataset.unlocks, el.dataset.key);
  }

  /* WORK IN FLIGHT. Key derivation is deliberately slow and every attempt is
     async, so a harness cannot otherwise know when a typed answer has
     finished being wrong. Counts attempts and lets one await quiet. Exposes
     nothing an attacker lacks — the ciphertexts are public and the work is
     happening in their browser either way. */
  let inFlight = 0;
  const idleWaiters = [];
  const workStart = () => { inFlight++; };
  const workEnd = () => {
    if (--inFlight > 0) return;
    inFlight = 0;
    for (const f of idleWaiters.splice(0)) f();
  };
  window.__voidIdle = () =>
    inFlight === 0 ? Promise.resolve() : new Promise(r => idleWaiters.push(r));

  /* CRYPTO. One derivation path for everything sealed on this site —
     doors, the last door, and encrypted audio — so there is one place to
     raise the iteration count and one place to get the padding wrong. */
  const b64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
  const norm = s => s.toUpperCase().replace(/[^A-Z]/g, "");

  /* Payloads are padded to a fixed block by vault_tool.py so ciphertext
     LENGTH stops leaking how much sits behind a door. "the record is blank"
     and a full lore page must weigh the same on the wire — otherwise anyone
     reading config.js can see the emptied door coming, which is the exact
     thing carrying emptied in the ciphertext was meant to prevent.
     Padding is trailing U+0000; strip it on the way out. Audio is not
     padded: the length of an mp3 gives away nothing about its key. */
  const unpad = s => s.replace(/[\u0000]+$/, "");

  /* 100k is what the two original entries were sealed at and they must keep
     opening. Everything authored from here ships with an explicit iters. */
  const DEFAULT_ITERS = 100000;

  async function decryptBytes(entry, secret, payload) {
    const km = await crypto.subtle.importKey(
      "raw", new TextEncoder().encode(secret), "PBKDF2", false, ["deriveKey"]);
    const key = await crypto.subtle.deriveKey(
      { name: "PBKDF2", salt: b64(entry.salt),
        iterations: entry.iters || DEFAULT_ITERS, hash: "SHA-256" },
      km, { name: "AES-GCM", length: 256 }, false, ["decrypt"]);
    return crypto.subtle.decrypt({ name: "AES-GCM", iv: b64(entry.iv) }, key, payload);
  }

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

  /* ================= the playback bench ================================
     Web Audio rather than <audio>, for three reasons:
       - reverse and speed without a second library
       - per-track loudness normalisation on decode
       - encrypted audio drops straight in later: decrypt to an ArrayBuffer
         and hand it to the same decodeAudioData path. No rework.

     Adding a recording is one object in CFG.RECORDINGS. No code changes.
     ==================================================================== */
  (function bench_audio() {
    const host = document.getElementById("fragments");
    if (!host || !CFG.RECORDINGS) return;

    const VOLKEY = "void-volume";
    const FOUNDKEY = "void-found";      // reverse-at-speed finds, kept forever
    const TARGET_PEAK = 0.9;            // normalise every track toward this
    const GAIN_CLAMP = [0.5, 6];        // never amplify silence into hiss

    let ctx = null;
    const audioCtx = () => (ctx ||= new (window.AudioContext || window.webkitAudioContext)());

    let userVol = 0.8;
    try { const v = parseFloat(localStorage.getItem(VOLKEY)); if (v >= 0 && v <= 1) userVol = v; }
    catch {}
    const players = [];

    const mmss = s => (isFinite(s) ? Math.floor(s / 60) + ":" + String(Math.floor(s % 60)).padStart(2, "0") : "--:--");

    /* ---- reverse-at-speed, as a first-class mechanic (beat 1.12) --------
       Hold the stated direction and rate for long enough and the sub-audio
       unlocks PERMANENTLY. It survives reload and it survives the player
       forgetting how they did it — nobody should have to re-find a thing
       they already found, and nobody should need Audacity to find it. */
    const found = {
      read() { try { return JSON.parse(localStorage.getItem(FOUNDKEY)) || {}; } catch { return {}; } },
      add(id) { const f = this.read(); f[id] = 1;
                try { localStorage.setItem(FOUNDKEY, JSON.stringify(f)); } catch {} },
      has(id) { return !!this.read()[id]; },
    };

    /* ---- loading, sealed or otherwise ---------------------------------
       A sealed track is AES-GCM over the raw file bytes. The .enc can sit
       in assets/audio in public, fully downloadable, and be useless — a
       solver can see the file exists and cannot hear it. That is a taunt
       asset, and it is the join between the puzzles and the recordings:
       the key arrives inside a door payload, never from a text box.

       Same decodeAudioData path either way, so normalisation, reverse,
       speed and subtitles all come along for free.

       SEALED means "we have the file and not the key".
       NOT RECOVERED means "there is no file yet". Different states, and a
       solver is entitled to tell them apart. */
    const SEALED = "sealed";
    async function loadBuffer(rec) {
      if (rec.sealed && !KEYS[rec.id]) throw new Error(SEALED);
      const r = await fetch(rec.file);
      if (!r.ok) throw new Error("not recovered");
      let bytes = await r.arrayBuffer();
      if (rec.sealed) {
        try {
          bytes = await decryptBytes(rec.sealed, KEYS[rec.id], bytes);
        } catch { throw new Error(SEALED); }        // a stale or wrong key
      }
      return audioCtx().decodeAudioData(bytes);
    }

    function peakOf(buf) {
      let peak = 0;
      for (let c = 0; c < buf.numberOfChannels; c++) {
        const d = buf.getChannelData(c);
        for (let i = 0; i < d.length; i += 64) { const v = Math.abs(d[i]); if (v > peak) peak = v; }
      }
      return peak || 1;
    }

    function reversed(buf) {
      const out = audioCtx().createBuffer(buf.numberOfChannels, buf.length, buf.sampleRate);
      for (let c = 0; c < buf.numberOfChannels; c++)
        out.copyToChannel(Float32Array.from(buf.getChannelData(c)).reverse(), c);
      return out;
    }

    for (const rec of CFG.RECORDINGS) {
      const el = document.createElement("div");
      el.className = "rec";
      el.dataset.id = rec.id;
      el.innerHTML = `
        <div class="rec-head">
          <span class="dot" aria-hidden="true"></span>
          <span class="rec-id mono">${rec.label || ""}</span>
          <span class="rec-title">${rec.title || ""}</span>
          <span class="rec-state mono">loading</span>
        </div>
        <div class="rec-body">
          <div class="transport">
            <button class="pp" aria-label="play">&#9654;</button>
            <span class="time mono">0:00</span>
            <div class="bar" role="slider" tabindex="0" aria-label="position"
                 aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><span class="fill"></span></div>
            <span class="dur mono">--:--</span>
          </div>
          <div class="tools">
            <label class="vol"><span class="mono">vol</span>
              <input type="range" class="v" min="0" max="1" step="0.01" aria-label="volume"></label>
            <div class="seg" role="group" aria-label="speed">
              <button data-rate="0.5">.5&times;</button><button data-rate="1" class="on">1&times;</button><button data-rate="1.5">1.5&times;</button>
            </div>
            <button class="tg rev" aria-pressed="false">reverse</button>
            <button class="tg cc" aria-pressed="false">subtitles</button>
          </div>
          <div class="cue" aria-live="polite"></div>
          <div class="sub" aria-live="polite"></div>
        </div>`;
      host.appendChild(el);

      const $ = s => el.querySelector(s);
      const P = {
        rec, el, buf: null, rbuf: null, src: null, gain: null, norm: 1,
        offset: 0, startedAt: 0, playing: false, rate: 1, rev: false, cc: false,
      };
      players.push(P);
      $(".v").value = userVol;

      const pos = () => {
        if (!P.playing) return P.offset;
        const e = (audioCtx().currentTime - P.startedAt) * P.rate;
        const p = P.rev ? P.offset - e : P.offset + e;
        return Math.max(0, Math.min(P.buf ? P.buf.duration : 0, p));
      };

      function paintCue(p) {
        if (!P.cc || !P.rec.cues) { $(".cue").textContent = ""; return; }
        let line = "";
        for (const c of P.rec.cues) if (p >= c.t) line = c.text;
        $(".cue").textContent = line;
      }

      /* the hidden sub-audio, once and forever */
      function paintSub() {
        const h = P.rec.hidden;
        if (!h || !found.has(h.id)) return;
        const box = $(".sub");
        if (box.dataset.on) return;
        box.dataset.on = "1";
        box.innerHTML = `
          <div class="sub-head"><span class="mono">${h.label || "sub-audio"}</span>
            <span class="sub-title">${h.title || ""}</span></div>
          ${h.note ? `<p class="sub-note">${h.note}</p>` : ""}
          ${h.file ? `<audio controls preload="none" src="${h.file}"></audio>` : ""}`;
        el.classList.add("has-sub");
      }

      /* accumulate time held in the stated state; unlock when it is enough */
      function watchHidden(dt) {
        const h = P.rec.hidden;
        if (!h || found.has(h.id)) return;
        const match = (h.reverse == null || P.rev === !!h.reverse) &&
                      (h.rate == null || Math.abs(P.rate - h.rate) < 1e-6);
        P.held = match ? (P.held || 0) + dt : 0;
        if (P.held >= (h.after == null ? 4 : h.after)) { found.add(h.id); paintSub(); }
      }

      function frame() {
        if (!P.buf) return;
        const p = pos(), d = P.buf.duration;
        const now = audioCtx().currentTime;
        watchHidden(P.lastT == null ? 0 : Math.max(0, now - P.lastT));
        P.lastT = now;
        $(".time").textContent = mmss(p);
        $(".fill").style.width = (p / d * 100) + "%";
        $(".bar").setAttribute("aria-valuenow", Math.round(p / d * 100));
        paintCue(p);
        if (P.playing && ((!P.rev && p >= d - 0.02) || (P.rev && p <= 0.02))) stop(true);
        if (P.playing) requestAnimationFrame(frame);
      }

      function stop(ended) {
        if (P.src) { try { P.src.onended = null; P.src.stop(); } catch {} P.src = null; }
        if (P.playing) P.offset = ended ? (P.rev ? 0 : P.buf.duration) : pos();
        P.playing = false;
        P.lastT = null; P.held = 0;      // the hold only counts while it plays
        $(".pp").innerHTML = "&#9654;"; $(".pp").setAttribute("aria-label", "play");
        el.classList.remove("playing");
      }

      function play() {
        if (!P.buf) return;
        const c = audioCtx();
        if (c.state === "suspended") c.resume();
        if (P.rev && !P.rbuf) P.rbuf = reversed(P.buf);
        const buf = P.rev ? P.rbuf : P.buf;
        const start = P.rev ? Math.max(0, P.buf.duration - P.offset) : P.offset;
        P.src = c.createBufferSource();
        P.src.buffer = buf;
        P.src.playbackRate.value = P.rate;
        P.gain = c.createGain();
        P.gain.gain.value = P.norm * userVol;
        P.src.connect(P.gain).connect(c.destination);
        P.startedAt = c.currentTime;
        P.src.start(0, start);
        P.playing = true;
        $(".pp").innerHTML = "&#10073;&#10073;"; $(".pp").setAttribute("aria-label", "pause");
        el.classList.add("playing");
        requestAnimationFrame(frame);
      }

      const restart = () => { const was = P.playing; if (was) { stop(); play(); } };

      $(".pp").addEventListener("click", () => (P.playing ? stop() : play()));

      $(".bar").addEventListener("click", e => {
        if (!P.buf) return;
        const r = $(".bar").getBoundingClientRect();
        P.offset = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)) * P.buf.duration;
        restart(); frame();
      });
      $(".bar").addEventListener("keydown", e => {
        if (!P.buf) return;
        const step = e.shiftKey ? 10 : 2;
        if (e.key === "ArrowRight") P.offset = Math.min(P.buf.duration, pos() + step);
        else if (e.key === "ArrowLeft") P.offset = Math.max(0, pos() - step);
        else return;
        e.preventDefault(); restart(); frame();
      });

      $(".v").addEventListener("input", e => {
        userVol = parseFloat(e.target.value);
        try { localStorage.setItem(VOLKEY, userVol); } catch {}
        for (const q of players) {                       // one volume, every player
          if (q.gain) q.gain.gain.value = q.norm * userVol;
          q.el.querySelector(".v").value = userVol;
        }
      });

      $(".seg").addEventListener("click", e => {
        const b = e.target.closest("[data-rate]"); if (!b) return;
        P.offset = pos();
        P.rate = parseFloat(b.dataset.rate);
        [...$(".seg").children].forEach(x => x.classList.toggle("on", x === b));
        restart();
      });

      $(".rev").addEventListener("click", () => {
        P.offset = pos();
        P.rev = !P.rev;
        $(".rev").setAttribute("aria-pressed", P.rev);
        $(".rev").classList.toggle("on", P.rev);
        el.classList.toggle("reversed", P.rev);
        restart();
      });

      $(".cc").addEventListener("click", () => {
        P.cc = !P.cc;
        $(".cc").setAttribute("aria-pressed", P.cc);
        $(".cc").classList.toggle("on", P.cc);
        el.classList.toggle("cc-on", P.cc);
        paintCue(pos());
      });

      /* load — a missing file is a teaser, not a failure, and a sealed one
         is a taunt. Re-runnable: when a door hands over this track's key,
         onKey below calls straight back in here. */
      function load() {
        return loadBuffer(rec).then(buf => {
          P.buf = buf;
          P.norm = Math.max(GAIN_CLAMP[0], Math.min(GAIN_CLAMP[1], TARGET_PEAK / peakOf(buf)));
          $(".dur").textContent = mmss(buf.duration);
          $(".rec-state").textContent = rec.structure || "recovered";
          el.classList.remove("missing", "locked");
          el.classList.add("live");
          el.querySelectorAll("button,input").forEach(b => (b.disabled = false));
          if (!rec.cues || !rec.cues.length) $(".cc").disabled = true;
          paintSub();
        }).catch(err => {
          const sealed = err && err.message === SEALED;
          $(".rec-state").textContent = sealed ? "sealed" : "not yet recovered";
          el.classList.add(sealed ? "locked" : "missing");
          el.querySelectorAll("button,input").forEach(b => (b.disabled = true));
          paintSub();        // a find already made outlives the missing file
        });
      }
      load();
      if (rec.sealed) onKey(id => { if (id === rec.id) load(); });
    }
  })();

  /* ================= the sealed vault — five states =================
     not indexed  the record number exists, nothing sits behind it
     held         sealed, prompt visible, input live
     transcribed  the community has opened this; her working copy is offered
     read         open; the frame and her note stay, payload appears below
     emptied      opens onto nothing. he removed the contents.
     ================================================================== */
  const STATE = { NOT_INDEXED: "not-indexed", HELD: "held",
                  TRANSCRIBED: "transcribed", READ: "read", EMPTIED: "emptied" };
  const STATUS_TEXT = {
    "not-indexed": "not indexed", "held": "held",
    "transcribed": "transcribed", "read": "read", "emptied": "emptied",
  };
  const EMPTIED_MARK = "<!--void:emptied-->";

  /* pure — the whole machine. exported for tests. */
  function resolveState({ hasCipher, opened, emptied, communityAnswer }) {
    if (!hasCipher)       return STATE.NOT_INDEXED;
    if (opened)           return emptied ? STATE.EMPTIED : STATE.READ;
    if (communityAnswer)  return STATE.TRANSCRIBED;
    return STATE.HELD;
  }

  /* a door: the answer is typed by a human, so it is normalised first */
  async function tryOpen(entry, answer) {
    const pt = await decryptBytes(entry, norm(answer), b64(entry.ct));
    return unpad(new TextDecoder().decode(pt));
  }

  /* Try an answer as typed, then again with the alias prefix in front of it.
     This is how VOID is accepted for I AM VOID without the accepted answer
     ever being written into a file the audience can read. */
  async function tryOpenAliased(entry, answer, prefix) {
    const tries = [answer];
    if (prefix && !norm(answer).startsWith(norm(prefix))) tries.push(prefix + answer);
    let last;
    for (const t of tries) {
      try { return await tryOpen(entry, t); } catch (e) { last = e; }
    }
    throw last;
  }

  const store = {
    key: "void-vault",
    read() { try { return JSON.parse(localStorage.getItem(this.key)) || {}; } catch { return {}; } },
    save(o) { try { localStorage.setItem(this.key, JSON.stringify(o)); } catch {} },
  };

  /* community state — a static file. only ever lists doors already opened by
     someone, so publishing the answers spoils nothing. her archive updates in
     her rhythm, not in real time. */
  async function communityState() {
    try {
      const r = await fetch("state.json", { cache: "no-store" });
      if (!r.ok) return {};
      return (await r.json()).transcribed || {};
    } catch { return {}; }
  }

  /* ================= the last door — stage two ========================
     Stage one's plaintext IS stage two's door. Two ciphertexts, one
     record, sequential — the existing nested-door primitive, nothing new.

     On the knock the entire site goes black: the archive, the catalogue,
     the drifting glyphs, all of it strips away. One line of text and one
     input remain. He answers the words he gave you by taking the world
     away and telling you that is not an answer.

     Stage two is the only input in the project that comes from outside his
     language. V is dead — his name cannot be written in his own script. It
     can only be typed, in English, by someone who is not him.
     ==================================================================== */
  const FINALE_KEY = "the-unwritten:2";
  let blackout = null;

  function openFinale(payload, FIN, restoring) {
    if (blackout) return;
    document.body.classList.add("blackout");
    blackout = document.createElement("div");
    blackout.id = "black";
    blackout.innerHTML = `
      <div class="bwrap">
        <p class="bq">${FIN.prompt || ""}</p>
        <div class="bspeak"><input type="text" autocomplete="off" spellcheck="false"
             aria-label="${FIN.prompt || "answer"}"></div>
        <p class="bhint">${FIN.hint || ""}</p>
        <div class="bpay"></div>
      </div>`;
    document.body.appendChild(blackout);
    if (restoring) blackout.classList.add("instant");

    const input = blackout.querySelector("input");
    const pay = blackout.querySelector(".bpay");

    function land(html) {
      pay.innerHTML = html;
      harvestKeys(pay);
      blackout.classList.add("answered");
      blackout.querySelector(".bspeak").remove();
      blackout.querySelector(".bhint").remove();
    }

    async function answer(ans, silent) {
      workStart();
      try {
        const html = await tryOpenAliased(payload.next, ans, FIN.aliasPrefix);
        const k = store.read();
        k[FINALE_KEY] = { a: ans, t: false };
        store.save(k);
        land(html);
      } catch {
        if (silent) return;
        blackout.classList.add("shake");
        setTimeout(() => blackout.classList.remove("shake"), 450);
      } finally { workEnd(); }
    }

    input.addEventListener("keydown", e => {
      if (e.key === "Enter" && input.value.trim()) answer(input.value);
    });
    setTimeout(() => input.focus(), restoring ? 0 : 2200);

    const saved = store.read()[FINALE_KEY];
    if (saved) answer(typeof saved === "string" ? saved : saved.a, true);
  }

  const vaultReady = (async function vault() {
    const host = document.getElementById("vault");
    if (!host) return;
    const known = store.read();
    const community = await communityState();
    const restoring = [];        // every door reopens at once, not in a queue

    const FIN = CFG.FINALE || {};

    for (const id of Object.keys(CFG.DOOR_TEXT)) {
      const t = CFG.DOOR_TEXT[id];
      /* the phantom door draws its ciphertext from FINALE, not VAULT, and
         FINALE is empty until reveal day. It cannot be cracked because it
         is not there. */
      const isFinale = !!t.finale;
      const entry = isFinale ? (FIN.enabled ? FIN.stage1 : null)
                             : CFG.VAULT.find(v => v.id === id);
      const hasCipher = !!entry;
      const communityAnswer = isFinale ? null : community[id];

      const door = document.createElement("div");
      door.className = "door";
      door.dataset.id = id;
      door.innerHTML = `
        <div class="head">
          <span class="mono id">${t.label || id}</span>
          <span class="status"></span>
        </div>
        ${t.provenance ? `<div class="prov">provenance: ${t.provenance}</div>` : ""}
        ${t.prompt ? `<p class="prompt">${t.prompt}</p>` : ""}
        <div class="speak"><input type="text" autocomplete="off" spellcheck="false"
             placeholder="term" aria-label="term for ${t.label || id}"></div>
        <div class="transcript"><button type="button" class="tbtn">read her transcription</button>
          <div class="fine">her margins included, and her margins are not always right</div></div>
        <div class="whisper" aria-live="polite"></div>
        <div class="payload"></div>
        <div class="blank"><div class="bline"></div><div class="btxt">the record is blank</div></div>`;
      host.appendChild(door);

      const input   = door.querySelector("input");
      const whisper = door.querySelector(".whisper");
      const payload = door.querySelector(".payload");

      function paint(state, viaTranscript) {
        door.dataset.state = state;
        door.classList.toggle("via-transcript", !!viaTranscript);
        door.querySelector(".status").textContent = t.status || STATUS_TEXT[state];
      }

      async function attempt(ans, opts = {}) {
        workStart();
        try {
          const html = await tryOpen(entry, ans);

          /* THE KNOCK. Stage one is not a gate — it is a ritual, and it
             proves you were present rather than clever. Its plaintext is
             not a payload, it is the next door. The site goes black. */
          if (isFinale) {
            const k = store.read();
            k[id] = { a: ans, t: false };
            store.save(k);
            markOpen(id);
            openFinale(JSON.parse(html), FIN, !!opts.silent);
            return;
          }

          const isEmpty = html.trim().startsWith(EMPTIED_MARK);
          if (!isEmpty) { payload.innerHTML = html; harvestKeys(payload); }
          paint(resolveState({ hasCipher, opened: true, emptied: isEmpty, communityAnswer }),
                opts.viaTranscript);
          whisper.textContent = "";
          markOpen(id);
          const k = store.read();
          k[id] = { a: ans, t: !!opts.viaTranscript };
          store.save(k);
        } catch {
          if (opts.silent) return;
          door.classList.add("shake");
          setTimeout(() => door.classList.remove("shake"), 450);
          whisper.textContent = "no match in index.";
          whisper.classList.add("show");
          setTimeout(() => whisper.classList.remove("show"), 2600);
        } finally { workEnd(); }
      }

      input.addEventListener("keydown", e => {
        if (e.key === "Enter" && input.value.trim()) attempt(input.value);
      });
      door.querySelector(".tbtn").addEventListener("click", () => {
        if (communityAnswer) attempt(communityAnswer, { viaTranscript: true });
      });

      /* restore, then settle on the opening state.
         Key derivation is deliberately expensive and there is one per door,
         so reopening them serially made a returning visitor wait for the sum
         of every door on the page. At 600k iterations that is visible. They
         reopen concurrently; DOM order is already fixed above. */
      const saved = known[id];
      if (saved && hasCipher) {
        const ans = typeof saved === "string" ? saved : saved.a;   // migrate old format
        restoring.push(attempt(ans, { silent: true, viaTranscript: typeof saved === "object" && saved.t }));
      } else {
        paint(resolveState({ hasCipher, opened: false, emptied: false, communityAnswer }), false);
      }
    }
    await Promise.all(restoring);
  })();

  /* Deterministic readiness for the harnesses. Tests used to sleep a fixed
     120ms and hope every door had finished deriving its key, which is a race
     by construction — it passed until the page grew. Await this instead. */
  window.__voidReady = vaultReady;

  if (typeof module !== "undefined")
    module.exports = { resolveState, STATE, unpad, norm, DEFAULT_ITERS };

  /* ================= the bench — her reconstruction of his key =========
     The one thing on this site you DO rather than answer.

     She built a transcriber from the key he published. The key is wrong in
     four places, so the transcriber is wrong in four places. Click two cells
     to swap what they read as; the passage below re-transcribes live.

     Repairing it is the puzzle. Nothing is gated behind a text box.
     ==================================================================== */
  (function bench() {
    const B = window.VOID_BENCH;
    const host = document.getElementById("bench");
    if (!B || !host) return;

    const KEY = "void-bench";
    const truth = Object.fromEntries(B.ORDER.map(l => [l, l]));
    let map;                       // cell letter -> glyph name it currently reads as
    try { map = JSON.parse(localStorage.getItem(KEY)) || null; } catch { map = null; }
    if (!map || Object.keys(map).length !== B.ORDER.length) map = { ...B.PUBLISHED };

    let picked = null;

    const svg = (d, cls) =>
      `<svg class="${cls}" viewBox="0 0 24 32" aria-hidden="true"><path d="${d}"/></svg>`;

    host.innerHTML = `
      <div class="bench-head">
        <span class="mono">her reconstruction</span>
        <span class="bench-state mono"></span>
      </div>
      <p class="bench-hint">Two cells at a time. What they read as trades places.</p>
      <div class="cells"></div>
      <div class="readout" aria-live="polite"></div>
      <div class="bench-note"></div>`;

    const cells = host.querySelector(".cells");
    const readout = host.querySelector(".readout");
    const stateEl = host.querySelector(".bench-state");
    const noteEl = host.querySelector(".bench-note");

    /* glyph -> the letter a solver would write, under the current mapping */
    function reading() {
      const r = {};
      for (const cell of B.ORDER) r[map[cell]] = cell;
      return r;
    }

    function transcribe() {
      const r = reading();
      return B.STREAM.map(w => w.map(g =>
        g === "PERTHRO" ? "." : g === "ISA" ? "," : g === "NAUTHIZ" ? "?"
        : g === "TH" ? "&thinsp;?&thinsp;"          // unlisted in his key — not a letter
        : (r[g] || "&middot;")).join("")).join(" ");
    }

    const solved = () => B.ORDER.every(l => map[l] === truth[l]);

    function draw() {
      cells.innerHTML = B.ORDER.map(cell => {
        const g = map[cell];
        const wrong = false;                       // never reveal which are wrong
        return `<button class="cell${picked === cell ? " picked" : ""}" data-cell="${cell}"
                  aria-label="cell ${cell}" aria-pressed="${picked === cell}">
                  ${svg(B.PATHS[g], "gl")}<span class="cl">${cell}</span></button>`;
      }).join("");
      readout.innerHTML = transcribe();
      const ok = solved();
      host.classList.toggle("resolved", ok);
      stateEl.textContent = ok ? "resolved" : "provisional";
      noteEl.innerHTML = ok
        ? `<span class="mlab">entry 024</span>
           <p>Four cells were transposed. Not encrypted — <i>mistaken</i>. He was
           writing in an alphabet that is not his and he got four of them wrong,
           which is a thing I did not think he could do.</p>
           <p>Filing the corrected table. Leaving the original beside it.</p>`
        : "";
      try { localStorage.setItem(KEY, JSON.stringify(map)); } catch {}
    }

    cells.addEventListener("click", e => {
      const btn = e.target.closest(".cell");
      if (!btn || solved()) return;
      const cell = btn.dataset.cell;
      if (picked === null) { picked = cell; }
      else if (picked === cell) { picked = null; }
      else {
        const t = map[picked]; map[picked] = map[cell]; map[cell] = t;
        picked = null;
      }
      draw();
    });

    draw();
  })();

  /* ================= the index — primitive 4 ==========================
     A NUMBER LOG. Nothing on the page but her numbering: a wall of entry
     numbers in multiples of six, most of them dark. Clicking a lit one
     expands that number into a modal carrying the record.

     Rendering the whole ladder rather than only what she wrote is the
     point. WHICH ENTRIES ARE ABSENT IS DATA — the archive is incomplete
     because it was found, not given, and a wall of holes says that far
     better than a list of the four things anyone can currently read.

     Four ways a number can be dark, and three of them look identical on
     purpose:
       - no record was ever written for it
       - the record exists but its act has not landed (CFG.ACT)
       - the record exists and the door in front of it is still shut
         (this one is distinguishable — it is marked as held, because a
          number you can see is held is a number worth working on)
       - the record is unlisted and only an exact query reaches it
     ==================================================================== */
  (function catalogue() {
    const host = document.getElementById("catalogue");
    if (!host || !CFG.CATALOGUE) return;

    const ACT = CFG.ACT == null ? 99 : CFG.ACT;
    const L = Object.assign({ step: 6, from: 6, to: 900 }, CFG.CATALOGUE_LADDER || {});
    const pad = n => String(n).padStart(3, "0");

    const all = CFG.CATALOGUE.slice().sort((a, b) => a.n - b.n);
    const byN = new Map(all.map(e => [e.n, e]));
    const inAct = e => (e.act == null ? 1 : e.act) <= ACT;
    const isOpen = e => !e.gated || OPENED.has(e.gated);
    /* a record she wrote, whose act has landed, and which is not unlisted */
    const listed = () => all.filter(e => !e.secret && inAct(e));
    /* readable right now — the door in front of it is open too */
    const legible = n => { const e = byN.get(n); return !!e && inAct(e) && isOpen(e); };

    const ladder = [];
    for (let n = L.from; n <= L.to; n += L.step) ladder.push(n);

    host.innerHTML = `
      <div class="cat-head">
        <span class="mono">recovered records</span>
        <span class="cat-count mono"></span>
      </div>
      <div class="cat-search">
        <input type="text" autocomplete="off" spellcheck="false"
               placeholder="query" aria-label="query the index">
      </div>
      <div class="cat-log" role="list" aria-label="entry numbers"></div>
      <p class="cat-foot mono"></p>`;

    const log = host.querySelector(".cat-log");
    const countEl = host.querySelector(".cat-count");
    const footEl = host.querySelector(".cat-foot");
    const search = host.querySelector(".cat-search input");

    /* ---- the log: numbers only ---------------------------------------- */
    function chipHTML(n, forced) {
      const e = byN.get(n);
      const shown = forced || (e && !e.secret && inAct(e));
      if (!shown) {
        return `<span class="cat-num absent" role="listitem"
                  aria-label="${pad(n)}, no record">${pad(n)}</span>`;
      }
      const held = !isOpen(e);
      return `<button class="cat-num${held ? " held" : ""}" role="listitem"
                data-n="${n}" aria-haspopup="dialog"
                aria-label="entry ${pad(n)}${held ? ", held" : ""}">${pad(n)}</button>`;
    }

    function draw(q) {
      const query = (q || "").trim();

      /* an exact number reaches records that are on no list. J Q V are gone
         as letters and survive as six, ninety, nine hundred — a message
         carrying dead glyphs is stating a number, and a number is a query. */
      if (/^\d+$/.test(query)) {
        const n = parseInt(query, 10);
        const e = byN.get(n);
        if (e && inAct(e)) {
          log.innerHTML = chipHTML(n, true);
          countEl.textContent = "1 record";
          footEl.textContent = "";
          return;
        }
        const onLadder = n >= L.from && n <= L.to && n % L.step === 0;
        log.innerHTML = "";
        countEl.textContent = "0 records";
        footEl.textContent = onLadder
          ? `no record at ${pad(n)}`
          : `${pad(n)} is not on the index`;
        return;
      }

      let show = ladder;
      if (query) {
        const needle = query.toLowerCase();
        const hits = listed().filter(e => isOpen(e) &&
          ((e.text || "") + " " + (e.addendum || "")).toLowerCase().includes(needle));
        show = hits.map(e => e.n);
        log.innerHTML = show.map(n => chipHTML(n, true)).join("");
        countEl.textContent = `${show.length} record${show.length === 1 ? "" : "s"}`;
        footEl.textContent = show.length ? "" : "nothing in the index matches";
        return;
      }

      log.innerHTML = ladder.map(n => chipHTML(n)).join("");
      const have = listed().length;
      countEl.textContent = `${have} of ${ladder.length} recovered`;
      footEl.textContent = "";
    }

    /* ---- the modal ----------------------------------------------------- */
    let modal = null, lastFocus = null;
    const M = Object.assign({ glitch: true }, CFG.MOTION || {});
    const GLITCH = !!M.glitch && !REDUCED;

    /* Digits tumble and lock left to right, the way a field resolves rather
       than the way text fades. Deliberately NOT a generic character shuffle:
       her numbering is the one thing on this site that carries meaning, so
       the thing that settles is the number.

       Two safety rails, because this writes to the DOM on a timer:
         - the element already holds the correct value before this is called
         - a hard timeout forces the final value whether or not frames ran
       so a cut-short animation, a background tab, or a stubbed rAF can never
       leave a wrong record number on screen. */
    function scramble(el, final, ms = 340) {
      if (!GLITCH || !el) { el && (el.textContent = final); return; }
      const digits = final.replace(/\D/g, "");
      const head = final.slice(0, final.length - digits.length);
      const t0 = Date.now();
      const settle = setTimeout(() => { el.textContent = final; }, ms + 80);
      /* start on the NEXT frame, never synchronously. The element already
         holds the right value; if frames never come — background tab, a
         harness that stubs rAF — the correct number is what stays on
         screen rather than whatever the first tumble happened to be. */
      requestAnimationFrame(function step() {
        if (!el.isConnected) { clearTimeout(settle); return; }
        const p = (Date.now() - t0) / ms;
        if (p >= 1) { el.textContent = final; clearTimeout(settle); return; }
        const locked = Math.floor(p * digits.length * 1.35);
        let out = "";
        for (let i = 0; i < digits.length; i++)
          out += i < locked ? digits[i] : String((Math.random() * 10) | 0);
        el.textContent = head + out;
        requestAnimationFrame(step);
      });
    }

    function recordHTML(e) {
      if (!isOpen(e)) {
        return `<div class="rec-state-line mono">recovered · not transcribed</div>`;
      }
      const links = [];
      /* only cross-link when the other end is legible too — diffing her
         corrections is the puzzle, and half a diff is a spoiler */
      if (e.corrects && legible(e.corrects)) links.push({ n: e.corrects, t: "correction to" });
      if (e.correctedBy && legible(e.correctedBy)) links.push({ n: e.correctedBy, t: "overturned by" });

      return `
        ${links.length ? `<div class="cat-links mono">${links.map(l =>
          `<button class="cat-jump" data-n="${l.n}">${l.t} ${pad(l.n)}</button>`).join(" · ")}</div>` : ""}
        <p class="cat-text">${e.text}</p>
        ${e.addendum ? `<p class="cat-add"><span class="mono">addendum</span> ${e.addendum}</p>` : ""}
        ${e.margin ? `<div class="cat-margin"><p>［${e.margin}］</p></div>` : ""}`;
    }

    function close() {
      if (!modal) return;
      const m = modal;
      modal = null;
      m.classList.remove("in");
      if (GLITCH) m.classList.add("closing");
      const done = () => m.remove();
      REDUCED ? done() : setTimeout(done, 260);
      if (lastFocus && lastFocus.isConnected) lastFocus.focus();
    }

    function open(n, fromEl) {
      const e = byN.get(n);
      if (!e || !inAct(e)) return;
      if (modal) { modal.remove(); modal = null; }
      lastFocus = fromEl || document.activeElement;

      modal = document.createElement("div");
      modal.className = "cat-modal";
      /* aria-label rather than aria-labelledby: the visible number scrambles
         while it resolves, and a screen reader should be given the record
         number once, correctly, not watched flickering through it. */
      modal.innerHTML = `
        <div class="cat-scrim"></div>
        <div class="cat-card" role="dialog" aria-modal="true"
             aria-label="entry ${pad(n)}" tabindex="-1">
          <span class="cat-tear" aria-hidden="true"></span>
          <div class="cat-card-head">
            <span class="mono" id="cat-card-n">entry ${pad(n)}</span>
            <button class="cat-close" aria-label="close">&times;</button>
          </div>
          <div class="cat-card-body">${recordHTML(e)}</div>
        </div>`;
      document.body.appendChild(modal);
      if (host.classList.contains("margins-on")) modal.classList.add("margins-on");

      const card = modal.querySelector(".cat-card");
      if (GLITCH) modal.classList.add("glitching");
      requestAnimationFrame(() => modal && modal.classList.add("in"));
      /* the record does not fade in. It RESOLVES — the number lands last,
         after tumbling, the way a value does when a read finally returns.
         The DOM is correct from the first frame and the scramble only ever
         overwrites it mid-flight, so nothing here can leave a wrong number
         on screen if the animation is cut short. */
      scramble(modal.querySelector("#cat-card-n"), `entry ${pad(n)}`);
      if (GLITCH) setTimeout(() => modal && modal.classList.remove("glitching"), 620);
      card.focus();

      modal.addEventListener("click", ev => {
        if (ev.target.closest(".cat-close") || ev.target.closest(".cat-scrim")) return close();
        const jump = ev.target.closest(".cat-jump");
        if (jump) { const to = +jump.dataset.n; close(); open(to, chipFor(to)); }
      });
      modal.addEventListener("keydown", ev => {
        if (ev.key === "Escape") { ev.preventDefault(); close(); return; }
        if (ev.key !== "Tab") return;
        /* a modal that leaks focus to the page behind it is not a modal */
        const f = [...card.querySelectorAll("button, [href], input, [tabindex]:not([tabindex='-1'])")];
        if (!f.length) { ev.preventDefault(); return; }
        const first = f[0], last = f[f.length - 1];
        if (ev.shiftKey && document.activeElement === first) { ev.preventDefault(); last.focus(); }
        else if (!ev.shiftKey && document.activeElement === last) { ev.preventDefault(); first.focus(); }
      });
    }

    const chipFor = n => log.querySelector(`.cat-num[data-n="${n}"]`);

    log.addEventListener("click", ev => {
      const b = ev.target.closest(".cat-num[data-n]");
      if (b) open(+b.dataset.n, b);
    });

    search.addEventListener("input", ev => draw(ev.target.value));
    /* a door opening indexes a record — repaint, and repaint whatever is
       open on top of it, so a record does not sit there still saying held */
    onOpen(() => {
      draw(search.value);
      if (modal) {
        const n = +modal.querySelector("#cat-card-n").textContent.replace(/\D/g, "");
        const e = byN.get(n);
        if (e) modal.querySelector(".cat-card-body").innerHTML = recordHTML(e);
      }
    });
    host.classList.toggle("margins-on", !!CFG.MARGINS);
    draw("");
  })();

  /* ================= 2.A — the order ==================================
     Eleven remnants, one glyph each. Arrange them and the glyphs spell
     something.

     THE ANSWER IS NOT IN THIS FILE. The order is derivable from lore, not
     from the page source and not from audio tools. This bench never says
     whether you are right — exactly like her key bench, the readout
     getting closer to sense is the only feedback there is.
     ==================================================================== */
  (function orderBench() {
    const host = document.getElementById("order");
    if (!host || !CFG.CAPTURE) return;

    const ACT = CFG.ACT == null ? 99 : CFG.ACT;
    const KEY = "void-order";
    const roster = CFG.CAPTURE.slice();
    const live = roster.filter(c => (c.act == null ? 1 : c.act) <= ACT);
    const slots = roster.length;

    /* seat[i] = capture id sitting in slot i, or null for an empty seat */
    let seat;
    try { seat = JSON.parse(localStorage.getItem(KEY)); } catch { seat = null; }
    const ids = live.map(c => c.id);
    if (!Array.isArray(seat) || seat.length !== slots ||
        seat.filter(Boolean).sort().join() !== ids.slice().sort().join()) {
      seat = new Array(slots).fill(null);
      live.forEach((c, i) => { seat[i] = c.id; });
    }
    const at = id => roster.find(c => c.id === id);

    let picked = null;

    host.innerHTML = `
      <div class="ord-head">
        <span class="mono">recovered fragments</span>
        <span class="ord-state mono">${live.length} of ${slots} recovered</span>
      </div>
      <p class="ord-hint">Two at a time. They trade places. Nothing here will tell you when you are right.</p>
      <div class="ord-slots"></div>
      <div class="ord-readout mono" aria-live="polite"></div>`;

    const slotsEl = host.querySelector(".ord-slots");
    const readout = host.querySelector(".ord-readout");

    function draw() {
      slotsEl.innerHTML = seat.map((id, i) => {
        const c = id ? at(id) : null;
        if (!c) return `<div class="ord-slot empty"><span class="og mono">·</span>
                        <span class="on mono">not yet recovered</span></div>`;
        return `<button class="ord-slot${picked === i ? " picked" : ""}" data-i="${i}"
                  aria-pressed="${picked === i}" aria-label="${c.name}">
                  <span class="og">${c.glyph}</span><span class="on mono">${c.name}</span>
                </button>`;
      }).join("");
      readout.textContent = seat.map(id => (id ? at(id).glyph : "·")).join(" ");
      try { localStorage.setItem(KEY, JSON.stringify(seat)); } catch {}
    }

    slotsEl.addEventListener("click", e => {
      const b = e.target.closest(".ord-slot[data-i]");
      if (!b) return;
      const i = +b.dataset.i;
      if (picked === null) picked = i;
      else if (picked === i) picked = null;
      else { const t = seat[picked]; seat[picked] = seat[i]; seat[i] = t; picked = null; }
      draw();
    });

    draw();
  })();

  /* ================= 2.D — the classification bench ===================
     Her filing interface. TWO BOXES, THREE KINDS OF SPECIMEN.

     Set one is an interrupted transfer. Set two is one that agreed. Four
     records are interrupted, did not agree, and completed anyway — and
     there is no box for that. The bench does not grow one. It flags the
     row and files it under set one, because that is what she does.

     Players find the gap with their hands, weeks before entry 156 admits
     it in writing.
     ==================================================================== */
  (function classifyBench() {
    const host = document.getElementById("classify");
    if (!host || !CFG.CLASSIFY) return;

    const ACT = CFG.ACT == null ? 99 : CFG.ACT;
    const KEY = "void-classify";
    const recs = CFG.CLASSIFY.filter(r => (r.act == null ? 1 : r.act) <= ACT);
    if (!recs.length) { host.closest("section")?.classList.add("hidden"); return; }

    const BOXES = [
      { id: "one", label: "set one", rule: "transfer interrupted",
        fits: r => r.interruption && !r.completed },
      { id: "two", label: "set two", rule: "transfer agreed",
        fits: r => !r.interruption && r.consent },
    ];

    let filed;
    try { filed = JSON.parse(localStorage.getItem(KEY)) || {}; } catch { filed = {}; }

    const noteEntry = (CFG.CATALOGUE || []).find(e => e.n === CFG.CLASSIFY_NOTE_ENTRY);
    const noteReady = !!noteEntry && (noteEntry.act == null ? 1 : noteEntry.act) <= ACT;

    host.innerHTML = `
      <div class="cls-head"><span class="mono">unfiled</span></div>
      <div class="cls-pool"></div>
      <div class="cls-boxes">${BOXES.map(b => `
        <div class="cls-box" data-box="${b.id}">
          <div class="cls-box-head"><span class="mono">${b.label}</span>
            <span class="cls-rule mono">${b.rule}</span></div>
          <div class="cls-drop"></div>
        </div>`).join("")}</div>
      <div class="cls-note"></div>`;

    const pool = host.querySelector(".cls-pool");
    const noteEl = host.querySelector(".cls-note");

    /* fields she can actually read — shown only AFTER filing. Handing them
       over on the card would give away the gap before anyone touches it. */
    function fieldsOf(r) {
      return [
        `interruption: ${r.interruption ? "present" : "absent"}`,
        `consent: ${r.consent ? "given" : "absent"}`,
        `transfer: ${r.completed ? "complete" : "incomplete"}`,
      ].join(" · ");
    }

    function chip(r, box) {
      const bad = box && !BOXES.find(b => b.id === box).fits(r);
      return `<button class="cls-chip${bad ? " malformed" : ""}" data-id="${r.id}">
          <span class="cls-name">${r.name}</span>
          ${box ? `<span class="cls-fields mono">${fieldsOf(r)}</span>` : ""}
          ${bad ? `<span class="cls-flag mono">malformed for this set</span>` : ""}
        </button>`;
    }

    function draw() {
      pool.innerHTML = recs.filter(r => !filed[r.id]).map(r => chip(r, null)).join("")
        || `<div class="cls-empty mono">nothing unfiled</div>`;
      for (const b of BOXES) {
        host.querySelector(`.cls-box[data-box="${b.id}"] .cls-drop`).innerHTML =
          recs.filter(r => filed[r.id] === b.id).map(r => chip(r, b.id)).join("")
          || `<div class="cls-empty mono">empty</div>`;
      }

      const exceptions = recs.filter(r => r.exception);
      const allFiled = exceptions.length && exceptions.every(r => filed[r.id]);
      host.classList.toggle("flagged", allFiled);
      noteEl.innerHTML = allFiled && noteReady
        ? `<span class="mlab">entry ${String(noteEntry.n).padStart(3, "0")}</span>
           <p>${noteEntry.text}</p>`
        : allFiled
          ? `<div class="cls-empty mono">four rows fit neither set. no third field.</div>`
          : "";
      try { localStorage.setItem(KEY, JSON.stringify(filed)); } catch {}
    }

    /* click cycles unfiled → set one → set two → unfiled. Works on touch,
       works from the keyboard, no drag library. */
    host.addEventListener("click", e => {
      const c = e.target.closest(".cls-chip");
      if (!c) return;
      const id = c.dataset.id;
      filed[id] = filed[id] === "one" ? "two" : filed[id] === "two" ? null : "one";
      if (!filed[id]) delete filed[id];
      draw();
    });

    draw();
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
