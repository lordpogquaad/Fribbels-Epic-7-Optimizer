import HeroData from './heroData';

// final int s1 = ((atk * s1AtkMod * s1Rate + s1FlatMod) * 1.871f + s1FlatMod2) * (s1Pow) * s1Multis;
// final int s2 = ((atk * s2AtkMod * s2Rate + s2FlatMod) * 1.871f + s2FlatMod2) * (s2Pow) * s2Multis;
// final int s3 = ((atk * s3AtkMod * s3Rate + s3FlatMod) * 1.871f + s3FlatMod2) * (s3Pow) * s3Multis;

// (increase dmg) * [(atk + bonus atk) * (pow * multi) * (cdmg)]

// {[(ATK !!)(Atkmod)(Rate **)+(FlatMod)] * (1.871)+(Flat2Mod)} × (pow **)(a) +

// a = multis = (EnhanceMod)(HitTypeMod)(ElementMod)(DamageUpMod)(TargetDebuffMod)
// rate -> scaling
// flatmod -> max hp/def scaling
// flat2mod -> ddj

function findSkill(skill, hero, heroData) {
  const skillData = heroData.skills[skill];

  return (
    skillData.options.find(
      (x) => x.name === hero.skillOptions[skill].skillEffect,
    ) || skillData.options[0]
  );
}

function getHitTypeMulti(skill, hero) {
  if (!hero.skillOptions[skill].skillEffect) {
    return 0;
  }
  if (hero.skillOptions[skill].skillEffect.includes('crit')) {
    return 0;
  }
  if (hero.skillOptions[skill].skillEffect.includes('crushing')) {
    return 1.3; // 130%
  }
  if (hero.skillOptions[skill].skillEffect.includes('normal')) {
    return 1; // 100%
  }
  if (hero.skillOptions[skill].skillEffect.includes('miss')) {
    return 0.75; // 75%
  }
  return 0;
}

function fixSkillOptions(hero, heroData) {
  if (!hero.skillOptions) {
    hero.skillOptions = {
      S1: { skillEffect: heroData.skills.S1.options[0].name },
      S2: { skillEffect: heroData.skills.S2.options[0].name },
      S3: { skillEffect: heroData.skills.S3.options[0].name },
    };
    return;
  }

  if (!hero.skillOptions.S1) {
    hero.skillOptions.S1 = {
      skillEffect: heroData.skills.S1.options[0].name,
    };
  }

  if (!hero.skillOptions.S2) {
    hero.skillOptions.S2 = {
      skillEffect: heroData.skills.S2.options[0].name,
    };
  }

  if (!hero.skillOptions.S3) {
    hero.skillOptions.S3 = {
      skillEffect: heroData.skills.S3.options[0].name,
    };
  }
}

const DamageCalc = {
  getMultipliers: (hero) => {
    const heroData = HeroData.getHeroExtraInfo(
      hero.name.replace(/\s#\d+$/, ''),
    );
    if (!heroData) return null;
    fixSkillOptions(hero, heroData);

    // private Float[] selfHpScaling             = new Float[]{1f, 1f, 1f};
    // private Float[] selfAtkScaling            = new Float[]{1f, 1f, 1f};
    // private Float[] selfDefScaling            = new Float[]{1f, 1f, 1f};
    // private Float[] selfSpdScaling            = new Float[]{1f, 1f, 1f};
    // private Float[] constantValue             = new Float[]{1f, 1f, 1f};
    // private Float[] selfAtkConstantValue      = new Float[]{1f, 1f, 1f};
    // private Float[] conditionalIncreasedValue = new Float[]{1f, 1f, 1f};
    // private Float[] defDiffPen                = new Float[]{1f, 1f, 1f};
    // private Float[] defDiffPenMax             = new Float[]{1f, 1f, 1f};
    // private Float[] atkDiffPen                = new Float[]{1f, 1f, 1f};
    // private Float[] atkDiffPenMax             = new Float[]{1f, 1f, 1f};
    // private Float[] spdDiffPen                = new Float[]{1f, 1f, 1f};
    // private Float[] spdDiffPenMax             = new Float[]{1f, 1f, 1f};
    // private Float[] penetration               = new Float[]{1f, 1f, 1f};
    // private Float[] atkIncrease               = new Float[]{1f, 1f, 1f};
    const skillNames = ['S1', 'S2', 'S3'];
    // Resolve each skill's selected option once (findSkill does an array .find),
    // then read every multiplier field off the cached results.
    const skills = skillNames.map((x) => findSkill(x, hero, heroData));
    const result = {
      selfSpdScaling: skills.map((s) => s.selfSpdScaling || 0),
      selfHpScaling: skills.map((s) => s.selfHpScaling || 0),
      selfAtkScaling: skills.map((s) => s.selfAtkScaling || 0),
      selfDefScaling: skills.map((s) => s.selfDefScaling || 0),
      extraSelfHpScaling: skills.map((s) => s.extraSelfHpScaling || 0),
      extraSelfAtkScaling: skills.map((s) => s.extraSelfAtkScaling || 0),
      extraSelfDefScaling: skills.map((s) => s.extraSelfDefScaling || 0),
      constantValue: skills.map((s) => s.constantValue || 0),
      selfAtkConstantValue: skills.map((s) => s.selfAtkConstantValue || 0),
      increasedValue: skills.map((s) => s.increasedValue || 0),
      defDiffPen: skills.map((s) => s.defDiffPen || 0),
      defDiffPenMax: skills.map((s) => s.defDiffPenMax || 0),
      atkDiffPen: skills.map((s) => s.atkDiffPen || 0),
      atkDiffPenMax: skills.map((s) => s.atkDiffPenMax || 0),
      spdDiffPen: skills.map((s) => s.spdDiffPen || 0),
      spdDiffPenMax: skills.map((s) => s.spdDiffPenMax || 0),
      penetration: skills.map((s) => s.penetration || 0),
      atkIncrease: skills.map((s) => s.atkIncrease || 0),
      cdmgIncrease: skills.map((s) => s.cdmgIncrease || 0),
      note: skills.map((s) => s.note || ''),
      rate: skills.map((s) => s.rate || 0),
      pow: skills.map((s) => s.pow || 0),
      targets: skills.map((s) => s.targets || 0),
      crit: skills.map((s) => (s.name.includes('crit') ? 1 : 0)),
      support: skills.map((s) =>
        s.name.includes('heal') || s.name.includes('barrier') ? 1 : 0,
      ),
      hitMulti: skillNames.map((x) => getHitTypeMulti(x, hero) || 0),
    };

    return result;
  },
};

export default DamageCalc;
