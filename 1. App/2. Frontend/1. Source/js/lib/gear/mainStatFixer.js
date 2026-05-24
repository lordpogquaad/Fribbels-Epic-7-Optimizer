function isPercent(stat) {
    return stat.includes('%');
}

function isAccessory(gear) {
    return gear === 'Necklace' || gear === 'Ring' || gear === 'Boots';
}

function isCritChance(stat) {
    return stat === 'CriticalHitChance';
}

function isCritDamage(stat) {
    return stat === 'CriticalHitDamage';
}

function isSpeed(stat) {
    return stat === 'Speed';
}

function isHealth(stat) {
    return stat === 'Health';
}

function isDefense(stat) {
    return stat === 'Defense';
}

function isAttack(stat) {
    return stat === 'Attack';
}

const MainStatFixer = {
    fix: (data, gear, level, enhance) => {
        if (enhance >= 15) {
            return data.mainStatNumbers;
        }

        const stat = data.mainStatText;

        if (level < 15) {
            if (isCritChance(stat)) return '5%';
            if (isCritDamage(stat)) return '15%';
            if (isSpeed(stat)) return '15';
            if (isAccessory(stat)) return '10%';
        }

        if (level >= 15 && level < 30) {
            if (isCritChance(stat)) return '15%';
            if (isCritDamage(stat)) return '25%';
            if (isSpeed(stat)) return '20';
            if (isAccessory(gear)) return '20%';
        }

        if (level >= 30 && level < 44) {
            if (isCritChance(stat)) return '25%';
            if (isCritDamage(stat)) return '35%';
            if (isSpeed(stat)) return '25';
            if (isAccessory(gear)) return '30%';
        }

        if (level >= 44 && level < 58) {
            if (isCritChance(stat)) return '35%';
            if (isCritDamage(stat)) return '45%';
            if (isSpeed(stat)) return '30';
            if (isAccessory(gear)) return '40%';
        }

        if (level >= 58 && level < 72) {
            if (isCritChance(stat)) return '45%';
            if (isCritDamage(stat)) return '55%';
            if (isSpeed(stat)) return '35';
            if (isAccessory(gear) && isPercent(data.mainStatNumbers))
                return '50%';
            if (isHealth(stat)) return '2360';
            if (isDefense(stat)) return '260';
            if (isAttack(stat)) return '440';
        }

        if (level >= 72 && level < 86) {
            if (isCritChance(stat)) return '55%';
            if (isCritDamage(stat)) return '65%';
            if (isSpeed(stat)) return '40';
            if (isAccessory(gear) && isPercent(data.mainStatNumbers))
                return '60%';
            if (isHealth(stat)) return '2700';
            if (isDefense(stat)) return '300';
            if (isAttack(stat)) return '500';
        }

        if (level >= 86 && level < 100) {
            if (isCritChance(stat)) return '60%';
            if (isCritDamage(stat)) return '70%';
            if (isSpeed(stat)) return '45';
            if (isAccessory(gear) && isPercent(data.mainStatNumbers))
                return '65%';
            if (isHealth(stat)) return '2765';
            if (isDefense(stat)) return '310';
            if (isAttack(stat)) return '515';
        }

        return data.mainStatNumbers;
    },
};

export default MainStatFixer;
