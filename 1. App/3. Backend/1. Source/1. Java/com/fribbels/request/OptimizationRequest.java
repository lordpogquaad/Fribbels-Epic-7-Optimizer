package com.fribbels.request;

import com.fribbels.enums.Set;
import com.fribbels.enums.StatType;
import com.fribbels.model.DamageMultipliers;
import com.fribbels.model.Hero;
import com.fribbels.model.Item;
import com.fribbels.model.Request;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

import java.util.List;
import java.util.Map;

@Setter
@Getter
@ToString
@NoArgsConstructor
public class OptimizationRequest extends Request {

    private String executionId;

    private String heroId;
    public Hero hero;
    public DamageMultipliers damageMultipliers;
    private List<Item> items;

    // Set filters arrive as three flat per-tier lists (read by the optimizer below).
    // The frontend also sends an aggregate `inputSets` (List<List<Set>>) but it is a
    // pure frontend convenience rebuilt locally from these three — the backend never
    // read it, so it is not declared here (Gson ignores the still-sent JSON key).
    private List<Set> inputSetsOne;
    private List<Set> inputSetsTwo;
    private List<Set> inputSetsThree;
    private List<Set> inputExcludeSet;

    private List<String> excludeFilter;
    private List<String> excludedGearIds;

    private List<StatType> inputNecklaceStat;
    private List<StatType> inputRingStat;
    private List<StatType> inputBootsStat;

    private Boolean inputPredictReforges;
    private Boolean inputSubstatMods;
    private Boolean inputAllowLockedItems;
    private Boolean inputAllowEquippedItems;
    private Boolean inputOrderedHeroPriority;
    private Boolean inputKeepCurrentItems;
    private Boolean inputOnlyMaxedGear;
    private Boolean inputUsePvECritDamageCap;

    private int atk;
    private int hp;
    private int def;
    private int cr;
    private int cd;
    private int eff;
    private int res;
    private int spd;
    private int dac;

    private float artifactAttack;
    private float artifactHealth;
    private float artifactDefense;

    public int inputAtkMinLimit;
    public int inputAtkMaxLimit = Integer.MAX_VALUE;
    public int inputHpMinLimit;
    public int inputHpMaxLimit = Integer.MAX_VALUE;
    public int inputDefMinLimit;
    public int inputDefMaxLimit = Integer.MAX_VALUE;
    public int inputSpdMinLimit;
    public int inputSpdMaxLimit = Integer.MAX_VALUE;
    public int inputCrMinLimit;
    public int inputCrMaxLimit = Integer.MAX_VALUE;
    public int inputCdMinLimit;
    public int inputCdMaxLimit = Integer.MAX_VALUE;
    public int inputEffMinLimit;
    public int inputEffMaxLimit = Integer.MAX_VALUE;
    public int inputResMinLimit;
    public int inputResMaxLimit = Integer.MAX_VALUE;
    public int inputMinCpLimit;
    public int inputMaxCpLimit = Integer.MAX_VALUE;
    public int inputMinHppsLimit;
    public int inputMaxHppsLimit = Integer.MAX_VALUE;
    public int inputMinEhpLimit;
    public int inputMaxEhpLimit = Integer.MAX_VALUE;
    public int inputMinEhppsLimit;
    public int inputMaxEhppsLimit = Integer.MAX_VALUE;
    public int inputMinDmgLimit;
    public int inputMaxDmgLimit = Integer.MAX_VALUE;
    public int inputMinDmgpsLimit;
    public int inputMaxDmgpsLimit = Integer.MAX_VALUE;
    public int inputMinMcdmgLimit;
    public int inputMaxMcdmgLimit = Integer.MAX_VALUE;
    public int inputMinMcdmgpsLimit;
    public int inputMaxMcdmgpsLimit = Integer.MAX_VALUE;

    public int inputMinDmgHLimit;
    public int inputMaxDmgHLimit = Integer.MAX_VALUE;
    public int inputMinDmgDLimit;
    public int inputMaxDmgDLimit = Integer.MAX_VALUE;

    public int inputMinHmcdmgsLimit;
    public int inputMaxHmcdmgsLimit = Integer.MAX_VALUE;
    public int inputMinDmcdmgsLimit;
    public int inputMaxDmcdmgsLimit = Integer.MAX_VALUE;
    public int inputMinHdmgLimit;
    public int inputMaxHdmgLimit = Integer.MAX_VALUE;
    public int inputMinHdmgsLimit;
    public int inputMaxHdmgsLimit = Integer.MAX_VALUE;
    public int inputMinDdmgLimit;
    public int inputMaxDdmgLimit = Integer.MAX_VALUE;
    public int inputMinDdmgsLimit;
    public int inputMaxDdmgsLimit = Integer.MAX_VALUE;

    public int inputMinS1Limit;
    public int inputMaxS1Limit = Integer.MAX_VALUE;
    public int inputMinS2Limit;
    public int inputMaxS2Limit = Integer.MAX_VALUE;
    public int inputMinS3Limit;
    public int inputMaxS3Limit = Integer.MAX_VALUE;

    public int inputMinUpgradesLimit;
    public int inputMaxUpgradesLimit = Integer.MAX_VALUE;
    public int inputMinConversionsLimit;
    public int inputMaxConversionsLimit = Integer.MAX_VALUE;
    public int inputMinEquippedLimit;
    public int inputMaxEquippedLimit = Integer.MAX_VALUE;
    public int inputMinScoreLimit;
    public int inputMaxScoreLimit = Integer.MAX_VALUE;
    public int inputMinBSLimit;
    public int inputMaxBSLimit = Integer.MAX_VALUE;
    public int inputMinPriorityLimit;
    public int inputMaxPriorityLimit = Integer.MAX_VALUE;

    private Integer inputAtkMinForce;
    private Integer inputAtkMaxForce;
    private Integer inputAtkPercentMinForce;
    private Integer inputAtkPercentMaxForce;
    private Integer inputSpdMinForce;
    private Integer inputSpdMaxForce;
    private Integer inputCrMinForce;
    private Integer inputCrMaxForce;
    private Integer inputCdMinForce;
    private Integer inputCdMaxForce;
    private Integer inputHpMinForce;
    private Integer inputHpMaxForce;
    private Integer inputHpPercentMinForce;
    private Integer inputHpPercentMaxForce;
    private Integer inputDefMinForce;
    private Integer inputDefMaxForce;
    private Integer inputDefPercentMinForce;
    private Integer inputDefPercentMaxForce;
    private Integer inputEffMinForce;
    private Integer inputEffMaxForce;
    private Integer inputResMinForce;
    private Integer inputResMaxForce;

    private Integer inputForceNumberSelect;
    private Integer inputForceMode;
    private Integer inputFilterPriority;
    private Double inputAtkPriority;
    private Double inputHpPriority;
    private Double inputDefPriority;
    private Double inputSpdPriority;
    private Double inputCrPriority;
    private Double inputCdPriority;
    private Double inputEffPriority;
    private Double inputResPriority;

    // Stat targets that feed the build-ranking target bonus
    // (StatCalculator.setTargets).
    // inputXxxTarget = single/max target, inputXxxMinTarget = range lower bound,
    // inputXxxSweetTarget = median "sweet spot" (the ideal value inside the range);
    // mirrors
    // the frontend calculateBuildScore semantics. 0 ⇒ no target. These were
    // previously
    // dropped server-side (undeclared), so targets affected only the old
    // display-only
    // Build Score — declaring them lets targets influence the actual ranking.
    public int inputAtkTarget;
    public int inputHpTarget;
    public int inputDefTarget;
    public int inputSpdTarget;
    public int inputCrTarget;
    public int inputCdTarget;
    public int inputEffTarget;
    public int inputResTarget;
    public int inputAtkMinTarget;
    public int inputHpMinTarget;
    public int inputDefMinTarget;
    public int inputSpdMinTarget;
    public int inputCrMinTarget;
    public int inputCdMinTarget;
    public int inputEffMinTarget;
    public int inputResMinTarget;
    public int inputAtkSweetTarget;
    public int inputHpSweetTarget;
    public int inputDefSweetTarget;
    public int inputSpdSweetTarget;
    public int inputCrSweetTarget;
    public int inputCdSweetTarget;
    public int inputEffSweetTarget;
    public int inputResSweetTarget;

    // Per-hero "target priority" ranks (1 = highest target importance, 0 =
    // unranked) plus a
    // global tunable scale. Each stat's target bonus is multiplied by 1 + (8 -
    // rank) × scale
    // (unranked → ×1, scale 0 → off). Sourced per-hero from the optimizer UI.
    public int inputAtkTargetRank;
    public int inputHpTargetRank;
    public int inputDefTargetRank;
    public int inputSpdTargetRank;
    public int inputCrTargetRank;
    public int inputCdTargetRank;
    public int inputEffTargetRank;
    public int inputResTargetRank;
    public double inputTargetRankScale;

    // Per-slot priority matrix + per-set priority overrides (authored JS-side) and
    // the ranking-basis flag. STORAGE ONLY: the optimizer never reads these — they
    // exist so the Gson round-trip in HeroDb.saveOptimizationRequest preserves them
    // on the hero (and carries them into saves/exports).
    //
    // The per-slot AND per-set weights DO drive the build ranking, but via the
    // per-item
    // `Item.priorityScore` the JS computes (set > slot > global precedence) and
    // sends —
    // the backend sums those into the build-level `buildScore`, not by reading
    // these maps.
    // Per-slot weights are inherently per-item (a finished build's aggregate stats
    // can't
    // be decomposed by slot), so per-item is the only correct carrier. Per-set
    // weights
    // are honored by construction: the per-set dialog only allows overrides on a
    // required
    // (forced) set, so every result build completes that set. The remaining
    // build-level
    // contribution — the stat target bonus — is read by the backend from the
    // inputXxx*
    // Target fields above.
    private Map<String, Object> slotPriorityConfig;
    private Map<String, Object> setPriorityConfig;
    private String inputPriorityRankBasis;

    // Scratch/quick filter: when true the filter handler re-filters the result set
    // but does NOT persist this request onto the hero, so ad-hoc result filtering
    // never overwrites the user's saved stat-filter / priority configuration.
    private boolean noSave;

    // Keep-best-N mode: when true the optimizer scans the entire permutation space
    // without the early-exit cap and keeps only the best `keepBestNLimit` builds by
    // priority in a bounded heap (trashing the weakest), so large runs never
    // OOM/crash.
    private boolean keepBestN;
    // Result cap for keep-best-N mode (its own box, separate from the legacy
    // stop-at-limit settingMaxResults). 0 ⇒ fall back to settingMaxResults.
    private long keepBestNLimit;

    // calculated fields
    public boolean[] boolArr;
    public int[] setPermutationIndicesPlusOne;
    private int setFormat;
}
