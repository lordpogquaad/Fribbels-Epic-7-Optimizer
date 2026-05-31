/* global $ */
import { Gears } from '../enums';

function forceDisabled(params) {
    return (
        params.inputAtkMinForce == null &&
        params.inputAtkMaxForce == null &&
        params.inputAtkPercentMinForce == null &&
        params.inputAtkPercentMaxForce == null &&
        params.inputCrMinForce == null &&
        params.inputCrMaxForce == null &&
        params.inputCdMinForce == null &&
        params.inputCdMaxForce == null &&
        params.inputDefMinForce == null &&
        params.inputDefMaxForce == null &&
        params.inputDefPercentMinForce == null &&
        params.inputDefPercentMaxForce == null &&
        params.inputResMinForce == null &&
        params.inputResMaxForce == null &&
        params.inputEffMinForce == null &&
        params.inputEffMaxForce == null &&
        params.inputHpMinForce == null &&
        params.inputHpMaxForce == null &&
        params.inputHpPercentMinForce == null &&
        params.inputHpPercentMaxForce == null &&
        params.inputSpdMinForce == null &&
        params.inputSpdMaxForce == null
    );
}

function passesNumberCheck(number, min, max) {
    let passes = true;
    if (min && number < min) passes = false;
    if (max && number > max) passes = false;
    return passes;
}

function passesGenericCheck(item, min, max, allowedMain, excludedGear) {
    if (!min && !max) return false;
    if (!item.augmentedStats) return false;

    const stat = item.augmentedStats[allowedMain];
    if (excludedGear.includes(item.gear)) {
        return false;
    }

    // NOTE: Previously there was an early `return true` here for Necklace/Ring/Boots
    // when the stat matched the main type — this bypassed the numeric range check,
    // causing items to pass force filters regardless of the actual stat value.
    // Removed: augmentedStats already includes the main stat value for accessories,
    // so passesNumberCheck handles them correctly.
    return passesNumberCheck(stat, min, max);
}

const ForceFilter = {
    applyForceFilters: (params, items, forceNumber) => {

        if (forceDisabled(params)) {
            return items;
        }

        return items.filter((item) => {
            const passes = [
                passesGenericCheck(
                    item,
                    params.inputAtkMinForce,
                    params.inputAtkMaxForce,
                    'Attack',
                    [Gears.Weapon, Gears.Armor]
                ),
                passesGenericCheck(
                    item,
                    params.inputAtkPercentMinForce,
                    params.inputAtkPercentMaxForce,
                    'AttackPercent',
                    [Gears.Armor]
                ),
                passesGenericCheck(
                    item,
                    params.inputCrMinForce,
                    params.inputCrMaxForce,
                    'CriticalHitChancePercent',
                    []
                ),
                passesGenericCheck(
                    item,
                    params.inputCdMinForce,
                    params.inputCdMaxForce,
                    'CriticalHitDamagePercent',
                    []
                ),
                passesGenericCheck(
                    item,
                    params.inputDefMinForce,
                    params.inputDefMaxForce,
                    'Defense',
                    [Gears.Weapon, Gears.Armor]
                ),
                passesGenericCheck(
                    item,
                    params.inputDefPercentMinForce,
                    params.inputDefPercentMaxForce,
                    'DefensePercent',
                    [Gears.Weapon]
                ),
                passesGenericCheck(
                    item,
                    params.inputResMinForce,
                    params.inputResMaxForce,
                    'EffectResistancePercent',
                    []
                ),
                passesGenericCheck(
                    item,
                    params.inputEffMinForce,
                    params.inputEffMaxForce,
                    'EffectivenessPercent',
                    []
                ),
                passesGenericCheck(
                    item,
                    params.inputHpMinForce,
                    params.inputHpMaxForce,
                    'Health',
                    []
                ),
                passesGenericCheck(
                    item,
                    params.inputHpPercentMinForce,
                    params.inputHpPercentMaxForce,
                    'HealthPercent',
                    []
                ),
                passesGenericCheck(
                    item,
                    params.inputSpdMinForce,
                    params.inputSpdMaxForce,
                    'Speed',
                    []
                ),
            ];

            return passes.filter((x) => x === true).length >= forceNumber;
        });
    },
};

export default ForceFilter;
