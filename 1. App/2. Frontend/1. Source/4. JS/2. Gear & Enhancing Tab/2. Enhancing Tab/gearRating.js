/* global ArchetypeStore, ArchetypeScorer */

const GearRating = {
  initialize: () => {},

  setArchetypes: (a) => {
    ArchetypeStore.saveArchetypes(a);
  },

  getArchetypes: () => {
    return ArchetypeStore.getArchetypes();
  },

  rate: (item) => {
    return ArchetypeScorer.scoreAllArchetypes(
      item,
      ArchetypeStore.getArchetypes(),
    )
      .slice(0, 10)
      .map((x) => ({ id: x.id, name: x.name, score: x.score }));
  },
};

export default GearRating;
