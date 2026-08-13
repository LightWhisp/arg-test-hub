TEST SUITES
===========
  npm install jsdom playwright
  bash test/run.sh                     # all seven suites, 99 tests

  doors      the door state machine, five states, real WebCrypto
  bench      her key bench — the 4-cycle, swaps, persistence
  audio      the playback bench — normalisation, cues, transport
  catalogue  the index (the number log, the modal, the resolve/glitch,
             gaps, search, the act gate, the DRAFT GATE, her voice rules),
             the order bench, the classification bench
  finale     the two-stage last door, end to end, with real nested
             ciphertexts sealed the same way vault_tool.py seals them
  hidden     reverse-at-speed and the permanent sub-audio unlock
  sealed     encrypted audio end to end — sealed / not-recovered / live,
             and a real door whose real payload carries the track key

  The glitch is checked two ways. The suite asserts the invariant that
  matters — THE NUMBER IS NEVER WRONG ON SCREEN, at open and after settle,
  with MOTION.glitch off, and under reduced motion. The tumble itself needs
  real animation frames, so it is verified in a browser by shot.js, which
  samples the card mid-resolve rather than only once it has settled. A still
  of the settled card tells you nothing about whether the animation fired.

  test/shot.js is NOT part of the suite — it drives a real Chromium over
  `python3 -m http.server 8899` and writes screenshots for a human to look
  at. It also asserts that --rust actually resolves, which is the kind of
  thing jsdom will happily let you ship broken.

Four harness gotchas, all of which cost an hour to find
-------------------------------------------------------
  - window.crypto and window.localStorage are GETTERS in jsdom. Plain
    assignment fails silently and every decrypt then lands in the catch
    block, which looks exactly like a wrong answer.

  - bare jsdom has no canvas or Path2D, so the ambient field needs stubbing.

  - DO NOT go back to sleeping a fixed number of milliseconds after typing
    an answer. Key derivation is deliberately slow and gets slower every
    time we raise the iteration count; a sleep that passes on an idle
    machine drops most of the suite under load, and it fails as "wrong
    answer" rather than as "not finished yet". Await window.__voidIdle
    (attempts in flight) and window.__voidReady (first paint settled).

  - config arrays live in the jsdom realm. assert.deepStrictEqual compares
    prototypes, so wrap them in Array.from before comparing to a local one.
