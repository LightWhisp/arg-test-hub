#!/usr/bin/env python3
"""Vault tool for the void site.

Encrypts a lore payload under a puzzle answer. The site can only decrypt an
entry when someone types the correct answer — the content is NOT in the page
source in any readable form, so source-divers get nothing.

Usage
-----
  # an ordinary door
  python3 vault_tool.py ENTRY_ID "THE ANSWER" content.html

  # a door that opens onto nothing (§3.2 — use this state exactly once)
  python3 vault_tool.py --emptied ENTRY_ID "THE ANSWER"

  # the two-stage finale (§4.2). Stage one's plaintext IS stage two's door.
  python3 vault_tool.py --nested ENTRY_ID \\
      "<stage one key>" stage1.html "<stage two key>" stage2.html

  # a sealed recording (§2.3). Generates its own key — you never type it.
  python3 vault_tool.py --audio REC_ID in.mp3 assets/audio/REC_ID.enc

Paste the printed JSON into VAULT in config.js — or, for --nested, into
FINALE.stage1, and set FINALE.enabled to true. Not before reveal day.

Two things changed and both matter
----------------------------------
ITERATIONS is now 600_000 (was 100_000). Entries already published were
sealed at 100k and must keep opening, so every entry now carries its own
`iters` and the site falls back to 100_000 when it is absent. Do not
re-seal the two original entries; you would need their plaintexts, and
their answers are already public knowledge in the server.

PAYLOADS ARE PADDED to a fixed block. Ciphertext length was leaking how
much sits behind a door: a one-line "the record is blank" and a full lore
page are obviously different sizes in config.js. That let anyone reading
the config see the emptied door coming, which is the exact thing carrying
`emptied` in the ciphertext was meant to prevent. Padding is trailing NULs
and the site strips them on decode.

Answers are normalized to A-Z only, case-insensitive, spaces ignored.
"""
import base64, json, os, re, sys
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

ITERATIONS = 600_000
LEGACY_ITERATIONS = 100_000
PAD_BLOCK = 2048          # every payload rounds up to a multiple of this
EMPTIED_MARK = "<!--void:emptied-->"


def normalize(answer: str) -> str:
    return re.sub(r"[^A-Z]", "", answer.upper())


def _pad(data: bytes) -> bytes:
    """Round up to PAD_BLOCK with NULs so length says nothing."""
    room = (-len(data)) % PAD_BLOCK
    return data + b"\x00" * room


def _unpad(data: bytes) -> bytes:
    return data.rstrip(b"\x00")


def _key(answer: str, salt: bytes, iterations: int, normalise: bool = True) -> bytes:
    """normalise=False for machine keys (audio): those are random strings
    that never pass through a human, so A-Z folding would throw entropy away."""
    secret = normalize(answer) if normalise else answer
    return PBKDF2HMAC(algorithm=hashes.SHA256(), length=32, salt=salt,
                      iterations=iterations).derive(secret.encode())


def make_entry(entry_id: str, answer: str, content: str,
               iterations: int = ITERATIONS) -> dict:
    salt, iv = os.urandom(16), os.urandom(12)
    ct = AESGCM(_key(answer, salt, iterations)).encrypt(
        iv, _pad(content.encode("utf-8")), None)
    return {
        "id": entry_id,
        "salt": base64.b64encode(salt).decode(),
        "iv": base64.b64encode(iv).decode(),
        "ct": base64.b64encode(ct).decode(),
        "iters": iterations,
    }


def decrypt_entry(entry: dict, answer: str) -> str:
    salt = base64.b64decode(entry["salt"])
    iv = base64.b64decode(entry["iv"])
    ct = base64.b64decode(entry["ct"])
    iterations = int(entry.get("iters", LEGACY_ITERATIONS))
    pt = AESGCM(_key(answer, salt, iterations)).decrypt(iv, ct, None)
    return _unpad(pt).decode("utf-8")


def make_nested(entry_id: str, answer1: str, html1: str,
                answer2: str, html2: str) -> dict:
    """The last door. Two ciphertexts, one record, sequential.

    Stage one decrypts to JSON carrying stage two's door, so the site never
    holds stage two's ciphertext until stage one has already been opened.
    Stage two is the only input in the project that comes from outside his
    language, so it is also the only one that can never be brute-forced from
    his published alphabet — V is not in it.
    """
    stage2 = make_entry(entry_id + ":2", answer2, html2)
    stage2.pop("id")
    inner = json.dumps({"html": html1, "next": stage2}, ensure_ascii=False)
    return make_entry(entry_id, answer1, inner)


def make_audio(rec_id: str, src: str, dst: str) -> dict:
    """Seal a recording under a generated key.

    The key is never typed by a player. It travels inside a door payload:
    paste the printed snippet into that door's HTML before sealing it, and
    opening the door is what makes the track playable. That is the join
    between the puzzles and the recordings.

    The .enc then sits in assets/audio in public, fully downloadable, and
    useless. Solvers can see the file exists and cannot hear it.

    Audio is NOT padded. Padding exists so ciphertext length stops leaking
    how much prose sits behind a door; the length of an mp3 gives away
    nothing about its key, and padding a 4MB file to a block would only
    make the download bigger.
    """
    key = base64.urlsafe_b64encode(os.urandom(24)).decode().rstrip("=")
    salt, iv = os.urandom(16), os.urandom(12)
    with open(src, "rb") as fh:
        raw = fh.read()
    ct = AESGCM(_key(key, salt, ITERATIONS, normalise=False)).encrypt(iv, raw, None)
    with open(dst, "wb") as fh:
        fh.write(ct)
    return {
        "sealed": {
            "salt": base64.b64encode(salt).decode(),
            "iv": base64.b64encode(iv).decode(),
            "iters": ITERATIONS,
        },
        "file": dst,
        "_paste_into_the_door_payload":
            '<i hidden data-unlocks="%s" data-key="%s"></i>' % (rec_id, key),
    }


if __name__ == "__main__":
    a = sys.argv[1:]
    if a and a[0] == "--nested" and len(a) == 6:
        _, eid, ans1, f1, ans2, f2 = a
        print(json.dumps(make_nested(
            eid, ans1, open(f1, encoding="utf-8").read(),
            ans2, open(f2, encoding="utf-8").read()), indent=2))
    elif a and a[0] == "--audio" and len(a) == 4:
        print(json.dumps(make_audio(a[1], a[2], a[3]), indent=2))
    elif a and a[0] == "--emptied" and len(a) == 3:
        print(json.dumps(make_entry(a[1], a[2], EMPTIED_MARK), indent=2))
    elif len(a) == 3:
        print(json.dumps(make_entry(a[0], a[1], open(a[2], encoding="utf-8").read()),
                         indent=2))
    else:
        print(__doc__)
