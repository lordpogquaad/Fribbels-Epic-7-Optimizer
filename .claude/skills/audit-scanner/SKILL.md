---
name: audit-scanner
description: Audit the Epic Seven gear scanner of the Pog E7 Optimizer, meaning the Python packet sniffer and its JS caller, for real defects and hidden problems. Runs Ruff, mypy and the JS lint, then dispatches scanner-sonnet, or scanner-opus with deep, and files every finding. Read-only apart from the fix list and ledger.
disable-model-invocation: true
argument-hint: '[drift|deep [paths]]'
---

# /audit-scanner

Arguments: `$ARGUMENTS`

Read `.claude/skills/section-audit.md` now: it owns the modes, flow, agent contract and report.
This file supplies the scanner's values. The agents are `scanner-sonnet` and `scanner-opus`.

## Scope

Under `1. App/2. Frontend/1. Source/`: `7. PY/` and `4. JS/4. Importer Tab/1. Scanner/`. Exclude the
binary `eng.traineddata`. This section is small, so one shard usually fits.

## Tool pass

- `yarn lint:py`: Ruff over the whole repo. Exit 0 includes findings, so count those under `7. PY/`.
- `yarn lint:py:types`: mypy on `scanner.py`. Exit 1 means findings.
- `yarn lint`, read for the files under `4. JS/4. Importer Tab/1. Scanner/`.
- A syntax check of `scanner.py`:

  ```bash
  python -c "import sys; compile(open(sys.argv[1], encoding='utf-8').read(), sys.argv[1], 'exec')" "2. Frontend/1. Source/7. PY/1. Scanner/1. Core/scanner.py"
  ```

## What the agents check

- **Capture:** packets dropped or misassembled with no message, adapter or Npcap failures reported as
  success, and a capture that never ends.
- **Decoding path:** every scan depends on the remote endpoint, so check what happens when it fails,
  times out or returns partial data.
- **Import:** items or heroes lost between the scan and the database, including the Optimizer filter
  that skips unknown names with no message, and naming by code. That code is in
  `4. Importer Tab/2. Importer/`, outside this scope, so trace into it and report what you find.
- **Process boundary:** how the JS caller starts the Python process, passes its output and handles its
  exit code, stderr and a crash.

Scan payloads are the user's account data, so report counts and field names only.

## Not run in an audit

A live capture needs the game and Marcus, and a real decode reaches the remote endpoint. Both stay in
the report's `Not run` line; replay a saved export where one exists.
