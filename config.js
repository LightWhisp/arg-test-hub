/* ============================================================
   the void — config.js  (EDIT THIS FILE — all content lives here)

   ONE DIAL RUNS THE ARCHIVE: CFG.ACT below.
   Every catalogue entry, capture slot and classification record carries
   an `act`. Nothing with act > CFG.ACT renders. Advancing the ARG is a
   single number change, not a content edit.

   ⚠ SPOILER CAVEAT — read before Act II ships.
   config.js is served in the clear. Entry text for acts 3 and 4 is sitting
   in this file below, act-gated but readable by anyone who opens devtools.
   The act gate is a PACING tool, not a security boundary — the crypto doors
   are the security boundary. Before Act II goes live, move the act 3/4
   entry bodies into encrypted VAULT payloads (vault_tool.py) and leave only
   `{ n, act }` stubs here. Tracked in BUILD.md → "still to build".
   ============================================================ */
window.VOID_CONFIG = {

  /* ------------------------------------------------------------------
     THE ACT DIAL — 0 · I · II · III · IV
     ------------------------------------------------------------------ */
  ACT: 1,

  /* ------------------------------------------------------------------
     MOTION. The index modal does not fade in — it resolves, badly, the way
     a read that finally returned would render: slices drop out, the colour
     channels come apart into rust and violet, a band sweeps the card, and
     the entry number tumbles and locks last.

     glitch:false turns all of it off and leaves a plain, instant card.
     prefers-reduced-motion already turns it off without touching this.
     ------------------------------------------------------------------ */
  MOTION: { glitch: true },

  /* §10 open item — Lord-X marginalia, in or out. Built, wired, and OFF.
     Flip to true and any catalogue entry carrying a `margin` renders it.
     Worded any more helpfully than it is, it hands over the finale: it must
     read as amusement, never as a hint, and it must land AFTER she has
     transmitted. He is not Void, so this does not touch the two-channel
     separation — but it is the one thing on this site that is not her. */
  MARGINS: false,

  /* ------------------------------------------------------------------
     RECORDINGS — drop an mp3 in assets/audio/, add one object here. Done.
     A missing file shows "not yet recovered" on purpose: unreleased slots
     are teasers, and encrypted files can sit here publicly and be useless.

       structure : "rupture" (a remnant, taken) | "handshake" (a fiend, invited)
       cues      : subtitles. t is seconds. Gaps ONLY where a hearing player
                   cannot make it out either.
       hidden    : reverse-at-speed find (beat 1.12). Once the player holds
                   the stated rate + direction past `after` seconds, the
                   sub-audio unlocks PERMANENTLY — localStorage, survives
                   reload, survives them forgetting how they did it.
                   Reverse-at-speed is a first-class mechanic, not a one-off.
     ------------------------------------------------------------------ */
  RECORDINGS: [
    {
      id: "fragment02",
      label: "fragment 02",
      title: "the first taken",
      file: "assets/audio/fragment02.mp3",
      structure: "rupture",
      cues: [
        { t: 0.0,  text: "[ the ark. a console, ticking over ]" },
        { t: 6.9,  text: "[ something climbs and does not stop ]" },
        { t: 10.1, text: "[ hard cut — degraded ]" },
        { t: 11.5, text: "[ under the noise, something breathing on a slow tide ]" },
      ],
    },
    {
      id: "fragment03",
      label: "fragment 03",
      title: "?",
      file: "assets/audio/fragment03.mp3",
      structure: "rupture",
      /* beat 1.12 — hidden behind the Tails capture. Reverse at 0.5×.
         Drop the sub-audio file in and it becomes permanently listed
         under this recording the moment someone finds it. */
      hidden: {
        id: "fragment03-sub",
        rate: 0.5,
        reverse: true,
        after: 4,                       // seconds held in that state
        label: "sub-audio · recovered",
        title: "his selection process",
        file: "assets/audio/fragment03-sub.mp3",
        note: "He overrode the vessel and kept the shape. This is the first" +
              " time he is engineering it rather than collecting it.",
      },
    },
    /* A SEALED RECORDING (§2.3). The .enc sits here in public, fully
       downloadable, and useless — solvers can see the file exists and
       cannot hear it. That is a taunt asset.

       The key is never typed. It travels inside a door payload:
         python3 vault_tool.py --audio fragment04 raw.mp3 assets/audio/fragment04.enc
       prints this `sealed` block AND an <i hidden data-unlocks data-key>
       snippet. Paste the snippet into the door's HTML, then seal the door.
       Opening the door makes the track playable, permanently.

       Renders as "sealed" until then — a different state from "not yet
       recovered", which means there is no file at all. Solvers are
       entitled to tell those apart. */
    {
      id: "fragment04",
      label: "fragment 04",
      title: "?",
      file: "assets/audio/fragment04.enc",
      structure: "handshake",
      sealed: null,     // ← paste the printed { salt, iv, iters } here
    },
  ],

  /* ------------------------------------------------------------------
     VAULT — ciphertexts. `iters` is optional and defaults to 100000 so
     the two original entries keep opening. Everything authored from here
     on ships at 600000 (see vault_tool.py --iters).
     ------------------------------------------------------------------ */
  VAULT: [
      {
          "id": "the-rules",
          "salt": "/ZETlZPmzOx5KW0iqpLDSQ==",
          "iv": "zG8+OOly+9xFexO3",
          "ct": "NDHiEdh0l8SLpg2MJDUzQOHOFSWzNBuXMk/RC22ZndxE/eBt02L4WeH6ZpDXQX4fn63umNE0z50NScrVgXqVe76Rxd/12AcVojfD3U8RV2TkCQZdHtb2qjs9+RP2ecI0lEcUnSI5u63Yf+GZone9EHcavJN6tGWIomM1OSiLL27bye4undIqJcr6sGgMycVPqdijdpREwAQrx2uzOnrdiP7lcWrti4fDnOnGmac/lx5GWxik7nwUWFJAzmb7InrOLjKD3LVZVYH3BhcKaBRLHKDbaDr0YVG/uB2AUiGA+waqu+iclXV7/7JCd0qkKshCmhGN2s06u2XjVFIrMSrY7wTJWck5DUG1h4+17HyzicMktCexVewuej8msk8migJe50HXxkQSuPUxd0PrB+bd6DqjeBrIj8srUaalJoi6YMGPpY9PQElN6JDRrh1n5jz14/sw6074GY+LeyJ4b1dcmeyDaYUglAkf1LSDWNS/MbAckFSLKIUxYaEMnfvUOVgWnd+sQHSep5RtLt4Hkrm0eymyQoDfTOyK6XNjm0PKtfENOhEx+9xmkaD3iKRdwq9VEX9dsDbrIvtY7Fauv51Vwqy7iMINS0BzzQBLSx/KCNBmEPk8XlawVBqD"
      },
      {
          "id": "the-emptied",
          "salt": "rCwPtNmXaB63KxLJOYuTAA==",
          "iv": "o1XZU1vIAfPgsFHj",
          "ct": "Hws7rH+SNurefWuuEREJzb0hS05YJAWBNczqnKwKFTYtpxw="
      }
  ],

  /* ------------------------------------------------------------------
     DOORS — order here is the order on the page.
     A door with no matching VAULT entry renders as "not indexed":
     the record number exists, nothing sits behind it.

     `reveals` names a catalogue entry that surfaces when this door opens.
     Cross-channel by design (§8.3): the door's answer comes from
     somewhere else, and opening it is what indexes her record.
     ------------------------------------------------------------------ */
  DOOR_TEXT: {
    "the-rules": {
      label: "entry 018",
      provenance: "recovered, unattributed",
      prompt: "Second specimen states terms. I can read the terms. I cannot read who they are for.",
      reveals: 18,
    },
    "the-emptied": {
      label: "entry 042",
      provenance: "recovered · transfer complete",
      prompt: "Three marks recur and none of them take sound. The record they point to is indexed. Speak what they are worth.",
      reveals: 42,
    },
    /* THE PHANTOM DOOR — visible from Act I, labelled, taunting, and
       uncrackable because there is nothing behind it. FINALE below stays
       disabled and empty until reveal day. Do not put a ciphertext here. */
    "the-unwritten": {
      label: "entry 900",
      provenance: "",
      prompt: "",
      status: "not indexed",
      finale: true,
    },
  },

  /* ------------------------------------------------------------------
     THE LAST DOOR — §4.2, two stages.

     Stage one is a RITUAL, not a gate: I AM NOBODY, the decoded first line
     of msg01, public since week 0. It proves you were present.
     On success the entire site goes black and one question remains.

     Stage two is the only input in the project that comes from OUTSIDE his
     language. V is dead; his name cannot be written in his own script.
     VOID ships as an accepted alias so a correct answer can never be
     rejected on a technicality.

     IMPLEMENTATION: nested. Stage one's decrypted payload IS stage two's
     door — two ciphertexts, one record, sequential. Neither exists in this
     config until reveal day. `enabled: false` renders the phantom.

     To arm it, on reveal day and not before:
       python3 vault_tool.py --nested the-unwritten \
           "<stage one key>" stage1.html "<stage two key>" stage2.html
     paste the printed object into `stage1`, and set enabled: true.

     Both keys are in §1 and §4.2 of the master document and NEITHER of them
     is written down here. Stage two's key is his name. Writing it in a file
     the audience can read would hand over the ending — and it contains V,
     so writing it at all in his own script would contradict the finale.
     ------------------------------------------------------------------ */
  FINALE: {
    enabled: false,
    prompt: "what am I, truly?",
    /* The bare name ships as an accepted alias so a correct answer can never
       be rejected on a technicality — WITHOUT that answer appearing in this
       file in any form. Every stage-two attempt is tried twice: as typed,
       and with this prefix in front of it. Someone who types only the name
       gets the full sentence tried for them and never knows it happened.
       The prefix alone is already public — msg01, and the easter egg — so
       it gives away nothing that week 0 did not. */
    aliasPrefix: "IAM",
    /* stage1: { salt, iv, ct, iters }  — absent until reveal day.
       Its plaintext is JSON: { "html": "...", "next": { salt, iv, ct, iters } } */
    stage1: null,
    /* contingency (§4.2): if stage two stalls, put a line here. The black
       screen is the design, so the fallback is only ever more words. */
    hint: "",
  },

  /* ------------------------------------------------------------------
     THE CATALOGUE — primitive 4.
     Browsable, searchable, gaps visible. Her numbering runs in multiples
     of six with holes in it; which entries are ABSENT is data (§8.5).

       n         : entry number. Always a multiple of six.
       act       : renders only when act <= CFG.ACT.
       gated     : optional door id. The number shows; the body does not
                   surface until that door is open.
       corrects  : entry number this one overturns. Rendered both ways —
                   diffing her corrections is a puzzle (§8.5).
       margin    : Lord-X, in her head. Off unless authored. Must read as
                   amusement, never as a hint, and must land AFTER she has
                   transmitted (§7.4).
       secret    : true = never listed. Surfaces only on an exact-number
                   search. This is how the dead-letter trap pays off.

     VOICE RULES when you author more (§7.2): terse, first person, one
     sardonic beat maximum, never the word "Archivist", never "she", never
     addresses a reader, wrong with total confidence when wrong. Her
     register is database, not natural history: record · row · field ·
     column · schema · type · instance · index · query · transfer ·
     integrity · corruption · permissions · orphaned · malformed · null.
     ------------------------------------------------------------------ */
  CATALOGUE: [
    { n: 6, act: 1, text:
      "He is still publishing. The second one is materially harder than the first" +
      " and I cannot yet tell whether that is escalation or decay. Insufficient" +
      " sample. I hate insufficient sample. Filed pending recovery." },

    { n: 12, act: 1, correctedBy: 60, text:
      "The recovered material splits in two. One set shows an interruption at the" +
      " point of acquisition. The other does not. Working read: the second set are" +
      " failed pulls — transfers that did not complete cleanly." },

    { n: 18, act: 3, gated: "the-rules", correctedBy: 42, text:
      "Three marks recur across everything I have pulled and none of them take" +
      " sound. No phonetic function I can isolate. Provisionally ornamental." },

    { n: 24, act: 1, text:
      "Four cells were transposed. Not encrypted — <i>mistaken</i>. He was writing" +
      " in an alphabet that is not his and he got four of them wrong, which is a" +
      " thing I did not think he could do. Filing the corrected table. Leaving the" +
      " original beside it." },

    { n: 30, act: 2, text:
      "Working hypothesis on acquisition. The records do not come from one place." +
      " I have three source categories so far and they do not behave alike — some" +
      " run a single populated world, some run two that know about each other, some" +
      " run everything folded into one. Extraction looks cheapest from the isolated" +
      " ones. Nobody notices a missing row in a table nobody queries. Unverified." +
      " Writing it down so I stop rederiving it at four in the morning." },

    { n: 36, act: 2, text:
      "The distortions are not damage. I went looking for a fault and found a" +
      " structure — the space is held in tension by something filamentous, and the" +
      " filaments carry load. X's realm is held together the same way, except his is" +
      " code, and I can read code. This is not code. It is doing the identical job" +
      " with a different substrate and I have no schema for it." +
      " <i>Das gefällt mir überhaupt nicht.</i>" },

    { n: 42, act: 3, gated: "the-emptied", corrects: 18, text:
      "Correction to 018. Not ornament. They carry value — six, ninety, nine" +
      " hundred — and they carry nothing else. They were not left out of the" +
      " language. They were <b>emptied</b>. Someone went in, cleared the field," +
      " and kept the key." },

    { n: 48, act: 2, text:
      "Something new is in the plane. It did not walk in — it arrived already" +
      " placed, and it arrived with a building attached, which I would like to note" +
      " is not how anything works. A shopfront. Fully instanced, stock and all." +
      " He is furnishing. I do not know what I expected." },

    { n: 54, act: 2, tag: "personal", text:
      "An aside, and I will only write it once. Every one of these things had a" +
      " fandom. I have seen the merchandise. Where I come from they are drawings" +
      " — licensed, mass-produced, sold in packs at a till — and here they bleed," +
      " and remember, and are afraid of him. I do not have a framework for that and" +
      " I am not building one tonight. Filing it under personal and moving on." },

    { n: 60, act: 2, corrects: 12, correctedBy: 156, text:
      "Correction to 012. The second set are not failed pulls. The second set" +
      " <b>agreed</b>. The difference is not integrity of transfer, it is consent" +
      " — which means I have spent two months reading a permissions problem as a" +
      " corruption problem. He is not only taking. He is curating." },

    { n: 72, act: 2, text:
      "The record filed as fox is not only fox. There is a vessel underneath it," +
      " and the vessel is not his work — the construction is someone else's, and I" +
      " have seen that hand exactly once before, in an unrelated set. Two people" +
      " have written to this object. Only one of them knows it." },

    { n: 90, act: 2, text:
      "Count of recovered fragments stands at ninety. I notice I have been numbering" +
      " in sixes since the first file I ever opened, which was called misc_backup_6," +
      " and that I have never once chosen to stop. Habit, probably. Structure is" +
      " comfortable. Ninety is a good round number. Moving on." },

    { n: 156, act: 2, corrects: 60, text:
      "Correction to 060. Four records fit neither set. Interruption present," +
      " consent absent, transfer completed anyway. That is a third case and I am" +
      " aware it is a third case. I am not opening a third field. Two have held for" +
      " every row I have pulled, and a schema that grows a new column every time it" +
      " meets something awkward is not a schema, it is a landfill. Filed under set" +
      " one. Provisionally.",
      addendum:
      "I am pulling things that were not meant to be pulled. There is a region out" +
      " there only partly built — geometry with nothing behind it, a map that" +
      " simply stops. I do not think he knows I have it. I do not think he has" +
      " looked at it himself in a long time." },

    { n: 894, act: 4, text:
      "Inventory of the emptied marks is complete. Designation still unresolved. I" +
      " have him filed under type: void being. It has held for every record I have" +
      " pulled. I am aware it is a type with exactly one member. I am aware that is" +
      " unusual. I have decided I do not care — there is no second instance to" +
      " distinguish him from, so a more specific field would be an empty column" +
      " forever. Closing the query. Transmitting to X.",
      /* §7.4 — he was there. He asked the question in Act 0 and got
         "I am….I am." He has always known, and lets her close the file. */
      margin: "Ｔｈａｔ ｉｓ ｎｏｔ ｈｉｓ ｔｙｐｅ， Ｐｅｐｐｅｒ．" },

    /* ==================================================================
       ACT II — ✍ DRAFTS. Every entry below carries `draft: true`.

       These are proposals in her register, not your words. A test in
       test/catalogue.test.js FAILS if any entry with `draft: true` is
       released at the shipping ACT — so bumping CFG.ACT to 2 will break
       the suite until you have read each one and either rewritten it or
       deleted the flag. That is deliberate. Nothing here ships by accident.

       §11 issue 4 — the nine double-booked slots — is resolved by FOLDING:
       a capture record and its §7.5 subject become one entry. The two that
       would not fold were moved to free rungs instead (Alan → 174).

       Capture entries obey §7.6: none of them dates itself, sequences
       itself, or refers to another capture as earlier or later. Her
       chronology and the capture order agree in exactly one place and it
       is not any of these.
       ================================================================== */

    /* 066 — Metal Sonic capture, folded with §7.5 "Void's realm structure" */
    { n: 66, act: 2, draft: true, text:
      "Record recovered. Set one. Interruption at the expected position." +
      " Noting the source geometry while I have it open: X's realm is a build" +
      " with a build system behind it. This is a build with nothing behind it." +
      " Rooms open onto rooms that were not there when I started the query. I" +
      " have stopped drawing the map and started drawing the diffs. The subject" +
      " of this row was machined somewhere clean and precise and then filed" +
      " here, which is like putting a calibrated part in a drawer of wet sand." },

    /* 078 — END capture */
    { n: 78, act: 2, draft: true, text:
      "Record recovered. Set one. Interruption present and unusually long — the" +
      " transfer sat open. Most of what came through is not the subject at all," +
      " it is the other voice talking, at length, to something that had been" +
      " suffering on a loop long enough that the loop was the only structure" +
      " left in the row. I have no field for duration of prior state. I am not" +
      " adding one." },

    /* 084 — Dr. Eggman capture. §7.5's Alan subject moved to 174. */
    { n: 84, act: 2, draft: true, text:
      "Record recovered. Set one. Interruption at the expected position. Second" +
      " row I hold whose source environment carries the same signature as" +
      " another in this set — same physics, same lighting model, same broken" +
      " collision on the same surface. Two subjects pulled out of one place. He" +
      " is not sampling widely. He is shopping." },

    /* 096 — Tails capture, folded with §7.5 "the entity is juvenile" */
    { n: 96, act: 2, draft: true, text:
      "Record recovered. Set one. Interruption at the expected position." +
      " Terrain note, since it keeps costing me re-pulls: nothing out here holds" +
      " still long enough to be surveyed. New environments arrive half-specified" +
      " and then get revised, repeatedly, in the direction of whatever was most" +
      " recently added. That is not the behaviour of something ancient. That is" +
      " the behaviour of something young with a very large budget." },

    /* 102 — Honey capture. ✍ filler; give it a detail of your own. */
    { n: 102, act: 2, draft: true, text:
      "Record recovered. Set one. Interruption at the expected position. Marks" +
      " consistent with prior rows; no new forms. The source environment is the" +
      " tidiest I have indexed — bounded, finite, and built to be looked at." +
      " Filed." },

    /* 108 — §7.5: first sight of the unfinished region */
    { n: 108, act: 2, draft: true, text:
      "Something out here is not finished. Geometry with nothing behind it —" +
      " surfaces that render and do not resolve, a map that stops rather than" +
      " ends. No error, no corruption flag, no partial write. It was simply" +
      " never completed and never cleaned up. I have worked for people who left" +
      " things like this behind. I did not expect to find one inside a person." },

    /* 114 — Amy capture. ✍ filler. */
    { n: 114, act: 2, draft: true, text:
      "Record recovered. Set one. Interruption at the expected position. Marks" +
      " consistent with prior rows; no new forms. Unusually complete for a" +
      " set-one pull — almost nothing was lost on the way across, which I have" +
      " logged and have no explanation for. Filed." },

    /* 120 — Sally capture. ✍ filler. */
    { n: 120, act: 2, draft: true, text:
      "Record recovered. Set one. Interruption at the expected position. Marks" +
      " consistent with prior rows; no new forms. Filed." },

    /* 126 — §7.5: the message where the randomness is patterned.
       ✍ ONLY IF you run the broken-pattern puzzle (§8.5). Delete otherwise. */
    { n: 126, act: 2, draft: true, text:
      "The variation in the marks is not variation. I ran the distribution on" +
      " the last set and it repeats on a fixed interval, which random does not" +
      " do and which every other set I hold does not do. Either the process" +
      " slipped or somebody wanted a row that could be counted. Flagged. Not" +
      " filed." },

    /* 132 · 138 · 144 · 150 — the four that fit neither class.
       She is visibly avoiding the conclusion, and 156 is her refusing to
       open a third field. Do not let any of these say the word "class". */
    { n: 132, act: 2, draft: true, text:
      "Record recovered. Interruption present. Consent absent. Transfer" +
      " completed anyway. That is not set one and it is not set two. Re-pulled" +
      " it twice in case I had a bad read. I did not have a bad read. Filed" +
      " under set one pending a better idea." },

    { n: 138, act: 2, draft: true, text:
      "Second row with that shape. Interruption, no consent, clean completion." +
      " This one does not stand alone either — it came across attached to" +
      " another record rather than on its own, which is new, and which I also" +
      " have no field for. Set one. Pending." },

    { n: 144, act: 2, draft: true, text:
      "Third. Interruption, no consent, completed. I have now written" +
      " <i>pending</i> three times, and pending is not a state. It is what I" +
      " write when I do not want to open a column. Noted. Still set one." },

    { n: 150, act: 2, draft: true, text:
      "Fourth. Same shape, same fields. I am aware of the count. I have" +
      " re-verified both existing sets against every row I hold and both still" +
      " hold, which is a thorough answer to a question I did not ask. Filed." +
      " Set one." },

    /* 162 — Cream capture. ✍ filler. */
    { n: 162, act: 2, draft: true, text:
      "Record recovered. Set one. Interruption at the expected position. Marks" +
      " consistent with prior rows; no new forms. Filed." },

    /* 174 — §7.5's 084 subject, moved here so 084 can be a capture (§11.4).
       Alan: a vessel in X's world, against the one the fox personality
       currently occupies. Same hand, same schema, different values. */
    { n: 174, act: 2, draft: true, text:
      "Two vessels in X's set, same construction, same hand. One currently" +
      " carries the personality my fox row carries. The other — logged as Alan" +
      " — is that same personality with the limiters absent: every capability," +
      " none of the restraint that makes it tolerable to be near. Same schema," +
      " different values, and the difference is the entire character. I have" +
      " filed them adjacent and I would like it noted that I did not enjoy it." },

    /* 180 — Knuckles capture. Callback to 072 without ordering anything. */
    { n: 180, act: 2, draft: true, text:
      "Record recovered. Set one. Interruption at the expected position. Another" +
      " row with construction underneath it that is not his — different hand" +
      " from the one on the fox, cruder, load-bearing anyway. Two people have" +
      " written to this object as well. Filed." },

    /* 204 — Shadow capture. §7.6: taken first, catalogued tenth. This entry
       must be the THINNEST in the archive. The audience heard this recording
       in the very first drop; nothing sells "found, not given" harder than
       the file being most ignorant about the thing they saw first. */
    { n: 204, act: 2, draft: true, text:
      "Record recovered. Set one. Interruption at the expected position. Late" +
      " pull — this has been sitting in a partition I could not address and I" +
      " only reached it because an index rebuilt itself. Marks consistent with" +
      " prior rows; no new forms. Nothing here I have not already written down" +
      " somewhere else. Filed." },

    /* 228 — §7.5: material she can see and cannot pull */
    { n: 228, act: 2, draft: true, text:
      "There is material I can see and cannot pull. The rows resolve in the" +
      " index and return nothing on read — not empty, not malformed, not" +
      " permission denied. They return the way a row returns when the storage" +
      " under it is gone and the pointer is not. Whatever holds this place" +
      " together is not holding all of it." },

    /* 252 — Sonic capture, folded with §7.5 "X tasks her to stay".
       §7.6: Sonic is taken last and catalogued last — the one place her
       chronology and the capture order agree, and the only piece the
       audience cannot place until the end. */
    { n: 252, act: 2, draft: true, text:
      "Record recovered. Set one. Interruption at the expected position and the" +
      " longest I have logged. Whatever this row is, it did not come away" +
      " cleanly and I do not think it was ever going to.",
      addendum:
      "X has asked me to stay. Not to finish and report — to remain, here," +
      " indefinitely, as a monitor, until he is ready to come back. I am to" +
      " live in the same room as the material and understand it, which is a" +
      " thing asked of a resident, not of an engineer. I said yes before" +
      " I had finished reading the message. I will think about why later." },

    /* 288 — §7.5: last entry before the dead letters surface */
    { n: 288, act: 2, draft: true, text:
      "The place has been moving more. Not reshaping — I have watched it reshape" +
      " long enough to know the difference. Moving. Load shifting somewhere I" +
      " cannot instrument. Everything I have logged this month is consistent" +
      " with a system under a change it did not schedule. I would like to state" +
      " for the record that I have no evidence for that sentence." },

    /* 306 — §7.5 LOAD-BEARING, and §3.4. He explains himself; she gets the
       mechanism and misses the personal cost entirely. The miss is the last
       line: she files an act of self-mutilation under architecture. */
    { n: 306, act: 3, draft: true, text:
      "Recovered him explaining it, which I did not think he did. A language" +
      " that can express everything its author already knows is closed, and a" +
      " closed system cannot surprise its author. So he removed capacity from" +
      " it on purpose — the same reason the energy is left lying where the rows" +
      " can reach it. Introduce slack, get behaviour nobody specified. It is" +
      " a sound decision. I have made the same one, in smaller ways, on systems" +
      " I was tired of predicting. Mechanism understood. Filing it under" +
      " architecture." },

    /* ---- the dead-letter trap (§8.5) ------------------------------------
       J Q V are gone as letters and survive as 6 · 90 · 900. A message
       carrying dead glyphs is stating a NUMBER. Solvers will read them as
       letters, get nonsense, and that frustration is the lesson.
       V Q J = 996. Unlisted. Only an exact search for 996 finds it. ---- */
    /* ✍ AUTHOR ME — and note what this slot actually is. She stopped at 894
       and never wrote 900. 996 is past the end of her file, in her format and
       her numbering, and she did not write it either. Keep it short. Keep it
       cold. Do not explain the joke.
       Act 3: nothing should reach this until the dead letters surface, because
       until then there is no message carrying dead glyphs to misread. */
    { n: 996, act: 3, secret: true, draft: true, text:
      "Record recovered. Provenance unresolved. Not my hand." },
  ],

  /* the ladder her numbering runs on. Anything on it with no CATALOGUE
     entry renders as a visible hole. Which entries are absent is data. */
  CATALOGUE_LADDER: { step: 6, from: 6, to: 900 },

  /* ------------------------------------------------------------------
     2.A — THE ORDER. Eleven remnants, one glyph each, arranged by hand.

     THE ANSWER IS NOT IN THIS FILE AND MUST NEVER BE. The order is
     derivable from lore, not from the page source and not from audio
     tools — that is the entire point of the puzzle. The bench renders
     the letters you have formed and says nothing about whether they are
     right. The passage getting closer to sense is the only feedback,
     exactly as on the key bench.

     Listed alphabetically. Glyphs are public: each one ships on its own
     song's release page. `act` gates the slot; unreleased characters
     render as "not yet recovered" teasers.
     ------------------------------------------------------------------ */
  CAPTURE: [
    { id: "amy",     name: "Amy",         glyph: "T", act: 2 },
    { id: "cream",   name: "Cream",       glyph: "A", act: 2 },
    { id: "eggman",  name: "Dr. Eggman",  glyph: "L", act: 2 },
    { id: "end",     name: "END",         glyph: "M", act: 2 },
    { id: "honey",   name: "Honey",       glyph: "O", act: 2 },
    { id: "knuckles",name: "Knuckles",    glyph: "O", act: 2 },
    { id: "metal",   name: "Metal Sonic", glyph: "A", act: 2 },
    { id: "sally",   name: "Sally",       glyph: "N", act: 2 },
    { id: "shadow",  name: "Shadow",      glyph: "I", act: 1 },
    { id: "sonic",   name: "Sonic",       glyph: "E", act: 2 },
    { id: "tails",   name: "Tails",       glyph: "N", act: 1 },
  ],

  /* ------------------------------------------------------------------
     2.D — THE CLASSIFICATION BENCH. Her filing interface.
     TWO BOXES, THREE KINDS OF SPECIMEN. Players discover the gap with
     their hands, weeks before entry 156 admits it.

     Each record carries two fields she can actually read:
       interruption : was the transfer interrupted at acquisition
       consent      : did the row agree to be moved

     set one = interrupted.  set two = agreed.
     The four exceptions are interruption present, consent ABSENT,
     transfer completed anyway. There is no box for that and the bench
     does not add one — it flags the row and files it under set one,
     because that is what she does.
     ------------------------------------------------------------------ */
  CLASSIFY: [
    /* set one — interrupted, did not agree, did not complete cleanly */
    { id: "shadow",   name: "Shadow",      interruption: true,  consent: false, completed: false, act: 1 },
    { id: "tails",    name: "Tails",       interruption: true,  consent: false, completed: false, act: 1 },
    { id: "cream",    name: "Cream",       interruption: true,  consent: false, completed: false, act: 2 },
    { id: "end",      name: "END",         interruption: true,  consent: false, completed: false, act: 2 },
    /* set two — no interruption, agreed, completed */
    { id: "fleetway", name: "Super Sonic", interruption: false, consent: true,  completed: true,  act: 1 },
    { id: "goodfut",  name: "Good Future", interruption: false, consent: true,  completed: true,  act: 2 },
    { id: "crimson",  name: "Crimson X",   interruption: false, consent: true,  completed: true,  act: 2 },
    /* the four that fit neither — §7.5 slots 132 · 138 · 144 · 150.
       Interruption present, consent absent, transfer completed anyway.
       Do not "fix" these by giving them a third box. The missing box is
       the puzzle and entry 156 is her refusing to open one. */
    { id: "kolossos", name: "Kolossos",         interruption: true, consent: false, completed: true, exception: true, act: 2 },
    { id: "badfut",   name: "Bad Future",       interruption: true, consent: false, completed: true, exception: true, act: 2 },
    { id: "dss",      name: "Dark Super Sonic", interruption: true, consent: false, completed: true, exception: true, act: 2 },
    { id: "nazo",     name: "Nazo",             interruption: true, consent: false, completed: true, exception: true, act: 2 },
  ],
  CLASSIFY_NOTE_ENTRY: 156,     // surfaces once all four exceptions are filed

  /* atmosphere tuning */
  FIELD: {
    RUNE_COUNT: 9,          // concurrent apparition slots (reference video ~ 4)
    RUNE_GLOW_CHANCE: 0.35, // share of runes that flare white at their peak
    FOG_INTENSITY: 1.0,     // 0 = off, 1 = reference-matched, 1.5 = thick
    FOG_SPEED: 1.0,         // churn speed multiplier
    FOG_VIDEO: null,        // optional: "assets/fog.mp4" to use your own loop
  },

  /* ambient drifting glyphs — path strings only, no letter mappings.
     Only ever use shapes that have already appeared in public messages.
     A new shape appearing here is a leak, not a puzzle (§8.5). */
  GLYPH_PATHS: [
    "M3,12 L10,5 L17,12 M7,20 L14,27 L21,20", "M5,3 L17,9 L5,15 M7,17 L19,23 L7,29",
    "M4,4 L12,16 L4,28 M20,4 L12,16 L20,28",  "M4,6 H13 M9,15 H20 M4,24 H13",
    "M12,2 V30 M12,8 L4,14 M12,16 L20,22",    "M4,8 L12,16 L20,8 M4,20 L12,28 L20,20",
    "M12,4 L20,16 L12,28 L4,16 Z",            "M7,12 L13,6 L19,12 L13,18 Z M13,18 L3,22",
    "M4,22 L20,28 M12,25 V9 L6,3",            "M18,4 L6,8 L18,13 L6,18 L18,23 L10,30",
    "M4,4 L12,10 M8,14 L16,20 M12,24 L20,30", "M12,4 L20,16 L12,28 L4,16 Z M2,20 L22,12",
    "M10,0 V12 M14,18 V30 M4,11 L20,19",
  ],
};
