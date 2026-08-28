---
name: python-toolchain
description: "The gear-scanner's Python tooling is a system prerequisite (not repo-bundled) run via py/python/python3, with system pip scapy for packet capture; the Microsoft Python VS Code extensions are installed but not on PATH/pip-installed, so their lint/format tools must be run via their bundled libs with an explicit PYTHONPATH."
metadata:
  type: reference
---

# Python scanner toolchain (spot-checked 2026-08-28)

`4. JS\4. Importer Tab\1. Scanner\scanner.js` spawns `py`/`python`/`python3` to run
`7. PY\1. Scanner\1. Core\scanner.py` — the auto-importer/gear-scanner. This is a **system
prerequisite**, not repo-bundled: system Python confirmed present 2026-08-28 (`py -V` → 3.14.5), with
**scapy 2.7.0** pip-installed system-wide (`from scapy.all import *` in scanner.py uses the system
copy) and Npcap/Wireshark as the native pcap capture driver (external prerequisite, not verified
here).

`7. PY\2. Scapy\` (a stale vendored Scapy 2.5.0 mirror, ~9.2 MB, never actually importable/referenced)
was removed 2026-06-19 — confirmed gone 2026-08-28; `7. PY` now holds only `1. Scanner`.

**Python lint/format tooling:** the Microsoft Python VS Code extensions
(`ms-python.{black-formatter,flake8,pylint,isort,mypy-type-checker,autopep8}`) are installed under
`F:\VSCode-Data\extensions\` but are **not on PATH and not pip-installed** in the system Python. Run
them via the extension's bundled libs:
```
PYTHONPATH="F:/VSCode-Data/extensions/ms-python.<tool>-<ver>/bundled/libs" python -m <black|flake8|pylint|isort> <file>
```
(swap in the extension's actual installed version — don't hardcode one here).

- **Formatter = Black** (88-col, double quotes). **`/.flake8` at the repo root** aligns flake8 to
  Black (`max-line-length=88`, `extend-ignore=E203,W503`) — confirmed present at repo root
  2026-08-28. Root placement matters because flake8 discovers config by searching cwd-upward and the
  VS Code workspace root is otherwise unknown.
- pylint is stricter (snake_case + per-function docstrings expected). scapy's dynamic exports cause
  false positives — suppress **at the import line**: pylint `no-name-in-module` via
  `# pylint: disable-next`, mypy `attr-defined` via `# type: ignore[attr-defined]`. An intentional
  broad `except Exception` in the sniff thread is suppressed with `# pylint: disable` for
  `broad-exception-caught`; empty dict globals get type annotations (e.g. `acks: dict[int, list]`)
  for mypy's `var-annotated`.
- **Gotcha:** prose inside a comment containing `pylint:`/`type:`/`flake8:`/`noqa:` is parsed as a
  tool directive (can throw a bogus error) — keep those literal tokens out of comment prose.

**How to apply:** don't assume a bare `python -m black`/`flake8`/`pylint` on this machine will find
these tools — use the `PYTHONPATH`-to-bundled-libs pattern above, or have the user run the VS Code
extension directly.
