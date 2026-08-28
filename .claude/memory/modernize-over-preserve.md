---
name: modernize-over-preserve
description: "Marcus inherited this ~4-year-stale codebase from a previous dev and wants it actively modernized — prefer upgrading/updating over preserving legacy patterns or quirks; breaking changes during modernization are acceptable."
metadata:
  type: feedback
---

# Prefer modernization over preserving legacy quirks

The Fribbels Epic 7 Optimizer code was written by a previous dev and left untouched for years before
Marcus started working on it (originally with GitHub Copilot, now Claude Code — see
[[overhaul-plan-2026-08]]). Marcus's own words (2026-06, still the operating stance through the
2026-08 overhaul): "a lot of this code was from old dev ... so I'm just taking their work and
modernizing it; if stuff breaks / needs fixed that's fine, I'd rather get these old files updated
than keep using the old out-of-date stuff." He also separately: "stuff is not what it should be
(I know way more now)."

**Why:** it's inherited legacy; the goal is to bring it current, not freeze its old behavior.

**How to apply:** lean toward modernization — upgrade dependencies toward latest stable (subject to
the repo's own quarantine/compatibility gates — see [[overhaul-plan-2026-08]] for the current dep
policy), replace deprecated/removed APIs with current equivalents, and don't twist a change just to
preserve a legacy quirk. Breaking changes are acceptable when they move the code forward. Still do
the diligence — verify the change, explain what changed, flag runtime risks — but default to
"update it," not "leave it as-is for safety."
