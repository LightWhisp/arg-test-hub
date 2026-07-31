#!/usr/bin/env python3
"""Vault tool for the void site.

Encrypts a lore payload under a puzzle answer. The site can only decrypt an
entry when someone types the correct answer — the content is NOT in the page
source in any readable form, so source-divers get nothing.

Usage:
    python3 vault_tool.py ENTRY_ID "THE ANSWER" content.html
    (or import and call make_entry)

Paste the printed JSON object into the VAULT list in index.html.
Answers are normalized to A-Z only, case-insensitive, spaces ignored.
"""
import base64, json, os, re, sys
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

ITERATIONS = 100_000

def normalize(answer: str) -> str:
    return re.sub(r"[^A-Z]", "", answer.upper())

def make_entry(entry_id: str, answer: str, content_html: str) -> dict:
    salt = os.urandom(16)
    iv = os.urandom(12)
    key = PBKDF2HMAC(algorithm=hashes.SHA256(), length=32, salt=salt,
                     iterations=ITERATIONS).derive(normalize(answer).encode())
    ct = AESGCM(key).encrypt(iv, content_html.encode("utf-8"), None)
    return {
        "id": entry_id,
        "salt": base64.b64encode(salt).decode(),
        "iv": base64.b64encode(iv).decode(),
        "ct": base64.b64encode(ct).decode(),
    }

def decrypt_entry(entry: dict, answer: str) -> str:
    salt = base64.b64decode(entry["salt"])
    iv = base64.b64decode(entry["iv"])
    ct = base64.b64decode(entry["ct"])
    key = PBKDF2HMAC(algorithm=hashes.SHA256(), length=32, salt=salt,
                     iterations=ITERATIONS).derive(normalize(answer).encode())
    return AESGCM(key).decrypt(iv, ct, None).decode("utf-8")

if __name__ == "__main__":
    if len(sys.argv) == 4:
        content = open(sys.argv[3], encoding="utf-8").read()
        print(json.dumps(make_entry(sys.argv[1], sys.argv[2], content), indent=2))
    else:
        print(__doc__)
