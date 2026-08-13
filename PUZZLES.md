# PUZZLE PLAN — site and integration

---

## The principle: build primitives, author content

Act II runs indefinitely. Every remnant added to the game generates a puzzle. If each one
is bespoke you will burn out by character four and the last six will be spectrograms.

So build **five reusable components**, then author content into them forever. Every puzzle
in the ARG should be an instance of one of these, or a very good reason not to be.

| # | Primitive | Serves | Status |
|---|---|---|---|
| 1 | **The door** — text answer, AES payload | every gated reveal | built |
| 2 | **The bench** — drag items into slots | 1.4b, 2.D, 2.A | to build |
| 3 | **The playback bench** — scrub, reverse, speed, subtitles | every audio puzzle | to build |
| 4 | **The catalogue** — browsable, searchable, gaps visible | cross-reference puzzles | to build |
| 5 | **The transcriber** — click glyphs, get letters | the whole language | to build |

**2, 3 and 5 are one component each, used many times.** The classification bench and the
ordering puzzle are the same drag-into-slots widget with different content. Build it once.

---

## The best idea available to you: the unreliable transcriber

Put a tool on the site that lets people click glyphs and read out letters. It sounds like
it makes the cipher easier. It does two better things:

- **It removes tedium so the thinking is the puzzle.** Nobody learns anything from
  hand-copying 174 glyphs. Let the tool do the copying and make the *reasoning* the work.
- **It is diegetically hers** — the Archivist's working reconstruction of his key.

And here is the turn: **it is built on the corrupted key, so it produces wrong answers.**

Type msg01 into it and you get `M AC NIBIDY`. The tool is broken in exactly the way his key
is broken, because she built it from his key. **Fixing the tool is beat 1.4b.** The bench
and the transcriber are the same screen — repair the mapping, and the transcriber starts
telling the truth.

That is the single highest-value thing on this list. It lowers the skill floor, raises the
ceiling, does narrative work, and turns your Act I premise into a piece of software.

---

## Integration: input in one channel, output in another

The rule that keeps the ARG from collapsing into one website:

> **A puzzle's input and its answer never live on the same surface.**

Not arbitrary friction — it is what makes the thing feel bigger than a page.

```
Discord glyph jigsaw ─────────► opens a site door
        │                              │
        │                              ▼
        │                    payload = key for an audio file
        │                              │
        │                              ▼
        │                    audio contains dead-letter numerals
        │                              │
        │                              ▼
        │                    numerals = a catalogue entry number
        │                              │
        │                              ▼
        │                    that entry carries the next prompt
        ▼
song release page ────────► one glyph ────────► ordering bench ────────► composite key
```

Every link is a different *kind* of work — coordination, then listening, then arithmetic,
then reading. That is the pacing rule made structural rather than aspirational.

---

## The canon, honestly reviewed

There is a standard ARG puzzle vocabulary. Most of it is worth skipping, and the reason is
usually the same: **it rewards owning a tool rather than thinking.**

### Worth taking

| Puzzle | Why it works here |
|---|---|
| **Substitution cipher** | You have a real one with three tiers. This is your engine. |
| **Known-plaintext crib** | Already running — the Dickinson poem against the corrupted key. |
| **Distributed jigsaw** | Your **nulls** make it genuinely unsolvable alone. Very few ARGs can say that. |
| **Reassembly** | Torn/partial documents. Tactile, no tools, works for everyone. |
| **Cross-reference** | Catalogue against message. Rewards reading, which is what you want rewarded. |
| **Hidden page / source-dive** | Cheap garnish. You already have the base64 comment and `iam`. |

### Worth skipping

| Puzzle | Why not |
|---|---|
| **Spectrogram** | The single most expected move in the medium. If you use it, spend it on something low-stakes so the community gets a free win. Never on a gate. |
| **LSB steganography** | Requires specific tools, excludes casual players, payoff is always a URL. |
| **Base64 / hex chains** | Busywork with no narrative content. Decoding into another encoding is not a puzzle. |
| **QR codes** | Anachronistic for Void — he carves, he does not generate machine artifacts. *Could* work for the Archivist, who is a modern programmer, but it will read as a genre tic. |
| **Real-world coordinates** | Global audience. Excludes almost everyone. |
| **Morse** | You have something better — see below. |

---

## What your assets uniquely enable

These are puzzles nobody else can run, because they depend on things you built.

### 1. Dead letters as a trap

J, Q and V are gone as letters but survive as **six, ninety, nine hundred**. So a message
containing dead glyphs is stating a *number*, not a word.

Solvers will try to read them as letters and get nonsense. That frustration **is** the
lesson. Then: `V Q J` = 900 + 90 + 6 = **996**, and 996 is a catalogue entry number.

This is better than Morse because it teaches itself, it is bespoke, and it converts a
lore fact into a mechanic.

### 2. Gaps in her numbering

Her entries run in sixes with holes. Make the holes load-bearing — *which* numbers are
absent is the message. A puzzle that only exists because of the conceit, and it rewards
the person who read the entire catalogue.

### 3. Diffing her corrections

Both versions of a revised entry stay live. The difference between 018 and 042 contains
something neither states alone.

### 4. A broken pattern

The spec says homophone choice must be **random, never patterned** — a pattern is a crib.
So: publish exactly one message where the randomness is broken, and have *her* flag the
anomaly in an entry. The rule is not violated, the rule's *violation* is the clue, and she
finds it before the community does because that is her whole job.

Same trick works with null density and with a message that hits the ~80 cap exactly —
because a capped message is one that got cut short.

### 5. The glyph field

The canvas only ever draws shapes that have already been published. So if a **new** shape
appears in the drift, that is a leak. Not a puzzle — a discovery, and the best kind,
because nothing announces it.

---

## Build order

**Phase 1 — gates the 1.9 site launch**
1. Door state machine — five states, not the current binary open/closed
2. Catalogue entry rendering, numbered with visible gaps
3. `state.json` + the transcribed state
4. Copy voice fixes (`no match in index`, `term`)
5. Retire the demo doors, add `.gitignore`

**Phase 2 — the transcriber/bench**
6. Glyph picker + mapping table, built on the corrupted key
7. Drag-to-slot repair mode → this is 1.4b
8. Same component, re-skinned, becomes the classification bench (2.D) and the ordering
   bench (2.A)

**Phase 3 — audio**
9. Binary encryption in `vault_tool.py`, blob decrypt in-browser
10. Playback bench: scrub, reverse, speed, subtitle toggle

**Phase 4 — before Act IV**
11. PBKDF2 to 600k, fixed-length payload padding
12. Phantom `900` row, contingency mode

---

## Rules

1. **Never encode information in colour alone.** The palette already does semantic work —
   coral for dead/sealed, violet for open — and those two are confusable for a meaningful
   slice of players. Every colour distinction needs a text or shape partner.
2. **Never gate a puzzle behind owning a tool.** If it needs Audacity, put the controls on
   the site. If it needs a hex editor, cut it.
3. **Never gate lore a casual fan needs to enjoy the game.** The vault is depth. Roadmap
   and game info stay public.
4. **Audio gaps must be equitable.** `[unintelligible]` only where hearing players cannot
   make it out either.
5. **The sigil rule is your search-space definition.** State it once publicly and never
   break it: sigil means something is hidden, no sigil means nothing is. It stops the
   community tearing apart innocent posts, which is the failure mode that kills goodwill.
6. **Alternate the kind of work.** Cipher, coordination, tactile, listening, cipher. Two
   deciphers back to back is the failure state.
