# BUILD — the vault site

Production reference for the ARG. Narrative lives in `ARG Beat Sheet.md`; this file is
what has to exist in the repo and what has to change in the engine.

**The site is the [[Archivist]]'s archive, not Void's.** She does not know she has readers.
Nothing on this site addresses the audience.

---

## 0. Build status — what landed in this pass

Against ARG MASTER v2. **99 tests across seven suites** (`bash test/run.sh`).

| §2 item | was | now |
| :-- | :-- | :-- |
| 2.1 Phantom doors | required before launch | **done.** `the-unwritten` draws its ciphertext from `FINALE`, which ships `enabled:false, stage1:null`. Nothing behind it, so nothing to crack. |
| 2.2 Nested doors | needed | **done.** Stage one's plaintext IS stage two's door — `vault_tool.py --nested` seals both, the site opens them sequentially. |
| 2.3 Encrypted audio | needed | **done.** `vault_tool.py --audio` seals a track under a generated key and prints the `<i hidden data-unlocks data-key>` snippet to paste into a door payload. Opening the door makes the track playable, permanently. Sealed `.enc` files sit in `assets/audio` in public, downloadable, useless — taunt assets. |
| 2.4 Hardening | needed | **done.** PBKDF2 600k on everything new (per-entry `iters`, absent = 100k so the two published entries keep opening). Payloads NUL-padded to 2048 so ciphertext length stops leaking. |
| 2.5 Catalog entries | new render target | **done.** `#catalogue` is a NUMBER LOG — the whole ladder, 006…900, most of it dark. Clicking a lit number expands it into a modal carrying the record. Searchable, corrections cross-linked both ways and clickable. |
| 4.2 Two-stage finale | listed in master §9 | **done.** Knock → full blackout → one question, one input. Bare-name alias accepted via a prefix retry, so his name is nowhere in the repo. |
| 1.12 Sub-audio unlocks | listed in master §9 | **done.** Reverse-at-speed is a config-declared, permanent, per-recording unlock. |
| 2.A the order | master §8.4 | **done as a bench.** Eleven seats, click-two-to-swap. No answer, no validation, no config leak. |
| 2.D classification bench | master §9 | **done.** Two boxes, three kinds of specimen, no third field. |

### The act dial

`CFG.ACT` gates every catalogue entry, capture seat and classification record.
Releasing act II is **one number**, not a content edit.

⚠ It is a pacing tool, not a security boundary. Act 3–4 entry bodies are sitting in
`config.js` in the clear, act-gated but readable in devtools. **Before Act II ships,
move those bodies into encrypted `VAULT` payloads and leave `{ n, act }` stubs.**

### The index is a number log

Nothing on the page but her numbering: 150 rungs, and at act I exactly three of
them are lit. Clicking one grows that number into a modal holding the record.

Rendering the whole ladder rather than only what she wrote is the point —
**which entries are absent is data** (§8.5), and a wall of holes says
*found, not given* far better than a list of the four things anyone can
currently read. A held record (act landed, door still shut) is bracketed
`[018]` rather than only recoloured; colour alone is never a state here.

Modal is a real one: `role="dialog"`, `aria-modal`, focus trap, Escape and
scrim close, focus returns to the number that opened it, and a
`prefers-reduced-motion` path that skips the grow.

### The card resolves, it does not fade

A read that finally returned, rendering badly on the way in. Three things run
together and none of them duplicates the DOM:

| | |
| :-- | :-- |
| `cat-tear` | horizontal slices drop out and snap back — `clip-path` on `steps(1,end)`, so it jumps rather than eases |
| `cat-split` | chromatic fringe pulled to zero, in her rust and his violet. A `filter`, so one composited layer and no extra markup |
| `.cat-tear` | one bright band sweeping the card, once, `mix-blend-mode: screen` |
| scanlines | a `::after` texture that only exists while `.glitching` is on |

The entry number tumbles and locks **left to right** in JS and lands last. That
is deliberately not a generic character shuffle — her numbering is the one
thing on this site that carries meaning, so the thing that resolves is the
number.

**Two rails on the scramble, because it writes to the DOM on a timer.** The
element already holds the correct value before the scramble starts, and it
starts on the *next* frame rather than synchronously; a hard timeout forces the
final value whether or not frames ever ran. A backgrounded tab, a cut-short
animation or a harness that stubs `requestAnimationFrame` can never leave a
wrong record number on screen. It caught itself during the build — the first
version scrambled synchronously and the suite immediately showed `entry 584` on
record 024.

The dialog is labelled with `aria-label`, not `aria-labelledby`, so a screen
reader is given the number once and correctly rather than watching it flicker.

`MOTION: { glitch: false }` turns all of it off; `prefers-reduced-motion` turns
it off without touching the config, and the CSS refuses to animate even if the
class arrives some other way. Nobody gets a strobing card.

The position-matching grow from the previous pass is gone — it fought the tear.
The card still scales up from 0.94, so it still expands out of the number.

### Act II entries — ✍ DRAFTS, and they cannot ship by accident

Every §7.5 free slot now has a proposal in her register, plus the nine
double-booked capture slots from §11 issue 4, resolved by **folding** the
capture and its subject into one entry. The two that would not fold moved to
free rungs (Alan → 174).

**All 21 carry `draft: true`.** A test fails if any entry marked draft is
released at the shipping `CFG.ACT` — so bumping the dial to 2 breaks the suite
until each one has been read and either rewritten or had the flag removed.
That is deliberate. Do not loosen the assertion to make the build green.

Two more voice guards run across every entry in the file: no entry may contain
the word *Archivist*, address a reader, or slip into third person (§7.2).
They caught three of my own lines while drafting.

### Also fixed in this pass

- **`--rust` was never defined.** It is referenced eleven times in `style.css` and
  resolved to nothing, so every rule meant to be hers computed to unset. Now
  `#C4453C` per master §9. This was invisible rather than broken, which is worse.
- **The door restore was serial.** Every door derived its key in a queue, so a
  returning visitor waited for the sum of the page. At 600k that is seconds. Concurrent now.
- **The test harnesses raced.** "Type an answer, sleep 150ms, assert" held only on an
  idle machine — under load the original suite dropped 8 of 11 and read as wrong
  answers rather than as a timing bug. `window.__voidIdle` counts attempts in flight;
  the harnesses await it. Deterministic under load now.

### Still to build

1. `state.json` community sync — the file exists, the push loop does not (§10)
2. Move act 2–4 catalogue bodies behind encryption (see the act dial, above)
3. Read the 21 Act II drafts and clear their `draft` flags (§7.5)
4. `.gitignore` for `.DS_Store` and `.vscode/` (§5.5)
5. Copy voice pass (§5.6) — two of the three strings are still in his register
6. Rebuild the three TTFs with the new X (master §3.4)
7. Re-render `msg02` in true hollow hand, under 80 glyphs (§5.1)
8. Decide the door-label mismatch: `the-rules` is labelled *entry 018* and
   `the-emptied` *entry 042*, but §7.3's 018 is the ornamental-marks note and
   §3.2 makes 042 her reaction rather than the door itself. Re-keying means
   re-encrypting, so this is a rename decision, not a code one.

---

## 1. Who owns what on the page

| Element | Owner | Notes |
|---|---|---|
| `h1` — *"you were not brought here. you came."* | **Void** | The only thing on the site he wrote or knows about. |
| The descend arrow | — | The threshold. Below this, he has no awareness. |
| "the recovered" / "the sealed" | Archivist | Section labels are a taxonomy. Already correct. |
| Artifact cards | Archivist | Add catalog numbers. |
| Catalog entries | Archivist | New. Second type treatment. |
| Footer — *"he is not hiding. he is waiting."* | Archivist | Third-person assessment — a conclusion in a report. Already correct. |

Do not rewrite the existing copy. It already reads as hers; it just hadn't been assigned.

---

## 2. Engine changes needed

### 2.1 Phantom doors — **required before launch**

`script.js` currently renders a door only if there's a `VAULT` entry with ciphertext.
The finale door must be **visible from Act I with no ciphertext present**.

- Allow `DOOR_TEXT` keys with no matching `VAULT` entry.
- Render the door, prompt, and status; hide or no-op the input.
- Ship the real `VAULT` entry on reveal day only.

**Why:** `his-name` currently decrypts to placeholder content under the key `VOID`.
That was cracked from a nine-word guess list in about a second. The finale must not
exist on the site until the day it opens.

### 2.2 Nested doors

A payload can contain a complete new sealed door. `vault_tool.py` already encrypts
arbitrary HTML, so this needs only that the vault initialiser be callable on
newly-injected DOM rather than running once at load.

Makes source-diving useless at every depth, and a leaked answer only ever exposes one level.

### 2.3 Encrypted audio

Extend `vault_tool.py` to encrypt binary. On the site, decrypt to a `Blob`,
`URL.createObjectURL`, feed an `<audio>` element.

- Unreleased recordings can then sit publicly in `assets/audio/`, fully downloadable,
  and be useless. Solvers can see the file exists and cannot hear it. **That is a taunt asset.**
- A door payload can carry the key for a specific track — so opening a door makes audio
  playable in "the recovered". This is the mechanic that connects the puzzles to the recordings.

### 2.4 Hardening

- Raise PBKDF2 to **600,000 iterations** on anything load-bearing. ~1s in-browser once;
  ~1s per guess for a scripted dictionary attack.
- **Pad payloads to a fixed length.** Ciphertext size currently leaks answer length and
  content length.
- `FRAGMENTS` needs a **4th slot** — transcript + three Act I recordings.

### 2.5 Catalog entries

New render target. One optional `note` per artifact and a standalone entry list.

- Distinct type treatment and colour from Void's line. Clinical.
- Numbered in multiples of six, **with gaps** — the archive is incomplete because it was
  found, not given.
- Entries can be superseded: an entry may reference and correct an earlier number.
  Her revisions are events; the UI should make a correction legible as a correction.

---

## 3. Door tree

> **Superseded — see `PRODUCTION.md` §4 for the canonical tree.** Kept here for the
> channel-separation principle only: each door's key comes from a **different channel**,
> so no one platform holds the ARG.

Two changes since this table was written:

- `the-emptied` (3.2) opens to **nothing**. The record was emptied exactly as the letters
  were. Entry 042 appears in her log separately, as her reaction to finding it blank.
- `the-unwritten` (4.2) accepts **two keys** — `IAMVOID` and `VOID` as an alias, so the
  black-screen contingency cannot reject a correct answer.

### Retire before launch

- `the-chosen` — demo entry, answer `WITNESS`, placeholder payload
- `his-name` — demo entry, answer `VOID`, placeholder payload. **Replaced by `the-unwritten`.**

---

## 4. Asset manifest

### Audio
| File | Beat | Structure | Status |
|---|---|---|---|
| `fragment01` — the transcript | 0.2 | Lord-X / Void encounter | to record |
| `fragment02` — Shadow | 1.7 | **rupture** — ARK / divergence / hard cut | to record |
| `fragment03` — second disappearance + rules | 1.8 | rupture + statement | subject TBD |
| `fragment04` — Fleetway | 1.10 | **handshake** — no rupture, no cut | to record |
| `the-taken-*` | II | rupture, one per remnant | ongoing |

**Rupture vs. handshake is load-bearing.** Remnant tapes break. Fiend tapes shake hands.
If 1.7 and 1.10 sound structurally identical, the most interesting asymmetry in the
setup is gone. Void's voice appears in act three only, and always *under* the mix.

### Images
| File | Beat | Hand | Status |
|---|---|---|---|
| alphabet key | 1.2 | surface letterforms only | to make |
| `msg01.png` | 1.3 | surface | **done** |
| `msg02.png` | 1.4 | hollow | **needs re-render — see §5** |

---

## 5. Known defects

1. **`msg02` is not in any valid tier.** It uses hollow letterforms *with word spaces*.
   Tier 2 requires no spaces, alternating line direction per row, homophones and nulls
   in play, under ~80 glyphs. Re-render.
2. ~~**`msg02` is labelled "surface hand · read" in `index.html`.**~~ Relabelled to
   *hollow hand · read*. The PNG itself is still the old render — §5.1 stands.
3. ~~**`his-name` ships crackable.**~~ The finale door now has no ciphertext behind it
   until reveal day, and neither key appears anywhere in the repo. See §0.
4. ~~`FRAGMENTS` has 3 slots, the plan needs 4.~~ `RECORDINGS` now has three
   entries and adding a fourth is one object — see §0. `fragment04` ships as a
   worked example of a sealed track with `sealed: null` until you seal it.
5. `.DS_Store` and `.vscode/` are in the repo. Add a `.gitignore`.
6. **Copy voice.** The site is hers, but three strings are in Void's register:
   - `"the void does not answer."` → archival. *no match in index.*
   - placeholder `"speak"` → *term*
   - `"they open for the right word. speak, and press enter."` → rewrite as her note
     on why records are held.
   Keep the atmosphere; shift from mystical to a curator alone with the material too long.
7. Beat sheet wikilink `[[Dark sonic]]` does not resolve — note is `Dark Super Sonic.md`.

---

## 6. Publication rules — do not break these

- **Never** commit: font files, the codex, proof sheets, the toolkit, plaintext of any
  unreleased message. Public repo means public files.
- `assets/` contains **only already-published material** — with the deliberate exception
  of encrypted audio (§2.3), which is safe to stage early because it is useless without a key.
- Only the **surface hand** ever leaves the team. Hollow forms, homophones, nulls and the
  bound glyph `TH` stay internal permanently.
- `GLYPH_PATHS` in `config.js` must only ever contain shapes that have already appeared
  in a published message. It currently satisfies this.
- Void never posts text that also exists in English. Everything from him is a rendered
  image or audio.

---

## 7. Channel separation

Void lives in **Discord**. The Archivist lives on **the site**. They never appear in the
same place — if he could see her material, he would know he was being catalogued, and
he must not.

The **dev channel** (Twitter, mini-logs, roadmap, LMS releases) is the Archivist's hard
boundary — she never appears there. **Void may interrupt a dev log**, per the beat sheet.
Ration it: twice in the whole ARG, ideally over a character announcement, because that
reads as him *claiming* them and it is the one thing that makes the non-ARG audience
look up.

Void constraints that affect every puzzle below: he does not break the fourth wall and
does not address individuals. He knows he will be watched; he does not know by whom. Any
bot response he makes is a **broadcast to the room, never a reply or a mention.**

---

## 8. Puzzle types

**Pacing rule, above all others:** alternate the *kind* of cognitive load. Cipher →
coordination → tactile → listening → cipher. Never ship two deciphers back to back. The
audience does not need easier puzzles, they need different ones.

### 8.1 Discord — presence and people

Anything solvable alone at 3am belongs on the site. Discord gets what needs a crowd.

| Puzzle | Mechanic | Why it can't leak |
|---|---|---|
| **Null jigsaw** | Bot DMs each participant one glyph. Far more glyphs in circulation than the message needs — the extras are **nulls**, which already exist in the tier-2 codex. Server must pool *and* filter. | A screenshot of one glyph is worthless; a screenshot of the pooled board is the solve. |
| **Witness ritual** | Six distinct people say **I AM** in a window → he answers the room. No puzzle skill required. Teaches the six motif long before entry 042 explains it. | Nothing to leak. Participation *is* the solve. |
| **The silence** | He will not speak over noise. The server must hold a channel completely silent for a set duration. Solved by doing nothing, requires total coordination. | Unforgeable. You were there or you weren't. |
| **Call and response** | He plays a rhythm or glyph sequence; the room echoes it back correctly. Non-verbal, zero cipher skill. | — |
| **Timed drop** | Post deletes after 90s. Screenshots will spread — fine, the event is the point. | Rare. Act breaks only. |

### 8.2 Site — patience and reading

| Puzzle | Mechanic |
|---|---|
| **Alphabet repair** ← *build this first* | His key is corrupted and out of order. Drag glyphs into slots; near-miss decodes resolve into words as you fix it. Tactile, no cipher skill, and it *is* the Act I premise made playable. |
| **Classification** ← *the good one* | You are handed specimens and must file them into her classes. Three real classes exist (taken / invited / forced) and her schema has two. Players discover the gap **by hand**, which sets up 894 without a word of exposition. |
| **Numbering gaps** | Entries run in sixes with holes. Which numbers are *absent* is data. A door key derived from the missing entries rewards reading the whole catalogue. |
| **Diffing her corrections** | Both versions of a revised entry stay live. The difference between 018 and 042 contains something neither states. |
| **The playback bench** | Built-in scrub / reverse / speed / filter controls, framed as her equipment. Removes the Audacity skill floor so casual players can do audio puzzles at all. |
| **Dead-letter numerals** | Any number writes in J/Q/V. Uses the one part of the language she can read. |
| **Nested doors / audio chains** | A payload contains the next door, or the key that makes a track audible in "the recovered". |

### 8.3 Cross-channel — the one that enforces separation

**She logs a specimen before he posts it.** An entry appears describing a message that
has not shown up in Discord yet. Days later he posts it, and the community already has
half the decode.

Nothing else sells "she is inside his realm and he hasn't noticed" as economically, and
it is the only puzzle type that structurally cannot be solved from one platform.

---

## 9. Door anatomy

A door is **not a portal. It is a sealed catalogue record.** Everything below follows
from that.

### 9.1 The prompt is never a riddle

A riddle implies someone posing it to you, which breaks *she never addresses the
audience*. The prompt is her note about the item, written to herself, from which the
answer is inferable.

```
entry 894 · held
provenance: recovered, unattributed

Designation outstanding. Index requires a term.
Genus insufficient.

▸ [ term                              ]
```

That tells you exactly what to type and never asks you a question.

### 9.2 The four states

| State | Meaning | Behaviour |
|---|---|---|
| **held** | Sealed. Prompt visible. | Input active. |
| **read** | Open. | Frame and her note **stay**; payload appears below them. An archive does not delete its own metadata when you read it. |
| **transcribed** | Community-open — see §10. | Her working copy is shown instead of the sealed original. |
| **emptied** | Opens to nothing. He removed the contents. | **Use exactly once**, on a door people worked hard for. Ties to the dead letters. It will hurt, which is the point. |
| **not indexed** | The phantom. | Row renders, no record behind it. |

### 9.3 The phantom's number is 900

It sits in the list directly under 894, visible from the day the site launches. An entry
number with nothing behind it. People will stare at that empty row for months without
knowing it is the shape of his name.

---

## 10. Community sync — the catch-up mechanic

**Requirement:** when one person opens a door, everyone else gets the option to skip
ahead to wherever the community has got to.

### 10.1 You do not need a backend

A single static file, fetched on load:

```json
// state.json  — only ever contains ALREADY-SOLVED doors
{
  "updated": "2026-08-12",
  "transcribed": {
    "the-invited": "ANSWER",
    "the-rules":   "ANSWER"
  }
}
```

The site fetches it, and any door listed there but not in the visitor's `localStorage`
renders as **transcribed** with a button. Publishing the answer spoils nothing — the door
is already community knowledge, and offering the skip is the entire feature.

Zero infrastructure. Works on GitHub Pages, Neocities, any static host. Updating it is
one commit, maybe six to ten times across the whole ARG.

### 10.2 The manual push is a feature

Do not automate this. Auto-sync would need a serverless function and a KV store
(Cloudflare Workers free tier, ~30 lines) and it would make the fiction *worse*:

- An instant update is a database. A curated, slightly-delayed update is **a person
  cataloguing**. The lag is her character.
- It hands you an editorial beat — you decide when the community has officially caught up.
- It cannot be griefed.

### 10.3 Frame it in-fiction

Never label it "skip puzzle" — that is a fourth-wall break on her private archive. The
record was **transcribed**. You are choosing to read her working copy rather than crack
the seal yourself.

Optional and recommended: **the transcription carries her marginal notes, including the
wrong ones. Cracking it yourself gives you the clean text.** The skip path gives you the
content but not the truth. Nobody is punished, and solving still pays.

### 10.4 Hosting

**Do not host on your laptop.** Dynamic IP, uptime, and a public ARG URL pointing at your
home machine is a bad trade. GitHub Pages or Neocities, both free, both already in
`README.txt`. Cloudflare Workers free tier if you ever need a dynamic endpoint.

Use a repo name that isn't a spoiler.
