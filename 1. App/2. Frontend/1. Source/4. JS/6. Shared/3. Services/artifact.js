/* global HeroData, Utils */

/*
    Calculates artifact hp/atk numbers - which technically have a tenths decimal
    value but that value isn't shown ingame. Using the ingame value will
    cause an off-by-one bug on HP/ATK calculations
*/

// A fully-leveled (lv30) artifact reaches 13× its base HP/ATK/DEF; stats scale
// linearly with level between base (lv0) and max (lv30).
const MAX_ARTIFACT_LEVEL = 30;
const MAX_STAT_MULTIPLIER = 13;

const Artifact = {
  getStats: (name, level) => {
    const allData = HeroData.getAllArtifactData();
    const artifact = allData[name];
    if (!artifact) return { health: 0, attack: 0, defense: 0 };
    const baseHealth = artifact.stats.health;
    const baseAttack = artifact.stats.attack;
    const baseDefense = artifact.stats.defense;
    const maxHealth = baseHealth * MAX_STAT_MULTIPLIER;
    const maxAttack = baseAttack * MAX_STAT_MULTIPLIER;
    const maxDefense = baseDefense * MAX_STAT_MULTIPLIER;

    const levelRatio = level / MAX_ARTIFACT_LEVEL;
    const leveledHealth = (maxHealth - baseHealth) * levelRatio + baseHealth;
    const leveledAttack = (maxAttack - baseAttack) * levelRatio + baseAttack;
    const leveledDefense =
      (maxDefense - baseDefense) * levelRatio + baseDefense;

    return {
      health: Utils.round10ths(leveledHealth),
      attack: Utils.round10ths(leveledAttack),
      defense: Utils.round10ths(leveledDefense),
    };
  },
};

export default Artifact;
