# [TASK007] — Object Calisthenics Audit (Java Backend)

**Status:** Pending
**Added:** 2026-05-31
**Updated:** 2026-05-31

---

## Original Request

Audit the Java backend against `object-calisthenics.instructions.md` (all 9 rules). Document all findings. No source code changes — advisory and tracking only.

---

## Thought Process

The OC instruction file restricts its scope to **business domain classes** (aggregates, entities, value objects, domain services) and **application layer handlers**. DTOs, data containers, and infrastructure/compute code are exempt from Rules 3, 8, and 9.

### Scope Decisions

| Package / File                 | Classification                                       | R3/R8/R9    |
| ------------------------------ | ---------------------------------------------------- | ----------- |
| `model/Hero.java`              | Domain entity (has business logic)                   | **Applies** |
| `model/Item.java`              | Domain entity (has business logic)                   | **Applies** |
| `core/StatCalculator.java`     | Domain service                                       | **Applies** |
| `core/Sorter.java`             | Domain service                                       | **Applies** |
| `core/SpecialStats.java`       | Domain service                                       | **Applies** |
| `handler/*RequestHandler.java` | Application layer                                    | **Applies** |
| `model/HeroStats.java`         | Result DTO (optimization output, serialized to JSON) | **Relaxed** |
| `model/BonusStats.java`        | Override DTO                                         | **Relaxed** |
| `model/AugmentedStats.java`    | Serialization DTO                                    | **Relaxed** |
| `model/BaseStats.java`         | DB record DTO                                        | **Relaxed** |
| `request/*, response/*`        | HTTP DTOs                                            | **Relaxed** |
| `gpu/*`                        | Infrastructure / Aparapi compute kernel              | **Exempt**  |
| `ocr/*`                        | Infrastructure                                       | **Exempt**  |

### Why Full Compliance Is Impractical

1. **Java 8 constraint** — Records, sealed interfaces, and other structural alternatives require Java 14+.
2. **Game-canonical abbreviations** — Epic Seven's own interface uses `ATK`, `HP`, `DEF`, `CR`, `CD`, `EFF`, `RES`, `SPD`. Renaming these in isolation would decouple the codebase from its own domain language and break any future data contract with frontend JSON.
3. **Lombok dependency** — `@Getter`/`@Setter` are established project-wide; removing them on selected classes would create an inconsistent pattern with no build-time enforcement.
4. **Aparapi kernel** — `OptimizationRequestHandler` and the GPU kernel code are intentionally structured around flat float arrays for GPU memory layout; applying OC would break the compute model.

All findings are **advisory**. They represent areas to improve incrementally as the project migrates toward higher Java versions or when targeted refactors are planned.

---

## Findings by Rule

### Rule 1 — One Level of Indentation per Method

| #   | File                                      | Method                     | Nesting Depth                                             | Severity   | Notes                                                               |
| --- | ----------------------------------------- | -------------------------- | --------------------------------------------------------- | ---------- | ------------------------------------------------------------------- |
| 1.1 | `core/Sorter.java`                        | `sortHeroes()`             | 4 (method → switch(order) → switch(column) → Arrays.sort) | SUGGESTION | Single ~200-line method; extract each sort case to named comparator |
| 1.2 | `handler/OptimizationRequestHandler.java` | `ensureSolutionBitMasks()` | 6 (six nested for-loops computing 22^6 bitmasks)          | SUGGESTION | GPU-adjacent infrastructure; partially exempt, but extractable      |
| 1.3 | `model/Hero.java`                         | `getDamageMultipliers()`   | 3 (nested null checks + conditional logic)                | SUGGESTION | Extract null guards as early returns                                |

**Recommended fix pattern:** Extract to guard clauses (early return), or extract inner loops/cases to private methods.

---

### Rule 2 — Don't Use the ELSE Keyword

| #   | File                       | Location                  | Severity   | Notes                                                                           |
| --- | -------------------------- | ------------------------- | ---------- | ------------------------------------------------------------------------------- |
| 2.1 | `core/StatCalculator.java` | `setBaseValues()` ~L60–68 | SUGGESTION | if/else on `bonusStats == null`; replace with early return + default assignment |
| 2.2 | `model/Hero.java`          | `getDamageMultipliers()`  | SUGGESTION | Nested if/else chains; replace with guard clauses                               |

**Recommended fix pattern:**

```java
// Before
if (bonusStats == null) {
    // defaults
} else {
    // overrides
}

// After
if (bonusStats == null) {
    setDefaultValues();
    return;
}
setOverrideValues(bonusStats);
```

---

### Rule 3 — Wrap All Primitives and Strings (domain entities only)

| #   | File                       | Primitives                                                                                                                                  | Count | Severity  | Notes                                                                                               |
| --- | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | ----- | --------- | --------------------------------------------------------------------------------------------------- |
| 3.1 | `model/Hero.java`          | `int atk`, `int hp`, `int def`, `int cr`, `int cd`, `int eff`, `int res`, `int dac`, `int spd`, `int dmg`, `int bs`, `int ehp` + 40+ others | 50+   | IMPORTANT | Domain entity with `getDamageMultipliers()` — should express stat values as value objects           |
| 3.2 | `core/StatCalculator.java` | `float atkSetBonus`, `float hpSetBonus`, `float bonusBaseAtk`, `float bonusMaxAtk`, `float priorityAtk` + 15+ others                        | 20+   | IMPORTANT | Domain service accumulates raw floats; value object per stat type would make accumulation type-safe |

**Practical path forward:** Introduce `StatValue` or `StatModifier` wrapper once Java 14+ Records become available. Until then, document intent in Javadoc.

---

### Rule 4 — First Class Collections (domain entities only)

| #   | File              | Field                       | Severity   | Notes                                                      |
| --- | ----------------- | --------------------------- | ---------- | ---------------------------------------------------------- |
| 4.1 | `model/Hero.java` | `List<HeroStats> builds`    | SUGGESTION | Raw list; should be `BuildResults` or `HeroBuilds` wrapper |
| 4.2 | `model/Hero.java` | `Map<Gear, Item> equipment` | SUGGESTION | Raw map; should be `Loadout` or `Equipment` wrapper        |
| 4.3 | `model/Hero.java` | `List<StatType> keepStats`  | SUGGESTION | Raw list; should be `KeepStatFilter` wrapper               |
| 4.4 | `model/Hero.java` | `List<String> modSlots`     | SUGGESTION | Raw list; minor — could remain a plain list                |

---

### Rule 5 — One Dot per Line

| #   | File              | Expression                   | Depth | Severity   |
| --- | ----------------- | ---------------------------- | ----- | ---------- |
| 5.1 | `model/Hero.java` | `skills.S1[0].rate`          | 3     | SUGGESTION |
| 5.2 | `model/Hero.java` | `skills.S2[0].pow`           | 3     | SUGGESTION |
| 5.3 | `model/Hero.java` | `skills.S3[0].soulburn_rate` | 3     | SUGGESTION |

**Recommended:** Extract `skills.S1` to a local variable, then dereference `[0].rate` separately.

---

### Rule 6 — Don't Abbreviate

This rule has the widest coverage in the codebase. Abbreviations are pervasive because they mirror Epic Seven's in-game stat names exactly. The violations are documented but **tolerated as game-canonical abbreviations**.

| Abbreviation                              | Meaning                       | Files                                                                 |
| ----------------------------------------- | ----------------------------- | --------------------------------------------------------------------- |
| `atk`                                     | Attack                        | Hero, Item, StatCalculator, HeroStats, SpecialStats, Sorter, handlers |
| `hp`                                      | Health Points                 | (all same files)                                                      |
| `def`                                     | Defense                       | (all same files)                                                      |
| `cr`                                      | Critical Hit Rate             | (all same files)                                                      |
| `cd`                                      | Critical Hit Damage           | (all same files)                                                      |
| `eff`                                     | Effectiveness                 | (all same files)                                                      |
| `res`                                     | Effect Resistance             | (all same files)                                                      |
| `dac`                                     | Dual Attack Chance            | Hero, HeroStats                                                       |
| `spd`                                     | Speed                         | (all same files)                                                      |
| `ehp`                                     | Effective HP                  | Hero, HeroStats, Sorter                                               |
| `dmg`                                     | Damage                        | Hero, HeroStats, Sorter                                               |
| `bs`                                      | Build Score                   | Hero, HeroStats, Sorter                                               |
| `cp`                                      | Combat Power                  | HeroStats, Sorter                                                     |
| `wss`                                     | Weighted Substat Score        | Item                                                                  |
| `mcdmg`                                   | Max Crit Damage               | Hero, HeroStats, Sorter                                               |
| `dmgh` / `dmgd` / `hdmg` / `ddmg`         | Damage variants (hero/debuff) | Hero, HeroStats                                                       |
| `hpps` / `ehpps` / `dmgps` / `mcdmgps`    | Per-second variants           | Hero, HeroStats, Sorter                                               |
| `hmcdmgs` / `dmcdmgs` / `hdmgs` / `ddmgs` | Soulburn variants             | Hero, HeroStats                                                       |
| `s1` / `s2` / `s3`                        | Skill slots 1–3               | Hero, HeroStats, Sorter                                               |
| `aei`                                     | Artifact Enhancement Index    | Hero                                                                  |

**Severity:** IMPORTANT (pervasive; new contributors cannot infer meaning without the game's own glossary)

**Recommendation:** Add a `GLOSSARY.md` or Javadoc `{@link}` at each abbreviation site pointing to the stat's full name. Renaming is impractical without a coordinated frontend JSON contract change.

---

### Rule 7 — Keep Entities Small (≤50 lines / ≤10 methods)

| #   | File                                      | Lines | Methods                    | Severity  |
| --- | ----------------------------------------- | ----- | -------------------------- | --------- |
| 7.1 | `core/StatCalculator.java`                | ~500  | 20+                        | IMPORTANT |
| 7.2 | `handler/OptimizationRequestHandler.java` | ~500+ | 10+                        | IMPORTANT |
| 7.3 | `core/Sorter.java`                        | ~200  | 1 (single 200-line method) | IMPORTANT |
| 7.4 | `model/Hero.java`                         | ~200  | 5+                         | IMPORTANT |
| 7.5 | `handler/HeroesRequestHandler.java`       | ~200+ | 15+ routes                 | IMPORTANT |
| 7.6 | `handler/ItemsRequestHandler.java`        | ~200+ | 10+ routes                 | IMPORTANT |

**Recommended decompositions:**

- `StatCalculator` → split into `SetBonusCalculator`, `PriorityWeightApplier`, `StatAccumulator`
- `Sorter.sortHeroes()` → extract each column comparator to a static inner class or enum entry
- Handler `handle()` switches → extract each case to a dedicated `@FunctionalInterface` handler or command object

---

### Rule 8 — No More Than Two Instance Variables (domain classes)

| #   | File                                | Instance Variables                                                                                                                                                                    | Count | Severity  |
| --- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----- | --------- |
| 8.1 | `core/StatCalculator.java`          | atkSetBonus, hpSetBonus, defSetBonus, speedSetBonus, revengeSetBonus, reversalSetBonus, bonusBaseAtk/Hp/Def, bonusMaxAtk/Hp/Def, penSetDmgBonus, priorityAtk/Hp/Def/Spd/Cr/Cd/Eff/Res | 20+   | IMPORTANT |
| 8.2 | `handler/HeroesRequestHandler.java` | heroDb, baseStatsDb, artifactStatsDb, itemDb, statCalculator                                                                                                                          | 5     | IMPORTANT |
| 8.3 | `handler/ItemsRequestHandler.java`  | itemDb, heroDb, baseStatsDb, heroesRequestHandler                                                                                                                                     | 4     | IMPORTANT |

**Recommended:** Introduce a `StatContext` parameter object grouping the calculator's accumulated state. For handlers, introduce a `ServiceLocator` or dependency aggregate.

---

### Rule 9 — No Getters/Setters on Domain Classes

| #   | File              | Issue                                                                               | Severity   | Notes                                                        |
| --- | ----------------- | ----------------------------------------------------------------------------------- | ---------- | ------------------------------------------------------------ |
| 9.1 | `model/Hero.java` | Lombok `@Getter @Setter` on entity that has `getDamageMultipliers()` business logic | SUGGESTION | Domain behavior should not co-exist with raw property access |
| 9.2 | `model/Item.java` | Lombok `@Getter @Setter` on entity that has `getHash()` business method             | SUGGESTION | Same pattern                                                 |

**Note:** Removing `@Setter` from `Hero` is a high-risk change because `StatCalculator` calls `hero.setAtk()`, `hero.setHp()`, etc. directly. A migration to a builder/constructor approach is required first.

---

## Implementation Plan

All items are **advisory tracking**. Source code changes require separate task approval.

| Priority         | ID  | Item                                                                   | File                     | Effort |
| ---------------- | --- | ---------------------------------------------------------------------- | ------------------------ | ------ |
| High (IMPORTANT) | R6  | Add `GLOSSARY.md` documenting all stat abbreviations                   | new file                 | S      |
| High (IMPORTANT) | R7  | Extract `sortHeroes()` cases to private comparator methods             | `Sorter.java`            | M      |
| High (IMPORTANT) | R7  | Split `StatCalculator` into focused collaborators                      | `StatCalculator.java`    | L      |
| High (IMPORTANT) | R8  | Introduce `StatContext` parameter object                               | `StatCalculator.java`    | M      |
| Med (IMPORTANT)  | R8  | Handler dependency aggregate                                           | handlers                 | M      |
| Low (SUGGESTION) | R1  | Extract inner loops/cases to guard clauses                             | multiple                 | M      |
| Low (SUGGESTION) | R2  | Replace if/else with early returns                                     | `StatCalculator`, `Hero` | S      |
| Low (SUGGESTION) | R3  | Introduce `StatValue` wrapper (Java 14+ Records when available)        | `Hero`, `StatCalculator` | L      |
| Low (SUGGESTION) | R4  | Introduce collection wrappers (`BuildResults`, `Loadout`)              | `Hero`                   | M      |
| Low (SUGGESTION) | R9  | Remove `@Setter` from domain entities (requires constructor migration) | `Hero`, `Item`           | XL     |

---

## Progress Tracking

**Overall Status:** Not Started — 0%

### Subtasks

| ID  | Description                                       | Status      | Updated    | Notes                                         |
| --- | ------------------------------------------------- | ----------- | ---------- | --------------------------------------------- |
| 7.1 | Create `GLOSSARY.md` for all stat abbreviations   | Not Started | 2026-05-31 | Highest immediate value; no risk              |
| 7.2 | Extract `Sorter.sortHeroes()` comparators         | Not Started | 2026-05-31 | Isolated; low risk                            |
| 7.3 | Introduce `StatContext` parameter object          | Not Started | 2026-05-31 | Prerequisite for Rule 8 fix in StatCalculator |
| 7.4 | Split `StatCalculator` into focused collaborators | Not Started | 2026-05-31 | High impact; depends on 7.3                   |
| 7.5 | Handler dependency aggregate                      | Not Started | 2026-05-31 | Low priority; handlers are stable             |
| 7.6 | Early-return refactors (Rules 1, 2)               | Not Started | 2026-05-31 | Can be done incrementally per method          |
| 7.7 | Collection wrappers in Hero (Rule 4)              | Not Started | 2026-05-31 | Needs frontend JSON contract review           |
| 7.8 | Remove @Setter from domain entities (Rule 9)      | Not Started | 2026-05-31 | Requires constructor migration first          |

---

## Progress Log

### 2026-05-31

- Audit completed across all key domain and handler classes
- Findings documented per rule with severity, file paths, and recommended fix patterns
- No source code changes made; task status set to Pending
