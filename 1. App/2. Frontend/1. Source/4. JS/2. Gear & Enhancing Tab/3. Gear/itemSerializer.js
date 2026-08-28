/* global Item, Stat */

function buildStat(obj) {
  const rolls = Number.parseInt(obj.rolls, 10);
  return new Stat({
    type: obj.type,
    value: Number.parseInt(obj.value, 10),
    rolls: Number.isNaN(rolls) ? undefined : rolls,
    modified: obj.modified,
    pinMod: obj.pinMod,
    pinModOff: obj.pinModOff,
    allowedTargetStats: obj.allowedTargetStats,
  });
}

const ItemSerializer = {
  serialize: (items) => {
    return JSON.stringify(items);
  },

  serializeToArr: (items) => {
    return items.map((x) => JSON.stringify(x));
  },

  deserialize: (str) => {
    let arr;
    try {
      arr = JSON.parse(str);
    } catch (e) {
      Log.error('ItemSerializer.deserialize: failed to parse JSON', e);
      return [];
    }
    return arr
      .map((element) => {
        if (!element?.main || !element.substats) return null;
        const mainStat = buildStat(element.main);
        const subStats = element.substats.map((x) => buildStat(x));
        // Item is constructed from a single params object (see models/item.js),
        // not positional args.
        const item = new Item({
          gear: element.gear,
          rank: element.rank,
          set: element.set,
          level: element.level,
          enhance: element.enhance,
          main: mainStat,
          substats: subStats,
          name: element.name,
          heroName: element.heroName,
          otherworldly: element.otherworldly,
        });
        // Preserve the original id so equipped-by links and starred builds survive a round-trip
        if (element.id) item.id = element.id;
        return item;
      })
      .filter(Boolean);
  },
};

export default ItemSerializer;
