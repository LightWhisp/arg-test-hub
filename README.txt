THE VOID SITE - deployment and operations
=========================================

WHAT THIS IS
  A single-file static ARG hub. No backend, no accounts, free to host.
  - "the recovered": public archive of solved artifacts + audio fragment slots
  - "the sealed": puzzle-locked lore. Payloads are AES-encrypted under the
    answer, so viewing the page source reveals NOTHING. Wrong answers fail
    cryptographically. Solved doors persist per visitor (localStorage).

DEPLOY (pick one, both free)
  GitHub Pages: new PUBLIC repo -> upload index.html, style.css,
    config.js, script.js + assets/ ->
    Settings > Pages > deploy from branch. (Use a repo name that isn't a spoiler.)
  Neocities: create site -> upload the four files + assets/.

ADDING / REPLACING VAULT ENTRIES
  1. Write the unlock content as an HTML snippet (can include a YouTube
     <iframe> for lore videos - use UNLISTED videos).
  2. python3 vault_tool.py my-entry-id "THE ANSWER" content.html
  3. Paste the printed object into the VAULT list in config.js and add a
     matching prompt in DOOR_TEXT (also in config.js).
  Answers are case-insensitive; only letters count ("the key" == THEKEY).

DEMO ENTRIES SHIPPED (replace both before launch)
  door one   -> answer WITNESS (placeholder riddle + placeholder video slot)
  last door  -> answer is his name (placeholder payload)

AUDIO FRAGMENTS
  Drop mp3s into assets/audio/ named fragment01.mp3 etc. Missing files
  display "not yet recovered" on purpose - unreleased slots are teasers.

SECURITY NOTES - READ THIS
  - The vault resists source-diving, but a SHORT COMMON-WORD answer can be
    brute-forced offline by a determined solver scripting dictionary guesses
    against the blob. Fine for misc lore doors. For THE FINALE, do not rely
    on a single-word key sitting on the site for months: either use a long
    multi-word phrase the community assembles from several puzzles, or
    simply add the finale entry to the site ON reveal day.
  - Never upload to the site or repo: any font files, the codex, proof
    sheets, the toolkit, or this README's sibling scripts. Public repo =
    public files. Assets folder should only ever contain already-published
    material.
  - The page has a base64 comment easter egg in the source and typing
    "i a m" anywhere on the page triggers a whisper. Both are meant to be
    found - source-divers get flavor instead of spoilers.

FILE MAP
  index.html  markup only (page copy lives here)
  style.css   all styling - colors and type tokens at the top
  config.js   ALL CONTENT: fragments, vault entries, door text, glyphs
  script.js   the engine (mist, glyph field, vault crypto) - no need to edit

ATMOSPHERE TUNING (script.js, field section)
  Mist: density scales with screen width; thicken or thin via the
    "0.16 / 0.07" alpha stops in makePuff() or drift speed in spawn().
  Runes: each fades in, drifts 9-23s, fades out, and is reborn elsewhere.
    Lifespan is the "9000 + ... 14000" line in makeGlyph().
  Glow: 16% of runes are scheduled to flare white once mid-life
    ("Math.random() < 0.16"). Raise for more flares, lower for fewer.
  All motion switches off for reduced-motion users (one still frame).

NOTE ON PREVIEWING
  Chat/file-preview tools often strip styles and scripts for safety and
  show bare text. Open index.html in a real browser (with all files in
  one folder) to see the actual site.
