# THE PUBLISHED KEY — beat 1.2

The corrupted partial key Void posts to Discord in Week 0. Spec, not art: every cell is
assigned here, the glyph vectors come from your font.

---

## The thing that makes this beat work

A key has to pair his glyphs with **their** letters. He does not write their letters.
Rule 1 of his conduct is that he never posts text that also exists in English.

So this is **the one time in the entire ARG that Void writes in the audience's alphabet**
— because 1.2's whole premise is that he wants to be understood and is building toward a
more coherent version of himself.

And he gets four of them wrong.

Not as a test. Not as a puzzle he designed. He is working in a script that is not his,
from the outside, and he mislabels four letters the way anyone would writing an unfamiliar
alphabet from memory. The corruption is **an honest mistake by someone learning**, which is
a far better reason than "he scrambled it to find the ceiling."

It also sets up the ending. He writes in their alphabet and gets it wrong. They write his
name in their alphabet and get it right. The first artifact and the last input are the same
gesture, reversed.

---

## Contents

**23 cells.** The three dead letters are absent — J, Q and V are not in the language any
more, so there is nothing to publish. Their absence is the first clue and nobody will read
it as one.

**The bound glyph TH is also absent**, and that is deliberate. It is not a letter, so he
would not list it in a letter key - but it appears seven times in msg01. The community
hits an unlisted glyph and has to work out that one mark carries two sounds. A free second
puzzle inside the first, and the crib makes it solvable.

---

## Order — first appearance in msg01

Not alphabetical, per the beat. He ordered it by the poem, because the poem is where he
learned to want to be read. He wrote it for himself before he ever sent anything.

```
I  A  M  N  O  B  D  Y  W  H  R  E  U  T  L  S  P  F  K  G  C  ·  X  Z
```

**X and Z sit at the end because they never appear in the poem.** The key's own ordering
quietly marks the two letters its crib cannot teach. Leave a visible gap before them.

---

## The scramble — closed 4-cycle

Four cells carry the wrong glyph. The cycle closes, so every letter is recoverable.

| Cell label | Glyph actually placed there | |
|---|---|---|
| **I** | glyph of **O** | wrong |
| **O** | glyph of **C** | wrong |
| **C** | glyph of **M** | wrong |
| **M** | glyph of **I** | wrong |
| all others | their own glyph | correct |

### What that does to a decode

A solver reading msg01 with this key writes **O→I, C→O, M→C, I→M**:

```
true    :  I AM NOBODY. WHO ARE YOU? ARE YOU NOBODY TOO?
decoded :  M AC NIBIDY. WHI ARE YIU? ARE YIU NIBIDY TII?
```

Structured, obviously wrong, obviously *close*. Exactly the right frustration.

Full decoded text of msg01 under the published key:

```
M AC NIBIDY. WHI ARE YIU? ARE YIU NIBIDY TII? ALAS, THERE MS A PAMR IF US.
TELL NI INE. THEY WIULD NIT UNDERSTAND. HIW DREARY, TI BE SICEBIDY. HIW
CYSTERMIUS, LMKE A FIG. TI TELL THE NACE IF INE, THE LMFELING TUNE, TI AN
ADCMRMNG OIG.
```

### Recovery path

| Letter | In crib | How it falls |
|---|---|---|
| O | 27× | Immediately. Unmissable. |
| I | 8× | Easily. |
| M | 5× | Easily. |
| **C** | **1×, inside `COG` — itself a corruption** | **By elimination.** Once O, I and M are placed, the cycle leaves exactly one seat. |

C is the last letter to fall and the only one recovered by reasoning rather than reading.
Note it surfaces in the final word of the poem, as `OIG`.

---

## The X glyph — **FINAL**

```
M4,4 L13,16 L4,28   M11,4 L20,16 L11,28
```

Two chevrons in **parallel**. 24x32 box, matching `glyphs_v2.py`.

### Why the first proposal was scrapped

Before the font package arrived I proposed two chevrons *opposed*, meeting at a two-unit
gap. The real data killed it instantly:

```
proposed X :  M4,4 L11,16 L4,28   M20,4 L13,16 L20,28
actual   C :  M4,4 L12,16 L4,28   M20,4 L12,16 L20,28
```

**That was C with a 2px gap.** Unusable.

### Why parallel works

The surface hand already uses opposed chevrons (C), stem-plus-one-chevron (K, and
Thurisaz among the marks), and three separate zigzags (B, E, and the old X - which is why
X needed redrawing at all). **Parallel chevrons are the one chevron configuration the
alphabet does not use.** Distinct silhouette at message size, no stem to confuse with K or
Thurisaz, codex-legal on strokes.

Fitting for the letter the crib cannot teach: two marks pointing the same way, neither
arriving.

---

## Rendering notes

- **Hand-formed Latin letters.** He is writing an unfamiliar alphabet from memory. Slightly
  uneven, slightly wrong-proportioned, but never cute or childish — he is precise about
  everything else. Straight strokes apply here too; his hand does not know how to curve.
- **No diagonal serifs, no curves anywhere**, including in the Latin.
- The sigil goes bottom-right, as on msg01 and msg02. This is the impersonation watermark.
- Surface hand only. Hollow forms, homophones, nulls and the bound TH never appear.
- Log the seed. Same seed, same output.

---

## Verification — do this before shipping

The single most breakable thing in Act I:

1. Render msg01 from the **true** alphabet.
2. Decode the finished image using the **published** key.
3. Confirm the output matches the block above, character for character.

**Status: PASSING.** `severed-tongue-build/build_assets.py` renders both assets straight
from `glyphs_v2.py` and asserts the decode. Output goes to `severed-tongue-build/out/`,
**outside this repo**, because proofs must never sit in a public folder.
