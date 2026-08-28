/*
    Contains all the api paths that the java backend uses.
*/
/* global HeroesTab, Notifier */

import axios from 'axios';

function getEndpoint() {
  return `http://localhost:${globalThis.backendPort || 8130}`;
}

let _invalidResultRowsCount = 0;

function post(api, request) {
  return new Promise((resolve, reject) => {
    axios
      .post(getEndpoint() + api, request)
      .then((response) => {
        // Per-backend-call trace (request + response). Fires on EVERY call, so during an
        // optimizer run (getProgress polls every ~200ms) it floods — gated by the apiCalls
        // switch in 5. Dev Only/LogControl.js (Log.api → globalThis.API_DEBUG).
        Log.api('Api call', api, request, response);

        if (response.data === '') {
          resolve(null);
          return null;
        }

        if (response.data === 'ERROR') {
          if (api.includes('/optimization')) {
            const heroName =
              request?.hero?.name ?? request?.heroId ?? 'unknown hero';
            const msg =
              `Optimization failed for "${heroName}". ` +
              `This usually means the hero is not yet in the backend database, ` +
              `a gear item has an unrecognized set, or GPU acceleration is causing a crash ` +
              `(try disabling it in Settings).\n${api}`;
            Log.error(msg);
            Notifier.error(msg);
          } else {
            Log.error(`Subprocess error: ${api}`);
            Notifier.error(`Subprocess error - ${api}`);
          }
        }

        resolve(response.data);
        return null;
      })
      .catch((error) => {
        const errStr = error.toString() + error.stack;
        if (
          errStr?.includes('aparapi') &&
          errStr.includes(
            'Ensure that OpenCL is in your PATH (windows) or in LD_LIBRARY_PATH (linux).',
          )
        ) {
          resolve(null);
        } else if (errStr.includes('untested')) {
          resolve(null);
        } else if (errStr?.includes('aparapi')) {
          Log.error(
            "Java process failed. If you are using GPU acceleration, try disabling it on the settings tab. Please try restarting your app and check that you've installed the correct version of Java.",
            api,
            request,
            error,
          );
          Notifier.error(
            "Java process failed. If you are using GPU acceleration, try disabling it on the settings tab. Please try restarting your app and check that you've installed the correct version of Java",
          );
          reject(error);
        } else {
          Log.error(
            "Java process failed. Please try restarting your app and check that you've installed the correct version of Java.",
            api,
            request,
            error,
          );
          Notifier.error(
            "Java process failed. Please try restarting your app and check that you've installed the correct version of Java",
          );
          reject(error);
        }
      });
  });
}

const Api = {
  setSettings: async (settings) => {
    return post('/system/setSettings', settings);
  },

  ocr: async (id) => {
    return post('/ocr', {
      id,
    });
  },

  ocr2: async (id, shifted) => {
    return post('/ocr2', {
      id,
      shifted,
    });
  },

  getBonusStats: async (id) => {
    return post('/heroes/getBonusStats', {
      id,
    });
  },

  setBonusStats: async (bonusStats, heroId) => {
    return post('/heroes/setBonusStats', {
      atk: bonusStats.attack,
      def: bonusStats.defense,
      hp: bonusStats.health,
      atkPercent: bonusStats.attackPercent,
      defPercent: bonusStats.defensePercent,
      hpPercent: bonusStats.healthPercent,
      speed: bonusStats.speed,
      cr: bonusStats.critChance,
      cd: bonusStats.critDamage,
      eff: bonusStats.effectiveness,
      res: bonusStats.effectResistance,
      crPush: bonusStats.crPush || 0,
      targetSpeed: bonusStats.targetSpeed || 0,
      lowPickRate: bonusStats.lowPickRate || false,
      usageRate: bonusStats.usageRate || 0,
      targetSets: bonusStats.targetSets || [],

      finalAtkMultiplier: bonusStats.finalAtkMultiplier,
      finalDefMultiplier: bonusStats.finalDefMultiplier,
      finalHpMultiplier: bonusStats.finalHpMultiplier,

      cdCapBonus: bonusStats.cdCapBonus || 0,

      aeiAtk: bonusStats.aeiAttack,
      aeiDef: bonusStats.aeiDefense,
      aeiHp: bonusStats.aeiHealth,
      aeiAtkPercent: bonusStats.aeiAttackPercent,
      aeiDefPercent: bonusStats.aeiDefensePercent,
      aeiHpPercent: bonusStats.aeiHealthPercent,
      aeiSpeed: bonusStats.aeiSpeed,
      aeiCr: bonusStats.aeiCritChance,
      aeiCd: bonusStats.aeiCritDamage,
      aeiEff: bonusStats.aeiEffectiveness,
      aeiRes: bonusStats.aeiEffectResistance,

      artifactName: bonusStats.artifactName,
      artifactLevel: bonusStats.artifactLevel,
      artifactAttack: bonusStats.artifactAttack,
      artifactHealth: bonusStats.artifactHealth,
      artifactDefense: bonusStats.artifactDefense,
      imprintNumber: bonusStats.imprintNumber,
      eeNumber: bonusStats.eeNumber,

      stars: bonusStats.stars,

      heroId,
    });
  },

  // Lightweight single-field save for the Hero-grid inline Tgt Spd cell — avoids
  // round-tripping the whole Bonus Stats form.
  setTargetSpeed: async (heroId, targetSpeed) => {
    return post('/heroes/setTargetSpeed', {
      heroId,
      targetSpeed,
    });
  },

  // Lightweight partial-update for the inline Build Planner cells (Low Pick checkbox,
  // Usage % cell).  `fields` is e.g. { lowPickRate: true } or { usageRate: 42 }; only
  // the supplied keys are changed on the hero.
  setBuildPlanner: async (heroId, fields) => {
    return post('/heroes/setBuildPlanner', {
      heroId,
      ...fields,
    });
  },

  getSkillOptions: async (id) => {
    return post('/heroes/getSkillOptions', {
      id,
    });
  },

  setSkillOptions: async (skillOptions, heroId) => {
    return post('/heroes/setSkillOptions', {
      heroId,
      skillOptions,
    });
  },

  setModStats: async (modStats, heroId) => {
    return post('/heroes/setModStats', {
      discardStats: modStats.discardStats,
      ignoreStats: modStats.ignoreStats,
      keepStats: modStats.keepStats,
      modGrade: modStats.modGrade,
      keepStatOptions: modStats.keepStatOptions,
      rollQuality: modStats.rollQuality,
      limitRolls: modStats.limitRolls,
      maxModPieces: modStats.maxModPieces,
      modSlots: modStats.modSlots,
      slotModConfig: modStats.slotModConfig,

      heroId,
    });
  },

  setBaseStats: async (baseStatsByName) => {
    return post('/heroes/setBaseStats', {
      baseStatsByName,
    });
  },

  setArtifacts: async (artifactsByName) => {
    const fixedModel = structuredClone(artifactsByName);
    Object.values(fixedModel).forEach((value) => {
      value.attack = value.stats.attack;
      value.health = value.stats.health;
      value.defense = value.stats.defense;
    });
    return post('/heroes/setArtifactStats', {
      artifactStatsByName: fixedModel,
    });
  },

  getBaseStats: async (name) => {
    return post('/heroes/getBaseStats', {
      id: name,
    });
  },

  reorderHeroes: async (id, destinationIndex) => {
    return post('/heroes/reorderHeroes', {
      id,
      destinationIndex,
    });
  },

  // Bulk roster reorder in one call — set the hero order to match this id list.
  reorderAllHeroes: async (ids) => {
    return post('/heroes/reorderAll', { ids });
  },

  cancelOptimizationRequest: async () => {
    return post('/system/interrupt');
  },

  getOptimizationProgress: async () => {
    return post('/optimization/getProgress');
  },

  getOptimizationInProgress: async () => {
    return post('/optimization/inProgress');
  },

  getAllItems: async () => {
    return post('/items/getAllItems');
  },

  getItemById: async (id) => {
    return post('/items/getItemById', {
      id,
    });
  },

  getItemByIngameId: async (id) => {
    return post('/items/getItemByIngameId', {
      id,
    });
  },

  getItemsByIds: async (ids) => {
    return post('/items/getItemsByIds', {
      ids,
    });
  },

  addItems: async (items) => {
    return post('/items/addItems', {
      items,
    });
  },

  mergeItems: async (items, enhanceLimit) => {
    return post('/items/mergeItems', {
      items,
      enhanceLimit,
    });
  },

  mergeHeroes: async (items, mergeHeroes, enhanceLimit, heroFilter) => {
    return post('/items/mergeHeroes', {
      items,
      mergeHeroes,
      enhanceLimit,
      heroFilter,
    });
  },

  setItems: async (items) => {
    return post('/items/setItems', {
      items,
    });
  },

  editItems: async (items) => {
    return post('/items/editItems', {
      items,
    });
  },

  deleteItems: async (itemIds) => {
    return post('/items/deleteItems', {
      ids: itemIds,
    });
  },

  lockItems: async (itemIds) => {
    return post('/items/lockItems', {
      ids: itemIds,
    });
  },

  unlockItems: async (itemIds) => {
    return post('/items/unlockItems', {
      ids: itemIds,
    });
  },

  addHeroes: async (heroes) => {
    return post('/heroes/addHeroes', {
      heroes,
    });
  },

  setHeroes: async (heroes) => {
    return post('/heroes/setHeroes', {
      heroes,
    });
  },

  getAllHeroes: async () => {
    const useReforgeStatsOverride = HeroesTab.getUseReforgedStats();
    return post('/heroes/getAllHeroes', {
      useReforgeStats: useReforgeStatsOverride,
    });
  },

  removeHeroById: async (id) => {
    return post('/heroes/removeHeroById', {
      id,
    });
  },

  unequipHeroById: async (id) => {
    return post('/heroes/unequipHeroById', {
      id,
    });
  },

  unlockHeroById: async (id) => {
    return post('/heroes/unlockHeroById', {
      id,
    });
  },

  lockHeroById: async (id) => {
    return post('/heroes/lockHeroById', {
      id,
    });
  },

  unequipItems: async (ids) => {
    return post('/heroes/unequipItems', {
      ids,
    });
  },

  getHeroById: async (id) => {
    // Autosave interferes with the reforge display
    const useReforgeStatsOverride = HeroesTab.getUseReforgedStats();
    return post('/heroes/getHeroById', {
      id,
      useReforgeStats: useReforgeStatsOverride,
    });
  },

  equipItemsOnHero: async (heroId, itemIds, useReforgeStats) => {
    return post('/heroes/equipItemsOnHero', {
      heroId,
      itemIds,
      useReforgeStats,
    });
  },

  addBuild: async (heroId, build) => {
    return post('/heroes/addBuild', {
      heroId,
      build,
    });
  },
  editBuild: async (heroId, build) => {
    return post('/heroes/editBuild', {
      heroId,
      build,
    });
  },
  removeBuild: async (heroId, build) => {
    return post('/heroes/removeBuild', {
      heroId,
      build,
    });
  },
  editResultRows: async (index, property, executionId) => {
    return post('/optimization/editResultRows', {
      index,
      property,
      executionId,
    });
  },

  prepareExecution: async () => {
    return post('/optimization/prepareExecution');
  },

  deleteExecution: async (id) => {
    return post('/optimization/deleteExecution', {
      id,
    });
  },

  submitOptimizationRequest: async (request) => {
    _invalidResultRowsCount = 0;
    return post('/optimization/optimizationRequest', request);
  },

  saveOptimizationRequest: async (request) => {
    return post('/heroes/saveOptimizationRequest', request);
  },

  submitOptimizationFilterRequest: async (request) => {
    return post('/optimization/optimizationFilterRequest', request);
  },

  getResultRows: async (request) => {
    const response = await post('/optimization/getResultRows', request);
    const optimizing = globalThis.OptimizerTab?.isOptimizing?.() ?? true;
    if (
      !response ||
      !response.heroStats ||
      response.heroStats.length === 0 ||
      response.maximum === 0
    ) {
      _invalidResultRowsCount++;
      if (!request?.executionId) {
        // no-op: called before an execution exists (e.g. on app load)
      } else if (!optimizing) {
        Log.warn(
          `[getResultRows] #${_invalidResultRowsCount} INVALID after optimization done — heroStats empty or maximum=0`,
          '\nRequest:',
          request,
          '\nResponse:',
          response,
          '\nexecutionId:',
          request?.executionId,
        );
      } else {
        Log.api(
          `[getResultRows] #${_invalidResultRowsCount} maximum=0 while still optimizing (normal at start)`,
          'executionId:',
          request?.executionId,
        );
      }
    }
    return response;
  },

  getBestSoFar: async (executionId) => {
    return post('/optimization/getBestSoFar', {
      id: executionId,
    });
  },

  getExecutionProgress: async (executionId) => {
    return post('/optimization/getExecutionProgress', {
      id: executionId,
    });
  },

  cancelExecution: async (executionId) => {
    return post('/optimization/cancelExecution', {
      id: executionId,
    });
  },
};

export default Api;
