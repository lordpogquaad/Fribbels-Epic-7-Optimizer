/* global Files, Dialog, Notifier, i18next, ItemSerializer, Utils, Stat, Constants, HeroData */
const childProcess = require('node:child_process');

// Diagnostic logging uses the central Log utility (Log.debug, gated by window.__optDebug; see 5. Dev Only/LogControl.js).

let scannerChild = null;
let data = [];

let api = 'https://krivpfvxi0.execute-api.us-west-2.amazonaws.com/dev';

let command = 'python';
let findCommandSpawn = null;

const countByRank = {
  Normal: 5,
  Good: 6,
  Rare: 7,
  Heroic: 8,
  Epic: 9,
};

const offsetByRank = {
  Normal: 0,
  Good: 1,
  Rare: 2,
  Heroic: 3,
  Epic: 4,
};

// Ingame stat key → optimizer stat type. The canonical map is
// Constants.ingameStatToStatType (constants.js); referenced at call time (during a
// scan, after the Constants global is registered) to keep one source of truth.

const rankByIngameGrade = [
  'Unknown',
  'Normal',
  'Good',
  'Rare',
  'Heroic',
  'Epic',
];

const gearByIngameType = {
  weapon: 'Weapon',
  helm: 'Helmet',
  armor: 'Armor',
  neck: 'Necklace',
  ring: 'Ring',
  boot: 'Boots',
};

const gearByGearLetter = {
  w: 'Weapon',
  h: 'Helmet',
  a: 'Armor',
  n: 'Necklace',
  r: 'Ring',
  b: 'Boots',
};

const setsByIngameSet = {
  set_acc: 'HitSet',
  set_att: 'AttackSet',
  set_coop: 'UnitySet',
  set_counter: 'CounterSet',
  set_cri_dmg: 'DestructionSet',
  set_cri: 'CriticalSet',
  set_def: 'DefenseSet',
  set_immune: 'ImmunitySet',
  set_max_hp: 'HealthSet',
  set_penetrate: 'PenetrationSet',
  set_rage: 'RageSet',
  set_res: 'ResistSet',
  set_revenge: 'RevengeSet',
  set_scar: 'InjurySet',
  set_speed: 'SpeedSet',
  set_vampire: 'LifestealSet',
  set_shield: 'ProtectionSet',
  set_torrent: 'TorrentSet',
  set_revenant: 'ReversalSet',
  set_riposte: 'RiposteSet',
  set_chase: 'PursuitSet',
  set_opener: 'WarfareSet',
  set_might: 'FervorSet',
  set_weak: 'WeakeningSet',
};

async function postData(url = '', requestData = {}) {
  // Default options are marked with *
  const response = await fetch(url, {
    method: 'POST', // *GET, POST, PUT, DELETE, etc.
    mode: 'cors', // no-cors, *cors, same-origin
    cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
    credentials: 'same-origin', // include, *same-origin, omit
    headers: {
      'Content-Type': 'application/json',
      // 'Content-Type': 'application/x-www-form-urlencoded',
    },
    redirect: 'follow', // manual, *follow, error
    referrerPolicy: 'no-referrer', // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
    body: JSON.stringify(requestData), // body data type must match "Content-Type" header
  });
  return response.json(); // parses JSON response into native JavaScript objects
}

function isFlat(text) {
  return (
    text === 'max_hp' || text === 'speed' || text === 'att' || text === 'def'
  );
}

function convertId(item) {
  item.ingameId = item.id;
}

function convertEquippedId(item) {
  item.ingameEquippedId = `${item.p}`;
}

function convertOtherworldly(item) {
  if (item.code?.includes('_chaos') || item.mainStatId?.startsWith('chaos_')) {
    item.otherworldly = true;
  }
}

function convertGear(item) {
  if (item.type) {
    item.gear = gearByIngameType[item.type];
  } else {
    const baseCode = item.code.split('_')[0];
    const gearLetter = baseCode[baseCode.length - 1];

    item.gear = gearByGearLetter[gearLetter];
  }
}

function convertRank(item) {
  item.rank = rankByIngameGrade[item.g];
}

function convertSet(item) {
  item.set = setsByIngameSet[item.f];
}

function convertName(item) {
  if (!item.name) item.name = 'Unknown';
}

function convertLevel(item) {
  if (!item.level) item.level = 0;
}

function convertEnhance(item) {
  const { rank } = item;
  const subs = item.op;
  const count = Math.min(subs.length - 1, countByRank[rank]);
  const offset = offsetByRank[rank];

  item.enhance = Math.max((count - offset) * 3, 0);
}

function convertMainStat(item) {
  const mainOp = item.op[0];
  const mainOpType = mainOp[0];
  const mainOpValue = item.mainStatValue;
  const mainType = Constants.ingameStatToStatType[mainOpType];
  let mainValue = isFlat(mainOpType)
    ? mainOpValue
    : Utils.round10ths(mainOpValue * 100);
  if (mainValue == null || Number.isNaN(mainValue)) {
    mainValue = 0;
  }
  const fixedMainValue = mainValue;

  item.main = new Stat({ type: mainType, value: fixedMainValue });
}

function convertSubStats(item) {
  const statAcc = {};

  item.op.slice(1).forEach((op) => {
    const opType = op[0];
    const opValue = op[1];
    const annotation = op[2];

    const type = Constants.ingameStatToStatType[opType];
    const value = isFlat(opType) ? opValue : Utils.round10ths(opValue * 100);

    if (Object.keys(statAcc).includes(type)) {
      // Already found this stat
      statAcc[type].value += value;

      if (annotation === 'c') {
        statAcc[type].modified = true;
      } else if (annotation !== 'u') {
        statAcc[type].rolls += 1;
        statAcc[type].ingameRolls += 1;
      }
    } else {
      // New stat
      statAcc[type] = {
        value,
        rolls: 1,
        ingameRolls: 1,
      };
    }
  });

  const substats = [];

  Object.keys(statAcc).forEach((key) => {
    const acc = statAcc[key];
    const { value } = acc;
    const stat = new Stat({
      type: key,
      value,
      rolls: acc.rolls,
      modified: acc.modified,
    });
    substats.push(stat);
  });

  item.substats = substats;
}

function filterItems(rawItems, scanType) {
  let enhanceLimit = 6;
  if (scanType === 'heroes') {
    enhanceLimit = Number.parseInt(
      document.querySelector('input[name="heroImporterEnhanceRadio"]:checked')
        ?.value ?? '6',
      10,
    );
  } else if (scanType === 'items') {
    enhanceLimit = Number.parseInt(
      document.querySelector('input[name="gearImporterEnhanceRadio"]:checked')
        ?.value ?? '6',
      10,
    );
  }

  return rawItems.filter((x) => x.enhance >= enhanceLimit);
}

function convertItems(rawItems, scanType) {
  rawItems.forEach((rawItem) => {
    convertGear(rawItem);
    convertRank(rawItem);
    convertSet(rawItem);
    convertName(rawItem);
    convertLevel(rawItem);
    convertEnhance(rawItem);
    convertMainStat(rawItem);
    convertSubStats(rawItem);
    convertId(rawItem);
    convertEquippedId(rawItem);
    convertOtherworldly(rawItem);
  });

  const filteredItems = filterItems(rawItems, scanType);

  return filteredItems;
}

// The decoder Lambda (fribbels' AWS endpoint, see `api` above) names units from
// ITS OWN hero list, which is no longer maintained — a newly released hero comes
// back with a `code` but no `name`. Resolve the name from the Rex-synced hero
// data instead of silently dropping the unit (2026-08-28: Lisette, c2186).
let heroNameByCode = null;
function heroNameForCode(code) {
  if (!heroNameByCode) {
    heroNameByCode = new Map();
    Object.values(HeroData.getAllHeroData()).forEach((hero) => {
      if (hero.code && hero.name) heroNameByCode.set(hero.code, hero.name);
    });
  }
  return heroNameByCode.get(code) || null;
}

function convertUnits(rawUnits) {
  const namedByCode = [];
  const dropped = [];
  rawUnits.forEach((rawUnit) => {
    try {
      if (!rawUnit.name && rawUnit.code) {
        const resolved = heroNameForCode(rawUnit.code);
        if (resolved) {
          rawUnit.name = resolved;
          namedByCode.push(`${resolved} (${rawUnit.code})`);
        }
      }
      if (!rawUnit.name || !rawUnit.id) {
        dropped.push({ id: rawUnit.id, code: rawUnit.code, name: rawUnit.name });
        return;
      }

      rawUnit.stars = rawUnit.g;
      rawUnit.awaken = rawUnit.z;
    } catch (e) {
      Log.error('Error converting unit:', e);
    }
  });

  Log.info(
    `[Scanner] units: ${rawUnits.length} decoded, ${namedByCode.length} named by code, ${dropped.length} dropped`,
  );
  if (namedByCode.length) Log.info('[Scanner] named by code:', namedByCode);
  if (dropped.length) Log.warn('[Scanner] dropped units (no resolvable name/id):', dropped);

  return rawUnits.filter((x) => !!x.name);
}

async function finishedReading(scanData, scanType) {
  try {
    if (scanData.length === 0) {
      if (Files.isMac()) {
        Dialog.htmlError(
          "The scanner did not find any data. Please check that you have <a href='https://github.com/fribbels/Fribbels-Epic-7-Optimizer#using-the-auto-importer'>Python and Wireshark installed</a> correctly, then try again.",
        );
      } else {
        Dialog.htmlError(
          "The scanner did not find any data. Please check that you have <a href='https://github.com/fribbels/Fribbels-Epic-7-Optimizer#using-the-auto-importer'>Python and Npcap installed</a> correctly, then try again.",
        );
      }
      document.querySelectorAll('.scanExportOutputText').forEach((x) => {
        x.value = i18next.t('The scanner did not find any data.');
      });
      return;
    }

    const response = await postData(`${api}/getItems`, {
      data: scanData,
    });

    if (response.status === 'SUCCESS') {
      const equips = response.data || [];
      const units = response.units || [];
      const rawItems = equips.filter((x) => !!x.f);
      const lengths = units.map((a) => a.length);
      const index = lengths.indexOf(Math.max(...lengths));

      const rawUnits = index === -1 ? [] : units[index];

      if (rawItems.length === 0) {
        // This case is impossible?
        document.querySelectorAll('.scanExportOutputText').forEach((x) => {
          x.value = i18next.t('Item reading failed, please try again.');
        });
        Notifier.error(
          'Failed reading items, please try again. No items were found.',
        );
        Dialog.htmlError(
          `
No items were found during the scan. This can happen due to network compatibility issues. Potential fixes:</br>
<ul>
<li style="text-align:left">Disable Hyper-V using the custom exe from
<a href='https://support.bluestacks.com/hc/en-us/articles/4409852112781-Solution-for-Incompatible-Windows-settings-on-BlueStacks-5-when-Hyper-V-is-enabled#%E2%80%9C2%E2%80%9D'>Bluestacks support</a>
</li>
<li style="text-align:left">Turn off any VPN before scanning</li>
<li style="text-align:left">Unblock/allow an eception for the optimizer in your firewall</li>
<li style="text-align:left">Disable "virtual machine platform" in the "Turn Windows features on/off" menu in the control panel</li>
<li style="text-align:left">Your network connection might be unstable - Try a wired connection instead of wifi, or find a location with better connection</li>
<li style="text-align:left">Try a different computer to run the importer</li>
</ul>
`,
        );
        return;
      }

      const convertedItems = convertItems(rawItems, scanType);
      const lv0items = convertedItems.filter((x) => x.level === 0);

      const convertedHeroes = convertUnits(rawUnits);

      const failedItemsText =
        lv0items.length > 0
          ? `${i18next.t('<br><br>There were <b>')}${
              lv0items.length
            }${i18next.t(
              '</b> items with issues.<br>Use the Level=0 filter to fix them on the Gear Tab.',
            )}`
          : '';
      Dialog.htmlSuccess(
        `${i18next.t('Finished scanning <b>')}${
          convertedItems.length
        }${i18next.t('</b> items.')} ${failedItemsText}`,
      );

      const serializedStr = `{"items":${ItemSerializer.serialize(
        convertedItems,
      )}, "heroes":${JSON.stringify(convertedHeroes)}}`;
      document.querySelectorAll('.scanExportOutputText').forEach((x) => {
        x.value = serializedStr;
      });
    } else {
      document.querySelectorAll('.scanExportOutputText').forEach((x) => {
        x.value = i18next.t('Item reading failed, please try again.');
      });
      Notifier.error('Failed reading items, please try again.');
      Dialog.htmlError(
        "Scanner found data, but could not read the gear. Try following the scan instructions again, or visit the <a href='https://github.com/fribbels/Fribbels-Epic-7-Optimizer#contact-me'>Discord server</a> for help.",
      );
    }
  } catch (e) {
    document.querySelectorAll('.scanExportOutputText').forEach((x) => {
      x.value = i18next.t('Item reading failed, please try again.');
    });
    Dialog.htmlError(
      i18next.t(
        "Unexpected error while scanning items. Please check that you have <a href='https://github.com/fribbels/Fribbels-Epic-7-Optimizer#using-the-auto-importer'>Python and Wireshark installed</a> correctly, then try again. Error: ",
      ) + e,
    );
  }
}

function findcommand() {
  let commands = ['py', 'python', 'python3'];

  if (Files.isMac()) {
    commands = ['python3', 'python', 'py'];
  }

  commands.find((cmd) => {
    const { error, status } = childProcess.spawnSync(cmd);

    if (error || status !== 0) {
      return false;
    }
    command = cmd;
    return true;
  });
}

function launchScanner(cmd, scanType) {
  try {
    data = [];

    if (scannerChild) {
      scannerChild.kill();
    }

    if (findCommandSpawn) {
      findCommandSpawn.kill();
      findCommandSpawn = null;
    }

    const bufferArray = [];

    try {
      const scannerPyPath = Files.getScannerPyPath();
      Log.debug('[Scanner] launching scanner.py at:', scannerPyPath);
      scannerChild = childProcess.spawn(cmd, [Files.path(scannerPyPath)]);
    } catch (e) {
      Notifier.error(i18next.t('Unable to start python script ') + e);
    }

    if (!scannerChild) return;
    scannerChild.stderr.resume();

    scannerChild.on('error', (err) => {
      Log.error('[Scanner] child process error:', err);
    });
    scannerChild.on('exit', (code, signal) => {
      Log.debug('[Scanner] child process exited code:', code, 'signal:', signal);
    });

    scannerChild.stderr.on('data', (chunk) => {
      Log.warn('[Scanner] stderr:', chunk.toString());
    });

    scannerChild.stdout.on('data', (chunk) => {
      const message = chunk.toString();
      Log.debug(
        '[Scanner] stdout chunk length:',
        message.length,
        'includesDONE:',
        message.includes('DONE'),
      );

      bufferArray.push(message);

      if (message.includes('DONE')) {
        data = bufferArray
          .join('')
          .split('&')
          .filter((x) => !x.includes('DONE'))
          .map((x) => x.replace(/\s/g, ''));
        Log.debug('[Scanner] DONE received, data segments:', data.length);
        finishedReading(data, scanType);
      } else {
        data.push(message);
      }
    });
    document.querySelectorAll('.scanExportOutputText').forEach((x) => {
      x.value = i18next.t('Started scanning...');
    });
  } catch (e) {
    document.querySelectorAll('.scanExportOutputText').forEach((x) => {
      x.value = i18next.t(
        'Failed to start scanning, make sure you have Python and pcap installed.',
      );
    });
    Notifier.error(e);
  }
}

const Scanner = {
  initialize: () => {
    findcommand();
  },

  start: (scanType) => {
    launchScanner(command, scanType);
  },

  switchApi: () => {
    if (api === 'https://krivpfvxi0.execute-api.us-west-2.amazonaws.com/dev') {
      api = 'http://127.0.0.1:5000';
    } else {
      api = 'https://krivpfvxi0.execute-api.us-west-2.amazonaws.com/dev';
    }
  },

  end: async () => {
    try {
      Log.debug(
        '[Scanner] end() called, scannerChild:',
        !!scannerChild,
        'stdin writable:',
        scannerChild?.stdin?.writable,
        'stdin:',
        !!scannerChild?.stdin,
      );

      if (!scannerChild) {
        Notifier.error('No scan was started');
        return;
      }

      document.querySelectorAll('.scanExportOutputText').forEach((x) => {
        x.value = i18next.t(
          'Reading items, this may take up to 30 seconds...\nData will appear here after it is done.',
        );
      });

      if (!scannerChild.stdin) {
        Log.error('[Scanner] stdin is null — cannot send END signal');
        Notifier.error('Scanner stdin unavailable — cannot stop scan');
        return;
      }

      Log.debug('[Scanner] writing END to stdin...');
      scannerChild.stdin.write('END\n', (err) => {
        if (err) {
          Log.error('[Scanner] stdin.write error:', err);
        } else {
          Log.debug('[Scanner] END written to stdin successfully');
        }
      });
    } catch (e) {
      Log.error('[Scanner] end() caught error:', e);
      Dialog.htmlError(
        i18next.t(
          "Unexpected error while scanning items. Please check that you have <a href='https://github.com/fribbels/Fribbels-Epic-7-Optimizer#using-the-auto-importer'>Python and Wireshark installed</a> correctly, then try again. Error: ",
        ) + e,
      );
    }
  },

  // Quietly terminate the scanner child if one is running. Unlike end() (which
  // gracefully signals END and errors when idle), this no-ops when no scan is
  // active — used for app-close cleanup so a mid-scan quit doesn't leave the
  // Python process running.
  kill: () => {
    if (scannerChild) {
      scannerChild.kill();
      scannerChild = null;
    }
  },
};

globalThis.finishedReading = finishedReading;

export default Scanner;
