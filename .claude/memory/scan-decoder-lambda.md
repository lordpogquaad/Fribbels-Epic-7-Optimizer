---
name: scan-decoder-lambda
description: "The gear/hero scan is decoded by fribbels' abandoned AWS Lambda, not locally — why newly released heroes vanished from imports, the client-side code→name fix (2026-08-28), and what the Lambda's limits still are."
metadata: 
  node_type: memory
  type: project
  originSessionId: ae12964a-a779-473a-b06c-7e3b2491cb82
  modified: 2026-08-28T15:28:56.804Z
---

# Scan decoding is remote (fribbels' Lambda), not local

`7. PY/1. Scanner/1. Core/scanner.py` only sniffs the game's TCP payloads (ports 3333/5222) and
streams hex to the renderer; the actual MessagePack decode happens when
`4. JS/4. Importer Tab/1. Scanner/scanner.js` POSTs that hex to
`https://krivpfvxi0.execute-api.us-west-2.amazonaws.com/dev/getItems` — the original author's
serverless decoder. It returns `data` (gear) and `units` (arrays; the JS keeps the largest). The
`127.0.0.1:5000` alternative behind `Scanner.switchApi` is fribbels' private dev decoder — there is
no local implementation in this repo or in Rex's branches (checked `upstream/main` and
`upstream/feat/offline`, 2026-08-28).

**Why a new hero disappeared (Lisette, patch 2026-08-28):** the Lambda names units from ITS OWN
hero list, which nobody updates; a new code (`c2186`) came back with `id`/`code` but no `name`,
and `convertUnits` dropped nameless units. Rex's copy has the identical drop, so his data patches
cannot fix it — only the client can. Fix landed 2026-08-28: `convertUnits` resolves a nameless
unit's `code` via `HeroData.getAllHeroData()` (Rex-synced) before filtering, and logs
`[Scanner] units: N decoded, N named by code, N dropped` + the lists (read them in
[[runtime-log-file]]). Expected residue: `s0001`–`s0004` special/story units are dropped every scan —
not heroes, not an error.

**Still true / limits:** every scan depends on that Lambda staying up. If it dies, the scanner is
dead until a local decoder exists (the payload notes at the bottom of `scanner.py` — MessagePack
maps with `info.type` = `equip`/`unit` and a `code` — are the starting point). The Lambda also
maps gear (`data`) and set/stat ids; new gear sets or stat ids would need the same kind of
client-side fallback.

**How to apply:** a hero that exists in `herodata.json` but never appears in the scan → look at the
`[Scanner] units` log line first (named-by-code vs dropped); it is a decoder/naming problem, not a
merge or hero-data problem. Do not "fix" it in `heroData.js` or `mergeHeroes`.
[[repo-lineage]]
