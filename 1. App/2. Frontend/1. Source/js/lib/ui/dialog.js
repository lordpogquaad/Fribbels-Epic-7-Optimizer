/* global $, i18next, Utils, Settings, OptimizerTab, keepGroup, ignoreGroup, modifyGroup */
/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable no-restricted-syntax */
/* eslint-disable consistent-return */
/* eslint-disable no-param-reassign */

import Swal from 'sweetalert2';
import Sortable from 'sortablejs';
import tippy from 'tippy.js';
import Artifact from '../services/artifact';
import Api from '../services/api';
import HeroData from '../services/heroData';
import ItemAugmenter from '../gear/itemAugmenter';
import Reforge from '../gear/reforge';
import Assets from './assets';
import Selectors from './selectors';

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
                1
            )} ${i18next.t('atk')}, ${artifactStats.health.toFixed(
                1
            )} ${i18next.t('hp')}, ${artifactStats.defense.toFixed(
                1
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
        const heroData = HeroData.getHeroExtraInfo(hero.name);

        // console.warn(hero);
        // const heroInfo = heroData[hero.name];
        // const ee = heroInfo.ex_equip[0];

        const result = await Swal.fire({
            title: '',
            width: 600,
            html: `
                    <link href="https://cdn.jsdelivr.net/npm/@sweetalert2/themes@4.0.1/minimal/minimal.min.css" rel="stylesheet">

                    <p style="color: var(--font-color)" data-t>${i18next.t(
                        'Skill options'
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
                                        heroData
                                    )}
                                </div>
                                <div class="tabsContent" id="b">
                                    ${generateSkillOptionsHtml(
                                        'S2',
                                        hero,
                                        heroData
                                    )}
                                </div>
                                <div class="tabsContent" id="c">
                                    ${generateSkillOptionsHtml(
                                        'S3',
                                        hero,
                                        heroData
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                `,
            // Disabled damage
            // html: `
            //     <link href="https://cdn.jsdelivr.net/npm/@sweetalert2/themes@4.0.1/minimal/minimal.min.css" rel="stylesheet">

            //     <p style="color: var(--font-color)" data-t>${i18next.t("Skill options")}</p>
            //     <div class="horizontalSpace"></div>
            //     <div class="horizontalSpace"></div>

            //     <div class="editGearForm tabsWrapperBody">
            //         <div class="tabsWrapper">
            //             <div class="tabsButtonWrapper">
            //                 <button class="tab-button active" style="border-top-left-radius: 10px;" data-id="home">S1</button>
            //                 <button class="tab-button" data-id="about">S2</button>
            //                 <button class="tab-button" style="border-top-right-radius: 10px;" data-id="contact">S3</button>
            //             </div>
            //             <div class="tabsContentWrapper">
            //                 <div class="tabsContent active" id="home">
            //                     ${generateSkillOptionsHtml("S1", hero, heroData)}
            //                 </div>
            //                 <div class="tabsContent" id="about">
            //                     ${generateSkillOptionsHtml("S2", hero, heroData)}
            //                 </div>
            //                 <div class="tabsContent" id="contact">
            //                     ${generateSkillOptionsHtml("S3", hero, heroData)}
            //                 </div>
            //             </div>
            //         </div>
            //     </div>
            // `,
            didOpen: async () => {
                // const options = {
                //     filter: true,
                //     maxHeight: 400,
                //     // customFilter: Utils.customFilter,
                //     filterAcceptOnEnter: true
                // }
                // const statSelectOptions = {
                //     maxHeight: 500,
                //     // customFilter: Utils.customFilter,
                // }

                // $('#editArtifact').multipleSelect(options)
                // $('#editArtifact').change(module.exports.changeArtifact)
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
                // const artifactName = $('#editArtifact').val();
                // const artifactLevel = $('#editArtifactLevel').val();
                // const imprintNumber = $('#editImprint').val();
                // const eeNumber = $('#editEe').val()
                // const stars = $('#editStars').val()

                const skills = ['S1', 'S2', 'S3'];
                const skillOptions = {};

                for (const skill of skills) {
                    skillOptions[skill] = {
                        // attackImprintPercent: parseFloat(document.getElementById(`${skill}EditAttackPercentImprint`).value) || 0,
                        // attackIncreasePercent: parseFloat(document.getElementById(`${skill}EditAttackPercentIncrease`).value) || 0,
                        // damageIncreasePercent: parseFloat(document.getElementById(`${skill}EditDamageIncrease`).value) || 0,
                        // elementalAdvantageEnabled: (document.getElementById(`${skill}EditElementalAdvantageBox`).checked),
                        // decreasedAttackBuffEnabled: (document.getElementById(`${skill}EditDecreasedAttackBox`).checked),
                        // attackBuffEnabled: (document.getElementById(`${skill}EditAttackBuffBox`).checked),
                        // greaterAttackBuffEnabled: (document.getElementById(`${skill}EditGreaterAttackBuffBox`).checked),
                        // critDamageBuffEnabled: (document.getElementById(`${skill}EditCritDamageBuffBox`).checked),
                        // vigorAttackBuffEnabled: (document.getElementById(`${skill}EditVigorAttackBuffBox`).checked),

                        skillEffect: document.getElementById(
                            `${skill}SkillEffect`
                        ).value,
                        // applyToAllSkillsEnabled: (document.getElementById(`${skill}EditApplyToAllSkillsBox`).checked),

                        // targetDefense: parseInt(, 10).value),
                        // targetDefenseIncreasePercent: parseFloat(document.getElementById(`${skill}EditTargetDefenseIncrease`).value) || 0,
                        // targetDamageReductionPercent: parseFloat(document.getElementById(`${skill}EditTargetDamageReduction`).value) || 0,
                        // targetDamageTransferPercent: parseFloat(document.getElementById(`${skill}EditTargetDamageTransfer`).value) || 0,
                        // targetDefenseBuffEnabled: (document.getElementById(`${skill}EditTargetDefenseBuffBox`).checked),
                        // targetVigorDefenseBuffEnabled: (document.getElementById(`${skill}EditTargetVigorBuffBox`).checked),
                        // targetDefenseBreakBuffEnabled: (document.getElementById(`${skill}EditTargetDefenseBreakBox`).checked),
                        // targetTargetBuffEnabled: (document.getElementById(`${skill}EditTargetTargetBuffBox`).checked)
                    };
                }

                return skillOptions;
            },
        });

        return result.value;
    },

    switchBonusTab: (event, tabId) => {
        document.querySelectorAll('.bonusStatsTab').forEach((t) => t.classList.remove('active'));
        document.querySelectorAll('.bonusStatsTabPanel').forEach((p) => { p.style.display = 'none'; });
        event.currentTarget.classList.add('active');
        document.getElementById(tabId).style.display = '';
    },

    editHeroDialog: async (hero) => {
        const heroData = HeroData.getAllHeroData();

        const heroInfo = heroData[hero.name];
        const ee = heroInfo.ex_equip[0];

        const result = await Swal.fire({
            title: '',
            width: 900,
            html: `
                    <div class="editGearForm">
                        <link href="https://cdn.jsdelivr.net/npm/@sweetalert2/themes@4.0.1/minimal/minimal.min.css" rel="stylesheet">

                        <div class="bonusStatsTabs">
                            <button class="bonusStatsTab active" onclick="Dialog.switchBonusTab(event,'bonusTab')">Bonus Stats</button>
                            <button class="bonusStatsTab" onclick="Dialog.switchBonusTab(event,'baseStatsTab')">Base Stats</button>
                        </div>

                        <div id="bonusTab" class="bonusStatsTabPanel">
                        <div class="editGearFormRow">
                            <div class="editGearFormHalf">

                                <p style="color: var(--font-color)" data-t>${i18next.t(
                                    'Add Artifact/EE/Imprint bonus stats'
                                )}</p>

                                <div class="editGearFormRow">
                                    <div class="editGearStatLabel" data-t>${i18next.t(
                                        'Artifact'
                                    )}</div>
                                    <select id="editArtifact" class="editGearStatSelect" onchange="Dialog.changeArtifact()">
                                        ${getArtifactHtml(hero)}
                                    </select>
                                </div>

                                <div class="editGearFormRow">
                                    <div class="editGearStatLabel" data-t>${i18next.t(
                                        'Level'
                                    )}</div>
                                    <select id="editArtifactLevel" class="editGearStatSelect">
                                        ${getArtifactEnhanceHtml(hero)}
                                    </select>
                                </div>

                                <div class="horizontalLineWithMoreSpace"></div>

                                <div class="editGearFormRow">
                                    <div class="editGearStatLabel" data-t>${i18next.t(
                                        'Imprint'
                                    )}</div>
                                    ${getImprintHtml(hero, heroInfo)}
                                </div>

                                <div class="horizontalLineWithMoreSpace"></div>

                                <div class="editGearFormRow">
                                    <div class="editGearStatLabel" data-t>${i18next.t(
                                        'EE'
                                    )}</div>

                                    <select id="editEe" class="editGearStatSelect">
                                        ${getEeEnhanceHtml(hero, ee)}
                                    </select>
                                </div>

                                <div class="horizontalLineWithMoreSpace"></div>

                                <div class="editGearFormRow">
                                    <div class="editGearStatLabel" data-t>${i18next.t(
                                        'Stars'
                                    )}</div>

                                    <select id="editStars" class="editGearStatSelect">
                                        ${getStarsHtml(hero, heroInfo)}
                                    </select>
                                </div>
                            </div>

                            <div class="editGearFormVertical"></div>

                            <div class="editGearFormHalf">
                                <p style="color: var(--font-color)" data-t>${i18next.t(
                                    'Add any other non item bonus stats'
                                )}</p>

                                <div class="editGearFormRow">
                                    <div class="editGearStatLabel" data-t>${i18next.t(
                                        'Attack'
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
                                        'Defense'
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
                                        'Health'
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
                                        'Speed'
                                    )}</div>
                                    <span class="valuePadding input-holder">
                                        <input type="number" class="bonusStatInput" max="100" accuracy="1" min="0" id="editHeroBonusSpeed" value="${
                                            hero.bonusSpeed || ''
                                        }">
                                    </span>
                                </div>

                                <div class="editGearFormRow">
                                    <div class="editGearStatLabel" data-t>${i18next.t(
                                        'Crit Rate'
                                    )}</div>
                                    <span class="valuePadding input-holder">
                                        <input type="number" class="bonusStatInput" max="100" accuracy="1" min="0" id="editHeroBonusCritChance" value="${
                                            hero.bonusCr || ''
                                        }">
                                    </span>
                                </div>

                                <div class="editGearFormRow">
                                    <div class="editGearStatLabel" data-t>${i18next.t(
                                        'Crit Dmg'
                                    )}</div>
                                    <span class="valuePadding input-holder">
                                        <input type="number" class="bonusStatInput" max="100" accuracy="1" min="0" id="editHeroBonusCritDamage" value="${
                                            hero.bonusCd || ''
                                        }">
                                    </span>
                                </div>

                                <div class="editGearFormRow">
                                    <div class="editGearStatLabel" title="Artifact bonus to CD cap (e.g. enter 30 for +30% cap)" data-t>${i18next.t(
                                        'CD Cap Bonus'
                                    )}</div>
                                    <span class="valuePadding input-holder">
                                        <input type="number" class="bonusStatInput" max="200" accuracy="1" min="0" id="editHeroCdCapBonus" value="${
                                            hero.cdCapBonus || ''
                                        }" placeholder="0">
                                    </span>
                                </div>

                                <div class="editGearFormRow">
                                    <div class="editGearStatLabel" data-t>${i18next.t(
                                        'Eff'
                                    )}</div>
                                    <span class="valuePadding input-holder">
                                        <input type="number" class="bonusStatInput" max="100" accuracy="1" min="0" id="editHeroBonusEffectiveness" value="${
                                            hero.bonusEff || ''
                                        }">
                                    </span>
                                </div>

                                <div class="editGearFormRow">
                                    <div class="editGearStatLabel" data-t>${i18next.t(
                                        'Res'
                                    )}</div>
                                    <span class="valuePadding input-holder">
                                        <input type="number" class="bonusStatInput" max="100" accuracy="1" min="0" id="editHeroBonusEffectResistance" value="${
                                            hero.bonusRes || ''
                                        }">
                                    </span>
                                </div>


                                <p style="color: var(--font-color)" data-t>${i18next.t(
                                    'Final stat multipliers (e.g. Lethe artifact)'
                                )}</p>

                                <div class="editGearFormRow">
                                    <div class="editGearStatLabel" data-t>${i18next.t(
                                        'Final Attack'
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
                                        'Final Defense'
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
                                        'Final Health'
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
                    </div>
                `,
            didOpen: async () => {
                const options = {
                    filter: true,
                    maxHeight: 400,
                    // customFilter: Utils.customFilter,
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
                    attack: parseInt(
                        document.getElementById('editHeroBonusAttack').value,
                        10
                    ),
                    defense: parseInt(
                        document.getElementById('editHeroBonusDefense').value,
                        10
                    ),
                    health: parseInt(
                        document.getElementById('editHeroBonusHealth').value,
                        10
                    ),
                    attackPercent: parseFloat(
                        document.getElementById('editHeroBonusAttackPercent')
                            .value
                    ),
                    defensePercent: parseFloat(
                        document.getElementById('editHeroBonusDefensePercent')
                            .value
                    ),
                    healthPercent: parseFloat(
                        document.getElementById('editHeroBonusHealthPercent')
                            .value
                    ),
                    speed: parseInt(
                        document.getElementById('editHeroBonusSpeed').value,
                        10
                    ),
                    critChance: parseFloat(
                        document.getElementById('editHeroBonusCritChance').value
                    ),
                    critDamage: parseFloat(
                        document.getElementById('editHeroBonusCritDamage').value
                    ),
                    effectiveness: parseFloat(
                        document.getElementById('editHeroBonusEffectiveness')
                            .value
                    ),
                    effectResistance: parseFloat(
                        document.getElementById('editHeroBonusEffectResistance')
                            .value
                    ),

                    finalAtkMultiplier: parseFloat(
                        document.getElementById('editHeroFinalAtkMultiplier')
                            .value
                    ),
                    finalDefMultiplier: parseFloat(
                        document.getElementById('editHeroFinalDefMultiplier')
                            .value
                    ),
                    finalHpMultiplier: parseFloat(
                        document.getElementById('editHeroFinalHpMultiplier')
                            .value
                    ),

                    cdCapBonus: parseInt(
                        document.getElementById('editHeroCdCapBonus').value,
                        10
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
                // resolve(editedHero);
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
                                    'Options'
                                )}</div>
                              </div>
                              <div>
                                <input type="checkbox" id="inputPredictReforges${index}" class="optimizer-checkbox" checked>
                                <label for="inputPredictReforges${index}" data-t>${i18next.t(
                'Use reforged stats'
            )}</label>
                              </div>

                              <div>
                                <input type="checkbox" id="inputOrderedHeroPriority${index}" class="optimizer-checkbox">
                                <label for="inputOrderedHeroPriority${index}" data-t>${i18next.t(
                'Use hero priority'
            )}</label>
                              </div>

                              <div>
                                <input type="checkbox" id="inputSubstatMods${index}" class="optimizer-checkbox">
                                <label for="inputSubstatMods${index}" data-t>${i18next.t(
                'Use substat mods'
            )}</label>
                              </div>

                              <div style="display:none">
                                <input type="checkbox" id="inputOnlyMaxedGear${index}" class="optimizer-checkbox">
                                <label for="inputOnlyMaxedGear${index}" data-t>${i18next.t(
                'Only maxed gear'
            )}</label>
                              </div>

                              <div>
                                <input type="checkbox" id="inputAllowLockedItems${index}" class="optimizer-checkbox">
                                <label for="inputAllowLockedItems${index}" data-t>${i18next.t(
                'Locked items'
            )}</label>
                              </div>

                              <div>
                                <input type="checkbox" id="inputAllowEquippedItems${index}" class="optimizer-checkbox">
                                <label for="inputAllowEquippedItems${index}" data-t>${i18next.t(
                'Equipped items'
            )}</label>
                              </div>

                              <div>
                                <input type="checkbox" id="inputKeepCurrentItems${index}" class="optimizer-checkbox">
                                <label for="inputKeepCurrentItems${index}" data-t>${i18next.t(
                'Keep current'
            )}</label>
                              </div>
                              <div class="horizontalSpace"></div>

                              <select id="optionsEnhanceLimit${index}" class="optionsExcludeGearFrom">
                                <option value="0" data-t>${i18next.t(
                                    '+0 and higher'
                                )}</option>
                                <option value="3" data-t>${i18next.t(
                                    '+3 and higher'
                                )}</option>
                                <option value="6" data-t>${i18next.t(
                                    '+6 and higher'
                                )}</option>
                                <option value="9" data-t>${i18next.t(
                                    '+9 and higher'
                                )}</option>
                                <option value="12" data-t>${i18next.t(
                                    '+12 and higher'
                                )}</option>
                                <option value="15" data-t>${i18next.t(
                                    '+15 only'
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
                'Stat filters'
            )}</div>
                              </div>
                              <input type="number" id="inputMinAtkLimit${index}" class="optimizer-number-input stat-number-input">
                              <div class="inputStatLabel" data-t>${i18next.t(
                                  'Atk'
                              )}</div>
                              <input type="number" id="inputMaxAtkLimit${index}" class="optimizer-number-input stat-number-input"><br>
                              <input type="number" id="inputAtkTarget${index}" class="optimizer-number-input stat-number-input" style="margin-left:90px" placeholder="↑T"><br>

                              <input type="number" id="inputMinDefLimit${index}" class="optimizer-number-input stat-number-input">
                              <div class="inputStatLabel" data-t>${i18next.t(
                                  'Def'
                              )}</div>
                              <input type="number" id="inputMaxDefLimit${index}" class="optimizer-number-input stat-number-input"><br>
                              <input type="number" id="inputDefTarget${index}" class="optimizer-number-input stat-number-input" style="margin-left:90px" placeholder="↑T"><br>

                              <input type="number" id="inputMinHpLimit${index}" class="optimizer-number-input stat-number-input">
                              <div class="inputStatLabel" data-t>${i18next.t(
                                  'Hp'
                              )}</div>
                              <input type="number" id="inputMaxHpLimit${index}" class="optimizer-number-input stat-number-input"><br>
                              <input type="number" id="inputHpTarget${index}" class="optimizer-number-input stat-number-input" style="margin-left:90px" placeholder="↑T"><br>

                              <input type="number" id="inputMinSpdLimit${index}" class="optimizer-number-input stat-number-input">
                              <div class="inputStatLabel" data-t>${i18next.t(
                                  'Spd'
                              )}</div>
                              <input type="number" id="inputMaxSpdLimit${index}" class="optimizer-number-input stat-number-input"><br>
                              <input type="number" id="inputSpdTarget${index}" class="optimizer-number-input stat-number-input" style="margin-left:90px" placeholder="↑T"><br>

                              <input type="number" id="inputMinCrLimit${index}" class="optimizer-number-input stat-number-input">
                              <div class="inputStatLabel" data-t>${i18next.t(
                                  'CRate'
                              )}</div>
                              <input type="number" id="inputMaxCrLimit${index}" class="optimizer-number-input stat-number-input"><br>
                              <input type="number" id="inputCrTarget${index}" class="optimizer-number-input stat-number-input" style="margin-left:90px" placeholder="↑T"><br>

                              <input type="number" id="inputMinCdLimit${index}" class="optimizer-number-input stat-number-input">
                              <div class="inputStatLabel" data-t>${i18next.t(
                                  'CDmg'
                              )}</div>
                              <input type="number" id="inputMaxCdLimit${index}" class="optimizer-number-input stat-number-input"><br>
                              <input type="number" id="inputCdTarget${index}" class="optimizer-number-input stat-number-input" style="margin-left:90px" placeholder="↑T"><br>

                              <input type="number" id="inputMinEffLimit${index}" class="optimizer-number-input stat-number-input">
                              <div class="inputStatLabel" data-t>${i18next.t(
                                  'Eff'
                              )}</div>
                              <input type="number" id="inputMaxEffLimit${index}" class="optimizer-number-input stat-number-input"><br>
                              <input type="number" id="inputEffTarget${index}" class="optimizer-number-input stat-number-input" style="margin-left:90px" placeholder="↑T"><br>

                              <input type="number" id="inputMinResLimit${index}" class="optimizer-number-input stat-number-input">
                              <div class="inputStatLabel" data-t>${i18next.t(
                                  'Res'
                              )}</div>
                              <input type="number" id="inputMaxResLimit${index}" class="optimizer-number-input stat-number-input"><br>
                              <input type="number" id="inputResTarget${index}" class="optimizer-number-input stat-number-input" style="margin-left:90px" placeholder="↑T"><br>
                            </div>

                            <div id="placeholder-panel" class="constraints-panel-col-small">
                              <div class="panelLabel">
                                <div class="panelLabelText" id="ratingsLabel${index}" data-t>${i18next.t(
                'Rating filters'
            )}</div>
                              </div>
                              <input type="number" id="inputMinCpLimit${index}" class="optimizer-number-input rating-number-input">
                              <div class="inputStatLabel" data-t>${i18next.t(
                                  'Cp'
                              )}</div>
                              <input type="number" id="inputMaxCpLimit${index}" class="optimizer-number-input rating-number-input"><br>

                              <input type="number" id="inputMinItemGSLimit${index}" class="optimizer-number-input rating-number-input">
                              <div class="inputStatLabel" data-t>${i18next.t(
                                  'ItemGS'
                              )}</div>
                              <input type="number" id="inputMaxItemGSLimit${index}" class="optimizer-number-input rating-number-input"><br>

                              <input type="number" id="inputMinHppsLimit${index}" class="optimizer-number-input rating-number-input">
                              <div class="inputStatLabel" data-t>${i18next.t(
                                  'HpS'
                              )}</div>
                              <input type="number" id="inputMaxHppsLimit${index}" class="optimizer-number-input rating-number-input"><br>

                              <input type="number" id="inputMinEhpLimit${index}" class="optimizer-number-input rating-number-input">
                              <div class="inputStatLabel" data-t>${i18next.t(
                                  'Ehp'
                              )}</div>
                              <input type="number" id="inputMaxEhpLimit${index}" class="optimizer-number-input rating-number-input"><br>

                              <input type="number" id="inputMinEhppsLimit${index}" class="optimizer-number-input rating-number-input">
                              <div class="inputStatLabel" data-t>${i18next.t(
                                  'EhpS'
                              )}</div>
                              <input type="number" id="inputMaxEhppsLimit${index}" class="optimizer-number-input rating-number-input"><br>

                              <input type="number" id="inputMinDmgLimit${index}" class="optimizer-number-input rating-number-input">
                              <div class="inputStatLabel" data-t>${i18next.t(
                                  'Dmg'
                              )}</div>
                              <input type="number" id="inputMaxDmgLimit${index}" class="optimizer-number-input rating-number-input"><br>

                              <input type="number" id="inputMinDmgpsLimit${index}" class="optimizer-number-input rating-number-input">
                              <div class="inputStatLabel" data-t>${i18next.t(
                                  'DmgS'
                              )}</div>
                              <input type="number" id="inputMaxDmgpsLimit${index}" class="optimizer-number-input rating-number-input"><br>

                              <input type="number" id="inputMinMcdmgLimit${index}" class="optimizer-number-input rating-number-input">
                              <div class="inputStatLabel" data-t>${i18next.t(
                                  'Mcd'
                              )}</div>
                              <input type="number" id="inputMaxMcdmgLimit${index}" class="optimizer-number-input rating-number-input"><br>

                              <input type="number" id="inputMinMcdmgpsLimit${index}" class="optimizer-number-input rating-number-input">
                              <div class="inputStatLabel" data-t>${i18next.t(
                                  'McdS'
                              )}</div>
                              <input type="number" id="inputMaxMcdmgpsLimit${index}" class="optimizer-number-input rating-number-input"><br>

                              <input type="number" id="inputMinDmgHLimit${index}" class="optimizer-number-input rating-number-input">
                              <div class="inputStatLabel" data-t>${i18next.t(
                                  'DmgH'
                              )}</div>
                              <input type="number" id="inputMaxDmgHLimit${index}" class="optimizer-number-input rating-number-input"><br>

                              <input type="number" id="inputMinDmgDLimit${index}" class="optimizer-number-input rating-number-input">
                              <div class="inputStatLabel" data-t>${i18next.t(
                                  'DmgD'
                              )}</div>
                              <input type="number" id="inputMaxDmgDLimit${index}" class="optimizer-number-input rating-number-input"><br>

                              <input type="number" id="inputMinScoreLimit${index}" class="optimizer-number-input rating-number-input">
                              <div class="inputStatLabel" data-t>${i18next.t(
                                  'GS'
                              )}</div>
                              <input type="number" id="inputMaxScoreLimit${index}" class="optimizer-number-input rating-number-input"><br>

                              <input type="number" id="inputMinBSLimit${index}" class="optimizer-number-input rating-number-input">
                              <div class="inputStatLabel" data-t>${i18next.t(
                                  'BS'
                              )}</div>
                              <input type="number" id="inputMaxBSLimit${index}" class="optimizer-number-input rating-number-input"><br>

                              <input type="number" id="inputMinPriorityLimit${index}" class="optimizer-number-input rating-number-input">
                              <div class="inputStatLabel" data-t>${i18next.t(
                                  'Prio'
                              )}</div>
                              <input type="number" id="inputMaxPriorityLimit${index}" class="optimizer-number-input rating-number-input"><br>

                              <input type="number" id="inputMinUpgradesLimit${index}" class="optimizer-number-input rating-number-input">
                              <div class="inputStatLabel" data-t>${i18next.t(
                                  'Upg'
                              )}</div>
                              <input type="number" id="inputMaxUpgradesLimit${index}" class="optimizer-number-input rating-number-input"><br>

                              <input type="number" id="inputMinConversionsLimit${index}" class="optimizer-number-input rating-number-input">
                              <div class="inputStatLabel" data-t>${i18next.t(
                                  'Conv'
                              )}</div>
                              <input type="number" id="inputMaxConversionsLimit${index}" class="optimizer-number-input rating-number-input"><br>

                              <input type="number" id="inputMinEquippedLimit${index}" class="optimizer-number-input rating-number-input">
                              <div class="inputStatLabel" data-t>${i18next.t(
                                  'Eq'
                              )}</div>
                              <input type="number" id="inputMaxEquippedLimit${index}" class="optimizer-number-input rating-number-input"><br>

                              <input type="number" id="inputMinS1Limit${index}" class="optimizer-number-input rating-number-input">
                              <div class="inputStatLabel" data-t>${i18next.t(
                                  'S1'
                              )}</div>
                              <input type="number" id="inputMaxS1Limit${index}" class="optimizer-number-input rating-number-input"><br>

                              <input type="number" id="inputMinS2Limit${index}" class="optimizer-number-input rating-number-input">
                              <div class="inputStatLabel" data-t>${i18next.t(
                                  'S2'
                              )}</div>
                              <input type="number" id="inputMaxS2Limit${index}" class="optimizer-number-input rating-number-input"><br>

                              <input type="number" id="inputMinS3Limit${index}" class="optimizer-number-input rating-number-input">
                              <div class="inputStatLabel" data-t>${i18next.t(
                                  'S3'
                              )}</div>
                              <input type="number" id="inputMaxS3Limit${index}" class="optimizer-number-input rating-number-input"><br>

                            </div>

                            <div class="vertical"></div>

                            <div id="stat-priority-panel" class="constraints-panel-col">

                              <div class="panelLabel">
                                <div class="panelLabelText" id="substatPriorityLabel${index}" data-t>${i18next.t(
                'Substat priority'
            )}</div>
                              </div>

                              <div class="sliderRow">
                                <div class="sliderLabel" data-t>${i18next.t(
                                    'Atk'
                                )}</div>
                                <input class="sliderInput" id="atkSlider${index}Input" type="number" value="0" readonly>
                                <div class="sliderContainer"><input class="slider" id="atkSlider${index}" type="range" min="-1" max="3" value="0" step="1"></div>
                              </div>

                              <div class="sliderRow">
                                <div class="sliderLabel" data-t>${i18next.t(
                                    'Def'
                                )}</div>
                                <input class="sliderInput" id="defSlider${index}Input" type="number" value="0" readonly>
                                <div class="sliderContainer"><input class="slider" id="defSlider${index}" type="range" min="-1" max="3" value="0" step="1"></div>
                              </div>

                              <div class="sliderRow">
                                <div class="sliderLabel" data-t>${i18next.t(
                                    'Hp'
                                )}</div>
                                <input class="sliderInput" id="hpSlider${index}Input" type="number" value="0" readonly>
                                <div class="sliderContainer"><input class="slider" id="hpSlider${index}" type="range" min="-1" max="3" value="0" step="1"></div>
                              </div>

                              <div class="sliderRow">
                                <div class="sliderLabel" data-t>${i18next.t(
                                    'Spd'
                                )}</div>
                                <input class="sliderInput" id="spdSlider${index}Input" type="number" value="0" readonly>
                                <div class="sliderContainer"><input class="slider" id="spdSlider${index}" type="range" min="-1" max="3" value="0" step="1"></div>
                              </div>

                              <div class="sliderRow">
                                <div class="sliderLabel" data-t>${i18next.t(
                                    'Cr'
                                )}</div>
                                <input class="sliderInput" id="crSlider${index}Input" type="number" value="0" readonly>
                                <div class="sliderContainer"><input class="slider" id="crSlider${index}" type="range" min="-1" max="3" value="0" step="1"></div>
                              </div>

                              <div class="sliderRow">
                                <div class="sliderLabel" data-t>${i18next.t(
                                    'Cd'
                                )}</div>
                                <input class="sliderInput" id="cdSlider${index}Input" type="number" value="0" readonly>
                                <div class="sliderContainer"><input class="slider" id="cdSlider${index}" type="range" min="-1" max="3" value="0" step="1"></div>
                              </div>

                              <div class="sliderRow">
                                <div class="sliderLabel" data-t>${i18next.t(
                                    'Eff'
                                )}</div>
                                <input class="sliderInput" id="effSlider${index}Input" type="number" value="0" readonly>
                                <div class="sliderContainer"><input class="slider" id="effSlider${index}" type="range" min="-1" max="3" value="0" step="1"></div>
                              </div>


                              <div class="sliderRow">
                                <div class="sliderLabel" data-t>${i18next.t(
                                    'Res'
                                )}</div>
                                <input class="sliderInput" id="resSlider${index}Input" type="number" value="0" readonly>
                                <div class="sliderContainer"><input class="slider" id="resSlider${index}" type="range" min="-1" max="3" value="0" step="1"></div>
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
                                    'Accessory main stats'
                                )}</div>
                              </div>
                              <select multiple="multiple" id="inputNecklaceStat${index}" class="inputGearFilterSelect">
                                <option value="CriticalHitChancePercent" data-t>${i18next.t(
                                    'Crit Chance'
                                )}</option>
                                <option value="CriticalHitDamagePercent" data-t>${i18next.t(
                                    'Crit Damage'
                                )}</option>
                                <option value="AttackPercent" data-t>${i18next.t(
                                    'Attack %'
                                )}</option>
                                <option value="Attack" data-t>${i18next.t(
                                    'Attack'
                                )}</option>
                                <option value="HealthPercent" data-t>${i18next.t(
                                    'Health %'
                                )}</option>
                                <option value="Health" data-t>${i18next.t(
                                    'Health'
                                )}</option>
                                <option value="DefensePercent" data-t>${i18next.t(
                                    'Defense %'
                                )}</option>
                                <option value="Defense" data-t>${i18next.t(
                                    'Defense'
                                )}</option>
                              </select><br>

                              <select multiple="multiple" id="inputRingStat${index}" class="inputGearFilterSelect">
                                <option value="EffectivenessPercent" data-t>${i18next.t(
                                    'Effectiveness'
                                )}</option>
                                <option value="EffectResistancePercent" data-t>${i18next.t(
                                    'Effect Resistance'
                                )}</option>
                                <option value="AttackPercent" data-t>${i18next.t(
                                    'Attack %'
                                )}</option>
                                <option value="Attack" data-t>${i18next.t(
                                    'Attack'
                                )}</option>
                                <option value="HealthPercent" data-t>${i18next.t(
                                    'Health %'
                                )}</option>
                                <option value="Health" data-t>${i18next.t(
                                    'Health'
                                )}</option>
                                <option value="DefensePercent" data-t>${i18next.t(
                                    'Defense %'
                                )}</option>
                                <option value="Defense" data-t>${i18next.t(
                                    'Defense'
                                )}</option>
                              </select><br>

                              <select multiple="multiple" id="inputBootsStat${index}" class="inputGearFilterSelect">
                                <option value="Speed" data-t>${i18next.t(
                                    'Speed'
                                )}</option>
                                <option value="AttackPercent" data-t>${i18next.t(
                                    'Attack %'
                                )}</option>
                                <option value="Attack" data-t>${i18next.t(
                                    'Attack'
                                )}</option>
                                <option value="HealthPercent" data-t>${i18next.t(
                                    'Health %'
                                )}</option>
                                <option value="Health" data-t>${i18next.t(
                                    'Health'
                                )}</option>
                                <option value="DefensePercent" data-t>${i18next.t(
                                    'Defense %'
                                )}</option>
                                <option value="Defense" data-t>${i18next.t(
                                    'Defense'
                                )}</option>
                              </select><br>

                              <div class="panelLabel">
                                <div class="panelLabelText" data-t>${i18next.t(
                                    'Sets'
                                )}</div>
                              </div>
                              <select multiple="multiple" id="inputSet1${index}" class="inputSetFilterSelect">
                                <!-- <option value="None" data-t>None</option> -->
                                <optgroup label="4 Piece" data-t>
                                  <option value="Attack" data-t>${i18next.t(
                                      'Attack'
                                  )}</option>
                                  <option value="Counter" data-t>${i18next.t(
                                      'Counter'
                                  )}</option>
                                  <option value="Destruction" data-t>${i18next.t(
                                      'Destruction'
                                  )}</option>
                                  <option value="Injury" data-t>${i18next.t(
                                      'Injury'
                                  )}</option>
                                  <option value="Lifesteal" data-t>${i18next.t(
                                      'Lifesteal'
                                  )}</option>
                                  <option value="Protection" data-t>${i18next.t(
                                      'Protection'
                                  )}</option>
                                  <option value="Rage" data-t>${i18next.t(
                                      'Rage'
                                  )}</option>
                                  <option value="Revenge" data-t>${i18next.t(
                                      'Revenge'
                                  )}</option>
                                  <option value="Reversal" data-t>${i18next.t(
                                      'Reversal'
                                  )}</option>
                                  <option value="Riposte" data-t>${i18next.t(
                                      'Riposte'
                                  )}</option>
                                  <option value="Speed" data-t>${i18next.t(
                                      'Speed'
                                  )}</option>
                                </optgroup>
                                <optgroup label="2 Piece" data-t>
                                  <option value="Critical" data-t>${i18next.t(
                                      'Critical'
                                  )}</option>
                                  <option value="Defense" data-t>${i18next.t(
                                      'Defense'
                                  )}</option>
                                  <option value="Health" data-t>${i18next.t(
                                      'Health'
                                  )}</option>
                                  <option value="Hit" data-t>${i18next.t(
                                      'Hit'
                                  )}</option>
                                  <option value="Immunity" data-t>${i18next.t(
                                      'Immunity'
                                  )}</option>
                                  <option value="Penetration" data-t>${i18next.t(
                                      'Penetration'
                                  )}</option>
                                  <option value="Resist" data-t>${i18next.t(
                                      'Resist'
                                  )}</option>
                                  <option value="Torrent" data-t>${i18next.t(
                                      'Torrent'
                                  )}</option>
                                  <option value="Unity" data-t>${i18next.t(
                                      'Unity'
                                  )}</option>
                                </optgroup>
                              </select><br>

                              <select multiple="multiple" id="inputSet2${index}" class="inputSetFilterSelect">
                                <!-- <option value="None" data-t>None</option> -->
                                <optgroup label="2 Piece" data-t>
                                  <option value="Critical" data-t>${i18next.t(
                                      'Critical'
                                  )}</option>
                                  <option value="Defense" data-t>${i18next.t(
                                      'Defense'
                                  )}</option>
                                  <option value="Health" data-t>${i18next.t(
                                      'Health'
                                  )}</option>
                                  <option value="Hit" data-t>${i18next.t(
                                      'Hit'
                                  )}</option>
                                  <option value="Immunity" data-t>${i18next.t(
                                      'Immunity'
                                  )}</option>
                                  <option value="Penetration" data-t>${i18next.t(
                                      'Penetration'
                                  )}</option>
                                  <option value="Resist" data-t>${i18next.t(
                                      'Resist'
                                  )}</option>
                                  <option value="Torrent" data-t>${i18next.t(
                                      'Torrent'
                                  )}</option>
                                  <option value="Unity" data-t>${i18next.t(
                                      'Unity'
                                  )}</option>
                                </optgroup>
                              </select><br>

                              <select multiple="multiple" id="inputSet3${index}" class="inputSetFilterSelect">
                                <!-- <option value="None" data-t>None</option> -->
                                <optgroup label="2 Piece" data-t>
                                  <option value="Critical" data-t>${i18next.t(
                                      'Critical'
                                  )}</option>
                                  <option value="Defense" data-t>${i18next.t(
                                      'Defense'
                                  )}</option>
                                  <option value="Health" data-t>${i18next.t(
                                      'Health'
                                  )}</option>
                                  <option value="Hit" data-t>${i18next.t(
                                      'Hit'
                                  )}</option>
                                  <option value="Immunity" data-t>${i18next.t(
                                      'Immunity'
                                  )}</option>
                                  <option value="Penetration" data-t>${i18next.t(
                                      'Penetration'
                                  )}</option>
                                  <option value="Resist" data-t>${i18next.t(
                                      'Resist'
                                  )}</option>
                                  <option value="Torrent" data-t>${i18next.t(
                                      'Torrent'
                                  )}</option>
                                  <option value="Unity" data-t>${i18next.t(
                                      'Unity'
                                  )}</option>
                                </optgroup>
                              </select>

                              <div class="panelLabel">
                                <div class="panelLabelText" data-t>${i18next.t(
                                    'Exclude'
                                )}</div>
                              </div>
                              <select multiple="multiple" id="inputExcludeSet${index}" class="inputSetFilterSelect">
                                <!-- <option value="None" data-t>None</option> -->
                                <optgroup label="4 Piece" data-t>
                                  <option value="Attack" data-t>${i18next.t(
                                      'Attack'
                                  )}</option>
                                  <option value="Counter" data-t>${i18next.t(
                                      'Counter'
                                  )}</option>
                                  <option value="Destruction" data-t>${i18next.t(
                                      'Destruction'
                                  )}</option>
                                  <option value="Injury" data-t>${i18next.t(
                                      'Injury'
                                  )}</option>
                                  <option value="Lifesteal" data-t>${i18next.t(
                                      'Lifesteal'
                                  )}</option>
                                  <option value="Protection" data-t>${i18next.t(
                                      'Protection'
                                  )}</option>
                                  <option value="Rage" data-t>${i18next.t(
                                      'Rage'
                                  )}</option>
                                  <option value="Revenge" data-t>${i18next.t(
                                      'Revenge'
                                  )}</option>
                                  <option value="Reversal" data-t>${i18next.t(
                                      'Reversal'
                                  )}</option>
                                  <option value="Riposte" data-t>${i18next.t(
                                      'Riposte'
                                  )}</option>
                                  <option value="Speed" data-t>${i18next.t(
                                      'Speed'
                                  )}</option>
                                </optgroup>
                                <optgroup label="2 Piece" data-t>
                                  <option value="Critical" data-t>${i18next.t(
                                      'Critical'
                                  )}</option>
                                  <option value="Defense" data-t>${i18next.t(
                                      'Defense'
                                  )}</option>
                                  <option value="Health" data-t>${i18next.t(
                                      'Health'
                                  )}</option>
                                  <option value="Hit" data-t>${i18next.t(
                                      'Hit'
                                  )}</option>
                                  <option value="Immunity" data-t>${i18next.t(
                                      'Immunity'
                                  )}</option>
                                  <option value="Penetration" data-t>${i18next.t(
                                      'Penetration'
                                  )}</option>
                                  <option value="Resist" data-t>${i18next.t(
                                      'Resist'
                                  )}</option>
                                  <option value="Torrent" data-t>${i18next.t(
                                      'Torrent'
                                  )}</option>
                                  <option value="Unity" data-t>${i18next.t(
                                      'Unity'
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
                            return `<div class="selectorSetContainer"><img class="selectorSetImage" src="${asset}"></img><div class="selectorSetText">${el.html()}</div></div>`;
                        }

                        return el.html();
                    },
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
                    formatSelectAll() {
                        return i18next.t('[Select all]');
                    },
                });
                $(`#inputRingStat${index}`).multipleSelect({
                    ...selectAllMultipleSelectOptions,
                    placeholder: i18next.t('Ring'),
                    formatSelectAll() {
                        return i18next.t('[Select all]');
                    },
                });
                $(`#inputBootsStat${index}`).multipleSelect({
                    ...selectAllMultipleSelectOptions,
                    placeholder: i18next.t('Boots'),
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
                    `optionsExcludeGearFrom${index}`
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
                    const selects = $(
                        `#optionsExcludeGearFrom${index}`
                    ).multipleSelect('getSelects');
                    $('#optionsExcludeGearFrom').multipleSelect(
                        'setSelects',
                        selects
                    );
                    $('#optionsExcludeGearFrom').multipleSelect('refresh');
                    Settings.saveSettings();
                });

                $(`#optionsEnhanceLimit${index}`).change(() => {
                    const selects = $(
                        `#optionsEnhanceLimit${index}`
                    ).multipleSelect('getSelects');
                    $('#optionsEnhanceLimit').multipleSelect(
                        'setSelects',
                        selects
                    );
                    $('#optionsEnhanceLimit').multipleSelect('refresh');
                    Settings.saveSettings();
                });

                $(`#optionsEnhanceLimit${index}`).multipleSelect({
                    ...enhanceOptions,
                    placeholder: i18next.t('Minimum enhance'),
                    selectAll: false,
                });
                const selects = $('#optionsEnhanceLimit').multipleSelect(
                    'getSelects'
                );
                $(`#optionsEnhanceLimit${index}`).multipleSelect(
                    'setSelects',
                    selects
                );
                $(`#optionsEnhanceLimit${index}`).multipleSelect('refresh');

                OptimizerTab.loadPreviousHeroFilters(
                    { hero },
                    index,
                    false,
                    'multiOptimizer'
                );

                document.getElementById(`openSlotSubstatFilter${index}`).addEventListener('click', async () => {
                    const result = await Dialog.slotSubstatFilterDialog(
                        OptimizerTab.getSlotSubstatFilters(index),
                        index
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
                    index
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
        const heroData = HeroData.getAllHeroData();

        const heroInfo = heroData[hero.name];

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

        function slotOptionSelectHtml(id, currentVal, options) {
            const isNull = currentVal === null || currentVal === undefined;
            return `<select class="editGearStatSelect slotOptionSelect" id="${id}">
                <option value="">← global</option>
                ${options
                    .map(
                        (o) =>
                            `<option value="${o.value}" ${
                                !isNull &&
                                String(currentVal) === String(o.value)
                                    ? 'selected'
                                    : ''
                            }>${o.label}</option>`
                    )
                    .join('')}
            </select>`;
        }

        const slotTabPanelsHtml = SLOTS.map((slot) => {
            const existingCfg =
                hero.slotModConfig && hero.slotModConfig[slot];
            const hasOverride = !!existingCfg;

            const limitRollsSelect = slotOptionSelectHtml(
                `slotLimitRolls_${slot}`,
                existingCfg?.limitRolls ?? null,
                [1, 2, 3, 4, 5, 6].map((n) => ({ value: n, label: String(n) }))
            );
            const modGradeSelect = slotOptionSelectHtml(
                `slotModGrade_${slot}`,
                existingCfg?.modGrade ?? null,
                [
                    { value: 'lesser', label: i18next.t('Lesser') },
                    { value: 'greater', label: i18next.t('Greater') },
                ]
            );
            const rollQualitySelect = slotOptionSelectHtml(
                `slotRollQuality_${slot}`,
                existingCfg?.rollQuality ?? null,
                rollQualityOptions
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
                ]
            );

            return `
                <div class="modTabPanel modTabPanelHidden" id="modTabPanel_${slot}">
                    <div class="slotOverrideRow">
                        <label class="slotOverrideLabel">
                            <input type="checkbox" id="slotOverride_${slot}" class="slotOverrideCheckbox" data-slot="${slot}" ${
                hasOverride ? 'checked' : ''
            }>
                            <span data-t>${i18next.t(
                                'Custom config for this slot'
                            )}</span>
                        </label>
                    </div>
                    <div class="slotOptionsSection${
                        !hasOverride ? ' slotSectionDimmed' : ''
                    }" id="slotOptionsSection_${slot}">
                        <p class="slotOptionsSectionLabel" data-t>${i18next.t(
                            'Options (blank = inherit from Global)'
                        )}</p>
                        <div class="editGearFormRow">
                            <div class="editGearStatLabel" data-t>${i18next.t(
                                'Limit Rolls'
                            )}</div>
                            ${limitRollsSelect}
                        </div>
                        <div class="editGearFormRow">
                            <div class="editGearStatLabel" data-t>${i18next.t(
                                'Mod Grade'
                            )}</div>
                            ${modGradeSelect}
                        </div>
                        <div class="editGearFormRow">
                            <div class="editGearStatLabel" data-t>${i18next.t(
                                'Roll Quality'
                            )}</div>
                            ${rollQualitySelect}
                        </div>
                        <div class="editGearFormRow">
                            <div class="editGearStatLabel" data-t>${i18next.t(
                                'Wanted Stats'
                            )}</div>
                            ${keepStatOptionsSelect}
                        </div>
                    </div>
                    <div class="slotRuleSection${
                        !hasOverride ? ' slotSectionDimmed' : ''
                    }" id="slotRuleSection_${slot}">
                        <p class="slotRuleSectionLabel" data-t>${i18next.t(
                            'Rules (first matching rule applies)'
                        )}</p>
                        <div class="ruleList" id="ruleList_${slot}"></div>
                        <div class="ruleListButtons">
                            <button class="addRuleBtn modListBtn" data-slot="${slot}" type="button">+ ${i18next.t(
                'Add rule'
            )}</button>
                            <button class="generateRulesBtn modListBtn" data-slot="${slot}" type="button">⚙ ${i18next.t(
                'Generate from config'
            )}</button>
                            <button class="copySlotBtn modListBtn" data-slot="${slot}" type="button">📋 ${i18next.t(
                'Copy to...'
            )}</button>
                        </div>
                        <div class="copySlotPicker" id="copySlotPicker_${slot}" style="display:none">
                            <span class="copySlotPickerLabel">${i18next.t('Copy all rules & options to:')}</span>
                            ${SLOTS.filter((s) => s !== slot).map((targetSlot) =>
                                `<button class="copySlotTarget modListBtn" data-from="${slot}" data-to="${targetSlot}" type="button">${i18next.t(targetSlot)}</button>`
                            ).join('')}
                            <button class="copySlotCancel modListBtn" data-slot="${slot}" type="button">✕</button>
                        </div>
                    </div>
                </div>`;
        }).join('');

        const { value: formValues } = await Swal.fire({
            title: '',
            width: 1350,
            html: `
                    <div class="editGearForm">
                        <link href="https://cdn.jsdelivr.net/npm/@sweetalert2/themes@4.0.1/minimal/minimal.min.css" rel="stylesheet">

                        <p style="color: var(--font-color)" data-t>${i18next.t(
                            'Substat modification priority'
                        )}</p>

                        <div class="modTopButtonsRow">
                            <button type="button" id="toggleAllSlotsBtn" class="modListBtn" data-t>${i18next.t(
                                'Toggle All Slots'
                            )}</button>
                            <button type="button" id="generateAllSlotsBtn" class="modListBtn" data-t>⚙ ${i18next.t(
                                'Generate All from Config'
                            )}</button>
                            <button type="button" id="modResetBtn" class="modListBtn modResetBtn" data-t>↺ ${i18next.t(
                                'Reset'
                            )}</button>
                            <button type="button" id="modSaveBtn" class="modListBtn modSaveBtn" data-t>💾 ${i18next.t(
                                'Save'
                            )}</button>
                        </div>

                        <div class="modSlotTabBar">
                            <div class="modSlotTab modSlotTabActive" id="modTab_Global" data-tab="Global">${i18next.t(
                                'Global'
                            )}</div>
                            ${SLOTS.map(
                                (slot) =>
                                    `<div class="modSlotTab" id="modTab_${slot}" data-tab="${slot}">${i18next.t(
                                        slot
                                    )}</div>`
                            ).join('')}
                        </div>

                        <div class="modTabsContentRow">

                            <div class="modTabsLeft">
                                <div class="modTabPanel" id="modTabPanel_Global">

                            <div class="editGearFormHalf">
                                <p style="color: var(--font-color)" data-t>${i18next.t(
                                    'Options'
                                )}</p>

                                <div class="editGearFormRow">
                                    <div class="editGearStatLabel" id="limitRollsLabel" data-t>${i18next.t(
                                        'Limit Rolls'
                                    )}</div>
                                    <select id="limitRolls" class="editGearStatSelect">
                                        <option value=1 ${
                                            hero.limitRolls === 1
                                                ? 'selected'
                                                : ''
                                        }>1</option>
                                        <option value=2 ${
                                            hero.limitRolls === 2 ||
                                            !hero.limitRolls
                                                ? 'selected'
                                                : ''
                                        }>2</option>
                                        <option value=3 ${
                                            hero.limitRolls === 3
                                                ? 'selected'
                                                : ''
                                        }>3</option>
                                        <option value=4 ${
                                            hero.limitRolls === 4
                                                ? 'selected'
                                                : ''
                                        }>4</option>
                                        <option value=5 ${
                                            hero.limitRolls === 5
                                                ? 'selected'
                                                : ''
                                        }>5</option>
                                        <option value=6 ${
                                            hero.limitRolls === 6
                                                ? 'selected'
                                                : ''
                                        }>6</option>
                                    </select>
                                </div>

                                <div class="editGearFormRow">
                                    <div class="editGearStatLabel" id="modGradeLabel"  data-t>${i18next.t(
                                        'Mod Grade'
                                    )}</div>
                                    <select id="modGrade" class="editGearStatSelect">
                                        <option value="lesser" ${
                                            hero.modGrade === 'lesser'
                                                ? 'selected'
                                                : ''
                                        }>${i18next.t('Lesser')}</option>
                                        <option value="greater" ${
                                            hero.modGrade === 'greater' ||
                                            !hero.modGrade
                                                ? 'selected'
                                                : ''
                                        }>${i18next.t('Greater')}</option>
                                    </select>
                                </div>

                                <div class="editGearFormRow">
                                    <div class="editGearStatLabel" id="rollQualityLabel"  data-t>${i18next.t(
                                        'Roll Quality'
                                    )}</div>
                                    <select id="rollQuality" class="editGearStatSelect">
                                        <option value=0 ${
                                            hero.rollQuality === 0
                                                ? 'selected'
                                                : ''
                                        }>Min</option>
                                        <option value=10 ${
                                            hero.rollQuality === 10
                                                ? 'selected'
                                                : ''
                                        }>10%</option>
                                        <option value=20 ${
                                            hero.rollQuality === 20
                                                ? 'selected'
                                                : ''
                                        }>20%</option>
                                        <option value=30 ${
                                            hero.rollQuality === 30
                                                ? 'selected'
                                                : ''
                                        }>30%</option>
                                        <option value=40 ${
                                            hero.rollQuality === 40
                                                ? 'selected'
                                                : ''
                                        }>40%</option>
                                        <option value=50 ${
                                            hero.rollQuality === 50 ||
                                            hero.rollQuality == null
                                                ? 'selected'
                                                : ''
                                        }>50%</option>
                                        <option value=60 ${
                                            hero.rollQuality === 60
                                                ? 'selected'
                                                : ''
                                        }>60%</option>
                                        <option value=70 ${
                                            hero.rollQuality === 70
                                                ? 'selected'
                                                : ''
                                        }>70%</option>
                                        <option value=80 ${
                                            hero.rollQuality === 80
                                                ? 'selected'
                                                : ''
                                        }>80%</option>
                                        <option value=90 ${
                                            hero.rollQuality === 90
                                                ? 'selected'
                                                : ''
                                        }>90%</option>
                                        <option value=100 ${
                                            hero.rollQuality === 100
                                                ? 'selected'
                                                : ''
                                        }>Max</option>
                                    </select>
                                </div>

                                <div class="editGearFormRow">
                                    <div class="editGearStatLabel" id="keepStatsLabel" data-t>${i18next.t(
                                        'Wanted Stats'
                                    )}</div>
                                    <select id="keepStatOptions" class="editGearStatSelect">
                                        <option value="neverReplace" ${
                                            hero.keepStatOptions ===
                                                'neverReplace' ||
                                            !hero.keepStatOptions
                                                ? 'selected'
                                                : ''
                                        }>${i18next.t(
                'Never replace wanted stats'
            )}</option>
                                        <option value="replace" ${
                                            hero.keepStatOptions === 'replace'
                                                ? 'selected'
                                                : ''
                                        }>${i18next.t(
                'Allow replacing wanted with wanted'
            )}</option>
                                    </select>
                                </div>

                                <div class="editGearFormRow">
                                    <div class="editGearStatLabel" id="maxModPiecesLabel" data-t>${i18next.t(
                                        'Max Mod Pieces'
                                    )}</div>
                                    <select id="maxModPieces" class="editGearStatSelect">
                                        <option value=6 ${
                                            !hero.maxModPieces || hero.maxModPieces >= 6
                                                ? 'selected'
                                                : ''
                                        }>${i18next.t('No limit')}</option>
                                        ${[1, 2, 3, 4, 5]
                                            .map(
                                                (n) =>
                                                    `<option value=${n} ${
                                                        hero.maxModPieces === n
                                                            ? 'selected'
                                                            : ''
                                                    }>${n}</option>`
                                            )
                                            .join('')}
                                    </select>
                                </div>

                                <div class="editGearFormRow modSlotToggleRow" id="modSlotToggleRow">
                                    <div class="editGearStatLabel" id="modSlotsLabel" data-t>${i18next.t(
                                        'Mod Slots'
                                    )}</div>
                                    <div class="modSlotCheckboxes">
                                        ${['Weapon','Helmet','Armor','Necklace','Ring','Boots'].map((slot) => {
                                            const checked = hero.modSlots == null || hero.modSlots.length === 0 || hero.modSlots.includes(slot);
                                            return `<label class="modSlotLabel">
                                                <input type="checkbox" class="modSlotCheckbox" id="modSlot_${slot}" value="${slot}" ${checked ? 'checked' : ''}>
                                                <span>${i18next.t(slot)}</span>
                                            </label>`;
                                        }).join('')}
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
                                    'Substat selections'
                                )}</p>

                                <div class="groupContainer">
                                    <div class="groupColumn">
                                        <div id="keepGroup" class="dragOrderList">
                                            <div class="draggableColumnLabel" style="color: var(--font-color)" id="keepColumnLabel" data-t>${i18next.t(
                                                'Wanted substats'
                                            )}</div>
                                            <div id="keepContainer" class="draggableMovableContainer">
                                                ${generateStatList(
                                                    hero,
                                                    'keep'
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div class="groupColumn">
                                        <div id="ignoreGroup" class="dragOrderList">
                                            <div class="draggableColumnLabel" style="color: var(--font-color)" id="ignoreColumnLabel" data-t>${i18next.t(
                                                "Don't change"
                                            )}</div>
                                            <div id="ignoreContainer" class="draggableMovableContainer">
                                                ${generateStatList(
                                                    hero,
                                                    'ignore'
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div class="groupColumn">
                                        <div id="modifyGroup" class="dragOrderList">
                                            <div class="draggableColumnLabel" style="color: var(--font-color)" id="discardColumnLabel" data-t>${i18next.t(
                                                'Unwanted substats'
                                            )}</div>
                                            <div id="modifyContainer" class="draggableMovableContainer">
                                                ${generateStatList(
                                                    hero,
                                                    'discard'
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                                </div><!-- /globalDragPanel -->

                                <div id="slotDragPanel" style="display:none;">
                                    <div class="ruleRightHeader" id="ruleRightHeader" data-t>${i18next.t(
                                        'Select a rule to edit its substats'
                                    )}</div>
                                    <div class="groupContainer">
                                        <div class="groupColumn">
                                            <div id="slotKeepGroup" class="dragOrderList">
                                                <div class="draggableColumnLabel" style="color: var(--font-color)" data-t>${i18next.t(
                                                    'Wanted substats'
                                                )}</div>
                                                <div id="slotKeepContainer" class="draggableMovableContainer"></div>
                                            </div>
                                        </div>
                                        <div class="groupColumn">
                                            <div id="slotIgnoreGroup" class="dragOrderList">
                                                <div class="draggableColumnLabel" style="color: var(--font-color)" data-t>${i18next.t(
                                                    "Don't change"
                                                )}</div>
                                                <div id="slotIgnoreContainer" class="draggableMovableContainer"></div>
                                            </div>
                                        </div>
                                        <div class="groupColumn">
                                            <div id="slotModifyGroup" class="dragOrderList">
                                                <div class="draggableColumnLabel" style="color: var(--font-color)" data-t>${i18next.t(
                                                    'Unwanted substats'
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

                global.keepGroup = Sortable.create(
                    document.getElementById('keepContainer'),
                    {
                        group: 'nested',
                        filter: '.draggableColumnLabel',
                        animation: 100,
                        fallbackOnBody: true,
                        onEnd: () => updateModEstimate(),
                    }
                );
                global.ignoreGroup = Sortable.create(
                    document.getElementById('ignoreContainer'),
                    {
                        group: 'nested',
                        filter: '.draggableColumnLabel',
                        animation: 100,
                        fallbackOnBody: true,
                        onEnd: () => updateModEstimate(),
                    }
                );
                global.modifyGroup = Sortable.create(
                    document.getElementById('modifyContainer'),
                    {
                        group: 'nested',
                        filter: '.draggableColumnLabel',
                        animation: 100,
                        fallbackOnBody: true,
                        onEnd: () => updateModEstimate(),
                    }
                );

                // ── Slot tab sortables (shared right panel for rules) ─────────
                global.slotKeepGroup = Sortable.create(
                    document.getElementById('slotKeepContainer'),
                    {
                        group: 'slotNested',
                        filter: '.draggableColumnLabel',
                        animation: 100,
                        fallbackOnBody: true,
                    }
                );
                global.slotIgnoreGroup = Sortable.create(
                    document.getElementById('slotIgnoreContainer'),
                    {
                        group: 'slotNested',
                        filter: '.draggableColumnLabel',
                        animation: 100,
                        fallbackOnBody: true,
                    }
                );
                global.slotModifyGroup = Sortable.create(
                    document.getElementById('slotModifyContainer'),
                    {
                        group: 'slotNested',
                        filter: '.draggableColumnLabel',
                        animation: 100,
                        fallbackOnBody: true,
                    }
                );

                // ── Slot state init ───────────────────────────────────────────
                const modSlotState = {};
                SLOTS.forEach((slot) => {
                    const existingCfg =
                        hero.slotModConfig && hero.slotModConfig[slot];
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
                        })),
                    };
                });
                global.modSlotState = modSlotState;
                global.modDialogActiveSlot = null;
                global.modDialogActiveRuleIdx = -1;
                global.modDialogRuleListSortables = {};

                // ── Stat item divs builder ────────────────────────────────────
                // slot: optional — when provided, only shows the constraint badge
                // for that slot (hides irrelevant cross-slot badges).
                function buildStatDivs(statList, slot) {
                    const SLOT_BADGE_FILTER = {
                        Weapon: '✗Weap',
                        Armor: '✗Arm',
                    };
                    const relevantBadge = slot
                        ? SLOT_BADGE_FILTER[slot]
                        : null;
                    return statList
                        .map((s) => {
                            const badge = modConstraintBadge(s);
                            // In slot panels suppress badges for other slots
                            const showBadge =
                                !relevantBadge ||
                                badge.includes(relevantBadge)
                                    ? badge
                                    : '';
                            return `<div class="list-group-item" data-id="${s}"><span class="modStatLabel">${i18next.t(
                                optimizerStatToDisplayStat[s] || s
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
                            label: i18next.t(
                                optimizerStatToDisplayStat[s] || s
                            ),
                        })),
                    ];
                    return options
                        .map(
                            (o) =>
                                `<option value="${o.value}" ${
                                    (selectedValue || '') === o.value
                                        ? 'selected'
                                        : ''
                                }>${o.label}</option>`
                        )
                        .join('');
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
                                    (selectedValue || '') === o.value
                                        ? 'selected'
                                        : ''
                                }>${o.label}</option>`
                        )
                        .join('');
                }

                // ── Render rule list for a slot ───────────────────────────────
                function renderRuleList(slot) {
                    const listEl = document.getElementById(
                        `ruleList_${slot}`
                    );
                    if (!listEl) return;
                    const rules = modSlotState[slot].rules;
                    const activeIdx =
                        global.modDialogActiveSlot === slot
                            ? global.modDialogActiveRuleIdx
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
                                    rule.enabled !== false ? 'checked' : ''
                                } data-slot="${slot}" data-idx="${i}">
                            </label>
                            <select class="ruleMainStatSelect" data-slot="${slot}" data-idx="${i}">${buildMainStatOptions(
                                slot,
                                rule.mainStat || ''
                            )}</select>
                            <select class="ruleSetSelect" data-slot="${slot}" data-idx="${i}">${buildSetOptions(
                                rule.set || ''
                            )}</select>
                            <button class="ruleDeleteBtn" data-slot="${slot}" data-idx="${i}" type="button">✕</button>
                        </div>`
                        )
                        .join('');

                    if (global.modDialogRuleListSortables[slot]) {
                        global.modDialogRuleListSortables[slot].destroy();
                    }
                    global.modDialogRuleListSortables[slot] =
                        Sortable.create(listEl, {
                            handle: '.ruleRowDragHandle',
                            animation: 100,
                            onEnd: (evt) => {
                                const moved = modSlotState[
                                    slot
                                ].rules.splice(evt.oldIndex, 1)[0];
                                modSlotState[slot].rules.splice(
                                    evt.newIndex,
                                    0,
                                    moved
                                );
                                if (global.modDialogActiveSlot === slot) {
                                    const ai = global.modDialogActiveRuleIdx;
                                    if (evt.oldIndex === ai) {
                                        global.modDialogActiveRuleIdx =
                                            evt.newIndex;
                                    } else if (
                                        evt.oldIndex < ai &&
                                        evt.newIndex >= ai
                                    ) {
                                        global.modDialogActiveRuleIdx--;
                                    } else if (
                                        evt.oldIndex > ai &&
                                        evt.newIndex <= ai
                                    ) {
                                        global.modDialogActiveRuleIdx++;
                                    }
                                }
                                renderRuleList(slot);
                            },
                        });
                }

                // ── Flush slot sortables → save to active rule ────────────────
                function flushSlotSortables() {
                    const slot = global.modDialogActiveSlot;
                    const idx = global.modDialogActiveRuleIdx;
                    if (
                        slot &&
                        idx >= 0 &&
                        modSlotState[slot] &&
                        modSlotState[slot].rules[idx]
                    ) {
                        const rule = modSlotState[slot].rules[idx];
                        rule.keepStats = global.slotKeepGroup
                            .toArray()
                            .filter((x) => stats.includes(x));
                        rule.discardStats = global.slotModifyGroup
                            .toArray()
                            .filter((x) => stats.includes(x));
                        rule.ignoreStats = global.slotIgnoreGroup
                            .toArray()
                            .filter((x) => stats.includes(x));
                    }
                }

                // ── Collect current dialog state into an editedHero object ───
                function buildEditedHeroData() {
                    flushSlotSortables();

                    const modSlots = Array.from(
                        _swalEl.querySelectorAll('.modSlotCheckbox:checked')
                    ).map((cb) => cb.value);

                    const slotModConfig = {};
                    SLOTS.forEach((slot) => {
                        const slotData = global.modSlotState[slot];
                        if (!slotData || !slotData.override) {
                            slotModConfig[slot] = null;
                            return;
                        }
                        const getSelectVal = (id) => {
                            const el = _swalEl.querySelector(`#${id}`);
                            return el && el.value !== '' ? el.value : null;
                        };
                        const limitRollsRaw = getSelectVal(`slotLimitRolls_${slot}`);
                        const rollQualityRaw = getSelectVal(`slotRollQuality_${slot}`);
                        slotModConfig[slot] = {
                            limitRolls: limitRollsRaw !== null ? parseInt(limitRollsRaw, 10) : null,
                            modGrade: getSelectVal(`slotModGrade_${slot}`),
                            rollQuality: rollQualityRaw !== null ? parseFloat(rollQualityRaw) : null,
                            keepStatOptions: getSelectVal(`slotKeepStatOptions_${slot}`),
                            rules: slotData.rules.map((r) => ({
                                mainStat: r.mainStat || null,
                                set: r.set || null,
                                enabled: r.enabled !== false,
                                keepStats: r.keepStats || [],
                                ignoreStats: r.ignoreStats || [],
                                discardStats: r.discardStats || [],
                            })),
                        };
                    });

                    return {
                        discardStats: global.modifyGroup.toArray().filter((x) => stats.includes(x)),
                        ignoreStats: global.ignoreGroup.toArray().filter((x) => stats.includes(x)),
                        keepStats: global.keepGroup.toArray().filter((x) => stats.includes(x)),
                        modGrade: _swalEl.querySelector('#modGrade').value,
                        keepStatOptions: _swalEl.querySelector('#keepStatOptions').value,
                        rollQuality: parseFloat(_swalEl.querySelector('#rollQuality').value),
                        limitRolls: parseInt(_swalEl.querySelector('#limitRolls').value, 10),
                        maxModPieces: parseInt(_swalEl.querySelector('#maxModPieces').value, 10),
                        modSlots,
                        slotModConfig,
                        heroInfo,
                    };
                }
                global._modDataCollector = buildEditedHeroData;

                // ── Populate slot drag columns from a rule ────────────────────
                function populateSlotSortables(rule, slot) {
                    const header =
                        document.getElementById('ruleRightHeader');

                    // Stats that physically cannot appear on this slot type
                    // (includes the slot's fixed main stat — can never be a substat)
                    const SLOT_IMPOSSIBLE = {
                        Weapon: ['Attack', 'Defense', 'DefensePercent'],
                        Helmet: ['Health'],
                        Armor:  ['Defense', 'Attack', 'AttackPercent'],
                    };
                    const slotImpossible = SLOT_IMPOSSIBLE[slot] || [];

                    if (!rule) {
                        const baseStats = stats.filter(
                            (s) => !slotImpossible.includes(s)
                        );
                        document.getElementById(
                            'slotKeepContainer'
                        ).innerHTML = '';
                        document.getElementById(
                            'slotIgnoreContainer'
                        ).innerHTML = buildStatDivs(baseStats, slot);
                        document.getElementById(
                            'slotModifyContainer'
                        ).innerHTML = '';
                        if (header) {
                            header.textContent = i18next.t(
                                'Select a rule to edit its substats'
                            );
                        }
                        return;
                    }
                    // Exclude the rule's main stat and slot-impossible stats
                    const forbidden = new Set([
                        ...(rule.mainStat ? [rule.mainStat] : []),
                        ...slotImpossible,
                    ]);
                    const availableStats = stats.filter(
                        (s) => !forbidden.has(s)
                    );
                    const keepList = (rule.keepStats || []).filter(
                        (s) => !forbidden.has(s)
                    );
                    const discardList = (rule.discardStats || []).filter(
                        (s) => !forbidden.has(s)
                    );
                    const ignoreList =
                        rule.ignoreStats && rule.ignoreStats.length > 0
                            ? rule.ignoreStats.filter(
                                  (s) => !forbidden.has(s)
                              )
                            : availableStats.filter(
                                  (s) =>
                                      !keepList.includes(s) &&
                                      !discardList.includes(s)
                              );
                    document.getElementById(
                        'slotKeepContainer'
                    ).innerHTML = buildStatDivs(keepList, slot);
                    document.getElementById(
                        'slotIgnoreContainer'
                    ).innerHTML = buildStatDivs(ignoreList, slot);
                    document.getElementById(
                        'slotModifyContainer'
                    ).innerHTML = buildStatDivs(discardList, slot);
                    const mainLabel = rule.mainStat
                        ? i18next.t(
                              optimizerStatToDisplayStat[rule.mainStat] ||
                                  rule.mainStat
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
                        global.modDialogActiveSlot &&
                        global.modDialogActiveRuleIdx >= 0
                    ) {
                        flushSlotSortables();
                    }
                    document
                        .querySelectorAll('.modSlotTab')
                        .forEach((btn) =>
                            btn.classList.remove('modSlotTabActive')
                        );
                    const tabBtn = document.getElementById(
                        `modTab_${newTab}`
                    );
                    if (tabBtn) tabBtn.classList.add('modSlotTabActive');

                    document
                        .querySelectorAll('.modTabPanel')
                        .forEach((p) => p.classList.add('modTabPanelHidden'));
                    const panel = document.getElementById(
                        `modTabPanel_${newTab}`
                    );
                    if (panel) panel.classList.remove('modTabPanelHidden');

                    const globalDrag =
                        document.getElementById('globalDragPanel');
                    const slotDrag =
                        document.getElementById('slotDragPanel');
                    if (newTab === 'Global') {
                        if (globalDrag) globalDrag.style.display = '';
                        if (slotDrag) slotDrag.style.display = 'none';
                        global.modDialogActiveSlot = null;
                        global.modDialogActiveRuleIdx = -1;
                    } else {
                        if (globalDrag) globalDrag.style.display = 'none';
                        if (slotDrag) slotDrag.style.display = '';
                        global.modDialogActiveSlot = newTab;
                        global.modDialogActiveRuleIdx = -1;
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
                    btn.addEventListener('click', () =>
                        switchTab(btn.dataset.tab)
                    );
                });

                // ── Render initial rule lists ─────────────────────────────────
                SLOTS.forEach((slot) => renderRuleList(slot));

                // ── Override checkbox handlers ────────────────────────────────
                _swalEl
                    .querySelectorAll('.slotOverrideCheckbox')
                    .forEach((cb) => {
                        cb.addEventListener('change', () => {
                            const slot = cb.dataset.slot;
                            const enabled = cb.checked;
                            modSlotState[slot].override = enabled;
                            const optSec = document.getElementById(
                                `slotOptionsSection_${slot}`
                            );
                            const ruleSec = document.getElementById(
                                `slotRuleSection_${slot}`
                            );
                            if (optSec)
                                optSec.classList.toggle(
                                    'slotSectionDimmed',
                                    !enabled
                                );
                            if (ruleSec)
                                ruleSec.classList.toggle(
                                    'slotSectionDimmed',
                                    !enabled
                                );
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
                    const idx = parseInt(ruleRow.dataset.idx, 10);
                    if (global.modDialogActiveSlot !== slot) return;
                    if (global.modDialogActiveRuleIdx >= 0)
                        flushSlotSortables();
                    const rule = modSlotState[slot].rules[idx];
                    if (!rule) return;
                    if (global.modDialogActiveRuleIdx === idx) {
                        global.modDialogActiveRuleIdx = -1;
                        populateSlotSortables(null, slot);
                    } else {
                        global.modDialogActiveRuleIdx = idx;
                        populateSlotSortables(rule, slot);
                    }
                    renderRuleList(slot);
                });

                // ── Rule enabled toggle ───────────────────────────────────────
                _swalEl.addEventListener('change', (e) => {
                    if (!e.target.classList.contains('ruleEnabledCb')) return;
                    const slot = e.target.dataset.slot;
                    const idx = parseInt(e.target.dataset.idx, 10);
                    if (modSlotState[slot] && modSlotState[slot].rules[idx]) {
                        modSlotState[slot].rules[idx].enabled =
                            e.target.checked;
                    }
                });

                // ── Rule mainStat / set select changes ────────────────────────
                _swalEl.addEventListener('change', (e) => {
                    if (e.target.classList.contains('ruleMainStatSelect')) {
                        const slot = e.target.dataset.slot;
                        const idx = parseInt(e.target.dataset.idx, 10);
                        if (
                            modSlotState[slot] &&
                            modSlotState[slot].rules[idx]
                        ) {
                            // Flush drag column changes before updating mainStat
                            // so the user's substat assignments are preserved.
                            if (
                                global.modDialogActiveSlot === slot &&
                                global.modDialogActiveRuleIdx === idx
                            ) {
                                flushSlotSortables();
                            }
                            modSlotState[slot].rules[idx].mainStat =
                                e.target.value || null;
                        }
                        if (
                            global.modDialogActiveSlot === slot &&
                            global.modDialogActiveRuleIdx === idx
                        ) {
                            const r = modSlotState[slot].rules[idx];
                            if (r) populateSlotSortables(r, slot);
                        }
                    }
                    if (e.target.classList.contains('ruleSetSelect')) {
                        const slot = e.target.dataset.slot;
                        const idx = parseInt(e.target.dataset.idx, 10);
                        if (
                            modSlotState[slot] &&
                            modSlotState[slot].rules[idx]
                        ) {
                            // Flush drag column changes before updating set
                            // so the user's substat assignments are preserved.
                            if (
                                global.modDialogActiveSlot === slot &&
                                global.modDialogActiveRuleIdx === idx
                            ) {
                                flushSlotSortables();
                            }
                            modSlotState[slot].rules[idx].set =
                                e.target.value || null;
                        }
                        if (
                            global.modDialogActiveSlot === slot &&
                            global.modDialogActiveRuleIdx === idx
                        ) {
                            const r = modSlotState[slot].rules[idx];
                            if (r) populateSlotSortables(r, slot);
                        }
                    }
                });

                // ── Delete rule ───────────────────────────────────────────────
                _swalEl.addEventListener('click', (e) => {
                    if (!e.target.classList.contains('ruleDeleteBtn')) return;
                    const slot = e.target.dataset.slot;
                    const idx = parseInt(e.target.dataset.idx, 10);
                    modSlotState[slot].rules.splice(idx, 1);
                    if (global.modDialogActiveSlot === slot) {
                        if (global.modDialogActiveRuleIdx === idx) {
                            global.modDialogActiveRuleIdx = -1;
                            populateSlotSortables(null, slot);
                        } else if (global.modDialogActiveRuleIdx > idx) {
                            global.modDialogActiveRuleIdx--;
                        }
                    }
                    renderRuleList(slot);
                });

                // ── Reset global substats to "Don't change" ───────────────────
                _swalEl.addEventListener('click', (e) => {
                    if (!e.target.closest('#modResetBtn')) return;
                    const keepEl    = document.getElementById('keepContainer');
                    const ignoreEl  = document.getElementById('ignoreContainer');
                    const modifyEl  = document.getElementById('modifyContainer');
                    while (keepEl?.firstChild)   ignoreEl.appendChild(keepEl.firstChild);
                    while (modifyEl?.firstChild) ignoreEl.appendChild(modifyEl.firstChild);
                    updateModEstimate();
                });

                // ── Toggle All Slots ───────────────────────────────────────────
                _swalEl.addEventListener('click', (e) => {
                    if (!e.target.closest('#toggleAllSlotsBtn')) return;
                    const checkboxes = Array.from(
                        _swalEl.querySelectorAll('.modSlotCheckbox')
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
                        console.error('Failed to save mod stats', err);
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
                    if (global.modDialogActiveSlot === slot) {
                        flushSlotSortables();
                        global.modDialogActiveRuleIdx =
                            modSlotState[slot].rules.length - 1;
                        populateSlotSortables(newRule, slot);
                    }
                    renderRuleList(slot);
                });

                // ── Generate rules from optimizer config ──────────────────────
                _swalEl.addEventListener('click', (e) => {
                    if (!e.target.classList.contains('generateRulesBtn'))
                        return;
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
                                    (r.mainStat || null) ===
                                        (mainStat || null) &&
                                    (r.set || null) === (set || null)
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
                            const cb = document.getElementById(
                                `slotOverride_${slot}`
                            );
                            if (cb) cb.checked = true;
                            const optSec = document.getElementById(
                                `slotOptionsSection_${slot}`
                            );
                            const ruleSec = document.getElementById(
                                `slotRuleSection_${slot}`
                            );
                            if (optSec)
                                optSec.classList.remove('slotSectionDimmed');
                            if (ruleSec)
                                ruleSec.classList.remove('slotSectionDimmed');
                        }
                        const field = slotToField[slot];
                        const mainStats =
                            field &&
                            optReq[field] &&
                            optReq[field].length > 0
                                ? optReq[field]
                                : [null];
                        const existing = modSlotState[slot].rules;
                        for (const mainStat of mainStats) {
                            for (const set of sets) {
                                const exists = existing.some(
                                    (r) =>
                                        (r.mainStat || null) ===
                                            (mainStat || null) &&
                                        (r.set || null) === (set || null)
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
                            Armor:  ['Defense', 'Attack', 'AttackPercent'],
                        };
                        const impossibleFrom = new Set(SLOT_IMPOSSIBLE[fromSlot] || []);
                        const impossibleTo   = new Set(SLOT_IMPOSSIBLE[toSlot]   || []);

                        // Stats that were invisible in the source slot (so never in any
                        // list) but ARE valid in the target slot → put them in ignore
                        // (neutral) so they don't silently fall through.
                        const freedStats = stats.filter(
                            (s) => impossibleFrom.has(s) && !impossibleTo.has(s)
                        );

                        modSlotState[toSlot] = {
                            override: src.override,
                            limitRolls: src.limitRolls,
                            modGrade: src.modGrade,
                            rollQuality: src.rollQuality,
                            keepStatOptions: src.keepStatOptions,
                            rules: src.rules.map((r) => {
                                const keepStats    = (r.keepStats    || []).filter((s) => !impossibleTo.has(s));
                                const discardStats = (r.discardStats || []).filter((s) => !impossibleTo.has(s));
                                const ignoreStats  = [
                                    ...(r.ignoreStats || []).filter((s) => !impossibleTo.has(s)),
                                    // Add stats that were invisible in source but visible in target
                                    ...freedStats.filter(
                                        (s) => !keepStats.includes(s) && !discardStats.includes(s)
                                    ),
                                ];
                                return { ...r, keepStats, ignoreStats, discardStats };
                            }),
                        };
                        // Sync override checkbox + section dimming
                        const cb = document.getElementById(`slotOverride_${toSlot}`);
                        if (cb) cb.checked = src.override;
                        const optSec = document.getElementById(`slotOptionsSection_${toSlot}`);
                        const ruleSec = document.getElementById(`slotRuleSection_${toSlot}`);
                        if (optSec) optSec.classList.toggle('slotSectionDimmed', !src.override);
                        if (ruleSec) ruleSec.classList.toggle('slotSectionDimmed', !src.override);
                        // Sync option selects
                        const setSelectVal = (id, val) => {
                            const el = document.getElementById(id);
                            if (el) el.value = val !== null && val !== undefined ? String(val) : '';
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
                        try { return JSON.parse(localStorage.getItem(PRESETS_KEY) || '{}'); } catch { return {}; }
                    };
                    const putStore = (obj) => localStorage.setItem(PRESETS_KEY, JSON.stringify(obj));

                    // All sets — matches enums.js setEnum values
                    const ALL_SETS = [
                        { value: '', label: i18next.t('Any set') },
                        { value: 'HealthSet',      label: 'Health' },
                        { value: 'DefenseSet',     label: 'Defense' },
                        { value: 'AttackSet',      label: 'Attack' },
                        { value: 'SpeedSet',       label: 'Speed' },
                        { value: 'CriticalSet',    label: 'Critical' },
                        { value: 'HitSet',         label: 'Hit' },
                        { value: 'DestructionSet', label: 'Destruction' },
                        { value: 'LifestealSet',   label: 'Lifesteal' },
                        { value: 'CounterSet',     label: 'Counter' },
                        { value: 'ResistSet',      label: 'Resist' },
                        { value: 'UnitySet',       label: 'Unity' },
                        { value: 'RageSet',        label: 'Rage' },
                        { value: 'ImmunitySet',    label: 'Immunity' },
                        { value: 'PenetrationSet', label: 'Penetration' },
                        { value: 'RevengeSet',     label: 'Revenge' },
                        { value: 'InjurySet',      label: 'Injury' },
                        { value: 'ProtectionSet',  label: 'Protection' },
                        { value: 'TorrentSet',     label: 'Torrent' },
                        { value: 'ReversalSet',    label: 'Reversal' },
                        { value: 'RiposteSet',     label: 'Riposte' },
                        { value: 'WarfareSet',     label: 'Warfare' },
                        { value: 'PursuitSet',     label: 'Pursuit' },
                    ];

                    // Helpers
                    const getGlobalSubstats = () => ({
                        keepStats:    global.keepGroup.toArray().filter((x) => stats.includes(x)),
                        ignoreStats:  global.ignoreGroup.toArray().filter((x) => stats.includes(x)),
                        discardStats: global.modifyGroup.toArray().filter((x) => stats.includes(x)),
                    });

                    const refreshPresetSelect = () => {
                        const sel = document.getElementById('presetSelect');
                        if (!sel) return;
                        const names = Object.keys(getStore()).sort();
                        sel.innerHTML = `<option value="">${i18next.t('\u2014 select preset \u2014')}</option>` +
                            names.map((n) => `<option value="${n}">${n}</option>`).join('');
                    };

                    const initApplySetSelect = () => {
                        const sel = document.getElementById('presetApplySetSelect');
                        if (!sel) return;
                        sel.innerHTML = ALL_SETS
                            .map((o) => `<option value="${o.value}">${o.label}</option>`)
                            .join('');
                    };

                    refreshPresetSelect();
                    initApplySetSelect();

                    // Save-preset logic in a named function so both Enter-key and
                    // button-click paths call it directly without any synthetic .click()
                    // call that could create a bubbling click Swal2 might intercept.
                    const saveCurrentPreset = () => {
                        const nameEl = document.getElementById('modDialogPresetNameInput');
                        const name = nameEl?.value.trim();
                        if (!name) { nameEl?.focus(); return; }
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
                            setTimeout(() => { btn.innerHTML = orig; }, 1200);
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
                    document.getElementById('modDialogPresetNameInput')?.addEventListener('keydown', (e) => {
                        if (e.key === 'Enter') {
                            e.stopPropagation();
                            e.stopImmediatePropagation();
                            e.preventDefault();
                            saveCurrentPreset();
                        }
                    });

                    // Save preset button: stopPropagation prevents the click from
                    // bubbling up to Swal2's popup/container click handlers.
                    document.getElementById('presetSaveBtn')?.addEventListener('click', (e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        saveCurrentPreset();
                    });

                    // Delete preset
                    document.getElementById('presetDeleteBtn')?.addEventListener('click', (e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        const sel = document.getElementById('presetSelect');
                        const name = sel?.value;
                        if (!name) return;
                        const store = getStore();
                        delete store[name];
                        putStore(store);
                        refreshPresetSelect();
                        const nameEl = document.getElementById('modDialogPresetNameInput');
                        if (nameEl && nameEl.value === name) nameEl.value = '';
                    });

                    // Load preset → restore Global sortable lists
                    document.getElementById('presetLoadBtn')?.addEventListener('click', (e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        const sel = document.getElementById('presetSelect');
                        const name = sel?.value;
                        if (!name) return;
                        const preset = getStore()[name];
                        if (!preset) return;
                        const keepSet    = new Set(preset.keepStats    || []);
                        const discardSet = new Set(preset.discardStats || []);
                        const ignoreSet  = new Set(preset.ignoreStats  || []);
                        const keepList    = stats.filter((s) => keepSet.has(s));
                        const discardList = stats.filter((s) => discardSet.has(s));
                        // anything not explicitly in keep or discard falls into ignore
                        const ignoreList  = stats.filter(
                            (s) => ignoreSet.has(s) || (!keepSet.has(s) && !discardSet.has(s))
                        );
                        document.getElementById('keepContainer').innerHTML   = buildStatDivs(keepList);
                        document.getElementById('ignoreContainer').innerHTML = buildStatDivs(ignoreList);
                        document.getElementById('modifyContainer').innerHTML = buildStatDivs(discardList);
                        const nameEl = document.getElementById('modDialogPresetNameInput');
                        if (nameEl) nameEl.value = name;
                    });

                    // Apply current Global substats to all matching slot rules
                    document.getElementById('presetApplyBtn')?.addEventListener('click', (e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        const targetSet = document.getElementById('presetApplySetSelect')?.value || '';
                        const substats  = getGlobalSubstats();
                        const SLOT_IMPOSSIBLE = {
                            Weapon: new Set(['Attack', 'Defense', 'DefensePercent']),
                            Helmet: new Set(['Health']),
                            Armor:  new Set(['Defense', 'Attack', 'AttackPercent']),
                        };
                        let count = 0;
                        SLOTS.forEach((slot) => {
                            const impossible = SLOT_IMPOSSIBLE[slot] || new Set();
                            (modSlotState[slot]?.rules || []).forEach((rule) => {
                                if (targetSet && (rule.set || '') !== targetSet) return;
                                rule.keepStats    = substats.keepStats.filter((s) => !impossible.has(s));
                                rule.ignoreStats  = substats.ignoreStats.filter((s) => !impossible.has(s));
                                rule.discardStats = substats.discardStats.filter((s) => !impossible.has(s));
                                count++;
                            });
                            renderRuleList(slot);
                        });
                        const btn = document.getElementById('presetApplyBtn');
                        if (btn) {
                            const orig = btn.innerHTML;
                            btn.innerHTML = `\u2713 ${count} rule${count !== 1 ? 's' : ''}`;
                            setTimeout(() => { btn.innerHTML = orig; }, 1500);
                        }
                    });
                })();

                tippy('#limitRollsLabel', {
                    placement: 'top',
                    content: `<p>${i18next.t(
                        "Choose the maximum number of rolls to replace. For example, limit rolls = 1 would only replace base stats that didn't get enhanced. It is generally not a good idea to replace more than 2 rolls, and the higher this number is, the more permutations will be generated."
                    )}</p>`,
                });
                tippy('#limitRolls', {
                    placement: 'top',
                    content: `<p>${i18next.t(
                        "Choose the maximum number of rolls to replace. For example, limit rolls = 1 would only replace base stats that didn't get enhanced. It is generally not a good idea to replace more than 2 rolls, and the higher this number is, the more permutations will be generated."
                    )}</p>`,
                });

                tippy('#modGradeLabel', {
                    placement: 'top',
                    content: `<p>${i18next.t(
                        'Choose whether to use Greater or Lesser gem stats.'
                    )}</p>`,
                });
                tippy('#modGrade', {
                    placement: 'top',
                    content: `<p>${i18next.t(
                        'Choose whether to use Greater or Lesser gem stats.'
                    )}</p>`,
                });

                tippy('#rollQualityLabel', {
                    placement: 'top',
                    content: `<p>${i18next.t(
                        "Choose the modified substat's roll value, from min roll to max roll. The actual value ingame will be random. Values will be rounded to the nearest whole number."
                    )}</p>`,
                });
                tippy('#rollQuality', {
                    placement: 'top',
                    content: `<p>${i18next.t(
                        "Choose the modified substat's roll value, from min roll to max roll. The actual value ingame will be random. Values will be rounded to the nearest whole number."
                    )}</p>`,
                });

                tippy('#keepStatsLabel', {
                    placement: 'top',
                    content: `<p>${i18next.t(
                        'Choose whether wanted stats should be allowed to be replaced with wanted stats when optimizing. For example, when allowed, a min speed roll could be replaced by a max speed roll. When not allowed, the speed will be left unmodified.'
                    )}</p>`,
                });
                tippy('#keepStatOptions', {
                    placement: 'top',
                    content: `<p>${i18next.t(
                        'Choose whether wanted stats should be allowed to be replaced with wanted stats when optimizing. For example, when allowed, a min speed roll could be replaced by a max speed roll. When not allowed, the speed will be left unmodified.'
                    )}</p>`,
                });

                tippy('#maxModPiecesLabel', {
                    placement: 'top',
                    content: `<p>${i18next.t(
                        'Limit the number of gear pieces that can be modded in a single build. Lower values reduce the number of valid build combinations and can speed up optimization.'
                    )}</p>`,
                });
                tippy('#maxModPieces', {
                    placement: 'top',
                    content: `<p>${i18next.t(
                        'Limit the number of gear pieces that can be modded in a single build. Lower values reduce the number of valid build combinations and can speed up optimization.'
                    )}</p>`,
                });

                tippy('#modSlotsLabel', {
                    placement: 'top',
                    content: `<p>${i18next.t(
                        'Choose which gear slots can have substats modified. Unchecked slots will never have mod variants generated, reducing the number of permutations.'
                    )}</p>`,
                });
                tippy('#modSlotToggleRow', {
                    placement: 'top',
                    content: `<p>${i18next.t(
                        'Choose which gear slots can have substats modified. Unchecked slots will never have mod variants generated, reducing the number of permutations.'
                    )}</p>`,
                });

                tippy('#keepGroup', {
                    placement: 'top',
                    delay: [500, null],
                    content: `<p>${i18next.t(
                        'Choose the substats that you want to modify for. Substats in the unwanted column will be replaced by substats in wanted column.'
                    )}</p>`,
                });

                tippy('#ignoreGroup', {
                    placement: 'top',
                    delay: [500, null],
                    content: `<p>${i18next.t(
                        'Choose the substats to not modify. Substats in this column will not get replaced, and will also not be selected for.'
                    )}</p>`,
                });

                tippy('#modifyGroup', {
                    placement: 'top',
                    delay: [500, null],
                    content: `<p>${i18next.t(
                        'Choose the substats that you want to discard when modifying. Substats in the unwanted column will be replaced by substats in wanted column.'
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

                    const limitRolls = parseInt(
                        document.getElementById('limitRolls').value,
                        10
                    );
                    const keepStatOpts =
                        document.getElementById('keepStatOptions').value;
                    const enabledSlots = Array.from(
                        _swalEl.querySelectorAll('.modSlotCheckbox:checked')
                    ).map((cb) => cb.value);

                    const keepList = (
                        global.keepGroup ? global.keepGroup.toArray() : []
                    ).filter((x) => stats.includes(x));
                    const discardList = (
                        global.modifyGroup ? global.modifyGroup.toArray() : []
                    ).filter((x) => stats.includes(x));

                    if (keepList.length === 0) {
                        display.textContent = '';
                        display.className = 'modEstimateDisplay';
                        return;
                    }

                    let estimate = 0;
                    for (const item of modEstimateItems) {
                        if (item.enhance !== 15) continue;
                        if (item.disableMods) continue;
                        if (!enabledSlots.includes(item.gear)) continue;

                        const blocked = slotBlockedForEstimate[item.gear] || [];
                        const effectiveKeepLen = keepList.filter(
                            (s) => !blocked.includes(s)
                        ).length;
                        if (effectiveKeepLen === 0) continue;

                        const substats = item.substats || [];
                        let candidates = 0;
                        for (const sub of substats) {
                            const rolls = sub.rolls || 0;
                            if (rolls > limitRolls) continue;
                            const isDiscard = discardList.includes(sub.type);
                            const isKeep =
                                keepList.includes(sub.type) &&
                                keepStatOpts === 'replace';
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
            allowEnterKey: false,
            showCancelButton: true,
            confirmButtonText: i18next.t('OK'),
            cancelButtonText: i18next.t('Cancel'),
            preConfirm: async () => {
                console.trace('[preConfirm] triggered — call stack above shows what fired confirm');
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
                            'Build name'
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
                            'Rank #'
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
            item = JSON.parse(JSON.stringify(item));
            item.level = 90;
            item.main.value = item.main.reforgedValue;

            for (const substat of item.substats) {
                substat.value = substat.reforgedValue;
            }
        }

        const getAllHeroesResponse = await Api.getAllHeroes();
        const { heroes } = getAllHeroesResponse;

        const { value: formValues } = await Swal.fire({
            title: '',
            width: 550,
            html: `
                    <div class="editGearForm">
                        <link href="https://cdn.jsdelivr.net/npm/@sweetalert2/themes@4.0.1/minimal/minimal.min.css" rel="stylesheet">

                        <div class="editGearFormRow">
                            <div class="editGearStatLabel" data-t>${i18next.t(
                                'Equipped'
                            )}</div>
                            <select id="editGearEquipped" class="editGearStatSelect">
                                ${getEquippedHtml(item, heroes)}
                            </select>
                        </div>

                        <div class="editGearFormRow">
                            <div class="editGearStatLabel" data-t>${i18next.t(
                                'Type'
                            )}</div>
                            <select id="editGearType" class="editGearStatSelect" onchange="Dialog.changeEditGearMainStat()">
                                ${getGearTypeOptionsHtml(item)}
                            </select>
                        </div>

                        <div class="editGearFormRow">
                            <div class="editGearStatLabel" data-t>${i18next.t(
                                'Set'
                            )}</div>
                            <select id="editGearSet" class="editGearStatSelect">
                                ${getGearSetOptionsHtml(item)}
                            </select>
                        </div>

                        <div class="editGearFormRow">
                            <div class="editGearStatLabel" data-t>${i18next.t(
                                'Reforge'
                            )}</div>
                            <select id="editGearMaterial" class="editGearStatSelect">
                                ${getGearMaterialOptionsHtml(item)}
                            </select>
                        </div>

                        <div class="editGearFormRow">
                            <div class="editGearStatLabel" data-t>${i18next.t(
                                'Rank'
                            )}</div>
                            <select id="editGearRank" class="editGearStatSelect">
                                ${getGearRankOptionsHtml(item)}
                            </select>
                        </div>

                        <div class="editGearFormRow">
                            <div class="editGearStatLabel" data-t>${i18next.t(
                                'Level'
                            )}</div>
                            <input type="number" class="editGearStatNumber" id="editGearLevel" value="${
                                item.level
                            }">
                        </div>

                        <div class="editGearFormRow">
                            <div class="editGearStatLabel" data-t>${i18next.t(
                                'Enhance'
                            )}</div>
                            <input type="number" class="editGearStatNumber" id="editGearEnhance" value="${
                                item.enhance
                            }">
                        </div>

                        <div class="editGearFormRow">
                            <div class="editGearStatLabel" data-t>${i18next.t(
                                'Locked'
                            )}</div>
                            <input type="checkbox" id="editGearLocked" ${
                                item.locked ? 'checked' : ''
                            }>
                        </div>

                        <div class="editGearFormRow">
                            <div class="editGearStatLabel" data-t>${i18next.t(
                                'Disable mods'
                            )}</div>
                            <input type="checkbox" id="editGearDisableMods" ${
                                item.disableMods ? 'checked' : ''
                            }>
                        </div>

                        </br>

                        <div class="editGearFormRow">
                            <div class="editGearStatLabel" data-t>${i18next.t(
                                'Main Stat'
                            )}</div>
                            <select id="editGearMainStatType" class="editGearStatSelect">
                                ${getStatOptionsHtml(item.main)}
                            </select>
                            <input type="number" class="editGearStatNumber" id="editGearMainStatValue" value="${
                                item.main.value
                            }">
                            <img class="editGearCycle" src=${Assets.getCycle()}></img>
                        </div>

                        <div class="editGearFormRow">
                            <div class="editGearStatLabel" data-t>${i18next.t(
                                'Substat 1'
                            )}</div>
                            <input type="checkbox" class="subPinModCheckbox" id="pinMod1" title="Pin mod: only pinned substats will be considered for modding on this item" ${
                                item.substats[0]?.pinMod ? 'checked' : ''
                            }>
                            <select id="editGearStat1Type" class="editGearStatSelect">
                                ${getStatOptionsHtml(item.substats[0])}
                            </select>
                            <input type="number" class="editGearStatNumber" id="editGearStat1Value" value="${
                                item.substats[0] ? item.substats[0].value : ''
                            }">
                            <span class="editGearRollBadge" title="${item.substats[0] ? (item.substats[0].rolls || 0) + ' rolls' : ''}">${item.substats[0] ? '[' + (item.substats[0].rolls || 0) + ']' : ''}</span>
                            <input type="checkbox" class="subModCheckbox" id="subMod1" ${
                                item.substats[0]?.modified ? 'checked' : ''
                            }>
                        </div>

                        <div class="editGearFormRow">
                            <div class="editGearStatLabel" data-t>${i18next.t(
                                'Substat 2'
                            )}</div>
                            <input type="checkbox" class="subPinModCheckbox" id="pinMod2" title="Pin mod: only pinned substats will be considered for modding on this item" ${
                                item.substats[1]?.pinMod ? 'checked' : ''
                            }>
                            <select id="editGearStat2Type" class="editGearStatSelect">
                                ${getStatOptionsHtml(item.substats[1])}
                            </select>
                            <input type="number" class="editGearStatNumber" id="editGearStat2Value" value="${
                                item.substats[1] ? item.substats[1].value : ''
                            }">
                            <span class="editGearRollBadge" title="${item.substats[1] ? (item.substats[1].rolls || 0) + ' rolls' : ''}">${item.substats[1] ? '[' + (item.substats[1].rolls || 0) + ']' : ''}</span>
                            <input type="checkbox" class="subModCheckbox" id="subMod2" ${
                                item.substats[1]?.modified ? 'checked' : ''
                            }>
                        </div>

                        <div class="editGearFormRow">
                            <div class="editGearStatLabel" data-t>${i18next.t(
                                'Substat 3'
                            )}</div>
                            <input type="checkbox" class="subPinModCheckbox" id="pinMod3" title="Pin mod: only pinned substats will be considered for modding on this item" ${
                                item.substats[2]?.pinMod ? 'checked' : ''
                            }>
                            <select id="editGearStat3Type" class="editGearStatSelect">
                                ${getStatOptionsHtml(item.substats[2])}
                            </select>
                            <input type="number" class="editGearStatNumber" id="editGearStat3Value" value="${
                                item.substats[2] ? item.substats[2].value : ''
                            }">
                            <span class="editGearRollBadge" title="${item.substats[2] ? (item.substats[2].rolls || 0) + ' rolls' : ''}">${item.substats[2] ? '[' + (item.substats[2].rolls || 0) + ']' : ''}</span>
                            <input type="checkbox" class="subModCheckbox" id="subMod3" ${
                                item.substats[2]?.modified ? 'checked' : ''
                            }>
                        </div>

                        <div class="editGearFormRow">
                            <div class="editGearStatLabel" data-t>${i18next.t(
                                'Substat 4'
                            )}</div>
                            <input type="checkbox" class="subPinModCheckbox" id="pinMod4" title="Pin mod: only pinned substats will be considered for modding on this item" ${
                                item.substats[3]?.pinMod ? 'checked' : ''
                            }>
                            <select id="editGearStat4Type" class="editGearStatSelect">
                                ${getStatOptionsHtml(item.substats[3])}
                            </select>
                            <input type="number" class="editGearStatNumber" id="editGearStat4Value" value="${
                                item.substats[3] ? item.substats[3].value : ''
                            }">
                            <span class="editGearRollBadge" title="${item.substats[3] ? (item.substats[3].rolls || 0) + ' rolls' : ''}">${item.substats[3] ? '[' + (item.substats[3].rolls || 0) + ']' : ''}</span>
                            <input type="checkbox" class="subModCheckbox" id="subMod4" ${
                                item.substats[3]?.modified ? 'checked' : ''
                            }>
                        </div>
                    </div>
                `,
            didOpen: async () => {
                const options = {
                    filter: true,
                    filterAcceptOnEnter: true,
                    // customFilter: Utils.customFilter,
                    maxHeight: 250,
                };

                $('#editGearEquipped').multipleSelect(options);

                const checkboxes = [
                    '#subMod1',
                    '#subMod2',
                    '#subMod3',
                    '#subMod4',
                ];

                for (const checkbox of checkboxes) {
                    $(checkbox).change(function onCheckboxChange() {
                        for (const toUncheck of checkboxes) {
                            if (!toUncheck.includes(this.id)) {
                                $(toUncheck).prop('checked', false);
                            }
                        }
                    });
                }
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
                        type: document.getElementById('editGearMainStatType')
                            .value,
                        value: parseInt(
                            document.getElementById('editGearMainStatValue')
                                .value,
                            10
                        ),
                    },
                    name: item.name,
                    enhance:
                        parseInt(
                            document.getElementById('editGearEnhance').value,
                            10
                        ) || 0,
                    level:
                        parseInt(
                            document.getElementById('editGearLevel').value,
                            10
                        ) || 0,
                    locked: document.getElementById('editGearLocked').checked,
                    disableMods: document.getElementById('editGearDisableMods')
                        .checked,
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
                            'Please make sure Type / Set / Rank / Level / Enhance / Main stat are not empty'
                        )
                    );
                    return false;
                }

                const substats = [];

                const subStatType1 =
                    document.getElementById('editGearStat1Type').value;
                const subStatType2 =
                    document.getElementById('editGearStat2Type').value;
                const subStatType3 =
                    document.getElementById('editGearStat3Type').value;
                const subStatType4 =
                    document.getElementById('editGearStat4Type').value;

                if (subStatType1 !== 'None')
                    substats.push({
                        type: subStatType1,
                        value: parseInt(
                            document.getElementById('editGearStat1Value')
                                .value || 0,
                            10
                        ),
                        modified: $('#subMod1').prop('checked'),
                        pinMod: $('#pinMod1').prop('checked') || undefined,
                    });
                if (subStatType2 !== 'None')
                    substats.push({
                        type: subStatType2,
                        value: parseInt(
                            document.getElementById('editGearStat2Value')
                                .value || 0,
                            10
                        ),
                        modified: $('#subMod2').prop('checked'),
                        pinMod: $('#pinMod2').prop('checked') || undefined,
                    });
                if (subStatType3 !== 'None')
                    substats.push({
                        type: subStatType3,
                        value: parseInt(
                            document.getElementById('editGearStat3Value')
                                .value || 0,
                            10
                        ),
                        modified: $('#subMod3').prop('checked'),
                        pinMod: $('#pinMod3').prop('checked') || undefined,
                    });
                if (subStatType4 !== 'None')
                    substats.push({
                        type: subStatType4,
                        value: parseInt(
                            document.getElementById('editGearStat4Value')
                                .value || 0,
                            10
                        ),
                        modified: $('#subMod4').prop('checked'),
                        pinMod: $('#pinMod4').prop('checked') || undefined,
                    });

                editedItem.substats = substats;

                if (
                    editedItem.enhance === 15 &&
                    editedItem.substats.length !== 4
                ) {
                    Dialog.error(
                        i18next.t('Please make sure +15 items have 4 substats')
                    );
                    return false;
                }
                if (editedItem.enhance < 0 || editedItem.enhance > 15) {
                    Dialog.error(i18next.t('Item enhance can only be 0 - 15'));
                    return false;
                }

                ItemAugmenter.augment([editedItem]);
                if (item.id && edit) {
                    editedItem.id = item.id;
                }

                const equippedById =
                    document.getElementById('editGearEquipped').value;

                if (edit) {
                    if (equippedById === 'None') {
                        await Api.unequipItems([editedItem.id]);
                    } else {
                        editedItem.equippedById = equippedById;
                        editedItem.equippedByName = heroes.filter(
                            (x) => x.id === equippedById
                        )[0].name;
                        await Api.equipItemsOnHero(equippedById, [
                            editedItem.id,
                        ]);
                    }
                } else if (equippedById === 'None') {
                    await Api.addItems([editedItem]);
                } else {
                    editedItem.equippedById = equippedById;
                    editedItem.equippedByName = heroes.filter(
                        (x) => x.id === equippedById
                    )[0].name;
                    await Api.addItems([editedItem]);
                    await Api.equipItemsOnHero(equippedById, [editedItem.id]);
                }
                return editedItem;
            },
        });
        return formValues;
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
    const skillTypes = !heroData.skills ? [] : heroData.skills[prefix];
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
                'Select Skill Effect'
            )}</div>
            <select id="${prefix}SkillEffect" class="editSkillSelect skillTypeSelect">
                ${skillTypesHtml}
            </select>
        </div>
</div>
`;
    return html;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function generateSkillOptionsHtmlOLDWITHDAMAGECALC(prefix, hero, heroData) {
    const skillTypes = !heroData.skills ? [] : heroData.skills[prefix];
    let skillTypesHtml = '';
    for (const skillType of skillTypes.options) {
        skillTypesHtml += `<option value='${skillType.name}' ${
            safeGetSkill(hero, prefix).skillEffect === skillType.name
                ? 'selected'
                : ''
        }>${skillType.name}</option>\n`;
    }
    const html = `
<div class="editGearFormRow">
    <div class="editGearFormHalf">
        <div class="editGearFormRow">
            <div class="editSkillLabel" id="skillNumberLabel"  data-t>${i18next.t(
                'Select Skill Effect'
            )}</div>
            <select id="${prefix}SkillEffect" class="editSkillSelect skillTypeSelect">
                ${skillTypesHtml}
            </select>
        </div>
    </div>

    <div class="editGearFormVerticalShort"></div>


    <div class="editGearFormHalf">
        <div class="editGearFormRow">
            <div class="editSkillLabel" data-t>${i18next.t(
                'Apply options to all skills'
            )}</div>
            <input type="checkbox" id="${prefix}EditApplyToAllSkillsBox" ${
        safeGetSkill(hero, prefix).applyToAllSkills ? 'checked' : ''
    }>
        </div>
    </div>
</div>

<div class="horizontalLineWithMoreSpace"></div>

<div class="editGearFormRow">
    <div class="editGearFormHalf">

        <div class="editGearFormRow">
            <div class="editSkillLabel" data-t>${i18next.t(
                'Attack % Imprint'
            )}</div>
            <span class="valuePadding input-holder">
                <input type="number" class="bonusStatInput" max="100" accuracy="1" min="0" id="${prefix}EditAttackPercentImprint" value="${
        safeGetSkill(hero, prefix).attackImprintPercent
            ? hero.skillOptions[prefix].attackImprintPercent
            : 0
    }">
            </span>
        </div>

        <div class="editGearFormRow">
            <div class="editSkillLabel" data-t>${i18next.t(
                'Attack % Increase'
            )}</div>
            <span class="valuePadding input-holder">
                <input type="number" class="bonusStatInput" max="100" accuracy="1" min="0" id="${prefix}EditAttackPercentIncrease" value="${
        safeGetSkill(hero, prefix).attackIncreasePercent
            ? hero.skillOptions[prefix].attackIncreasePercent
            : 0
    }">
            </span>
        </div>

        <div class="editGearFormRow">
            <div class="editSkillLabel" data-t>${i18next.t(
                'Damage Increase'
            )}</div>
            <span class="valuePadding input-holder">
                <input type="number" class="bonusStatInput" max="100" accuracy="1" min="0" id="${prefix}EditDamageIncrease" value="${
        safeGetSkill(hero, prefix).damageIncreasePercent
            ? hero.skillOptions[prefix].damageIncreasePercent
            : 0
    }">
            </span>
        </div>

        <div class="editGearFormRow">
            <div class="editSkillLabel" data-t>${i18next.t(
                'Elemental Advantage'
            )}</div>
            <input type="checkbox" id="${prefix}EditElementalAdvantageBox" ${
        safeGetSkill(hero, prefix).elementalAdvantageEnabled ? 'checked' : ''
    }>
        </div>

        <div class="editGearFormRow">
            <div class="editSkillLabel" data-t>${i18next.t(
                'Decreased Attack'
            )}</div>
            <input type="checkbox" id="${prefix}EditDecreasedAttackBox" ${
        safeGetSkill(hero, prefix).decreasedAttackBuffEnabled ? 'checked' : ''
    }>
        </div>

        <div class="editGearFormRow">
            <div class="editSkillLabel" data-t>${i18next.t('Attack Buff')}</div>
            <input type="checkbox" id="${prefix}EditAttackBuffBox" ${
        safeGetSkill(hero, prefix).attackBuffEnabled ? 'checked' : ''
    }>
        </div>

        <div class="editGearFormRow">
            <div class="editSkillLabel" data-t>${i18next.t(
                'Greater Attack Buff'
            )}</div>
            <input type="checkbox" id="${prefix}EditGreaterAttackBuffBox" ${
        safeGetSkill(hero, prefix).greaterAttackBuffEnabled ? 'checked' : ''
    }>
        </div>

        <div class="editGearFormRow">
            <div class="editSkillLabel" data-t>${i18next.t(
                'Crit Damage Buff'
            )}</div>
            <input type="checkbox" id="${prefix}EditCritDamageBuffBox" ${
        safeGetSkill(hero, prefix).critDamageBuffEnabled ? 'checked' : ''
    }>
        </div>

        <div class="editGearFormRow">
            <div class="editSkillLabel" data-t>${i18next.t('Vigor')}</div>
            <input type="checkbox" id="${prefix}EditVigorAttackBuffBox" ${
        safeGetSkill(hero, prefix).vigorAttackBuffEnabled ? 'checked' : ''
    }>
        </div>
    </div>

    <div class="editGearFormVerticalMed"></div>

    <div class="editGearFormHalf">
        <div class="editGearFormRow">
            <div class="editSkillLabel" data-t>${i18next.t(
                'Target Defense'
            )}</div>
            <span class="valuePadding input-holder">
                <input type="number" class="bonusStatInput" max="100" accuracy="1" min="0" id="${prefix}EditTargetDefense" value="${
        safeGetSkill(hero, prefix).targetDefense
            ? hero.skillOptions[prefix].targetDefense
            : 0
    }">
            </span>
        </div>

        <div class="editGearFormRow">
            <div class="editSkillLabel" data-t>${i18next.t(
                'Defense Increase'
            )}</div>
            <span class="valuePadding input-holder">
                <input type="number" class="bonusStatInput" max="100" accuracy="1" min="0" id="${prefix}EditTargetDefenseIncrease" value="${
        safeGetSkill(hero, prefix).targetDefenseIncreasePercent
            ? hero.skillOptions[prefix].targetDefenseIncreasePercent
            : 0
    }">
            </span>
        </div>

        <div class="editGearFormRow">
            <div class="editSkillLabel" data-t>${i18next.t(
                'Damage Reduction'
            )}</div>
            <span class="valuePadding input-holder">
                <input type="number" class="bonusStatInput" max="100" accuracy="1" min="0" id="${prefix}EditTargetDamageReduction" value="${
        safeGetSkill(hero, prefix).targetDamageReductionPercent
            ? hero.skillOptions[prefix].targetDamageReductionPercent
            : 0
    }">
            </span>
        </div>

        <div class="editGearFormRow">
            <div class="editSkillLabel" data-t>${i18next.t(
                'Damage Transfer'
            )}</div>
            <span class="valuePadding input-holder">
                <input type="number" class="bonusStatInput" max="100" accuracy="1" min="0" id="${prefix}EditTargetDamageTransfer" value="${
        safeGetSkill(hero, prefix).targetDamageTransferPercent
            ? hero.skillOptions[prefix].targetDamageTransferPercent
            : 0
    }">
            </span>
        </div>

        <div class="editGearFormRow">
            <div class="editSkillLabel" data-t>${i18next.t(
                'Defense Buff'
            )}</div>
            <input type="checkbox" id="${prefix}EditTargetDefenseBuffBox" ${
        safeGetSkill(hero, prefix).targetDefenseBuffEnabled ? 'checked' : ''
    }>
        </div>

        <div class="editGearFormRow">
            <div class="editSkillLabel" data-t>${i18next.t('Vigor')}</div>
            <input type="checkbox" id="${prefix}EditTargetVigorBuffBox" ${
        safeGetSkill(hero, prefix).targetVigorDefenseBuffEnabled
            ? 'checked'
            : ''
    }>
        </div>

        <div class="editGearFormRow">
            <div class="editSkillLabel" data-t>${i18next.t(
                'Defense Break'
            )}</div>
            <input type="checkbox" id="${prefix}EditTargetDefenseBreakBox" ${
        safeGetSkill(hero, prefix).targetDefenseBreakBuffEnabled
            ? 'checked'
            : ''
    }>
        </div>

        <div class="editGearFormRow">
            <div class="editSkillLabel" data-t>${i18next.t('Target')}</div>
            <input type="checkbox" id="${prefix}EditTargetTargetBuffBox" ${
        safeGetSkill(hero, prefix).targetTargetBuffEnabled ? 'checked' : ''
    }>
        </div>
    </div>
</div>
`;
    return html;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function getEeHtml(hero, ee) {
    const initialValue = hero.eeStat || 0;

    return `
        <div class="valuePadding input-holder">
            <input type="number" class="bonusStatInput" id="editHeroBonusEeStat" value="${initialValue}">
        </div>
    `;
    // <div class="smallBlankFormSpace"></div>
    // <div class="editEeStatLabel">${labelText}</div>
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
            fixedImprintValues[grade] = Utils.round10ths(
                imprintValues[grade] * 100
            );
        } else {
            fixedImprintValues[grade] = imprintValues[grade];
        }
    }

    let html = `<select class="editGearStatSelect" id="editImprint"><option value="None">${i18next.t(
        'None'
    )}</option>`;

    for (const grade of Object.keys(fixedImprintValues)) {
        html += `<option value="${fixedImprintValues[grade]}" ${
            parseFloat(hero.imprintNumber) === fixedImprintValues[grade] ? 'selected' : ''
        }>${fixedImprintValues[grade]}${displayText} - ${grade}</option>`;
        // html += `<option value="${imprintValues[grade]}"}>${grade + " - " + imprintValues[grade]} ${displayText}</option>`
    }

    html += `</select>
            `;
    // <div class="smallBlankFormSpace"></div>
    // <div class="editEeStatLabel">${displayText}</div>
    return html;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
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

function getArtifactHtml(hero) {
    let html = `<option value="None">${i18next.t('None')}</option>`;

    const artifactsJson = HeroData.getAllArtifactData();
    const artifacts = Object.values(artifactsJson);

    for (const artifact of artifacts) {
        // console.log(hero, artifact.name);
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
                    'atk'
                )}, ${artifactStats.health.toFixed(1)} ${i18next.t(
                    'hp'
                )}, ${artifactStats.defense.toFixed(1)} ${i18next.t(
                    'def'
                )})</option>`;
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

function getStatOptionsHtml(stat) {
    const type = stat ? stat.type : null;
    return `
<option value="None"></option>
<option value="AttackPercent" ${
        type === 'AttackPercent' ? 'selected' : ''
    }>${i18next.t('Attack %')}</option>
<option value="Attack" ${type === 'Attack' ? 'selected' : ''}>${i18next.t(
        'Attack'
    )}</option>
<option value="HealthPercent" ${
        type === 'HealthPercent' ? 'selected' : ''
    }>${i18next.t('Health %')}</option>
<option value="Health" ${type === 'Health' ? 'selected' : ''}>${i18next.t(
        'Health'
    )}</option>
<option value="DefensePercent" ${
        type === 'DefensePercent' ? 'selected' : ''
    }>${i18next.t('Defense %')}</option>
<option value="Defense" ${type === 'Defense' ? 'selected' : ''}>${i18next.t(
        'Defense'
    )}</option>
<option value="Speed" ${type === 'Speed' ? 'selected' : ''}>${i18next.t(
        'Speed'
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
        'Weapon'
    )}</option>
<option value="Helmet" ${gear === 'Helmet' ? 'selected' : ''}>${i18next.t(
        'Helmet'
    )}</option>
<option value="Armor" ${gear === 'Armor' ? 'selected' : ''}>${i18next.t(
        'Armor'
    )}</option>
<option value="Necklace" ${gear === 'Necklace' ? 'selected' : ''}>${i18next.t(
        'Necklace'
    )}</option>
<option value="Ring" ${gear === 'Ring' ? 'selected' : ''}>${i18next.t(
        'Ring'
    )}</option>
<option value="Boots" ${gear === 'Boots' ? 'selected' : ''}>${i18next.t(
        'Boots'
    )}</option>
`;
}

function getGearSetOptionsHtml(item) {
    const { set } = item;
    return `
<option value="None"></option>
<option value="SpeedSet" ${set === 'SpeedSet' ? 'selected' : ''}>${i18next.t(
        'Speed'
    )}</option>
<option value="AttackSet" ${set === 'AttackSet' ? 'selected' : ''}>${i18next.t(
        'Attack'
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
        'Rage'
    )}</option>
<option value="HealthSet" ${set === 'HealthSet' ? 'selected' : ''}>${i18next.t(
        'Health'
    )}</option>
<option value="DefenseSet" ${
        set === 'DefenseSet' ? 'selected' : ''
    }>${i18next.t('Defense')}</option>
<option value="CriticalSet" ${
        set === 'CriticalSet' ? 'selected' : ''
    }>${i18next.t('Critical')}</option>
<option value="HitSet" ${set === 'HitSet' ? 'selected' : ''}>${i18next.t(
        'Hit'
    )}</option>
<option value="ResistSet" ${set === 'ResistSet' ? 'selected' : ''}>${i18next.t(
        'Resist'
    )}</option>
<option value="UnitySet" ${set === 'UnitySet' ? 'selected' : ''}>${i18next.t(
        'Unity'
    )}</option>
<option value="ImmunitySet" ${
        set === 'ImmunitySet' ? 'selected' : ''
    }>${i18next.t('Immunity')}</option>
<option value="PenetrationSet" ${
        set === 'PenetrationSet' ? 'selected' : ''
    }>${i18next.t('Penetration')}</option>
<option value="InjurySet" ${set === 'InjurySet' ? 'selected' : ''}>${i18next.t(
        'Injury'
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

`;
}

function getGearRankOptionsHtml(item) {
    const { rank } = item;
    return `
<option value="None"></option>
<option value="Epic" ${rank === 'Epic' ? 'selected' : ''}>${i18next.t(
        'Epic'
    )}</option>
<option value="Heroic" ${rank === 'Heroic' ? 'selected' : ''}>${i18next.t(
        'Heroic'
    )}</option>
<option value="Rare" ${rank === 'Rare' ? 'selected' : ''}>${i18next.t(
        'Rare'
    )}</option>
<option value="Good" ${rank === 'Good' ? 'selected' : ''}>${i18next.t(
        'Good'
    )}</option>
<option value="Normal" ${rank === 'Normal' ? 'selected' : ''}>${i18next.t(
        'Normal'
    )}</option>
`;
}

function getGearMaterialOptionsHtml(item) {
    const { material } = item;
    return `
<option value="None">${i18next.t('None')}</option>
<option value="Hunt" ${material === 'Hunt' ? 'selected' : ''}>${i18next.t(
        'Hunt'
    )}</option>
<option value="Conversion" ${
        material === 'Conversion' ? 'selected' : ''
    }>${i18next.t('Conversion')}</option>
`;
}

// Stats that cannot be modded onto certain slots — used for badge annotations.
const MOD_SLOT_CONSTRAINTS = {
    Health:         '✗Helm',
    Defense:        '✗Weap ✗Arm',
    DefensePercent: '✗Weap',
    Attack:         '✗Weap ✗Arm',
    AttackPercent:  '✗Arm',
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
            (x) => !keepStats.includes(x) && !discardStats.includes(x)
        );
        list = ignoreList;
    }

    let result = '';
    for (let i = 0; i < list.length; i += 1) {
        const stat = list[i];
        result += `<div class="list-group-item" data-id="${stat}"><span class="modStatLabel">${i18next.t(
            optimizerStatToDisplayStat[stat]
        )}</span>${modConstraintBadge(stat)}</div>`;
    }
    return result;
}

function getBaseStatsHtml(hero, heroInfo) {
    const base = heroInfo.calculatedStatus?.lv60SixStarFullyAwakened;
    if (!base) return '<p style="color:var(--font-color)">No base stats available</p>';

    const b = (v) => parseFloat(v) || 0;

    // Bonus stats (manually entered in Tab 1)
    const bonusAtk    = b(hero.bonusAtk);
    const bonusAtkPct = b(hero.bonusAtkPercent);
    const bonusDef    = b(hero.bonusDef);
    const bonusDefPct = b(hero.bonusDefPercent);
    const bonusHp     = b(hero.bonusHp);
    const bonusHpPct  = b(hero.bonusHpPercent);
    const bonusSpd    = b(hero.bonusSpeed);
    const bonusCr     = b(hero.bonusCr);
    const bonusCd     = b(hero.bonusCd);
    const bonusEff    = b(hero.bonusEff);
    const bonusRes    = b(hero.bonusRes);

    // Artifact + EE + Imprint combined (pre-computed by backend)
    const aeiAtk     = b(hero.aeiAtk);
    const aeiAtkPct  = b(hero.aeiAtkPercent);
    const aeiDef     = b(hero.aeiDef);
    const aeiDefPct  = b(hero.aeiDefPercent);
    const aeiHp      = b(hero.aeiHp);
    const aeiHpPct   = b(hero.aeiHpPercent);
    const aeiSpd     = b(hero.aeiSpeed);
    const aeiCr      = b(hero.aeiCr);
    const aeiCd      = b(hero.aeiCd);
    const aeiEff     = b(hero.aeiEff);
    const aeiRes     = b(hero.aeiRes);

    // Column 2: Base + Bonus stats only
    const withBonusAtk = Math.round(base.atk * (1 + bonusAtkPct / 100) + bonusAtk);
    const withBonusDef = Math.round(base.def * (1 + bonusDefPct / 100) + bonusDef);
    const withBonusHp  = Math.round(base.hp  * (1 + bonusHpPct  / 100) + bonusHp);
    const withBonusSpd = base.spd + bonusSpd;
    const baseCr   = Math.round(base.chc * 1000) / 10;
    const baseCd   = Math.round(base.chd * 1000) / 10;
    const baseEff  = Math.round(base.eff * 1000) / 10;
    const baseRes  = Math.round(base.efr * 1000) / 10;
    const withBonusCr  = Math.round((baseCr  + bonusCr)  * 10) / 10;
    const withBonusCd  = Math.round((baseCd  + bonusCd)  * 10) / 10;
    const withBonusEff = Math.round((baseEff + bonusEff) * 10) / 10;
    const withBonusRes = Math.round((baseRes + bonusRes) * 10) / 10;

    // Column 3: Base + Bonus stats + Artifact/EE/Imprint
    const withAeiAtk = Math.round(base.atk * (1 + (bonusAtkPct + aeiAtkPct) / 100) + bonusAtk + aeiAtk);
    const withAeiDef = Math.round(base.def * (1 + (bonusDefPct + aeiDefPct) / 100) + bonusDef + aeiDef);
    const withAeiHp  = Math.round(base.hp  * (1 + (bonusHpPct  + aeiHpPct)  / 100) + bonusHp  + aeiHp);
    const withAeiSpd = base.spd + bonusSpd + aeiSpd;
    const withAeiCr  = Math.round((baseCr  + bonusCr  + aeiCr)  * 10) / 10;
    const withAeiCd  = Math.round((baseCd  + bonusCd  + aeiCd)  * 10) / 10;
    const withAeiEff = Math.round((baseEff + bonusEff + aeiEff) * 10) / 10;
    const withAeiRes = Math.round((baseRes + bonusRes + aeiRes) * 10) / 10;

    const cls = (a, c) => a !== c ? 'baseStatChanged' : '';

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
    const artifactName = (hero.artifactName && hero.artifactName !== 'None') ? hero.artifactName : null;
    const imprintVal   = (hero.imprintNumber && hero.imprintNumber !== 'None') ? hero.imprintNumber : null;
    const eeVal        = (hero.eeNumber      && hero.eeNumber      !== 'None') ? hero.eeNumber      : null;
    const aeiParts = [
        artifactName ? `Artifact: ${artifactName} (Lv ${hero.artifactLevel || '?'})` : null,
        imprintVal   ? `Imprint: ${imprintVal}` : null,
        eeVal        ? `EE: ${eeVal}` : null,
    ].filter(Boolean);
    const aeiNote = aeiParts.length ? aeiParts.join(' &nbsp;|&nbsp; ') : 'No Artifact / EE / Imprint set';

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
                    ${statRow('Attack',        base.atk, withBonusAtk, withAeiAtk)}
                    ${statRow('Defense',       base.def, withBonusDef, withAeiDef)}
                    ${statRow('Health',        base.hp,  withBonusHp,  withAeiHp)}
                    ${statRow('Speed',         base.spd, withBonusSpd, withAeiSpd)}
                    ${pctRow('Crit Rate',    baseCr,  withBonusCr,  withAeiCr)}
                    ${pctRow('Crit Dmg',     baseCd,  withBonusCd,  withAeiCd)}
                    ${pctRow('Effectiveness',baseEff, withBonusEff, withAeiEff)}
                    ${pctRow('Effect Res',   baseRes, withBonusRes, withAeiRes)}
                </tbody>
            </table>
        </div>`;
}

export default Dialog;

// ─── Per-Slot Substat Pre-Filter Dialog ─────────────────────────────────────

// Substats that cannot appear on a slot — either because they are the fixed
// main stat for that slot, or because the game prevents them as substats.
const SLOT_MAIN_STATS = {
    Weapon:  'Attack',
    Helmet:  'Health',
    Armor:   'Defense',
};

const SLOT_EXCLUDED_SUBSTATS = {
    Weapon: ['Attack', 'Defense', 'DefensePercent'],
    Helmet: ['Health'],
    Armor:  ['Defense', 'Attack', 'AttackPercent'],
};

const ALL_SUBSTATS = [
    { type: 'AttackPercent',          label: 'Atk%'   },
    { type: 'Attack',                 label: 'ATK'    },
    { type: 'HealthPercent',          label: 'HP%'    },
    { type: 'Health',                 label: 'HP'     },
    { type: 'DefensePercent',         label: 'DEF%'   },
    { type: 'Defense',                label: 'DEF'    },
    { type: 'Speed',                  label: 'Spd'    },
    { type: 'CriticalHitChancePercent', label: 'CC%'  },
    { type: 'CriticalHitDamagePercent', label: 'CD%'  },
    { type: 'EffectivenessPercent',   label: 'EFF%'   },
    { type: 'EffectResistancePercent',label: 'ER%'    },
];

const GEAR_SLOTS = [
    { key: 'Weapon',   label: 'Weapon',   icon: './assets/gearweapon.png'   },
    { key: 'Helmet',   label: 'Helmet',   icon: './assets/gearhelmet.png'   },
    { key: 'Armor',    label: 'Armor',    icon: './assets/geararmor.png'    },
    { key: 'Necklace', label: 'Necklace', icon: './assets/gearnecklace.png' },
    { key: 'Ring',     label: 'Ring',     icon: './assets/gearring.png'     },
    { key: 'Boots',    label: 'Boots',    icon: './assets/gearboots.png'    },
];

Dialog.slotSubstatFilterDialog = async function slotSubstatFilterDialog(currentFilters, index) {
    const tabButtons = GEAR_SLOTS.map((s, i) =>
        `<button type="button" class="ssf-tab${i === 0 ? ' ssf-tab-active' : ''}" data-slot="${s.key}" style="display:flex;align-items:center;gap:4px;padding:4px 8px;border:1px solid #555;background:#2a2a2a;color:#ccc;cursor:pointer;border-radius:4px;font-size:12px">
            <img src="${s.icon}" width="16" height="16" style="vertical-align:middle"> ${s.label}
         </button>`
    ).join('');

    const panels = GEAR_SLOTS.map((s, i) => {
        const excluded = SLOT_EXCLUDED_SUBSTATS[s.key] || [];
        const sf = (currentFilters && currentFilters[s.key]) || {};
        const enabledChecked = sf.enabled ? 'checked' : '';
        const currentSubstats = sf.substats || [];
        const currentCount = sf.minCount || 1;

        const checkboxes = ALL_SUBSTATS.map((sub) => {
            const isExcluded = excluded.includes(sub.type);
            const isMainStat = SLOT_MAIN_STATS[s.key] === sub.type;
            const isChecked = !isExcluded && currentSubstats.includes(sub.type) ? 'checked' : '';
            const disabledAttr = isExcluded ? 'disabled' : '';
            const opacityStyle = isExcluded ? 'opacity:0.3;' : '';
            const titleAttr = isMainStat ? 'title="Fixed main stat — cannot be a substat"' : '';
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
                    container.querySelectorAll('.ssf-tab').forEach((b) => b.classList.remove('ssf-tab-active'));
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
                    const enabledCb = container.querySelector(`.ssf-enabled[data-slot="${slot}"]`);
                    const hasSubs = container.querySelectorAll(`.ssf-sub[data-slot="${slot}"]:checked`).length > 0;
                    if (enabledCb && enabledCb.checked && hasSubs) {
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
            container.querySelector('#ssf-enable-all').addEventListener('click', () => {
                container.querySelectorAll('.ssf-enabled').forEach((cb) => { cb.checked = true; });
                updateTabHighlight();
            });
            container.querySelector('#ssf-disable-all').addEventListener('click', () => {
                container.querySelectorAll('.ssf-enabled').forEach((cb) => { cb.checked = false; });
                updateTabHighlight();
            });

            // +/- buttons
            container.querySelectorAll('.ssf-minus').forEach((btn) => {
                btn.addEventListener('click', () => {
                    const slot = btn.dataset.slot;
                    const countEl = container.querySelector(`.ssf-count[data-slot="${slot}"]`);
                    const val = parseInt(countEl.textContent, 10) || 1;
                    if (val > 1) countEl.textContent = val - 1;
                });
            });
            container.querySelectorAll('.ssf-plus').forEach((btn) => {
                btn.addEventListener('click', () => {
                    const slot = btn.dataset.slot;
                    const countEl = container.querySelector(`.ssf-count[data-slot="${slot}"]`);
                    const val = parseInt(countEl.textContent, 10) || 1;
                    if (val < 4) countEl.textContent = val + 1;
                });
            });
        },
        preConfirm: () => {
            const container = Swal.getHtmlContainer();
            const slotFilters = {};
            GEAR_SLOTS.forEach(({ key }) => {
                const enabledCb = container.querySelector(`.ssf-enabled[data-slot="${key}"]`);
                const enabled = enabledCb ? enabledCb.checked : false;
                const substats = Array.from(container.querySelectorAll(`.ssf-sub[data-slot="${key}"]:checked`))
                    .map((cb) => cb.value);
                const countEl = container.querySelector(`.ssf-count[data-slot="${key}"]`);
                const minCount = countEl ? parseInt(countEl.textContent, 10) || 1 : 1;
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
