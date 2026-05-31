/* global Item, Stat */

function buildStat(obj) {
    const rolls = parseInt(obj.rolls, 10);
    return new Stat(
        obj.type,
        parseInt(obj.value, 10),
        Number.isNaN(rolls) ? undefined : rolls,
        obj.modified
    );
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
            console.error('ItemSerializer.deserialize: failed to parse JSON', e);
            return [];
        }
        return arr.map((element) => {
            if (!element || !element.main || !element.substats) return null;
            const mainStat = buildStat(element.main);
            const subStats = element.substats.map((x) => buildStat(x));
            const item = new Item(
                element.gear,
                element.rank,
                element.set,
                element.level,
                element.enhance,
                mainStat,
                subStats,
                element.name,
                element.heroName,
                element.otherworldly
            );
            // Preserve the original id so equipped-by links and starred builds survive a round-trip
            if (element.id) item.id = element.id;
            return item;
        }).filter(Boolean);
    },
};

export default ItemSerializer;
