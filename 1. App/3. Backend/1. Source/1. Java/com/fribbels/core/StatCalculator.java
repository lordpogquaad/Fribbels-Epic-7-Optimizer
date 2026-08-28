package com.fribbels.core;

import com.fribbels.enums.StatType;
import com.fribbels.model.*;
import com.fribbels.request.OptimizationRequest;

import java.util.Map;
import java.util.Objects;

import static com.fribbels.enums.Set.SET_COUNT;

public class StatCalculator {

    private static final int STANDARD_CRIT_DAMAGE_CAP = 350;
    private static final int PVE_CRIT_DAMAGE_CAP = 400;

    public static volatile boolean SETTING_RAGE_SET = true;
    public static volatile boolean SETTING_PEN_SET = true;
    public static volatile boolean SETTING_FERVOR_SET = true;
    public static volatile int SETTING_PEN_DEFENSE = 1500;

    private float atkSetBonus;
    private float hpSetBonus;
    private float defSetBonus;
    private float speedSetBonus;
    private float revengeSetBonus;
    private float reversalSetBonus;
    private float weakeningSetBonus;

    private float bonusBaseAtk;
    private float bonusBaseHp;
    private float bonusBaseDef;

    private float bonusMaxAtk;
    private float bonusMaxHp;
    private float bonusMaxDef;

    private float penSetDmgBonus;
    private int damageCritDamageCap = STANDARD_CRIT_DAMAGE_CAP;

    private double priorityAtk;
    private double priorityHp;
    private double priorityDef;
    private double prioritySpd;
    private double priorityCr;
    private double priorityCd;
    private double priorityEff;
    private double priorityRes;

    // Stat targets (min = inputXxxMinTarget, max = inputXxxTarget, med =
    // inputXxxSweetTarget),
    // mirroring the frontend calculateBuildScore target-bonus logic. Captured per
    // run via
    // setTargets(); 0 means "no target". A target counts even when the matching
    // priority is 0
    // (setting a target is itself the "I care about this value" signal) — the bonus
    // uses an
    // implicit weight of 1 there, while positive priorities scale it.
    private double targetAtk, targetAtkMin, targetAtkMed;
    private double targetHp, targetHpMin, targetHpMed;
    private double targetDef, targetDefMin, targetDefMed;
    private double targetSpd, targetSpdMin, targetSpdMed;
    private double targetCr, targetCrMin, targetCrMed;
    private double targetCd, targetCdMin, targetCdMed;
    private double targetEff, targetEffMin, targetEffMed;
    private double targetRes, targetResMin, targetResMed;

    // Per-stat "target priority" rank multipliers, derived from the per-hero ranks
    // + the
    // tunable scale (rank 1 = highest → biggest multiplier; unranked or scale 0 →
    // ×1).
    // Captured in setTargets(); multiply each stat's target bonus.
    private double rankFactorAtk = 1, rankFactorHp = 1, rankFactorDef = 1, rankFactorSpd = 1;
    private double rankFactorCr = 1, rankFactorCd = 1, rankFactorEff = 1, rankFactorRes = 1;

    public StatCalculator() {

    }

    public void setUsePvECritDamageCap(final boolean usePvECritDamageCap) {
        damageCritDamageCap = usePvECritDamageCap ? PVE_CRIT_DAMAGE_CAP : STANDARD_CRIT_DAMAGE_CAP;
    }

    public void setBaseValues(final HeroStats base, final Hero hero) {
        atkSetBonus = 0.45f * base.atk;
        hpSetBonus = 0.20f * base.hp;
        defSetBonus = 0.20f * base.def;

        speedSetBonus = 0.25f * base.spd;
        revengeSetBonus = 0.12f * base.spd;
        reversalSetBonus = 0.15f * base.spd;
        weakeningSetBonus = 0.15f * base.spd;

        bonusBaseAtk = base.atk + base.atk * (hero.bonusAtkPercent + hero.aeiAtkPercent) / 100f + hero.bonusAtk
                + hero.aeiAtk;
        bonusBaseHp = base.hp + base.hp * (hero.bonusHpPercent + hero.aeiHpPercent) / 100f + hero.bonusHp + hero.aeiHp;
        bonusBaseDef = base.def + base.def * (hero.bonusDefPercent + hero.aeiDefPercent) / 100f + hero.bonusDef
                + hero.aeiDef;

        if (base.bonusStats == null) {
            bonusMaxAtk = 1 + hero.finalAtkMultiplier / 100;
            bonusMaxHp = 1 + hero.finalHpMultiplier / 100;
            bonusMaxDef = 1 + hero.finalDefMultiplier / 100;
        } else {
            bonusMaxAtk = 1 + base.bonusStats.bonusMaxAtkPercent / 100f + hero.finalAtkMultiplier / 100;
            bonusMaxHp = 1 + base.bonusStats.bonusMaxHpPercent / 100f + hero.finalHpMultiplier / 100;
            bonusMaxDef = 1 + base.bonusStats.bonusMaxDefPercent / 100f + hero.finalDefMultiplier / 100;
        }

        penSetDmgBonus = (SETTING_PEN_DEFENSE / 300f + 1) / (0.00283333f * SETTING_PEN_DEFENSE + 1);
    }

    public void setPriorityWeights(final OptimizationRequest request) {
        priorityAtk = request.getInputAtkPriority() != null ? request.getInputAtkPriority() : 0;
        priorityHp = request.getInputHpPriority() != null ? request.getInputHpPriority() : 0;
        priorityDef = request.getInputDefPriority() != null ? request.getInputDefPriority() : 0;
        prioritySpd = request.getInputSpdPriority() != null ? request.getInputSpdPriority() : 0;
        priorityCr = request.getInputCrPriority() != null ? request.getInputCrPriority() : 0;
        priorityCd = request.getInputCdPriority() != null ? request.getInputCdPriority() : 0;
        priorityEff = request.getInputEffPriority() != null ? request.getInputEffPriority() : 0;
        priorityRes = request.getInputResPriority() != null ? request.getInputResPriority() : 0;
    }

    public void setTargets(final OptimizationRequest request) {
        targetAtk = request.getInputAtkTarget();
        targetAtkMin = request.getInputAtkMinTarget();
        targetAtkMed = request.getInputAtkSweetTarget();
        targetHp = request.getInputHpTarget();
        targetHpMin = request.getInputHpMinTarget();
        targetHpMed = request.getInputHpSweetTarget();
        targetDef = request.getInputDefTarget();
        targetDefMin = request.getInputDefMinTarget();
        targetDefMed = request.getInputDefSweetTarget();
        targetSpd = request.getInputSpdTarget();
        targetSpdMin = request.getInputSpdMinTarget();
        targetSpdMed = request.getInputSpdSweetTarget();
        targetCr = request.getInputCrTarget();
        targetCrMin = request.getInputCrMinTarget();
        targetCrMed = request.getInputCrSweetTarget();
        targetCd = request.getInputCdTarget();
        targetCdMin = request.getInputCdMinTarget();
        targetCdMed = request.getInputCdSweetTarget();
        targetEff = request.getInputEffTarget();
        targetEffMin = request.getInputEffMinTarget();
        targetEffMed = request.getInputEffSweetTarget();
        targetRes = request.getInputResTarget();
        targetResMin = request.getInputResMinTarget();
        targetResMed = request.getInputResSweetTarget();

        // Target-priority rank multipliers (per-hero ranks × tunable scale).
        final double rankScale = request.getInputTargetRankScale();
        rankFactorAtk = rankFactor(request.getInputAtkTargetRank(), rankScale);
        rankFactorHp = rankFactor(request.getInputHpTargetRank(), rankScale);
        rankFactorDef = rankFactor(request.getInputDefTargetRank(), rankScale);
        rankFactorSpd = rankFactor(request.getInputSpdTargetRank(), rankScale);
        rankFactorCr = rankFactor(request.getInputCrTargetRank(), rankScale);
        rankFactorCd = rankFactor(request.getInputCdTargetRank(), rankScale);
        rankFactorEff = rankFactor(request.getInputEffTargetRank(), rankScale);
        rankFactorRes = rankFactor(request.getInputResTargetRank(), rankScale);
    }

    // Target-priority multiplier for a stat: rank 1 (highest) gets the biggest
    // boost,
    // higher rank numbers less; unranked (0) or scale 0 → ×1 (no effect).
    private static double rankFactor(final int rank, final double scale) {
        return rank > 0 ? 1 + (8 - rank) * scale : 1;
    }

    // ── Target-bonus helpers (exact port of priorityFilter.calculateBuildScore)
    // ──────
    // minT = inputXxxMinTarget, maxT = inputXxxTarget. Below min: linear partial
    // credit;
    // within [min,max] (or at a single target): full credit (1); above: slight 0.1×
    // bonus.
    private static double targetRatio(final double stat, final double target) {
        final double r = stat / target;
        return r >= 1 ? 1 + (r - 1) * 0.1 : r;
    }

    // Sweet-spot ("median target") gentle nudge: an ADDITIVE bonus on top of the
    // in-range
    // plateau — largest at the median (medT) and tapering linearly to 0 at the
    // min/max
    // edges. No-op when medT is unset (≤0) or not strictly inside (minT, maxT), so
    // the
    // curve is identical to before. SWEET_PEAK is in priority units (like the
    // plateau's
    // 1.0), so a build on the median earns up to +SWEET_PEAK × priority extra.
    private static final double SWEET_PEAK = 0.5;

    private static double sweetSpotBonus(final double stat, final double minT, final double medT,
            final double maxT) {
        if (!(medT > minT && medT < maxT))
            return 0; // need a valid median strictly inside the range
        if (stat <= minT || stat >= maxT)
            return 0; // no bonus at or outside the edges
        final double t = stat <= medT
                ? (stat - minT) / (medT - minT) // rising edge: 0 at min → 1 at median
                : (maxT - stat) / (maxT - medT); // falling edge: 1 at median → 0 at max
        return SWEET_PEAK * t;
    }

    private static double targetRangeRatio(final double stat, final double minT, final double medT,
            final double maxT) {
        final double base;
        if (stat >= minT && stat <= maxT)
            base = 1;
        else if (stat < minT)
            base = stat / minT;
        else
            base = 1 + (stat / maxT - 1) * 0.1; // stat > maxT — slight bonus for exceeding
        return base + sweetSpotBonus(stat, minT, medT, maxT);
    }

    private static double statTargetBonus(final double stat, final double minT, final double medT,
            final double maxT, final double priority) {
        final boolean hasMin = minT > 0;
        final boolean hasMax = maxT > 0;
        if (!hasMin && !hasMax)
            return 0;
        // A target counts even at priority 0 — use an implicit weight of 1 for the
        // bonus
        // (rolls stay unweighted via weightedScore); positive priorities scale it as
        // before.
        final double p = priority > 0 ? priority : 1;
        // Median sweet-spot only applies within a full [min,max] range.
        if (hasMin && hasMax)
            return targetRangeRatio(stat, minT, medT, maxT) * p;
        if (hasMin)
            return targetRatio(stat, minT) * p;
        return targetRatio(stat, maxT) * p;
    }

    public HeroStats addAccumulatorArrsToHero(final HeroStats base,
            final float[][] accs,
            final int[] sets,
            final Hero hero,
            final int upgrades,
            final int conversions,
            final int alreadyEquipped,
            final int priority,
            final int weightedScore) {
        final float[] accs0 = accs[0];
        final float[] accs1 = accs[1];
        final float[] accs2 = accs[2];
        final float[] accs3 = accs[3];
        final float[] accs4 = accs[4];
        final float[] accs5 = accs[5];

        final float atk = ((bonusBaseAtk + accs0[0] + accs1[0] + accs2[0] + accs3[0] + accs4[0] + accs5[0]
                + (sets[2] > 3 ? atkSetBonus : 0)) * bonusMaxAtk);
        final float hp = ((bonusBaseHp + accs0[1] + accs1[1] + accs2[1] + accs3[1] + accs4[1] + accs5[1]
                + (sets[0] > 1 ? sets[0] / 2 * hpSetBonus : 0) + (sets[20] > 3 ? hpSetBonus : 0)
                + (sets[17] > 1 ? sets[17] / 2 * hpSetBonus / -2 : 0)) * bonusMaxHp);
        final float def = ((bonusBaseDef + accs0[2] + accs1[2] + accs2[2] + accs3[2] + accs4[2] + accs5[2]
                + (sets[1] > 1 ? sets[1] / 2 * defSetBonus : 0)) * bonusMaxDef);
        final float cr = (base.cr + accs0[6] + accs1[6] + accs2[6] + accs3[6] + accs4[6] + accs5[6]
                + (sets[4] > 1 ? sets[4] / 2 * 12 : 0) + hero.bonusCr + hero.aeiCr);
        final int cd = (int) (base.cd + accs0[7] + accs1[7] + accs2[7] + accs3[7] + accs4[7] + accs5[7]
                + (sets[6] > 3 ? 60 : 0) + hero.bonusCd + hero.aeiCd);
        final int eff = (int) (base.eff + accs0[8] + accs1[8] + accs2[8] + accs3[8] + accs4[8] + accs5[8]
                + (sets[5] > 1 ? sets[5] / 2 * 20 : 0) + hero.bonusEff + hero.aeiEff);
        final int res = (int) (base.res + accs0[9] + accs1[9] + accs2[9] + accs3[9] + accs4[9] + accs5[9]
                + (sets[9] > 1 ? sets[9] / 2 * 20 : 0) + hero.bonusRes + hero.aeiRes);
        final int spd = (int) (base.spd + accs0[10] + accs1[10] + accs2[10] + accs3[10] + accs4[10] + accs5[10]
                + (sets[3] > 3 ? speedSetBonus : 0) + (sets[14] > 3 ? revengeSetBonus : 0)
                + (sets[18] > 3 ? reversalSetBonus : 0) + (sets[23] > 3 ? weakeningSetBonus : 0) + hero.bonusSpeed
                + hero.aeiSpeed);

        final float critRate;
        if (cr > 100) {
            critRate = 1;
        } else {
            critRate = cr / 100f;
        }

        // CP always uses the standard 350 cap (+ per-hero cdCapBonus); damage stats use
        // the selectable cap (400 under the PVE toggle) so the two intentionally diverge.
        final int cpCdCap = STANDARD_CRIT_DAMAGE_CAP + hero.cdCapBonus;
        final float cpCritDamage = cd > cpCdCap ? cpCdCap / 100f : cd / 100f;

        final float critDamage;
        final int dmgCdCap = damageCritDamageCap + hero.cdCapBonus;
        if (cd > dmgCdCap) {
            critDamage = dmgCdCap / 100f;
        } else {
            critDamage = cd / 100f;
        }

        final int cp = (int) (((atk * 1.6f + atk * 1.6f * critRate * cpCritDamage) * (1.0 + (spd - 45f) * 0.02f) + hp
                + def * 9.3f) * (1f + (res / 100f + eff / 100f) / 4f));

        final float penSetOn = sets[13] > 1 ? 1 : 0;
        final float rageMultiplier = SETTING_RAGE_SET && sets[11] > 3 ? 0.3f : 0;
        final float penMultiplier = SETTING_PEN_SET && sets[13] > 1 ? penSetDmgBonus : 1;
        final float torrentMultiplier = sets[17] > 1 ? sets[17] / 2 * 0.1f : 0;
        // Fervor 2pc: +20% damage on the next attack after an extra turn — modeled as an
        // always-on additive term (does not stack: sets[22] is 0/1/2, never counted twice).
        final float fervorMultiplier = SETTING_FERVOR_SET && sets[22] > 1 ? 0.2f : 0;
        final float spdDiv1000 = (float) spd / 1000;
        final float pctDmgMultiplier = 1 + rageMultiplier + torrentMultiplier + fervorMultiplier;

        final int ihp = (int) hp;
        final int idef = (int) def;
        final int iatk = (int) atk;
        final int ehp = (int) (ihp * (idef / 300.0f + 1));
        final int hpps = (int) (ihp * spdDiv1000);
        final int ehpps = (int) ((float) ehp * spdDiv1000);
        final int dmg = (int) (((critRate * iatk * critDamage) + (1 - critRate) * iatk) * penMultiplier
                * pctDmgMultiplier);
        final int dmgps = (int) ((float) dmg * spdDiv1000);
        final int mcdmg = (int) (iatk * critDamage * penMultiplier * pctDmgMultiplier);
        final int mcdmgps = (int) ((float) mcdmg * spdDiv1000);
        final int dmgh = (int) ((critDamage * ihp) / 10 * penMultiplier * pctDmgMultiplier);
        final int dmgd = (int) ((critDamage * idef) * penMultiplier * pctDmgMultiplier);
        final int hmcdmgs = (int) ((float) dmgh * spdDiv1000);
        final int dmcdmgs = (int) ((float) dmgd * spdDiv1000);
        final int hdmg = (int) (((critRate * ihp / 10f * critDamage) + (1 - critRate) * ihp / 10f) * penMultiplier
                * pctDmgMultiplier);
        final int hdmgs = (int) ((float) hdmg * spdDiv1000);
        final int ddmg = (int) (((critRate * idef * critDamage) + (1 - critRate) * idef) * penMultiplier
                * pctDmgMultiplier);
        final int ddmgs = (int) ((float) ddmg * spdDiv1000);
        DamageMultipliers multis = hero.getDamageMultipliers();
        int s1 = 0;
        int s2 = 0;
        int s3 = 0;

        if (multis != null) {
            s1 = getSkillValue(multis, 0, iatk, idef, ihp, spd, critDamage, pctDmgMultiplier, penSetOn);
            s2 = getSkillValue(multis, 1, iatk, idef, ihp, spd, critDamage, pctDmgMultiplier, penSetOn);
            s3 = getSkillValue(multis, 2, iatk, idef, ihp, spd, critDamage, pctDmgMultiplier, penSetOn);
        }
        final int score = (int) (accs0[11] + accs1[11] + accs2[11] + accs3[11] + accs4[11] + accs5[11]);

        final float bsHp = (hp - base.hp - hero.artifactHealth - (sets[0] > 1 ? sets[0] / 2 * hpSetBonus : 0)
                - (sets[20] > 3 ? hpSetBonus : 0) + (sets[17] > 1 ? sets[17] / 2 * hpSetBonus / 2 : 0)) / base.hp * 100;
        final float bsAtk = (atk - base.atk - hero.artifactAttack - (sets[2] > 3 ? atkSetBonus : 0))
                / base.atk * 100;
        final float bsDef = (def - base.def - hero.artifactDefense - (sets[1] > 1 ? sets[1] / 2 * defSetBonus : 0))
                / base.def * 100;
        final float bsCr = (cr - base.cr - (sets[4] > 1 ? sets[4] / 2 * 12 : 0));
        final float bsCd = (cd - base.cd - (sets[6] > 3 ? 60 : 0));
        final float bsEff = (eff - base.eff - (sets[5] > 1 ? sets[5] / 2 * 20 : 0));
        final float bsRes = (res - base.res - (sets[9] > 1 ? sets[9] / 2 * 20 : 0));
        final float bsSpd = (spd - base.spd - (sets[3] > 3 ? speedSetBonus : 0) - (sets[14] > 3 ? revengeSetBonus : 0)
                - (sets[18] > 3 ? reversalSetBonus : 0) - (sets[23] > 3 ? weakeningSetBonus : 0));

        final int bs = (int) (bsHp + bsAtk + bsDef + bsCr * 1.5f + bsCd * 1.125f + bsEff + bsRes + bsSpd * 2);

        final int customScore = (int) (bsAtk / 9f * priorityAtk +
                bsHp / 9f * priorityHp +
                bsDef / 9f * priorityDef +
                bsCr / 6f * priorityCr +
                bsCd / 8f * priorityCd +
                bsEff / 9f * priorityEff +
                bsRes / 9f * priorityRes +
                bsSpd / 4.5f * prioritySpd);

        // ── Faithful build ranking score (×100) ───────────────────────────────────
        // weightedScore = Σ(item.priorityScore): the per-slot/per-set-weighted gear
        // score,
        // carried at ×100 precision from the frontend. Add the build-level target bonus
        // (×100) computed from the build's final stats — the one piece that is
        // genuinely
        // build-level and could not be folded into the per-item scores. Per-slot
        // weights
        // remain per-item by construction (a finished build's aggregate can't be
        // decomposed
        // by slot). Stat values match the stored ints so the score lines up with the
        // grid.
        final double targetBonus = statTargetBonus(iatk, targetAtkMin, targetAtkMed, targetAtk, priorityAtk)
                * rankFactorAtk +
                statTargetBonus(ihp, targetHpMin, targetHpMed, targetHp, priorityHp) * rankFactorHp +
                statTargetBonus(idef, targetDefMin, targetDefMed, targetDef, priorityDef) * rankFactorDef +
                statTargetBonus(spd, targetSpdMin, targetSpdMed, targetSpd, prioritySpd) * rankFactorSpd +
                statTargetBonus((int) cr, targetCrMin, targetCrMed, targetCr, priorityCr) * rankFactorCr +
                statTargetBonus(cd, targetCdMin, targetCdMed, targetCd, priorityCd) * rankFactorCd +
                statTargetBonus(eff, targetEffMin, targetEffMed, targetEff, priorityEff) * rankFactorEff +
                statTargetBonus(res, targetResMin, targetResMed, targetRes, priorityRes) * rankFactorRes;
        final int buildScore = weightedScore + (int) Math.round(targetBonus * 100);

        return new HeroStats((int) atk, (int) hp, (int) def, (int) cr, cd, eff, res, 0, spd, cp, ehp, hpps, ehpps,
                dmg, dmgps, mcdmg, mcdmgps, dmgh, dmgd, hmcdmgs, dmcdmgs, hdmg, hdmgs, ddmg, ddmgs, s1, s2, s3,
                upgrades, conversions, alreadyEquipped, score, bs,
                priority, customScore, buildScore,
                base.bonusStats, null, null, null, null, null, null, null);
    }

    private int getSkillValue(final DamageMultipliers m,
            final int s,
            final float atk,
            final float def,
            final float hp,
            final float spd,
            final float critDamage,
            final float pctDmgMultiplier,
            final float penSetOn) {
        if (m == null)
            return 0;
        final Integer[] targetsArr = m.getTargets();
        if (targetsArr == null || s >= targetsArr.length || Objects.equals(targetsArr[s], null)) {
            return 0;
        }

        final int targets = targetsArr[s] == 1 ? 1 : 0;
        final float realPenetration = (1 - m.getPenetration()[s]) * (1 - penSetOn * 0.15f * targets);
        final float statScalings = m.getSelfHpScaling()[s] * hp +
                m.getSelfAtkScaling()[s] * atk +
                m.getSelfDefScaling()[s] * def +
                m.getSelfSpdScaling()[s] * spd;
        final float hitTypeMultis = m.getCrit()[s] * (critDamage + m.getCdmgIncrease()[s]) + m.getHitMulti()[s];
        final float increasedValue = 1 + m.getIncreasedValue()[s];
        final float dmgUpMod = 1 + m.getSelfSpdScaling()[s] * spd;
        final float extraDamage = (m.getExtraSelfHpScaling()[s] * hp +
                m.getExtraSelfAtkScaling()[s] * atk +
                m.getExtraSelfDefScaling()[s] * def) * 1.871f * 1f
                / (StatCalculator.SETTING_PEN_DEFENSE * 0.3f / 300f + 1f);
        final float offensive = (atk * m.getRate()[s] + statScalings) * 1.871f * m.getPow()[s] * increasedValue
                * hitTypeMultis * dmgUpMod * pctDmgMultiplier;
        final float support = m.getSelfHpScaling()[s] * hp * m.getSupport()[s]
                + m.getSelfAtkScaling()[s] * atk * m.getSupport()[s]
                + m.getSelfDefScaling()[s] * def * m.getSupport()[s];
        final float defensive = 1f / (StatCalculator.SETTING_PEN_DEFENSE * Math.max(0, realPenetration) / 300f + 1f);
        final int value = (int) (offensive * defensive + support + extraDamage);

        return value;
    }

    public float[] getStatAccumulatorArr(final HeroStats base,
            final Item item,
            final Map<String, float[]> accumulatorsByItemId,
            final boolean useReforgeStats) {
        if (accumulatorsByItemId.containsKey(item.modId)) {
            return accumulatorsByItemId.get(item.modId);
        }

        final float[] accumulator = buildStatAccumulatorArr(base, item, useReforgeStats);
        accumulatorsByItemId.put(item.getModId(), accumulator);
        return accumulator;
    }

    public float[] buildStatAccumulatorArr(final HeroStats base, final Item item, final boolean useReforgeStats) {
        final AugmentedStats stats;
        if (useReforgeStats) {
            stats = item.getReforgedStats();
        } else {
            stats = item.getAugmentedStats();
        }

        final float[] statAccumulatorArr = new float[15];

        // Add base
        statAccumulatorArr[0] += stats.getAttack() + stats.getAttackPercent() / 100f * base.getAtk();
        statAccumulatorArr[1] += stats.getHealth() + stats.getHealthPercent() / 100f * base.getHp();
        statAccumulatorArr[2] += stats.getDefense() + stats.getDefensePercent() / 100f * base.getDef();

        statAccumulatorArr[10] += stats.getSpeed();
        statAccumulatorArr[6] += stats.getCritRate();
        statAccumulatorArr[7] += stats.getCritDamage();
        statAccumulatorArr[8] += stats.getEffectiveness();
        statAccumulatorArr[9] += stats.getEffectResistance();

        final StatType mainType = stats.getMainType();
        final int mainTypeIndex = mainType.getIndex();

        // Add percents
        if (mainTypeIndex == 3) {
            statAccumulatorArr[0] += stats.getMainValue() / 100f * base.getAtk();
        } else if (mainType == StatType.HEALTHPERCENT) {
            statAccumulatorArr[1] += stats.getMainValue() / 100f * base.getHp();
        } else if (mainType == StatType.DEFENSEPERCENT) {
            statAccumulatorArr[2] += stats.getMainValue() / 100f * base.getDef();
        } else {
            statAccumulatorArr[mainTypeIndex] += stats.getMainValue();
        }

        // Add scores
        statAccumulatorArr[11] += useReforgeStats ? item.getReforgedWss() : item.getWss();

        return statAccumulatorArr;
    }

    public int[] buildSetsArr(final Item[] items) {
        final int[] sets = new int[SET_COUNT];

        for (final Item item : items) {
            if (item != null && item.set != null) {
                sets[item.set.index]++;
            }
        }
        return sets;
    }
}
