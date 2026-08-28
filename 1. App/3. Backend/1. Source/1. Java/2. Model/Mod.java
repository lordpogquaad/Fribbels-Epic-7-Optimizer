package com.fribbels.model;

import com.fribbels.enums.StatType;
import com.google.gson.Gson;
import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@EqualsAndHashCode
public class Mod {

    private static final Gson GSON = new Gson();

    private StatType originalType;
    private StatType type;
    private Integer originalValue;
    private Integer value;
    private Integer index;

    public String toString() {
        return GSON.toJson(this);
    }

    public void modifyAugmentedStats(final AugmentedStats stats) {
        setStat(stats, originalType, 0); // clear the old stat
        if (value == null)
            return;
        setStat(stats, type, value); // apply the new stat
    }

    private static void setStat(final AugmentedStats stats, final StatType statType, final int statValue) {
        if (statType == StatType.ATTACK) {
            stats.setAttack(statValue);
        } else if (statType == StatType.ATTACKPERCENT) {
            stats.setAttackPercent(statValue);
        } else if (statType == StatType.CRITRATE) {
            stats.setCritRate(statValue);
        } else if (statType == StatType.CRITDAMAGE) {
            stats.setCritDamage(statValue);
        } else if (statType == StatType.DEFENSE) {
            stats.setDefense(statValue);
        } else if (statType == StatType.DEFENSEPERCENT) {
            stats.setDefensePercent(statValue);
        } else if (statType == StatType.EFFECTRESISTANCE) {
            stats.setEffectResistance(statValue);
        } else if (statType == StatType.EFFECTIVENESS) {
            stats.setEffectiveness(statValue);
        } else if (statType == StatType.HEALTH) {
            stats.setHealth(statValue);
        } else if (statType == StatType.HEALTHPERCENT) {
            stats.setHealthPercent(statValue);
        } else if (statType == StatType.SPEED) {
            stats.setSpeed(statValue);
        }
    }
}
