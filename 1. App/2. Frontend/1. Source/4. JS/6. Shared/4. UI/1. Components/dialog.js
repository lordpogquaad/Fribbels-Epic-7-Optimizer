/* global $, i18next, Utils, Settings, OptimizerTab */

import Swal from 'sweetalert2';
import Sortable from 'sortablejs';
import tippy from 'tippy.js';
import Artifact from '../../3. Services/artifact';
import Api from '../../3. Services/api';
import HeroData from '../../3. Services/heroData';
import ItemAugmenter from '../../../2. Gear & Enhancing Tab/3. Gear/itemAugmenter';
import Reforge from '../../../2. Gear & Enhancing Tab/3. Gear/reforge';
import Assets from './assets';
import RtaStats from '../../3. Services/rtaStats';
import CommunityBuilds from '../../3. Services/communityBuilds';
import StoveRta from '../../3. Services/stoveRta';
import Selectors from '../2. Display/selectors';

tippy.setDefaultProps({
  allowHTML: true,
  placement: 'auto',
  maxWidth: 550,
});

const stats = [
  'Attack',
  'Health',
  'Defense',
  'CriticalHitDamagePercent',
  'CriticalHitChancePercent',
  'HealthPercent',
  'DefensePercent',
  'AttackPercent',
  'EffectivenessPercent',
  'EffectResistancePercent',
  'Speed',
];

let e7StatToDisplayStat = {};

let optimizerStatToDisplayStat = {};

// --- Per-Slot Priorities dialog -------------------------------------------
const SLOT_PRIORITY_SLOTS = [
  'Weapon',
  'Helmet',
  'Armor',
  'Necklace',
  'Ring',
  'Boots',
];
// Per-slot legal substats (ITEM_ALLOWED_SUBSTATS).  Fixed-main slots exclude
// their flat main (Weapon=flat ATK, Helmet=flat HP, Armor=flat DEF) plus the
// hard slot bans (Weapon: no DEF at all; Armor: no ATK at all).
// null = all 11 allowed (accessories).
const SLOT_PRIORITY_ALLOWED = {
  Weapon: [
    'AttackPercent',
    'Health',
    'HealthPercent',
    'Speed',
    'CriticalHitChancePercent',
    'CriticalHitDamagePercent',
    'EffectivenessPercent',
    'EffectResistancePercent',
  ],
  Helmet: [
    'Attack',
    'AttackPercent',
    'Defense',
    'DefensePercent',
    'HealthPercent',
    'Speed',
    'CriticalHitChancePercent',
    'CriticalHitDamagePercent',
    'EffectivenessPercent',
    'EffectResistancePercent',
  ],
  Armor: [
    'DefensePercent',
    'Health',
    'HealthPercent',
    'Speed',
    'CriticalHitChancePercent',
    'CriticalHitDamagePercent',
    'EffectivenessPercent',
    'EffectResistancePercent',
  ],
  Necklace: null,
  Ring: null,
  Boots: null,
};
const _slotPrioAllowed = (slot, key) => {
  const a = SLOT_PRIORITY_ALLOWED[slot];
  return !a || a.includes(key);
};

function outsideClickDisable() {
  const popup = Swal.getPopup();
  popup.classList.remove('swal2-show');
  setTimeout(() => {
    popup.classList.add('animate__animated', 'animate__headShake');
  });
  setTimeout(() => {
    popup.classList.remove('animate__animated', 'animate__headShake');
  }, 500);
  return false;
}

const Dialog = {
  initialize: () => {
    e7StatToDisplayStat = {
      att_rate: i18next.t('% Attack'),
      max_hp_rate: i18next.t('% Health'),
      def_rate: i18next.t('% Defense'),
      att: i18next.t(' Attack'),
      max_hp: i18next.t(' Health'),
      def: i18next.t(' Defense'),
      speed: i18next.t(' Speed'),
      res: i18next.t('% Res'),
      cri: i18next.t('% Crit rate'),
      acc: i18next.t('% Eff'),
      coop: i18next.t(' Dual Attack'),
    };

    optimizerStatToDisplayStat = {
      AttackPercent: 'ATK%',
      HealthPercent: 'HP%',
      DefensePercent: 'DEF%',
      Attack: 'ATK',
      Health: 'HP',
      Defense: 'DEF',
      Speed: 'SPD',
      EffectResistancePercent: 'ER%',
      CriticalHitChancePercent: 'CC%',
      CriticalHitDamagePercent: 'CD%',
      EffectivenessPercent: 'EFF%',
      DualAttackChancePercent: 'DualAttackChancePercent',
    };
  },

  /**
   * Per-Slot Priorities editor.  Tabbed Global + 6 slot tabs.  Each slot is a
   * fully-materialized 8-category row authored as a 9-roll budget: per category a
   * base checkbox (1) + a 1–5 enhance input (effective weight = checked ? 1+enh : 0,
   * cap 6).  Soft-normalized to 9 per slot at scoring time, so these weights drive
   * BOTH the slot filter cut AND the build ranking (item.priority).  Returns a
   * materialized slotPriorityConfig { Weapon:{atk,hp,def,spd,cr,cd,eff,res}, ... }
   * for all 6 slots, or null if cancelled.
   */
  editSlotPrioritiesDialog: async (currentConfig, globalWeights) => {
    const cfg = currentConfig || {};
    const gw = globalWeights || {};
    // The 11 real substat TYPES (flat & % distinct).  `cat` is the substat-type key
    // used for storage + DOM data attributes; `gcat` is the 8-slider category used
    // to seed from / average back to the global weights.
    const SLOT_CATS = [
      { cat: 'Attack', gcat: 'atk', label: 'ATK (flat)', icon: 'Attack' },
      {
        cat: 'AttackPercent',
        gcat: 'atk',
        label: 'ATK %',
        icon: 'AttackPercent',
      },
      { cat: 'Health', gcat: 'hp', label: 'HP (flat)', icon: 'Health' },
      {
        cat: 'HealthPercent',
        gcat: 'hp',
        label: 'HP %',
        icon: 'HealthPercent',
      },
      { cat: 'Defense', gcat: 'def', label: 'DEF (flat)', icon: 'Defense' },
      {
        cat: 'DefensePercent',
        gcat: 'def',
        label: 'DEF %',
        icon: 'DefensePercent',
      },
      { cat: 'Speed', gcat: 'spd', label: 'SPD', icon: 'Speed' },
      {
        cat: 'CriticalHitChancePercent',
        gcat: 'cr',
        label: 'CC %',
        icon: 'CriticalHitChancePercent',
      },
      {
        cat: 'CriticalHitDamagePercent',
        gcat: 'cd',
        label: 'CD %',
        icon: 'CriticalHitDamagePercent',
      },
      {
        cat: 'EffectivenessPercent',
        gcat: 'eff',
        label: 'EFF %',
        icon: 'EffectivenessPercent',
      },
      {
        cat: 'EffectResistancePercent',
        gcat: 'res',
        label: 'ER %',
        icon: 'EffectResistancePercent',
      },
    ];
    // The 8 global categories (read-only echo on the Global tab).
    const GLOBAL_CATS = [
      { gcat: 'atk', label: 'ATK', icon: 'AttackPercent' },
      { gcat: 'hp', label: 'HP', icon: 'HealthPercent' },
      { gcat: 'def', label: 'DEF', icon: 'DefensePercent' },
      { gcat: 'spd', label: 'SPD', icon: 'Speed' },
      { gcat: 'cr', label: 'CC', icon: 'CriticalHitChancePercent' },
      { gcat: 'cd', label: 'CD', icon: 'CriticalHitDamagePercent' },
      { gcat: 'eff', label: 'EFF', icon: 'EffectivenessPercent' },
      { gcat: 'res', label: 'ER', icon: 'EffectResistancePercent' },
    ];
    const catLegal = (slot, type) => _slotPrioAllowed(slot, type);
    const catIcon = (c) =>
      (Assets && Assets.getAssetByStat ? Assets.getAssetByStat(c.icon) : '') ||
      '';
    // Effective weight (0 or 1–6) → {checked, enhance(0–5)} for the inputs.
    const decompose = (w) => {
      if (!(w > 0)) return { checked: false, enhance: 0 };
      return {
        checked: true,
        enhance: Math.max(0, Math.min(5, Math.round(w - 1))),
      };
    };
    // Initial effective weight for a (slot, type): saved row, else seed from the
    // type's global category weight.
    const seedWeight = (slot, c) => {
      if (!catLegal(slot, c.cat)) return 0;
      const sc = cfg[slot];
      const raw = sc && sc[c.cat] != null ? sc[c.cat] : gw[c.gcat];
      return Number.isFinite(raw) ? raw : 0;
    };

    const catRow = (slot, c) => {
      const legal = catLegal(slot, c.cat);
      const { checked, enhance } = decompose(seedWeight(slot, c));
      const eff = legal && checked ? 1 + enhance : 0;
      return `
        <div class="slotPrioCatRow" style="display:flex;align-items:center;gap:6px;margin:3px 0;${legal ? '' : 'opacity:0.35;'}">
          <img src="${catIcon(c)}" style="width:18px;height:18px;object-fit:contain;" alt="${c.label}" title="${c.label}" />
          <span style="width:58px;font-size:12px;text-align:left;">${c.label}</span>
          <label style="display:flex;align-items:center;gap:3px;font-size:11px;" title="${i18next.t('Base substat (1 roll)')}">
            <input type="checkbox" class="slotPrioBase" data-slot="${slot}" data-cat="${c.cat}" ${checked ? 'checked' : ''} ${legal ? '' : 'disabled'} />
            <span style="opacity:0.7;">base</span>
          </label>
          <button type="button" class="priority-step-btn priority-coarse slotPrioEnhStep" data-slot="${slot}" data-cat="${c.cat}" data-delta="-1" title="−1" ${checked && legal ? '' : 'disabled'}>−</button>
          <input type="number" class="slotPrioEnh" data-slot="${slot}" data-cat="${c.cat}"
            min="0" max="5" step="1" value="${enhance}" ${checked && legal ? '' : 'disabled'}
            style="width:38px;" title="${i18next.t('Enhance rolls (0–5)')}" />
          <button type="button" class="priority-step-btn priority-coarse slotPrioEnhStep" data-slot="${slot}" data-cat="${c.cat}" data-delta="1" title="+1" ${checked && legal ? '' : 'disabled'}>+</button>
          <span class="slotPrioEff" data-slot="${slot}" data-cat="${c.cat}" style="width:34px;font-size:11px;opacity:0.85;">= ${eff}</span>
        </div>`;
    };

    const slotPanel = (slot) => `
        <div class="modTabPanel modTabPanelHidden" id="slotPrioPanel_${slot}">
          <div style="font-size:11px;opacity:0.7;margin:2px 0 4px;max-width:340px;">
            ${i18next.t('Allocate this piece’s 9-roll budget: tick the 4 base substats and spread the enhance rolls (0–5). Weights drive both this slot’s filter cut and the build ranking.')}
          </div>
          ${SLOT_CATS.map((c) => catRow(slot, c)).join('')}
          <div class="slotPrioBudget" id="slotPrioBudget_${slot}" style="font-size:12px;margin-top:6px;opacity:0.9;"></div>
          <button type="button" class="slotPrioReset" data-slot="${slot}" style="margin-top:6px;font-size:11px;">${i18next.t('Reset slot to global')}</button>
        </div>`;

    const globalRow = (c) => `
        <div style="display:flex;align-items:center;gap:6px;margin:3px 0;">
          <img src="${catIcon(c)}" style="width:18px;height:18px;object-fit:contain;" alt="${c.label}" />
          <span style="width:58px;font-size:12px;">${c.label}</span>
          <span style="font-size:12px;opacity:0.85;">${Number.isFinite(gw[c.gcat]) ? Math.round(gw[c.gcat] * 10) / 10 : 0}</span>
        </div>`;
    const globalPanel = `
      <div class="modTabPanel" id="slotPrioPanel_Global">
        <div style="font-size:12px;opacity:0.8;margin-bottom:6px;max-width:340px;">
          ${i18next.t('Your global priority weights — the legal-slot average of the per-slot rows. Editing a slot updates these; moving a global slider broadcasts to every slot.')}
        </div>
        ${GLOBAL_CATS.map(globalRow).join('')}
      </div>`;

    const tabBar = `
      <div class="modSlotTabBar">
        <div class="modSlotTab modSlotTabActive" id="slotPrioTab_Global" data-tab="Global">${i18next.t('Global')}</div>
        ${SLOT_PRIORITY_SLOTS.map((s) => `<div class="modSlotTab" id="slotPrioTab_${s}" data-tab="${s}">${i18next.t(s)}</div>`).join('')}
      </div>`;

    const html = `
      <div style="text-align:left;">
        ${tabBar}
        ${globalPanel}
        ${SLOT_PRIORITY_SLOTS.map(slotPanel).join('')}
      </div>`;

    const { value } = await Swal.fire({
      title: i18next.t('Per-Slot Priorities'),
      width: 460,
      html,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: i18next.t('OK'),
      cancelButtonText: i18next.t('Cancel'),
      didOpen: () => {
        const popup = Swal.getPopup();

        const effOf = (slot, cat) => {
          const base = popup.querySelector(
            `.slotPrioBase[data-slot="${slot}"][data-cat="${cat}"]`,
          );
          const enh = popup.querySelector(
            `.slotPrioEnh[data-slot="${slot}"][data-cat="${cat}"]`,
          );
          if (!base || base.disabled || !base.checked) return 0;
          let e = parseFloat(enh.value);
          if (!Number.isFinite(e)) e = 0;
          e = Math.max(0, Math.min(5, Math.round(e)));
          return 1 + e;
        };
        const refreshSlot = (slot) => {
          let sum = 0;
          SLOT_CATS.forEach((c) => {
            const eff = effOf(slot, c.cat);
            sum += eff;
            const span = popup.querySelector(
              `.slotPrioEff[data-slot="${slot}"][data-cat="${c.cat}"]`,
            );
            if (span) span.textContent = `= ${eff}`;
          });
          const b = popup.querySelector(`#slotPrioBudget_${slot}`);
          if (b) {
            const r = Math.round(sum * 10) / 10;
            b.textContent = `${i18next.t('Budget')}: ${r} / 9`;
            b.style.color = r === 0 ? '#c0392b' : '';
          }
        };

        popup.querySelectorAll('.modSlotTab').forEach((btn) => {
          btn.addEventListener('click', () => {
            const tab = btn.dataset.tab;
            popup
              .querySelectorAll('.modSlotTab')
              .forEach((b) => b.classList.remove('modSlotTabActive'));
            btn.classList.add('modSlotTabActive');
            popup
              .querySelectorAll('.modTabPanel')
              .forEach((p) => p.classList.add('modTabPanelHidden'));
            const panel = popup.querySelector(`#slotPrioPanel_${tab}`);
            if (panel) panel.classList.remove('modTabPanelHidden');
          });
        });

        // Enable/disable a category's enhance input + its − / + step buttons.
        const toggleEnh = (slot, cat, on) => {
          const enh = popup.querySelector(
            `.slotPrioEnh[data-slot="${slot}"][data-cat="${cat}"]`,
          );
          if (enh) enh.disabled = !on;
          popup
            .querySelectorAll(
              `.slotPrioEnhStep[data-slot="${slot}"][data-cat="${cat}"]`,
            )
            .forEach((b) => {
              b.disabled = !on;
            });
        };

        popup.querySelectorAll('.slotPrioBase').forEach((cb) => {
          cb.addEventListener('change', () => {
            const { slot, cat } = cb.dataset;
            toggleEnh(slot, cat, cb.checked);
            refreshSlot(slot);
          });
        });
        popup.querySelectorAll('.slotPrioEnh').forEach((inp) => {
          inp.addEventListener('input', () => refreshSlot(inp.dataset.slot));
        });
        popup.querySelectorAll('.slotPrioEnhStep').forEach((btn) => {
          btn.addEventListener('click', () => {
            const { slot, cat, delta } = btn.dataset;
            const enh = popup.querySelector(
              `.slotPrioEnh[data-slot="${slot}"][data-cat="${cat}"]`,
            );
            if (!enh || enh.disabled) return;
            let e = parseFloat(enh.value);
            if (!Number.isFinite(e)) e = 0;
            enh.value = Math.max(0, Math.min(5, e + parseFloat(delta)));
            refreshSlot(slot);
          });
        });
        popup.querySelectorAll('.slotPrioReset').forEach((btn) => {
          btn.addEventListener('click', () => {
            const { slot } = btn.dataset;
            SLOT_CATS.forEach((c) => {
              const base = popup.querySelector(
                `.slotPrioBase[data-slot="${slot}"][data-cat="${c.cat}"]`,
              );
              const enh = popup.querySelector(
                `.slotPrioEnh[data-slot="${slot}"][data-cat="${c.cat}"]`,
              );
              if (!base || base.disabled) return;
              const { checked, enhance } = decompose(
                Number.isFinite(gw[c.gcat]) ? gw[c.gcat] : 0,
              );
              base.checked = checked;
              enh.value = enhance;
              toggleEnh(slot, c.cat, checked);
            });
            refreshSlot(slot);
          });
        });

        SLOT_PRIORITY_SLOTS.forEach(refreshSlot);
      },
      preConfirm: () => {
        const popup = Swal.getPopup();
        const out = {};
        SLOT_PRIORITY_SLOTS.forEach((slot) => {
          const entry = {};
          SLOT_CATS.forEach((c) => {
            const base = popup.querySelector(
              `.slotPrioBase[data-slot="${slot}"][data-cat="${c.cat}"]`,
            );
            const enh = popup.querySelector(
              `.slotPrioEnh[data-slot="${slot}"][data-cat="${c.cat}"]`,
            );
            if (!base || base.disabled || !base.checked) {
              entry[c.cat] = 0;
              return;
            }
            let e = parseFloat(enh.value);
            if (!Number.isFinite(e)) e = 0;
            e = Math.max(0, Math.min(5, Math.round(e)));
            entry[c.cat] = 1 + e;
          });
          out[slot] = entry;
        });
        return out;
      },
    });

    return value || null;
  },

  /**
   * Per-Set Priorities editor.  One tab per currently-forced set (+ a Global echo).
   * Each set has an "override global" checkbox and 8 category rows (same base + 1–5
   * enhance budget inputs as the slot dialog — sets don't restrict substats).  An
   * enabled set's weights take precedence over the slot/global weights for items of
   * that set, in both the cut and the build ranking.  Returns a setPriorityConfig
   * { SpeedSet:{enabled, atk,...res}, ... }, or null if cancelled.
   */
  editSetPrioritiesDialog: async (currentConfig, globalWeights, forcedSets) => {
    const cfg = currentConfig || {};
    const gw = globalWeights || {};
    const sets = (forcedSets || []).slice();
    // 11 real substat TYPES (sets don't restrict substats — all legal).  `cat` is
    // the type key (storage + DOM); `gcat` is the global category for seeding.
    const SET_CATS = [
      { cat: 'Attack', gcat: 'atk', label: 'ATK (flat)', icon: 'Attack' },
      {
        cat: 'AttackPercent',
        gcat: 'atk',
        label: 'ATK %',
        icon: 'AttackPercent',
      },
      { cat: 'Health', gcat: 'hp', label: 'HP (flat)', icon: 'Health' },
      {
        cat: 'HealthPercent',
        gcat: 'hp',
        label: 'HP %',
        icon: 'HealthPercent',
      },
      { cat: 'Defense', gcat: 'def', label: 'DEF (flat)', icon: 'Defense' },
      {
        cat: 'DefensePercent',
        gcat: 'def',
        label: 'DEF %',
        icon: 'DefensePercent',
      },
      { cat: 'Speed', gcat: 'spd', label: 'SPD', icon: 'Speed' },
      {
        cat: 'CriticalHitChancePercent',
        gcat: 'cr',
        label: 'CC %',
        icon: 'CriticalHitChancePercent',
      },
      {
        cat: 'CriticalHitDamagePercent',
        gcat: 'cd',
        label: 'CD %',
        icon: 'CriticalHitDamagePercent',
      },
      {
        cat: 'EffectivenessPercent',
        gcat: 'eff',
        label: 'EFF %',
        icon: 'EffectivenessPercent',
      },
      {
        cat: 'EffectResistancePercent',
        gcat: 'res',
        label: 'ER %',
        icon: 'EffectResistancePercent',
      },
    ];
    const GLOBAL_CATS = [
      { gcat: 'atk', label: 'ATK', icon: 'AttackPercent' },
      { gcat: 'hp', label: 'HP', icon: 'HealthPercent' },
      { gcat: 'def', label: 'DEF', icon: 'DefensePercent' },
      { gcat: 'spd', label: 'SPD', icon: 'Speed' },
      { gcat: 'cr', label: 'CC', icon: 'CriticalHitChancePercent' },
      { gcat: 'cd', label: 'CD', icon: 'CriticalHitDamagePercent' },
      { gcat: 'eff', label: 'EFF', icon: 'EffectivenessPercent' },
      { gcat: 'res', label: 'ER', icon: 'EffectResistancePercent' },
    ];
    const catIcon = (c) =>
      (Assets && Assets.getAssetByStat ? Assets.getAssetByStat(c.icon) : '') ||
      '';
    const setIcon = (set) =>
      (Assets && Assets.getSetAsset ? Assets.getSetAsset(set) : '') || '';
    const decompose = (w) => {
      if (!(w > 0)) return { checked: false, enhance: 0 };
      return {
        checked: true,
        enhance: Math.max(0, Math.min(5, Math.round(w - 1))),
      };
    };
    const seedWeight = (set, c) => {
      const sc = cfg[set];
      const raw = sc && sc[c.cat] != null ? sc[c.cat] : gw[c.gcat];
      return Number.isFinite(raw) ? raw : 0;
    };

    const catRow = (set, c) => {
      const { checked, enhance } = decompose(seedWeight(set, c));
      const eff = checked ? 1 + enhance : 0;
      return `
        <div style="display:flex;align-items:center;gap:6px;margin:3px 0;">
          <img src="${catIcon(c)}" style="width:18px;height:18px;object-fit:contain;" alt="${c.label}" />
          <span style="width:58px;font-size:12px;">${c.label}</span>
          <label style="display:flex;align-items:center;gap:3px;font-size:11px;" title="${i18next.t('Base substat (1 roll)')}">
            <input type="checkbox" class="setPrioBase" data-set="${set}" data-cat="${c.cat}" ${checked ? 'checked' : ''} />
            <span style="opacity:0.7;">base</span>
          </label>
          <button type="button" class="priority-step-btn priority-coarse setPrioEnhStep" data-set="${set}" data-cat="${c.cat}" data-delta="-1" title="−1" ${checked ? '' : 'disabled'}>−</button>
          <input type="number" class="setPrioEnh" data-set="${set}" data-cat="${c.cat}"
            min="0" max="5" step="1" value="${enhance}" ${checked ? '' : 'disabled'}
            style="width:38px;" title="${i18next.t('Enhance rolls (0–5)')}" />
          <button type="button" class="priority-step-btn priority-coarse setPrioEnhStep" data-set="${set}" data-cat="${c.cat}" data-delta="1" title="+1" ${checked ? '' : 'disabled'}>+</button>
          <span class="setPrioEff" data-set="${set}" data-cat="${c.cat}" style="width:34px;font-size:11px;opacity:0.85;">= ${eff}</span>
        </div>`;
    };

    const setPanel = (set) => {
      const enabled = !!(cfg[set] && cfg[set].enabled);
      return `
        <div class="modTabPanel modTabPanelHidden" id="setPrioPanel_${set}">
          <div class="slotOverrideRow">
            <label class="slotOverrideLabel">
              <input type="checkbox" class="setPrioOverride" id="setPrioOverride_${set}" data-set="${set}" ${enabled ? 'checked' : ''} />
              <span>${i18next.t('Use a custom priority for this set')}</span>
            </label>
          </div>
          <div style="font-size:11px;opacity:0.7;margin:2px 0 4px;max-width:340px;">
            ${i18next.t('Applies to pieces of this set only, taking precedence over the slot/global weights. Same 9-roll budget inputs.')}
          </div>
          <div class="setPrioInputs${enabled ? '' : ' slotSectionDimmed'}" id="setPrioInputs_${set}">
            ${SET_CATS.map((c) => catRow(set, c)).join('')}
            <div class="setPrioBudget" id="setPrioBudget_${set}" style="font-size:12px;margin-top:6px;opacity:0.9;"></div>
          </div>
        </div>`;
    };

    const globalPanel = `
      <div class="modTabPanel" id="setPrioPanel_Global">
        <div style="font-size:12px;opacity:0.8;margin-bottom:6px;max-width:340px;">
          ${i18next.t('Your global priority weights (per-set tabs override these for matching pieces).')}
        </div>
        ${GLOBAL_CATS.map(
          (c) => `
          <div style="display:flex;align-items:center;gap:6px;margin:3px 0;">
            <img src="${catIcon(c)}" style="width:18px;height:18px;object-fit:contain;" alt="${c.label}" />
            <span style="width:58px;font-size:12px;">${c.label}</span>
            <span style="font-size:12px;opacity:0.85;">${Number.isFinite(gw[c.gcat]) ? Math.round(gw[c.gcat] * 10) / 10 : 0}</span>
          </div>`,
        ).join('')}
      </div>`;

    if (sets.length === 0) {
      await Swal.fire({
        title: i18next.t('Per-Set Priorities'),
        text: i18next.t(
          'Force at least one set first to set per-set priorities.',
        ),
        confirmButtonText: i18next.t('OK'),
      });
      return null;
    }

    const tabBar = `
      <div class="modSlotTabBar">
        <div class="modSlotTab modSlotTabActive" id="setPrioTab_Global" data-tab="Global">${i18next.t('Global')}</div>
        ${sets.map((s) => `<div class="modSlotTab" id="setPrioTab_${s}" data-tab="${s}"><img src="${setIcon(s)}" style="width:16px;height:16px;vertical-align:middle;margin-right:2px;" alt="" />${i18next.t(s)}</div>`).join('')}
      </div>`;

    const html = `
      <div style="text-align:left;">
        ${tabBar}
        ${globalPanel}
        ${sets.map(setPanel).join('')}
      </div>`;

    const { value } = await Swal.fire({
      title: i18next.t('Per-Set Priorities'),
      width: 460,
      html,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: i18next.t('OK'),
      cancelButtonText: i18next.t('Cancel'),
      didOpen: () => {
        const popup = Swal.getPopup();
        const effOf = (set, cat) => {
          const base = popup.querySelector(
            `.setPrioBase[data-set="${set}"][data-cat="${cat}"]`,
          );
          const enh = popup.querySelector(
            `.setPrioEnh[data-set="${set}"][data-cat="${cat}"]`,
          );
          if (!base || !base.checked) return 0;
          let e = parseFloat(enh.value);
          if (!Number.isFinite(e)) e = 0;
          return 1 + Math.max(0, Math.min(5, Math.round(e)));
        };
        const refreshSet = (set) => {
          let sum = 0;
          SET_CATS.forEach((c) => {
            const eff = effOf(set, c.cat);
            sum += eff;
            const span = popup.querySelector(
              `.setPrioEff[data-set="${set}"][data-cat="${c.cat}"]`,
            );
            if (span) span.textContent = `= ${eff}`;
          });
          const b = popup.querySelector(`#setPrioBudget_${set}`);
          if (b)
            b.textContent = `${i18next.t('Budget')}: ${Math.round(sum * 10) / 10} / 9`;
        };

        popup.querySelectorAll('.modSlotTab').forEach((btn) => {
          btn.addEventListener('click', () => {
            const tab = btn.dataset.tab;
            popup
              .querySelectorAll('.modSlotTab')
              .forEach((b) => b.classList.remove('modSlotTabActive'));
            btn.classList.add('modSlotTabActive');
            popup
              .querySelectorAll('.modTabPanel')
              .forEach((p) => p.classList.add('modTabPanelHidden'));
            const panel = popup.querySelector(`#setPrioPanel_${tab}`);
            if (panel) panel.classList.remove('modTabPanelHidden');
          });
        });

        const toggleEnh = (set, cat, on) => {
          const enh = popup.querySelector(
            `.setPrioEnh[data-set="${set}"][data-cat="${cat}"]`,
          );
          if (enh) enh.disabled = !on;
          popup
            .querySelectorAll(
              `.setPrioEnhStep[data-set="${set}"][data-cat="${cat}"]`,
            )
            .forEach((b) => {
              b.disabled = !on;
            });
        };

        popup.querySelectorAll('.setPrioOverride').forEach((cb) => {
          cb.addEventListener('change', () => {
            const { set } = cb.dataset;
            const inputs = popup.querySelector(`#setPrioInputs_${set}`);
            if (inputs)
              inputs.classList.toggle('slotSectionDimmed', !cb.checked);
            if (cb.checked) {
              const anyOn = SET_CATS.some((c) => {
                const b = popup.querySelector(
                  `.setPrioBase[data-set="${set}"][data-cat="${c.cat}"]`,
                );
                return b && b.checked;
              });
              if (!anyOn) {
                SET_CATS.forEach((c) => {
                  const base = popup.querySelector(
                    `.setPrioBase[data-set="${set}"][data-cat="${c.cat}"]`,
                  );
                  const enh = popup.querySelector(
                    `.setPrioEnh[data-set="${set}"][data-cat="${c.cat}"]`,
                  );
                  const { checked, enhance } = decompose(
                    Number.isFinite(gw[c.gcat]) ? gw[c.gcat] : 0,
                  );
                  base.checked = checked;
                  enh.value = enhance;
                  toggleEnh(set, c.cat, checked);
                });
              }
              refreshSet(set);
            }
          });
        });
        popup.querySelectorAll('.setPrioBase').forEach((cb) => {
          cb.addEventListener('change', () => {
            const { set, cat } = cb.dataset;
            toggleEnh(set, cat, cb.checked);
            refreshSet(set);
          });
        });
        popup.querySelectorAll('.setPrioEnh').forEach((inp) => {
          inp.addEventListener('input', () => refreshSet(inp.dataset.set));
        });
        popup.querySelectorAll('.setPrioEnhStep').forEach((btn) => {
          btn.addEventListener('click', () => {
            const { set, cat, delta } = btn.dataset;
            const enh = popup.querySelector(
              `.setPrioEnh[data-set="${set}"][data-cat="${cat}"]`,
            );
            if (!enh || enh.disabled) return;
            let e = parseFloat(enh.value);
            if (!Number.isFinite(e)) e = 0;
            enh.value = Math.max(0, Math.min(5, e + parseFloat(delta)));
            refreshSet(set);
          });
        });
        sets.forEach(refreshSet);
      },
      preConfirm: () => {
        const popup = Swal.getPopup();
        const out = {};
        sets.forEach((set) => {
          const cb = popup.querySelector(`#setPrioOverride_${set}`);
          if (!cb || !cb.checked) {
            out[set] = { enabled: false };
            return;
          }
          const entry = { enabled: true };
          SET_CATS.forEach((c) => {
            const base = popup.querySelector(
              `.setPrioBase[data-set="${set}"][data-cat="${c.cat}"]`,
            );
            const enh = popup.querySelector(
              `.setPrioEnh[data-set="${set}"][data-cat="${c.cat}"]`,
            );
            if (!base || !base.checked) {
              entry[c.cat] = 0;
              return;
            }
            let e = parseFloat(enh.value);
            if (!Number.isFinite(e)) e = 0;
            entry[c.cat] = 1 + Math.max(0, Math.min(5, Math.round(e)));
          });
          out[set] = entry;
        });
        return out;
      },
    });

    return value || null;
  },

  /**
   * Quick Filter (scratch filter) — ad-hoc stat min/max thresholds applied to the
   * already-computed result set WITHOUT touching the user's saved Stat filters or
   * priority weights.  `seed` carries the current request-field values for display;
   * returns an object of the same request fields (blank → null) on Apply, or null
   * if cancelled.  The caller sends these as a noSave filter request override.
   */
  scratchFilterDialog: async (seed) => {
    const s = seed || {};
    const STATS = [
      {
        label: 'Atk',
        icon: 'AttackPercent',
        min: 'inputAtkMinLimit',
        max: 'inputAtkMaxLimit',
      },
      {
        label: 'Hp',
        icon: 'HealthPercent',
        min: 'inputHpMinLimit',
        max: 'inputHpMaxLimit',
      },
      {
        label: 'Def',
        icon: 'DefensePercent',
        min: 'inputDefMinLimit',
        max: 'inputDefMaxLimit',
      },
      {
        label: 'Spd',
        icon: 'Speed',
        min: 'inputSpdMinLimit',
        max: 'inputSpdMaxLimit',
      },
      {
        label: 'CR',
        icon: 'CriticalHitChancePercent',
        min: 'inputCrMinLimit',
        max: 'inputCrMaxLimit',
      },
      {
        label: 'CD',
        icon: 'CriticalHitDamagePercent',
        min: 'inputCdMinLimit',
        max: 'inputCdMaxLimit',
      },
      {
        label: 'Eff',
        icon: 'EffectivenessPercent',
        min: 'inputEffMinLimit',
        max: 'inputEffMaxLimit',
      },
      {
        label: 'Res',
        icon: 'EffectResistancePercent',
        min: 'inputResMinLimit',
        max: 'inputResMaxLimit',
      },
    ];
    const icon = (k) =>
      (Assets && Assets.getAssetByStat ? Assets.getAssetByStat(k) : '') || '';
    const v = (field) => (Number.isFinite(s[field]) ? s[field] : '');
    const row = (st) => `
      <div style="display:flex;align-items:center;gap:6px;margin:3px 0;">
        <img src="${icon(st.icon)}" style="width:18px;height:18px;object-fit:contain;" alt="${st.label}" />
        <span style="width:34px;font-size:12px;">${st.label}</span>
        <input type="number" class="scratchLim" data-field="${st.min}" placeholder="${i18next.t('min')}" value="${v(st.min)}" style="width:74px;" />
        <span style="opacity:0.6;">–</span>
        <input type="number" class="scratchLim" data-field="${st.max}" placeholder="${i18next.t('max')}" value="${v(st.max)}" style="width:74px;" />
      </div>`;
    const html = `
      <div style="text-align:left;">
        <div style="font-size:11px;opacity:0.75;margin-bottom:6px;max-width:340px;">
          ${i18next.t('Filter the displayed results by these thresholds. This does NOT change your saved Stat filters or priority weights. Leave a field blank for no limit; press the main Filter button to return to your saved view.')}
        </div>
        ${STATS.map(row).join('')}
        <button type="button" id="scratchClearBtn" style="margin-top:8px;font-size:11px;">${i18next.t('Clear all')}</button>
      </div>`;
    const { value, isConfirmed } = await Swal.fire({
      title: i18next.t('Quick Filter'),
      width: 420,
      html,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: i18next.t('Apply'),
      cancelButtonText: i18next.t('Cancel'),
      didOpen: () => {
        const popup = Swal.getPopup();
        const clr = popup.querySelector('#scratchClearBtn');
        if (clr) {
          clr.addEventListener('click', () => {
            popup.querySelectorAll('.scratchLim').forEach((el) => {
              el.value = '';
            });
          });
        }
      },
      preConfirm: () => {
        const popup = Swal.getPopup();
        const out = {};
        popup.querySelectorAll('.scratchLim').forEach((el) => {
          const n = parseFloat(el.value);
          out[el.dataset.field] = Number.isFinite(n) ? n : null;
        });
        return out;
      },
    });
    return isConfirmed ? value || {} : null;
  },

  error: (text) => {
    Swal.fire({
      icon: 'error',
      text: i18next.t(text),
      confirmButtonText: i18next.t('OK'),
      allowOutsideClick: outsideClickDisable,
      // cancelButtonText: i18next.t("Cancel")
    });
  },

  info: (text) => {
    Swal.fire({
      icon: 'info',
      text: i18next.t(text),
      confirmButtonText: i18next.t('OK'),
      // cancelButtonText: i18next.t("Cancel")
    });
  },

  success: (text) => {
    Swal.fire({
      icon: 'success',
      text: i18next.t(text),
      confirmButtonText: i18next.t('OK'),
      // cancelButtonText: i18next.t("Cancel")
    });
  },

  htmlSuccess: (html) => {
    Swal.fire({
      icon: 'success',
      html,
      confirmButtonText: i18next.t('OK'),
      // cancelButtonText: i18next.t("Cancel")
    });
  },

  htmlSuccessDisableOutsideClick: (html) => {
    Swal.fire({
      icon: 'success',
      html,
      confirmButtonText: i18next.t('OK'),
      allowOutsideClick: outsideClickDisable,
      // cancelButtonText: i18next.t("Cancel")
    });
  },

  htmlError: (html) => {
    Swal.fire({
      icon: 'error',
      html,
      confirmButtonText: i18next.t('OK'),
      allowOutsideClick: outsideClickDisable,
      // cancelButtonText: i18next.t("Cancel")
    });
  },

  updatePrompt: (text) => {
    return new Promise((resolve, reject) => {
      return Swal.fire({
        icon: 'success',
        text: i18next.t(text),
        showCancelButton: true,
        confirmButtonText: i18next.t('Yes'),
        cancelButtonText: i18next.t('Later'),
        confirmButtonColor: '#51A259',
        allowOutsideClick: outsideClickDisable,
      }).then((result) => {
        if (result.isConfirmed) {
          resolve('restart');
        } else if (result.isDenied) {
          reject(new Error('skip'));
        }
        return null;
      });
    });
  },

  erasePrompt: (text) => {
    return new Promise((resolve, reject) => {
      return Swal.fire({
        icon: 'info',
        text: i18next.t(text),
        showCancelButton: true,
        confirmButtonText: i18next.t('Yes'),
        cancelButtonText: i18next.t('No'),
        confirmButtonColor: '#51A259',
        allowOutsideClick: outsideClickDisable,
      }).then((result) => {
        if (result.isConfirmed) {
          resolve('yes');
        } else if (result.isDenied) {
          reject(new Error('no'));
        }
        return null;
      });
    });
  },

  showNewFeatures: (html) => {
    Swal.fire({
      icon: 'success',
      html,
      width: 700,
      confirmButtonText: i18next.t('OK'),
      allowOutsideClick: outsideClickDisable,
      // cancelButtonText: i18next.t("Cancel")
    });
  },

  multiOptimizerGuide: (html) => {
    Swal.fire({
      icon: 'info',
      html,
      width: 900,
      confirmButtonText: i18next.t('OK'),
      // allowOutsideClick: outsideClickDisable
      // cancelButtonText: i18next.t("Cancel")
    });
  },

  changeArtifact: () => {
    const name = $('#editArtifact').val();

    let html = ``;

    if (name === 'None') {
      return;
    }

    for (let i = 30; i >= 0; i -= 1) {
      const artifactStats = Artifact.getStats(name, i);
      html += `<option value="${i}" >${i} - (${artifactStats.attack.toFixed(
        1,
      )} ${i18next.t('atk')}, ${artifactStats.health.toFixed(
        1,
      )} ${i18next.t('hp')}, ${artifactStats.defense.toFixed(
        1,
      )} ${i18next.t('def')})</option>`;
    }

    $("select[id='editArtifactLevel']")
      .find('option')
      .remove()
      .end()
      .append(html);
  },

  changeSkillOptionsDialog: async (heroId) => {
    const getAllHeroesResponse = await Api.getAllHeroes();
    const { heroes } = getAllHeroesResponse;

    const hero = heroes.find((x) => x.id === heroId);
    if (!hero) {
      return;
    }
    const heroData = HeroData.getHeroExtraInfo(
      hero.name.replace(/\s#\d+$/, ''),
    );

    const result = await Swal.fire({
      title: '',
      width: 600,
      html: `
                    <link href="https://cdn.jsdelivr.net/npm/@sweetalert2/themes@4.0.1/minimal/minimal.min.css" rel="stylesheet">

                    <p style="color: var(--font-color)" data-t>${i18next.t(
                      'Skill options',
                    )}</p>
                    <div class="horizontalSpace"></div>
                    <div class="horizontalSpace"></div>

                    <div class="editGearForm tabsWrapperBody">
                        <div class="tabsWrapper">
                            <div class="tabsButtonWrapper">
                                <button class="tab-button active" style="border-top-left-radius: 10px;" data-id="a">S1</button>
                                <button class="tab-button" data-id="b">S2</button>
                                <button class="tab-button" style="border-top-right-radius: 10px;" data-id="c">S3</button>
                            </div>
                            <div class="tabsContentWrapper">
                                <div class="tabsContent active" id="a">
                                    ${generateSkillOptionsHtml(
                                      'S1',
                                      hero,
                                      heroData,
                                    )}
                                </div>
                                <div class="tabsContent" id="b">
                                    ${generateSkillOptionsHtml(
                                      'S2',
                                      hero,
                                      heroData,
                                    )}
                                </div>
                                <div class="tabsContent" id="c">
                                    ${generateSkillOptionsHtml(
                                      'S3',
                                      hero,
                                      heroData,
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                `,
      didOpen: async () => {
        const tabs = document.querySelector('.tabsWrapper');
        const tabButton = document.querySelectorAll('.tab-button');
        const contents = document.querySelectorAll('.tabsContent');

        tabs.onclick = (e) => {
          const { id } = e.target.dataset;
          if (id) {
            tabButton.forEach((btn) => {
              btn.classList.remove('active');
            });
            e.target.classList.add('active');

            contents.forEach((content) => {
              content.classList.remove('active');
            });
            const element = document.getElementById(id);
            element.classList.add('active');
          }
        };
      },
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: i18next.t('OK'),
      cancelButtonText: i18next.t('Cancel'),
      preConfirm: async () => {
        const skills = ['S1', 'S2', 'S3'];
        const skillOptions = {};

        for (const skill of skills) {
          skillOptions[skill] = {
            skillEffect: document.getElementById(`${skill}SkillEffect`).value,
          };
        }

        return skillOptions;
      },
    });

    return result.value;
  },

  switchBonusTab: (event, tabId) => {
    document
      .querySelectorAll('.bonusStatsTab')
      .forEach((t) => t.classList.remove('active'));
    document.querySelectorAll('.bonusStatsTabPanel').forEach((p) => {
      p.style.display = 'none';
    });
    event.currentTarget.classList.add('active');
    document.getElementById(tabId).style.display = '';
    // Rebuild base stats table from live input values each time tab is shown
    if (tabId === 'baseStatsTab' && Dialog._heroInfoForBaseStats) {
      const g = (id) => document.getElementById(id);
      const liveHero = {
        bonusAtk: g('editHeroBonusAttack')?.value,
        bonusAtkPercent: g('editHeroBonusAttackPercent')?.value,
        bonusDef: g('editHeroBonusDefense')?.value,
        bonusDefPercent: g('editHeroBonusDefensePercent')?.value,
        bonusHp: g('editHeroBonusHealth')?.value,
        bonusHpPercent: g('editHeroBonusHealthPercent')?.value,
        bonusSpeed: g('editHeroBonusSpeed')?.value,
        bonusCr: g('editHeroBonusCritChance')?.value,
        bonusCd: g('editHeroBonusCritDamage')?.value,
        bonusEff: g('editHeroBonusEffectiveness')?.value,
        bonusRes: g('editHeroBonusEffectResistance')?.value,
        aeiAtk: Dialog._heroForBaseStats?.aeiAtk,
        aeiAtkPercent: Dialog._heroForBaseStats?.aeiAtkPercent,
        aeiDef: Dialog._heroForBaseStats?.aeiDef,
        aeiDefPercent: Dialog._heroForBaseStats?.aeiDefPercent,
        aeiHp: Dialog._heroForBaseStats?.aeiHp,
        aeiHpPercent: Dialog._heroForBaseStats?.aeiHpPercent,
        aeiSpeed: Dialog._heroForBaseStats?.aeiSpeed,
        aeiCr: Dialog._heroForBaseStats?.aeiCr,
        aeiCd: Dialog._heroForBaseStats?.aeiCd,
        aeiEff: Dialog._heroForBaseStats?.aeiEff,
        aeiRes: Dialog._heroForBaseStats?.aeiRes,
        artifactName: Dialog._heroForBaseStats?.artifactName,
        artifactLevel: Dialog._heroForBaseStats?.artifactLevel,
        imprintNumber: Dialog._heroForBaseStats?.imprintNumber,
        eeNumber: Dialog._heroForBaseStats?.eeNumber,
      };
      const panel = document.getElementById('baseStatsTab');
      if (panel)
        panel.innerHTML = getBaseStatsHtml(
          liveHero,
          Dialog._heroInfoForBaseStats,
        );
    }
  },

  // Escape externally-sourced strings (RTA/Stove set & skill names) before they go
  // into innerHTML.
  _esc: (s) =>
    String(s == null ? '' : s).replace(
      /[&<>"']/g,
      (c) =>
        ({
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#39;',
        })[c],
    ),

  // ── Build Planner: RTA (epic7rtastats) lookup ───────────────────────────────
  // Fetches the open hero's RTA usage / win / low-pick rate + set-combo builds and
  // renders them into the Build Planner tab.  Per-hero (not bulk) because a hero
  // can run multiple builds — the user applies the combo that matches this entry.
  analyzeRta: async () => {
    const statusEl = document.getElementById('rtaAnalyzeStatus');
    const resultsEl = document.getElementById('rtaResults');
    const hero = Dialog._heroForBaseStats;
    if (!hero || !resultsEl) return;
    if (statusEl)
      statusEl.textContent = i18next.t('Fetching from epic7rtastats…');
    resultsEl.innerHTML = '';
    try {
      const data = await RtaStats.analyzeHero(hero.name);
      Dialog._rtaData = data;
      if (statusEl) statusEl.textContent = '';
      resultsEl.innerHTML = Dialog._renderRtaResults(data);
    } catch (e) {
      Log.error('RTA analyze failed', e);
      if (statusEl) statusEl.textContent = '';
      resultsEl.innerHTML = `<div style="color:#e0726a; padding:6px 0; font-size:12px;">${i18next.t('RTA lookup failed')}: ${e.message}</div>`;
    }
  },

  _renderRtaResults: (data) => {
    const lowPickStr =
      data.lowPick === null
        ? 'unknown'
        : data.lowPick
          ? 'YES — low pick'
          : 'no';
    const head = `<div style="color: var(--font-color); margin-bottom:6px; font-size:13px;">
        <b>${data.heroName}</b> — Pick ${data.pickRate} · Win ${data.winRate} · Low-pick: ${lowPickStr}
      </div>`;
    if (!data.combos || data.combos.length === 0) {
      return `${head}<div style="color: var(--font-color); opacity:0.7; font-size:12px;">No set-combo data returned.</div>`;
    }
    const rows = data.combos
      .map((c, i) => {
        const four = Dialog._esc(c.fourPieceSet);
        const two = c.twoPieceSets ? ` + ${Dialog._esc(c.twoPieceSets)}` : '';
        return `<tr>
            <td style="padding:2px 10px 2px 0;">${four}${two}</td>
            <td style="padding:2px 10px; text-align:right;">${c.usagePct.toFixed(1)}%</td>
            <td style="padding:2px 10px; text-align:right;">${c.setWinRate}</td>
            <td style="padding:2px 0;"><button type="button" style="cursor:pointer; font-size:11px;" onclick="Dialog.applyRtaCombo(${i})">${i18next.t('Apply')}</button></td>
          </tr>`;
      })
      .join('');
    return `${head}<table style="color: var(--font-color); border-collapse:collapse; width:100%; font-size:12px;">
        <thead><tr style="opacity:0.65; text-align:left;">
          <th style="padding:2px 10px 4px 0;">Build (sets)</th>
          <th style="padding:2px 10px; text-align:right;">Usage</th>
          <th style="padding:2px 10px; text-align:right;">Win</th><th></th>
        </tr></thead><tbody>${rows}</tbody></table>`;
  },

  // Apply a chosen RTA set-combo to this hero's Build Planner inputs: check its
  // Target Sets, set Usage % to the combo's usage share, and the Low-pick flag.
  applyRtaCombo: (index) => {
    const data = Dialog._rtaData;
    if (!data || !data.combos || !data.combos[index]) return;
    const combo = data.combos[index];
    const wanted = new Set(combo.setKeys || []);
    // RTA labels incomplete builds "Broken" (e.g. "Destruction + Broken") — mirror
    // that with the Broken box so the plan reflects "4-piece + no second set".
    if (/Broken/i.test(`${combo.fourPieceSet} ${combo.twoPieceSets}`)) {
      wanted.add('Broken');
    }
    document
      .querySelectorAll('#buildPlannerTab .targetSetCheckbox')
      .forEach((cb) => {
        cb.checked = wanted.has(cb.value);
      });
    // Usage % = this combo's SET-LEVEL pick rate (so a niche build reads low even on a
    // popular hero).
    const usageEl = document.getElementById('editHeroUsageRate');
    if (usageEl) usageEl.value = Math.round(combo.usagePct);
    // Low-pick reflects THIS build, not just the hero: flag it if the hero is low-pick
    // overall OR the chosen set combo is niche (set-level usage < 15%).  So a popular
    // hero committed to an off-meta build still gets flagged (and sinks in Auto-rank for
    // leftover gear).  You can always override the checkbox by hand.
    const lowEl = document.getElementById('editHeroLowPickRate');
    if (lowEl) {
      lowEl.checked = data.lowPick === true || (combo.usagePct || 0) < 15;
    }
  },

  // ── Build Planner: community-build speed (Fribbels Hero Library data) ────────
  // For the Target Sets currently checked, fills Target Speed from the MEDIAN speed
  // of community builds running those sets (→ sets the Tier) and reports the combo's
  // community usage %.  Complements the RTA meta numbers with "what people build".
  fillCommunitySpeed: async () => {
    const hero = Dialog._heroForBaseStats;
    const statusEl = document.getElementById('communitySpeedStatus');
    if (!hero) return;
    if (statusEl) statusEl.textContent = i18next.t('Loading community builds…');
    try {
      if (
        !Dialog._communityBuilds ||
        Dialog._communityBuildsHero !== hero.name
      ) {
        Dialog._communityBuilds = await CommunityBuilds.getBuilds(hero.name);
        Dialog._communityBuildsHero = hero.name;
      }
      const selected = Array.from(
        document.querySelectorAll(
          '#buildPlannerTab .targetSetCheckbox:checked',
        ),
      ).map((c) => c.value);
      const r = CommunityBuilds.analyzeForSets(
        Dialog._communityBuilds,
        selected,
      );
      const label =
        selected.filter((s) => s !== 'Broken').join(' + ') || 'all builds';
      if (r.matching > 0 && r.medianSpd > 0) {
        const spdEl = document.getElementById('editHeroTargetSpeed');
        if (spdEl) spdEl.value = r.medianSpd;
        if (statusEl) {
          statusEl.textContent = `${r.matching}/${r.total} builds (${r.usagePct.toFixed(0)}%) run ${label} — median spd ${r.medianSpd} → Target Speed set.`;
        }
      } else if (statusEl) {
        statusEl.textContent = r.multipleFourPiece
          ? 'More than one 4-piece set is checked — a build can only run one. Pick a single 4-piece set.'
          : `No community builds match ${label}.`;
      }
    } catch (e) {
      Log.error('Community speed failed', e);
      if (statusEl)
        statusEl.textContent = `${i18next.t('Community lookup failed')}: ${e.message}`;
    }
  },

  // ── Build Planner: official Stove RTA, split by rank ────────────────────────
  analyzeStove: async () => {
    const hero = Dialog._heroForBaseStats;
    const statusEl = document.getElementById('stoveStatus');
    const resultsEl = document.getElementById('stoveResults');
    if (!hero || !resultsEl) return;
    const from = document.getElementById('stoveGradeFrom')?.value || 'champion';
    const to = document.getElementById('stoveGradeTo')?.value || 'champion';
    if (statusEl) statusEl.textContent = i18next.t('Fetching from Stove…');
    resultsEl.innerHTML = '';
    try {
      const data = await StoveRta.analyzeHeroStoveRange(hero.name, from, to);
      Dialog._stoveData = data;
      if (statusEl) statusEl.textContent = '';
      resultsEl.innerHTML = Dialog._renderStoveResults(data);
    } catch (e) {
      Log.error('Stove analyze failed', e);
      if (statusEl) statusEl.textContent = '';
      resultsEl.innerHTML = `<div style="color:#e0726a; padding:6px 0; font-size:12px;">${i18next.t('Stove lookup failed')}: ${e.message}</div>`;
    }
  },

  _renderStoveResults: (data) => {
    const LABEL = {
      atk: 'ATK',
      def: 'DEF',
      hp: 'HP',
      spd: 'SPD',
      chc: 'CC',
      chd: 'CD',
      eff: 'EFF',
      res: 'RES',
    };
    const order = ['spd', 'chc', 'chd', 'atk', 'def', 'hp', 'eff', 'res'];
    const statRows = order
      .map((k) => {
        const s = data.stats[k];
        if (!s) {
          return `<tr><td style="padding:1px 8px 1px 0;">${LABEL[k]}</td><td colspan="3" style="opacity:0.4;">—</td></tr>`;
        }
        return `<tr>
            <td style="padding:1px 8px 1px 0;">${LABEL[k]}</td>
            <td style="padding:1px 8px; text-align:center;">T${s.tier}</td>
            <td style="padding:1px 8px;">${s.range}</td>
            <td style="padding:1px 8px; text-align:right; opacity:0.75;">${s.pct}</td>
          </tr>`;
      })
      .join('');
    const equipRows = (data.equip || [])
      .map(
        (e) => `<tr>
            <td style="padding:1px 8px 1px 0;">${Dialog._esc(e.label || '—')}</td>
            <td style="padding:1px 8px; text-align:right;">${e.usePct}</td>
            <td style="padding:1px 8px; text-align:right; opacity:0.75;">${e.winPct}</td>
          </tr>`,
      )
      .join('');
    const skillStr = (data.skills || [])
      .filter((s) => s.name)
      .map(
        (s) =>
          `${Dialog._esc(s.name)}${s.top ? ` ${s.top.level} (${s.top.pct})` : ''}`,
      )
      .join(' · ');

    return `<div style="color: var(--font-color); font-size:12px;">
        <div style="margin-bottom:4px;"><b>${data.grade}</b> — Win ${data.winRate || '—'} · Rank ${data.rank || '—'} · ${data.totalGames || 0} games${
          data.droppedGrades && data.droppedGrades.length
            ? ` · <span style="opacity:0.7;">${data.droppedGrades.length} grade(s) unavailable: ${Dialog._esc(data.droppedGrades.join(', '))}</span>`
            : ''
        }</div>
        <div style="display:flex; gap:24px; flex-wrap:wrap;">
          <table style="border-collapse:collapse;"><thead><tr style="opacity:0.6; text-align:left;"><th style="padding:1px 8px 2px 0;">Stat</th><th style="padding:1px 8px;">Tier</th><th style="padding:1px 8px;">Peak</th><th style="padding:1px 8px;">%</th></tr></thead><tbody>${statRows}</tbody></table>
          <table style="border-collapse:collapse;"><thead><tr style="opacity:0.6; text-align:left;"><th style="padding:1px 8px 2px 0;">Top sets</th><th style="padding:1px 8px;">Use</th><th style="padding:1px 8px;">Win</th></tr></thead><tbody>${equipRows}</tbody></table>
        </div>
        ${skillStr ? `<div style="margin-top:4px; opacity:0.85;">Skills: ${skillStr}</div>` : ''}
        <div style="margin-top:6px;">
          <button type="button" style="cursor:pointer; font-size:11px;" onclick="Dialog.applyStoveToPlan()">${i18next.t('Apply to plan')}</button>
          <button type="button" style="cursor:pointer; font-size:11px; margin-left:6px;" onclick="Dialog.applyStoveToOptimizer()">${i18next.t('Apply to optimizer')}</button>
          <span id="stoveApplyStatus" style="margin-left:10px; opacity:0.85;"></span>
        </div>
      </div>`;
  },

  // Apply the Stove peaks to the plan: SPD peak → Target Speed, top equip → Target Sets.
  applyStoveToPlan: () => {
    const data = Dialog._stoveData;
    if (!data || !data.stats) return;
    const spd = data.stats.spd;
    if (spd) {
      const spdEl = document.getElementById('editHeroTargetSpeed');
      if (spdEl) spdEl.value = Math.round((spd.peakLow + spd.peakHigh) / 2);
    }
    const top = data.equip && data.equip[0];
    if (top && top.setKeys) {
      const wanted = new Set(top.setKeys);
      document
        .querySelectorAll('#buildPlannerTab .targetSetCheckbox')
        .forEach((cb) => {
          cb.checked = wanted.has(cb.value);
        });
    }
    const statusEl = document.getElementById('stoveApplyStatus');
    if (statusEl)
      statusEl.textContent = 'Applied speed + top sets to the plan.';
  },

  // Push the meta build into the optimizer: each stat's tier (1–6) → priority slider,
  // and the mid-high+ stats' peak ranges → stat targets.  Loads this hero into the
  // optimizer and applies after the load settles (it's revealed when this dialog closes).
  applyStoveToOptimizer: () => {
    const hero = Dialog._heroForBaseStats;
    const data = Dialog._stoveData;
    const statusEl = document.getElementById('stoveApplyStatus');
    if (!hero || !hero.id || !data || !data.stats) return;
    const O = globalThis.OptimizerTab;
    if (!O || !O._applyStatPrioritySliders) {
      if (statusEl) statusEl.textContent = 'Optimizer not available.';
      return;
    }
    const P = {
      atk: 'inputAtkPriority',
      def: 'inputDefPriority',
      hp: 'inputHpPriority',
      spd: 'inputSpdPriority',
      chc: 'inputCrPriority',
      chd: 'inputCdPriority',
      eff: 'inputEffPriority',
      res: 'inputResPriority',
    };
    // The Stove peak bucket is a RANGE [peakLow, peakHigh] with the midpoint as the
    // ideal — map it onto the optimizer's min / sweet-spot / max target trio so the
    // build aims for the middle of the meta range, not just its ceiling.
    const TMAX = {
      atk: 'inputAtkTarget',
      def: 'inputDefTarget',
      hp: 'inputHpTarget',
      spd: 'inputSpdTarget',
      chc: 'inputCrTarget',
      chd: 'inputCdTarget',
      eff: 'inputEffTarget',
      res: 'inputResTarget',
    };
    const TMIN = {
      atk: 'inputAtkMinTarget',
      def: 'inputDefMinTarget',
      hp: 'inputHpMinTarget',
      spd: 'inputSpdMinTarget',
      chc: 'inputCrMinTarget',
      chd: 'inputCdMinTarget',
      eff: 'inputEffMinTarget',
      res: 'inputResMinTarget',
    };
    const TSWEET = {
      atk: 'inputAtkSweetTarget',
      def: 'inputDefSweetTarget',
      hp: 'inputHpSweetTarget',
      spd: 'inputSpdSweetTarget',
      chc: 'inputCrSweetTarget',
      chd: 'inputCdSweetTarget',
      eff: 'inputEffSweetTarget',
      res: 'inputResSweetTarget',
    };
    const pri = {};
    const tgt = {};
    Object.keys(P).forEach((k) => {
      const s = data.stats[k];
      if (!s) {
        pri[P[k]] = 0;
        return;
      }
      pri[P[k]] = Math.max(0, s.tier - 1); // tier 1→0 (ignore) … 6→5
      if (s.tier >= 4) {
        const lo = Math.round(s.peakLow);
        const hi = Math.round(s.peakHigh);
        const mid = Math.round((s.peakLow + s.peakHigh) / 2);
        tgt[TMIN[k]] = lo;
        tgt[TSWEET[k]] = mid;
        // Open top bucket ("270+") has peakHigh === peakLow → band collapses to the
        // floor (no upper bound); otherwise use the real ceiling.
        tgt[TMAX[k]] = hi > lo ? hi : mid;
      }
    });
    try {
      $('#inputHeroAdd').val(hero.id).change(); // load this hero into the optimizer
      $('#tab1').trigger('click'); // switch the underlying tab to the optimizer
    } catch {
      /* ignore */
    }
    // Apply after the hero-load restores/clears the sliders (it's async).
    setTimeout(() => {
      try {
        O._applyStatPrioritySliders(pri, '');
        Object.entries(tgt).forEach(([id, val]) => {
          const el = document.getElementById(id);
          if (el) {
            el.value = val;
            el.dispatchEvent(new Event('change', { bubbles: true }));
          }
        });
        if (O.recalculateFilters) O.recalculateFilters();
      } catch (e) {
        Log.error('Stove → optimizer apply failed', e);
      }
    }, 1000);
    if (statusEl) {
      statusEl.textContent =
        'Sent priorities + targets to the optimizer — close this dialog to view.';
    }
  },

  // Load this hero into the optimizer and apply the plan's Target Speed as the SPD
  // min target ("at least this speed").  Set filters stay user-controlled: the planner's
  // 4pc/2pc/Broken model doesn't map cleanly onto the optimizer's three set slots, and
  // force-requiring the wrong set would zero out results.  (Shares the hero-load settle
  // delay with applyStoveToOptimizer — a known brittleness pending a load-complete event.)
  sendPlanToOptimizer: () => {
    const hero = Dialog._heroForBaseStats;
    const statusEl = document.getElementById('sendPlanStatus');
    if (!hero || !hero.id) return;
    const spd = Math.round(
      Number.parseFloat(
        document.getElementById('editHeroTargetSpeed')?.value,
      ) || 0,
    );
    try {
      $('#inputHeroAdd').val(hero.id).change(); // load this hero into the optimizer
      $('#tab1').trigger('click'); // reveal the optimizer tab
    } catch {
      /* ignore */
    }
    setTimeout(() => {
      try {
        if (spd > 0) {
          const el = document.getElementById('inputSpdMinTarget');
          if (el) {
            el.value = spd;
            el.dispatchEvent(new Event('change', { bubbles: true }));
          }
        }
        const O = globalThis.OptimizerTab;
        if (O && O.recalculateFilters) O.recalculateFilters();
      } catch (e) {
        Log.error('Send plan → optimizer failed', e);
      }
    }, 1000);
    if (statusEl) {
      statusEl.textContent =
        spd > 0
          ? `Loaded into the optimizer with SPD min target ${spd} — close to view.`
          : 'Loaded into the optimizer — close to view.';
    }
  },

  // Synthesize whatever of the three sources has been analyzed (RTA / Stove / community)
  // into one compact card with a confidence signal (how many sources agree).  Read-only;
  // each source is pulled from its stored analysis (community is recomputed from the
  // cached builds + the currently-checked Target Sets).
  showRecommendation: () => {
    const el = document.getElementById('recommendationResults');
    if (!el) return;
    const rta = Dialog._rtaData;
    const stove = Dialog._stoveData;
    const builds = Dialog._communityBuilds;
    const parts = [];
    let sources = 0;

    if (rta && rta.combos && rta.combos.length) {
      const c = rta.combos[0];
      const combo = `${Dialog._esc(c.fourPieceSet)}${c.twoPieceSets ? ' + ' + Dialog._esc(c.twoPieceSets) : ''}`;
      parts.push(
        `<div><b>RTA meta:</b> ${combo} — ${(c.usagePct || 0).toFixed(0)}% usage, win ${c.setWinRate || rta.winRate || '—'}${
          rta.lowPick ? ' <span style="opacity:.7">(low-pick hero)</span>' : ''
        }</div>`,
      );
      sources += 1;
    }
    if (stove && stove.stats && stove.stats.spd) {
      const s = stove.stats.spd;
      const range = s.range || `${s.peakLow}–${s.peakHigh}`;
      parts.push(
        `<div><b>Stove (${Dialog._esc(stove.grade || '')}):</b> SPD tier ${s.tier} (peak ${Dialog._esc(String(range))}) · win ${stove.winRate || '—'}</div>`,
      );
      sources += 1;
    }
    if (builds && builds.length) {
      const selected = Array.from(
        document.querySelectorAll(
          '#buildPlannerTab .targetSetCheckbox:checked',
        ),
      ).map((c) => c.value);
      const r = CommunityBuilds.analyzeForSets(builds, selected);
      const label =
        selected.filter((x) => x !== 'Broken').join(' + ') || 'all builds';
      if (r.matching > 0) {
        parts.push(
          `<div><b>Community:</b> ${r.matching}/${r.total} (${r.usagePct.toFixed(0)}%) run ${Dialog._esc(label)} — median spd <b>${r.medianSpd}</b></div>`,
        );
        sources += 1;
      }
    }

    if (sources === 0) {
      el.innerHTML =
        '<div style="opacity:0.8; font-size:12px; color:var(--font-color);">Run Analyze (RTA), Analyze (Stove), and/or Fill Speed first — then this combines them.</div>';
      return;
    }
    const conf = sources >= 3 ? 'high' : sources === 2 ? 'medium' : 'low';
    el.innerHTML = `
      <div style="border:1px solid var(--border-color,#555); border-radius:4px; padding:8px; font-size:12px; color:var(--font-color); line-height:1.5;">
        <div style="font-weight:bold; margin-bottom:4px;">Recommendation <span style="opacity:0.7; font-weight:normal;">· confidence: ${conf} (${sources}/3 sources)</span></div>
        ${parts.join('')}
      </div>`;
  },

  editHeroDialog: async (hero) => {
    const heroData = HeroData.getAllHeroData();

    const heroInfo = heroData[hero.name.replace(/\s#\d+$/, '')];
    if (!heroInfo) return null;
    const ee = heroInfo.ex_equip[0];

    // Store for live base-stats refresh when user switches to that tab
    Dialog._heroInfoForBaseStats = heroInfo;
    Dialog._heroForBaseStats = hero;

    const result = await Swal.fire({
      title: '',
      width: 900,
      html: `
                    <div class="editGearForm">
                        <link href="https://cdn.jsdelivr.net/npm/@sweetalert2/themes@4.0.1/minimal/minimal.min.css" rel="stylesheet">

                        <div class="bonusStatsTabs">
                            <button class="bonusStatsTab active" onclick="Dialog.switchBonusTab(event,'bonusTab')">Bonus Stats</button>
                            <button class="bonusStatsTab" onclick="Dialog.switchBonusTab(event,'baseStatsTab')">Base Stats</button>
                            <button class="bonusStatsTab" onclick="Dialog.switchBonusTab(event,'buildPlannerTab')">Build Planner</button>
                        </div>

                        <div id="bonusTab" class="bonusStatsTabPanel">
                        <div class="editGearFormRow">
                            <div class="editGearFormHalf">

                                <p style="color: var(--font-color)" data-t>${i18next.t(
                                  'Add Artifact/EE/Imprint bonus stats',
                                )}</p>

                                <div class="editGearFormRow">
                                    <div class="editGearStatLabel" data-t>${i18next.t(
                                      'Artifact',
                                    )}</div>
                                    <select id="editArtifact" class="editGearStatSelect" onchange="Dialog.changeArtifact()">
                                        ${getArtifactHtml(hero, heroInfo)}
                                    </select>
                                </div>

                                <div class="editGearFormRow">
                                    <div class="editGearStatLabel" data-t>${i18next.t(
                                      'Level',
                                    )}</div>
                                    <select id="editArtifactLevel" class="editGearStatSelect">
                                        ${getArtifactEnhanceHtml(hero)}
                                    </select>
                                </div>

                                <div class="horizontalLineWithMoreSpace"></div>

                                <div class="editGearFormRow">
                                    <div class="editGearStatLabel" data-t>${i18next.t(
                                      'Imprint',
                                    )}</div>
                                    ${getImprintHtml(hero, heroInfo)}
                                </div>

                                <div class="horizontalLineWithMoreSpace"></div>

                                <div class="editGearFormRow">
                                    <div class="editGearStatLabel" data-t>${i18next.t(
                                      'EE',
                                    )}</div>

                                    <select id="editEe" class="editGearStatSelect">
                                        ${getEeEnhanceHtml(hero, ee)}
                                    </select>
                                </div>

                                <div class="horizontalLineWithMoreSpace"></div>

                                <div class="editGearFormRow">
                                    <div class="editGearStatLabel" data-t>${i18next.t(
                                      'Stars',
                                    )}</div>

                                    <select id="editStars" class="editGearStatSelect">
                                        ${getStarsHtml(hero, heroInfo)}
                                    </select>
                                </div>
                            </div>

                            <div class="editGearFormVertical"></div>

                            <div class="editGearFormHalf">
                                <p style="color: var(--font-color)" data-t>${i18next.t(
                                  'Add any other non item bonus stats',
                                )}</p>

                                <div class="editGearFormRow">
                                    <div class="editGearStatLabel" data-t>${i18next.t(
                                      'Attack',
                                    )}</div>
                                    <div class="valuePadding input-holder">
                                        <input type="number" class="bonusStatInput" max="100" accuracy="1" min="0" id="editHeroBonusAttack" value="${
                                          hero.bonusAtk || ''
                                        }">
                                    </div>
                                    <span class="valuePadding input-holder-percent">
                                        <input type="number" class="bonusStatInputPercent" max="100" accuracy="1" min="0" id="editHeroBonusAttackPercent" value="${
                                          hero.bonusAtkPercent || ''
                                        }">
                                    </span>
                                </div>

                                <div class="editGearFormRow">
                                    <div class="editGearStatLabel" data-t>${i18next.t(
                                      'Defense',
                                    )}</div>
                                    <span class="valuePadding input-holder">
                                        <input type="number" class="bonusStatInput" max="100" accuracy="1" min="0" id="editHeroBonusDefense" value="${
                                          hero.bonusDef || ''
                                        }">
                                    </span>
                                    <span class="valuePadding input-holder-percent">
                                        <input type="number" class="bonusStatInputPercent" max="100" accuracy="1" min="0" id="editHeroBonusDefensePercent" value="${
                                          hero.bonusDefPercent || ''
                                        }">
                                    </span>
                                </div>

                                <div class="editGearFormRow">
                                    <div class="editGearStatLabel" data-t>${i18next.t(
                                      'Health',
                                    )}</div>
                                    <span class="valuePadding input-holder">
                                        <input type="number" class="bonusStatInput" max="100" accuracy="1" min="0" id="editHeroBonusHealth" value="${
                                          hero.bonusHp || ''
                                        }">
                                    </span>
                                    <span class="valuePadding input-holder-percent">
                                        <input type="number" class="bonusStatInputPercent" max="100" accuracy="1" min="0" id="editHeroBonusHealthPercent" value="${
                                          hero.bonusHpPercent || ''
                                        }">
                                    </span>
                                </div>

                                <div class="editGearFormRow">
                                    <div class="editGearStatLabel" data-t>${i18next.t(
                                      'Speed',
                                    )}</div>
                                    <span class="valuePadding input-holder">
                                        <input type="number" class="bonusStatInput" max="100" accuracy="1" min="0" id="editHeroBonusSpeed" value="${
                                          hero.bonusSpeed || ''
                                        }">
                                    </span>
                                </div>

                                <div class="editGearFormRow">
                                    <div class="editGearStatLabel" data-t>${i18next.t(
                                      'Crit Rate',
                                    )}</div>
                                    <span class="valuePadding input-holder">
                                        <input type="number" class="bonusStatInput" max="100" accuracy="1" min="0" id="editHeroBonusCritChance" value="${
                                          hero.bonusCr || ''
                                        }">
                                    </span>
                                </div>

                                <div class="editGearFormRow">
                                    <div class="editGearStatLabel" data-t>${i18next.t(
                                      'Crit Dmg',
                                    )}</div>
                                    <span class="valuePadding input-holder">
                                        <input type="number" class="bonusStatInput" max="100" accuracy="1" min="0" id="editHeroBonusCritDamage" value="${
                                          hero.bonusCd || ''
                                        }">
                                    </span>
                                </div>

                                <div class="editGearFormRow">
                                    <div class="editGearStatLabel" title="Artifact bonus to CD cap (e.g. enter 30 for +30% cap)" data-t>${i18next.t(
                                      'CD Cap Bonus',
                                    )}</div>
                                    <span class="valuePadding input-holder">
                                        <input type="number" class="bonusStatInput" max="200" accuracy="1" min="0" id="editHeroCdCapBonus" value="${
                                          hero.cdCapBonus || ''
                                        }" placeholder="0">
                                    </span>
                                </div>

                                <div class="editGearFormRow">
                                    <div class="editGearStatLabel" data-t>${i18next.t(
                                      'Eff',
                                    )}</div>
                                    <span class="valuePadding input-holder">
                                        <input type="number" class="bonusStatInput" max="100" accuracy="1" min="0" id="editHeroBonusEffectiveness" value="${
                                          hero.bonusEff || ''
                                        }">
                                    </span>
                                </div>

                                <div class="editGearFormRow">
                                    <div class="editGearStatLabel" data-t>${i18next.t(
                                      'Res',
                                    )}</div>
                                    <span class="valuePadding input-holder">
                                        <input type="number" class="bonusStatInput" max="100" accuracy="1" min="0" id="editHeroBonusEffectResistance" value="${
                                          hero.bonusRes || ''
                                        }">
                                    </span>
                                </div>

                                <p style="color: var(--font-color)" data-t>${i18next.t(
                                  'Final stat multipliers (e.g. Lethe artifact)',
                                )}</p>

                                <div class="editGearFormRow">
                                    <div class="editGearStatLabel" data-t>${i18next.t(
                                      'Final Attack',
                                    )}</div>
                                    <div class="blankFormSpace"></div>
                                    <span class="valuePadding input-holder-percent">
                                        <input type="number" class="bonusStatInputPercent" max="100" accuracy="1" min="0" id="editHeroFinalAtkMultiplier" value="${
                                          hero.finalAtkMultiplier || ''
                                        }">
                                    </span>
                                </div>

                                <div class="editGearFormRow">
                                    <div class="editGearStatLabel" data-t>${i18next.t(
                                      'Final Defense',
                                    )}</div>
                                    <div class="blankFormSpace"></div>
                                    <span class="valuePadding input-holder-percent">
                                        <input type="number" class="bonusStatInputPercent" max="100" accuracy="1" min="0" id="editHeroFinalDefMultiplier" value="${
                                          hero.finalDefMultiplier || ''
                                        }">
                                    </span>
                                </div>

                                <div class="editGearFormRow">
                                    <div class="editGearStatLabel" data-t>${i18next.t(
                                      'Final Health',
                                    )}</div>
                                    <div class="blankFormSpace"></div>
                                    <span class="valuePadding input-holder-percent">
                                        <input type="number" class="bonusStatInputPercent" max="100" accuracy="1" min="0" id="editHeroFinalHpMultiplier" value="${
                                          hero.finalHpMultiplier || ''
                                        }">
                                    </span>
                                </div>
                            </div>
                        </div>
                        </div><!-- end bonusTab -->

                        <div id="baseStatsTab" class="bonusStatsTabPanel" style="display:none">
                            ${getBaseStatsHtml(hero, heroInfo)}
                        </div>

                        <div id="buildPlannerTab" class="bonusStatsTabPanel" style="display:none">
                            <p style="color: var(--font-color)" data-t>${i18next.t(
                              'Roster planning — manual values for the Hero grid only. Never affects stats or optimization.',
                            )}</p>

                            <div class="editGearFormRow" style="align-items:center; margin: 4px 0 8px;">
                                <button type="button" style="padding:4px 12px; font-size:13px; cursor:pointer;" onclick="Dialog.analyzeRta()" title="Pull this hero's RTA usage / win / low-pick rate and set-combo builds from epic7rtastats.com.">${i18next.t('Analyze (RTA)')}</button>
                                <span id="rtaAnalyzeStatus" style="margin-left:12px; color: var(--font-color); opacity:0.85; font-size:12px;"></span>
                            </div>
                            <div id="rtaResults" style="margin: 0 0 12px;"></div>

                            <div class="editGearFormRow" style="align-items:center; margin: 4px 0 8px;">
                                <button type="button" style="padding:4px 12px; font-size:13px; cursor:pointer;" onclick="Dialog.fillCommunitySpeed()" title="From the Fribbels community builds, take the median speed of builds running the Target Sets you've checked, and fill Target Speed (sets the Tier). Also shows what % of builds run that combo.">${i18next.t('Fill Speed (community)')}</button>
                                <span id="communitySpeedStatus" style="margin-left:12px; color: var(--font-color); opacity:0.85; font-size:12px;"></span>
                            </div>

                            <div class="editGearFormRow" style="align-items:center; margin: 8px 0 4px; gap:6px;">
                                <select id="stoveGradeFrom" style="font-size:12px; padding:3px;">
                                    ${StoveRta.GRADE_CODES.map(
                                      (g) =>
                                        `<option value="${g}" ${g === 'champion' ? 'selected' : ''}>${g.charAt(0).toUpperCase() + g.slice(1)}</option>`,
                                    ).join('')}
                                </select>
                                <span style="color: var(--font-color); opacity:0.7; font-size:12px;">${i18next.t('to')}</span>
                                <select id="stoveGradeTo" style="font-size:12px; padding:3px;">
                                    ${StoveRta.GRADE_CODES.map(
                                      (g) =>
                                        `<option value="${g}" ${g === 'champion' ? 'selected' : ''}>${g.charAt(0).toUpperCase() + g.slice(1)}</option>`,
                                    ).join('')}
                                </select>
                                <button type="button" style="padding:4px 12px; font-size:13px; cursor:pointer;" onclick="Dialog.analyzeStove()" title="Official Stove RTA stats for this hero, aggregated across the selected rank range (e.g. Champion → Legend): per-stat tier (1–6) + peak ranges, top equip combos with win rate, and recommended skills.">${i18next.t('Analyze (Stove by rank)')}</button>
                                <span id="stoveStatus" style="color: var(--font-color); opacity:0.85; font-size:12px;"></span>
                            </div>
                            <div id="stoveResults" style="margin: 0 0 12px;"></div>

                            <div class="editGearFormRow" style="align-items:center; margin: 4px 0 4px;">
                                <button type="button" style="padding:4px 12px; font-size:13px; cursor:pointer;" onclick="Dialog.showRecommendation()" title="Combine the RTA, Stove, and community results above into one recommendation with a confidence signal.">${i18next.t('Recommend')}</button>
                            </div>
                            <div id="recommendationResults" style="margin: 0 0 12px;"></div>

                            <div class="editGearFormRow" style="align-items:center; margin: 4px 0 8px;">
                                <button type="button" style="padding:4px 12px; font-size:13px; cursor:pointer;" onclick="Dialog.sendPlanToOptimizer()" title="Load this hero into the optimizer and set its SPD min target from the plan's Target Speed below.">${i18next.t('Send plan to optimizer')}</button>
                                <span id="sendPlanStatus" style="margin-left:12px; color: var(--font-color); opacity:0.85; font-size:12px;"></span>
                            </div>

                            <div class="editGearFormRow">
                                <div class="editGearStatLabel" title="Manual target speed for ranking your roster fastest-first in the Hero grid (also editable inline in the Tgt Spd column)." data-t>${i18next.t(
                                  'Target Speed',
                                )}</div>
                                <span class="valuePadding input-holder">
                                    <input type="number" class="bonusStatInput" accuracy="1" min="0" id="editHeroTargetSpeed" value="${
                                      hero.targetSpeed || ''
                                    }" placeholder="0">
                                </span>
                            </div>

                            <div class="editGearFormRow">
                                <div class="editGearStatLabel" title="Combat-readiness push % this unit gets. Drives the Final Speed (FSpd) / pSpd columns: effective speed = Speed / (1 - CR Push%). e.g. 300 speed at 40% = 500." data-t>${i18next.t(
                                  'CR Push %',
                                )}</div>
                                <span class="valuePadding input-holder">
                                    <input type="number" class="bonusStatInput" max="95" accuracy="1" min="0" id="editHeroCrPush" value="${
                                      hero.crPush
                                        ? Math.round(hero.crPush * 100)
                                        : ''
                                    }" placeholder="0">
                                </span>
                            </div>

                            <div class="editGearFormRow">
                                <div class="editGearStatLabel" title="Manual usage % (0–100) for reference (also editable inline in the Usage column)." data-t>${i18next.t(
                                  'Usage %',
                                )}</div>
                                <span class="valuePadding input-holder">
                                    <input type="number" class="bonusStatInput" max="100" accuracy="1" min="0" id="editHeroUsageRate" value="${
                                      hero.usageRate || ''
                                    }" placeholder="0">
                                </span>
                            </div>

                            <div class="editGearFormRow">
                                <div class="editGearStatLabel" title="Flag power-crept / low-usage units. Turn on the 'Separate low pick-rate' toggle in the Hero tab to sink flagged heroes to the bottom." data-t>${i18next.t(
                                  'Low pick-rate',
                                )}</div>
                                <span class="valuePadding input-holder">
                                    <input type="checkbox" id="editHeroLowPickRate" ${
                                      hero.lowPickRate ? 'checked' : ''
                                    }>
                                </span>
                            </div>

                            <style>
                              #buildPlannerTab .targetSetsLabel { color: var(--font-color); margin: 12px 0 6px; font-weight: bold; }
                              #buildPlannerTab .targetSetsPicker { display: flex; gap: 28px; flex-wrap: wrap; }
                              #buildPlannerTab .targetSetsGroupLabel { color: var(--font-color); opacity: 0.7; font-size: 12px; margin-bottom: 6px; }
                              #buildPlannerTab .targetSetsIcons { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px 12px; }
                              #buildPlannerTab .targetSetOption { display: flex; align-items: center; gap: 4px; cursor: pointer; }
                              #buildPlannerTab .targetSetOption img { width: 22px; height: 22px; }
                              #buildPlannerTab .targetSetOption input { cursor: pointer; margin: 0; }
                            </style>
                            <div class="targetSetsLabel" title="Sets you plan to build this hero in (reference only)." data-t>${i18next.t(
                              'Target Sets',
                            )}</div>
                            <div class="targetSetsPicker">
                              ${[
                                {
                                  label: i18next.t('4-Piece'),
                                  sets: [
                                    'Attack',
                                    'Speed',
                                    'Destruction',
                                    'Lifesteal',
                                    'Protection',
                                    'Counter',
                                    'Rage',
                                    'Revenge',
                                    'Injury',
                                    'Reversal',
                                    'Riposte',
                                    'Warfare',
                                    'Weakening',
                                  ],
                                },
                                {
                                  label: i18next.t('2-Piece'),
                                  sets: [
                                    'Health',
                                    'Defense',
                                    'Critical',
                                    'Hit',
                                    'Resist',
                                    'Unity',
                                    'Immunity',
                                    'Penetration',
                                    'Torrent',
                                    'Pursuit',
                                    'Fervor',
                                  ],
                                },
                              ]
                                .map(
                                  (group) => `
                                <div class="targetSetsGroup">
                                  <div class="targetSetsGroupLabel">${group.label}</div>
                                  <div class="targetSetsIcons">
                                    ${group.sets
                                      .map((s) => {
                                        const k = `${s}Set`;
                                        const checked = (
                                          hero.targetSets || []
                                        ).includes(k)
                                          ? 'checked'
                                          : '';
                                        const icon =
                                          Assets.getSetAsset(k) || '';
                                        return `<label class="targetSetOption" title="${s}">
                                        <input type="checkbox" class="targetSetCheckbox" value="${k}" ${checked}>
                                        <img class="targetSetIcon" src="${icon}" alt="${s}">
                                      </label>`;
                                      })
                                      .join('')}
                                  </div>
                                </div>
                              `,
                                )
                                .join('')}
                            </div>
                            <label class="targetSetOption" style="margin-top:10px;" title="Incomplete / 'broken' set — e.g. very fast units running a Speed 4-piece plus pieces that don't complete a 2-piece bonus. epic7rtastats labels these builds 'Broken'.">
                                <input type="checkbox" class="targetSetCheckbox" value="Broken" ${
                                  (hero.targetSets || []).includes('Broken')
                                    ? 'checked'
                                    : ''
                                }>
                                <span style="color: var(--font-color); font-size:12px;">${i18next.t('Broken (incomplete set)')}</span>
                            </label>
                        </div>
                    </div>
                `,
      didOpen: async () => {
        const options = {
          filter: true,
          maxHeight: 400,
          filterAcceptOnEnter: true,
        };
        $('#editArtifact').multipleSelect(options);
        $('#editArtifact').change(Dialog.changeArtifact);
      },
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: i18next.t('OK'),
      cancelButtonText: i18next.t('Cancel'),
      preConfirm: async () => {
        const artifactName = $('#editArtifact').val();
        const artifactLevel = $('#editArtifactLevel').val();
        const imprintNumber = $('#editImprint').val();
        const eeNumber = $('#editEe').val();
        const stars = $('#editStars').val();

        const editedHero = {
          attack: Number.parseInt(
            document.getElementById('editHeroBonusAttack').value,
            10,
          ),
          defense: Number.parseInt(
            document.getElementById('editHeroBonusDefense').value,
            10,
          ),
          health: Number.parseInt(
            document.getElementById('editHeroBonusHealth').value,
            10,
          ),
          attackPercent: Number.parseFloat(
            document.getElementById('editHeroBonusAttackPercent').value,
          ),
          defensePercent: Number.parseFloat(
            document.getElementById('editHeroBonusDefensePercent').value,
          ),
          healthPercent: Number.parseFloat(
            document.getElementById('editHeroBonusHealthPercent').value,
          ),
          speed: Number.parseInt(
            document.getElementById('editHeroBonusSpeed').value,
            10,
          ),
          critChance: Number.parseFloat(
            document.getElementById('editHeroBonusCritChance').value,
          ),
          critDamage: Number.parseFloat(
            document.getElementById('editHeroBonusCritDamage').value,
          ),
          effectiveness: Number.parseFloat(
            document.getElementById('editHeroBonusEffectiveness').value,
          ),
          effectResistance: Number.parseFloat(
            document.getElementById('editHeroBonusEffectResistance').value,
          ),
          // Stored as a fraction (input is a percentage); clamped to [0, 0.95].
          crPush: Math.min(
            0.95,
            Math.max(
              0,
              (Number.parseFloat(
                document.getElementById('editHeroCrPush').value,
              ) || 0) / 100,
            ),
          ),
          // Build Planner fields (manual; Hero-grid display/sort only).
          targetSpeed:
            Number.parseInt(
              document.getElementById('editHeroTargetSpeed').value,
              10,
            ) || 0,
          usageRate:
            Number.parseInt(
              document.getElementById('editHeroUsageRate').value,
              10,
            ) || 0,
          lowPickRate: !!document.getElementById('editHeroLowPickRate')
            ?.checked,
          targetSets: Array.from(
            document.querySelectorAll(
              '#buildPlannerTab .targetSetCheckbox:checked',
            ),
          ).map((c) => c.value),

          finalAtkMultiplier: Number.parseFloat(
            document.getElementById('editHeroFinalAtkMultiplier').value,
          ),
          finalDefMultiplier: Number.parseFloat(
            document.getElementById('editHeroFinalDefMultiplier').value,
          ),
          finalHpMultiplier: Number.parseFloat(
            document.getElementById('editHeroFinalHpMultiplier').value,
          ),

          cdCapBonus:
            Number.parseInt(
              document.getElementById('editHeroCdCapBonus').value,
              10,
            ) || 0,

          aeiAttack: 0,
          aeiDefense: 0,
          aeiHealth: 0,
          aeiAttackPercent: 0,
          aeiDefensePercent: 0,
          aeiHealthPercent: 0,
          aeiSpeed: 0,
          aeiCritChance: 0,
          aeiCritDamage: 0,
          aeiEffectiveness: 0,
          aeiEffectResistance: 0,

          artifactName,
          artifactLevel,
          imprintNumber,
          eeNumber,
          stars,
          ee,
          heroInfo,
        };

        return editedHero;
      },
    });

    return result.value;
  },

  editFiltersDialog: async (hero, index) => {
    const result = await Swal.fire({
      title: '',
      width: 1100,
      html: `
                    <div class="editGearForm">
                        <link href="https://cdn.jsdelivr.net/npm/@sweetalert2/themes@4.0.1/minimal/minimal.min.css" rel="stylesheet">

                        <div class="editFiltersDialog">
                            <div id="options-panel" class="constraints-panel-col-small">
                              <div class="panelLabel">
                                <div class="panelLabelText" id="optionsLabel" data-t>${i18next.t(
                                  'Options',
                                )}</div>
                              </div>
                              <div>
                                <input type="checkbox" id="inputPredictReforges${index}" class="optimizer-checkbox" checked>
                                <label for="inputPredictReforges${index}" data-t>${i18next.t(
                                  'Use reforged stats',
                                )}</label>
                              </div>

                              <div>
                                <input type="checkbox" id="inputOrderedHeroPriority${index}" class="optimizer-checkbox">
                                <label for="inputOrderedHeroPriority${index}" data-t>${i18next.t(
                                  'Use hero priority',
                                )}</label>
                              </div>

                              <div>
                                <input type="checkbox" id="inputSubstatMods${index}" class="optimizer-checkbox">
                                <label for="inputSubstatMods${index}" data-t>${i18next.t(
                                  'Use substat mods',
                                )}</label>
                              </div>

                              <div>
                                <input type="checkbox" id="inputUsePvECritDamageCap${index}" class="optimizer-checkbox">
                                <label for="inputUsePvECritDamageCap${index}" data-t>${i18next.t(
                                  '400% CDmg cap',
                                )}</label>
                              </div>

                              <div style="display:none">
                                <input type="checkbox" id="inputOnlyMaxedGear${index}" class="optimizer-checkbox">
                                <label for="inputOnlyMaxedGear${index}" data-t>${i18next.t(
                                  'Only maxed gear',
                                )}</label>
                              </div>

                              <div>
                                <input type="checkbox" id="inputAllowLockedItems${index}" class="optimizer-checkbox">
                                <label for="inputAllowLockedItems${index}" data-t>${i18next.t(
                                  'Locked items',
                                )}</label>
                              </div>

                              <div>
                                <input type="checkbox" id="inputAllowEquippedItems${index}" class="optimizer-checkbox">
                                <label for="inputAllowEquippedItems${index}" data-t>${i18next.t(
                                  'Equipped items',
                                )}</label>
                              </div>

                              <div>
                                <input type="checkbox" id="inputKeepCurrentItems${index}" class="optimizer-checkbox">
                                <label for="inputKeepCurrentItems${index}" data-t>${i18next.t(
                                  'Keep current',
                                )}</label>
                              </div>
                              <div class="horizontalSpace"></div>

                              <select id="optionsEnhanceLimit${index}" class="optionsExcludeGearFrom">
                                <option value="0" data-t>${i18next.t(
                                  '+0 and higher',
                                )}</option>
                                <option value="3" data-t>${i18next.t(
                                  '+3 and higher',
                                )}</option>
                                <option value="6" data-t>${i18next.t(
                                  '+6 and higher',
                                )}</option>
                                <option value="9" data-t>${i18next.t(
                                  '+9 and higher',
                                )}</option>
                                <option value="12" data-t>${i18next.t(
                                  '+12 and higher',
                                )}</option>
                                <option value="15" data-t>${i18next.t(
                                  '+15 only',
                                )}</option>
                              </select><br>
                              <div class="horizontalSpace" ></div>

                              <select multiple="multiple" id="optionsExcludeGearFrom${index}" class="optionsExcludeGearFrom">
                              </select><br>
                            </div>


                            <div class="vertical"></div>

                            <div id="placeholder-panel" class="constraints-panel-col-small">
                              <div class="panelLabel">
                                <div class="panelLabelText" id="statsLabel${index}" data-t>${i18next.t(
                                  'Stat filters',
                                )}</div>
                              </div>
                              <input type="number" id="inputMinAtkLimit${index}" class="optimizer-number-input stat-number-input">
                              <div class="inputStatLabel" data-t>${i18next.t(
                                'Atk',
                              )}</div>
                              <input type="number" id="inputMaxAtkLimit${index}" class="optimizer-number-input stat-number-input"><br>
                              <input type="number" id="inputAtkTarget${index}" class="optimizer-number-input stat-number-input" style="margin-left:90px" placeholder="↑T"><br>

                              <input type="number" id="inputMinDefLimit${index}" class="optimizer-number-input stat-number-input">
                              <div class="inputStatLabel" data-t>${i18next.t(
                                'Def',
                              )}</div>
                              <input type="number" id="inputMaxDefLimit${index}" class="optimizer-number-input stat-number-input"><br>
                              <input type="number" id="inputDefTarget${index}" class="optimizer-number-input stat-number-input" style="margin-left:90px" placeholder="↑T"><br>

                              <input type="number" id="inputMinHpLimit${index}" class="optimizer-number-input stat-number-input">
                              <div class="inputStatLabel" data-t>${i18next.t(
                                'Hp',
                              )}</div>
                              <input type="number" id="inputMaxHpLimit${index}" class="optimizer-number-input stat-number-input"><br>
                              <input type="number" id="inputHpTarget${index}" class="optimizer-number-input stat-number-input" style="margin-left:90px" placeholder="↑T"><br>

                              <input type="number" id="inputMinSpdLimit${index}" class="optimizer-number-input stat-number-input">
                              <div class="inputStatLabel" data-t>${i18next.t(
                                'Spd',
                              )}</div>
                              <input type="number" id="inputMaxSpdLimit${index}" class="optimizer-number-input stat-number-input"><br>
                              <input type="number" id="inputSpdTarget${index}" class="optimizer-number-input stat-number-input" style="margin-left:90px" placeholder="↑T"><br>

                              <input type="number" id="inputMinCrLimit${index}" class="optimizer-number-input stat-number-input">
                              <div class="inputStatLabel" data-t>${i18next.t(
                                'CRate',
                              )}</div>
                              <input type="number" id="inputMaxCrLimit${index}" class="optimizer-number-input stat-number-input"><br>
                              <input type="number" id="inputCrTarget${index}" class="optimizer-number-input stat-number-input" style="margin-left:90px" placeholder="↑T"><br>

                              <input type="number" id="inputMinCdLimit${index}" class="optimizer-number-input stat-number-input">
                              <div class="inputStatLabel" data-t>${i18next.t(
                                'CDmg',
                              )}</div>
                              <input type="number" id="inputMaxCdLimit${index}" class="optimizer-number-input stat-number-input"><br>
                              <input type="number" id="inputCdTarget${index}" class="optimizer-number-input stat-number-input" style="margin-left:90px" placeholder="↑T"><br>

                              <input type="number" id="inputMinEffLimit${index}" class="optimizer-number-input stat-number-input">
                              <div class="inputStatLabel" data-t>${i18next.t(
                                'Eff',
                              )}</div>
                              <input type="number" id="inputMaxEffLimit${index}" class="optimizer-number-input stat-number-input"><br>
                              <input type="number" id="inputEffTarget${index}" class="optimizer-number-input stat-number-input" style="margin-left:90px" placeholder="↑T"><br>

                              <input type="number" id="inputMinResLimit${index}" class="optimizer-number-input stat-number-input">
                              <div class="inputStatLabel" data-t>${i18next.t(
                                'Res',
                              )}</div>
                              <input type="number" id="inputMaxResLimit${index}" class="optimizer-number-input stat-number-input"><br>
                              <input type="number" id="inputResTarget${index}" class="optimizer-number-input stat-number-input" style="margin-left:90px" placeholder="↑T"><br>
                            </div>

                            <div id="placeholder-panel" class="constraints-panel-col-small">
                              <div class="panelLabel">
                                <div class="panelLabelText" id="ratingsLabel${index}" data-t>${i18next.t(
                                  'Rating filters',
                                )}</div>
                              </div>
                              <input type="number" id="inputMinCpLimit${index}" class="optimizer-number-input rating-number-input">
                              <div class="inputStatLabel" data-t>${i18next.t(
                                'Cp',
                              )}</div>
                              <input type="number" id="inputMaxCpLimit${index}" class="optimizer-number-input rating-number-input"><br>

                              <input type="number" id="inputMinItemGSLimit${index}" class="optimizer-number-input rating-number-input">
                              <div class="inputStatLabel" data-t>${i18next.t(
                                'ItemGS',
                              )}</div>
                              <input type="number" id="inputMaxItemGSLimit${index}" class="optimizer-number-input rating-number-input"><br>

                              <input type="number" id="inputMinHppsLimit${index}" class="optimizer-number-input rating-number-input">
                              <div class="inputStatLabel" data-t>${i18next.t(
                                'HpS',
                              )}</div>
                              <input type="number" id="inputMaxHppsLimit${index}" class="optimizer-number-input rating-number-input"><br>

                              <input type="number" id="inputMinEhpLimit${index}" class="optimizer-number-input rating-number-input">
                              <div class="inputStatLabel" data-t>${i18next.t(
                                'Ehp',
                              )}</div>
                              <input type="number" id="inputMaxEhpLimit${index}" class="optimizer-number-input rating-number-input"><br>

                              <input type="number" id="inputMinEhppsLimit${index}" class="optimizer-number-input rating-number-input">
                              <div class="inputStatLabel" data-t>${i18next.t(
                                'EhpS',
                              )}</div>
                              <input type="number" id="inputMaxEhppsLimit${index}" class="optimizer-number-input rating-number-input"><br>

                              <input type="number" id="inputMinDmgLimit${index}" class="optimizer-number-input rating-number-input">
                              <div class="inputStatLabel" data-t>${i18next.t(
                                'Dmg',
                              )}</div>
                              <input type="number" id="inputMaxDmgLimit${index}" class="optimizer-number-input rating-number-input"><br>

                              <input type="number" id="inputMinDmgpsLimit${index}" class="optimizer-number-input rating-number-input">
                              <div class="inputStatLabel" data-t>${i18next.t(
                                'DmgS',
                              )}</div>
                              <input type="number" id="inputMaxDmgpsLimit${index}" class="optimizer-number-input rating-number-input"><br>

                              <input type="number" id="inputMinMcdmgLimit${index}" class="optimizer-number-input rating-number-input">
                              <div class="inputStatLabel" data-t>${i18next.t(
                                'Mcd',
                              )}</div>
                              <input type="number" id="inputMaxMcdmgLimit${index}" class="optimizer-number-input rating-number-input"><br>

                              <input type="number" id="inputMinMcdmgpsLimit${index}" class="optimizer-number-input rating-number-input">
                              <div class="inputStatLabel" data-t>${i18next.t(
                                'McdS',
                              )}</div>
                              <input type="number" id="inputMaxMcdmgpsLimit${index}" class="optimizer-number-input rating-number-input"><br>

                              <input type="number" id="inputMinDmgHLimit${index}" class="optimizer-number-input rating-number-input">
                              <div class="inputStatLabel" data-t>${i18next.t(
                                'DmgH',
                              )}</div>
                              <input type="number" id="inputMaxDmgHLimit${index}" class="optimizer-number-input rating-number-input"><br>

                              <input type="number" id="inputMinDmgDLimit${index}" class="optimizer-number-input rating-number-input">
                              <div class="inputStatLabel" data-t>${i18next.t(
                                'DmgD',
                              )}</div>
                              <input type="number" id="inputMaxDmgDLimit${index}" class="optimizer-number-input rating-number-input"><br>

                              <input type="number" id="inputMinScoreLimit${index}" class="optimizer-number-input rating-number-input">
                              <div class="inputStatLabel" data-t>${i18next.t(
                                'GS',
                              )}</div>
                              <input type="number" id="inputMaxScoreLimit${index}" class="optimizer-number-input rating-number-input"><br>

                              <input type="number" id="inputMinBSLimit${index}" class="optimizer-number-input rating-number-input">
                              <div class="inputStatLabel" data-t>${i18next.t(
                                'BS',
                              )}</div>
                              <input type="number" id="inputMaxBSLimit${index}" class="optimizer-number-input rating-number-input"><br>

                              <input type="number" id="inputMinPriorityLimit${index}" class="optimizer-number-input rating-number-input">
                              <div class="inputStatLabel" data-t>${i18next.t(
                                'Prio',
                              )}</div>
                              <input type="number" id="inputMaxPriorityLimit${index}" class="optimizer-number-input rating-number-input"><br>

                              <input type="number" id="inputMinUpgradesLimit${index}" class="optimizer-number-input rating-number-input">
                              <div class="inputStatLabel" data-t>${i18next.t(
                                'Upg',
                              )}</div>
                              <input type="number" id="inputMaxUpgradesLimit${index}" class="optimizer-number-input rating-number-input"><br>

                              <input type="number" id="inputMinConversionsLimit${index}" class="optimizer-number-input rating-number-input">
                              <div class="inputStatLabel" data-t>${i18next.t(
                                'Conv',
                              )}</div>
                              <input type="number" id="inputMaxConversionsLimit${index}" class="optimizer-number-input rating-number-input"><br>

                              <input type="number" id="inputMinEquippedLimit${index}" class="optimizer-number-input rating-number-input">
                              <div class="inputStatLabel" data-t>${i18next.t(
                                'Eq',
                              )}</div>
                              <input type="number" id="inputMaxEquippedLimit${index}" class="optimizer-number-input rating-number-input"><br>

                              <input type="number" id="inputMinS1Limit${index}" class="optimizer-number-input rating-number-input">
                              <div class="inputStatLabel" data-t>${i18next.t(
                                'S1',
                              )}</div>
                              <input type="number" id="inputMaxS1Limit${index}" class="optimizer-number-input rating-number-input"><br>

                              <input type="number" id="inputMinS2Limit${index}" class="optimizer-number-input rating-number-input">
                              <div class="inputStatLabel" data-t>${i18next.t(
                                'S2',
                              )}</div>
                              <input type="number" id="inputMaxS2Limit${index}" class="optimizer-number-input rating-number-input"><br>

                              <input type="number" id="inputMinS3Limit${index}" class="optimizer-number-input rating-number-input">
                              <div class="inputStatLabel" data-t>${i18next.t(
                                'S3',
                              )}</div>
                              <input type="number" id="inputMaxS3Limit${index}" class="optimizer-number-input rating-number-input"><br>

                            </div>

                            <div class="vertical"></div>

                            <div id="stat-priority-panel" class="constraints-panel-col">

                              <div class="panelLabel">
                                <div class="panelLabelText" id="substatPriorityLabel${index}" data-t>${i18next.t(
                                  'Substat priority',
                                )}</div>
                              </div>

                              <div class="sliderRow">
                                <div class="sliderLabel" data-t>${i18next.t(
                                  'Atk',
                                )}</div>
                                <input class="sliderInput" id="atkSlider${index}Input" type="number" value="0" readonly>
                                <div class="sliderContainer"><input class="slider" id="atkSlider${index}" type="range" min="-1" max="3" value="0" step="0.1"></div>
                              </div>

                              <div class="sliderRow">
                                <div class="sliderLabel" data-t>${i18next.t(
                                  'Def',
                                )}</div>
                                <input class="sliderInput" id="defSlider${index}Input" type="number" value="0" readonly>
                                <div class="sliderContainer"><input class="slider" id="defSlider${index}" type="range" min="-1" max="3" value="0" step="0.1"></div>
                              </div>

                              <div class="sliderRow">
                                <div class="sliderLabel" data-t>${i18next.t(
                                  'Hp',
                                )}</div>
                                <input class="sliderInput" id="hpSlider${index}Input" type="number" value="0" readonly>
                                <div class="sliderContainer"><input class="slider" id="hpSlider${index}" type="range" min="-1" max="3" value="0" step="0.1"></div>
                              </div>

                              <div class="sliderRow">
                                <div class="sliderLabel" data-t>${i18next.t(
                                  'Spd',
                                )}</div>
                                <input class="sliderInput" id="spdSlider${index}Input" type="number" value="0" readonly>
                                <div class="sliderContainer"><input class="slider" id="spdSlider${index}" type="range" min="-1" max="3" value="0" step="0.1"></div>
                              </div>

                              <div class="sliderRow">
                                <div class="sliderLabel" data-t>${i18next.t(
                                  'Cr',
                                )}</div>
                                <input class="sliderInput" id="crSlider${index}Input" type="number" value="0" readonly>
                                <div class="sliderContainer"><input class="slider" id="crSlider${index}" type="range" min="-1" max="3" value="0" step="0.1"></div>
                              </div>

                              <div class="sliderRow">
                                <div class="sliderLabel" data-t>${i18next.t(
                                  'Cd',
                                )}</div>
                                <input class="sliderInput" id="cdSlider${index}Input" type="number" value="0" readonly>
                                <div class="sliderContainer"><input class="slider" id="cdSlider${index}" type="range" min="-1" max="3" value="0" step="0.1"></div>
                              </div>

                              <div class="sliderRow">
                                <div class="sliderLabel" data-t>${i18next.t(
                                  'Eff',
                                )}</div>
                                <input class="sliderInput" id="effSlider${index}Input" type="number" value="0" readonly>
                                <div class="sliderContainer"><input class="slider" id="effSlider${index}" type="range" min="-1" max="3" value="0" step="0.1"></div>
                              </div>


                              <div class="sliderRow">
                                <div class="sliderLabel" data-t>${i18next.t(
                                  'Res',
                                )}</div>
                                <input class="sliderInput" id="resSlider${index}Input" type="number" value="0" readonly>
                                <div class="sliderContainer"><input class="slider" id="resSlider${index}" type="range" min="-1" max="3" value="0" step="0.1"></div>
                              </div>

                              <div class="horizontalSpace" ></div>
                              <div class="horizontalSpace" ></div>
                              <div class="horizontalSpace" ></div>
                              <div class="horizontalSpace" ></div>
                              <div class="horizontalSpace" ></div>
                              <div class="horizontalSpace" ></div>
                              <div class="horizontalSpace" ></div>
                              <div class="horizontalSpace" ></div>

                              <div class="sliderRow">
                                <div class="sliderLabel" data-t>${i18next.t('Wpn %')}</div>
                                <input class="sliderInput" id="weaponFilterSlider${index}Input" type="number" value="100" readonly>
                                <div class="sliderContainer"><input class="slider" id="weaponFilterSlider${index}" type="range" min="10" max="100" value="100" step="1"></div>
                              </div>
                              <div class="horizontalSpace" ></div>
                              <div class="sliderRow">
                                <div class="sliderLabel" data-t>${i18next.t('Hlm %')}</div>
                                <input class="sliderInput" id="helmetFilterSlider${index}Input" type="number" value="100" readonly>
                                <div class="sliderContainer"><input class="slider" id="helmetFilterSlider${index}" type="range" min="10" max="100" value="100" step="1"></div>
                              </div>
                              <div class="horizontalSpace" ></div>
                              <div class="sliderRow">
                                <div class="sliderLabel" data-t>${i18next.t('Arm %')}</div>
                                <input class="sliderInput" id="armorFilterSlider${index}Input" type="number" value="100" readonly>
                                <div class="sliderContainer"><input class="slider" id="armorFilterSlider${index}" type="range" min="10" max="100" value="100" step="1"></div>
                              </div>
                              <div class="horizontalSpace" ></div>
                              <div class="sliderRow">
                                <div class="sliderLabel" data-t>${i18next.t('Nkl %')}</div>
                                <input class="sliderInput" id="necklaceFilterSlider${index}Input" type="number" value="100" readonly>
                                <div class="sliderContainer"><input class="slider" id="necklaceFilterSlider${index}" type="range" min="10" max="100" value="100" step="1"></div>
                              </div>
                              <div class="horizontalSpace" ></div>
                              <div class="sliderRow">
                                <div class="sliderLabel" data-t>${i18next.t('Rng %')}</div>
                                <input class="sliderInput" id="ringFilterSlider${index}Input" type="number" value="100" readonly>
                                <div class="sliderContainer"><input class="slider" id="ringFilterSlider${index}" type="range" min="10" max="100" value="100" step="1"></div>
                              </div>
                              <div class="horizontalSpace" ></div>
                              <div class="sliderRow">
                                <div class="sliderLabel" data-t>${i18next.t('Bts %')}</div>
                                <input class="sliderInput" id="bootsFilterSlider${index}Input" type="number" value="100" readonly>
                                <div class="sliderContainer"><input class="slider" id="bootsFilterSlider${index}" type="range" min="10" max="100" value="100" step="1"></div>
                              </div>
                            </div>
                            <div class="vertical"></div>

                            <div id="constraints-focus-panel" class="constraints-panel-col">
                              <div class="panelLabel">
                                <div class="panelLabelText" id="accessorySetsLabel" data-t>${i18next.t(
                                  'Accessory main stats',
                                )}</div>
                              </div>
                              <select multiple="multiple" id="inputNecklaceStat${index}" class="inputGearFilterSelect">
                                <option value="CriticalHitChancePercent" data-t>${i18next.t(
                                  'Crit Chance',
                                )}</option>
                                <option value="CriticalHitDamagePercent" data-t>${i18next.t(
                                  'Crit Damage',
                                )}</option>
                                <option value="AttackPercent" data-t>${i18next.t(
                                  'Attack %',
                                )}</option>
                                <option value="Attack" data-t>${i18next.t(
                                  'Attack',
                                )}</option>
                                <option value="HealthPercent" data-t>${i18next.t(
                                  'Health %',
                                )}</option>
                                <option value="Health" data-t>${i18next.t(
                                  'Health',
                                )}</option>
                                <option value="DefensePercent" data-t>${i18next.t(
                                  'Defense %',
                                )}</option>
                                <option value="Defense" data-t>${i18next.t(
                                  'Defense',
                                )}</option>
                              </select><br>

                              <select multiple="multiple" id="inputRingStat${index}" class="inputGearFilterSelect">
                                <option value="EffectivenessPercent" data-t>${i18next.t(
                                  'Effectiveness',
                                )}</option>
                                <option value="EffectResistancePercent" data-t>${i18next.t(
                                  'Effect Resistance',
                                )}</option>
                                <option value="AttackPercent" data-t>${i18next.t(
                                  'Attack %',
                                )}</option>
                                <option value="Attack" data-t>${i18next.t(
                                  'Attack',
                                )}</option>
                                <option value="HealthPercent" data-t>${i18next.t(
                                  'Health %',
                                )}</option>
                                <option value="Health" data-t>${i18next.t(
                                  'Health',
                                )}</option>
                                <option value="DefensePercent" data-t>${i18next.t(
                                  'Defense %',
                                )}</option>
                                <option value="Defense" data-t>${i18next.t(
                                  'Defense',
                                )}</option>
                              </select><br>

                              <select multiple="multiple" id="inputBootsStat${index}" class="inputGearFilterSelect">
                                <option value="Speed" data-t>${i18next.t(
                                  'Speed',
                                )}</option>
                                <option value="AttackPercent" data-t>${i18next.t(
                                  'Attack %',
                                )}</option>
                                <option value="Attack" data-t>${i18next.t(
                                  'Attack',
                                )}</option>
                                <option value="HealthPercent" data-t>${i18next.t(
                                  'Health %',
                                )}</option>
                                <option value="Health" data-t>${i18next.t(
                                  'Health',
                                )}</option>
                                <option value="DefensePercent" data-t>${i18next.t(
                                  'Defense %',
                                )}</option>
                                <option value="Defense" data-t>${i18next.t(
                                  'Defense',
                                )}</option>
                              </select><br>

                              <div class="panelLabel">
                                <div class="panelLabelText" data-t>${i18next.t(
                                  'Sets',
                                )}</div>
                              </div>
                              <select multiple="multiple" id="inputSet1${index}" class="inputSetFilterSelect">
                                <!-- <option value="None" data-t>None</option> -->
                                <optgroup label="4 Piece" data-t>
                                  <option value="Attack" data-t>${i18next.t(
                                    'Attack',
                                  )}</option>
                                  <option value="Counter" data-t>${i18next.t(
                                    'Counter',
                                  )}</option>
                                  <option value="Destruction" data-t>${i18next.t(
                                    'Destruction',
                                  )}</option>
                                  <option value="Injury" data-t>${i18next.t(
                                    'Injury',
                                  )}</option>
                                  <option value="Lifesteal" data-t>${i18next.t(
                                    'Lifesteal',
                                  )}</option>
                                  <option value="Protection" data-t>${i18next.t(
                                    'Protection',
                                  )}</option>
                                  <option value="Rage" data-t>${i18next.t(
                                    'Rage',
                                  )}</option>
                                  <option value="Revenge" data-t>${i18next.t(
                                    'Revenge',
                                  )}</option>
                                  <option value="Reversal" data-t>${i18next.t(
                                    'Reversal',
                                  )}</option>
                                  <option value="Riposte" data-t>${i18next.t(
                                    'Riposte',
                                  )}</option>
                                  <option value="Speed" data-t>${i18next.t(
                                    'Speed',
                                  )}</option>
                                </optgroup>
                                <optgroup label="2 Piece" data-t>
                                  <option value="Critical" data-t>${i18next.t(
                                    'Critical',
                                  )}</option>
                                  <option value="Defense" data-t>${i18next.t(
                                    'Defense',
                                  )}</option>
                                  <option value="Health" data-t>${i18next.t(
                                    'Health',
                                  )}</option>
                                  <option value="Hit" data-t>${i18next.t(
                                    'Hit',
                                  )}</option>
                                  <option value="Immunity" data-t>${i18next.t(
                                    'Immunity',
                                  )}</option>
                                  <option value="Penetration" data-t>${i18next.t(
                                    'Penetration',
                                  )}</option>
                                  <option value="Resist" data-t>${i18next.t(
                                    'Resist',
                                  )}</option>
                                  <option value="Torrent" data-t>${i18next.t(
                                    'Torrent',
                                  )}</option>
                                  <option value="Unity" data-t>${i18next.t(
                                    'Unity',
                                  )}</option>
                                </optgroup>
                              </select><br>

                              <select multiple="multiple" id="inputSet2${index}" class="inputSetFilterSelect">
                                <!-- <option value="None" data-t>None</option> -->
                                <optgroup label="2 Piece" data-t>
                                  <option value="Critical" data-t>${i18next.t(
                                    'Critical',
                                  )}</option>
                                  <option value="Defense" data-t>${i18next.t(
                                    'Defense',
                                  )}</option>
                                  <option value="Health" data-t>${i18next.t(
                                    'Health',
                                  )}</option>
                                  <option value="Hit" data-t>${i18next.t(
                                    'Hit',
                                  )}</option>
                                  <option value="Immunity" data-t>${i18next.t(
                                    'Immunity',
                                  )}</option>
                                  <option value="Penetration" data-t>${i18next.t(
                                    'Penetration',
                                  )}</option>
                                  <option value="Resist" data-t>${i18next.t(
                                    'Resist',
                                  )}</option>
                                  <option value="Torrent" data-t>${i18next.t(
                                    'Torrent',
                                  )}</option>
                                  <option value="Unity" data-t>${i18next.t(
                                    'Unity',
                                  )}</option>
                                </optgroup>
                              </select><br>

                              <select multiple="multiple" id="inputSet3${index}" class="inputSetFilterSelect">
                                <!-- <option value="None" data-t>None</option> -->
                                <optgroup label="2 Piece" data-t>
                                  <option value="Critical" data-t>${i18next.t(
                                    'Critical',
                                  )}</option>
                                  <option value="Defense" data-t>${i18next.t(
                                    'Defense',
                                  )}</option>
                                  <option value="Health" data-t>${i18next.t(
                                    'Health',
                                  )}</option>
                                  <option value="Hit" data-t>${i18next.t(
                                    'Hit',
                                  )}</option>
                                  <option value="Immunity" data-t>${i18next.t(
                                    'Immunity',
                                  )}</option>
                                  <option value="Penetration" data-t>${i18next.t(
                                    'Penetration',
                                  )}</option>
                                  <option value="Resist" data-t>${i18next.t(
                                    'Resist',
                                  )}</option>
                                  <option value="Torrent" data-t>${i18next.t(
                                    'Torrent',
                                  )}</option>
                                  <option value="Unity" data-t>${i18next.t(
                                    'Unity',
                                  )}</option>
                                </optgroup>
                              </select>

                              <div class="panelLabel">
                                <div class="panelLabelText" data-t>${i18next.t(
                                  'Exclude',
                                )}</div>
                              </div>
                              <select multiple="multiple" id="inputExcludeSet${index}" class="inputSetFilterSelect">
                                <!-- <option value="None" data-t>None</option> -->
                                <optgroup label="4 Piece" data-t>
                                  <option value="Attack" data-t>${i18next.t(
                                    'Attack',
                                  )}</option>
                                  <option value="Counter" data-t>${i18next.t(
                                    'Counter',
                                  )}</option>
                                  <option value="Destruction" data-t>${i18next.t(
                                    'Destruction',
                                  )}</option>
                                  <option value="Injury" data-t>${i18next.t(
                                    'Injury',
                                  )}</option>
                                  <option value="Lifesteal" data-t>${i18next.t(
                                    'Lifesteal',
                                  )}</option>
                                  <option value="Protection" data-t>${i18next.t(
                                    'Protection',
                                  )}</option>
                                  <option value="Rage" data-t>${i18next.t(
                                    'Rage',
                                  )}</option>
                                  <option value="Revenge" data-t>${i18next.t(
                                    'Revenge',
                                  )}</option>
                                  <option value="Reversal" data-t>${i18next.t(
                                    'Reversal',
                                  )}</option>
                                  <option value="Riposte" data-t>${i18next.t(
                                    'Riposte',
                                  )}</option>
                                  <option value="Speed" data-t>${i18next.t(
                                    'Speed',
                                  )}</option>
                                </optgroup>
                                <optgroup label="2 Piece" data-t>
                                  <option value="Critical" data-t>${i18next.t(
                                    'Critical',
                                  )}</option>
                                  <option value="Defense" data-t>${i18next.t(
                                    'Defense',
                                  )}</option>
                                  <option value="Health" data-t>${i18next.t(
                                    'Health',
                                  )}</option>
                                  <option value="Hit" data-t>${i18next.t(
                                    'Hit',
                                  )}</option>
                                  <option value="Immunity" data-t>${i18next.t(
                                    'Immunity',
                                  )}</option>
                                  <option value="Penetration" data-t>${i18next.t(
                                    'Penetration',
                                  )}</option>
                                  <option value="Resist" data-t>${i18next.t(
                                    'Resist',
                                  )}</option>
                                  <option value="Torrent" data-t>${i18next.t(
                                    'Torrent',
                                  )}</option>
                                  <option value="Unity" data-t>${i18next.t(
                                    'Unity',
                                  )}</option>
                                </optgroup>
                              </select><br>
                              <button id="openSlotSubstatFilter${index}" class="optimizer-btn" style="margin-top:6px;width:100%" type="button">Substat Filter</button>
                            </div>
                        </div>
                    </div>
                `,
      didOpen: async () => {
        OptimizerTab.buildSlider(`#atkSlider${index}`);
        OptimizerTab.buildSlider(`#hpSlider${index}`);
        OptimizerTab.buildSlider(`#defSlider${index}`);
        OptimizerTab.buildSlider(`#spdSlider${index}`);
        OptimizerTab.buildSlider(`#crSlider${index}`);
        OptimizerTab.buildSlider(`#cdSlider${index}`);
        OptimizerTab.buildSlider(`#effSlider${index}`);
        OptimizerTab.buildSlider(`#resSlider${index}`);
        OptimizerTab.buildTopSlider(`#weaponFilterSlider${index}`);
        OptimizerTab.buildTopSlider(`#helmetFilterSlider${index}`);
        OptimizerTab.buildTopSlider(`#armorFilterSlider${index}`);
        OptimizerTab.buildTopSlider(`#necklaceFilterSlider${index}`);
        OptimizerTab.buildTopSlider(`#ringFilterSlider${index}`);
        OptimizerTab.buildTopSlider(`#bootsFilterSlider${index}`);

        const assetsBySet = Assets.getAssetsBySet();

        const groupSelectMultipleSelectOptions = {
          maxHeight: 600,
          showClear: true,
          // hideOptgroupCheckboxes: true,
          minimumCountSelected: 99,
          displayTitle: true,
          displayValues: true,
          selectAll: false,
          textTemplate(el) {
            const assetKey = `${el[0].value}Set`;

            if (Object.keys(assetsBySet).includes(assetKey)) {
              const asset = assetsBySet[assetKey];
              return `<div class="selectorSetContainer"><img class="selectorSetImage" src="${asset}"></img><div class="selectorSetText">${el.html()}</div><span class="selectorSetCount" data-set-key="${assetKey}" data-set-index="${index}"></span></div>`;
            }

            return el.html();
          },
          styler(_row) {
            return '';
          },
        };
        const excludeEquippedSelectOptions = {
          maxHeight: 450,
          showClear: true,
          hideOptgroupCheckboxes: true,
          minimumCountSelected: 99,
          displayTitle: true,
          selectAll: false,
          filter: true,
        };
        const selectAllMultipleSelectOptions = {
          maxHeight: 450,
          showClear: true,
          hideOptgroupCheckboxes: true,
          minimumCountSelected: 99,
          displayTitle: true,
          selectAll: true,
        };
        const enhanceOptions = {
          maxHeight: 500,
          showClear: false,
          minimumCountSelected: 99,
          displayTitle: true,
          selectAll: false,
        };

        $(`#inputSet1${index}`).multipleSelect({
          ...groupSelectMultipleSelectOptions,
          placeholder: i18next.t('4 or 2 piece sets'),
        });
        $(`#inputSet2${index}`).multipleSelect({
          ...groupSelectMultipleSelectOptions,
          placeholder: i18next.t('2 piece sets'),
        });
        $(`#inputSet3${index}`).multipleSelect({
          ...groupSelectMultipleSelectOptions,
          placeholder: i18next.t('2 piece sets'),
        });
        $(`#inputNecklaceStat${index}`).multipleSelect({
          ...selectAllMultipleSelectOptions,
          placeholder: i18next.t('Necklace'),
          textTemplate(el) {
            return `<span class="mainStatRow">${el.html()}<span class="mainStatCount" data-main-type="${el[0].value}" data-slot="Necklace" data-set-index="${index}"></span></span>`;
          },
          formatSelectAll() {
            return i18next.t('[Select all]');
          },
        });
        $(`#inputRingStat${index}`).multipleSelect({
          ...selectAllMultipleSelectOptions,
          placeholder: i18next.t('Ring'),
          textTemplate(el) {
            return `<span class="mainStatRow">${el.html()}<span class="mainStatCount" data-main-type="${el[0].value}" data-slot="Ring" data-set-index="${index}"></span></span>`;
          },
          formatSelectAll() {
            return i18next.t('[Select all]');
          },
        });
        $(`#inputBootsStat${index}`).multipleSelect({
          ...selectAllMultipleSelectOptions,
          placeholder: i18next.t('Boots'),
          textTemplate(el) {
            return `<span class="mainStatRow">${el.html()}<span class="mainStatCount" data-main-type="${el[0].value}" data-slot="Boots" data-set-index="${index}"></span></span>`;
          },
          formatSelectAll() {
            return i18next.t('[Select all]');
          },
        });
        $(`#inputExcludeSet${index}`).multipleSelect({
          ...groupSelectMultipleSelectOptions,
          placeholder: i18next.t('Exclude sets'),
        });

        const getAllHeroesResponse = await Api.getAllHeroes();
        const optimizerAllowGearFromSelector = document.getElementById(
          `optionsExcludeGearFrom${index}`,
        );
        const { heroes } = getAllHeroesResponse;
        Utils.sortByAttribute(heroes, 'name');
        for (const optionHero of heroes) {
          const option2 = document.createElement('option');
          option2.innerHTML = i18next.t(optionHero.name);
          option2.label = optionHero.name;
          option2.value = optionHero.id;

          optimizerAllowGearFromSelector.add(option2);
        }
        $(`#optionsExcludeGearFrom${index}`).multipleSelect({
          ...excludeEquippedSelectOptions,
          placeholder: i18next.t('Exclude equipped'),
          selectAll: true,
          formatSelectAll() {
            return i18next.t('[Select all]');
          },
        });

        Selectors.refreshAllowGearFrom(index);
        $(`#optionsExcludeGearFrom${index}`).change(() => {
          const selects = $(`#optionsExcludeGearFrom${index}`).multipleSelect(
            'getSelects',
          );
          $('#optionsExcludeGearFrom').multipleSelect('setSelects', selects);
          $('#optionsExcludeGearFrom').multipleSelect('refresh');
          Settings.saveSettings();
        });

        $(`#optionsEnhanceLimit${index}`).change(() => {
          const selects = $(`#optionsEnhanceLimit${index}`).multipleSelect(
            'getSelects',
          );
          $('#optionsEnhanceLimit').multipleSelect('setSelects', selects);
          $('#optionsEnhanceLimit').multipleSelect('refresh');
          Settings.saveSettings();
        });

        $(`#optionsEnhanceLimit${index}`).multipleSelect({
          ...enhanceOptions,
          placeholder: i18next.t('Minimum enhance'),
          selectAll: false,
        });
        const selects = $('#optionsEnhanceLimit').multipleSelect('getSelects');
        $(`#optionsEnhanceLimit${index}`).multipleSelect('setSelects', selects);
        $(`#optionsEnhanceLimit${index}`).multipleSelect('refresh');

        OptimizerTab.loadPreviousHeroFilters(
          { hero },
          index,
          false,
          'multiOptimizer',
        );

        document
          .getElementById(`openSlotSubstatFilter${index}`)
          .addEventListener('click', async () => {
            const result = await Dialog.slotSubstatFilterDialog(
              OptimizerTab.getSlotSubstatFilters(index),
              index,
            );
            if (result) {
              OptimizerTab.setSlotSubstatFilters(index, result.slotFilters);
            }
          });
      },
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: i18next.t('Save'),
      cancelButtonText: i18next.t('Cancel'),
      preConfirm: async () => {
        const params = await OptimizerTab.getOptimizationRequestParams(
          true,
          index,
        );
        return params;
      },
    });

    return result.value;
  },

  confirmation: async (text) => {
    const result = await Swal.fire({
      title: '',
      icon: 'question',
      text,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: i18next.t('OK'),
      cancelButtonText: i18next.t('Cancel'),
    });

    return result.value;
  },

  editModStatsDialog: async (hero) => {
    function globalSelectHtml(id, options, isSelectedFn) {
      const optionsHtml = options
        .map((o) => {
          const sel = isSelectedFn(o.value) ? ' selected' : '';
          return `<option value="${o.value}"${sel}>${o.label}</option>`;
        })
        .join('');
      return `<select id="${id}" class="globalModSelect">${optionsHtml}</select>`;
    }

    function slotOptionSelectHtml(id, selectedValue, options) {
      const optionsHtml = options
        .map((o) => {
          const sel =
            selectedValue !== null &&
            selectedValue !== undefined &&
            String(o.value) === String(selectedValue)
              ? ' selected'
              : '';
          return `<option value="${o.value}"${sel}>${o.label}</option>`;
        })
        .join('');
      return `<select id="${id}" class="slotOptionSelect"><option value=""${selectedValue === null || selectedValue === undefined ? ' selected' : ''}></option>${optionsHtml}</select>`;
    }
    const heroData = HeroData.getAllHeroData();

    const heroInfo = heroData[hero.name.replace(/\s#\d+$/, '')];

    const SLOTS = ['Weapon', 'Helmet', 'Armor', 'Necklace', 'Ring', 'Boots'];

    const rollQualityOptions = [
      { value: 0, label: 'Min' },
      { value: 10, label: '10%' },
      { value: 20, label: '20%' },
      { value: 30, label: '30%' },
      { value: 40, label: '40%' },
      { value: 50, label: '50%' },
      { value: 60, label: '60%' },
      { value: 70, label: '70%' },
      { value: 80, label: '80%' },
      { value: 90, label: '90%' },
      { value: 100, label: 'Max' },
    ];

    const slotTabPanelsHtml = SLOTS.map((slot) => {
      const existingCfg = hero.slotModConfig?.[slot];
      const hasOverride = !!existingCfg;

      const limitRollsSelect = slotOptionSelectHtml(
        `slotLimitRolls_${slot}`,
        existingCfg?.limitRolls ?? null,
        [1, 2, 3, 4, 5, 6].map((n) => ({ value: n, label: String(n) })),
      );
      const modGradeSelect = slotOptionSelectHtml(
        `slotModGrade_${slot}`,
        existingCfg?.modGrade ?? null,
        [
          { value: 'lesser', label: i18next.t('Lesser') },
          { value: 'greater', label: i18next.t('Greater') },
        ],
      );
      const rollQualitySelect = slotOptionSelectHtml(
        `slotRollQuality_${slot}`,
        existingCfg?.rollQuality ?? null,
        rollQualityOptions,
      );
      const keepStatOptionsSelect = slotOptionSelectHtml(
        `slotKeepStatOptions_${slot}`,
        existingCfg?.keepStatOptions ?? null,
        [
          {
            value: 'neverReplace',
            label: i18next.t('Never replace wanted stats'),
          },
          {
            value: 'replace',
            label: i18next.t('Allow replacing wanted with wanted'),
          },
        ],
      );

      return `
                <div class="modTabPanel modTabPanelHidden" id="modTabPanel_${slot}">
                    <div class="slotOverrideRow">
                        <label class="slotOverrideLabel">
                            <input type="checkbox" id="slotOverride_${slot}" class="slotOverrideCheckbox" data-slot="${slot}" ${
                              hasOverride ? 'checked' : ''
                            }>
                            <span data-t>${i18next.t(
                              'Custom config for this slot',
                            )}</span>
                        </label>
                    </div>
                    <div class="slotOptionsSection${
                      hasOverride ? '' : ' slotSectionDimmed'
                    }" id="slotOptionsSection_${slot}">
                        <p class="slotOptionsSectionLabel" data-t>${i18next.t(
                          'Options (blank = inherit from Global)',
                        )}</p>
                        <div class="editGearFormRow">
                            <div class="editGearStatLabel" data-t>${i18next.t(
                              'Limit Rolls',
                            )}</div>
                            ${limitRollsSelect}
                        </div>
                        <div class="editGearFormRow">
                            <div class="editGearStatLabel" data-t>${i18next.t(
                              'Mod Grade',
                            )}</div>
                            ${modGradeSelect}
                        </div>
                        <div class="editGearFormRow">
                            <div class="editGearStatLabel" data-t>${i18next.t(
                              'Roll Quality',
                            )}</div>
                            ${rollQualitySelect}
                        </div>
                        <div class="editGearFormRow">
                            <div class="editGearStatLabel" data-t>${i18next.t(
                              'Wanted Stats',
                            )}</div>
                            ${keepStatOptionsSelect}
                        </div>
                    </div>
                    <div class="slotRuleSection${
                      hasOverride ? '' : ' slotSectionDimmed'
                    }" id="slotRuleSection_${slot}">
                        <p class="slotRuleSectionLabel" data-t>${i18next.t(
                          'Rules (first matching rule applies)',
                        )}</p>
                        <div class="ruleList" id="ruleList_${slot}"></div>
                        <div class="ruleListButtons">
                            <button class="addRuleBtn modListBtn" data-slot="${slot}" type="button">+ ${i18next.t(
                              'Add rule',
                            )}</button>
                            <button class="generateRulesBtn modListBtn" data-slot="${slot}" type="button">⚙ ${i18next.t(
                              'Generate from config',
                            )}</button>
                            <button class="copySlotBtn modListBtn" data-slot="${slot}" type="button">📋 ${i18next.t(
                              'Copy to...',
                            )}</button>
                        </div>
                        <div class="copySlotPicker" id="copySlotPicker_${slot}" style="display:none">
                            <span class="copySlotPickerLabel">${i18next.t('Copy all rules & options to:')}</span>
                            ${SLOTS.filter((s) => s !== slot)
                              .map(
                                (targetSlot) =>
                                  `<button class="copySlotTarget modListBtn" data-from="${slot}" data-to="${targetSlot}" type="button">${i18next.t(targetSlot)}</button>`,
                              )
                              .join('')}
                            <button class="copySlotCancel modListBtn" data-slot="${slot}" type="button">✕</button>
                        </div>
                    </div>
                </div>`;
    }).join('');

    const limitRollsHtml = globalSelectHtml(
      'limitRolls',
      [1, 2, 3, 4, 5, 6].map((n) => ({ value: n, label: String(n) })),
      (v) => hero.limitRolls === v || (!hero.limitRolls && v === 2),
    );

    const modGradeHtml = globalSelectHtml(
      'modGrade',
      [
        { value: 'lesser', label: i18next.t('Lesser') },
        { value: 'greater', label: i18next.t('Greater') },
      ],
      (v) => hero.modGrade === v || (!hero.modGrade && v === 'greater'),
    );

    const rollQualityHtml = globalSelectHtml(
      'rollQuality',
      rollQualityOptions,
      (v) => hero.rollQuality === v || (hero.rollQuality == null && v === 50),
    );

    const keepStatOptionsHtml = globalSelectHtml(
      'keepStatOptions',
      [
        {
          value: 'neverReplace',
          label: i18next.t('Never replace wanted stats'),
        },
        {
          value: 'replace',
          label: i18next.t('Allow replacing wanted with wanted'),
        },
      ],
      (v) =>
        hero.keepStatOptions === v ||
        (!hero.keepStatOptions && v === 'neverReplace'),
    );

    const maxModPiecesHtml = globalSelectHtml(
      'maxModPieces',
      [
        { value: 6, label: i18next.t('No limit') },
        ...[1, 2, 3, 4, 5].map((n) => ({ value: n, label: String(n) })),
      ],
      (v) =>
        v === 6
          ? !hero.maxModPieces || hero.maxModPieces >= 6
          : hero.maxModPieces === v,
    );

    const { value: formValues } = await Swal.fire({
      title: '',
      width: 1350,
      html: `
                    <div class="editGearForm">
                        <link href="https://cdn.jsdelivr.net/npm/@sweetalert2/themes@4.0.1/minimal/minimal.min.css" rel="stylesheet">

                        <p style="color: var(--font-color)" data-t>${i18next.t(
                          'Substat modification priority',
                        )}</p>

                        <div class="modPermanenceWarning" data-t>⚠ ${i18next.t(
                          'Substat mods are PERMANENT and irreversible in-game and cost resources. Only one substat per piece can be modified. Predicted values use your roll-quality setting — the actual in-game roll is random.',
                        )}</div>

                        <div class="modTopButtonsRow">
                            <button type="button" id="toggleAllSlotsBtn" class="modListBtn" data-t>${i18next.t(
                              'Toggle All Slots',
                            )}</button>
                            <button type="button" id="generateAllSlotsBtn" class="modListBtn" data-t>⚙ ${i18next.t(
                              'Generate All from Config',
                            )}</button>
                            <button type="button" id="modResetBtn" class="modListBtn modResetBtn" data-t>↺ ${i18next.t(
                              'Reset',
                            )}</button>
                            <button type="button" id="modSaveBtn" class="modListBtn modSaveBtn" data-t>💾 ${i18next.t(
                              'Save',
                            )}</button>
                        </div>

                        <div class="modSlotTabBar">
                            <div class="modSlotTab modSlotTabActive" id="modTab_Global" data-tab="Global">${i18next.t(
                              'Global',
                            )}</div>
                            ${SLOTS.map(
                              (slot) =>
                                `<div class="modSlotTab" id="modTab_${slot}" data-tab="${slot}">${i18next.t(
                                  slot,
                                )}</div>`,
                            ).join('')}
                        </div>

                        <div class="modTabsContentRow">

                            <div class="modTabsLeft">
                                <div class="modTabPanel" id="modTabPanel_Global">

                            <div class="editGearFormHalf">
                                <p style="color: var(--font-color)" data-t>${i18next.t(
                                  'Options',
                                )}</p>

                                <div class="editGearFormRow">
                                    <div class="editGearStatLabel" id="limitRollsLabel" data-t>${i18next.t(
                                      'Limit Rolls',
                                    )}</div>
                                    ${limitRollsHtml}
                                </div>

                                <div class="editGearFormRow">
                                    <div class="editGearStatLabel" id="modGradeLabel"  data-t>${i18next.t(
                                      'Mod Grade',
                                    )}</div>
                                    ${modGradeHtml}
                                </div>

                                <div class="editGearFormRow">
                                    <div class="editGearStatLabel" id="rollQualityLabel"  data-t>${i18next.t(
                                      'Roll Quality',
                                    )}</div>
                                    ${rollQualityHtml}
                                </div>

                                <div class="editGearFormRow">
                                    <div class="editGearStatLabel" id="keepStatsLabel" data-t>${i18next.t(
                                      'Wanted Stats',
                                    )}</div>
                                    ${keepStatOptionsHtml}
                                </div>

                                <div class="editGearFormRow">
                                    <div class="editGearStatLabel" id="maxModPiecesLabel" data-t>${i18next.t(
                                      'Max Mod Pieces',
                                    )}</div>
                                    ${maxModPiecesHtml}
                                </div>

                                <div class="editGearFormRow modSlotToggleRow" id="modSlotToggleRow">
                                    <div class="editGearStatLabel" id="modSlotsLabel" data-t>${i18next.t(
                                      'Mod Slots',
                                    )}</div>
                                    <div class="modSlotCheckboxes">
                                        ${[
                                          'Weapon',
                                          'Helmet',
                                          'Armor',
                                          'Necklace',
                                          'Ring',
                                          'Boots',
                                        ]
                                          .map((slot) => {
                                            const checked =
                                              hero.modSlots == null ||
                                              hero.modSlots.length === 0 ||
                                              hero.modSlots.includes(slot);
                                            return `<label class="modSlotLabel">
                                                <input type="checkbox" class="modSlotCheckbox" id="modSlot_${slot}" value="${slot}" ${checked ? 'checked' : ''}>
                                                <span>${i18next.t(slot)}</span>
                                            </label>`;
                                          })
                                          .join('')}
                                    </div>
                                </div>

                                <div id="modEstimateDisplay" class="modEstimateDisplay"></div>

                                <!-- ── Presets ───────────────────────────────────────── -->
                                <div class="presetSection" id="presetSection">
                                    <p class="presetSectionTitle" data-t>${i18next.t('Presets')}</p>
                                    <div class="presetRow">
                                        <input type="text" id="modDialogPresetNameInput" class="presetNameInput" placeholder="${i18next.t('Preset name...')}" />
                                        <button type="button" id="presetSaveBtn" class="modListBtn">💾 ${i18next.t('Save')}</button>
                                        <button type="button" id="presetDeleteBtn" class="modListBtn presetDeleteBtn">✕</button>
                                    </div>
                                    <div class="presetRow">
                                        <select id="presetSelect" class="presetSelectEl"><option value="">${i18next.t('\u2014 select preset \u2014')}</option></select>
                                        <button type="button" id="presetLoadBtn" class="modListBtn">↩ ${i18next.t('Load')}</button>
                                    </div>
                                    <div class="presetRow">
                                        <span class="presetApplyLabel" data-t>${i18next.t('Apply to set:')}</span>
                                        <select id="presetApplySetSelect" class="presetSelectEl"></select>
                                        <button type="button" id="presetApplyBtn" class="modListBtn presetApplyBtn">▶ ${i18next.t('Apply to Rules')}</button>
                                    </div>
                                </div>
                            </div>

                                </div><!-- /modTabPanel_Global -->
                                ${slotTabPanelsHtml}
                            </div><!-- /modTabsLeft -->

                            <div class="editGearFormVertical"></div>

                            <div class="modTabsRight">
                                <div id="globalDragPanel">
                                <p style="color: var(--font-color)" data-t>${i18next.t(
                                  'Substat selections',
                                )}</p>

                                <div class="groupContainer">
                                    <div class="groupColumn">
                                        <div id="keepGroup" class="dragOrderList">
                                            <div class="draggableColumnLabel" style="color: var(--font-color)" id="keepColumnLabel" data-t>${i18next.t(
                                              'Wanted substats',
                                            )}</div>
                                            <div id="keepContainer" class="draggableMovableContainer">
                                                ${generateStatList(
                                                  hero,
                                                  'keep',
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div class="groupColumn">
                                        <div id="ignoreGroup" class="dragOrderList">
                                            <div class="draggableColumnLabel" style="color: var(--font-color)" id="ignoreColumnLabel" data-t>${i18next.t(
                                              "Don't change",
                                            )}</div>
                                            <div id="ignoreContainer" class="draggableMovableContainer">
                                                ${generateStatList(
                                                  hero,
                                                  'ignore',
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div class="groupColumn">
                                        <div id="modifyGroup" class="dragOrderList">
                                            <div class="draggableColumnLabel" style="color: var(--font-color)" id="discardColumnLabel" data-t>${i18next.t(
                                              'Unwanted substats',
                                            )}</div>
                                            <div id="modifyContainer" class="draggableMovableContainer">
                                                ${generateStatList(
                                                  hero,
                                                  'discard',
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                                </div><!-- /globalDragPanel -->

                                <div id="slotDragPanel" style="display:none;">
                                    <div class="ruleRightHeader" id="ruleRightHeader" data-t>${i18next.t(
                                      'Select a rule to edit its substats',
                                    )}</div>
                                    <div class="groupContainer">
                                        <div class="groupColumn">
                                            <div id="slotKeepGroup" class="dragOrderList">
                                                <div class="draggableColumnLabel" style="color: var(--font-color)" data-t>${i18next.t(
                                                  'Wanted substats',
                                                )}</div>
                                                <div id="slotKeepContainer" class="draggableMovableContainer"></div>
                                            </div>
                                        </div>
                                        <div class="groupColumn">
                                            <div id="slotIgnoreGroup" class="dragOrderList">
                                                <div class="draggableColumnLabel" style="color: var(--font-color)" data-t>${i18next.t(
                                                  "Don't change",
                                                )}</div>
                                                <div id="slotIgnoreContainer" class="draggableMovableContainer"></div>
                                            </div>
                                        </div>
                                        <div class="groupColumn">
                                            <div id="slotModifyGroup" class="dragOrderList">
                                                <div class="draggableColumnLabel" style="color: var(--font-color)" data-t>${i18next.t(
                                                  'Unwanted substats',
                                                )}</div>
                                                <div id="slotModifyContainer" class="draggableMovableContainer"></div>
                                            </div>
                                        </div>
                                    </div>
                                </div><!-- /slotDragPanel -->
                            </div><!-- /modTabsRight -->
                        </div><!-- /modTabsContentRow -->
                    </div>
                `,
      didOpen: async () => {
        // Placeholder — replaced with real implementation once modEstimateItems is fetched.
        let updateModEstimate = () => {};

        globalThis.keepGroup = Sortable.create(
          document.getElementById('keepContainer'),
          {
            group: 'nested',
            filter: '.draggableColumnLabel',
            animation: 100,
            fallbackOnBody: true,
            onEnd: () => updateModEstimate(),
          },
        );
        globalThis.ignoreGroup = Sortable.create(
          document.getElementById('ignoreContainer'),
          {
            group: 'nested',
            filter: '.draggableColumnLabel',
            animation: 100,
            fallbackOnBody: true,
            onEnd: () => updateModEstimate(),
          },
        );
        globalThis.modifyGroup = Sortable.create(
          document.getElementById('modifyContainer'),
          {
            group: 'nested',
            filter: '.draggableColumnLabel',
            animation: 100,
            fallbackOnBody: true,
            onEnd: () => updateModEstimate(),
          },
        );

        // ── Slot tab sortables (shared right panel for rules) ─────────
        globalThis.slotKeepGroup = Sortable.create(
          document.getElementById('slotKeepContainer'),
          {
            group: 'slotNested',
            filter: '.draggableColumnLabel',
            animation: 100,
            fallbackOnBody: true,
          },
        );
        globalThis.slotIgnoreGroup = Sortable.create(
          document.getElementById('slotIgnoreContainer'),
          {
            group: 'slotNested',
            filter: '.draggableColumnLabel',
            animation: 100,
            fallbackOnBody: true,
          },
        );
        globalThis.slotModifyGroup = Sortable.create(
          document.getElementById('slotModifyContainer'),
          {
            group: 'slotNested',
            filter: '.draggableColumnLabel',
            animation: 100,
            fallbackOnBody: true,
          },
        );

        // ── Slot state init ───────────────────────────────────────────
        const modSlotState = {};
        SLOTS.forEach((slot) => {
          const existingCfg = hero.slotModConfig?.[slot];
          modSlotState[slot] = {
            override: !!existingCfg,
            limitRolls: existingCfg?.limitRolls ?? null,
            modGrade: existingCfg?.modGrade ?? null,
            rollQuality: existingCfg?.rollQuality ?? null,
            keepStatOptions: existingCfg?.keepStatOptions ?? null,
            rules: (existingCfg?.rules || []).map((r) => ({
              ...r,
              keepStats: [...(r.keepStats || [])],
              ignoreStats: [...(r.ignoreStats || [])],
              discardStats: [...(r.discardStats || [])],
              pinnedTarget: r.pinnedTarget || null,
            })),
          };
        });
        globalThis.modSlotState = modSlotState;
        globalThis.modDialogActiveSlot = null;
        globalThis.modDialogActiveRuleIdx = -1;
        globalThis.modDialogRuleListSortables = {};

        // ── Stat item divs builder ────────────────────────────────────
        // slot: optional — when provided, only shows the constraint badge
        // for that slot (hides irrelevant cross-slot badges).
        function buildStatDivs(statList, slot) {
          const SLOT_BADGE_FILTER = {
            Weapon: '✗Weap',
            Armor: '✗Arm',
          };
          const relevantBadge = slot ? SLOT_BADGE_FILTER[slot] : null;
          return statList
            .map((s) => {
              const badge = modConstraintBadge(s);
              // In slot panels suppress badges for other slots
              const showBadge =
                !relevantBadge || badge.includes(relevantBadge) ? badge : '';
              return `<div class="list-group-item" data-id="${s}"><span class="modStatLabel">${i18next.t(
                optimizerStatToDisplayStat[s] || s,
              )}</span>${showBadge}</div>`;
            })
            .join('');
        }

        // ── Main stat options for a slot ──────────────────────────────
        function buildMainStatOptions(slot, selectedValue) {
          const optReq = hero.optimizationRequest || {};
          const slotToField = {
            Necklace: 'inputNecklaceStat',
            Ring: 'inputRingStat',
            Boots: 'inputBootsStat',
          };
          const field = slotToField[slot];
          const availableStats =
            field && optReq[field] && optReq[field].length > 0
              ? optReq[field]
              : [];
          const options = [
            { value: '', label: i18next.t('Any') },
            ...availableStats.map((s) => ({
              value: s,
              label: i18next.t(optimizerStatToDisplayStat[s] || s),
            })),
          ];
          return options
            .map(
              (o) =>
                `<option value="${o.value}" ${
                  (selectedValue || '') === o.value ? 'selected' : ''
                }>${o.label}</option>`,
            )
            .join('');
        }

        // ── Pin-to-single-stat options ────────────────────────────────
        // Produces <option> list for the "Mod to:" quick-pin select on each rule.
        // Selecting one stat sets keepStats=[that stat] at save time (overrides drag-drop).
        function buildPinTargetOptions(selectedValue) {
          const blank = `<option value=""${!selectedValue ? ' selected' : ''}>— drag-drop —</option>`;
          const opts = MOD_TARGET_STATS.map(({ type, label }) => {
            const sel = selectedValue === type ? ' selected' : '';
            return `<option value="${type}"${sel}>${label}</option>`;
          }).join('');
          return blank + opts;
        }

        // ── Set options ───────────────────────────────────────────────
        function buildSetOptions(selectedValue) {
          const optReq = hero.optimizationRequest || {};
          const allSets = [
            ...(optReq.inputSetsOne || []),
            ...(optReq.inputSetsTwo || []),
            ...(optReq.inputSetsThree || []),
          ];
          const uniqueSets = [...new Set(allSets)];
          const options = [
            { value: '', label: i18next.t('Any') },
            ...uniqueSets.map((s) => ({
              value: s,
              label: s.replace('Set', ''),
            })),
          ];
          return options
            .map(
              (o) =>
                `<option value="${o.value}" ${
                  (selectedValue || '') === o.value ? 'selected' : ''
                }>${o.label}</option>`,
            )
            .join('');
        }

        // ── Render rule list for a slot ───────────────────────────────
        function renderRuleList(slot) {
          const listEl = document.getElementById(`ruleList_${slot}`);
          if (!listEl) return;
          const rules = modSlotState[slot].rules;
          const activeIdx =
            globalThis.modDialogActiveSlot === slot
              ? globalThis.modDialogActiveRuleIdx
              : -1;

          listEl.innerHTML = rules
            .map(
              (rule, i) => `
                        <div class="ruleRow${
                          i === activeIdx ? ' ruleRowSelected' : ''
                        }" data-slot="${slot}" data-idx="${i}">
                            <span class="ruleRowDragHandle">☰</span>
                            <label class="ruleEnabledLabel">
                                <input type="checkbox" class="ruleEnabledCb" ${
                                  rule.enabled === false ? '' : 'checked'
                                } data-slot="${slot}" data-idx="${i}">
                            </label>
                            <select class="ruleMainStatSelect" data-slot="${slot}" data-idx="${i}">${buildMainStatOptions(
                              slot,
                              rule.mainStat || '',
                            )}</select>
                            <select class="ruleSetSelect" data-slot="${slot}" data-idx="${i}">${buildSetOptions(
                              rule.set || '',
                            )}</select>
                            <select class="rulePinStatSelect" data-slot="${slot}" data-idx="${i}" title="Pin mod target to a single stat (overrides drag-drop Keep list)">${buildPinTargetOptions(
                              rule.pinnedTarget || '',
                            )}</select>
                            <button class="ruleDeleteBtn" data-slot="${slot}" data-idx="${i}" type="button">✕</button>
                        </div>`,
            )
            .join('');

          if (globalThis.modDialogRuleListSortables[slot]) {
            globalThis.modDialogRuleListSortables[slot].destroy();
          }
          globalThis.modDialogRuleListSortables[slot] = Sortable.create(
            listEl,
            {
              handle: '.ruleRowDragHandle',
              animation: 100,
              onEnd: (evt) => {
                const moved = modSlotState[slot].rules.splice(
                  evt.oldIndex,
                  1,
                )[0];
                modSlotState[slot].rules.splice(evt.newIndex, 0, moved);
                if (globalThis.modDialogActiveSlot === slot) {
                  const ai = globalThis.modDialogActiveRuleIdx;
                  if (evt.oldIndex === ai) {
                    globalThis.globalThislogActiveRuleIdx = evt.newIndex;
                  } else if (evt.oldIndex < ai && evt.newIndex >= ai) {
                    globalThis.modDialogActiveRuleIdx--;
                  } else if (evt.oldIndex > ai && evt.newIndex <= ai) {
                    globalThis.modDialogActiveRuleIdx++;
                  }
                }
                renderRuleList(slot);
              },
            },
          );
        }

        // ── Flush slot sortables → save to active rule ────────────────
        function flushSlotSortables() {
          const slot = globalThis.modDialogActiveSlot;
          const idx = globalThis.modDialogActiveRuleIdx;
          if (slot && idx >= 0 && modSlotState[slot]?.rules[idx]) {
            const rule = modSlotState[slot].rules[idx];
            rule.keepStats = globalThis.slotKeepGroup
              .toArray()
              .filter((x) => stats.includes(x));
            rule.discardStats = globalThis.slotModifyGroup
              .toArray()
              .filter((x) => stats.includes(x));
            rule.ignoreStats = globalThis.slotIgnoreGroup
              .toArray()
              .filter((x) => stats.includes(x));
          }
        }

        // ── Collect current dialog state into an editedHero object ───
        const mapRule = (r) => ({
          mainStat: r.mainStat || null,
          set: r.set || null,
          enabled: r.enabled !== false,
          // pinnedTarget (quick-pin select) overrides the drag-drop keepStats when set
          keepStats: r.pinnedTarget ? [r.pinnedTarget] : r.keepStats || [],
          ignoreStats: r.ignoreStats || [],
          discardStats: r.discardStats || [],
          pinnedTarget: r.pinnedTarget || null,
        });

        function buildEditedHeroData() {
          flushSlotSortables();

          const getSelectVal = (id) => {
            const el = _swalEl.querySelector(`#${id}`);
            return el && el.value !== '' ? el.value : null;
          };

          const modSlots = Array.from(
            _swalEl.querySelectorAll('.modSlotCheckbox:checked'),
          ).map((cb) => cb.value);

          const slotModConfig = {};
          SLOTS.forEach((slot) => {
            const slotData = globalThis.modSlotState[slot];
            if (!slotData?.override) {
              slotModConfig[slot] = null;
              return;
            }
            const limitRollsRaw = getSelectVal(`slotLimitRolls_${slot}`);
            const rollQualityRaw = getSelectVal(`slotRollQuality_${slot}`);
            slotModConfig[slot] = {
              limitRolls:
                limitRollsRaw === null
                  ? null
                  : Number.parseInt(limitRollsRaw, 10),
              modGrade: getSelectVal(`slotModGrade_${slot}`),
              rollQuality:
                rollQualityRaw === null
                  ? null
                  : Number.parseFloat(rollQualityRaw),
              keepStatOptions: getSelectVal(`slotKeepStatOptions_${slot}`),
              rules: slotData.rules.map(mapRule),
            };
          });

          return {
            discardStats: globalThis.modifyGroup
              .toArray()
              .filter((x) => stats.includes(x)),
            ignoreStats: globalThis.ignoreGroup
              .toArray()
              .filter((x) => stats.includes(x)),
            keepStats: globalThis.keepGroup
              .toArray()
              .filter((x) => stats.includes(x)),
            modGrade: _swalEl.querySelector('#modGrade').value,
            keepStatOptions: _swalEl.querySelector('#keepStatOptions').value,
            rollQuality: Number.parseFloat(
              _swalEl.querySelector('#rollQuality').value,
            ),
            limitRolls: Number.parseInt(
              _swalEl.querySelector('#limitRolls').value,
              10,
            ),
            maxModPieces: Number.parseInt(
              _swalEl.querySelector('#maxModPieces').value,
              10,
            ),
            modSlots,
            slotModConfig,
            heroInfo,
          };
        }
        globalThis._modDataCollector = buildEditedHeroData;

        // ── Populate slot drag columns from a rule ────────────────────
        function populateSlotSortables(rule, slot) {
          const header = document.getElementById('ruleRightHeader');

          // Stats that physically cannot appear on this slot type
          // (includes the slot's fixed main stat — can never be a substat)
          const SLOT_IMPOSSIBLE = {
            Weapon: ['Attack', 'Defense', 'DefensePercent'],
            Helmet: ['Health'],
            Armor: ['Defense', 'Attack', 'AttackPercent'],
          };
          const slotImpossible = SLOT_IMPOSSIBLE[slot] || [];

          if (!rule) {
            const baseStats = stats.filter((s) => !slotImpossible.includes(s));
            document.getElementById('slotKeepContainer').innerHTML = '';
            document.getElementById('slotIgnoreContainer').innerHTML =
              buildStatDivs(baseStats, slot);
            document.getElementById('slotModifyContainer').innerHTML = '';
            if (header) {
              header.textContent = i18next.t(
                'Select a rule to edit its substats',
              );
            }
            return;
          }
          // Exclude the rule's main stat and slot-impossible stats
          const forbidden = new Set([
            ...(rule.mainStat ? [rule.mainStat] : []),
            ...slotImpossible,
          ]);
          const availableStats = stats.filter((s) => !forbidden.has(s));
          const keepList = (rule.keepStats || []).filter(
            (s) => !forbidden.has(s),
          );
          const discardList = (rule.discardStats || []).filter(
            (s) => !forbidden.has(s),
          );
          const ignoreList =
            rule.ignoreStats && rule.ignoreStats.length > 0
              ? rule.ignoreStats.filter((s) => !forbidden.has(s))
              : availableStats.filter(
                  (s) => !keepList.includes(s) && !discardList.includes(s),
                );
          document.getElementById('slotKeepContainer').innerHTML =
            buildStatDivs(keepList, slot);
          document.getElementById('slotIgnoreContainer').innerHTML =
            buildStatDivs(ignoreList, slot);
          document.getElementById('slotModifyContainer').innerHTML =
            buildStatDivs(discardList, slot);
          const mainLabel = rule.mainStat
            ? i18next.t(
                optimizerStatToDisplayStat[rule.mainStat] || rule.mainStat,
              )
            : i18next.t('Any');
          const setLabel = rule.set
            ? rule.set.replace('Set', ' set')
            : i18next.t('Any');
          if (header) {
            header.textContent = `${mainLabel} | ${setLabel}`;
          }
        }

        // ── Switch tab ────────────────────────────────────────────────
        function switchTab(newTab) {
          if (
            globalThis.modDialogActiveSlot &&
            globalThis.modDialogActiveRuleIdx >= 0
          ) {
            flushSlotSortables();
          }
          document
            .querySelectorAll('.modSlotTab')
            .forEach((btn) => btn.classList.remove('modSlotTabActive'));
          const tabBtn = document.getElementById(`modTab_${newTab}`);
          if (tabBtn) tabBtn.classList.add('modSlotTabActive');

          document
            .querySelectorAll('.modTabPanel')
            .forEach((p) => p.classList.add('modTabPanelHidden'));
          const panel = document.getElementById(`modTabPanel_${newTab}`);
          if (panel) panel.classList.remove('modTabPanelHidden');

          const globalDrag = document.getElementById('globalDragPanel');
          const slotDrag = document.getElementById('slotDragPanel');
          if (newTab === 'Global') {
            if (globalDrag) globalDrag.style.display = '';
            if (slotDrag) slotDrag.style.display = 'none';
            globalThis.modDialogActiveSlot = null;
            globalThis.modDialogActiveRuleIdx = -1;
          } else {
            if (globalDrag) globalDrag.style.display = 'none';
            if (slotDrag) slotDrag.style.display = '';
            globalThis.modDialogActiveSlot = newTab;
            globalThis.modDialogActiveRuleIdx = -1;
            populateSlotSortables(null, newTab);
            renderRuleList(newTab);
          }
        }

        // ── Scope all delegated events to the dialog container ───────
        // Using _swalEl instead of document prevents listener
        // accumulation when the dialog is opened multiple times.
        const _swalEl = Swal.getHtmlContainer();

        // ── Tab click handlers ────────────────────────────────────────
        _swalEl.querySelectorAll('.modSlotTab').forEach((btn) => {
          btn.addEventListener('click', () => switchTab(btn.dataset.tab));
        });

        // ── Render initial rule lists ─────────────────────────────────
        SLOTS.forEach((slot) => renderRuleList(slot));

        // ── Override checkbox handlers ────────────────────────────────
        _swalEl.querySelectorAll('.slotOverrideCheckbox').forEach((cb) => {
          cb.addEventListener('change', () => {
            const slot = cb.dataset.slot;
            const enabled = cb.checked;
            modSlotState[slot].override = enabled;
            const optSec = document.getElementById(
              `slotOptionsSection_${slot}`,
            );
            const ruleSec = document.getElementById(`slotRuleSection_${slot}`);
            if (optSec) optSec.classList.toggle('slotSectionDimmed', !enabled);
            if (ruleSec)
              ruleSec.classList.toggle('slotSectionDimmed', !enabled);
          });
        });

        // ── Rule row click → select / deselect rule ───────────────────
        _swalEl.addEventListener('click', (e) => {
          const ruleRow = e.target.closest('.ruleRow');
          if (!ruleRow) return;
          if (
            e.target.classList.contains('ruleDeleteBtn') ||
            e.target.classList.contains('ruleEnabledCb') ||
            e.target.tagName === 'SELECT'
          )
            return;
          const slot = ruleRow.dataset.slot;
          const idx = Number.parseInt(ruleRow.dataset.idx, 10);
          if (globalThis.modDialogActiveSlot !== slot) return;
          if (globalThis.modDialogActiveRuleIdx >= 0) flushSlotSortables();
          const rule = modSlotState[slot].rules[idx];
          if (!rule) return;
          if (globalThis.modDialogActiveRuleIdx === idx) {
            globalThis.modDialogActiveRuleIdx = -1;
            populateSlotSortables(null, slot);
          } else {
            globalThis.modDialogActiveRuleIdx = idx;
            populateSlotSortables(rule, slot);
          }
          renderRuleList(slot);
        });

        // ── Rule enabled toggle ───────────────────────────────────────
        _swalEl.addEventListener('change', (e) => {
          if (!e.target.classList.contains('ruleEnabledCb')) return;
          const slot = e.target.dataset.slot;
          const idx = Number.parseInt(e.target.dataset.idx, 10);
          if (modSlotState[slot]?.rules[idx]) {
            modSlotState[slot].rules[idx].enabled = e.target.checked;
          }
        });

        // ── Rule mainStat / set select changes ────────────────────────
        const _isActiveRule = (slot, idx) =>
          globalThis.modDialogActiveSlot === slot &&
          globalThis.modDialogActiveRuleIdx === idx;

        const _applyRuleSelectChange = (slot, idx, prop, value) => {
          if (modSlotState[slot]?.rules[idx]) {
            if (_isActiveRule(slot, idx)) flushSlotSortables();
            modSlotState[slot].rules[idx][prop] = value || null;
          }
          if (_isActiveRule(slot, idx)) {
            const r = modSlotState[slot].rules[idx];
            if (r) populateSlotSortables(r, slot);
          }
        };

        _swalEl.addEventListener('change', (e) => {
          const slot = e.target.dataset.slot;
          const idx = Number.parseInt(e.target.dataset.idx, 10);
          if (e.target.classList.contains('ruleMainStatSelect')) {
            _applyRuleSelectChange(slot, idx, 'mainStat', e.target.value);
          }
          if (e.target.classList.contains('ruleSetSelect')) {
            _applyRuleSelectChange(slot, idx, 'set', e.target.value);
          }
          if (e.target.classList.contains('rulePinStatSelect')) {
            if (modSlotState[slot]?.rules[idx]) {
              modSlotState[slot].rules[idx].pinnedTarget =
                e.target.value || null;
            }
          }
        });

        // ── Delete rule ───────────────────────────────────────────────
        _swalEl.addEventListener('click', (e) => {
          if (!e.target.classList.contains('ruleDeleteBtn')) return;
          const slot = e.target.dataset.slot;
          const idx = Number.parseInt(e.target.dataset.idx, 10);
          modSlotState[slot].rules.splice(idx, 1);
          if (globalThis.modDialogActiveSlot === slot) {
            if (globalThis.modDialogActiveRuleIdx === idx) {
              globalThis.modDialogActiveRuleIdx = -1;
              populateSlotSortables(null, slot);
            } else if (globalThis.modDialogActiveRuleIdx > idx) {
              globalThis.modDialogActiveRuleIdx--;
            }
          }
          renderRuleList(slot);
        });

        // ── Reset global substats to "Don't change" ───────────────────
        _swalEl.addEventListener('click', (e) => {
          if (!e.target.closest('#modResetBtn')) return;
          const keepEl = document.getElementById('keepContainer');
          const ignoreEl = document.getElementById('ignoreContainer');
          const modifyEl = document.getElementById('modifyContainer');
          while (keepEl?.firstChild) ignoreEl.appendChild(keepEl.firstChild);
          while (modifyEl?.firstChild)
            ignoreEl.appendChild(modifyEl.firstChild);
          updateModEstimate();
        });

        // ── Toggle All Slots ───────────────────────────────────────────
        _swalEl.addEventListener('click', (e) => {
          if (!e.target.closest('#toggleAllSlotsBtn')) return;
          const checkboxes = Array.from(
            _swalEl.querySelectorAll('.modSlotCheckbox'),
          );
          const allChecked = checkboxes.every((cb) => cb.checked);
          checkboxes.forEach((cb) => {
            cb.checked = !allChecked;
          });
          updateModEstimate();
        });

        // ── Save (saves without closing the dialog) ────────────────
        _swalEl.addEventListener('click', async (e) => {
          const btn = e.target.closest('#modSaveBtn');
          if (!btn) return;
          const data = buildEditedHeroData();
          btn.disabled = true;
          try {
            await Api.setModStats(data, hero.id);
            const origText = btn.innerHTML;
            btn.innerHTML = '✓ Saved!';
            setTimeout(() => {
              btn.innerHTML = origText;
              btn.disabled = false;
            }, 1500);
          } catch (err) {
            Log.error('Failed to save mod stats', err);
            btn.disabled = false;
          }
        });

        // ── Add rule ──────────────────────────────────────────────────
        _swalEl.addEventListener('click', (e) => {
          if (!e.target.classList.contains('addRuleBtn')) return;
          const slot = e.target.dataset.slot;
          const newRule = {
            mainStat: null,
            set: null,
            enabled: true,
            keepStats: [],
            ignoreStats: [],
            discardStats: [],
          };
          modSlotState[slot].rules.push(newRule);
          if (globalThis.modDialogActiveSlot === slot) {
            flushSlotSortables();
            globalThis.modDialogActiveRuleIdx =
              modSlotState[slot].rules.length - 1;
            populateSlotSortables(newRule, slot);
          }
          renderRuleList(slot);
        });

        // ── Generate rules from optimizer config ──────────────────────
        _swalEl.addEventListener('click', (e) => {
          if (!e.target.classList.contains('generateRulesBtn')) return;
          const slot = e.target.dataset.slot;
          const optReq = hero.optimizationRequest || {};
          const slotToField = {
            Necklace: 'inputNecklaceStat',
            Ring: 'inputRingStat',
            Boots: 'inputBootsStat',
          };
          const field = slotToField[slot];
          const mainStats =
            field && optReq[field] && optReq[field].length > 0
              ? optReq[field]
              : [null];
          const allSets = [
            ...new Set([
              ...(optReq.inputSetsOne || []),
              ...(optReq.inputSetsTwo || []),
              ...(optReq.inputSetsThree || []),
            ]),
          ];
          const sets = allSets.length > 0 ? allSets : [null];
          const existing = modSlotState[slot].rules;
          for (const mainStat of mainStats) {
            for (const set of sets) {
              const exists = existing.some(
                (r) =>
                  (r.mainStat || null) === (mainStat || null) &&
                  (r.set || null) === (set || null),
              );
              if (!exists) {
                existing.push({
                  mainStat: mainStat || null,
                  set: set || null,
                  enabled: true,
                  keepStats: [],
                  ignoreStats: [],
                  discardStats: [],
                });
              }
            }
          }
          renderRuleList(slot);
        });

        // ── Generate rules for ALL slots from optimizer config ─────────
        _swalEl.addEventListener('click', (e) => {
          if (!e.target.closest('#generateAllSlotsBtn')) return;
          const optReq = hero.optimizationRequest || {};
          const slotToField = {
            Necklace: 'inputNecklaceStat',
            Ring: 'inputRingStat',
            Boots: 'inputBootsStat',
          };
          const allSets = [
            ...new Set([
              ...(optReq.inputSetsOne || []),
              ...(optReq.inputSetsTwo || []),
              ...(optReq.inputSetsThree || []),
            ]),
          ];
          const sets = allSets.length > 0 ? allSets : [null];
          SLOTS.forEach((slot) => {
            // Enable override for this slot if not already active
            if (!modSlotState[slot].override) {
              modSlotState[slot].override = true;
              const cb = document.getElementById(`slotOverride_${slot}`);
              if (cb) cb.checked = true;
              const optSec = document.getElementById(
                `slotOptionsSection_${slot}`,
              );
              const ruleSec = document.getElementById(
                `slotRuleSection_${slot}`,
              );
              if (optSec) optSec.classList.remove('slotSectionDimmed');
              if (ruleSec) ruleSec.classList.remove('slotSectionDimmed');
            }
            const field = slotToField[slot];
            const mainStats =
              field && optReq[field] && optReq[field].length > 0
                ? optReq[field]
                : [null];
            const existing = modSlotState[slot].rules;
            const ruleExists = (ms, s) =>
              existing.some(
                (r) => (r.mainStat || null) === ms && (r.set || null) === s,
              );
            for (const mainStat of mainStats) {
              for (const set of sets) {
                const ms = mainStat || null;
                const s = set || null;
                if (!ruleExists(ms, s)) {
                  existing.push({
                    mainStat: ms,
                    set: s,
                    enabled: true,
                    keepStats: [],
                    ignoreStats: [],
                    discardStats: [],
                  });
                }
              }
            }
            renderRuleList(slot);
          });
        });

        // ── Copy slot config to another slot ──────────────────────────
        _swalEl.addEventListener('click', (e) => {
          // Show picker panel
          if (e.target.classList.contains('copySlotBtn')) {
            const slot = e.target.dataset.slot;
            _swalEl.querySelectorAll('.copySlotPicker').forEach((el) => {
              el.style.display = 'none';
            });
            const picker = document.getElementById(`copySlotPicker_${slot}`);
            if (picker) picker.style.display = 'flex';
            return;
          }
          // Dismiss picker
          if (e.target.classList.contains('copySlotCancel')) {
            const slot = e.target.dataset.slot;
            const picker = document.getElementById(`copySlotPicker_${slot}`);
            if (picker) picker.style.display = 'none';
            return;
          }
          // Execute copy
          if (e.target.classList.contains('copySlotTarget')) {
            flushSlotSortables();
            const fromSlot = e.target.dataset.from;
            const toSlot = e.target.dataset.to;
            const src = modSlotState[fromSlot];

            // Stats that are physically impossible for each slot type.
            // Must mirror the same table used in populateSlotSortables.
            const SLOT_IMPOSSIBLE = {
              Weapon: ['Attack', 'Defense', 'DefensePercent'],
              Helmet: ['Health'],
              Armor: ['Defense', 'Attack', 'AttackPercent'],
            };
            const impossibleFrom = new Set(SLOT_IMPOSSIBLE[fromSlot] || []);
            const impossibleTo = new Set(SLOT_IMPOSSIBLE[toSlot] || []);

            // Stats that were invisible in the source slot (so never in any
            // list) but ARE valid in the target slot → put them in ignore
            // (neutral) so they don't silently fall through.
            const freedStats = stats.filter(
              (s) => impossibleFrom.has(s) && !impossibleTo.has(s),
            );

            modSlotState[toSlot] = {
              override: src.override,
              limitRolls: src.limitRolls,
              modGrade: src.modGrade,
              rollQuality: src.rollQuality,
              keepStatOptions: src.keepStatOptions,
              rules: src.rules.map((r) => {
                const keepStats = (r.keepStats || []).filter(
                  (s) => !impossibleTo.has(s),
                );
                const discardStats = (r.discardStats || []).filter(
                  (s) => !impossibleTo.has(s),
                );
                const ignoreStats = [
                  ...(r.ignoreStats || []).filter((s) => !impossibleTo.has(s)),
                  // Add stats that were invisible in source but visible in target
                  ...freedStats.filter(
                    (s) => !keepStats.includes(s) && !discardStats.includes(s),
                  ),
                ];
                return {
                  ...r,
                  keepStats,
                  ignoreStats,
                  discardStats,
                };
              }),
            };
            // Sync override checkbox + section dimming
            const cb = document.getElementById(`slotOverride_${toSlot}`);
            if (cb) cb.checked = src.override;
            const optSec = document.getElementById(
              `slotOptionsSection_${toSlot}`,
            );
            const ruleSec = document.getElementById(
              `slotRuleSection_${toSlot}`,
            );
            if (optSec)
              optSec.classList.toggle('slotSectionDimmed', !src.override);
            if (ruleSec)
              ruleSec.classList.toggle('slotSectionDimmed', !src.override);
            // Sync option selects
            const setSelectVal = (id, val) => {
              const el = document.getElementById(id);
              if (el)
                el.value = val !== null && val !== undefined ? String(val) : '';
            };
            setSelectVal(`slotLimitRolls_${toSlot}`, src.limitRolls);
            setSelectVal(`slotModGrade_${toSlot}`, src.modGrade);
            setSelectVal(`slotRollQuality_${toSlot}`, src.rollQuality);
            setSelectVal(`slotKeepStatOptions_${toSlot}`, src.keepStatOptions);
            renderRuleList(toSlot);
            // Brief feedback
            const origText = e.target.textContent;
            e.target.textContent = '✓';
            e.target.disabled = true;
            setTimeout(() => {
              e.target.textContent = origText;
              e.target.disabled = false;
            }, 1000);
          }
        });

        // ── Presets ───────────────────────────────────────────
        (() => {
          const PRESETS_KEY = 'modDialogPresets';
          const getStore = () => {
            try {
              return JSON.parse(localStorage.getItem(PRESETS_KEY) || '{}');
            } catch {
              return {};
            }
          };
          const putStore = (obj) =>
            localStorage.setItem(PRESETS_KEY, JSON.stringify(obj));

          // All sets — matches enums.js setEnum values
          const ALL_SETS = [
            { value: '', label: i18next.t('Any set') },
            { value: 'HealthSet', label: 'Health' },
            { value: 'DefenseSet', label: 'Defense' },
            { value: 'AttackSet', label: 'Attack' },
            { value: 'SpeedSet', label: 'Speed' },
            { value: 'CriticalSet', label: 'Critical' },
            { value: 'HitSet', label: 'Hit' },
            { value: 'DestructionSet', label: 'Destruction' },
            { value: 'LifestealSet', label: 'Lifesteal' },
            { value: 'CounterSet', label: 'Counter' },
            { value: 'ResistSet', label: 'Resist' },
            { value: 'UnitySet', label: 'Unity' },
            { value: 'RageSet', label: 'Rage' },
            { value: 'ImmunitySet', label: 'Immunity' },
            { value: 'PenetrationSet', label: 'Penetration' },
            { value: 'RevengeSet', label: 'Revenge' },
            { value: 'InjurySet', label: 'Injury' },
            { value: 'ProtectionSet', label: 'Protection' },
            { value: 'TorrentSet', label: 'Torrent' },
            { value: 'ReversalSet', label: 'Reversal' },
            { value: 'RiposteSet', label: 'Riposte' },
            { value: 'WarfareSet', label: 'Warfare' },
            { value: 'PursuitSet', label: 'Pursuit' },
            { value: 'FervorSet', label: 'Fervor' },
            { value: 'WeakeningSet', label: 'Weakening' },
          ];

          // Helpers
          const getGlobalSubstats = () => ({
            keepStats: globalThis.keepGroup
              .toArray()
              .filter((x) => stats.includes(x)),
            ignoreStats: globalThis.ignoreGroup
              .toArray()
              .filter((x) => stats.includes(x)),
            discardStats: globalThis.modifyGroup
              .toArray()
              .filter((x) => stats.includes(x)),
          });

          const refreshPresetSelect = () => {
            const sel = document.getElementById('presetSelect');
            if (!sel) return;
            const names = Object.keys(getStore()).sort((a, b) =>
              a.localeCompare(b),
            );
            sel.innerHTML =
              `<option value="">${i18next.t('\u2014 select preset \u2014')}</option>` +
              names.map((n) => `<option value="${n}">${n}</option>`).join('');
          };

          const initApplySetSelect = () => {
            const sel = document.getElementById('presetApplySetSelect');
            if (!sel) return;
            sel.innerHTML = ALL_SETS.map(
              (o) => `<option value="${o.value}">${o.label}</option>`,
            ).join('');
          };

          refreshPresetSelect();
          initApplySetSelect();

          // Save-preset logic in a named function so both Enter-key and
          // button-click paths call it directly without any synthetic .click()
          // call that could create a bubbling click Swal2 might intercept.
          const saveCurrentPreset = () => {
            const nameEl = document.getElementById('modDialogPresetNameInput');
            const name = nameEl?.value.trim();
            if (!name) {
              nameEl?.focus();
              return;
            }
            const store = getStore();
            store[name] = getGlobalSubstats();
            putStore(store);
            refreshPresetSelect();
            const sel = document.getElementById('presetSelect');
            if (sel) sel.value = name;
            const btn = document.getElementById('presetSaveBtn');
            if (btn) {
              const orig = btn.innerHTML;
              btn.innerHTML = '\u2713 Saved!';
              setTimeout(() => {
                btn.innerHTML = orig;
              }, 1200);
            }
            // Keep focus in the name input — prevents aria-hidden error
            // that occurs when focus drifts while the popup is closing.
            nameEl?.focus();
          };

          // Enter in the name input: call saveCurrentPreset directly.
          // stopPropagation stops the keydown from reaching Swal's popup-
          // level keydown handler; stopImmediatePropagation stops any other
          // listener on this element; preventDefault stops the browser from
          // natively clicking any focused button.
          document
            .getElementById('modDialogPresetNameInput')
            ?.addEventListener('keydown', (e) => {
              if (e.key === 'Enter') {
                e.stopPropagation();
                e.stopImmediatePropagation();
                e.preventDefault();
                saveCurrentPreset();
              }
            });

          // Save preset button: stopPropagation prevents the click from
          // bubbling up to Swal2's popup/container click handlers.
          document
            .getElementById('presetSaveBtn')
            ?.addEventListener('click', (e) => {
              e.stopPropagation();
              e.preventDefault();
              saveCurrentPreset();
            });

          // Delete preset
          document
            .getElementById('presetDeleteBtn')
            ?.addEventListener('click', (e) => {
              e.stopPropagation();
              e.preventDefault();
              const sel = document.getElementById('presetSelect');
              const name = sel?.value;
              if (!name) return;
              const store = getStore();
              delete store[name];
              putStore(store);
              refreshPresetSelect();
              const nameEl = document.getElementById(
                'modDialogPresetNameInput',
              );
              if (nameEl && nameEl.value === name) nameEl.value = '';
            });

          // Load preset → restore Global sortable lists
          document
            .getElementById('presetLoadBtn')
            ?.addEventListener('click', (e) => {
              e.stopPropagation();
              e.preventDefault();
              const sel = document.getElementById('presetSelect');
              const name = sel?.value;
              if (!name) return;
              const preset = getStore()[name];
              if (!preset) return;
              const keepSet = new Set(preset.keepStats || []);
              const discardSet = new Set(preset.discardStats || []);
              const ignoreSet = new Set(preset.ignoreStats || []);
              const keepList = stats.filter((s) => keepSet.has(s));
              const discardList = stats.filter((s) => discardSet.has(s));
              // anything not explicitly in keep or discard falls into ignore
              const ignoreList = stats.filter(
                (s) =>
                  ignoreSet.has(s) || (!keepSet.has(s) && !discardSet.has(s)),
              );
              document.getElementById('keepContainer').innerHTML =
                buildStatDivs(keepList);
              document.getElementById('ignoreContainer').innerHTML =
                buildStatDivs(ignoreList);
              document.getElementById('modifyContainer').innerHTML =
                buildStatDivs(discardList);
              const nameEl = document.getElementById(
                'modDialogPresetNameInput',
              );
              if (nameEl) nameEl.value = name;
            });

          // Apply current Global substats to all matching slot rules
          document
            .getElementById('presetApplyBtn')
            ?.addEventListener('click', (e) => {
              e.stopPropagation();
              e.preventDefault();
              const targetSet =
                document.getElementById('presetApplySetSelect')?.value || '';
              const substats = getGlobalSubstats();
              const SLOT_IMPOSSIBLE = {
                Weapon: new Set(['Attack', 'Defense', 'DefensePercent']),
                Helmet: new Set(['Health']),
                Armor: new Set(['Defense', 'Attack', 'AttackPercent']),
              };
              let count = 0;
              SLOTS.forEach((slot) => {
                const impossible = SLOT_IMPOSSIBLE[slot] || new Set();
                (modSlotState[slot]?.rules || []).forEach((rule) => {
                  if (targetSet && (rule.set || '') !== targetSet) return;
                  rule.keepStats = substats.keepStats.filter(
                    (s) => !impossible.has(s),
                  );
                  rule.ignoreStats = substats.ignoreStats.filter(
                    (s) => !impossible.has(s),
                  );
                  rule.discardStats = substats.discardStats.filter(
                    (s) => !impossible.has(s),
                  );
                  count++;
                });
                renderRuleList(slot);
              });
              const btn = document.getElementById('presetApplyBtn');
              if (btn) {
                const orig = btn.innerHTML;
                btn.innerHTML = `\u2713 ${count} rule${count === 1 ? '' : 's'}`;
                setTimeout(() => {
                  btn.innerHTML = orig;
                }, 1500);
              }
            });
        })();

        tippy('#limitRollsLabel', {
          placement: 'top',
          content: `<p>${i18next.t(
            "Choose the maximum number of rolls to replace. For example, limit rolls = 1 would only replace base stats that didn't get enhanced. It is generally not a good idea to replace more than 2 rolls, and the higher this number is, the more permutations will be generated.",
          )}</p>`,
        });
        tippy('#limitRolls', {
          placement: 'top',
          content: `<p>${i18next.t(
            "Choose the maximum number of rolls to replace. For example, limit rolls = 1 would only replace base stats that didn't get enhanced. It is generally not a good idea to replace more than 2 rolls, and the higher this number is, the more permutations will be generated.",
          )}</p>`,
        });

        tippy('#modGradeLabel', {
          placement: 'top',
          content: `<p>${i18next.t(
            'Choose whether to use Greater or Lesser gem stats.',
          )}</p>`,
        });
        tippy('#modGrade', {
          placement: 'top',
          content: `<p>${i18next.t(
            'Choose whether to use Greater or Lesser gem stats.',
          )}</p>`,
        });

        tippy('#rollQualityLabel', {
          placement: 'top',
          content: `<p>${i18next.t(
            "Choose the modified substat's roll value, from min roll to max roll. The actual value ingame will be random. Values will be rounded to the nearest whole number.",
          )}</p>`,
        });
        tippy('#rollQuality', {
          placement: 'top',
          content: `<p>${i18next.t(
            "Choose the modified substat's roll value, from min roll to max roll. The actual value ingame will be random. Values will be rounded to the nearest whole number.",
          )}</p>`,
        });

        tippy('#keepStatsLabel', {
          placement: 'top',
          content: `<p>${i18next.t(
            'Choose whether wanted stats should be allowed to be replaced with wanted stats when optimizing. For example, when allowed, a min speed roll could be replaced by a max speed roll. When not allowed, the speed will be left unmodified.',
          )}</p>`,
        });
        tippy('#keepStatOptions', {
          placement: 'top',
          content: `<p>${i18next.t(
            'Choose whether wanted stats should be allowed to be replaced with wanted stats when optimizing. For example, when allowed, a min speed roll could be replaced by a max speed roll. When not allowed, the speed will be left unmodified.',
          )}</p>`,
        });

        tippy('#maxModPiecesLabel', {
          placement: 'top',
          content: `<p>${i18next.t(
            'Limit the number of gear pieces that can be modded in a single build. Lower values reduce the number of valid build combinations and can speed up optimization.',
          )}</p>`,
        });
        tippy('#maxModPieces', {
          placement: 'top',
          content: `<p>${i18next.t(
            'Limit the number of gear pieces that can be modded in a single build. Lower values reduce the number of valid build combinations and can speed up optimization.',
          )}</p>`,
        });

        tippy('#modSlotsLabel', {
          placement: 'top',
          content: `<p>${i18next.t(
            'Choose which gear slots can have substats modified. Unchecked slots will never have mod variants generated, reducing the number of permutations.',
          )}</p>`,
        });
        tippy('#modSlotToggleRow', {
          placement: 'top',
          content: `<p>${i18next.t(
            'Choose which gear slots can have substats modified. Unchecked slots will never have mod variants generated, reducing the number of permutations.',
          )}</p>`,
        });

        tippy('#keepGroup', {
          placement: 'top',
          delay: [500, null],
          content: `<p>${i18next.t(
            'Choose the substats that you want to modify for. Substats in the unwanted column will be replaced by substats in wanted column.',
          )}</p>`,
        });

        tippy('#ignoreGroup', {
          placement: 'top',
          delay: [500, null],
          content: `<p>${i18next.t(
            'Choose the substats to not modify. Substats in this column will not get replaced, and will also not be selected for.',
          )}</p>`,
        });

        tippy('#modifyGroup', {
          placement: 'top',
          delay: [500, null],
          content: `<p>${i18next.t(
            'Choose the substats that you want to discard when modifying. Substats in the unwanted column will be replaced by substats in wanted column.',
          )}</p>`,
        });

        // ── Phase 3: live permutation count estimate ──────────────────────
        const slotBlockedForEstimate = {
          Weapon: ['Defense', 'DefensePercent'],
          Armor: ['Attack', 'AttackPercent'],
        };
        const { items: modEstimateItems } = await Api.getAllItems();

        updateModEstimate = () => {
          const display = document.getElementById('modEstimateDisplay');
          if (!display) return;

          const limitRolls = Number.parseInt(
            document.getElementById('limitRolls').value,
            10,
          );
          const keepStatOpts = document.getElementById('keepStatOptions').value;
          const enabledSlots = new Set(
            Array.from(
              _swalEl.querySelectorAll('.modSlotCheckbox:checked'),
            ).map((cb) => cb.value),
          );

          const keepList = (
            globalThis.keepGroup ? global.keepGroup.toArray() : []
          ).filter((x) => stats.includes(x));
          const discardList = new Set(
            (global.modifyGroup ? global.modifyGroup.toArray() : []).filter(
              (x) => stats.includes(x),
            ),
          );

          if (keepList.length === 0) {
            display.textContent = '';
            display.className = 'modEstimateDisplay';
            return;
          }

          let estimate = 0;
          for (const item of modEstimateItems) {
            if (item.enhance !== 15) continue;
            if (item.disableMods) continue;
            if (!enabledSlots.has(item.gear)) continue;

            const blocked = slotBlockedForEstimate[item.gear] || [];
            const effectiveKeepLen = keepList.filter(
              (s) => !blocked.includes(s),
            ).length;
            if (effectiveKeepLen === 0) continue;

            const substats = item.substats || [];
            let candidates = 0;
            for (const sub of substats) {
              const rolls = sub.rolls || 0;
              if (rolls > limitRolls) continue;
              const isDiscard = discardList.has(sub.type);
              const isKeep =
                keepList.includes(sub.type) && keepStatOpts === 'replace';
              if (isDiscard || isKeep) candidates++;
            }
            estimate += candidates * effectiveKeepLen;
          }

          let className = 'modEstimateDisplay modEstimateGreen';
          let text = `Estimated variants: ~${estimate.toLocaleString()}`;
          if (estimate > 10000) {
            className = 'modEstimateDisplay modEstimateRed';
            text += ' \u2014 This may significantly slow optimization';
          } else if (estimate > 2000) {
            className = 'modEstimateDisplay modEstimateYellow';
          }
          display.textContent = text;
          display.className = className;
        };

        document
          .getElementById('limitRolls')
          .addEventListener('change', updateModEstimate);
        document
          .getElementById('keepStatOptions')
          .addEventListener('change', updateModEstimate);
        _swalEl
          .querySelectorAll('.modSlotCheckbox')
          .forEach((cb) => cb.addEventListener('change', updateModEstimate));

        updateModEstimate();
      },
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: i18next.t('OK'),
      cancelButtonText: i18next.t('Cancel'),
      preConfirm: async () => {
        Log.trace(
          '[preConfirm] triggered — call stack above shows what fired confirm',
        );
        // If the Save button pre-collected the data, use it directly.
        if (global._preCollectedModData) {
          const data = global._preCollectedModData;
          global._preCollectedModData = null;
          return data;
        }
        // Fallback: collect via the shared builder (OK button path).
        return global._modDataCollector ? global._modDataCollector() : null;
      },
    });
    return formValues;
  },

  editBuildDialog: async (name) => {
    const { value: formValues } = await Swal.fire({
      title: '',
      html: `
                    <div class="editGearForm">
                        <link href="https://cdn.jsdelivr.net/npm/@sweetalert2/themes@4.0.1/minimal/minimal.min.css" rel="stylesheet">

                        <p style="color: var(--font-color)">${i18next.t(
                          'Build name',
                        )}</p>
                        <input type="text" class="bonusStatInput" id="editBuildName" value="${
                          name || ''
                        }" autofocus="autofocus" onfocus="this.select()" style="width:200px !important">
                    </div>
                `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: i18next.t('OK'),
      cancelButtonText: i18next.t('Cancel'),
      preConfirm: async () => {
        const buildInfo = {
          buildName: document.getElementById('editBuildName').value,
        };

        return buildInfo;
      },
    });
    return formValues;
  },

  editRankDialog: async (defaultRank) => {
    const { value: formValues } = await Swal.fire({
      title: '',
      html: `
                    <div class="editGearForm">
                        <link href="https://cdn.jsdelivr.net/npm/@sweetalert2/themes@4.0.1/minimal/minimal.min.css" rel="stylesheet">

                        <p style="color: var(--font-color)">${i18next.t(
                          'Rank #',
                        )}</p>
                        <input type="number" class="bonusStatInput" id="editRank" value="${defaultRank ?? ''}" autofocus="autofocus" onfocus="this.select()" style="width:100px !important">
                    </div>
                `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: i18next.t('OK'),
      cancelButtonText: i18next.t('Cancel'),
      preConfirm: async () => {
        const rankInfo = {
          rank: document.getElementById('editRank').value,
        };

        return rankInfo;
      },
    });
    return formValues;
  },

  changeEditGearMainStat: () => {
    const gear = $('#editGearType').val();

    if (gear === 'Weapon') {
      $('#editGearMainStatType').val('Attack');
    }
    if (gear === 'Helmet') {
      $('#editGearMainStatType').val('Health');
    }
    if (gear === 'Armor') {
      $('#editGearMainStatType').val('Defense');
    }
  },

  editGearDialog: async (item, edit, useReforgedStats) => {
    if (!item) {
      item = {
        main: {},
        substats: [],
      };
    }
    ItemAugmenter.augment([item]);
    if (useReforgedStats && Reforge.isReforgeableNow(item)) {
      item = structuredClone(item);
      item.level = 90;
      item.main.value = item.main.reforgedValue;

      for (const substat of item.substats) {
        substat.value = substat.reforgedValue;
      }
    }

    const getAllHeroesResponse = await Api.getAllHeroes();
    const { heroes } = getAllHeroesResponse;

    // Pre-compute archetype scores so right panel can show them alongside mod targets
    const _itemScore = globalThis.GearScorer?.scoreItem(item) ?? null;
    // Which sub (0-3) is already modified on this piece (-1 = none)
    const _modAnyIdx = item.substats.findIndex((s) => s?.modified);

    const { value: formValues } = await Swal.fire({
      title: '',
      width: 1050,
      customClass: { htmlContainer: 'editGearSwalHtml' },
      html: `
                    <div class="editGearDialogLayout" style="display:flex;flex-direction:row;align-items:flex-start;width:100%;text-align:left;">
                    <div class="editGearLeft" style="flex:0 0 460px;min-width:0;"><div class="editGearForm">
                        <link href="https://cdn.jsdelivr.net/npm/@sweetalert2/themes@4.0.1/minimal/minimal.min.css" rel="stylesheet">

                        <div class="editGearFormRow">
                            <div class="editGearStatLabel" data-t>${i18next.t(
                              'Equipped',
                            )}</div>
                            <select id="editGearEquipped" class="editGearStatSelect">
                                ${getEquippedHtml(item, heroes)}
                            </select>
                        </div>

                        <div class="editGearFormRow">
                            <div class="editGearStatLabel" data-t>${i18next.t(
                              'Type',
                            )}</div>
                            <select id="editGearType" class="editGearStatSelect" onchange="Dialog.changeEditGearMainStat()">
                                ${getGearTypeOptionsHtml(item)}
                            </select>
                        </div>

                        <div class="editGearFormRow">
                            <div class="editGearStatLabel" data-t>${i18next.t(
                              'Set',
                            )}</div>
                            <select id="editGearSet" class="editGearStatSelect">
                                ${getGearSetOptionsHtml(item)}
                            </select>
                        </div>

                        <div class="editGearFormRow">
                            <div class="editGearStatLabel" data-t>${i18next.t(
                              'Reforge',
                            )}</div>
                            <select id="editGearMaterial" class="editGearStatSelect">
                                ${getGearMaterialOptionsHtml(item)}
                            </select>
                        </div>

                        <div class="editGearFormRow">
                            <div class="editGearStatLabel" data-t>${i18next.t(
                              'Rank',
                            )}</div>
                            <select id="editGearRank" class="editGearStatSelect">
                                ${getGearRankOptionsHtml(item)}
                            </select>
                        </div>

                        <div class="editGearFormRow">
                            <div class="editGearStatLabel" data-t>${i18next.t(
                              'Level',
                            )}</div>
                            <input type="number" class="editGearStatNumber" id="editGearLevel" value="${
                              item.level
                            }">
                        </div>

                        <div class="editGearFormRow">
                            <div class="editGearStatLabel" data-t>${i18next.t(
                              'Enhance',
                            )}</div>
                            <input type="number" class="editGearStatNumber" id="editGearEnhance" value="${
                              item.enhance
                            }">
                        </div>

                        <div class="editGearFormRow">
                            <div class="editGearStatLabel" data-t>${i18next.t(
                              'Locked',
                            )}</div>
                            <input type="checkbox" id="editGearLocked" ${
                              item.locked ? 'checked' : ''
                            }>
                        </div>

                        <div class="editGearFormRow">
                            <div class="editGearStatLabel" data-t>${i18next.t(
                              'Disable mods',
                            )}</div>
                            <input type="checkbox" id="editGearDisableMods" ${
                              item.disableMods ? 'checked' : ''
                            }>
                        </div>

                        </br>

                        <div class="editGearFormRow">
                            <div class="editGearStatLabel" data-t>${i18next.t(
                              'Main Stat',
                            )}</div>
                            <select id="editGearMainStatType" class="editGearStatSelect">
                                ${getStatOptionsHtml(item.main)}
                            </select>
                            <input type="number" class="editGearStatNumber" id="editGearMainStatValue" value="${
                              item.main.value
                            }">
                            <img class="editGearCycle" src=${Assets.getCycle()}></img>
                        </div>

                        <div style="display:flex;gap:6px;margin:4px 0 2px 0;align-items:center;">
                          <span style="font-size:10px;opacity:0.45;flex-shrink:0;">Targets:</span>
                          <button type="button" id="autoConfigPinTargets" style="font-size:10px;padding:2px 9px;border-radius:10px;border:1px solid rgba(76,175,80,0.4);background:rgba(76,175,80,0.08);color:#4caf50;cursor:pointer;letter-spacing:.05em;" title="Auto-fill mod target checkboxes from archetype hints">Auto Config</button>
                          <button type="button" id="resetPinTargets" style="font-size:10px;padding:2px 9px;border-radius:10px;border:1px solid rgba(255,255,255,0.15);background:rgba(255,255,255,0.05);color:rgba(255,255,255,0.38);cursor:pointer;letter-spacing:.05em;" title="Clear all mod target restrictions">Reset Targets</button>
                        </div>
                        ${_buildSubstatRow(item, 0, _modAnyIdx)}
                        ${_buildSubstatRow(item, 1, _modAnyIdx)}
                        ${_buildSubstatRow(item, 2, _modAnyIdx)}
                        ${_buildSubstatRow(item, 3, _modAnyIdx)}
                    </div></div>
                    <div class="editGearDialogDivider" style="width:1px;background:rgba(255,255,255,0.12);align-self:stretch;margin:0 14px;flex-shrink:0;"></div>
                    <div class="editGearRight" style="flex:1 1 0;min-width:0;max-height:560px;overflow-y:auto;padding-right:4px;">
                        ${buildModTargetsPanel(item, _itemScore)}
                    </div>
                    </div>
                `,
      didOpen: async () => {
        const options = {
          filter: true,
          filterAcceptOnEnter: true,
          maxHeight: 250,
        };

        $('#editGearEquipped').multipleSelect(options);

        const checkboxes = ['#subMod1', '#subMod2', '#subMod3', '#subMod4'];

        for (const checkbox of checkboxes) {
          $(checkbox).change(function onCheckboxChange() {
            for (const toUncheck of checkboxes) {
              if (!toUncheck.includes(this.id)) {
                $(toUncheck).prop('checked', false);
              }
            }
          });
        }

        // MOD / TARGET toggle button helpers
        const MOD_ON_CSS =
          'font-size:10px;font-weight:700;padding:2px 8px;border-radius:10px;border:1px solid #e6a817;background:rgba(230,168,23,0.2);color:#e6a817;letter-spacing:.05em;cursor:pointer;flex-shrink:0;';
        const MOD_OFF_CSS =
          'font-size:10px;font-weight:700;padding:2px 8px;border-radius:10px;border:1px solid rgba(255,255,255,0.15);background:rgba(255,255,255,0.04);color:rgba(255,255,255,0.28);letter-spacing:.05em;cursor:pointer;flex-shrink:0;';
        const TGT_ON_CSS =
          'font-size:10px;font-weight:700;padding:2px 8px;border-radius:10px;border:1px solid #4caf50;background:rgba(76,175,80,0.18);color:#4caf50;letter-spacing:.05em;cursor:pointer;flex-shrink:0;';
        const TGT_OFF_CSS =
          'font-size:10px;font-weight:700;padding:2px 8px;border-radius:10px;border:1px solid rgba(255,255,255,0.15);background:rgba(255,255,255,0.04);color:rgba(255,255,255,0.28);letter-spacing:.05em;cursor:pointer;flex-shrink:0;';

        function _refreshBigBlock(idx) {
          const modBtn = document.getElementById(`modToggle${idx}`);
          const tgtBtn = document.getElementById(`targetToggle${idx}`);
          const block = document.getElementById(`bigModBlock${idx}`);
          if (!block || !modBtn) return;
          const modOn = modBtn.dataset.on === 'true';
          const targetOn = tgtBtn?.dataset.on === 'true';
          block.style.opacity = modOn ? '1' : '0.38';
          block.style.borderColor =
            modOn && targetOn
              ? '#4caf50'
              : modOn
                ? 'rgba(255,255,255,0.2)'
                : 'rgba(255,255,255,0.08)';
          block.querySelectorAll('.modTargetCb').forEach((cb) => {
            if (!cb.disabled || !cb.dataset.inv) cb.disabled = !modOn;
          });
          const hint = block.querySelector('.bigModHint');
          if (hint)
            hint.textContent = targetOn
              ? 'restricting targets'
              : modOn
                ? 'any target allowed'
                : '';
        }

        function setModOn(idx, on, force = false) {
          const btn = document.getElementById(`modToggle${idx}`);
          if (!btn || (!force && btn.disabled)) return;
          btn.dataset.on = String(on);
          btn.style.cssText = on ? MOD_ON_CSS : MOD_OFF_CSS;
          const cb = document.getElementById(`pinMod${idx}`);
          if (cb) cb.checked = on;
          _refreshBigBlock(idx);
        }
        function setTargetOn(idx, on) {
          const btn = document.getElementById(`targetToggle${idx}`);
          if (!btn || btn.disabled) return;
          btn.dataset.on = String(on);
          btn.style.cssText = on ? TGT_ON_CSS : TGT_OFF_CSS;
          _refreshBigBlock(idx);
        }

        document.querySelectorAll('.editModToggle').forEach((btn) => {
          btn.addEventListener('click', function () {
            const idx = parseInt(this.dataset.idx);
            const nowOn = this.dataset.on !== 'true';
            setModOn(idx, nowOn);
            if (!nowOn) setTargetOn(idx, false); // MOD off → TARGET also off
          });
        });

        document.querySelectorAll('.editTargetToggle').forEach((btn) => {
          btn.addEventListener('click', function () {
            const idx = parseInt(this.dataset.idx);
            const nowOn = this.dataset.on !== 'true';
            setTargetOn(idx, nowOn);
            if (nowOn) setModOn(idx, true); // TARGET on → MOD auto-on
          });
        });

        // ── Auto Config / Reset Targets buttons ───────────────────────────
        const _acTypeFromLbl = Object.fromEntries(
          MOD_TARGET_STATS.map((s) => [s.label, s.type]),
        );
        const _acLabelFromType = Object.fromEntries(
          MOD_TARGET_STATS.map((s) => [s.type, s.label]),
        );

        document
          .getElementById('autoConfigPinTargets')
          ?.addEventListener('click', () => {
            if (!_itemScore) return;

            // ── Parse regular-archetype hints (positive gain only) ───────────
            const hintsByFrom = {};
            for (const result of [_itemScore.official, _itemScore.unofficial]) {
              if (!result) continue;
              for (const [arch, hint] of Object.entries(result.modHint ?? {})) {
                if (!hint) continue;
                const diff =
                  (result.modGS?.[arch] ?? 0) - (result.nonModGS?.[arch] ?? 0);
                if (diff <= 0) continue;
                for (const line of hint.split('\n')) {
                  const trimmed = line.trim();
                  if (!trimmed) continue;
                  const arrowIdx = trimmed.indexOf('→');
                  if (arrowIdx < 0) continue;
                  const fromLbl = trimmed.slice(0, arrowIdx).trim();
                  const toRaw = trimmed.slice(arrowIdx + 1).trim();
                  const pipeIdx = toRaw.indexOf('|');
                  const toLbl = (
                    pipeIdx >= 0 ? toRaw.slice(0, pipeIdx) : toRaw
                  ).trim();
                  const toType = _acTypeFromLbl[toLbl];
                  if (!toType) continue;
                  if (!hintsByFrom[fromLbl]) hintsByFrom[fromLbl] = new Set();
                  hintsByFrom[fromLbl].add(toType);
                }
              }
            }

            if (Object.keys(hintsByFrom).length > 0) {
              // ── Regular archetype mode ──────────────────────────────────
              // Hint slots: MOD ON + all valid targets. Non-hint: MOD OFF.
              for (let i = 0; i < 4; i++) {
                const sub = item.substats[i];
                if (!sub?.type || sub.type === 'None') continue;
                const idx = i + 1;
                const fromLbl = _acLabelFromType[sub.type];
                const targets = fromLbl
                  ? [...(hintsByFrom[fromLbl] ?? [])]
                  : [];
                if (targets.length > 0) {
                  // Clear existing checks + reset label highlight
                  document
                    .querySelectorAll(`.modTargetCb[data-idx="${idx}"]`)
                    .forEach((cb) => {
                      cb.checked = false;
                      const lbl = cb.closest('label');
                      if (lbl) {
                        lbl.style.background = '';
                        lbl.style.border = '1px solid transparent';
                      }
                    });
                  targets.forEach((toType) => {
                    const cb = document.getElementById(
                      `bigModCb_${idx}_${toType}`,
                    );
                    if (cb && !cb.disabled) {
                      cb.checked = true;
                      const lbl = cb.closest('label');
                      if (lbl) {
                        lbl.style.background = 'rgba(76,175,80,0.15)';
                        lbl.style.border = '1px solid rgba(76,175,80,0.35)';
                      }
                    }
                  });
                  setTargetOn(idx, true);
                } else {
                  document
                    .querySelectorAll(`.modTargetCb[data-idx="${idx}"]`)
                    .forEach((cb) => {
                      cb.checked = false;
                    });
                  setTargetOn(idx, false);
                  setModOn(idx, false, true);
                }
              }
              return;
            }

            // ── Potential archetype mode ────────────────────────────────────
            // Focus stat (Speed, HP%, Atk%, etc.) is valuable — DISABLE it.
            // All other substats are ON so they can be freely replaced.
            const potentialArchs =
              globalThis.GearScorer?.POTENTIAL_ARCHETYPES ?? new Set();
            const focusStatByArch = {
              'Top Speed': new Set(['Speed']),
              'HP Focus': new Set(['HealthPercent', 'Health']),
              'Attack Focus': new Set(['AttackPercent', 'Attack']),
              'Effectiveness Focus': new Set(['EffectivenessPercent']),
              'Effect Resist Focus': new Set(['EffectResistancePercent']),
              'Crit Chance Focus': new Set(['CriticalHitChancePercent']),
            };
            const activeFocusStats = new Set();
            for (const result of [_itemScore.official, _itemScore.unofficial]) {
              if (!result) continue;
              for (const [arch, gs] of Object.entries(result.nonModGS ?? {})) {
                if (!potentialArchs.has(arch) || !(gs > 0)) continue;
                const stats = focusStatByArch[arch];
                if (stats) stats.forEach((s) => activeFocusStats.add(s));
              }
            }
            if (activeFocusStats.size === 0) {
              // No regular-archetype hints and no potential archetypes.
              // If the already-modified substat has no re-mod improvement listed for any
              // archetype, disable only that substat's mod toggle — leaving other substats
              // untouched (modificationFilter already blocks them from being re-modded).
              for (let i = 0; i < 4; i++) {
                const sub = item.substats[i];
                if (!sub?.type || sub.type === 'None' || !sub.modified)
                  continue;
                const idx = i + 1;
                document
                  .querySelectorAll(`.modTargetCb[data-idx="${idx}"]`)
                  .forEach((cb) => {
                    cb.checked = false;
                  });
                setTargetOn(idx, false);
                setModOn(idx, false, true);
              }
              return;
            }

            for (let i = 0; i < 4; i++) {
              const sub = item.substats[i];
              if (!sub?.type || sub.type === 'None') continue;
              const idx = i + 1;
              if (activeFocusStats.has(sub.type)) {
                // Focus stat: MOD OFF (protect it — don't mod it away)
                document
                  .querySelectorAll(`.modTargetCb[data-idx="${idx}"]`)
                  .forEach((cb) => {
                    cb.checked = false;
                  });
                setTargetOn(idx, false);
                setModOn(idx, false, true);
              } else {
                // Non-focus: MOD ON, any target allowed (no TARGET restriction)
                setModOn(idx, true);
                document
                  .querySelectorAll(`.modTargetCb[data-idx="${idx}"]`)
                  .forEach((cb) => {
                    cb.checked = false;
                  });
                setTargetOn(idx, false);
              }
            }
          });

        document
          .getElementById('resetPinTargets')
          ?.addEventListener('click', () => {
            for (let idx = 1; idx <= 4; idx++) {
              document
                .querySelectorAll(`.modTargetCb[data-idx="${idx}"]`)
                .forEach((cb) => {
                  cb.checked = false;
                });
              setTargetOn(idx, false);
            }
          });
      },
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: i18next.t('OK'),
      cancelButtonText: i18next.t('Cancel'),
      preConfirm: async () => {
        const editedItem = {
          rank: document.getElementById('editGearRank').value,
          set: document.getElementById('editGearSet').value,
          gear: document.getElementById('editGearType').value,
          material: document.getElementById('editGearMaterial').value,
          main: {
            type: document.getElementById('editGearMainStatType').value,
            value: parseInt(
              document.getElementById('editGearMainStatValue').value,
              10,
            ),
          },
          name: item.name,
          enhance:
            parseInt(document.getElementById('editGearEnhance').value, 10) || 0,
          level:
            parseInt(document.getElementById('editGearLevel').value, 10) || 0,
          locked: document.getElementById('editGearLocked').checked,
          disableMods: document.getElementById('editGearDisableMods').checked,
        };

        if (
          !editedItem.rank ||
          editedItem.rank === 'None' ||
          !editedItem.set ||
          editedItem.set === 'None' ||
          !editedItem.gear ||
          editedItem.gear === 'None' ||
          !editedItem.main ||
          !editedItem.main.type ||
          editedItem.main.type === 'None' ||
          !editedItem.main.value
        ) {
          Dialog.error(
            i18next.t(
              'Please make sure Type / Set / Rank / Level / Enhance / Main stat are not empty',
            ),
          );
          return false;
        }

        const substats = [];

        const subStatType1 = document.getElementById('editGearStat1Type').value;
        const subStatType2 = document.getElementById('editGearStat2Type').value;
        const subStatType3 = document.getElementById('editGearStat3Type').value;
        const subStatType4 = document.getElementById('editGearStat4Type').value;

        // Read allowed mod target stats — only when TARGET toggle is ON
        function readAllowedTargets(idx) {
          const targetBtn = document.getElementById(`targetToggle${idx}`);
          if (!targetBtn || targetBtn.dataset.on !== 'true') return undefined;
          const checked = [
            ...document.querySelectorAll(
              `.modTargetCb[data-idx="${idx}"]:checked`,
            ),
          ].map((cb) => cb.dataset.stat);
          return checked.length > 0 ? checked : undefined;
        }

        // Preserve original rolls — ItemAugmenter recalculates from value alone and can
        // produce impossible totals (e.g. HP% 35% → 5 rolls, blowing past the 9-roll max).
        const origSubs = item.substats ?? [];
        if (subStatType1 !== 'None')
          substats.push({
            type: subStatType1,
            value: parseInt(
              document.getElementById('editGearStat1Value').value || 0,
              10,
            ),
            rolls: origSubs[0]?.rolls,
            modified: $('#subMod1').prop('checked'),
            pinMod: $('#pinMod1').prop('checked') || undefined,
            pinModOff: $('#pinMod1').prop('checked') ? undefined : true,
            allowedTargetStats: readAllowedTargets(1),
          });
        if (subStatType2 !== 'None')
          substats.push({
            type: subStatType2,
            value: Number.parseInt(
              document.getElementById('editGearStat2Value').value || 0,
              10,
            ),
            rolls: origSubs[1]?.rolls,
            modified: $('#subMod2').prop('checked'),
            pinMod: $('#pinMod2').prop('checked') || undefined,
            pinModOff: $('#pinMod2').prop('checked') ? undefined : true,
            allowedTargetStats: readAllowedTargets(2),
          });
        if (subStatType3 !== 'None')
          substats.push({
            type: subStatType3,
            value: parseInt(
              document.getElementById('editGearStat3Value').value || 0,
              10,
            ),
            rolls: origSubs[2]?.rolls,
            modified: $('#subMod3').prop('checked'),
            pinMod: $('#pinMod3').prop('checked') || undefined,
            pinModOff: $('#pinMod3').prop('checked') ? undefined : true,
            allowedTargetStats: readAllowedTargets(3),
          });
        if (subStatType4 !== 'None')
          substats.push({
            type: subStatType4,
            value: Number.parseInt(
              document.getElementById('editGearStat4Value').value || 0,
              10,
            ),
            rolls: origSubs[3]?.rolls,
            modified: $('#subMod4').prop('checked'),
            pinMod: $('#pinMod4').prop('checked') || undefined,
            pinModOff: $('#pinMod4').prop('checked') ? undefined : true,
            allowedTargetStats: readAllowedTargets(4),
          });

        editedItem.substats = substats;

        if (editedItem.enhance === 15 && editedItem.substats.length !== 4) {
          Dialog.error(i18next.t('Please make sure +15 items have 4 substats'));
          return false;
        }
        if (editedItem.enhance < 0 || editedItem.enhance > 15) {
          Dialog.error(i18next.t('Item enhance can only be 0 - 15'));
          return false;
        }

        ItemAugmenter.augment([editedItem]);
        if (item.id && edit) {
          editedItem.id = item.id;
        } else if (!edit) {
          editedItem.id = crypto.randomUUID();
        }

        const equippedById = document.getElementById('editGearEquipped').value;

        if (edit) {
          if (equippedById === 'None') {
            await Api.unequipItems([editedItem.id]);
          } else {
            editedItem.equippedById = equippedById;
            editedItem.equippedByName = heroes.find(
              (x) => x.id === equippedById,
            ).name;
            await Api.equipItemsOnHero(equippedById, [editedItem.id]);
          }
        } else if (equippedById === 'None') {
          await Api.addItems([editedItem]);
        } else {
          editedItem.equippedById = equippedById;
          editedItem.equippedByName = heroes.find(
            (x) => x.id === equippedById,
          ).name;
          await Api.addItems([editedItem]);
          await Api.equipItemsOnHero(equippedById, [editedItem.id]);
        }
        return editedItem;
      },
    });
    return formValues;
  },

  updateSetFilterCounts(counts, total, index) {
    const idx = index == null ? '' : index;
    document
      .querySelectorAll(`.selectorSetCount[data-set-index="${idx}"]`)
      .forEach((span) => {
        const count = counts[span.dataset.setKey] || 0;
        const pct = total > 0 ? Math.round((count / total) * 100) : 0;
        span.textContent = total > 0 ? `${count} (${pct}%)` : '';
      });
  },

  updateMainStatCounts({ slots, totals }, index) {
    const idx = index == null ? '' : index;
    document
      .querySelectorAll(`.mainStatCount[data-set-index="${idx}"]`)
      .forEach((span) => {
        const { slot, mainType } = span.dataset;
        const count = slots[slot]?.[mainType] || 0;
        const total = totals[slot] || 0;
        const pct = total > 0 ? Math.round((count / total) * 100) : 0;
        span.textContent = total > 0 ? `${count} (${pct}%)` : '';
      });
  },
};

function safeGetSkill(hero, prefix) {
  if (!hero.skillOptions) {
    return {};
  }

  if (!hero.skillOptions[prefix]) {
    return {};
  }
  return hero.skillOptions[prefix];
}

function generateSkillOptionsHtml(prefix, hero, heroData) {
  const skillTypes = heroData.skills ? heroData.skills[prefix] : [];
  let skillTypesHtml = '';
  for (const skillType of skillTypes.options) {
    const note = skillType.note ? ` (${skillType.note})` : '';
    skillTypesHtml += `<option value='${skillType.name}' ${
      safeGetSkill(hero, prefix).skillEffect === skillType.name
        ? 'selected'
        : ''
    }>${skillType.name + note}</option>\n`;
  }
  const html = `
<div class="editGearFormRow">
        <div class="editGearFormRow">
            <div class="editSkillLabel" id="skillNumberLabel"  data-t>${i18next.t(
              'Select Skill Effect',
            )}</div>
            <select id="${prefix}SkillEffect" class="editSkillSelect skillTypeSelect">
                ${skillTypesHtml}
            </select>
        </div>
</div>
`;
  return html;
}

function getImprintHtml(hero, heroInfo) {
  const imprintType = heroInfo.self_devotion.type;
  const displayText = e7StatToDisplayStat[imprintType];
  const imprintValues = heroInfo.self_devotion.grades;
  const fixedImprintValues = [];

  const isFlat =
    imprintType === 'max_hp' ||
    imprintType === 'speed' ||
    imprintType === 'att' ||
    imprintType === 'def';

  for (const grade of Object.keys(imprintValues)) {
    if (!isFlat) {
      fixedImprintValues[grade] = Utils.round10ths(imprintValues[grade] * 100);
    } else {
      fixedImprintValues[grade] = imprintValues[grade];
    }
  }

  let html = `<select class="editGearStatSelect" id="editImprint"><option value="None">${i18next.t(
    'None',
  )}</option>`;

  for (const grade of Object.keys(fixedImprintValues)) {
    html += `<option value="${fixedImprintValues[grade]}" ${
      parseFloat(hero.imprintNumber) === fixedImprintValues[grade]
        ? 'selected'
        : ''
    }>${fixedImprintValues[grade]}${displayText} - ${grade}</option>`;
  }

  html += `</select>
            `;
  return html;
}

function getStarsHtml(hero, _heroInfo) {
  const html = `<option value=6>${i18next.t('6 stars max awaken')}</option>
                <option value=5 ${
                  hero.stars === 5 ? 'selected' : ''
                }>${i18next.t('5 stars max awaken')}</option>`;

  return html;
}

function getEquippedHtml(item, heroes) {
  let html = `<option value="None">${i18next.t('Nobody')}</option>`;

  Utils.sortByAttribute(heroes, 'name');

  for (const hero of heroes) {
    html += `<option value="${hero.id}" ${
      hero.id === item.equippedById ? 'selected' : ''
    }>${i18next.t(hero.name)}</option>`;
  }

  return html;
}

function getArtifactHtml(hero, heroInfo) {
  let html = `<option value="None">${i18next.t('None')}</option>`;

  const heroRole = heroInfo?.role ?? '';
  const artifactsJson = HeroData.getAllArtifactData();
  const artifacts = Object.values(artifactsJson);

  for (const artifact of artifacts) {
    // Only show universal artifacts (role === '') or artifacts matching the hero's class
    if (artifact.role && artifact.role !== heroRole) continue;
    html += `<option value="${artifact.name}" ${
      hero.artifactName === artifact.name ? 'selected' : ''
    }>${i18next.t(artifact.name)}</option>`;
  }

  return html;
}

function getArtifactEnhanceHtml(hero) {
  let html = `<option value="None">${i18next.t('None')}</option>`;

  const { artifactName } = hero;
  if (artifactName && artifactName !== 'None') {
    const { artifactLevel } = hero;
    if (artifactLevel && artifactLevel !== 'None') {
      for (let i = 30; i >= 0; i -= 1) {
        const artifactStats = Artifact.getStats(artifactName, i);
        html += `<option value="${i}" ${
          parseInt(artifactLevel, 10) === i ? 'selected' : ''
        }>${i} - (${artifactStats.attack.toFixed(1)} ${i18next.t(
          'atk',
        )}, ${artifactStats.health.toFixed(1)} ${i18next.t(
          'hp',
        )}, ${artifactStats.defense.toFixed(1)} ${i18next.t('def')})</option>`;
      }
    }
  }

  return html;
}

function getEeEnhanceHtml(hero, ee) {
  let html = `<option value="None">${i18next.t('None')}</option>`;
  if (!ee) {
    return html;
  }
  const statType = ee.stat.type;
  const isFlat =
    statType === 'max_hp' ||
    statType === 'speed' ||
    statType === 'att' ||
    statType === 'def';

  const baseValue = isFlat ? ee.stat.value : Math.round(ee.stat.value * 100);
  const maxValue = baseValue * 2;

  const displayText = e7StatToDisplayStat[statType];

  for (let i = baseValue; i <= maxValue; i += 1) {
    html += `<option value="${i}" ${
      parseFloat(hero.eeNumber) === i ? 'selected' : ''
    }>${i}${displayText}</option>`;
  }

  return html;
}

// All stats that can be a mod replacement target, in display order
const MOD_TARGET_STATS = [
  { type: 'HealthPercent', label: 'HP%' },
  { type: 'Health', label: 'HP' },
  { type: 'AttackPercent', label: 'Atk%' },
  { type: 'Attack', label: 'Atk' },
  { type: 'DefensePercent', label: 'Def%' },
  { type: 'Defense', label: 'Def' },
  { type: 'Speed', label: 'Spd' },
  { type: 'CriticalHitChancePercent', label: 'CC%' },
  { type: 'CriticalHitDamagePercent', label: 'CD%' },
  { type: 'EffectivenessPercent', label: 'EFF%' },
  { type: 'EffectResistancePercent', label: 'ER%' },
];

// Returns the full HTML for one substat row + its inline mod target section
function _buildSubstatRow(item, subIdx, modAnyIdx) {
  const idx = subIdx + 1;
  const sub = item.substats[subIdx];
  const isModified = !!sub?.modified;
  const isLocked = modAnyIdx >= 0 && modAnyIdx !== subIdx;

  const wrapStyle = isModified
    ? 'border-left:3px solid #e6a817;background:rgba(230,168,23,0.07);padding-left:5px;border-radius:0 3px 3px 0;margin:2px 0;'
    : isLocked
      ? 'opacity:0.55;margin:2px 0;'
      : 'margin:2px 0;';

  // MOD toggle: ON by default; OFF only when pinModOff===true (explicit user choice, survives Java round-trip)
  const modOn = isModified || (!sub?.pinModOff && !isLocked);
  // TARGET toggle: on only if modOn AND there are saved target restrictions
  const targetOn = modOn && !!sub?.allowedTargetStats?.length;

  // Hidden checkbox keeps preConfirm reader working unchanged
  const pinHidden = `<input type="checkbox" id="pinMod${idx}" style="display:none;" ${modOn ? 'checked' : ''}>`;

  const modBtnCss = modOn
    ? 'font-size:10px;font-weight:700;padding:2px 8px;border-radius:10px;border:1px solid #e6a817;background:rgba(230,168,23,0.2);color:#e6a817;letter-spacing:.05em;cursor:pointer;flex-shrink:0;'
    : 'font-size:10px;font-weight:700;padding:2px 8px;border-radius:10px;border:1px solid rgba(255,255,255,0.15);background:rgba(255,255,255,0.04);color:rgba(255,255,255,0.28);letter-spacing:.05em;cursor:pointer;flex-shrink:0;';
  const targetBtnCss = targetOn
    ? 'font-size:10px;font-weight:700;padding:2px 8px;border-radius:10px;border:1px solid #4caf50;background:rgba(76,175,80,0.18);color:#4caf50;letter-spacing:.05em;cursor:pointer;flex-shrink:0;'
    : 'font-size:10px;font-weight:700;padding:2px 8px;border-radius:10px;border:1px solid rgba(255,255,255,0.15);background:rgba(255,255,255,0.04);color:rgba(255,255,255,0.28);letter-spacing:.05em;cursor:pointer;flex-shrink:0;';

  const modDisabled = isModified || isLocked ? ' disabled' : '';
  const targDisabled = isLocked ? ' disabled' : '';
  const modBadge = isModified
    ? `<span style="font-size:10px;background:rgba(230,168,23,0.25);color:#e6a817;padding:1px 5px;border-radius:3px;font-weight:700;">MOD&apos;d</span>`
    : '';

  return `<div style="${wrapStyle}">
    <div class="editGearFormRow" style="align-items:center;flex-wrap:wrap;gap:3px;">
      <div class="editGearStatLabel" data-t>${i18next.t('Substat ' + idx)}</div>
      ${pinHidden}
      <button type="button" class="editModToggle" id="modToggle${idx}" data-idx="${idx}" data-on="${modOn}"${modDisabled} style="${modBtnCss}">MOD</button>
      <button type="button" class="editTargetToggle" id="targetToggle${idx}" data-idx="${idx}" data-on="${targetOn}"${targDisabled} style="${targetBtnCss}">TARGET</button>
      <select id="editGearStat${idx}Type" class="editGearStatSelect">
        ${getStatOptionsHtml(sub)}
      </select>
      <input type="number" class="editGearStatNumber" id="editGearStat${idx}Value" value="${sub ? sub.value : ''}">
      <span class="editGearRollBadge" title="${sub ? (sub.rolls || 0) + ' rolls' : ''}">${sub ? '[' + (sub.rolls || 0) + ']' : ''}</span>
      <input type="checkbox" class="subModCheckbox" id="subMod${idx}" ${isModified ? 'checked' : ''}>
      ${modBadge}
    </div>
  </div>`;
}

// Returns the inline "→ Can mod to:" row for a substat position.
// targetOn = initial visibility (driven by TARGET toggle state)
function _buildInlineModTargets(item, subIdx, modAnyIdx, targetOn) {
  const idx = subIdx + 1;
  const sub = item.substats[subIdx];
  if (!sub?.type || sub.type === 'None') return '';

  const isModified = !!sub?.modified;
  const isLocked = modAnyIdx >= 0 && modAnyIdx !== subIdx;

  const gearType = item.gear ?? '';
  const mainType = item.main?.type ?? '';
  // Own type is NOT invalid — you can mod a sub to a higher roll of itself (e.g. Spd 2 → Spd 4)
  const invalid = new Set([mainType]);
  item.substats.forEach((s, i) => {
    if (i !== subIdx && s?.type) invalid.add(s.type);
  });
  if (gearType === 'Weapon') {
    invalid.add('Defense');
    invalid.add('DefensePercent');
  }
  if (gearType === 'Armor') {
    invalid.add('Attack');
    invalid.add('AttackPercent');
  }

  const labelMap = Object.fromEntries(
    MOD_TARGET_STATS.map((s) => [s.type, s.label]),
  );
  const allowed = new Set(sub?.allowedTargetStats ?? []);

  const showInitially = !isLocked && !!targetOn;

  let content;
  if (isLocked) {
    content = `<span style="font-size:11px;opacity:0.35;font-style:italic;">Locked — ${labelMap[item.substats[modAnyIdx]?.type] || 'another sub'} is already modified</span>`;
  } else {
    content = MOD_TARGET_STATS.map(({ type, label }) => {
      const inv = invalid.has(type);
      const checked = allowed.has(type);
      return (
        `<label style="display:inline-flex;align-items:center;gap:2px;font-size:11px;white-space:nowrap;margin:1px 3px 1px 0;${inv ? 'opacity:0.22;cursor:not-allowed;text-decoration:line-through;' : 'cursor:pointer;'}">` +
        `<input type="checkbox" class="modTargetCb" data-idx="${idx}" data-stat="${type}"${checked ? ' checked' : ''}${inv ? ' disabled' : ''} style="accent-color:#4caf50;margin:0;${inv ? 'cursor:not-allowed;' : 'cursor:pointer;'}"> ${label}</label>`
      );
    }).join('');
  }

  const borderColor = isModified ? '#e6a817' : '#4caf50';
  const fixedAttr = isLocked ? ' data-fixed="1"' : '';

  return `<div id="inlineModTargets${idx}"${fixedAttr} style="display:${showInitially ? 'flex' : 'none'};align-items:flex-start;gap:5px;padding:4px 4px 5px 6px;background:rgba(76,175,80,0.06);border-left:2px solid ${borderColor};border-radius:0 3px 3px 0;margin:0 0 4px 0;flex-wrap:wrap;">
  <span style="font-size:10px;color:#4caf50;opacity:0.7;flex-shrink:0;padding-top:3px;">→ Mod to:</span>
  <div style="display:flex;flex-wrap:wrap;gap:0;">${content}</div>
</div>`;
}

function _buildArchScoreSection(score) {
  if (!score) return '';
  const GS = globalThis.GearScorer;
  const offKeys = GS?.OFFICIAL_ARCHETYPE_KEYS ?? [];
  const unKeys = GS?.UNOFFICIAL_ARCHETYPE_KEYS ?? [];
  const allKeys = [...new Set([...offKeys, ...unKeys])];

  const scored = allKeys.filter((k) => {
    const best = Math.max(
      score.official?.nonModGS?.[k] ?? 0,
      score.official?.modGS?.[k] ?? 0,
      score.unofficial?.nonModGS?.[k] ?? 0,
      score.unofficial?.modGS?.[k] ?? 0,
    );
    return best > 0;
  });

  if (scored.length === 0) {
    return `<div style="font-size:11px;opacity:0.45;padding:6px 0;">No archetypes score &gt; 0 for this piece</div>`;
  }

  const offCp = score.official?.cPower?.score ?? 0;
  const offAp = score.official?.aPower?.score ?? 0;
  const unCp = score.unofficial?.cPower?.score ?? 0;
  const unAp = score.unofficial?.aPower?.score ?? 0;

  const rowsHtml = scored
    .map((k) => {
      const offNm = score.official?.nonModGS?.[k] ?? 0;
      const offMod = score.official?.modGS?.[k] ?? 0;
      const unNm = score.unofficial?.nonModGS?.[k] ?? 0;
      const unMod = score.unofficial?.modGS?.[k] ?? 0;
      const hint =
        score.official?.modHint?.[k] || score.unofficial?.modHint?.[k] || '';
      const isOffOnly = offKeys.includes(k) && !unKeys.includes(k);
      const isUnOnly = !offKeys.includes(k) && unKeys.includes(k);
      const badge = isOffOnly
        ? '<span style="font-size:9px;opacity:0.5;margin-left:3px;">[O]</span>'
        : isUnOnly
          ? '<span style="font-size:9px;opacity:0.5;margin-left:3px;">[U]</span>'
          : '';
      const nmVal = Math.max(offNm, unNm);
      const modVal = Math.max(offMod, unMod);
      const modDiff = modVal - nmVal;
      const nmColor = nmVal > 0 ? '#7ec8e3' : 'rgba(255,255,255,0.25)';
      const modColor =
        modDiff > 0
          ? '#4caf50'
          : nmVal > 0
            ? '#7ec8e3'
            : 'rgba(255,255,255,0.2)';
      const modLabel =
        modVal > 0
          ? modDiff > 0
            ? `${modVal}<span style="color:#4caf50;font-size:10px;">(+${modDiff})</span>`
            : String(modVal)
          : '—';
      return `<div style="display:flex;align-items:center;padding:2px 4px;border-radius:3px;font-size:11px;line-height:1.5;">
      <span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${k}${badge}</span>
      <span style="min-width:26px;text-align:right;color:${nmColor};">${nmVal > 0 ? nmVal : '—'}</span>
      <span style="min-width:50px;text-align:right;color:${modColor};padding-left:4px;">${modLabel}</span>
      ${hint ? `<span style="font-size:10px;color:rgba(230,168,23,0.75);margin-left:6px;flex-shrink:0;">${hint}</span>` : ''}
    </div>`;
    })
    .join('');

  return `<div style="margin-bottom:10px;">
    <div style="font-size:12px;font-weight:600;color:#7ec8e3;border-bottom:1px solid rgba(126,200,227,0.25);padding-bottom:4px;margin-bottom:4px;">Archetype Scores</div>
    <div style="display:flex;font-size:10px;opacity:0.45;padding:0 4px 2px;gap:0;">
      <span style="flex:1;">Archetype</span><span style="min-width:26px;text-align:right;">NM</span><span style="min-width:50px;text-align:right;padding-left:4px;">+Mod</span><span style="margin-left:6px;">Hint</span>
    </div>
    ${rowsHtml}
    <div style="display:flex;gap:10px;font-size:11px;margin-top:6px;padding:5px 4px;background:rgba(0,0,0,0.2);border-radius:3px;flex-wrap:wrap;">
      <span style="opacity:0.55;">Off.:</span>
      <span>C.Power <strong style="color:#7ec8e3;">${offCp}</strong></span>
      <span>A.Power <strong style="color:#7ec8e3;">${offAp}</strong></span>
      <span style="opacity:0.4;">|</span>
      <span style="opacity:0.55;">UOff.:</span>
      <span>C.Power <strong style="color:#7ec8e3;">${unCp}</strong></span>
      <span>A.Power <strong style="color:#7ec8e3;">${unAp}</strong></span>
    </div>
  </div>`;
}

function buildModTargetsPanel(item, score) {
  const archHtml = _buildArchScoreSection(score);
  const modAnyIdx = item.substats.findIndex((s) => s?.modified);
  const targetsHtml = _buildBigModTargets(item, modAnyIdx, score);
  return `<div style="display:flex;flex-direction:column;gap:0;padding:2px 0;">
    ${archHtml}
    <div style="border-top:1px solid rgba(255,255,255,0.08);margin:10px 0 8px;"></div>
    ${targetsHtml}
  </div>`;
}

function _buildBigModTargets(item, modAnyIdx, score) {
  const labelMap = Object.fromEntries(
    MOD_TARGET_STATS.map((s) => [s.type, s.label]),
  );
  const typeFromLbl = Object.fromEntries(
    MOD_TARGET_STATS.map((s) => [s.label, s.type]),
  );
  const gearType = item.gear ?? '';
  const mainType = item.main?.type ?? '';

  // Collect all archetype mod hints keyed by "fromLabel" → array of { arch, toLabel, toType, nmScore, modScore, diff }
  // Hint format per line: "ER% → Def | 34"  (pipe-score suffix; may be multi-line)
  const hintsByFrom = {};
  if (score) {
    for (const result of [score.official, score.unofficial]) {
      if (!result) continue;
      for (const [arch, hint] of Object.entries(result.modHint ?? {})) {
        if (!hint) continue;
        const diff =
          (result.modGS?.[arch] ?? 0) - (result.nonModGS?.[arch] ?? 0);
        if (diff <= 0) continue;
        // Each hint may contain multiple lines like "ER% → Def | 34"
        for (const line of hint.split('\n')) {
          const trimmed = line.trim();
          if (!trimmed) continue;
          const arrowIdx = trimmed.indexOf('→');
          if (arrowIdx < 0) continue;
          const fromLbl = trimmed.slice(0, arrowIdx).trim();
          // Strip optional "| score" suffix from the target label
          const toRaw = trimmed.slice(arrowIdx + 1).trim();
          const pipeIdx = toRaw.indexOf('|');
          const toLbl = (pipeIdx >= 0 ? toRaw.slice(0, pipeIdx) : toRaw).trim();
          const toType = typeFromLbl[toLbl];
          if (!toType) continue;
          if (!hintsByFrom[fromLbl]) hintsByFrom[fromLbl] = [];
          // Deduplicate: one chip per (arch, toType) pair
          if (
            !hintsByFrom[fromLbl].some(
              (h) => h.arch === arch && h.toType === toType,
            )
          ) {
            hintsByFrom[fromLbl].push({
              arch,
              toLbl,
              toType,
              nmScore: result.nonModGS?.[arch] ?? 0,
              modScore: result.modGS?.[arch] ?? 0,
              diff,
            });
          }
        }
      }
    }
  }

  const blocks = [0, 1, 2, 3]
    .map((i) => {
      const sub = item.substats[i];
      if (!sub?.type || sub.type === 'None') return '';
      const idx = i + 1;
      const isModified = !!sub?.modified;
      const isLocked = modAnyIdx >= 0 && modAnyIdx !== i;
      const modOn = isModified || (!sub?.pinModOff && !isLocked);
      const targetOn = modOn && !!sub?.allowedTargetStats?.length;
      const statName = labelMap[sub.type] || sub.type;
      const subLabel = labelMap[sub.type] || sub.type; // short label e.g. "ER%"

      const invalid = new Set([mainType]);
      item.substats.forEach((s, j) => {
        if (j !== i && s?.type) invalid.add(s.type);
      });
      if (gearType === 'Weapon') {
        invalid.add('Defense');
        invalid.add('DefensePercent');
      }
      if (gearType === 'Armor') {
        invalid.add('Attack');
        invalid.add('AttackPercent');
      }

      const allowed = new Set(sub?.allowedTargetStats ?? []);
      const blockOpacity = isLocked ? '0.38' : modOn ? '1' : '0.5';
      const borderColor = isModified
        ? '#e6a817'
        : modOn && targetOn
          ? '#4caf50'
          : 'rgba(255,255,255,0.1)';
      const cbDisabled = isLocked || !modOn;

      // ── Archetype suggestion chips (merged by toType so each target = 1 chip) ───
      const rawHints = hintsByFrom[subLabel] ?? [];
      // Group by toType, keep best diff per group, collect all arch names
      const chipsByType = new Map();
      for (const h of rawHints) {
        if (!chipsByType.has(h.toType)) {
          chipsByType.set(h.toType, { ...h, archs: [h.arch] });
        } else {
          const g = chipsByType.get(h.toType);
          if (!g.archs.includes(h.arch)) g.archs.push(h.arch);
          if (h.diff > g.diff) {
            g.diff = h.diff;
            g.nmScore = h.nmScore;
            g.modScore = h.modScore;
          }
        }
      }
      const archSuggestions = [...chipsByType.values()]
        .sort((a, b) => b.diff - a.diff)
        .map(({ archs, toLbl, toType, nmScore, modScore, diff }) => {
          const inv = invalid.has(toType);
          const checked = allowed.has(toType);
          const disabled = cbDisabled || inv;
          const chipBg = checked
            ? 'background:rgba(76,175,80,0.2);border:1px solid #4caf50;color:#4caf50;'
            : inv
              ? 'background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);opacity:0.3;text-decoration:line-through;'
              : 'background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.18);color:rgba(255,255,255,0.8);cursor:pointer;';
          const onclick = !disabled
            ? `onclick="(function(){var cb=document.getElementById('bigModCb_${idx}_${toType}');if(cb&&!cb.disabled){cb.checked=!cb.checked;this.style.background=cb.checked?'rgba(76,175,80,0.2)':'rgba(255,255,255,0.06)';this.style.borderColor=cb.checked?'#4caf50':'rgba(255,255,255,0.18)';this.style.color=cb.checked?'#4caf50':'rgba(255,255,255,0.8)';}}).call(this)"`
            : '';
          return `<div style="display:inline-flex;flex-direction:column;align-items:center;padding:10px 18px;border-radius:7px;${chipBg}margin:0 8px 8px 0;min-width:72px;text-align:center;" ${onclick}>
          <span style="font-size:18px;font-weight:800;letter-spacing:0.02em;">${toLbl}</span>
          <span style="font-size:11px;opacity:0.65;margin-top:3px;">${archs.join(', ')}</span>
          <span style="font-size:12px;color:#4caf50;margin-top:3px;font-weight:600;">${nmScore} → ${modScore} <span style="font-size:10px;opacity:0.8;">(+${diff})</span></span>
        </div>`;
        })
        .join('');

      // ── Full stat checkbox grid ────────────────────────────────────────────────
      const checks = MOD_TARGET_STATS.map(({ type, label }) => {
        const inv = invalid.has(type);
        const checked = allowed.has(type);
        const disabled = cbDisabled || inv;
        const cbStyle = `accent-color:#4caf50;margin:0;cursor:${disabled ? 'not-allowed' : 'pointer'};`;
        const lStyle =
          `display:flex;flex-direction:column;align-items:center;gap:3px;font-size:11px;padding:4px 5px;border-radius:4px;cursor:${disabled ? 'not-allowed' : 'pointer'};min-width:36px;text-align:center;` +
          (inv
            ? 'opacity:0.18;text-decoration:line-through;'
            : checked && !disabled
              ? 'background:rgba(76,175,80,0.15);border:1px solid rgba(76,175,80,0.35);'
              : 'border:1px solid transparent;') +
          (disabled && !inv ? 'opacity:0.3;' : '');
        return (
          `<label style="${lStyle}">` +
          `<input type="checkbox" class="modTargetCb" id="bigModCb_${idx}_${type}" data-idx="${idx}" data-stat="${type}"${checked ? ' checked' : ''}${disabled ? ' disabled' : ''} style="${cbStyle}">` +
          `<span>${label}</span></label>`
        );
      }).join('');

      const badge = isModified
        ? `<span style="font-size:10px;background:rgba(230,168,23,0.25);color:#e6a817;padding:1px 6px;border-radius:3px;font-weight:700;">MOD'd</span>`
        : isLocked
          ? `<span style="font-size:10px;background:rgba(255,255,255,0.06);color:rgba(255,255,255,0.3);padding:1px 6px;border-radius:3px;">LOCKED</span>`
          : '';

      const lockedMsg = isLocked
        ? `<div style="font-size:11px;opacity:0.35;font-style:italic;padding:4px 0 2px;">Cannot mod — another substat is already modified on this piece</div>`
        : !modOn
          ? `<div style="font-size:11px;opacity:0.35;font-style:italic;padding:4px 0 2px;">Enable MOD toggle on the left to allow optimizer to mod this position</div>`
          : '';

      const suggSection =
        !isLocked && modOn && archSuggestions
          ? `<div style="margin-bottom:10px;">
           <div style="font-size:11px;font-weight:600;opacity:0.55;text-transform:uppercase;letter-spacing:0.07em;margin-bottom:7px;">Archetype suggestions — click to enable</div>
           <div style="display:flex;flex-wrap:wrap;">${archSuggestions}</div>
         </div>`
          : '';

      const gridSection =
        !isLocked && modOn
          ? `<div>
           <div style="font-size:11px;font-weight:600;opacity:0.45;text-transform:uppercase;letter-spacing:0.07em;margin-bottom:6px;">All options</div>
           <div style="display:flex;flex-wrap:wrap;gap:4px;">${checks}</div>
         </div>`
          : '';

      return `<div id="bigModBlock${idx}" style="border:1px solid ${borderColor};border-radius:5px;padding:8px 10px 10px;margin-bottom:8px;opacity:${blockOpacity};transition:opacity 0.15s,border-color 0.15s;">
      <div style="display:flex;align-items:center;gap:7px;margin-bottom:${lockedMsg ? '4px' : '10px'};">
        <span style="font-size:12px;font-weight:600;">Sub ${idx} — ${statName}</span>
        ${badge}
        <span class="bigModHint" style="font-size:10px;opacity:0.4;margin-left:auto;">${!isLocked && !isModified ? (targetOn ? 'restricting targets' : modOn ? 'any target allowed' : '') : ''}</span>
      </div>
      ${lockedMsg}
      ${suggSection}
      ${gridSection}
    </div>`;
    })
    .join('');

  return `<div id="bigModTargetsPanel">
    <div style="font-size:12px;font-weight:600;color:#4caf50;margin-bottom:10px;letter-spacing:0.03em;">Mod Target Selection</div>
    ${blocks}
  </div>`;
}

function getStatOptionsHtml(stat) {
  const type = stat ? stat.type : null;
  return `
<option value="None"></option>
<option value="AttackPercent" ${
    type === 'AttackPercent' ? 'selected' : ''
  }>${i18next.t('Attack %')}</option>
<option value="Attack" ${type === 'Attack' ? 'selected' : ''}>${i18next.t(
    'Attack',
  )}</option>
<option value="HealthPercent" ${
    type === 'HealthPercent' ? 'selected' : ''
  }>${i18next.t('Health %')}</option>
<option value="Health" ${type === 'Health' ? 'selected' : ''}>${i18next.t(
    'Health',
  )}</option>
<option value="DefensePercent" ${
    type === 'DefensePercent' ? 'selected' : ''
  }>${i18next.t('Defense %')}</option>
<option value="Defense" ${type === 'Defense' ? 'selected' : ''}>${i18next.t(
    'Defense',
  )}</option>
<option value="Speed" ${type === 'Speed' ? 'selected' : ''}>${i18next.t(
    'Speed',
  )}</option>
<option value="CriticalHitChancePercent" ${
    type === 'CriticalHitChancePercent' ? 'selected' : ''
  }>${i18next.t('Crit Chance')}</option>
<option value="CriticalHitDamagePercent" ${
    type === 'CriticalHitDamagePercent' ? 'selected' : ''
  }>${i18next.t('Crit Damage')}</option>
<option value="EffectivenessPercent" ${
    type === 'EffectivenessPercent' ? 'selected' : ''
  }>${i18next.t('Effectiveness')}</option>
<option value="EffectResistancePercent" ${
    type === 'EffectResistancePercent' ? 'selected' : ''
  }>${i18next.t('Effect Resistance')}</option>
`;
}

function getGearTypeOptionsHtml(item) {
  const { gear } = item;
  return `
<option value="None"></option>
<option value="Weapon" ${gear === 'Weapon' ? 'selected' : ''}>${i18next.t(
    'Weapon',
  )}</option>
<option value="Helmet" ${gear === 'Helmet' ? 'selected' : ''}>${i18next.t(
    'Helmet',
  )}</option>
<option value="Armor" ${gear === 'Armor' ? 'selected' : ''}>${i18next.t(
    'Armor',
  )}</option>
<option value="Necklace" ${gear === 'Necklace' ? 'selected' : ''}>${i18next.t(
    'Necklace',
  )}</option>
<option value="Ring" ${gear === 'Ring' ? 'selected' : ''}>${i18next.t(
    'Ring',
  )}</option>
<option value="Boots" ${gear === 'Boots' ? 'selected' : ''}>${i18next.t(
    'Boots',
  )}</option>
`;
}

function getGearSetOptionsHtml(item) {
  const { set } = item;
  return `
<option value="None"></option>
<option value="SpeedSet" ${set === 'SpeedSet' ? 'selected' : ''}>${i18next.t(
    'Speed',
  )}</option>
<option value="AttackSet" ${set === 'AttackSet' ? 'selected' : ''}>${i18next.t(
    'Attack',
  )}</option>
<option value="DestructionSet" ${
    set === 'DestructionSet' ? 'selected' : ''
  }>${i18next.t('Destruction')}</option>
<option value="LifestealSet" ${
    set === 'LifestealSet' ? 'selected' : ''
  }>${i18next.t('Lifesteal')}</option>
<option value="CounterSet" ${
    set === 'CounterSet' ? 'selected' : ''
  }>${i18next.t('Counter')}</option>
<option value="RageSet" ${set === 'RageSet' ? 'selected' : ''}>${i18next.t(
    'Rage',
  )}</option>
<option value="HealthSet" ${set === 'HealthSet' ? 'selected' : ''}>${i18next.t(
    'Health',
  )}</option>
<option value="DefenseSet" ${
    set === 'DefenseSet' ? 'selected' : ''
  }>${i18next.t('Defense')}</option>
<option value="CriticalSet" ${
    set === 'CriticalSet' ? 'selected' : ''
  }>${i18next.t('Critical')}</option>
<option value="HitSet" ${set === 'HitSet' ? 'selected' : ''}>${i18next.t(
    'Hit',
  )}</option>
<option value="ResistSet" ${set === 'ResistSet' ? 'selected' : ''}>${i18next.t(
    'Resist',
  )}</option>
<option value="UnitySet" ${set === 'UnitySet' ? 'selected' : ''}>${i18next.t(
    'Unity',
  )}</option>
<option value="ImmunitySet" ${
    set === 'ImmunitySet' ? 'selected' : ''
  }>${i18next.t('Immunity')}</option>
<option value="PenetrationSet" ${
    set === 'PenetrationSet' ? 'selected' : ''
  }>${i18next.t('Penetration')}</option>
<option value="InjurySet" ${set === 'InjurySet' ? 'selected' : ''}>${i18next.t(
    'Injury',
  )}</option>
<option value="RevengeSet" ${
    set === 'RevengeSet' ? 'selected' : ''
  }>${i18next.t('Revenge')}</option>
<option value="ProtectionSet" ${
    set === 'ProtectionSet' ? 'selected' : ''
  }>${i18next.t('Protection')}</option>
<option value="TorrentSet" ${
    set === 'TorrentSet' ? 'selected' : ''
  }>${i18next.t('Torrent')}</option>
<option value="ReversalSet" ${
    set === 'ReversalSet' ? 'selected' : ''
  }>${i18next.t('Reversal')}</option>
<option value="RiposteSet" ${
    set === 'RiposteSet' ? 'selected' : ''
  }>${i18next.t('Riposte')}</option>
<option value="WarfareSet" ${
    set === 'WarfareSet' ? 'selected' : ''
  }>${i18next.t('Warfare')}</option>
<option value="PursuitSet" ${
    set === 'PursuitSet' ? 'selected' : ''
  }>${i18next.t('Pursuit')}</option>
<option value="FervorSet" ${
    set === 'FervorSet' ? 'selected' : ''
  }>${i18next.t('Fervor')}</option>
<option value="WeakeningSet" ${
    set === 'WeakeningSet' ? 'selected' : ''
  }>${i18next.t('Weakening')}</option>
`;
}

function getGearRankOptionsHtml(item) {
  const { rank } = item;
  return `
<option value="None"></option>
<option value="Epic" ${rank === 'Epic' ? 'selected' : ''}>${i18next.t(
    'Epic',
  )}</option>
<option value="Heroic" ${rank === 'Heroic' ? 'selected' : ''}>${i18next.t(
    'Heroic',
  )}</option>
<option value="Rare" ${rank === 'Rare' ? 'selected' : ''}>${i18next.t(
    'Rare',
  )}</option>
<option value="Good" ${rank === 'Good' ? 'selected' : ''}>${i18next.t(
    'Good',
  )}</option>
<option value="Normal" ${rank === 'Normal' ? 'selected' : ''}>${i18next.t(
    'Normal',
  )}</option>
`;
}

function getGearMaterialOptionsHtml(item) {
  const { material } = item;
  return `
<option value="None">${i18next.t('None')}</option>
<option value="Hunt" ${material === 'Hunt' ? 'selected' : ''}>${i18next.t(
    'Hunt',
  )}</option>
<option value="Conversion" ${
    material === 'Conversion' ? 'selected' : ''
  }>${i18next.t('Conversion')}</option>
`;
}

// Stats that cannot be modded onto certain slots — used for badge annotations.
const MOD_SLOT_CONSTRAINTS = {
  Health: '✗Helm',
  Defense: '✗Weap ✗Arm',
  DefensePercent: '✗Weap',
  Attack: '✗Weap ✗Arm',
  AttackPercent: '✗Arm',
};

function modConstraintBadge(stat) {
  const label = MOD_SLOT_CONSTRAINTS[stat];
  if (!label) return '';
  return `<span class="modConstraintBadge">${label}</span>`;
}

function generateStatList(hero, state) {
  let keepStats = hero.keepStats || [];
  let discardStats = hero.discardStats || [];
  keepStats = keepStats.filter((x) => !!x && x !== 'undefined');
  discardStats = discardStats.filter((x) => !!x && x !== 'undefined');
  let list;

  if (state === 'keep') {
    list = keepStats;
  } else if (state === 'discard') {
    list = discardStats;
  } else {
    const ignoreList = stats.filter(
      (x) => !keepStats.includes(x) && !discardStats.includes(x),
    );
    list = ignoreList;
  }

  let result = '';
  for (let i = 0; i < list.length; i += 1) {
    const stat = list[i];
    result += `<div class="list-group-item" data-id="${stat}"><span class="modStatLabel">${i18next.t(
      optimizerStatToDisplayStat[stat],
    )}</span>${modConstraintBadge(stat)}</div>`;
  }
  return result;
}

function getBaseStatsHtml(hero, heroInfo) {
  const base = heroInfo.calculatedStatus?.lv60SixStarFullyAwakened;
  if (!base)
    return '<p style="color:var(--font-color)">No base stats available</p>';

  const b = (v) => Number.parseFloat(v) || 0;

  // Passive skill bonuses already baked into heroInfo JSON (e.g. Schniel S2 +10% HP)
  const passiveHpPct = b(base.bonusMaxHpPercent);
  const passiveAtkPct = b(base.bonusMaxAtkPercent);
  const passiveDefPct = b(base.bonusMaxDefPercent);
  const passiveSpd = b(base.bonusSpeed);
  const passiveCr = b(base.bonusCritChance);
  const passiveCd = b(base.bonusCritDamage);

  // Manual extra bonuses entered in Tab 1 (for non-tracked passives/situational bonuses)
  const bonusAtk = b(hero.bonusAtk);
  const bonusAtkPct = b(hero.bonusAtkPercent);
  const bonusDef = b(hero.bonusDef);
  const bonusDefPct = b(hero.bonusDefPercent);
  const bonusHp = b(hero.bonusHp);
  const bonusHpPct = b(hero.bonusHpPercent);
  const bonusSpd = b(hero.bonusSpeed);
  const bonusCr = b(hero.bonusCr);
  const bonusCd = b(hero.bonusCd);
  const bonusEff = b(hero.bonusEff);
  const bonusRes = b(hero.bonusRes);

  // Artifact + EE + Imprint combined (pre-computed by backend)
  const aeiAtk = b(hero.aeiAtk);
  const aeiAtkPct = b(hero.aeiAtkPercent);
  const aeiDef = b(hero.aeiDef);
  const aeiDefPct = b(hero.aeiDefPercent);
  const aeiHp = b(hero.aeiHp);
  const aeiHpPct = b(hero.aeiHpPercent);
  const aeiSpd = b(hero.aeiSpeed);
  const aeiCr = b(hero.aeiCr);
  const aeiCd = b(hero.aeiCd);
  const aeiEff = b(hero.aeiEff);
  const aeiRes = b(hero.aeiRes);

  // Column 2: Base + passive skill bonuses + manual bonuses
  const totalHpPct = passiveHpPct + bonusHpPct;
  const totalAtkPct = passiveAtkPct + bonusAtkPct;
  const totalDefPct = passiveDefPct + bonusDefPct;
  const withBonusAtk = Math.round(
    base.atk * (1 + totalAtkPct / 100) + bonusAtk,
  );
  const withBonusDef = Math.round(
    base.def * (1 + totalDefPct / 100) + bonusDef,
  );
  const withBonusHp = Math.round(base.hp * (1 + totalHpPct / 100) + bonusHp);
  const withBonusSpd = base.spd + passiveSpd + bonusSpd;
  const baseCr = Math.round(base.chc * 1000) / 10;
  const baseCd = Math.round(base.chd * 1000) / 10;
  const baseEff = Math.round(base.eff * 1000) / 10;
  const baseRes = Math.round(base.efr * 1000) / 10;
  const withBonusCr = Math.round((baseCr + passiveCr + bonusCr) * 10) / 10;
  const withBonusCd = Math.round((baseCd + passiveCd + bonusCd) * 10) / 10;
  const withBonusEff = Math.round((baseEff + bonusEff) * 10) / 10;
  const withBonusRes = Math.round((baseRes + bonusRes) * 10) / 10;

  // Column 3: Column 2 + Artifact/EE/Imprint
  const withAeiAtk = Math.round(
    base.atk * (1 + (totalAtkPct + aeiAtkPct) / 100) + bonusAtk + aeiAtk,
  );
  const withAeiDef = Math.round(
    base.def * (1 + (totalDefPct + aeiDefPct) / 100) + bonusDef + aeiDef,
  );
  const withAeiHp = Math.round(
    base.hp * (1 + (totalHpPct + aeiHpPct) / 100) + bonusHp + aeiHp,
  );
  const withAeiSpd = base.spd + passiveSpd + bonusSpd + aeiSpd;
  const withAeiCr =
    Math.round((baseCr + passiveCr + bonusCr + aeiCr) * 10) / 10;
  const withAeiCd =
    Math.round((baseCd + passiveCd + bonusCd + aeiCd) * 10) / 10;
  const withAeiEff = Math.round((baseEff + bonusEff + aeiEff) * 10) / 10;
  const withAeiRes = Math.round((baseRes + bonusRes + aeiRes) * 10) / 10;

  // Build passive note to show below the table
  const passiveNotes = [];
  if (passiveHpPct) passiveNotes.push(`HP +${passiveHpPct}%`);
  if (passiveAtkPct) passiveNotes.push(`Atk +${passiveAtkPct}%`);
  if (passiveDefPct) passiveNotes.push(`Def +${passiveDefPct}%`);
  if (passiveSpd) passiveNotes.push(`Spd +${passiveSpd}`);
  if (passiveCr) passiveNotes.push(`CC +${passiveCr}%`);
  if (passiveCd) passiveNotes.push(`CD +${passiveCd}%`);
  const passiveNote = passiveNotes.length
    ? `<p style="color:var(--font-color);font-size:11px;margin:6px 0 0;opacity:0.7">Passive skill bonus (auto): ${passiveNotes.join(' &nbsp;|&nbsp; ')}</p>`
    : '';

  const cls = (a, c) => (a !== c ? 'baseStatChanged' : '');

  const statRow = (label, baseVal, withBonus, withAei) => `
            <tr>
                <td class="baseStatLabel">${label}</td>
                <td class="baseStatValue">${baseVal}</td>
                <td class="baseStatValue ${cls(baseVal, withBonus)}">${withBonus}</td>
                <td class="baseStatValue ${cls(withBonus, withAei)}">${withAei}</td>
            </tr>`;

  const pctRow = (label, baseVal, withBonus, withAei) => `
            <tr>
                <td class="baseStatLabel">${label}</td>
                <td class="baseStatValue">${baseVal}%</td>
                <td class="baseStatValue ${cls(baseVal, withBonus)}">${withBonus}%</td>
                <td class="baseStatValue ${cls(withBonus, withAei)}">${withAei}%</td>
            </tr>`;

  // Summarise what AEI is contributing for the subtitle
  const artifactName =
    hero.artifactName && hero.artifactName !== 'None'
      ? hero.artifactName
      : null;
  const imprintVal =
    hero.imprintNumber && hero.imprintNumber !== 'None'
      ? hero.imprintNumber
      : null;
  const eeVal =
    hero.eeNumber && hero.eeNumber !== 'None' ? hero.eeNumber : null;
  const aeiParts = [
    artifactName
      ? `Artifact: ${artifactName} (Lv ${hero.artifactLevel || '?'})`
      : null,
    imprintVal ? `Imprint: ${imprintVal}` : null,
    eeVal ? `EE: ${eeVal}` : null,
  ].filter(Boolean);
  const aeiNote = aeiParts.length
    ? aeiParts.join(' &nbsp;|&nbsp; ')
    : 'No Artifact / EE / Imprint set';

  return `
        <div style="padding:8px 4px">
            <p style="color:var(--font-color);font-size:11px;margin:0 0 4px;opacity:0.7">
                ${aeiNote}
            </p>
            <table class="baseStatsTable">
                <colgroup>
                    <col style="width:28%">
                    <col style="width:24%">
                    <col style="width:24%">
                    <col style="width:24%">
                </colgroup>
                <thead>
                    <tr>
                        <th class="baseStatLabel">Stat</th>
                        <th class="baseStatValue">Base (6&#9733;)</th>
                        <th class="baseStatValue">w/ Bonus</th>
                        <th class="baseStatValue">w/ Bonus + AEI</th>
                    </tr>
                </thead>
                <tbody>
                    ${statRow('Attack', base.atk, withBonusAtk, withAeiAtk)}
                    ${statRow('Defense', base.def, withBonusDef, withAeiDef)}
                    ${statRow('Health', base.hp, withBonusHp, withAeiHp)}
                    ${statRow('Speed', base.spd, withBonusSpd, withAeiSpd)}
                    ${pctRow('Crit Rate', baseCr, withBonusCr, withAeiCr)}
                    ${pctRow('Crit Dmg', baseCd, withBonusCd, withAeiCd)}
                    ${pctRow('Effectiveness', baseEff, withBonusEff, withAeiEff)}
                    ${pctRow('Effect Res', baseRes, withBonusRes, withAeiRes)}
                </tbody>
            </table>
            ${passiveNote}
        </div>`;
}

export default Dialog;

// ─── Per-Slot Substat Pre-Filter Dialog ─────────────────────────────────────

// Substats that cannot appear on a slot — either because they are the fixed
// main stat for that slot, or because the game prevents them as substats.
const SLOT_MAIN_STATS = {
  Weapon: 'Attack',
  Helmet: 'Health',
  Armor: 'Defense',
};

const SLOT_EXCLUDED_SUBSTATS = {
  Weapon: ['Attack', 'Defense', 'DefensePercent'],
  Helmet: ['Health'],
  Armor: ['Defense', 'Attack', 'AttackPercent'],
};

const ALL_SUBSTATS = [
  { type: 'AttackPercent', label: 'Atk%' },
  { type: 'Attack', label: 'ATK' },
  { type: 'HealthPercent', label: 'HP%' },
  { type: 'Health', label: 'HP' },
  { type: 'DefensePercent', label: 'DEF%' },
  { type: 'Defense', label: 'DEF' },
  { type: 'Speed', label: 'Spd' },
  { type: 'CriticalHitChancePercent', label: 'CC%' },
  { type: 'CriticalHitDamagePercent', label: 'CD%' },
  { type: 'EffectivenessPercent', label: 'EFF%' },
  { type: 'EffectResistancePercent', label: 'ER%' },
];

const GEAR_SLOTS = [
  { key: 'Weapon', label: 'Weapon', icon: './assets/gearweapon.png' },
  { key: 'Helmet', label: 'Helmet', icon: './assets/gearhelmet.png' },
  { key: 'Armor', label: 'Armor', icon: './assets/geararmor.png' },
  { key: 'Necklace', label: 'Necklace', icon: './assets/gearnecklace.png' },
  { key: 'Ring', label: 'Ring', icon: './assets/gearring.png' },
  { key: 'Boots', label: 'Boots', icon: './assets/gearboots.png' },
];

Dialog.slotSubstatFilterDialog = async function slotSubstatFilterDialog(
  currentFilters,
  index,
) {
  const tabButtons = GEAR_SLOTS.map(
    (s, i) =>
      `<button type="button" class="ssf-tab${i === 0 ? ' ssf-tab-active' : ''}" data-slot="${s.key}" style="display:flex;align-items:center;gap:4px;padding:4px 8px;border:1px solid #555;background:#2a2a2a;color:#ccc;cursor:pointer;border-radius:4px;font-size:12px">
            <img src="${s.icon}" width="16" height="16" style="vertical-align:middle"> ${s.label}
         </button>`,
  ).join('');

  const panels = GEAR_SLOTS.map((s, i) => {
    const excluded = SLOT_EXCLUDED_SUBSTATS[s.key] || [];
    const sf = currentFilters?.[s.key] || {};
    const enabledChecked = sf.enabled ? 'checked' : '';
    const currentSubstats = sf.substats || [];
    const currentCount = sf.minCount || 1;

    const checkboxes = ALL_SUBSTATS.map((sub) => {
      const isExcluded = excluded.includes(sub.type);
      const isMainStat = SLOT_MAIN_STATS[s.key] === sub.type;
      const isChecked =
        !isExcluded && currentSubstats.includes(sub.type) ? 'checked' : '';
      const disabledAttr = isExcluded ? 'disabled' : '';
      const opacityStyle = isExcluded ? 'opacity:0.3;' : '';
      const titleAttr = isMainStat
        ? 'title="Fixed main stat — cannot be a substat"'
        : '';
      const mainStatTag = isMainStat
        ? '<span style="font-size:10px;color:#888;margin-left:2px">(main)</span>'
        : '';
      return `<label style="${opacityStyle}display:flex;align-items:center;gap:4px;font-size:12px;cursor:${isExcluded ? 'default' : 'pointer'}" ${titleAttr}>
                <input type="checkbox" class="ssf-sub" data-slot="${s.key}" value="${sub.type}" ${isChecked} ${disabledAttr}>
                ${sub.label}${mainStatTag}
            </label>`;
    }).join('');

    return `<div class="ssf-panel" data-slot="${s.key}" style="display:${i === 0 ? 'block' : 'none'}">
            <div style="margin-bottom:8px">
                <label style="display:flex;align-items:center;gap:6px;font-size:13px;font-weight:bold;cursor:pointer">
                    <input type="checkbox" class="ssf-enabled" data-slot="${s.key}" ${enabledChecked}>
                    Enable filter for ${s.label}
                </label>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px 12px;margin:8px 0">
                ${checkboxes}
            </div>
            <div style="display:flex;align-items:center;gap:8px;margin-top:8px;font-size:13px">
                <span>Require at least:</span>
                <button type="button" class="ssf-minus" data-slot="${s.key}" style="width:24px;height:24px;border:1px solid #666;background:#333;color:#ccc;cursor:pointer;border-radius:3px;font-size:14px;line-height:1">−</button>
                <span class="ssf-count" data-slot="${s.key}" style="min-width:16px;text-align:center;font-weight:bold">${currentCount}</span>
                <button type="button" class="ssf-plus" data-slot="${s.key}" style="width:24px;height:24px;border:1px solid #666;background:#333;color:#ccc;cursor:pointer;border-radius:3px;font-size:14px;line-height:1">+</button>
                <span style="color:#999">substats matched</span>
            </div>
        </div>`;
  }).join('');

  const html = `
        <div style="color:#ccc;text-align:left">
            <div style="display:flex;gap:4px;flex-wrap:wrap;align-items:center;margin-bottom:10px">
                ${tabButtons}
                <div style="margin-left:auto;display:flex;gap:4px">
                    <button type="button" id="ssf-enable-all" style="padding:3px 8px;border:1px solid #51A259;background:transparent;color:#51A259;cursor:pointer;border-radius:3px;font-size:11px">Enable All</button>
                    <button type="button" id="ssf-disable-all" style="padding:3px 8px;border:1px solid #888;background:transparent;color:#aaa;cursor:pointer;border-radius:3px;font-size:11px">Disable All</button>
                </div>
            </div>
            <div id="ssf-panels">
                ${panels}
            </div>
        </div>`;

  const result = await Swal.fire({
    title: 'Per-Slot Substat Filter',
    html,
    width: '520px',
    background: '#1e1e1e',
    showCancelButton: true,
    confirmButtonText: 'Apply',
    cancelButtonText: 'Cancel',
    didOpen: () => {
      const container = Swal.getHtmlContainer();

      // Tab switching
      container.querySelectorAll('.ssf-tab').forEach((btn) => {
        btn.addEventListener('click', () => {
          container
            .querySelectorAll('.ssf-tab')
            .forEach((b) => b.classList.remove('ssf-tab-active'));
          btn.classList.add('ssf-tab-active');
          const slot = btn.dataset.slot;
          container.querySelectorAll('.ssf-panel').forEach((p) => {
            p.style.display = p.dataset.slot === slot ? 'block' : 'none';
          });
        });
      });

      // Highlight active tabs
      const updateTabHighlight = () => {
        container.querySelectorAll('.ssf-tab').forEach((btn) => {
          const slot = btn.dataset.slot;
          const enabledCb = container.querySelector(
            `.ssf-enabled[data-slot="${slot}"]`,
          );
          const hasSubs =
            container.querySelectorAll(`.ssf-sub[data-slot="${slot}"]:checked`)
              .length > 0;
          if (enabledCb?.checked && hasSubs) {
            btn.style.borderColor = '#51A259';
            btn.style.color = '#51A259';
          } else {
            btn.style.borderColor = '#555';
            btn.style.color = '#ccc';
          }
        });
      };

      container.querySelectorAll('.ssf-enabled, .ssf-sub').forEach((el) => {
        el.addEventListener('change', updateTabHighlight);
      });
      updateTabHighlight();

      // Enable All / Disable All
      container
        .querySelector('#ssf-enable-all')
        .addEventListener('click', () => {
          container.querySelectorAll('.ssf-enabled').forEach((cb) => {
            cb.checked = true;
          });
          updateTabHighlight();
        });
      container
        .querySelector('#ssf-disable-all')
        .addEventListener('click', () => {
          container.querySelectorAll('.ssf-enabled').forEach((cb) => {
            cb.checked = false;
          });
          updateTabHighlight();
        });

      // +/- buttons
      container.querySelectorAll('.ssf-minus').forEach((btn) => {
        btn.addEventListener('click', () => {
          const slot = btn.dataset.slot;
          const countEl = container.querySelector(
            `.ssf-count[data-slot="${slot}"]`,
          );
          const val = Number.parseInt(countEl.textContent, 10) || 1;
          if (val > 1) countEl.textContent = val - 1;
        });
      });
      container.querySelectorAll('.ssf-plus').forEach((btn) => {
        btn.addEventListener('click', () => {
          const slot = btn.dataset.slot;
          const countEl = container.querySelector(
            `.ssf-count[data-slot="${slot}"]`,
          );
          const val = Number.parseInt(countEl.textContent, 10) || 1;
          if (val < 4) countEl.textContent = val + 1;
        });
      });
    },
    preConfirm: () => {
      const container = Swal.getHtmlContainer();
      const slotFilters = {};
      GEAR_SLOTS.forEach(({ key }) => {
        const enabledCb = container.querySelector(
          `.ssf-enabled[data-slot="${key}"]`,
        );
        const enabled = enabledCb ? enabledCb.checked : false;
        const substats = Array.from(
          container.querySelectorAll(`.ssf-sub[data-slot="${key}"]:checked`),
        ).map((cb) => cb.value);
        const countEl = container.querySelector(
          `.ssf-count[data-slot="${key}"]`,
        );
        const minCount = countEl
          ? Number.parseInt(countEl.textContent, 10) || 1
          : 1;
        slotFilters[key] = { enabled, substats, minCount };
      });
      return { slotFilters };
    },
  });

  if (result.isConfirmed) {
    return result.value;
  }
  return null;
};

// ─── Per-Slot Stat Floor Pre-Filter Dialog ───────────────────────────────────

const STAT_FLOOR_CONFIG = [
  { type: 'Speed', label: 'Spd', max: 60 },
  { type: 'AttackPercent', label: 'Atk%', max: 25 },
  { type: 'Attack', label: 'ATK', max: 400 },
  { type: 'HealthPercent', label: 'HP%', max: 25 },
  { type: 'Health', label: 'HP', max: 1800 },
  { type: 'DefensePercent', label: 'DEF%', max: 25 },
  { type: 'Defense', label: 'DEF', max: 200 },
  { type: 'CriticalHitChancePercent', label: 'CC%', max: 25 },
  { type: 'CriticalHitDamagePercent', label: 'CD%', max: 35 },
  { type: 'EffectivenessPercent', label: 'EFF%', max: 25 },
  { type: 'EffectResistancePercent', label: 'ER%', max: 25 },
];

Dialog.slotStatFloorDialog = async function slotStatFloorDialog(
  currentFilters,
  index,
) {
  const tabButtons = GEAR_SLOTS.map(
    (s, i) =>
      `<button type="button" class="ssfl-tab${i === 0 ? ' ssfl-tab-active' : ''}" data-slot="${s.key}" style="display:flex;align-items:center;gap:4px;padding:4px 8px;border:1px solid #555;background:#2a2a2a;color:#ccc;cursor:pointer;border-radius:4px;font-size:12px">
          <img src="${s.icon}" width="16" height="16" style="vertical-align:middle"> ${s.label}
       </button>`,
  ).join('');

  const panels = GEAR_SLOTS.map((s, i) => {
    const excluded = SLOT_EXCLUDED_SUBSTATS[s.key] || [];
    const sf = currentFilters?.[s.key] || {};
    const enabledChecked = sf.enabled ? 'checked' : '';
    const floors = sf.floors || {};

    const inputs = STAT_FLOOR_CONFIG.map((stat) => {
      if (excluded.includes(stat.type)) return '';
      const val = floors[stat.type] != null ? floors[stat.type] : '';
      return `<label style="display:flex;align-items:center;justify-content:space-between;gap:6px;font-size:12px;padding:2px 0">
          <span style="min-width:32px">${stat.label}</span>
          <input type="number" class="ssfl-input" data-slot="${s.key}" data-stat="${stat.type}"
            value="${val}" min="0" max="${stat.max}" step="1" placeholder="0"
            style="width:56px;background:#333;border:1px solid #555;color:#ccc;padding:2px 4px;border-radius:3px;font-size:12px;text-align:right">
      </label>`;
    })
      .filter(Boolean)
      .join('');

    return `<div class="ssfl-panel" data-slot="${s.key}" style="display:${i === 0 ? 'block' : 'none'}">
        <div style="margin-bottom:8px">
            <label style="display:flex;align-items:center;gap:6px;font-size:13px;font-weight:bold;cursor:pointer">
                <input type="checkbox" class="ssfl-enabled" data-slot="${s.key}" ${enabledChecked}>
                Enable floor for ${s.label}
            </label>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px 20px;margin:8px 0">
            ${inputs}
        </div>
    </div>`;
  }).join('');

  const html = `
      <div style="color:#ccc;text-align:left">
          <p style="font-size:11px;color:#999;margin:0 0 8px">Items with a substat below the minimum are dropped before mod expansion. Set to 0 to disable a floor.</p>
          <div style="display:flex;gap:4px;flex-wrap:wrap;align-items:center;margin-bottom:10px">
              ${tabButtons}
              <div style="margin-left:auto;display:flex;gap:4px">
                  <button type="button" id="ssfl-disable-all" style="padding:3px 8px;border:1px solid #888;background:transparent;color:#aaa;cursor:pointer;border-radius:3px;font-size:11px">Disable All</button>
                  <button type="button" id="ssfl-clear-all" style="padding:3px 8px;border:1px solid #888;background:transparent;color:#aaa;cursor:pointer;border-radius:3px;font-size:11px">Clear All</button>
              </div>
          </div>
          <div id="ssfl-panels">
              ${panels}
          </div>
      </div>`;

  const result = await Swal.fire({
    title: 'Per-Slot Stat Floor Filter',
    html,
    width: '480px',
    background: '#1e1e1e',
    showCancelButton: true,
    confirmButtonText: 'Apply',
    cancelButtonText: 'Cancel',
    didOpen: () => {
      const container = Swal.getHtmlContainer();

      container.querySelectorAll('.ssfl-tab').forEach((btn) => {
        btn.addEventListener('click', () => {
          container
            .querySelectorAll('.ssfl-tab')
            .forEach((b) => b.classList.remove('ssfl-tab-active'));
          btn.classList.add('ssfl-tab-active');
          const slot = btn.dataset.slot;
          container.querySelectorAll('.ssfl-panel').forEach((p) => {
            p.style.display = p.dataset.slot === slot ? 'block' : 'none';
          });
        });
      });

      const updateTabHighlight = () => {
        container.querySelectorAll('.ssfl-tab').forEach((btn) => {
          const slot = btn.dataset.slot;
          const enabledCb = container.querySelector(
            `.ssfl-enabled[data-slot="${slot}"]`,
          );
          const hasFloors = Array.from(
            container.querySelectorAll(`.ssfl-input[data-slot="${slot}"]`),
          ).some((inp) => Number(inp.value) > 0);
          if (enabledCb?.checked && hasFloors) {
            btn.style.borderColor = '#51A259';
            btn.style.color = '#51A259';
          } else {
            btn.style.borderColor = '#555';
            btn.style.color = '#ccc';
          }
        });
      };

      container.querySelectorAll('.ssfl-enabled, .ssfl-input').forEach((el) => {
        el.addEventListener('change', updateTabHighlight);
        el.addEventListener('input', updateTabHighlight);
      });
      updateTabHighlight();

      container
        .querySelector('#ssfl-disable-all')
        .addEventListener('click', () => {
          container.querySelectorAll('.ssfl-enabled').forEach((cb) => {
            cb.checked = false;
          });
          updateTabHighlight();
        });

      container
        .querySelector('#ssfl-clear-all')
        .addEventListener('click', () => {
          container.querySelectorAll('.ssfl-input').forEach((inp) => {
            inp.value = '';
          });
          updateTabHighlight();
        });
    },
    preConfirm: () => {
      const container = Swal.getHtmlContainer();
      const slotFilters = {};
      GEAR_SLOTS.forEach(({ key }) => {
        const enabledCb = container.querySelector(
          `.ssfl-enabled[data-slot="${key}"]`,
        );
        const enabled = enabledCb ? enabledCb.checked : false;
        const floors = {};
        container
          .querySelectorAll(`.ssfl-input[data-slot="${key}"]`)
          .forEach((inp) => {
            const val = Number(inp.value);
            if (val > 0) floors[inp.dataset.stat] = val;
          });
        slotFilters[key] = { enabled, floors };
      });
      return { slotFilters };
    },
  });

  if (result.isConfirmed) {
    return result.value;
  }
  return null;
};
