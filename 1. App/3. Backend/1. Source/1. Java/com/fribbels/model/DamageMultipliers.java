package com.fribbels.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@Builder
@ToString
@AllArgsConstructor
@NoArgsConstructor
@EqualsAndHashCode
public class DamageMultipliers {

    @Builder.Default
    private Float[] rate = new Float[] { 1f, 1f, 1f };
    @Builder.Default
    private Float[] pow = new Float[] { 1f, 1f, 1f };
    @Builder.Default
    private Integer[] targets = new Integer[] { 0, 0, 0 };

    @Builder.Default
    private Float[] selfHpScaling = new Float[] { 1f, 1f, 1f };
    @Builder.Default
    private Float[] selfAtkScaling = new Float[] { 1f, 1f, 1f };
    @Builder.Default
    private Float[] selfDefScaling = new Float[] { 1f, 1f, 1f };
    @Builder.Default
    private Float[] selfSpdScaling = new Float[] { 1f, 1f, 1f };
    @Builder.Default
    private Float[] constantValue = new Float[] { 1f, 1f, 1f };
    @Builder.Default
    private Float[] selfAtkConstantValue = new Float[] { 1f, 1f, 1f };
    @Builder.Default
    private Float[] increasedValue = new Float[] { 1f, 1f, 1f };
    @Builder.Default
    private Float[] defDiffPen = new Float[] { 1f, 1f, 1f };
    @Builder.Default
    private Float[] defDiffPenMax = new Float[] { 1f, 1f, 1f };
    @Builder.Default
    private Float[] atkDiffPen = new Float[] { 1f, 1f, 1f };
    @Builder.Default
    private Float[] atkDiffPenMax = new Float[] { 1f, 1f, 1f };
    @Builder.Default
    private Float[] spdDiffPen = new Float[] { 1f, 1f, 1f };
    @Builder.Default
    private Float[] spdDiffPenMax = new Float[] { 1f, 1f, 1f };
    @Builder.Default
    private Float[] penetration = new Float[] { 0f, 0f, 0f };
    @Builder.Default
    private Float[] atkIncrease = new Float[] { 1f, 1f, 1f };
    @Builder.Default
    private Float[] cdmgIncrease = new Float[] { 1f, 1f, 1f };
    @Builder.Default
    private Float[] crit = new Float[] { 1f, 1f, 1f };
    @Builder.Default
    private Float[] damage = new Float[] { 1f, 1f, 1f };
    @Builder.Default
    private Float[] support = new Float[] { 1f, 1f, 1f };
    @Builder.Default
    private Float[] hitMulti = new Float[] { 1f, 1f, 1f };

    @Builder.Default
    private Float[] extraSelfAtkScaling = new Float[] { 1f, 1f, 1f };
    @Builder.Default
    private Float[] extraSelfDefScaling = new Float[] { 1f, 1f, 1f };
    @Builder.Default
    private Float[] extraSelfHpScaling = new Float[] { 1f, 1f, 1f };

}
