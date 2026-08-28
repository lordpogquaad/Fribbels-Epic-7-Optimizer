---
name: e7-mod-permanence
description: "Epic Seven gear mods are permanent/irreversible — a modded substat slot is locked forever — which is why the optimizer's auto-config archetype logic must be conservative about suggesting mods."
metadata:
  type: project
---

# Gear mods in Epic Seven are permanent

Once a substat slot on a gear piece is modded, that slot is locked to the new stat forever — it
cannot be reverted. Gear moves between heroes over time in this game, so a mod that's fine for
today's hero can make the piece unusable for a future assignment.

**Why it matters for this tool:** the optimizer's auto-config archetype logic must be conservative —
if no archetype improvement is listed for an already-modified substat, the mod toggle should be
disabled rather than risk suggesting a bad re-mod.

**Example — Notos (unique stat target):** doesn't fit standard archetypes cleanly. Tanky, but his S3
doubles all stats, so his CC%/CD% targets are the doubled thresholds (CC% 50 base → 100% hard cap;
CD% 175 base → 350%), plus he wants HP/Speed — but does NOT want heavy CC%/CD% rolls on random gear,
only enough to hit the thresholds. Standard "Tank" archetypes exclude CC%/CD%, so Notos gear needs
custom archetype tuning, and mods on his pieces must be chosen carefully in case the gear later
moves to another hero.

**How to apply:** when writing or reviewing mod-related code, treat an incorrect mod as permanent
damage to a gear piece. Never suggest or allow a re-mod path unless the archetype scoring clearly
shows a gain. [[user-game-epic-seven]]
