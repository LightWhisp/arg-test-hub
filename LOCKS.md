# LOCKS — signed-off decisions

Answers to the open items, with the two that need adjusting flagged. Supersedes the
locks table in `PRODUCTION.md` §0.

---

## L1 · Poem text — **LOCKED**

> I AM NOBODY. WHO ARE YOU? ARE YOU NOBODY TOO? ALAS, THERE IS A PAIR OF US. TELL NO ONE.
> THEY WOULD NOT UNDERSTAND. HOW DREARY, TO BE SOMEBODY. HOW MYSTERIOUS, LIKE A FOG.
> TO TELL THE NAME OF ONE, THE LIFELONG TUNE, TO AN ADMIRING COG.

**The version in the Google Doc could not be rendered** — it carried four apostrophes
(`I'm`, `there's`, `They'd`, `one's`) and two words containing V (`never`, `livelong`),
all forbidden by the codex. The text above is the repaired one and it is what shipped in
the .docx. Audited: 0 apostrophes, no J/Q/V, 174 glyphs, every living letter except X
and Z.

---

## L2 · Scrambled key — **I / O / C / M**, with one fix

### The problem

**C appears exactly once in the poem — in `COG`. And `COG` is itself a corruption**
(Bog → cog). The single place C can be observed is the one place the crib is unreliable:
a solver comparing against real Dickinson expects `BOG`, sees a mismatch, and cannot tell
whether the glyph is wrong or the word is.

| Letter | Occurrences in poem | Recoverable from crib? |
|---|---|---|
| O | 27 | Instantly. Glaring. |
| I | 8 | Easily. |
| M | 5 | Easily. |
| **C** | **1**, inside a corrupted word | **No.** |

### The fix — make it a closed 4-cycle

```
I → O → C → M → I
```

A cycle, not two independent swaps. Once O, I and M fall to the crib, **C is forced by
elimination** — there is nowhere else for it to go. C becomes the last letter to drop and
the only one recovered by reasoning rather than reading, which is a good final beat for
the puzzle rather than a dead end.

*(Two independent swaps — `I↔O`, `C↔M` — also resolves, since M is observable five times.
But the cycle is cleaner and guarantees closure. Do not use a permutation that leaves C in
its own orbit.)*

### The accident worth keeping

**I and M are both in the scramble set. "I AM" is I-A-M.**

Two of the three letters in the phrase that ends the entire ARG are corrupted in the key
he hands out on day one. The first thing he says and the last thing they type is precisely
what his broken key renders unreadable.

---

## L3 · msg02 — **LOCKED, trimmed**

> TO THINK, THERE COULD BE SO MUCH MORE THAN I OUT THERE. I WANT TO SEE MORE.

Audited: no apostrophes, no J/Q/V. **55 glyphs, 25 of headroom for nulls.**

| | |
|---|---|
| Raw letters | 56 |
| TH bindings (THINK, THERE, THAN, THERE) | −4 |
| Runic marks (2 Perthro, 1 Isa) | +3 |
| **Total** | **55** — comfortably inside ~80 |

### This content changes 1.4's framing — for the better

1.4 currently reads *"the real calibration test. He raises the difficulty to find the
ceiling."* That is not what this says. This is a confession.

**The tier should be motivated by the content, not by an experiment.** He does not switch
to the hollow hand to test them. He switches because he has just admitted he wants
something, and that is the most exposed he has ever been. The hand hardens because owning
it costs him.

That also makes the two messages an arc rather than two difficulty steps:

| | Message | Hand | Why |
|---|---|---|---|
| **1.3** | Someone else's poem | Surface | He has no language of his own for the feeling, so he borrows one. Safe to perform. |
| **1.4** | His own words | Hollow | He says the true thing and immediately hides it. |

Revise 1.4's In-universe line accordingly. *Calibration* still holds as the act's theme —
he is learning to be understood — but msg02 is the moment he says more than he meant to.

---

## L4 · Capture order — **Shadow, Cream, Tails**, …

### This constraint is stricter than "before the second song ships"

If each song carries one glyph and the *order* is the puzzle, then song N's glyph is
`key[position of N in capture order]`. To assign the glyph for song one you need:

1. The **final key string**
2. The **total roster length** — or the key has no fixed length

So **both must be locked before song one ships**, not song two. The prefix
(Shadow → Cream → Tails) covers the first three releases once those two things exist.

### Roster — resolved to within one

**Dark Super Sonic and Nazo get songs but no glyphs** — their lore is delivered in-game
instead. So they are out of the ordering puzzle. That leaves:

> Sonic · Amy · Tails · Knuckles · Cream · Sally · Honey · End · Metal Sonic · Dr. Eggman
> **= 10**

**Plus Shadow?** He is a remnant, his capture recording is 1.7, his song drops at 1.9, and
he is stated as first in capture order — but he is not in the 2.x list, because his beat
lives in Act I.

- **Include him → roster 11.** Recommended. The capture order the community derives starts
  with Shadow; if he carries no glyph, that first position is confusing.
- **Exclude him → roster 10.** Defensible — his song ships before 2.A exists, so it acts as
  the template rather than a puzzle piece. Costs you the awkwardness above.

No lore conflict with Shadow first. 2017x already existing at the time of his capture is
consistent, since 2017x is a fiend, not a remnant.

### Proposed key string

Roster length fixes the key length exactly. Both candidates are codex-legal — no
apostrophes, no J/Q/V:

| Roster | Key | Notes |
|---|---|---|
| **11** (with Shadow) | **`IAMNOTALONE`** | *I AM NOT ALONE.* Recommended. |
| 10 (without) | `IAMNOTHING` | *I AM NOTHING.* Also lands the contingency hint. |

**`I AM NOT ALONE` is what msg02 is already about** — *there could be so much more than I
out there* — so the community spends all of Act II assembling, one song at a time, the
sentence he was too exposed to finish in Week 0.

### The spine this creates

Four **I AM** statements, escalating in who supplies them:

1. **I AM NOBODY** — msg01. Borrowed from a dead human poet.
2. *(msg02 — the same thought in his own words, hidden in the hollow hand)*
3. **I AM NOT ALONE** — assembled by the community across every song in Act II.
4. **I AM VOID** — supplied entirely from outside his language. The finale.

He can never finish a sentence about himself. They finish three of them for him.

*(If you take the 10-roster instead, `IAMNOTHING` makes the Act IV contingency hint —
"what am I, if I am nothing?" — a direct callback to something they earned rather than a
fresh riddle. Slightly tighter mechanically, slightly less moving.)*

---

## L5 · X and Z glyphs

**Z — LOCKED.** Already in the codex: three parallel diagonal strokes.

**X — proposed.** The existing codex X is a zigzag, and so is B, and so is the surface
form of E. Three zigzags in one alphabet is a legibility problem at small sizes, which is
presumably why this one came back open.

```
M4,4 L11,16 L4,28   M20,4 L13,16 L20,28
```

Two chevrons facing each other horizontally, meeting at a 2-unit gap. Straight strokes,
one weight, no curves, no rings — codex-legal. Distinct from every existing letter:

- **A** is chevrons stacked *vertically* (^ over v)
- **M** is two chevrons both pointing *down*
- **W** is a single peaked arch
- **C** and **Gebo** are literal crosses
- Nothing else in the alphabet opposes horizontally

Thematically apt: X is one of the two letters the crib cannot teach, and the glyph is a
gap held open from both sides.

---

## L6 · The third class — **she never names it** · LOCKED

---

## L7 · Dev log interruptions — **dev logs one and two** · LOCKED

---

## L8 · Impersonation watermark — sigil + role · LOCKED, with a correction

**The watermark must be the sigil, not his name spelled out.**

His name contains V. V is dead. If the watermark were his name in glyphs it would require
publishing a dead letter, which contradicts the entire finale — the whole point is that
his name *cannot be written in his own script*.

The sigil is a single mark that stands for the name without spelling it. It is already on
msg01 and msg02, already the site favicon, and already the last entry in `GLYPH_PATHS`:

```
M10,0 V12  M14,18 V30  M4,11 L20,19
```

So the watermark already exists and has already been published twice. Nothing to make —
just apply it consistently, and never let anyone render the name letter by letter.

---

## L9 · Archivist filler entries

Numbered in multiples of six, with gaps. Written and assigned so far: **006, 012, 018,
042, 060, 072, 156, 306, 894**. Placeholders below fill the per-remnant loop.

| Entry | Slot | Status |
|---|---|---|
| 024 | first capture recording after the archive is found | filler |
| 030 | — | filler |
| 036 | — | filler |
| 048 | — | filler |
| 054 | — | filler |
| 066 | — | filler |
| 084 | — | filler |
| **090** | **reserved** — ninety is Q, one of the dead letters. Worth spending on a beat rather than a filler. | reserved |
| 102 | — | filler |
| 120 | — | filler |
| 138 | — | filler |
| 180 | — | filler |
| 204 | — | filler |
| 228 | — | filler |
| 252 | — | filler |
| 288 | — | filler |

**Filler template** — keeps her register while the real content is written:

> **entry NNN.** Specimen recovered. Class one. Interruption present at the expected
> position. Marks consistent with prior specimens; no new forms. Filed.
>
> *(placeholder — replace with the capture-specific note for ⟨character⟩)*

Rules for whoever writes the real ones: first person, terse, provisional, never addresses
a reader, never uses the word "Archivist". She writes *I*, not *she*.

---

## L10 · Subtitles — **LOCKED**

A toggle on the site's audio player. Specced in-fiction: subtitles are **her
transcription** of the recording, styled as her notes, not as a caption track.

### One accessibility rule that must not be broken

It is tempting to render Void's under-the-mix voice in act three as degraded, with
`[unintelligible]` gaps — it fits, and it makes the subtitle track a puzzle surface.

**Only do that where hearing players cannot make it out either.** The moment a gap hides
something a hearing player can hear, deaf players are locked out of a puzzle rather than
included in one. Gaps must be equitable, not decorative.

Applies to every capture recording, not just the Act I three.

---

## L11 · Ordering puzzle — **LOCKED**

- **Roster: 11**, Shadow included.
- **Key: `IAMNOTALONE`** — 11 glyphs, one per song, no dead letters.
- Order begins Shadow → Cream → Tails. Remaining 8 positions to assign.

| # | Character | Glyph |
|---|---|---|
| 1 | Shadow | I |
| 2 | Cream | A |
| 3 | Tails | M |
| 4–11 | *to assign* | N O T A L O N E |

Dark Super Sonic and Nazo get songs but **no glyphs and no positions** — their lore is
delivered in-game.

---

## L12 · Archivist voice — **CORRECTED**

Her voice is now derived from *All Multiples Of Six*. She is **Josephine "Pepper" Weber,
a German backend database engineer** — not a naturalist. All entries rewritten in
`ARCHIVIST-LOG.md`.

**This requires a terminology pass across the beat sheet and `BUILD.md`:** *specimen* →
*record*, *genus* → *type*, *taxonomy* → *schema*. And the 894 explanation becomes
*"void being is a type, not an instance"* — which is a sharper version of the same
failure, because filing an identifier as a class name is a mistake programmers make daily.

---

## Still open

- [ ] Assign glyphs 4–11 to the remaining roster
- [ ] Terminology pass — naturalist → systems register, beat sheet and `BUILD.md`
- [ ] Decide on Lord-X marginalia in the archive *(see `ARCHIVIST-LOG.md`)*
- [ ] Assign slots to filler entries 102–288
- [ ] Relabel msg02 on the site *(you have this)*
- [ ] Lock the beat sheet doc to named editors *(you have this)*
