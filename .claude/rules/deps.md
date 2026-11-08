---
paths:
  - "1. App/package.json"
  - "1. App/.yarnrc.yml"
---

# Dependencies and the Yarn age gate

**Fires when:** adding, bumping or pinning a dependency in the outer (Yarn 4) manifest.

- **Wrong:** a `YN0016 … are quarantined` error answered by lowering `npmMinimalAgeGate` or listing the
  package in `npmPreapprovedPackages`. **Right:** pin the newest version that is more than 24 hours old
  (exact, no caret) and move up once it ages in. **Why:** the gate is a Yarn 4 default (1440 minutes,
  not set in `.yarnrc.yml`) and is client-side, so `npm view` still lists the quarantined version.
- **Electron major bump:** `yarn up "electron@^N.0.0"` → `browserslist` → `"electron N.0"` →
  `yarn up -R caniuse-lite electron-to-chromium` → confirm
  `require('electron-to-chromium/versions')['N.0']` is defined (without that refresh the bump to 42
  failed silently) → the acceptance gate → `yarn electron-builder build --win --x64 --dir` smoke. An
  unpacked `--dir` build emits no `version` file, so read the Electron version from the build log.

Evidence: project memory `overhaul-plan-2026-08`.
