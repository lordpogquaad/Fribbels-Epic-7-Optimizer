package com.fribbels.gpu;

import com.fribbels.model.Hero;
import com.fribbels.model.HeroStats;
import com.fribbels.request.OptimizationRequest;

public class SetFormat000OptimizerKernel extends GpuOptimizerKernel {

        public SetFormat000OptimizerKernel(final OptimizationRequest request, final float[] flattenedWeaponAccs,
                        final float[] flattenedHelmetAccs, final float[] flattenedArmorAccs,
                        final float[] flattenedNecklaceAccs,
                        final float[] flattenedRingAccs, final float[] flattenedBootAccs, final float bonusBaseAtk,
                        final float bonusBaseDef, final float bonusBaseHp, final float atkSetBonus,
                        final float hpSetBonus,
                        final float defSetBonus, final float speedSetBonus, final float revengeSetBonus,
                        final float reversalSetBonus, final float weakeningSetBonus, final float penSetDmgBonus,
                        final float targetDefense,
                        final float bonusMaxAtk, final float bonusMaxDef, final float bonusMaxHp,
                        final int SETTING_RAGE_SET,
                        final int SETTING_PEN_SET, final int SETTING_FERVOR_SET, final HeroStats base,
                        final Hero hero, final long argSize,
                        final long wSize,
                        final long hSize, final long aSize, final long nSize, final long rSize, final long bSize,
                        final long max,
                        final long[] setSolutionBitMasks) {
                super(request, flattenedWeaponAccs, flattenedHelmetAccs, flattenedArmorAccs, flattenedNecklaceAccs,
                                flattenedRingAccs, flattenedBootAccs, bonusBaseAtk, bonusBaseDef, bonusBaseHp,
                                atkSetBonus, hpSetBonus,
                                defSetBonus, speedSetBonus, revengeSetBonus, reversalSetBonus, weakeningSetBonus,
                                penSetDmgBonus,
                                targetDefense,
                                bonusMaxAtk, bonusMaxDef, bonusMaxHp, SETTING_RAGE_SET, SETTING_PEN_SET,
                                SETTING_FERVOR_SET, base, hero,
                                argSize, wSize,
                                hSize, aSize, nSize, rSize, bSize, max, setSolutionBitMasks);
        }

        @Override
        public void run() {
                final int id = getGlobalId();

                final long i = max * iteration + id;
                if (i < wSize * hSize * aSize * nSize * rSize * bSize) {
                        final long b = i % bSize;
                        final long r = ((i - b) / bSize) % rSize;
                        final long n = ((i - r * bSize - b) / (bSize * rSize)) % nSize;
                        final long a = ((i - n * rSize * bSize - r * bSize - b) / (bSize * rSize * nSize)) % aSize;
                        final long h = ((i - a * nSize * rSize * bSize - n * rSize * bSize - r * bSize - b)
                                        / (bSize * rSize * nSize * aSize)) % hSize;
                        final long w = ((i - h * aSize * nSize * rSize * bSize - a * nSize * rSize * bSize
                                        - n * rSize * bSize
                                        - r * bSize - b) / (bSize * rSize * nSize * aSize * hSize)) % wSize;

                        final int wargSize = (int) (w * argSize);
                        final float wAtk = flattenedWeaponAccs[wargSize];
                        final float wHp = flattenedWeaponAccs[wargSize + 1];
                        final float wDef = flattenedWeaponAccs[wargSize + 2];
                        final float wCr = flattenedWeaponAccs[wargSize + 3];
                        final float wCd = flattenedWeaponAccs[wargSize + 4];
                        final float wEff = flattenedWeaponAccs[wargSize + 5];
                        final float wRes = flattenedWeaponAccs[wargSize + 6];
                        final float wSpeed = flattenedWeaponAccs[wargSize + 7];
                        final float wScore = flattenedWeaponAccs[wargSize + 8];
                        final float wSet = flattenedWeaponAccs[wargSize + 9];
                        final float wPrio = flattenedWeaponAccs[wargSize + 10];
                        final float wUpg = flattenedWeaponAccs[wargSize + 11];
                        final float wConv = flattenedWeaponAccs[wargSize + 12];
                        final float wEq = flattenedWeaponAccs[wargSize + 13];

                        final int hargSize = (int) (h * argSize);
                        final float hAtk = flattenedHelmetAccs[hargSize];
                        final float hHp = flattenedHelmetAccs[hargSize + 1];
                        final float hDef = flattenedHelmetAccs[hargSize + 2];
                        final float hCr = flattenedHelmetAccs[hargSize + 3];
                        final float hCd = flattenedHelmetAccs[hargSize + 4];
                        final float hEff = flattenedHelmetAccs[hargSize + 5];
                        final float hRes = flattenedHelmetAccs[hargSize + 6];
                        final float hSpeed = flattenedHelmetAccs[hargSize + 7];
                        final float hScore = flattenedHelmetAccs[hargSize + 8];
                        final float hSet = flattenedHelmetAccs[hargSize + 9];
                        final float hPrio = flattenedHelmetAccs[hargSize + 10];
                        final float hUpg = flattenedHelmetAccs[hargSize + 11];
                        final float hConv = flattenedHelmetAccs[hargSize + 12];
                        final float hEq = flattenedHelmetAccs[hargSize + 13];

                        final int aargSize = (int) (a * argSize);
                        final float aAtk = flattenedArmorAccs[aargSize];
                        final float aHp = flattenedArmorAccs[aargSize + 1];
                        final float aDef = flattenedArmorAccs[aargSize + 2];
                        final float aCr = flattenedArmorAccs[aargSize + 3];
                        final float aCd = flattenedArmorAccs[aargSize + 4];
                        final float aEff = flattenedArmorAccs[aargSize + 5];
                        final float aRes = flattenedArmorAccs[aargSize + 6];
                        final float aSpeed = flattenedArmorAccs[aargSize + 7];
                        final float aScore = flattenedArmorAccs[aargSize + 8];
                        final float aSet = flattenedArmorAccs[aargSize + 9];
                        final float aPrio = flattenedArmorAccs[aargSize + 10];
                        final float aUpg = flattenedArmorAccs[aargSize + 11];
                        final float aConv = flattenedArmorAccs[aargSize + 12];
                        final float aEq = flattenedArmorAccs[aargSize + 13];

                        final int nargSize = (int) (n * argSize);
                        final float nAtk = flattenedNecklaceAccs[nargSize];
                        final float nHp = flattenedNecklaceAccs[nargSize + 1];
                        final float nDef = flattenedNecklaceAccs[nargSize + 2];
                        final float nCr = flattenedNecklaceAccs[nargSize + 3];
                        final float nCd = flattenedNecklaceAccs[nargSize + 4];
                        final float nEff = flattenedNecklaceAccs[nargSize + 5];
                        final float nRes = flattenedNecklaceAccs[nargSize + 6];
                        final float nSpeed = flattenedNecklaceAccs[nargSize + 7];
                        final float nScore = flattenedNecklaceAccs[nargSize + 8];
                        final float nSet = flattenedNecklaceAccs[nargSize + 9];
                        final float nPrio = flattenedNecklaceAccs[nargSize + 10];
                        final float nUpg = flattenedNecklaceAccs[nargSize + 11];
                        final float nConv = flattenedNecklaceAccs[nargSize + 12];
                        final float nEq = flattenedNecklaceAccs[nargSize + 13];

                        final int rargSize = (int) (r * argSize);
                        final float rAtk = flattenedRingAccs[rargSize];
                        final float rHp = flattenedRingAccs[rargSize + 1];
                        final float rDef = flattenedRingAccs[rargSize + 2];
                        final float rCr = flattenedRingAccs[rargSize + 3];
                        final float rCd = flattenedRingAccs[rargSize + 4];
                        final float rEff = flattenedRingAccs[rargSize + 5];
                        final float rRes = flattenedRingAccs[rargSize + 6];
                        final float rSpeed = flattenedRingAccs[rargSize + 7];
                        final float rScore = flattenedRingAccs[rargSize + 8];
                        final float rSet = flattenedRingAccs[rargSize + 9];
                        final float rPrio = flattenedRingAccs[rargSize + 10];
                        final float rUpg = flattenedRingAccs[rargSize + 11];
                        final float rConv = flattenedRingAccs[rargSize + 12];
                        final float rEq = flattenedRingAccs[rargSize + 13];

                        final int bargSize = (int) (b * argSize);
                        final float bAtk = flattenedBootAccs[bargSize];
                        final float bHp = flattenedBootAccs[bargSize + 1];
                        final float bDef = flattenedBootAccs[bargSize + 2];
                        final float bCr = flattenedBootAccs[bargSize + 3];
                        final float bCd = flattenedBootAccs[bargSize + 4];
                        final float bEff = flattenedBootAccs[bargSize + 5];
                        final float bRes = flattenedBootAccs[bargSize + 6];
                        final float bSpeed = flattenedBootAccs[bargSize + 7];
                        final float bScore = flattenedBootAccs[bargSize + 8];
                        final float bSet = flattenedBootAccs[bargSize + 9];
                        final float bPrio = flattenedBootAccs[bargSize + 10];
                        final float bUpg = flattenedBootAccs[bargSize + 11];
                        final float bConv = flattenedBootAccs[bargSize + 12];
                        final float bEq = flattenedBootAccs[bargSize + 13];

                        final int iWset = (int) wSet;
                        final int iHset = (int) hSet;
                        final int iAset = (int) aSet;
                        final int iNset = (int) nSet;
                        final int iRset = (int) rSet;
                        final int iBset = (int) bSet;

                        final int setIndex = iWset * 7962624
                                        + iHset * 331776
                                        + iAset * 13824
                                        + iNset * 576
                                        + iRset * 24
                                        + iBset;

                        final int hpSet = (int) ((setSolutionBitMasks[setIndex] & 1L)
                                        + ((setSolutionBitMasks[setIndex] >>> 1) & 1L)
                                        + ((setSolutionBitMasks[setIndex] >>> 2) & 1L));
                        final int defSet = (int) (((setSolutionBitMasks[setIndex] >>> 3) & 1L)
                                        + ((setSolutionBitMasks[setIndex] >>> 4) & 1L)
                                        + ((setSolutionBitMasks[setIndex] >>> 5) & 1L));
                        final int atkSet = (int) ((setSolutionBitMasks[setIndex] >>> 6) & 1L);
                        final int speedSet = (int) ((setSolutionBitMasks[setIndex] >>> 7) & 1L);
                        final int crSet = (int) (((setSolutionBitMasks[setIndex] >>> 8) & 1L)
                                        + ((setSolutionBitMasks[setIndex] >>> 9) & 1L)
                                        + ((setSolutionBitMasks[setIndex] >>> 10) & 1L));
                        final int effSet = (int) (((setSolutionBitMasks[setIndex] >>> 11) & 1L)
                                        + ((setSolutionBitMasks[setIndex] >>> 12) & 1L)
                                        + ((setSolutionBitMasks[setIndex] >>> 13) & 1L));
                        final int cdSet = (int) ((setSolutionBitMasks[setIndex] >>> 14) & 1L);
                        final int resSet = (int) (((setSolutionBitMasks[setIndex] >>> 17) & 1L)
                                        + ((setSolutionBitMasks[setIndex] >>> 18) & 1L)
                                        + ((setSolutionBitMasks[setIndex] >>> 19) & 1L));
                        final int rageSet = (int) ((setSolutionBitMasks[setIndex] >>> 21) & 1L);
                        final int penSet = (int) ((setSolutionBitMasks[setIndex] >>> 23) & 1L);
                        final int revengeSet = (int) ((setSolutionBitMasks[setIndex] >>> 24) & 1L);
                        // final int protectionSet = (int)((setSolutionBitMasks[setIndex] >>> 25) & 1L);
                        // final int injurySet = (int)((setSolutionBitMasks[setIndex] >>> 26) & 1L);
                        final int torrentSet = (int) (((setSolutionBitMasks[setIndex] >>> 27) & 1L)
                                        + ((setSolutionBitMasks[setIndex] >>> 28) & 1L)
                                        + ((setSolutionBitMasks[setIndex] >>> 29) & 1L));
                        final int reversalSet = (int) ((setSolutionBitMasks[setIndex] >>> 30) & 1L);
                        final int warfareSet = (int) ((setSolutionBitMasks[setIndex] >>> 32) & 1L);
                        // final int pursuitSet = (int) ((setSolutionBitMasks[setIndex] >>> 33) & 1L);
                        final int fervorSet = (int) ((setSolutionBitMasks[setIndex] >>> 34) & 1L);
                        final int weakeningSet = (int) ((setSolutionBitMasks[setIndex] >>> 35) & 1L);

                        // === Phase 1: Cheap integer stats: CR, CD, EFF, RES ===
                        final int cr = (int) (baseCr + wCr + hCr + aCr + nCr + rCr + bCr + (crSet * 12) + bonusCr
                                        + aeiCr);
                        final int cd = (int) (baseCd + wCd + hCd + aCd + nCd + rCd + bCd + (cdSet * 60) + bonusCd
                                        + aeiCd);
                        final int eff = (int) (baseEff + wEff + hEff + aEff + nEff + rEff + bEff + (effSet * 20)
                                        + bonusEff
                                        + aeiEff);
                        final int res = (int) (baseRes + wRes + hRes + aRes + nRes + rRes + bRes + (resSet * 20)
                                        + bonusRes
                                        + aeiRes);
                        if (cr < inputCrMinLimit || cr > inputCrMaxLimit
                                        || cd < inputCdMinLimit || cd > inputCdMaxLimit
                                        || eff < inputEffMinLimit || eff > inputEffMaxLimit
                                        || res < inputResMinLimit || res > inputResMaxLimit) {
                                passes[id] = false;
                                return;
                        }

                        // === Phase 2: Float stats: ATK, HP, DEF, SPD ===
                        final float atk = ((bonusBaseAtk + wAtk + hAtk + aAtk + nAtk + rAtk + bAtk
                                        + (atkSet * atkSetBonus))
                                        * bonusMaxAtk);
                        final float hp = ((bonusBaseHp + wHp + hHp + aHp + nHp + rHp + bHp
                                        + (hpSet * hpSetBonus + warfareSet * hpSetBonus + torrentSet * hpSetBonus / -2))
                                        * bonusMaxHp);
                        final float def = ((bonusBaseDef + wDef + hDef + aDef + nDef + rDef + bDef
                                        + (defSet * defSetBonus))
                                        * bonusMaxDef);
                        final int spd = (int) (baseSpeed + wSpeed + hSpeed + aSpeed + nSpeed + rSpeed + bSpeed
                                        + (speedSet * speedSetBonus) + (revengeSet * revengeSetBonus)
                                        + (reversalSet * reversalSetBonus) + (weakeningSet * weakeningSetBonus)
                                        + bonusSpeed + aeiSpeed);
                        if (atk < inputAtkMinLimit || atk > inputAtkMaxLimit
                                        || hp < inputHpMinLimit || hp > inputHpMaxLimit
                                        || def < inputDefMinLimit || def > inputDefMaxLimit
                                        || spd < inputSpdMinLimit || spd > inputSpdMaxLimit) {
                                passes[id] = false;
                                return;
                        }

                        // === Phase 3: CP ===
                        final float critRate = min(100, cr) / 100f;
                        // CP always uses the standard 350 cap; damage stats use the selectable
                        // cap (400 under the PVE toggle), so the two intentionally diverge.
                        final float cpCritDamage = min(350 + cdCapBonus, cd) / 100f;
                        final float critDamage = min(damageCritDamageCap + cdCapBonus, cd) / 100f;
                        final int cp = (int) (((atk * 1.6f + atk * 1.6f * critRate * cpCritDamage)
                                        * (1.0 + (spd - 45f) * 0.02f) + hp
                                        + def * 9.3f) * (1f + (res / 100f + eff / 100f) / 4f));
                        if (cp < inputMinCpLimit || cp > inputMaxCpLimit) {
                                passes[id] = false;
                                return;
                        }

                        // === Phase 4: Derived damage stats ===
                        final float penSetOn = min(penSet, 1);
                        final float fervorSetOn = min(fervorSet, 1);
                        final float rageMultiplier = max(0, rageSet * SETTING_RAGE_SET * 0.3f);
                        final float penMultiplier = max(1, penSetOn * SETTING_PEN_SET * penSetDmgBonus);
                        final float torrentMultiplier = max(0, torrentSet * 0.1f);
                        // Fervor 2pc: +20% damage. fervorSetOn mirrors the penSetOn defensive
                        // clamp (bit 34 is already 0/1, but never stacks past ×1).
                        final float fervorMultiplier = max(0, fervorSetOn * SETTING_FERVOR_SET * 0.2f);
                        final float spdDiv1000 = (float) spd / 1000;
                        final float pctDmgMultiplier = 1 + rageMultiplier + torrentMultiplier + fervorMultiplier;

                        final int ehp = (int) (hp * (def / 300 + 1));
                        final int hpps = (int) (hp * spdDiv1000);
                        final int ehpps = (int) ((float) ehp * spdDiv1000);
                        final int dmg = (int) (((critRate * atk * critDamage) + (1 - critRate) * atk) * penMultiplier
                                        * pctDmgMultiplier);
                        final int dmgps = (int) ((float) dmg * spdDiv1000);
                        final int mcdmg = (int) (atk * critDamage * penMultiplier * pctDmgMultiplier);
                        final int mcdmgps = (int) ((float) mcdmg * spdDiv1000);
                        final int dmgh = (int) ((critDamage * hp * penMultiplier * pctDmgMultiplier) / 10);
                        final int dmgd = (int) ((critDamage * def * penMultiplier * pctDmgMultiplier));
                        final int hmcdmgs = (int) ((float) dmgh * spdDiv1000);
                        final int dmcdmgs = (int) ((float) dmgd * spdDiv1000);
                        final int hdmg = (int) (((critRate * hp / 10f * critDamage) + (1 - critRate) * hp / 10f)
                                        * penMultiplier * pctDmgMultiplier);
                        final int hdmgs = (int) ((float) hdmg * spdDiv1000);
                        final int ddmg = (int) (((critRate * def * critDamage) + (1 - critRate) * def) * penMultiplier
                                        * pctDmgMultiplier);
                        final int ddmgs = (int) ((float) ddmg * spdDiv1000);
                        if (hpps < inputMinHppsLimit || hpps > inputMaxHppsLimit
                                        || ehp < inputMinEhpLimit || ehp > inputMaxEhpLimit
                                        || ehpps < inputMinEhppsLimit || ehpps > inputMaxEhppsLimit
                                        || dmg < inputMinDmgLimit || dmg > inputMaxDmgLimit
                                        || dmgps < inputMinDmgpsLimit || dmgps > inputMaxDmgpsLimit
                                        || mcdmg < inputMinMcdmgLimit || mcdmg > inputMaxMcdmgLimit
                                        || mcdmgps < inputMinMcdmgpsLimit || mcdmgps > inputMaxMcdmgpsLimit
                                        || dmgh < inputMinDmgHLimit || dmgh > inputMaxDmgHLimit
                                        || dmgd < inputMinDmgDLimit || dmgd > inputMaxDmgDLimit
                                        || hmcdmgs < inputMinHmcdmgsLimit || hmcdmgs > inputMaxHmcdmgsLimit
                                        || dmcdmgs < inputMinDmcdmgsLimit || dmcdmgs > inputMaxDmcdmgsLimit
                                        || hdmg < inputMinHdmgLimit || hdmg > inputMaxHdmgLimit
                                        || hdmgs < inputMinHdmgsLimit || hdmgs > inputMaxHdmgsLimit
                                        || ddmg < inputMinDdmgLimit || ddmg > inputMaxDdmgLimit
                                        || ddmgs < inputMinDdmgsLimit || ddmgs > inputMaxDdmgsLimit) {
                                passes[id] = false;
                                return;
                        }

                        // === Phase 5: Score/priority/upgrades/conversions/eq (cheap sums) ===
                        final int score = (int) (wScore + hScore + aScore + nScore + rScore + bScore);
                        final int priority = (int) (wPrio + hPrio + aPrio + nPrio + rPrio + bPrio);
                        final int upgrades = (int) (wUpg + hUpg + aUpg + nUpg + rUpg + bUpg);
                        final int conversions = (int) (wConv + hConv + aConv + nConv + rConv + bConv);
                        final int eq = (int) (wEq + hEq + aEq + nEq + rEq + bEq);
                        if (score < inputMinScoreLimit || score > inputMaxScoreLimit
                                        || priority < inputMinPriorityLimit || priority > inputMaxPriorityLimit
                                        || upgrades < inputMinUpgradesLimit || upgrades > inputMaxUpgradesLimit
                                        || conversions < inputMinConversionsLimit
                                        || conversions > inputMaxConversionsLimit
                                        || eq < inputMinEquippedLimit || eq > inputMaxEquippedLimit) {
                                passes[id] = false;
                                return;
                        }

                        // === Phase 6: Expensive skill damage (getSkillValue x3) ===
                        final int s1 = getSkillValue(0, atk, def, hp, spd, critDamage, pctDmgMultiplier, penSetOn);
                        final int s2 = getSkillValue(1, atk, def, hp, spd, critDamage, pctDmgMultiplier, penSetOn);
                        final int s3 = getSkillValue(2, atk, def, hp, spd, critDamage, pctDmgMultiplier, penSetOn);
                        if (s1 < inputMinS1Limit || s1 > inputMaxS1Limit
                                        || s2 < inputMinS2Limit || s2 > inputMaxS2Limit
                                        || s3 < inputMinS3Limit || s3 > inputMaxS3Limit) {
                                passes[id] = false;
                                return;
                        }

                        // === Phase 7: Build score (float divisions) ===
                        final float bsHp = (hp - baseHp - artifactHealth - (hpSet * hpSetBonus)
                                        - (warfareSet * hpSetBonus)
                                        + (torrentSet * hpSetBonus / 2)) / baseHp * 100;
                        final float bsAtk = (atk - baseAtk - artifactAttack - (atkSet * atkSetBonus)) / baseAtk * 100;
                        final float bsDef = (def - baseDef - artifactDefense - (defSet * defSetBonus)) / baseDef * 100;
                        final float bsCr = (cr - baseCr - (crSet * 12));
                        final float bsCd = (cd - baseCd - (cdSet * 60));
                        final float bsEff = (eff - baseEff - (effSet * 20));
                        final float bsRes = (res - baseRes - (resSet * 20));
                        final float bsSpd = (spd - baseSpeed - (speedSet * speedSetBonus)
                                        - (revengeSet * revengeSetBonus)
                                        - (reversalSet * reversalSetBonus)
                                        - (weakeningSet * weakeningSetBonus));
                        final int bs = (int) (bsHp + bsAtk + bsDef + bsCr * 1.5f + bsCd * 1.125f + bsEff + bsRes
                                        + bsSpd * 2);
                        if (bs < inputMinBSLimit || bs > inputMaxBSLimit) {
                                passes[id] = false;
                                return;
                        }

                        passes[id] = true;
                }
        }

        @Override
        protected int getSkillValue(final int s,
                        final float atk,
                        final float def,
                        final float hp,
                        final float spd,
                        final float critDamage,
                        final float pctDmgMultiplier,
                        final float penSetOn) {
                final float realPenetration = (1 - penetration[s]) * (1 - penSetOn * 0.15f * targets[s]);
                final float statScalings = selfHpScaling[s] * hp +
                                selfAtkScaling[s] * atk +
                                selfDefScaling[s] * def +
                                selfSpdScaling[s] * spd;
                final float hitTypeMultis = crit[s] * (critDamage + cdmgIncrease[s]) + hitMulti[s];
                final float increasedValueMulti = 1 + increasedValue[s];
                final float dmgUpMod = 1 + selfSpdScaling[s] * spd;
                final float extraDamage = (extraSelfHpScaling[s] * hp +
                                extraSelfAtkScaling[s] * atk +
                                extraSelfDefScaling[s] * def) * 1.871f * 1f / (targetDefense * 0.3f / 300f + 1f);
                final float offensiveValue = (atk * rate[s] + statScalings) * 1.871f * pow[s] * increasedValueMulti
                                * hitTypeMultis * dmgUpMod * pctDmgMultiplier;
                final float supportValue = selfHpScaling[s] * hp * support[s] + selfAtkScaling[s] * atk * support[s]
                                + selfDefScaling[s] * def * support[s];
                final float defensiveValue = 1f / (targetDefense * max(0, realPenetration) / 300f + 1f);
                return (int) (offensiveValue * defensiveValue + supportValue + extraDamage);
        }
}
