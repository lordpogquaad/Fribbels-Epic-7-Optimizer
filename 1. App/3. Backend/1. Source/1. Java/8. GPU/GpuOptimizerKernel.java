package com.fribbels.gpu;

import com.aparapi.Kernel;
import com.fribbels.model.DamageMultipliers;
import com.fribbels.model.Hero;
import com.fribbels.model.HeroStats;
import com.fribbels.request.OptimizationRequest;
import lombok.Setter;

@Setter
public class GpuOptimizerKernel extends Kernel {

        @Constant
        float[] flattenedWeaponAccs;
        @Constant
        float[] flattenedHelmetAccs;
        @Constant
        float[] flattenedArmorAccs;
        @Constant
        float[] flattenedNecklaceAccs;
        @Constant
        float[] flattenedRingAccs;
        @Constant
        float[] flattenedBootAccs;

        @Constant
        long wSize;
        @Constant
        long hSize;
        @Constant
        long aSize;
        @Constant
        long nSize;
        @Constant
        long rSize;
        @Constant
        long bSize;

        @Constant
        final long argSize;

        @Constant
        final float bonusBaseAtk;
        @Constant
        final float bonusBaseHp;
        @Constant
        final float bonusBaseDef;

        @Constant
        final float atkSetBonus;
        @Constant
        final float hpSetBonus;
        @Constant
        final float defSetBonus;
        @Constant
        final float speedSetBonus;
        @Constant
        final float revengeSetBonus;
        @Constant
        final float reversalSetBonus;
        @Constant
        final float weakeningSetBonus;
        @Constant
        final float penSetDmgBonus;

        @Constant
        final float targetDefense;

        @Constant
        final float bonusMaxAtk;
        @Constant
        final float bonusMaxHp;
        @Constant
        final float bonusMaxDef;

        @Constant
        final int SETTING_RAGE_SET;
        @Constant
        final int SETTING_PEN_SET;
        @Constant
        final int SETTING_FERVOR_SET;
        @Constant
        final int damageCritDamageCap;

        @Constant
        final float baseAtk;
        @Constant
        final float baseHp;
        @Constant
        final float baseDef;
        @Constant
        final float baseCr;
        @Constant
        final float baseCd;
        @Constant
        final float baseEff;
        @Constant
        final float baseRes;
        @Constant
        final float baseSpeed;

        @Constant
        final float bonusCr;
        @Constant
        final float bonusCd;
        @Constant
        final int cdCapBonus;
        @Constant
        final float bonusEff;
        @Constant
        final float bonusRes;
        @Constant
        final float bonusSpeed;

        @Constant
        final float aeiCr;
        @Constant
        final float aeiCd;
        @Constant
        final float aeiEff;
        @Constant
        final float aeiRes;
        @Constant
        final float aeiSpeed;
        @Constant
        final boolean[] boolArr;
        @Constant
        final int[] setPermutationIndicesPlusOne;
        @Constant
        final long max;
        @Constant
        int inputAtkMinLimit;
        @Constant
        int inputAtkMaxLimit;
        @Constant
        int inputHpMinLimit;
        @Constant
        int inputHpMaxLimit;
        @Constant
        int inputDefMinLimit;
        @Constant
        int inputDefMaxLimit;
        @Constant
        int inputSpdMinLimit;
        @Constant
        int inputSpdMaxLimit;
        @Constant
        int inputCrMinLimit;
        @Constant
        int inputCrMaxLimit;
        @Constant
        int inputCdMinLimit;
        @Constant
        int inputCdMaxLimit;
        @Constant
        int inputEffMinLimit;
        @Constant
        int inputEffMaxLimit;
        @Constant
        int inputResMinLimit;
        @Constant
        int inputResMaxLimit;
        @Constant
        int inputMinCpLimit;
        @Constant
        int inputMaxCpLimit;
        @Constant
        int inputMinHppsLimit;
        @Constant
        int inputMaxHppsLimit;
        @Constant
        int inputMinEhpLimit;
        @Constant
        int inputMaxEhpLimit;
        @Constant
        int inputMinEhppsLimit;
        @Constant
        int inputMaxEhppsLimit;
        @Constant
        int inputMinDmgLimit;
        @Constant
        int inputMaxDmgLimit;
        @Constant
        int inputMinDmgpsLimit;
        @Constant
        int inputMaxDmgpsLimit;
        @Constant
        int inputMinMcdmgLimit;
        @Constant
        int inputMaxMcdmgLimit;
        @Constant
        int inputMinMcdmgpsLimit;
        @Constant
        int inputMaxMcdmgpsLimit;

        @Constant
        int inputMinDmgHLimit;
        @Constant
        int inputMaxDmgHLimit;
        @Constant
        int inputMinDmgDLimit;
        @Constant
        int inputMaxDmgDLimit;

        @Constant
        int inputMinHmcdmgsLimit;
        @Constant
        int inputMaxHmcdmgsLimit;
        @Constant
        int inputMinDmcdmgsLimit;
        @Constant
        int inputMaxDmcdmgsLimit;
        @Constant
        int inputMinHdmgLimit;
        @Constant
        int inputMaxHdmgLimit;
        @Constant
        int inputMinHdmgsLimit;
        @Constant
        int inputMaxHdmgsLimit;
        @Constant
        int inputMinDdmgLimit;
        @Constant
        int inputMaxDdmgLimit;
        @Constant
        int inputMinDdmgsLimit;
        @Constant
        int inputMaxDdmgsLimit;

        @Constant
        int inputMinS1Limit;
        @Constant
        int inputMaxS1Limit;
        @Constant
        int inputMinS2Limit;
        @Constant
        int inputMaxS2Limit;
        @Constant
        int inputMinS3Limit;
        @Constant
        int inputMaxS3Limit;
        @Constant
        int isSkillLimited; // 1 if any S1/S2/S3 limit is non-default, else 0

        @Constant
        final float[] rate;
        @Constant
        final float[] pow;
        @Constant
        final int[] targets;

        @Constant
        final float[] selfHpScaling;
        @Constant
        final float[] selfAtkScaling;
        @Constant
        final float[] selfDefScaling;
        @Constant
        final float[] selfSpdScaling;
        @Constant
        final float[] constantValue;
        @Constant
        final float[] selfAtkConstantValue;
        @Constant
        final float[] increasedValue;
        @Constant
        final float[] defDiffPen;
        @Constant
        final float[] defDiffPenMax;
        @Constant
        final float[] atkDiffPen;
        @Constant
        final float[] atkDiffPenMax;
        @Constant
        final float[] spdDiffPen;
        @Constant
        final float[] spdDiffPenMax;
        @Constant
        final float[] penetration;
        @Constant
        final float[] atkIncrease;
        @Constant
        final float[] cdmgIncrease;
        @Constant
        final float[] crit;
        @Constant
        final float[] damage;
        @Constant
        final float[] support;
        @Constant
        final float[] hitMulti;

        @Constant
        final float[] extraSelfAtkScaling;
        @Constant
        final float[] extraSelfDefScaling;
        @Constant
        final float[] extraSelfHpScaling;

        @Constant
        final float artifactHealth;
        @Constant
        final float artifactAttack;
        @Constant
        final float artifactDefense;

        @Constant
        int inputMinUpgradesLimit;
        @Constant
        int inputMaxUpgradesLimit;
        @Constant
        int inputMinConversionsLimit;
        @Constant
        int inputMaxConversionsLimit;
        @Constant
        int inputMinEquippedLimit;
        @Constant
        int inputMaxEquippedLimit;
        @Constant
        int inputMinScoreLimit;
        @Constant
        int inputMaxScoreLimit;
        @Constant
        int inputMinBSLimit;
        @Constant
        int inputMaxBSLimit;
        @Constant
        int inputMinPriorityLimit;
        @Constant
        int inputMaxPriorityLimit;

        float[] debug;

        int iteration;
        boolean[] passes;
        @Constant
        final long[] setSolutionBitMasks;

        public GpuOptimizerKernel(
                        final OptimizationRequest request,
                        final float[] flattenedWeaponAccs,
                        final float[] flattenedHelmetAccs,
                        final float[] flattenedArmorAccs,
                        final float[] flattenedNecklaceAccs,
                        final float[] flattenedRingAccs,
                        final float[] flattenedBootAccs,
                        final float bonusBaseAtk,
                        final float bonusBaseDef,
                        final float bonusBaseHp,
                        final float atkSetBonus,
                        final float hpSetBonus,
                        final float defSetBonus,
                        final float speedSetBonus,
                        final float revengeSetBonus,
                        final float reversalSetBonus,
                        final float weakeningSetBonus,
                        final float penSetDmgBonus,
                        final float targetDefense,
                        final float bonusMaxAtk,
                        final float bonusMaxDef,
                        final float bonusMaxHp,
                        final int SETTING_RAGE_SET,
                        final int SETTING_PEN_SET,
                        final int SETTING_FERVOR_SET,
                        final HeroStats base,
                        final Hero hero,
                        final long argSize,
                        final long wSize,
                        final long hSize,
                        final long aSize,
                        final long nSize,
                        final long rSize,
                        final long bSize,
                        final long max,
                        final long[] setSolutionBitMasks) {
                this.flattenedWeaponAccs = flattenedWeaponAccs;
                this.flattenedHelmetAccs = flattenedHelmetAccs;
                this.flattenedArmorAccs = flattenedArmorAccs;
                this.flattenedNecklaceAccs = flattenedNecklaceAccs;
                this.flattenedRingAccs = flattenedRingAccs;
                this.flattenedBootAccs = flattenedBootAccs;
                this.bonusBaseAtk = bonusBaseAtk;
                this.bonusBaseDef = bonusBaseDef;
                this.bonusBaseHp = bonusBaseHp;

                this.atkSetBonus = atkSetBonus;
                this.hpSetBonus = hpSetBonus;
                this.defSetBonus = defSetBonus;
                this.speedSetBonus = speedSetBonus;
                this.revengeSetBonus = revengeSetBonus;
                this.reversalSetBonus = reversalSetBonus;
                this.weakeningSetBonus = weakeningSetBonus;
                this.penSetDmgBonus = penSetDmgBonus;

                this.targetDefense = targetDefense;

                this.bonusMaxAtk = bonusMaxAtk;
                this.bonusMaxDef = bonusMaxDef;
                this.bonusMaxHp = bonusMaxHp;

                this.SETTING_RAGE_SET = SETTING_RAGE_SET;
                this.SETTING_PEN_SET = SETTING_PEN_SET;
                this.SETTING_FERVOR_SET = SETTING_FERVOR_SET;
                this.damageCritDamageCap = Boolean.TRUE.equals(request.getInputUsePvECritDamageCap()) ? 400 : 350;

                this.baseAtk = base.atk;
                this.baseHp = base.hp;
                this.baseDef = base.def;
                this.baseCr = base.cr;
                this.baseCd = base.cd;
                this.baseEff = base.eff;
                this.baseRes = base.res;
                this.baseSpeed = base.spd;

                this.bonusCr = hero.bonusCr;
                this.bonusCd = hero.bonusCd;
                this.cdCapBonus = hero.cdCapBonus;
                this.bonusEff = hero.bonusEff;
                this.bonusRes = hero.bonusRes;
                this.bonusSpeed = hero.bonusSpeed;

                this.aeiCr = hero.aeiCr;
                this.aeiCd = hero.aeiCd;
                this.aeiEff = hero.aeiEff;
                this.aeiRes = hero.aeiRes;
                this.aeiSpeed = hero.aeiSpeed;

                this.argSize = argSize;
                this.wSize = wSize;
                this.hSize = hSize;
                this.aSize = aSize;
                this.nSize = nSize;
                this.rSize = rSize;
                this.bSize = bSize;

                inputAtkMinLimit = request.inputAtkMinLimit;
                inputAtkMaxLimit = request.inputAtkMaxLimit;
                inputDefMinLimit = request.inputDefMinLimit;
                inputDefMaxLimit = request.inputDefMaxLimit;
                inputHpMinLimit = request.inputHpMinLimit;
                inputHpMaxLimit = request.inputHpMaxLimit;
                inputSpdMinLimit = request.inputSpdMinLimit;
                inputSpdMaxLimit = request.inputSpdMaxLimit;
                inputCrMinLimit = request.inputCrMinLimit;
                inputCrMaxLimit = request.inputCrMaxLimit;
                inputCdMinLimit = request.inputCdMinLimit;
                inputCdMaxLimit = request.inputCdMaxLimit;
                inputEffMinLimit = request.inputEffMinLimit;
                inputEffMaxLimit = request.inputEffMaxLimit;
                inputResMinLimit = request.inputResMinLimit;
                inputResMaxLimit = request.inputResMaxLimit;
                inputMinCpLimit = request.inputMinCpLimit;
                inputMaxCpLimit = request.inputMaxCpLimit;
                inputMinHppsLimit = request.inputMinHppsLimit;
                inputMaxHppsLimit = request.inputMaxHppsLimit;
                inputMinEhpLimit = request.inputMinEhpLimit;
                inputMaxEhpLimit = request.inputMaxEhpLimit;
                inputMinEhppsLimit = request.inputMinEhppsLimit;
                inputMaxEhppsLimit = request.inputMaxEhppsLimit;
                inputMinDmgLimit = request.inputMinDmgLimit;
                inputMaxDmgLimit = request.inputMaxDmgLimit;
                inputMinDmgpsLimit = request.inputMinDmgpsLimit;
                inputMaxDmgpsLimit = request.inputMaxDmgpsLimit;
                inputMinMcdmgLimit = request.inputMinMcdmgLimit;
                inputMaxMcdmgLimit = request.inputMaxMcdmgLimit;
                inputMinMcdmgpsLimit = request.inputMinMcdmgpsLimit;
                inputMaxMcdmgpsLimit = request.inputMaxMcdmgpsLimit;

                inputMinDmgHLimit = request.inputMinDmgHLimit;
                inputMaxDmgHLimit = request.inputMaxDmgHLimit;
                inputMinDmgDLimit = request.inputMinDmgDLimit;
                inputMaxDmgDLimit = request.inputMaxDmgDLimit;

                inputMinHmcdmgsLimit = request.inputMinHmcdmgsLimit;
                inputMaxHmcdmgsLimit = request.inputMaxHmcdmgsLimit;
                inputMinDmcdmgsLimit = request.inputMinDmcdmgsLimit;
                inputMaxDmcdmgsLimit = request.inputMaxDmcdmgsLimit;
                inputMinHdmgLimit = request.inputMinHdmgLimit;
                inputMaxHdmgLimit = request.inputMaxHdmgLimit;
                inputMinHdmgsLimit = request.inputMinHdmgsLimit;
                inputMaxHdmgsLimit = request.inputMaxHdmgsLimit;
                inputMinDdmgLimit = request.inputMinDdmgLimit;
                inputMaxDdmgLimit = request.inputMaxDdmgLimit;
                inputMinDdmgsLimit = request.inputMinDdmgsLimit;
                inputMaxDdmgsLimit = request.inputMaxDdmgsLimit;

                inputMinS1Limit = request.inputMinS1Limit;
                inputMaxS1Limit = request.inputMaxS1Limit;
                inputMinS2Limit = request.inputMinS2Limit;
                inputMaxS2Limit = request.inputMaxS2Limit;
                inputMinS3Limit = request.inputMinS3Limit;
                inputMaxS3Limit = request.inputMaxS3Limit;
                isSkillLimited = (request.inputMinS1Limit > 0 || request.inputMaxS1Limit < Integer.MAX_VALUE
                                || request.inputMinS2Limit > 0 || request.inputMaxS2Limit < Integer.MAX_VALUE
                                || request.inputMinS3Limit > 0 || request.inputMaxS3Limit < Integer.MAX_VALUE) ? 1 : 0;

                artifactAttack = request.hero.artifactAttack;
                artifactHealth = request.hero.artifactHealth;
                artifactDefense = request.hero.artifactDefense;

                inputMinUpgradesLimit = request.inputMinUpgradesLimit;
                inputMaxUpgradesLimit = request.inputMaxUpgradesLimit;
                inputMinConversionsLimit = request.inputMinConversionsLimit;
                inputMaxConversionsLimit = request.inputMaxConversionsLimit;
                inputMinEquippedLimit = request.inputMinEquippedLimit;
                inputMaxEquippedLimit = request.inputMaxEquippedLimit;
                inputMinScoreLimit = request.inputMinScoreLimit;
                inputMaxScoreLimit = request.inputMaxScoreLimit;
                inputMinBSLimit = request.inputMinBSLimit;
                inputMaxBSLimit = request.inputMaxBSLimit;
                inputMinPriorityLimit = request.inputMinPriorityLimit;
                inputMaxPriorityLimit = request.inputMaxPriorityLimit;
                this.max = max;
                this.boolArr = request.boolArr;
                this.setPermutationIndicesPlusOne = request.setPermutationIndicesPlusOne;
                this.setSolutionBitMasks = setSolutionBitMasks;

                final DamageMultipliers dm = hero.getDamageMultipliers();

                this.rate = floatArr(dm.getRate());
                this.pow = floatArr(dm.getPow());
                this.targets = flattenTargets(dm.getTargets());
                this.selfHpScaling = floatArr(dm.getSelfHpScaling());
                this.selfAtkScaling = floatArr(dm.getSelfAtkScaling());
                this.selfDefScaling = floatArr(dm.getSelfDefScaling());
                this.selfSpdScaling = floatArr(dm.getSelfSpdScaling());
                this.constantValue = floatArr(dm.getConstantValue());
                this.selfAtkConstantValue = floatArr(dm.getSelfAtkConstantValue());
                this.increasedValue = floatArr(dm.getIncreasedValue());
                this.defDiffPen = floatArr(dm.getDefDiffPen());
                this.defDiffPenMax = floatArr(dm.getDefDiffPenMax());
                this.atkDiffPen = floatArr(dm.getAtkDiffPen());
                this.atkDiffPenMax = floatArr(dm.getAtkDiffPenMax());
                this.spdDiffPen = floatArr(dm.getSpdDiffPen());
                this.spdDiffPenMax = floatArr(dm.getSpdDiffPenMax());
                this.penetration = floatArr(dm.getPenetration());
                this.atkIncrease = floatArr(dm.getAtkIncrease());
                this.cdmgIncrease = floatArr(dm.getCdmgIncrease());
                this.crit = floatArr(dm.getCrit());
                this.damage = floatArr(dm.getDamage());
                this.support = floatArr(dm.getSupport());
                this.hitMulti = floatArr(dm.getHitMulti());
                this.extraSelfAtkScaling = floatArr(dm.getExtraSelfAtkScaling());
                this.extraSelfDefScaling = floatArr(dm.getExtraSelfDefScaling());
                this.extraSelfHpScaling = floatArr(dm.getExtraSelfHpScaling());
        }

        public void update(
                        final OptimizationRequest request,
                        final float[] flattenedWeaponAccs,
                        final float[] flattenedHelmetAccs,
                        final float[] flattenedArmorAccs,
                        final float[] flattenedNecklaceAccs,
                        final float[] flattenedRingAccs,
                        final float[] flattenedBootAccs,
                        final long wSize,
                        final long hSize,
                        final long aSize,
                        final long nSize,
                        final long rSize,
                        final long bSize) {
                this.flattenedWeaponAccs = flattenedWeaponAccs;
                this.flattenedHelmetAccs = flattenedHelmetAccs;
                this.flattenedArmorAccs = flattenedArmorAccs;
                this.flattenedNecklaceAccs = flattenedNecklaceAccs;
                this.flattenedRingAccs = flattenedRingAccs;
                this.flattenedBootAccs = flattenedBootAccs;
                this.wSize = wSize;
                this.hSize = hSize;
                this.aSize = aSize;
                this.nSize = nSize;
                this.rSize = rSize;
                this.bSize = bSize;
                inputAtkMinLimit = request.inputAtkMinLimit;
                inputAtkMaxLimit = request.inputAtkMaxLimit;
                inputDefMinLimit = request.inputDefMinLimit;
                inputDefMaxLimit = request.inputDefMaxLimit;
                inputHpMinLimit = request.inputHpMinLimit;
                inputHpMaxLimit = request.inputHpMaxLimit;
                inputSpdMinLimit = request.inputSpdMinLimit;
                inputSpdMaxLimit = request.inputSpdMaxLimit;
                inputCrMinLimit = request.inputCrMinLimit;
                inputCrMaxLimit = request.inputCrMaxLimit;
                inputCdMinLimit = request.inputCdMinLimit;
                inputCdMaxLimit = request.inputCdMaxLimit;
                inputEffMinLimit = request.inputEffMinLimit;
                inputEffMaxLimit = request.inputEffMaxLimit;
                inputResMinLimit = request.inputResMinLimit;
                inputResMaxLimit = request.inputResMaxLimit;
                inputMinCpLimit = request.inputMinCpLimit;
                inputMaxCpLimit = request.inputMaxCpLimit;
                inputMinHppsLimit = request.inputMinHppsLimit;
                inputMaxHppsLimit = request.inputMaxHppsLimit;
                inputMinEhpLimit = request.inputMinEhpLimit;
                inputMaxEhpLimit = request.inputMaxEhpLimit;
                inputMinEhppsLimit = request.inputMinEhppsLimit;
                inputMaxEhppsLimit = request.inputMaxEhppsLimit;
                inputMinDmgLimit = request.inputMinDmgLimit;
                inputMaxDmgLimit = request.inputMaxDmgLimit;
                inputMinDmgpsLimit = request.inputMinDmgpsLimit;
                inputMaxDmgpsLimit = request.inputMaxDmgpsLimit;
                inputMinMcdmgLimit = request.inputMinMcdmgLimit;
                inputMaxMcdmgLimit = request.inputMaxMcdmgLimit;
                inputMinMcdmgpsLimit = request.inputMinMcdmgpsLimit;
                inputMaxMcdmgpsLimit = request.inputMaxMcdmgpsLimit;
                inputMinDmgHLimit = request.inputMinDmgHLimit;
                inputMaxDmgHLimit = request.inputMaxDmgHLimit;
                inputMinDmgDLimit = request.inputMinDmgDLimit;
                inputMaxDmgDLimit = request.inputMaxDmgDLimit;
                inputMinHmcdmgsLimit = request.inputMinHmcdmgsLimit;
                inputMaxHmcdmgsLimit = request.inputMaxHmcdmgsLimit;
                inputMinDmcdmgsLimit = request.inputMinDmcdmgsLimit;
                inputMaxDmcdmgsLimit = request.inputMaxDmcdmgsLimit;
                inputMinHdmgLimit = request.inputMinHdmgLimit;
                inputMaxHdmgLimit = request.inputMaxHdmgLimit;
                inputMinHdmgsLimit = request.inputMinHdmgsLimit;
                inputMaxHdmgsLimit = request.inputMaxHdmgsLimit;
                inputMinDdmgLimit = request.inputMinDdmgLimit;
                inputMaxDdmgLimit = request.inputMaxDdmgLimit;
                inputMinDdmgsLimit = request.inputMinDdmgsLimit;
                inputMaxDdmgsLimit = request.inputMaxDdmgsLimit;
                inputMinS1Limit = request.inputMinS1Limit;
                inputMaxS1Limit = request.inputMaxS1Limit;
                inputMinS2Limit = request.inputMinS2Limit;
                inputMaxS2Limit = request.inputMaxS2Limit;
                inputMinS3Limit = request.inputMinS3Limit;
                inputMaxS3Limit = request.inputMaxS3Limit;
                isSkillLimited = (request.inputMinS1Limit > 0 || request.inputMaxS1Limit < Integer.MAX_VALUE
                                || request.inputMinS2Limit > 0 || request.inputMaxS2Limit < Integer.MAX_VALUE
                                || request.inputMinS3Limit > 0 || request.inputMaxS3Limit < Integer.MAX_VALUE) ? 1 : 0;
                inputMinUpgradesLimit = request.inputMinUpgradesLimit;
                inputMaxUpgradesLimit = request.inputMaxUpgradesLimit;
                inputMinConversionsLimit = request.inputMinConversionsLimit;
                inputMaxConversionsLimit = request.inputMaxConversionsLimit;
                inputMinEquippedLimit = request.inputMinEquippedLimit;
                inputMaxEquippedLimit = request.inputMaxEquippedLimit;
                inputMinScoreLimit = request.inputMinScoreLimit;
                inputMaxScoreLimit = request.inputMaxScoreLimit;
                inputMinBSLimit = request.inputMinBSLimit;
                inputMaxBSLimit = request.inputMaxBSLimit;
                inputMinPriorityLimit = request.inputMinPriorityLimit;
                inputMaxPriorityLimit = request.inputMaxPriorityLimit;
        }

        public void putInitialArrays() {
                put(flattenedWeaponAccs);
                put(flattenedHelmetAccs);
                put(flattenedArmorAccs);
                put(flattenedNecklaceAccs);
                put(flattenedRingAccs);
                put(flattenedBootAccs);
                put(boolArr);
                put(setPermutationIndicesPlusOne);
                put(setSolutionBitMasks);
                put(rate);
                put(pow);
                put(targets);
                put(selfHpScaling);
                put(selfAtkScaling);
                put(selfDefScaling);
                put(selfSpdScaling);
                put(constantValue);
                put(selfAtkConstantValue);
                put(increasedValue);
                put(defDiffPen);
                put(defDiffPenMax);
                put(atkDiffPen);
                put(atkDiffPenMax);
                put(spdDiffPen);
                put(spdDiffPenMax);
                put(penetration);
                put(atkIncrease);
                put(cdmgIncrease);
                put(crit);
                put(damage);
                put(support);
                put(hitMulti);
                put(extraSelfAtkScaling);
                put(extraSelfDefScaling);
                put(extraSelfHpScaling);
        }

        public void putPerRunArrays() {
                put(flattenedWeaponAccs);
                put(flattenedHelmetAccs);
                put(flattenedArmorAccs);
                put(flattenedNecklaceAccs);
                put(flattenedRingAccs);
                put(flattenedBootAccs);
                put(boolArr);
                put(setPermutationIndicesPlusOne);
        }

        public void putPasses() {
                put(passes);
        }

        public void getPasses() {
                get(passes);
        }

        private float[] floatArr(final Float[] arr) {
                if (arr == null) {
                        return new float[] { 0, 0, 0 };
                }
                return new float[] { arr[0], arr[1], arr[2] };
        }

        private int[] flattenTargets(final Integer[] arr) {
                if (arr == null) {
                        return new int[] { 0, 0, 0 };
                }
                return new int[] { zeroOrOne(arr[0]), zeroOrOne(arr[1]), zeroOrOne(arr[2]) };
        }

        private int zeroOrOne(final int i) {
                if (i == 1) {
                        return 1;
                }
                return 0;
        }

        int oneIfNegativeElseZero(int a) {
                return ((a ^ 1) >> 31) * -1;
        }

        int negativeOneIfNegativeElseZero(int a) {
                return (a ^ 1) >> 31;
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

                        // final int setIndex = iWset * 1889568
                        // + iHset * 104976
                        // + iAset * 5832
                        // + iNset * 324
                        // + iRset * 18
                        // + iBset;

                        // final int setIndex = iWset * 1048576
                        // + iHset * 65536
                        // + iAset * 4096
                        // + iNset * 256
                        // + iRset * 16
                        // + iBset;

                        // 0 hp3
                        // 1 hp2
                        // 2 hp1
                        // 3 def3
                        // 4 def2
                        // 5 def1
                        // 6 atk
                        // 7 speed
                        // 8 crit3
                        // 9 crit2
                        // 10 crit1
                        // 11 hit3
                        // 12 hit2
                        // 13 hit1
                        // 14 destr
                        // 15 lifesteal
                        // 16 counter
                        // 17 res3
                        // 18 res2
                        // 19 res1
                        // 20 unity
                        // 21 rage
                        // 22 immu
                        // 23 pen
                        // 24 revenge
                        // 25 injury
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
                        // final int injurySet = (int)((setSolutionBitMasks[setIndex] >>> 25) & 1L);
                        // final int protectionSet = (int)((setSolutionBitMasks[setIndex] >>> 26) & 1L);
                        final int torrentSet = (int) (((setSolutionBitMasks[setIndex] >>> 27) & 1L)
                                        + ((setSolutionBitMasks[setIndex] >>> 28) & 1L)
                                        + ((setSolutionBitMasks[setIndex] >>> 29) & 1L));
                        final int reversalSet = (int) ((setSolutionBitMasks[setIndex] >>> 30) & 1L);
                        // final int riposteSet = (int) ((setSolutionBitMasks[setIndex] >>> 31) & 1L);
                        final int warfareSet = (int) ((setSolutionBitMasks[setIndex] >>> 32) & 1L);
                        // final int pursuitSet = (int) ((setSolutionBitMasks[setIndex] >>> 33) & 1L);
                        final int fervorSet = (int) ((setSolutionBitMasks[setIndex] >>> 34) & 1L);
                        final int weakeningSet = (int) ((setSolutionBitMasks[setIndex] >>> 35) & 1L);
                        // === Phase 1: Set filter check (cheapest — single array lookup) ===
                        if (setPermutationIndicesPlusOne[setIndex] <= 0) {
                                passes[id] = false;
                                return;
                        }

                        // === Phase 2: Cheap integer stats: CR, CD, EFF, RES ===
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

                        // === Phase 3: Float stats: ATK, HP, DEF, SPD ===
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

                        // === Phase 4: CP ===
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

                        // === Phase 5: Derived damage stats ===
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

                        // === Phase 6: Score/priority/upgrades/conversions/eq (cheap sums) ===
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

                        // === Phase 7: Expensive skill damage (getSkillValue x3) ===
                        // Skipped entirely when no S1/S2/S3 limits are set (isSkillLimited == 0).
                        if (isSkillLimited != 0) {
                                final int s1 = getSkillValue(0, atk, def, hp, spd, critDamage, pctDmgMultiplier,
                                                penSetOn);
                                final int s2 = getSkillValue(1, atk, def, hp, spd, critDamage, pctDmgMultiplier,
                                                penSetOn);
                                final int s3 = getSkillValue(2, atk, def, hp, spd, critDamage, pctDmgMultiplier,
                                                penSetOn);
                                if (s1 < inputMinS1Limit || s1 > inputMaxS1Limit
                                                || s2 < inputMinS2Limit || s2 > inputMaxS2Limit
                                                || s3 < inputMinS3Limit || s3 > inputMaxS3Limit) {
                                        passes[id] = false;
                                        return;
                                }
                        }

                        // === Phase 8: Build score (float divisions) ===
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
                        // passes[id] = setIndex >= 340122242;
                }
        }

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
                final int value = (int) (offensiveValue * defensiveValue + supportValue + extraDamage);
                return value;
        }
}
