# Project Brief — Fribbels Epic Seven Gear Optimizer

## Overview

Desktop Electron application that helps Epic Seven (mobile RPG) players organize gear inventory and find optimal gear builds for heroes. Players import their gear via OCR screenshot scanning, then run a combinatorial optimizer backed by a Java engine to find the best item set.

## Core Goals

1. **Gear import** — Scan in-game screenshots via OCR (Tesseract/Leptonica) to build a local gear inventory
2. **Gear optimizer** — Run combinatorial gear-set searches across all permutations filtered by user-defined stat targets
3. **Archetype scoring** — Score each gear item using the Google Sheets–derived GAS (Gear Archetype Score) engine, surfacing quality metrics without running the full optimizer
4. **Gear management** — Reforge prediction, substat modification preview, gear rating (Score/dScore/sScore/cScore)
5. **Hero management** — Track builds, add artifact/imprint bonus stats, configure substat mod preferences

## Scope Boundaries

- Windows 64-bit and macOS only
- Java 8+ required (optimizer backend is a compiled JAR)
- No server-side component — fully local desktop app
- Gear data persists in local JSON save files

## Success Criteria

- Optimizer returns valid permutation results within reasonable time for typical gear collections
- Archetype scores (Off./UOff. C.Power, A.Power, individual archetype columns) display correctly on all gear items
- OCR scanner correctly identifies gear from emulator/phone screenshots
- App packages cleanly into Windows installer and macOS DMG

## Key Stakeholders

- Solo maintainer / developer: RexQian (fork of original Fribbels project)
- End users: Epic Seven players globally (8 language localizations)
