/* ============================================================
   the void — config.js  (EDIT THIS FILE — all content lives here)
   ============================================================ */
window.VOID_CONFIG = {

  /* audio fragment slots. Drop files into assets/audio/ — a missing file
     shows "not yet recovered" on purpose (unreleased slots are teasers). */
  FRAGMENTS: [
    { title: "fragment 01 — the transcript",  file: "assets/audio/fragment01.mp3" },
    { title: "fragment 02 — the first taken", file: "assets/audio/fragment02.mp3" },
    { title: "fragment 03 — ?",               file: "assets/audio/fragment03.mp3" },
  ],

  /* sealed doors. Generate new entries with:
       python3 vault_tool.py my-entry-id "THE ANSWER" content.html
     then paste the printed object into VAULT and add its text below. */
  VAULT: [
    {
        "id": "the-chosen",
        "salt": "euElizcKwo/MepPonU4xdw==",
        "iv": "WIrvnyUg32fTIlaT",
        "ct": "JKhYgNn8MTeoH1ZZ/6lkyc5Sgt0nL12tr49rZ3qdZNuwedZDPLyKdyXVpZNGZeZpJGr3skgaZCN7j1wXAS/kwG5nTAr+gDvYMewlOSjfItECHMX55ktdNKAhSbrFg0VIuTvoY3f+ubIYad/4eg3Vg6/nwop+7Vb6MAiJ/EBk9C8cuyjCnEwximoLH3SWorn2JJEatAiqmVqf+Rk5EiLLJ0M+/MZ4YkrRNkdqWliDMZ3TSssvPiPV2/HwnmgCnhOv07gjbSmR8gkj24psz2LJ/6ywtNJbhiLGmqtgaYHMuqffizhKxL6bBKDbOdAMsZbP95YR6Nr3KNL0waEvsrCPHAhmHMYRdnFrxknqFOAPavtDBEljomV75AsNvLpnuF2Exeo7/1J8VFo/rQ5ht2sRbOB6zxXZ+kjgQCckYPNBZQZ+zj6qPYBLlu2eq8b+zx9/7aQDGwdI394of+b4Zi5L2ynAGkcYa240CHueBrY8mHVjPIGzYImqnIo60bJwcFubOv/OT4h2BqQx0nUY3Q4l1CYfPZ6oajzCPOL0OaRiVQ2lF2ShuM3tC8zdPSLiD62C2QuGhA/4SXyJWUcHXO3g8uOYbJ7WdTHYYfYMvVY2AgSEXpooSChPqi6DgXkzb2UsoMxm4FVjuuhxR4ONVvxuBv05Vj5KlpTeLpgj8gi43KoIrvfsH0umEPNdhoQajx4LHRHo2bFsKSKLRj/77gWqxcAk1LWTGcs3JtZXGqGTn4bYDfArI1GCNrW2tyhib3mW0Wpka7M4Z/6L02szke58+T86R7EPksYto/19IG2Y1TqSPcYcR+cXu0NLeuXLEf0q5HzRTiqiIAFLwgT3FJTy3afjCfxkh5wa"
    },
    {
        "id": "his-name",
        "salt": "axLhIPdIpZm0tLUZ9pnd/g==",
        "iv": "TxSJKeGlKNHaqtmu",
        "ct": "g4yaLtBy8Ty2F6lMZj9IOoFJGUgupUzLnoP30a3tT4PwT6q8KJqeEaMRo4mGcxJAXuazH1AcBTkIpOOW4NvUV+GXkzUOAM8B5UdhLkNmiEuK2mL3jpTADTZ0FgdKzYjZ2FPDE6F/Rby21+LsZAX2RtppgNAsgdf+C4x4ncBX6PhtslKUn7kS3vO0maPP9X32rzUrcUlPedyj5aGlJ/7JXeL8xBrbezdCcvcUFJioSMPIwHtVue8l2VcVs1SkSBJjLPmx6iBWG2TY87zHsL2fH3ysAtr8sLMPzYffaFtWLvIn5+QnjE/tBCyORpeZiuE="
    }
],

  /* visible text per door (prompts are public; payloads stay encrypted) */
  DOOR_TEXT: {
    "the-chosen": { label: "door one",
                    prompt: "placeholder riddle — replace me. (demo answer: WITNESS)" },
    "his-name":   { label: "the last door",
                    prompt: "speak his name.",
                    status: "sealed until the end" },
  },

  /* atmosphere tuning */
  FIELD: {
    RUNE_COUNT: 9,          // concurrent apparition slots (reference video ~ 4)
    RUNE_GLOW_CHANCE: 0.35, // share of runes that flare white at their peak
    FOG_INTENSITY: 1.0,     // 0 = off, 1 = reference-matched, 1.5 = thick
    FOG_SPEED: 1.0,         // churn speed multiplier
    FOG_VIDEO: null,        // optional: "assets/fog.mp4" to use your own loop
  },

  /* ambient drifting glyphs — path strings only, no letter mappings.
     Only ever use shapes that have already appeared in public messages. */
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
