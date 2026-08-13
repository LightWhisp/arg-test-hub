# PRODUCTION — build order and dependencies

Narrative: `ARG Beat Sheet` (Google Doc, master). Engine spec: `BUILD.md`. This file is
what gets made, in what order, and what blocks what.

---

## 0. The five locks

**Nothing renders, records, or ships until these are signed off.** Each one is cheap to
decide now and expensive to change after Act I is public.

| # | Lock | Blocks | Why it can't wait |
|---|---|---|---|
| **L1** | **Final poem text** | msg01, the whole Act I crib | Audited version in Patch 2. Apostrophe-free, J/Q/V-free. |
| **L2** | **Which letters are scrambled in the published key** | msg01 render | Messages are written in the **true** alphabet; the key he publishes is a **scrambled copy**. Render in the wrong order and the crib doesn't resolve. |
| **L3** | **msg02 content, under 80 glyphs** | msg02 render | Tier 2's defining constraint. Current art is ~200+. |
| **L4** | **Capture order for all remnants** | 2.A, every LMS release | The ordering puzzle is retroactive across every song. Decide before song two. |
| **L5** | **X and Z glyph forms** | alphabet image | The poem crib covers 21 of 23 living letters. X and Z cannot be recovered from it — decide whether that's deliberate. |

### L2 in detail — the crib interlock

This is the mechanism the entire first act runs on, and it is easy to break by accident:

1. Messages are rendered in the **true** surface hand.
2. The key Void publishes is the **same alphabet, scrambled** — some letters swapped.
3. Decoding msg01 with his key yields near-misses, not garbage.
4. The poem is on Google. The community lines up crib against ciphertext and **backs out
   the true key from the errors.**

His two puzzles solve each other. Corrupt the poem too heavily and the crib breaks;
scramble too few letters and there's nothing to solve. **Verify solvability before render
— decode the finished image with the published key and confirm the near-misses are
recoverable.**

---

## 1. Critical path

```
L1 poem lock ─┐
L2 key lock  ─┴─→ msg01 render ─┐
L3 content   ────→ msg02 render ─┤
                                 ├─→ WEEK 0 SHIPS
Act 0 script → VO → mix ─────────┘
                    ▲
              longest lead — start first
```

**Act 0's audio gates the launch.** Void appears in nearly every recording, so that
performer is a hard dependency on the entire ARG, not just Act 0.

---

## 2. Before Week 0

### Assets
- [ ] Act 0 transcript audio — script, VO, mix *(critical path)*
- [ ] Alphabet image — surface letterforms, scrambled per L2
- [ ] msg01 — true surface hand, final poem
- [ ] msg02 — true hollow hand, under 80 glyphs, no spaces, alternating line direction
- [ ] Shadow capture audio *(needed Week 1, start now)*

### Discord
- [ ] Void account created, role assigned, **owner-only grant**
- [ ] **Watermark scheme decided** — every Void image carries the sigil, so impersonation
      is falsifiable from day one. Retrofitting authenticity after a fake derails a
      puzzle is miserable.
- [ ] Channel structure and permissions
- [ ] Posting protocol written down: broadcast only, never a reply or mention, never
      answers a question, never breaks the fourth wall

### Governance
- [ ] Beat sheet locked to named editors — the finale key is in it
- [x] ~~Creator permissions for fan characters~~ — confirmed held

### Explicitly NOT before Week 0
The site does not exist until **1.9**. Nothing on the web build blocks launch.

---

## 3. Site build order

Ordered by what gates what, not by size.

**Phase 1 — required for 1.9 launch**
1. Phantom doors *(engine change — `DOOR_TEXT` entries with no `VAULT` entry)*
2. Catalog entry rendering — second type treatment, numbering with gaps
3. `state.json` fetch + **transcribed** door state
4. Copy voice fixes — `the void does not answer` → `no match in index`, `speak` → `term`
5. Retire demo doors `the-chosen` and `his-name`
6. `.gitignore`

**Phase 2 — required for 1.10**
7. Encrypted audio — binary support in `vault_tool.py`, blob decrypt in browser
8. Nested doors

**Phase 3 — the interactive puzzles**
9. Alphabet repair *(1.4b — cheapest thing on the list, highest weight)*
10. Classification bench *(2.D)*
11. Playback bench — scrub, reverse, speed, filter

**Phase 4 — before Act IV**
12. PBKDF2 → 600k iterations, fixed-length payload padding
13. Phantom `900` row rendered from launch, empty
14. Contingency mode — black background, `I AM ____` placeholder
15. Finale ciphertexts (both keys) — **held offline until reveal day**

---

## 4. Canonical door tree

Supersedes the table in `BUILD.md` §3.

| Door ID | Beat | State at launch | Key source | Payload |
|---|---|---|---|---|
| `the-rules` | 1.8 | held | Jumbled audio puzzle *(Discord)* | Void states the rules |
| `the-invited` | 1.10 | held | Fleetway recording structure | Handshake tape — taken vs. invited |
| `the-taken-<char>` | 2.x | held | LMS release page + lore | Capture recording. **Nested** — each payload carries the next prompt. |
| `the-order` | 2.A | held | Capture order across all songs | Composite → gates 3.2 |
| `the-emptied` | 3.2 | **emptied** | `the-order` payload | **Nothing.** The record was emptied as the letters were. Entry 042 appears in her log separately. Use this state once. |
| `the-unwritten` | 4.2 | **not indexed** | `I AM VOID` — and `VOID` as alias | Entry 900 |

---

## 5. Per-release loop (Act II, forever)

Every remnant added to the game generates the same five artifacts. Build the template
once:

1. LMS song *(dev channel — master stays clean)*
2. Capture fragment on the **release page**, not in the audio
3. Full capture recording, encrypted, staged in `assets/audio/`
4. Sealed door releasing the key to that file
5. One Archivist entry

Staging the encrypted audio early is deliberate: the file is public, downloadable, and
useless. It is a taunt asset.

---

## 6. Risk register

| Risk | Mitigation | Status |
|---|---|---|
| Finale key leaks | Ciphertext not on the site until reveal day | Covered |
| Community never finds `I AM VOID` | Black-screen contingency + `VOID` alias | Covered |
| Void impersonation | Sigil watermark + owner-only role | **Decide pre-launch** |
| Alpha slips, Act II starves | Time-based OR triggers on Acts III/IV | Patch 2 ④ |
| Crib doesn't resolve | Decode the finished render with the published key before shipping | **Verify at L2** |
| Audio puzzles exclude deaf players | Transcript policy for every recording | **Open** |
| Community solves Act I in a day | Impatience dial runs both directions — hold the next drop | Covered |

---

## 7. Hosting

GitHub Pages or Neocities. **Not the laptop** — dynamic IP, uptime, and a public ARG URL
pointing at a home machine is a bad trade for zero benefit.

Repo name must not be a spoiler. `state.json` is one commit per community solve, roughly
six to ten times across the whole ARG.
