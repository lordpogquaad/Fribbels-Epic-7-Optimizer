# Product Context — Fribbels Epic Seven Gear Optimizer

## Why This Exists

Epic Seven features hundreds of gear pieces with 6 substats each, all needing to be distributed across 5+ heroes optimally. The in-game UI has no cross-hero optimizer and no way to compare gear quality systematically. This tool closes that gap.

## Problems It Solves

### 1. Gear Discovery Fatigue

Manually trying gear combinations on heroes is time-consuming. The optimizer runs millions of permutations automatically to find stat-optimal builds given user-defined constraints.

### 2. Gear Quality Blindness

Players can't easily tell if a piece of gear is "good" without context. The archetype scoring engine quantifies how well each gear item supports specific archetypes (DPS, Tank, Speed, etc.) using the GAS (Gear Archetype Score) formula derived from the community Google Sheets project.

### 3. Reforge/Modification Planning

Players invest resources (gold, materials) in reforging and modifying gear. The app previews reforged stat maximums and modification outcomes before the player commits resources.

## How It Works

### User Flow

1. **Import** → Player captures in-game screenshots; OCR scans them into structured gear data
2. **Score** → Archetype scorer runs on import, tagging each item with Off./UOff. archetype scores, C.Power, A.Power
3. **Optimize** → Player selects a hero, sets stat filters/priority, clicks Start; Java backend finds optimal builds
4. **Review** → Results shown color-coded by stat; player equips or locks selected builds
5. **Manage** → Player tracks equipped sets, previews reforge outcomes, plans substat mods

### UX Goals

- Filter results without re-running full search (client-side re-filter)
- Color-coded column gradients make quality immediately visible
- Archetype score tooltips show full breakdown (all non-zero scores per archetype, Off. vs UOff. separated)
- Gear tab shows sortable Score/dScore/sScore/cScore columns plus new archetype columns
- Localized in 8 languages: en, en-US, fr, ja, ko, ru, zh, zh-TW

## What Makes This Version Different (RexQian fork)

The original Fribbels project was abandoned. This fork:

- Upgrades all npm dependencies to current (React 19, Electron 42, Webpack 5, TypeScript 6)
- Adds the full GAS archetype scoring engine (ported from personal Google Sheets project)
- Adds C.Power / A.Power aggregate columns with modification-aware scoring
- Adds in-gear-tab archetype filter (dropdown + min score + quick buttons)
- Deduplicates and centralizes all game constants into `reforgeConstants.js`
