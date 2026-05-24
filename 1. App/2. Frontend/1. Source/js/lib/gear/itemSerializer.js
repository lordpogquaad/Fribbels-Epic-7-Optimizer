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
        const arr = JSON.parse(str);
        return arr.map((element) => {
            const mainStat = buildStat(element.main);
            const subStats = element.substats.map((x) => buildStat(x));
            return new Item(
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
        });
    },
};

export default ItemSerializer;
