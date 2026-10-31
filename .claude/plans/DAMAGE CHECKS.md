# Damage checks

What does not align between our damage model and [e7calc](https://e7calc.xyz/), compared 2026-10-30. Fill in
**Truth** from the game. Neither tool is assumed right. Background: project memory `e7calc-damage-reference`,
fix-list row `B33`. "Ours" hero data is `upstream/main` `herodata.json`; a newer cache in the app could differ.

`check first` means the row may be a rework, a slot difference or a matching error, so confirm the row is
real before spending time on it. Rows with no mark are the likeliest real differences.

## 1. How damage is calculated

Answering M1 settles the most, because it changes which builds rank first.

| ID  | Question                                                                                    | Ours                                                 | e7calc                                     | Truth |
| --- | ------------------------------------------------------------------------------------------- | ---------------------------------------------------- | ------------------------------------------ | ----- |
| M1  | Do Rage, Torrent and Fervor add to a skill's damage-up, or multiply it? Test a speed scaler | Multiply: 1.3375 × 1.3 = 1.739 at 300 speed          | Add: 1 + 0.3 + 0.3375 = 1.6375             |       |
| M2  | Crit damage cap                                                                             | 350%, or 400% with the PVE toggle, plus `cdCapBonus` | 350% only                                  |       |
| M3  | Does a skill's own crit boost go past the cap?                                              | Always past it                                       | Per skill: capped or uncapped              |       |
| M4  | Does aftermath damage land on a miss?                                                       | Always added                                         | Per hit type, usually not on a miss        |       |
| M5  | Does skill speed scaling also raise base damage as well as multiplying it?                  | Both (about +0.2 attack, looks accidental)           | Multiplier only                            |       |
| M6  | Does Pursuit raise aftermath and fixed damage?                                              | Not modeled                                          | +20%                                       |       |
| M7  | Do molagora and EE add to skill power?                                                      | Not modeled                                          | Yes, per skill level                       |       |
| M8  | Which BS formula is right? (`F30`)                                                          | CR ×1.5, CD ×1.125, uncapped, mains kept (CPU)       | Not in e7calc; our JS: ×1.6, ×1.14, capped |       |

**M9, team size:** which skills, artifacts or sets change with the number of allies or enemies, so that 3 in
Guild War and 4 in RTA give different numbers? List each one with its per-hero value. Our damage model has no
team size today: each row is damage to one target.

## 2. Penetration that changes with a stat gap

Ours uses a fixed value. e7calc scales it with the gap between you and the target.

| ID  | Hero and skill          | Ours  | e7calc                                    | Truth |
| --- | ----------------------- | ----- | ----------------------------------------- | ----- |
| D1  | Orte S3                 | 0.7   | speed gap × 0.003 + 0.3, max 0.7          |       |
| D2  | Blooming Lidica S3      | 1     | 0.5 + speed gap × 0.00296, max 1          |       |
| D3  | Top Model Luluca S3     | none  | 0.5 + speed gap × 0.0025, max 1           |       |
| D4  | Commander Pavel S3      | none  | attack gap × 0.000117, max 0.7            |       |
| D5  | Argent Waves Hwayoung   | check | attack gap × 0.000213, max 1, under id s2 |       |
| D6  | Midnight Gala Lilias S3 | none  | HP gap × 0.0000625                        |       |

## 3. Skill rate

| Hero                 | Skill | Ours | e7calc | Mark                                | Truth |
| -------------------- | ----- | ---- | ------ | ----------------------------------- | ----- |
| Carrot               | S3    | 1.1  | 1      |                                     |       |
| Claudia              | S1    | 0.9  | 1      |                                     |       |
| Coli                 | S1    | 1    | 0.8    |                                     |       |
| Holy Flame Adin      | S2    | 0.7  | 0.8    |                                     |       |
| Khawazu              | S3    | 1.8  | 1.5    |                                     |       |
| Melany               | S1    | 1.1  | 1      |                                     |       |
| Ray                  | S1    | 1    | 0.9    |                                     |       |
| Rem                  | S2    | 0.5  | 0.8    |                                     |       |
| Roozid               | S1    | 0.9  | 0.8    |                                     |       |
| Roozid               | S2    | 1.6  | 1.2    |                                     |       |
| Suthan               | S3    | 0.8  | 1.5    |                                     |       |
| Ainos                | S3    | 0.9  | 1      | check first: ours has skill options |       |
| Arowell              | S3    | 0.7  | 0.75   | check first: ours has skill options |       |
| Christy              | S1    | 1    | 1.1    | check first: rate and pow swapped   |       |
| Church of Ilryos Axe | S1    | 0.7  | 0.85   | check first: `_old` entry exists    |       |
| Emilia               | S1    | 1    | 0.95   | check first: rate and pow swapped   |       |
| Estelle              | S1    | 1    | 0.5    | check first: also has `s1_counter`  |       |
| Kawerik              | S1    | 0.9  | 1.2    | check first: `_old` entry exists    |       |
| Kawerik              | S3    | 0.8  | 1.1    | check first: `_old` entry exists    |       |
| Martial Artist Ken   | S2    | 0    | 0.95   | check first: ours is 0              |       |
| Mighty Scout         | S1    | 0    | 1      | check first: ours is 0              |       |
| Mighty Scout         | S2    | 0    | 1.35   | check first: ours is 0              |       |
| Researcher Carrot    | S3    | 1.1  | 1      | check first: ours has skill options |       |
| Romann               | S2    | 0.8  | 0.7    | check first: ours has skill options |       |
| Shadow Rose          | S3    | 1    | 1.05   | check first: `_old` entry exists    |       |
| Sonia                | S1    | 1.1  | 1      | check first: ours has skill options |       |
| Tamarinne            | S1    | 1.3  | 1      | check first: ours has skill options |       |

## 4. Skill pow

| Hero               | Skill | Ours | e7calc | Mark                              | Truth |
| ------------------ | ----- | ---- | ------ | --------------------------------- | ----- |
| Byblis             | S2    | 1    | 1.3    |                                   |       |
| Navy Captain Landy | S3    | 1    | 1.05   |                                   |       |
| Rem                | S2    | 1    | 1.3    |                                   |       |
| Suthan             | S3    | 1.1  | 0.9    |                                   |       |
| Tywin              | S1    | 1    | 0.95   |                                   |       |
| Wanderer Silk      | S3    | 1    | 0.8    |                                   |       |
| Celestial Mercedes | S2    | 0.9  | 1      | check first: `_old` entry exists  |       |
| Christy            | S1    | 1.1  | 1      | check first: rate and pow swapped |       |
| Emilia             | S1    | 0.95 | 1      | check first: rate and pow swapped |       |
| Mighty Scout       | S1    | 0    | 1      | check first: ours is 0            |       |
| Mighty Scout       | S2    | 0    | 1      | check first: ours is 0            |       |
| Schniel            | S3    | 1.1  | 1      | check first: `_old` entry exists  |       |

## 5. Skills where we have no rate

Not value mismatches. e7calc's names are its internal keys, so they are approximate.

| Hero                        | Skill               | e7calc rate / pow | Mark                                | Truth |
| --------------------------- | ------------------- | ----------------- | ----------------------------------- | ----- |
| Ezra                        | S2                  | 1 / 1             | check first: possible slot change   |       |
| Leah                        | S2 (Explosive Fire) | 1.2 / 0.95        | check first: likely passive or proc |       |
| Monarch of the Sword Iseria | S2 (Sword of Duty)  | 0.3 / 1           | check first: likely passive or proc |       |
| Navy Captain Landy          | S2 (Salvo Fire)     | 0.8 / 1.3         | check first: likely passive or proc |       |
| Riza Hawkeye                | S2                  | 2 / 1             | check first: possible slot change   |       |
| Senya                       | S2                  | 0 / 0             | check first: e7calc placeholder     |       |
| Silk                        | S2 (Automatic Fire) | 1.2 / 0.9         | check first: likely passive or proc |       |
| Wandering Prince Cidd       | S3                  | 0 / 0             | check first: e7calc placeholder     |       |
| Young Senya                 | S2 (Help)           | 1 / 1             | check first: likely passive or proc |       |

## 6. Fixed penetration

| Hero                  | Skill                  | Ours | e7calc | Mark                             | Truth |
| --------------------- | ---------------------- | ---- | ------ | -------------------------------- | ----- |
| Argent Waves Hwayoung | S2 (Swallow Kick)      | 0    | 0.5    | check first: named e7calc form   |       |
| Kawerik               | S3                     | 0.3  | 0.5    | check first: `_old` entry exists |       |
| Lethe                 | S2 (Call of the Abyss) | 0    | 1      | check first: named e7calc form   |       |
| Martial Artist Ken    | S2                     | 0    | 0.5    | check first: our rate is 0       |       |
| Mighty Scout          | S2                     | 0    | 0.7    | check first: our rate is 0       |       |
| Tidal Rift Elvira     | S1                     | 0    | 1      | check first: also has `s1_extra` |       |
| Tidal Rift Elvira     | S3                     | 0    | 1      | check first: also has `s1_extra` |       |
| Urban Shadow Choux    | S3                     | 0    | 0.5    | check first: `_old` entry exists |       |

## 7. Speed scaling

Per point of speed.

| Hero                   | Skill | Ours     | e7calc   | Truth |
| ---------------------- | ----- | -------- | -------- | ----- |
| Hataan                 | S2    | 0.001125 | 0.00125  |       |
| Righteous Thief Roozid | S2    | 0.0015   | 0.001125 |       |
| Roozid                 | S2    | 0.0015   | 0.001125 |       |

## 8. HP scaling

Share of max HP.

| Hero                 | Skill | Ours | e7calc | Mark                                | Truth |
| -------------------- | ----- | ---- | ------ | ----------------------------------- | ----- |
| Hasol                | S3    | 0.05 | 0.1    |                                     |       |
| Church of Ilryos Axe | S1    | 0.06 | 0.04   | check first: `_old` entry exists    |       |
| Estelle              | S1    | 0.16 | 0.08   | check first: also has `s1_counter`  |       |
| Shuna                | S1    | 0.09 | 0.025  | check first: ours has skill options |       |
| Urban Shadow Choux   | S3    | 0.25 | 0.2    | check first: `_old` entry exists    |       |

## 9. Single target or AOE

This decides whether the Penetration set's 15% applies. Marcus confirmed on 2026-10-30 that the set works on
single-target attacks only, which is how our code and e7calc treat it, so a wrong flag here gives or withholds
that 15%. S2 rows where ours says 1 may be placeholder data.

| Hero                  | Skill                    | Ours      | e7calc | Mark                            | Truth |
| --------------------- | ------------------------ | --------- | ------ | ------------------------------- | ----- |
| Armin                 | S1                       | 3 targets | single |                                 |       |
| Bad Cat Armin         | S1                       | 1 target  | AOE    |                                 |       |
| Benimaru              | S2                       | 1 target  | AOE    |                                 |       |
| Byblis                | S2                       | 1 target  | AOE    |                                 |       |
| Charlotte             | S1                       | 1 target  | AOE    |                                 |       |
| Clarissa              | S2                       | 1 target  | AOE    |                                 |       |
| Commander Pavel       | S2                       | 1 target  | AOE    |                                 |       |
| Edward Elric          | S2                       | 1 target  | AOE    |                                 |       |
| Holiday Yufine        | S1                       | 1 target  | AOE    |                                 |       |
| Holy Flame Adin       | S2                       | 1 target  | AOE    |                                 |       |
| Kayron                | S1                       | 1 target  | AOE    |                                 |       |
| Lone Crescent Bellona | S2                       | 1 target  | AOE    |                                 |       |
| Ocean Breeze Luluca   | S2                       | 1 target  | AOE    |                                 |       |
| Politis               | S2                       | 1 target  | AOE    |                                 |       |
| Rem                   | S2                       | 1 target  | AOE    |                                 |       |
| Savior Adin           | S2                       | 1 target  | AOE    |                                 |       |
| Albedo                | S2 (Let's Go Bicom)      | 1 target  | AOE    | check first: named e7calc form  |       |
| Fenris                | S2 (Soaring Arrow)       | 1 target  | AOE    | check first: named e7calc form  |       |
| Festive Eda           | S2 (Expected Outcome)    | 1 target  | AOE    | check first: named e7calc form  |       |
| Lethe                 | S2 (Call of the Abyss)   | 1 target  | AOE    | check first: named e7calc form  |       |
| Mighty Scout          | S1                       | none      | single | check first: our row is empty   |       |
| Mighty Scout          | S2                       | none      | single | check first: our row is empty   |       |
| Purrgis               | S2                       | 1 target  | AOE    | check first: form `s2_counter`  |       |
| Saria                 | S1                       | 2 targets | single | check first: maybe multi-target |       |
| Saria                 | S2 (Wings of Liberation) | 1 target  | AOE    | check first: named e7calc form  |       |
| Setsuka               | S2 (Blade Art)           | 1 target  | AOE    | check first: named e7calc form  |       |
| Tenebria              | S1                       | 2 targets | single | check first: maybe multi-target |       |

## Not compared

Skills whose e7calc value is a formula rather than a number, 10 of them for rate, were left out, along with
skills outside S1 to S3. `Renoa`, `Haru` and `Mei Lin` are in e7calc but not found in our data. `Kanna` may be
Bomb Model Kanna, and five more matched only on spelling, so none of those were compared.
