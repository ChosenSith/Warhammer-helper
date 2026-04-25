import {
  FORMATIONS,
  HEROIC_TRAITS,
  ARTIFACTS,
  BLOOD_TITHE_ABILITIES,
  tithePrereqsMet,
  getUnitById,
  getFormationById,
  getPhaseInstancesForArmy,
  getBloodTitheReasonsForPhase,
  getTrempesDeSangEffectsForUnit,
  getTrempesDeSangThreshold,
  isTrempesDeSangActive,
  getTrempesDeSangCombatMods,
  getPrayerRitualCost,
  MELEE_PROXIMITY_RECAP,
  MELEE_PROXIMITY_RECAP_IRONJAWZ,
  weaponIsRangedForPhase,
  CONVOCATION_PRAYER_TO_UNIT,
  FACTIONS,
  getUnitsForFaction,
  getFormationsForFaction,
  getHeroicTraitsForFaction,
  getArtifactsForFaction,
  getPrayersForFaction,
  getDefaultArmySetupForFaction,
  isKhorneFactionId,
  isPeauxVertesFactionId,
  isSoulblightFactionId,
  isSeraphonFactionId,
  isSylvanethFactionId,
  isPlayableFactionId,
  IRONJAWZ_BATTLE_TRAITS,
  SOULBLIGHT_BATTLE_TRAITS,
  SOULBLIGHT_SPELLS,
  SOULBLIGHT_LINKED_ENEMY_EFFECTS,
  SOULBLIGHT_ARTIFACTS,
  SOULBLIGHT_CONVOCATION_SPELLS,
  MELEE_PROXIMITY_RECAP_SOULBLIGHT,
  SERAPHON_ASTERISMS,
  SERAPHON_BATTLE_TRAITS,
  SERAPHON_POURSUIVRE_INTRO,
  SERAPHON_SPELLS,
  getSeraphonAsterismById,
  MELEE_PROXIMITY_RECAP_SERAPHON,
  MELEE_PROXIMITY_RECAP_SYLVANETH,
  seraphonUnitIsMonsterSeraphon,
  SYLVANETH_SPELLS,
  SYLVANETH_SEASONS,
  SYLVANETH_GLADES,
  getSylvanethGladeById,
  getSylvanethSeasonById,
  SYLVANETH_FORMATIONS,
} from "./data/khorne-catalog.js";
import { buildUniversalPcDrawerHtml } from "./data/universal-pc-rules.js";
import {
  parseRoll,
  formatRoll,
  applyRollBonus,
  parseRend,
  formatRendNum,
  sumBuffMods,
} from "./buff-math.js";
import {
  buildFactionEffectsPayload,
  getShootingHitPenaltyVsKhorne,
  remoteHasSyncedEffect,
  collectIncomingRemoteBuffsForInstance,
  mergeOutgoingBuffsForEnemyRow,
  isOutgoingEffectActiveForBattleRound,
} from "./battle-effects.js";
import { applyOpponentUnitsToBattle } from "./multiplayer-sync.js";
import * as partyKit from "./partykit-bridge.js";

/* Salon multijoueur : PartyKit (voir multiplayer-sync.js, partykit-bridge.js). */

/** Hôte après `npm run deploy` dans `party/` — adapte si tu redéploies sous un autre nom. */
const DEFAULT_PARTYKIT_HOST = "warhammer-helper-party.chosensith.partykit.dev";

const STORAGE_KEY = "aos-khorne-game-v1";
const ARMY_PRESETS_KEY = "aos-khorne-army-presets-v1";
const MAX_ARMY_PRESETS = 28;
/** Nombre max d’équipes (salon multijoueur, ex. PartyKit). */
const MAX_TEAMS = 10;

function normalizeTeamId(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return 1;
  const x = Math.floor(n);
  if (x < 1) return 1;
  if (x > MAX_TEAMS) return MAX_TEAMS;
  return x;
}

const PHASES = [
  { id: "deployment", name: "Déploiement" },
  { id: "hero", name: "Phase des héros" },
  { id: "movement", name: "Phase de mouvement" },
  { id: "shooting", name: "Phase de tir" },
  { id: "charge", name: "Phase de charge" },
  { id: "combat", name: "Phase de mêlée" },
  { id: "end", name: "Fin du tour" },
];

const CP_MAX = 4;

function isPlayerTurn(b) {
  return b && b.activeSide === "player";
}

/** Rappel fort (plein texte) pour formation / trait / artefact selon phase et camp actif. */
function showPowerFullForPhase(item, ph, b) {
  if (!item?.phases?.length || !item.phases.includes(ph.id)) return false;
  if (ph.id === "combat" && item.combatBothSides) return true;
  if (
    (ph.id === "combat" || ph.id === "shooting") &&
    item.combatAndShootingBothSides
  ) {
    return true;
  }
  if (item.enemyTurnOnly && isPlayerTurn(b)) return false;
  if (ph.id === "hero" && item.bothHeroPhases) return true;
  if (item.playerTurnOnly && !isPlayerTurn(b)) {
    if (ph.id === "end" && item.endPhaseBothSides) {
      /* rappel La faim / autres fin de tour des deux camps */
    } else if (ph.id === "charge" && item.chargePhaseBothSides) {
      /* rappel charge adverse */
    } else {
      return false;
    }
  }
  if (ph.id === "hero" && item.heroPhase) {
    if (item.heroPhase === "mine") return isPlayerTurn(b);
    if (item.heroPhase === "opponent") return b.activeSide === "opponent";
  }
  return true;
}

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function defaultTitheUnlocked() {
  const u = {};
  for (const a of BLOOD_TITHE_ABILITIES) {
    if (a.defaultUnlocked) u[a.id] = true;
  }
  return u;
}

function isKhorneFactionContext() {
  return isKhorneFactionId(state.setup?.factionId);
}

function isPeauxVertesFactionContext() {
  return isPeauxVertesFactionId(state.setup?.factionId);
}

function isSoulblightFactionContext() {
  return isSoulblightFactionId(state.setup?.factionId);
}

function isSeraphonFactionContext() {
  return isSeraphonFactionId(state.setup?.factionId);
}

function isSylvanethFactionContext() {
  return isSylvanethFactionId(state.setup?.factionId);
}

function soulblightInstanceAliveByCatalogId(catalogId) {
  return state.instances.find(
    (i) =>
      !i.destroyed && getUnitById(i.catalogId)?.id === catalogId,
  );
}

function soulblightArmyHasCatalogUnit(catalogId) {
  return !!soulblightInstanceAliveByCatalogId(catalogId);
}

function unitIsVampireNonMonster(u) {
  return !!(u && unitKeyword(u, "VAMPIRE") && !unitKeyword(u, "MONSTRE"));
}

function isPlayableFactionContext() {
  return isPlayableFactionId(state.setup?.factionId);
}

function ironjawzWaaaghAuraColumnActive(b) {
  return (
    isPeauxVertesFactionContext() &&
    b &&
    isPlayerTurn(b) &&
    b.ironjawzWaaaghAuraActiveThisPlayerTurn === true &&
    !!b.ironjawzWaaaghTriggerInstanceId
  );
}

/** Colonne « 8+ charge » (formation Bagarre) : du tour, phase charge → fin du tour joueur. */
function ironjawzCharge8ColumnActive(b, ph) {
  if (!isPeauxVertesFactionContext() || !b || !isPlayerTurn(b)) return false;
  if (state.setup.formationId !== "ij_bagarde") return false;
  return ["charge", "shooting", "combat", "end"].includes(ph?.id);
}

function getIronjawzMeleeAttackBonus(inst, u, w) {
  if (!isPeauxVertesFactionContext() || !inst || inst.destroyed || !u || !w)
    return 0;
  if (weaponIsRangedForPhase(w)) return 0;
  let n = 0;
  const b = state.battle;
  if (
    b?.ironjawzWaaaghAuraActiveThisPlayerTurn &&
    inst.ironjawzInWaaaghAura
  ) {
    n += 1;
  }
  if (
    state.setup.formationId === "ij_bagarde" &&
    inst.ironjawzChargeRoll8Plus &&
    !unitKeyword(u, "HÉROS")
  ) {
    n += 1;
  }
  n += waaaghVictoryMeleeAttackBonus(inst, u, w);
  return n;
}

function formatAttacksCellWithMeleeAtkBonus(w, inst, u, extraAtk) {
  let atkCell = w.attacks ?? "—";
  if (w.dynamicAttacks === "belakor_lame") {
    atkCell = String(getBelakorLameAttacks(inst, u));
  }
  if (w.dynamicAttacks === "gordrakk_poings") {
    atkCell = String(getGordrakkPoingsAttacks(inst, u));
  }
  if (w.dynamicAttacks === "vhordrai_griffes") {
    atkCell = String(getVhordraiGriffesAttacks(inst, u));
  }
  if (w.dynamicAttacks === "carnosaur_machoires") {
    atkCell = String(getCarnosaurMassiveJawAttacks(inst, u));
  }
  if (w.dynamicAttacks === "syl_durthu_epee") {
    atkCell = String(getSylDurthuEpeeAttacks(inst, u));
  }
  if (!extraAtk || inst.destroyed) return atkCell;
  if (w.dynamicAttacks === "belakor_lame") {
    const n = parseInt(atkCell, 10);
    if (Number.isFinite(n)) return `${atkCell} → ${n + extraAtk}`;
  }
  if (w.dynamicAttacks === "gordrakk_poings") {
    const n = parseInt(atkCell, 10);
    if (Number.isFinite(n)) return `${atkCell} → ${n + extraAtk}`;
  }
  if (w.dynamicAttacks === "vhordrai_griffes") {
    const n = parseInt(atkCell, 10);
    if (Number.isFinite(n)) return `${atkCell} → ${n + extraAtk}`;
  }
  if (w.dynamicAttacks === "carnosaur_machoires") {
    const n = parseInt(atkCell, 10);
    if (Number.isFinite(n)) return `${atkCell} → ${n + extraAtk}`;
  }
  if (w.dynamicAttacks === "syl_durthu_epee") {
    const n = parseInt(atkCell, 10);
    if (Number.isFinite(n)) return `${atkCell} → ${n + extraAtk}`;
  }
  const s = String(atkCell).trim();
  if (/^\d+$/.test(s)) {
    const n = parseInt(s, 10);
    return `${atkCell} → ${n + extraAtk}`;
  }
  if (s && s !== "—") {
    return `${atkCell} <span class="muted small">(+${extraAtk} Mâchefers)</span>`;
  }
  return atkCell;
}

function ironjawzHeroInstancesForWaaagh() {
  const out = [];
  for (const inst of state.instances) {
    if (inst.destroyed || inst.isInvocation) continue;
    const u = getUnitById(inst.catalogId);
    if (!u || !unitKeyword(u, "HÉROS") || !unitKeyword(u, "MÂCHEFERS"))
      continue;
    out.push(inst);
  }
  return out;
}

function buildIronjawzBattleEncartsHtml(ph, b) {
  if (!isPeauxVertesFactionContext() || !b || !isPlayerTurn(b)) return "";

  let h = "";

  if (ph.id === "hero") {
    h += `<div class="panel-inner ironjawz-encart ironjawz-encart--pd">
      <h4 class="subh">Puissants Destructeurs</h4>
      <p class="muted small">1× par <strong>tour</strong> (armée), n’importe quelle <strong>phase des héros</strong> de ton tour : déplacement 3" d’une unité Mâchefers non placée ce tour. Un <strong>tour</strong> = toutes les phases pour une équipe ; une <strong>manche</strong> (round) = tour ami puis tour ennemi — tu peux donc utiliser cette aptitude à chaque phase des héros de <strong>ton</strong> tour.</p>
    </div>`;
  }

  if (ph.id === "charge") {
    const heroes = ironjawzHeroInstancesForWaaagh();
    const gordrakkInst = heroes.find(
      (i) => getUnitById(i.catalogId)?.id === "ij_gordrakk",
    );
    const defaultTriggerId = gordrakkInst?.id || "";
    const opts = heroes
      .map((inst) => {
        const u = getUnitById(inst.catalogId);
        if (u) ensureInstanceTracking(inst);
        const sel =
          b.ironjawzWaaaghTriggerInstanceId === inst.id ||
          (!b.ironjawzWaaaghTriggerInstanceId && defaultTriggerId &&
            inst.id === defaultTriggerId);
        const lab =
          (u?.name || inst.id) + (u ? formatSidebarFiguresSuffix(inst, u) : "");
        return `<option value="${escapeHtml(inst.id)}" ${sel ? "selected" : ""}>${escapeHtml(lab)}</option>`;
      })
      .join("");
    const used = b.ironjawzWaaaghUsedThisBattle === true;
    if (used) {
      const tr = state.instances.find(
        (i) => i.id === b.ironjawzWaaaghTriggerInstanceId,
      );
      const tu = tr ? getUnitById(tr.catalogId) : null;
      h += `<div class="panel-inner ironjawz-encart ironjawz-encart--waaagh">
        <h4 class="subh">Waaagh! Mâchefer</h4>
        <p class="muted small">Déjà déclaré cette bataille. Déclencheur : <strong>${escapeHtml(tu?.name || "—")}</strong>. Utilise la colonne du suivi pour les unités à 18" ; rappel : unités Mâchefers <strong>ennemies</strong> entièrement à 18" du déclencheur : <strong>−1 au toucher</strong>.</p>
      </div>`;
    } else {
      h += `<div class="panel-inner ironjawz-encart ironjawz-encart--waaagh">
      <h4 class="subh">Waaagh! Mâchefer</h4>
      <p class="muted small">1× par <strong>bataille</strong>, ta phase de charge : choisis un <strong>héros Mâchefer</strong> déclencheur (par défaut : Gordrakk s’il est en liste). Pour le reste de <strong>ton tour</strong>, les unités <strong>amies</strong> entièrement à 18" : <strong>+1 au jet de charge</strong> et <strong>+1 A</strong> (mêlée) ; les unités Mâchefers <strong>ennemies</strong> entièrement à 18" du déclencheur : <strong>−1 au toucher</strong> — coche les alliés dans le suivi.</p>
      <label class="field"><span>Héros déclencheur</span>
        <select class="ironjawz-waaagh-hero-select full-width">
          ${defaultTriggerId ? "" : `<option value="">— Choisir —</option>`}
          ${opts}
        </select>
      </label>
      <label class="tracker-label"><input type="checkbox" class="ironjawz-waaagh-declare" /> Déclarer le Waaagh! (active les bonus jusqu’à la fin de ton tour)</label>
    </div>`;
    }
  }

  return h;
}

/** Seigneurs Ruinemânes — encarts d’aptitudes d’armée (Invocation / Légions / La faim) et rappels d’artefacts / traits. */
function buildSoulblightBattleEncartsHtml(ph, b) {
  if (!isSoulblightFactionContext() || !b) return "";

  let h = "";

  const traitId = state.setup.traitId;
  const artId = state.setup.artifactId;
  const traitHeroId = state.setup.traitHeroInstanceId;
  const artHeroId = state.setup.artifactHeroInstanceId;

  const hasMachine = soulblightArmyHasCatalogUnit("sb_machine_mortis");
  const machineInst = soulblightInstanceAliveByCatalogId("sb_machine_mortis");
  const machineE = machineInst
    ? Math.min(
        6,
        Math.max(1, Number(machineInst.soulblightMachineMortisEnergy) || 1),
      )
    : 1;

  if (ph.id === "hero" && isPlayerTurn(b)) {
    const spellRemindList = SOULBLIGHT_SPELLS.filter((sp) =>
      sp.phases?.includes("hero"),
    )
      .map(
        (sp) =>
          `<li><strong>${escapeHtml(sp.name)}</strong> (incant. ${escapeHtml(sp.cast)}) — ${escapeHtml(sp.summary)}</li>`,
      )
      .join("");
    h += `<div class="panel-inner soulblight-encart soulblight-encart--domaine-non-vie">
      <h4 class="subh">Domaine de la Non-Vie — sorts de sorcier</h4>
      <p class="muted small">Rappel général pour ta <strong>phase des héros</strong> (sorciers Seigneurs Ruinemânes — tableau de sorts).</p>
      <ul class="abil-list">${spellRemindList}</ul>
    </div>`;

    const invocBlock = `<div class="panel-inner soulblight-encart soulblight-encart--invocation">
      <h4 class="subh">Invocation cadavérique</h4>
      <p class="muted small">1× par <strong>tour</strong> (armée), <strong>n’importe quelle phase des héros</strong> de ton tour. Un <strong>tour</strong> = cycle complet des phases pour une équipe ; une <strong>manche</strong> (round) = un tour ami puis un tour ennemi.</p>
    </div>`;

    const nexusBlock = hasMachine
      ? `<div class="panel-inner soulblight-encart soulblight-encart--nexus">
      <h4 class="subh">Nexus d’énergie de la mort</h4>
      <p class="muted small">À placer à côté d’<strong>Invocation cadavérique</strong> : cibles RACLEMORTS ou MARCHEMORTS à 12" touchées par Invocation — <strong>+D3</strong> aux PV soignés ou à la Santé des figurines ramenées.</p>
    </div>`
      : "";

    if (invocBlock || nexusBlock) {
      h += `<div class="soulblight-invocation-nexus-row" style="display:flex;flex-wrap:wrap;gap:0.75rem;align-items:stretch">${invocBlock}${nexusBlock}</div>`;
    }

    if (hasMachine) {
      h += `<div class="panel-inner soulblight-encart soulblight-encart--reliquaire-hint">
      <h4 class="subh">Reliquaire (Machine Mortis)</h4>
      <p class="muted small">Chaque sort réussi d’un <strong>sorcier Ruinemâne</strong> à 12" de la Machine : <strong>+1</strong> au dé d’énergie (max <strong>6</strong>) — ajuste le compteur sur la <strong>fiche Machine Mortis</strong>.</p>
      <p class="muted small">Énergie actuelle (rappel) : <strong>${machineE}</strong> / 6 — liée à <strong>Onde de pouvoir</strong> en phase de tir.</p>
    </div>`;
    }

    if (soulblightArmyHasCatalogUnit("sb_seigneur_vampire")) {
      h += `<div class="panel-inner soulblight-encart soulblight-encart--brume">
      <h4 class="subh">Brume de sang (Seigneur vampire)</h4>
      <p class="muted small">1×/tour (armée), <strong>ta phase des héros</strong> : dé 3+ — retire l’unité et replace à &gt;3" des héros ennemis et &gt;9" des autres ennemis.</p>
    </div>`;
    }

    if (soulblightArmyHasCatalogUnit("sb_prince_vhordrai")) {
      const vh = soulblightInstanceAliveByCatalogId("sb_prince_vhordrai");
      const sangChecked =
        vh?.buffs?.some((bf) =>
          String(bf.label || "").includes("Sang-vif"),
        ) ?? false;
      h += `<div class="panel-inner soulblight-encart soulblight-encart--sang-vif">
      <h4 class="subh">Sang-vif (Prince Vhordrai)</h4>
      <p class="muted small">Sort (incantation 7) : <strong>Frappe en premier</strong> jusqu’au début de ton prochain tour. Coche si la prière / sort est <strong>réussi</strong> — le buff s’affiche sur la fiche unité.</p>
      <label class="tracker-label"><input type="checkbox" class="soulblight-sang-vif-success" data-iid="${vh ? escapeHtml(vh.id) : ""}" ${sangChecked ? "checked" : ""} ${!vh ? "disabled" : ""} /> Incantation réussie — appliquer Frappe en premier sur Vhordrai</label>
    </div>`;
    }

    if (traitId === "sb_volonte_inebranlable" && traitHeroId) {
      const th = state.instances.find((i) => i.id === traitHeroId);
      const tn = th ? getUnitById(th.catalogId)?.name : "—";
      h += `<div class="panel-inner soulblight-encart soulblight-encart--trait">
        <h4 class="subh">Trait — Volonté inébranlable</h4>
        <p class="muted small">Porteur : <strong>${escapeHtml(tn)}</strong> — cible RACLEMORTS ou MARCHEMORTS (≥2 fig.) entièrement à 12" : <strong>+D6 au contrôle</strong> pour le tour. Note le D6 dans la colonne du suivi pour l’unité cible.</p>
      </div>`;
    }

    if (artId === "sb_pendule_terminus" && artHeroId) {
      const ah = state.instances.find((i) => i.id === artHeroId);
      const an = ah ? getUnitById(ah.catalogId)?.name : "—";
      h += `<div class="panel-inner soulblight-encart soulblight-encart--artefact">
        <h4 class="subh">Artefact — Pendule Terminus</h4>
        <p class="muted small">Porteur : <strong>${escapeHtml(an)}</strong> — dé 3+ : jusqu’à ton prochain tour, −1 aux jets d’incantation des SORCIERS ennemis à 18".</p>
      </div>`;
    }

    if (soulblightArmyHasCatalogUnit("sb_roi_revenant_pied")) {
      h += `<div class="panel-inner soulblight-encart soulblight-encart--roi-os">
      <h4 class="subh">Roi des os ambulants (Roi revenant)</h4>
      <p class="muted small">1×/tour (armée), <strong>ta phase des héros</strong> : RACLEMORTS à portée de mêlée — dé 3+ : armes de mêlée avec <strong>Crit (2 touches)</strong> pour le tour. Coche le résultat sur les unités RACLEMORTS dans le <strong>suivi</strong> (colonne dédiée).</p>
    </div>`;
    }
  }

  if (ph.id === "movement" && isPlayerTurn(b) && !b.soulblightLegionsSansFinUsedBattle) {
    h += `<div class="panel-inner soulblight-encart soulblight-encart--legions">
      <h4 class="subh">Légions sans fin</h4>
      <p class="muted small">1× par <strong>bataille</strong> (armée), n’importe quelle phase de mouvement. Coche quand tu l’as utilisée — l’encart ne réapparaîtra plus.</p>
      <label class="tracker-label"><input type="checkbox" class="soulblight-legions-used" /> J’ai utilisé Légions sans fin</label>
    </div>`;
  }

  if (ph.id === "movement" && isPlayerTurn(b)) {
    if (soulblightArmyHasCatalogUnit("sb_chevaliers_sang")) {
      h += `<div class="panel-inner soulblight-encart soulblight-encart--cavaliers-ruine">
      <h4 class="subh">Cavaliers de la ruine (Chevaliers de sang)</h4>
      <p class="muted small">En te déplaçant : traverse les figurines <strong>INFANTERIE</strong> ennemies et la portée de mêlée des <strong>INFANTERIE</strong> ennemies ; ne finit pas en mêlée sauf si l’aptitude le précise.</p>
    </div>`;
    }
    if (soulblightArmyHasCatalogUnit("sb_vargheists")) {
      h += `<div class="panel-inner soulblight-encart soulblight-encart--pique-mort">
      <h4 class="subh">Piqué de la mort (Vargheists)</h4>
      <p class="muted small">1×/tour (armée), <strong>ta phase de mouvement</strong> : si hors mêlée, retire l’unité et replace à &gt;9" des ennemis.</p>
    </div>`;
    }
  }

  if (ph.id === "shooting" && isPlayerTurn(b) && hasMachine) {
    h += `<div class="panel-inner soulblight-encart soulblight-encart--onde">
      <h4 class="subh">Onde de pouvoir (Machine Mortis)</h4>
      <p class="muted small">1×/tour (armée), <strong>ta phase de tir</strong> : jusqu’à 3 unités ennemies à 10" — par cible dé 3+ : BM = <strong>valeur du dé d’énergie</strong> (${machineE}) ; puis <strong>remet le dé à 1</strong> (compteur sur la fiche).</p>
      <button type="button" class="btn small btn-soulblight-onde-resolved" data-iid="${machineInst ? escapeHtml(machineInst.id) : ""}">Onde résolue — remettre le dé à 1</button>
    </div>`;
  }

  if (ph.id === "combat" && isPlayerTurn(b)) {
    if (soulblightArmyHasCatalogUnit("sb_roi_revenant_pied")) {
      h += `<div class="panel-inner soulblight-encart soulblight-encart--strategies-antiques">
      <h4 class="subh">Stratégies antiques (Roi revenant)</h4>
      <p class="muted small">Réaction après CORPS À CORPS : INFANTERIE RACLEMORTS non héros au contact, sans CORPS À CORPS ce tour — peut combattre après ; <strong>+1 pour toucher</strong> pour le tour.</p>
    </div>`;
    }
    if (soulblightArmyHasCatalogUnit("sb_necromancien")) {
      h += `<div class="panel-inner soulblight-encart soulblight-encart--vanhel">
      <h4 class="subh">Danse macabre de Vanhel (Nécromancien)</h4>
      <p class="muted small">1×/tour (armée), <strong>ta mêlée</strong> : cible RACLEMORTS ou MARCHEMORTS à 12" — dé 3+ : 2 aptitudes CORPS À CORPS cette phase ; après la 1re : <strong>Frappe en dernier</strong> jusqu’à la fin du tour.</p>
    </div>`;
    }
    if (soulblightArmyHasCatalogUnit("sb_prince_vhordrai")) {
      h += `<div class="panel-inner soulblight-encart soulblight-encart--sillage">
      <h4 class="subh">Sillage écarlate (Prince Vhordrai)</h4>
      <p class="muted small">1×/tour (armée), <strong>ta mêlée</strong> : engagement puis unité ennemie au contact — dé 4+ : BM = résultat du dé.</p>
    </div>`;
    }
  }

  if (ph.id === "charge") {
    if (soulblightArmyHasCatalogUnit("sb_chevaliers_sang")) {
      h += `<div class="panel-inner soulblight-encart soulblight-encart--reduits">
      <h4 class="subh">Réduits en poussière (Chevaliers de sang)</h4>
      <p class="muted small">N’importe quelle phase de charge : unité ennemie <strong>traversée</strong> ce tour — D3, sur 2+ BM = résultat.</p>
    </div>`;
    }
  }

  if (ph.id === "end") {
    h += `<div class="panel-inner soulblight-encart soulblight-encart--faim">
      <h4 class="subh">La faim</h4>
      <p class="muted small">1× par <strong>tour</strong> (armée), à la <strong>fin de n’importe quel tour</strong> (après la phase de fin du tour ami ou du tour ennemi). Tu peux donc l’utiliser <strong>jusqu’à 2 fois par manche</strong> (round) : une fois après la fin de ton tour, une fois après la fin du tour adverse. Rappel sans suivi dans l’app.</p>
    </div>`;

    if (soulblightArmyHasCatalogUnit("sb_prince_vhordrai")) {
      h += `<div class="panel-inner soulblight-encart soulblight-encart--saint-massacre">
      <h4 class="subh">Saint du massacre (Prince Vhordrai)</h4>
      <p class="muted small">Fin de <strong>n’importe quel tour</strong> : VAMPIRE <strong>non monstre</strong> à 12" ayant détruit une unité en CORPS À CORPS ce tour — choisis <strong>+2" M</strong>, <strong>+1 A mêlée</strong> ou <strong>+1 dégâts mêlée</strong> (cumulable, reste de bataille). Renseigne le bonus par unité dans le suivi (colonne).</p>
    </div>`;
    }

    for (const inst of state.instances) {
      if (inst.destroyed) continue;
      const u = getUnitById(inst.catalogId);
      if (u?.id !== "sb_chevaliers_tertres") continue;
      ensureInstanceTracking(inst);
      const maxW = getWoundsMaxInst(inst, u);
      const curRaw = inst.woundsCurrent;
      const cur =
        curRaw === "" || curRaw == null || maxW == null
          ? maxW
          : Number(curRaw);
      const baseRaw = inst.chevalierTertresBaselineWounds;
      const baseline =
        baseRaw === "" || baseRaw == null || maxW == null
          ? maxW
          : Number(baseRaw);
      if (maxW == null || cur == null || baseline == null) continue;
      const lost = baseline - cur;
      if (lost < 3 || cur >= maxW) continue;
      h += `<div class="panel-inner soulblight-encart soulblight-encart--chevalier-tertres">
      <h4 class="subh">Condamnés à ressusciter derechef — ${escapeHtml(u.name)}</h4>
      <p class="muted small">Au moins <strong>3 PV</strong> perdus depuis la dernière fin de tour enregistrée — ramène <strong>1 figurine</strong> (+3 PV), sans dépasser le maximum.</p>
      <button type="button" class="btn small btn-chevalier-tertres-restore" data-iid="${escapeHtml(inst.id)}">+1 figurine (+3 PV)</button>
    </div>`;
    }

    for (const inst of state.instances) {
      if (inst.destroyed) continue;
      const u = getUnitById(inst.catalogId);
      if (u?.id !== "sb_squelettes_raclemorts") continue;
      ensureInstanceTracking(inst);
      const maxW = getWoundsMaxInst(inst, u);
      const curRaw = inst.woundsCurrent;
      const cur =
        curRaw === "" || curRaw == null || maxW == null
          ? maxW
          : Number(curRaw);
      const missing = maxW != null && cur != null ? maxW - cur : 0;
      if (missing <= 0 || maxW == null) continue;
      const name = u.name || "Squelettes raclemorts";
      h += `<div class="panel-inner soulblight-encart soulblight-encart--raclemorts-fin">
      <h4 class="subh">Légion de squelettes — ${escapeHtml(name)}</h4>
      <p class="muted small">Fin de n’importe quel tour : ramène jusqu’à <strong>D3</strong> figurines — PV manquants : <strong>${missing}</strong> (max).</p>
      <p class="soulblight-raclemorts-btns">
        <button type="button" class="btn small btn-raclemorts-raise" data-iid="${escapeHtml(inst.id)}" data-n="1" ${missing < 1 ? "disabled" : ""}>+1 PV</button>
        <button type="button" class="btn small btn-raclemorts-raise" data-iid="${escapeHtml(inst.id)}" data-n="2" ${missing < 2 ? "disabled" : ""}>+2 PV</button>
        <button type="button" class="btn small btn-raclemorts-raise" data-iid="${escapeHtml(inst.id)}" data-n="3" ${missing < 3 ? "disabled" : ""}>+3 PV</button>
      </p>
    </div>`;
    }
  }

  if (!isPlayerTurn(b) && artId === "sb_echarde_nuit" && artHeroId) {
    const ah = state.instances.find((i) => i.id === artHeroId);
    const an = ah ? getUnitById(ah.catalogId)?.name : "—";
    if (ph.id === "shooting" || ph.id === "combat") {
      h += `<div class="panel-inner soulblight-encart soulblight-encart--echarde">
        <h4 class="subh">Artefact — Écharde de nuit (rappel)</h4>
        <p class="muted small">Porteur : <strong>${escapeHtml(an)}</strong> — ignore les modificateurs aux sauvegardes (tir) contre cette unité. En mêlée : rappel si des attaques de tir « en mêlée » ou effets assimilés s’appliquent.</p>
      </div>`;
    }
  }

  return h;
}

/** Rappels Seraphon (Asterisme, hôte, trait, trésor) par phase. */
function buildSeraphonBattleEncartsHtml(ph, b) {
  if (!isSeraphonFactionContext() || !b || ph.id === "deployment") return "";
  const aid = String(state.setup.seraphonAsterismId || "").trim();
  const ast = getSeraphonAsterismById(aid);
  const form = getFormationById(state.setup.formationId);
  const traitsL = getHeroicTraitsForFaction(state.setup.factionId);
  const artsL = getArtifactsForFaction(state.setup.factionId);
  const trait = traitsL.find((t) => t.id === state.setup.traitId);
  const art = artsL.find((a) => a.id === state.setup.artifactId);
  const traitH = state.setup.traitHeroInstanceId
    ? state.instances.find((i) => i.id === state.setup.traitHeroInstanceId)
    : null;
  const artH = state.setup.artifactHeroInstanceId
    ? state.instances.find((i) => i.id === state.setup.artifactHeroInstanceId)
    : null;
  const traitHn = traitH
    ? getUnitById(traitH.catalogId)?.name || "Héros"
    : "—";
  const artHn = artH ? getUnitById(artH.catalogId)?.name || "Héros" : "—";
  const ser = b.seraphon || (b.seraphon = { itzlPursue: false, coatlUsed: false });
  const mine = isPlayerTurn(b);
  const parts = [];

  if (ast && ph.id === "combat" && mine) {
    if (ast.id === "ser_asterism_itzl") {
      const on = !!ser.itzlPursue;
      let h = `<div class="panel-inner seraphon-encart seraphon-encart--itzl">`;
      h += `<h4 class="subh">Asterisme — ${escapeHtml(ast.name)}</h4>`;
      h += `<p class="muted small">${escapeHtml(ast.summary)}</p>`;
      h += `<p class="muted small"><strong>« Poursuivre le Grand Plan » (3e manche)</strong> : ${escapeHtml(ast.pursueCondition || "")}</p>`;
      h += `<label class="tracker-label"><input type="checkbox" class="seraphon-itzl-pursue" ${on ? "checked" : ""} /> Condition Poursuivre remplie (ex. 3+ unités ennemies détruites) — afficher le rappel de buff Saurus</label>`;
      if (on) {
        h += `<ul class="seraphon-saurus-itzl-list">`;
        for (const inst of state.instances) {
          if (inst.destroyed) continue;
          const u = getUnitById(inst.catalogId);
          if (!u || !unitKeyword(u, "SAURUS")) continue;
          h += `<li><span class="phase-unit-name">${escapeHtml(u.name)}${formatFigurinesHtmlSuffix(inst, u)}</span> <span class="seraphon-buff-pill">Itzl : Compagnon — Crit (2 touches)</span></li>`;
        }
        h += `</ul>`;
      }
      h += `</div>`;
      parts.push(h);
    }
    if (ast.id === "ser_asterism_quetzl") {
      parts.push(
        `<div class="panel-inner seraphon-encart seraphon-encart--quetzl"><h4 class="subh">Asterisme — ${escapeHtml(ast.name)}</h4>
        <p class="muted small">${escapeHtml(ast.summary)}</p>
        <p class="muted small"><strong>Activation :</strong> attaques de mêlée contre des <strong>SAURUS</strong> <strong>entièrement</strong> dans <strong>ton</strong> territoire (rappel : phase de mêlée, tour ami et ennemi). <strong>« Poursuivre » :</strong> ${escapeHtml(ast.pursueCondition || "")}</p></div>`,
      );
    }
  }

  if (ast && ph.id === "combat" && !mine && ast.id === "ser_asterism_quetzl") {
    parts.push(
      `<div class="panel-inner seraphon-encart seraphon-encart--quetzl"><h4 class="subh">Asterisme — ${escapeHtml(ast.name)} (tour adverse)</h4>
      <p class="muted small">Rappel sauvegarde : tes <strong>SAURUS</strong> entièrement dans ton territoire : <strong>−1 Perforant reçu</strong> (attaques de mêlée).</p></div>`,
    );
  }

  if (ast && ph.id === "movement" && mine && ast.id === "ser_asterism_sotek") {
    parts.push(
      `<div class="panel-inner seraphon-encart seraphon-encart--sotek"><h4 class="subh">Asterisme — ${escapeHtml(ast.name)}</h4>
      <p class="muted small"><strong>+2 Mouvement</strong> sur les unités <strong>SAURUS</strong> (tout le tour de mouvement / charges).</p>
      <p class="muted small"><strong>« Poursuivre » (3e manche) :</strong> ${escapeHtml(ast.pursueCondition || "")}</p></div>`,
    );
  }

  if (ast && ph.id === "hero" && mine && ast.id === "ser_asterism_tepok") {
    parts.push(
      `<div class="panel-inner seraphon-encart seraphon-encart--tepok"><h4 class="subh">Asterisme — ${escapeHtml(ast.name)}</h4>
      <p class="muted small"><strong>+1</strong> aux jets d’<strong>incantation</strong> des <strong>SAURUS</strong>.</p>
      <p class="muted small"><strong>« Poursuivre » (3e manche) :</strong> ${escapeHtml(ast.pursueCondition || "")} — (à suivre côté table : Skinks sur le terrain, hors mêlée / non détruits.)</p></div>`,
    );
  }

  if (form) {
    if (form.id === "ser_formation_eternal_starhost" && ph.id === "movement" && mine) {
      parts.push(
        `<div class="panel-inner seraphon-encart seraphon-encart--formation"><h4 class="subh">Hôte — ${escapeHtml(form.name)}</h4>
        <p class="muted small"><strong>Translocation céleste</strong> (ta phase de mouvement) : Monstre <strong>SAURUS</strong> entièrement à 12" d'un <strong>SLANN à pied</strong> — 3+ pour replier / replacer &gt;9" des ennemis.</p></div>`,
      );
    }
    if (form.id === "ser_formation_shadowstrike_starhost" && ph.id === "shooting" && mine) {
      parts.push(
        `<div class="panel-inner seraphon-encart seraphon-encart--formation"><h4 class="subh">Hôte — ${escapeHtml(form.name)}</h4>
        <p class="muted small">Rappel ciblé ici (phase de tir allié) : note <strong>Agiles et rapides</strong> côté table (règle d’Hôte, souvent en phase de mouvement en jeu). ${escapeHtml(form.summary)}</p></div>`,
      );
    }
    if (form.id === "ser_formation_sunclaw_starhost" && ph.id === "end") {
      parts.push(
        `<div class="panel-inner seraphon-encart seraphon-encart--formation"><h4 class="subh">Hôte — ${escapeHtml(form.name)} (fin de tour — les deux camps)</h4>
        <p class="muted small">Rappel <strong>Sunclaw / Vengeance d’Azyr</strong> (usage typique : phase de tir — voir fiche) : ${escapeHtml(form.summary)}</p></div>`,
      );
    }
  }

  if (trait && state.setup.traitId === "ser_beastmaster" && ph.id === "movement" && mine) {
    parts.push(
      `<div class="panel-inner seraphon-encart seraphon-encart--trait"><h4 class="subh">Trait — ${escapeHtml(trait.name)}</h4>
      <p class="muted small">Porteur : <strong>${escapeHtml(traitHn)}</strong> — ${escapeHtml(trait.summary)}</p></div>`,
    );
  }
  if (trait && state.setup.traitId === "ser_reptilian_cunning" && ph.id === "combat" && mine) {
    parts.push(
      `<div class="panel-inner seraphon-encart seraphon-encart--trait"><h4 class="subh">Trait — ${escapeHtml(trait.name)}</h4>
      <p class="muted small">Porteur : <strong>${escapeHtml(traitHn)}</strong> — ${escapeHtml(trait.summary)}</p></div>`,
    );
  }
  if (trait && state.setup.traitId === "ser_being_of_stars" && (ph.id === "shooting" || ph.id === "combat")) {
    parts.push(
      `<div class="panel-inner seraphon-encart seraphon-encart--trait"><h4 class="subh">Trait — ${escapeHtml(trait.name)}${!mine ? " (tour adverse)" : ""}</h4>
      <p class="muted small">Porteur : <strong>${escapeHtml(traitHn)}</strong> — ignore les modificateurs aux sauvegardes (tir &amp; mêlée).</p></div>`,
    );
  }

  if (art && ph.id === "hero" && mine) {
    if (art.id === "ser_incandescent_rectrices" && state.setup.artifactId === art.id) {
      parts.push(
        `<div class="panel-inner seraphon-encart seraphon-encart--art"><h4 class="subh">Trésor — ${escapeHtml(art.name)}</h4>
        <p class="muted small">Porteur : <strong>${escapeHtml(artHn)}</strong> — ${escapeHtml(art.summary)}</p></div>`,
      );
    }
    if (art.id === "ser_coatl_familiar" && state.setup.artifactId === art.id) {
      if (ser.coatlUsed) {
        parts.push(
          `<div class="panel-inner seraphon-encart seraphon-encart--art seraphon-encart--coatl-spent"><h4 class="subh">Trésor — ${escapeHtml(art.name)}</h4>
          <p class="muted small">Déjà utilisé cette bataille.</p></div>`,
        );
      } else {
        parts.push(
          `<div class="panel-inner seraphon-encart seraphon-encart--art"><h4 class="subh">Trésor — ${escapeHtml(art.name)}</h4>
          <p class="muted small">Porteur : <strong>${escapeHtml(artHn)}</strong> — 1×/bataille, réaction : +D6 à l’incantation d’un <strong>SLANN à pied</strong> au mêlée. Marque quand c’est consommé :</p>
          <label class="tracker-label"><input type="checkbox" class="seraphon-coatl-spent" /> Coatl déjà utilisé (ne plus afficher aux tours suivants)</label></div>`,
        );
      }
    }
  }
  if (art && art.id === "ser_bloodrage_pendant" && state.setup.artifactId === art.id && ph.id === "combat" && mine) {
    parts.push(
      `<div class="panel-inner seraphon-encart seraphon-encart--art"><h4 class="subh">Trésor — ${escapeHtml(art.name)}</h4>
      <p class="muted small">Porteur : <strong>${escapeHtml(artHn)}</strong> — ${escapeHtml(art.summary)}</p></div>`,
    );
  }

  if (ph.id === "hero" && mine) {
    const spellRows = SERAPHON_SPELLS.map(
      (s) =>
        `<li><strong>${escapeHtml(s.name)}</strong> (incant. ${escapeHtml(s.cast)}${s.lore ? ` — ${escapeHtml(s.lore)}` : ""}) : ${escapeHtml(s.summary)}</li>`,
    ).join("");
    if (spellRows) {
      parts.push(
        `<div class="panel-inner seraphon-encart seraphon-encart--spells"><h4 class="subh">Littératures — sorts (ta phase des héros)</h4>
        <p class="muted small">Chaque incantation se joue en <strong>ta</strong> phase des héros (sauf précision livre) :</p>
        <ul class="seraphon-spell-recap-list">${spellRows}</ul></div>`,
      );
    }
  }

  const kroakLive = state.instances.find(
    (i) =>
      !i.destroyed && getUnitById(i.catalogId)?.id === "ser_seigneur_kroak",
  );
  if (kroakLive && ph.id === "hero" && mine) {
    const ku = getUnitById("ser_seigneur_kroak");
    const aWar = (ku?.abilities || []).find((a) =>
      String(a.name).includes("Délivrance"),
    );
    const aVas = (ku?.abilities || []).find((a) =>
      String(a.name).includes("Vassal"),
    );
    const aSup = (ku?.abilities || []).find((a) =>
      String(a.name).includes("Suprême"),
    );
    parts.push(
      `<div class="panel-inner seraphon-encart seraphon-encart--kroak"><h4 class="subh">Seigneur Kroak — rappels (ta phase des héros)</h4>
      <p class="muted small"><strong>Délivrance céleste (sort de guerre)</strong> : ${aWar ? escapeHtml(aWar.summary) : "plusieurs cibles, BM."}</p>
      <p class="muted small"><strong>Vassal arcanique</strong> : ${aVas ? escapeHtml(aVas.summary) : "1×/tour, autre SLANN."}</p>
      <p class="muted small"><strong>Suprême maître de l’ordre (passif)</strong> : ${aSup ? escapeHtml(aSup.summary) : "bonus d’ordre, incantation, bannissements — voir fiche."}</p></div>`,
    );
  }
  if (kroakLive && ph.id === "end") {
    const dead = (getUnitById("ser_seigneur_kroak")?.abilities || []).find(
      (a) => String(a.name).includes("Morts depuis"),
    );
    parts.push(
      `<div class="panel-inner seraphon-encart seraphon-encart--kroak-end"><h4 class="subh">Seigneur Kroak — ${dead ? escapeHtml(dead.name) : "Morts depuis des éons innombrables"}</h4>
      <p class="muted small">À chaque <strong>fin de tour</strong> (manche) : ${dead ? escapeHtml(dead.summary) : "3D6 + dégâts subis, 20+ = détruit, sinon soigne 18 (si blessé)."}</p></div>`,
    );
  }

  const hasSaurusWar = state.instances.some(
    (i) =>
      !i.destroyed &&
      getUnitById(i.catalogId)?.id === "ser_saurus_guerriers",
  );
  if (hasSaurusWar) {
    const uSw = getUnitById("ser_saurus_guerriers");
    const ab = (uSw?.abilities || [])[0];
    const txt = ab ? escapeHtml(ab.summary) : "—";
    if (ph.id === "combat" && mine) {
      parts.push(
        `<div class="panel-inner seraphon-encart seraphon-encart--saurus"><h4 class="subh">Guerriers Saurus — Cohortes en ordre</h4>
        <p class="muted small"><strong>Phase de mêlée (ton tour)</strong> : ${txt}</p></div>`,
      );
    }
    if ((ph.id === "shooting" || ph.id === "combat") && !mine) {
      parts.push(
        `<div class="panel-inner seraphon-encart seraphon-encart--saurus"><h4 class="subh">Guerriers Saurus — Cohortes en ordre (tour adverse)</h4>
        <p class="muted small">Rappel passif (tir / mêlée ennemis) : ${txt}</p></div>`,
      );
    }
  }

  const chotec = state.instances.find(
    (i) =>
      !i.destroyed && getUnitById(i.catalogId)?.id === "ser_rejeton_chotec",
  );
  if (chotec) {
    const uc = getUnitById("ser_rejeton_chotec");
    const acid = (uc?.abilities || []).find((a) =>
      String(a.name).toLowerCase().includes("soufre"),
    );
    const aco = (uc?.abilities || []).find((a) =>
      String(a.name).toLowerCase().includes("acolyte"),
    );
    if (ph.id === "shooting" && mine) {
      parts.push(
        `<div class="panel-inner seraphon-encart seraphon-encart--chotec"><h4 class="subh">Rejeton de Chotec — ${acid ? escapeHtml(acid.name) : "Flamme au soufre acide"}</h4>
        <p class="muted small">Phase de <strong>tir (ton tour)</strong> : ${acid ? escapeHtml(acid.summary) : ""}</p></div>`,
      );
    }
    if (ph.id === "end" && mine) {
      parts.push(
        `<div class="panel-inner seraphon-encart seraphon-encart--chotec"><h4 class="subh">Rejeton de Chotec — ${aco ? escapeHtml(aco.name) : "Acolytes du soleil"}</h4>
        <p class="muted small">Fin de <strong>ton tour</strong> (allié) : ${aco ? escapeHtml(aco.summary) : ""}</p></div>`,
      );
    }
  }

  const krox = state.instances.some(
    (i) =>
      !i.destroyed &&
      getUnitById(i.catalogId)?.id === "ser_kroxigor_guerre_engloutie",
  );
  if (krox) {
    const uk = getUnitById("ser_kroxigor_guerre_engloutie");
    const sp = (uk?.abilities || []).find((a) =>
      String(a.name).toLowerCase().includes("sotek"),
    );
    const hvy = (uk?.abilities || []).find((a) =>
      String(a.name).toLowerCase().includes("peau"),
    );
    if (ph.id === "combat") {
      parts.push(
        `<div class="panel-inner seraphon-encart seraphon-encart--krox"><h4 class="subh">Kroxigor — ${sp ? escapeHtml(sp.name) : "Rejeton de Sotek"}</h4>
        <p class="muted small"><strong>Phase de mêlée</strong>${mine ? " (ton tour)" : " (tour adverse)"} : ${sp ? escapeHtml(sp.summary) : ""}</p></div>`,
      );
    }
    if (ph.id === "shooting" && !mine) {
      parts.push(
        `<div class="panel-inner seraphon-encart seraphon-encart--krox"><h4 class="subh">Kroxigor — ${hvy ? escapeHtml(hvy.name) : "Peau d’écailles lourde"}</h4>
        <p class="muted small"><strong>Phase de tir de l’adversaire</strong> (tirs envers toi) : ${hvy ? escapeHtml(hvy.summary) : ""}</p></div>`,
      );
    }
  }

  const ob = state.instances.find(
    (i) =>
      !i.destroyed &&
      getUnitById(i.catalogId)?.id === "ser_oldblood_carnosaure",
  );
  if (ob) {
    const uo = getUnitById("ser_oldblood_carnosaure");
    const sph = (uo?.abilities || []).find((a) =>
      String(a.name).toLowerCase().includes("fer de lance"),
    );
    const ter = (uo?.abilities || []).find((a) =>
      String(a.name).toLowerCase().includes("terreur"),
    );
    const bl = (uo?.abilities || []).find((a) =>
      String(a.name).toLowerCase().includes("frénésie") ||
      String(a.name).toLowerCase().includes("blood"),
    );
    if (ph.id === "charge" && mine) {
      parts.push(
        `<div class="panel-inner seraphon-encart seraphon-encart--oldblood"><h4 class="subh">Vétéran Saurus (Carnosaure) — ${sph ? escapeHtml(sph.name) : "Fer de lance de la charge"}</h4>
        <p class="muted small">Phase de <strong>charge (ton tour)</strong> : ${sph ? escapeHtml(sph.summary) : ""}</p></div>`,
      );
    }
    if (ph.id === "end" && !mine) {
      parts.push(
        `<div class="panel-inner seraphon-encart seraphon-encart--oldblood"><h4 class="subh">Vétéran Saurus (Carnosaure) — ${ter ? escapeHtml(ter.name) : "Terreur"}</h4>
        <p class="muted small">Fin de <strong>tour de l’adversaire</strong> : ${ter ? escapeHtml(ter.summary) : ""}</p></div>`,
      );
    }
    if (ph.id === "combat" && mine) {
      parts.push(
        `<div class="panel-inner seraphon-encart seraphon-encart--oldblood"><h4 class="subh">Vétéran Saurus (Carnosaure) — ${bl ? escapeHtml(bl.name) : "Frénésie sanguine"}</h4>
        <p class="muted small">Phase de <strong>mêlée (ton tour)</strong> : ${bl ? escapeHtml(bl.summary) : ""}</p></div>`,
      );
    }
  }

  return parts.join("");
}

/**
 * Sylvaneth — rappels de saison, clairière, sorts persistants, reliques (1× bataille), unités.
 */
function buildSylvanethBattleEncartsHtml(ph, b) {
  if (!isSylvanethFactionContext() || !b) return "";
  const mine = isPlayerTurn(b);
  const sy = b.sylvaneth || (b.sylvaneth = {});
  const season = getSylvanethSeasonById(state.setup.sylvanethSeasonId);
  const glade = getSylvanethGladeById(state.setup.sylvanethGladeId);
  const tr = getHeroicTraitsForFaction("sylvaneth").find(
    (t) => t.id === state.setup.traitId,
  );
  const ar = getArtifactsForFaction("sylvaneth").find(
    (a) => a.id === state.setup.artifactId,
  );
  const th = state.setup.traitHeroInstanceId
    ? state.instances.find((i) => i.id === state.setup.traitHeroInstanceId)
    : null;
  const ah = state.setup.artifactHeroInstanceId
    ? state.instances.find((i) => i.id === state.setup.artifactHeroInstanceId)
    : null;
  const parts = [];

  if (ph.id === "deployment" && glade?.id === "syl_glad_bellemoisson") {
    parts.push(
      `<div class="panel-inner sylvaneth-encart sylvaneth-encart--glade"><h4 class="subh">Clairière — ${escapeHtml(glade.name)} (déploiement)</h4>
        <p class="muted small">${escapeHtml(glade.summary)}</p></div>`,
    );
  }

  if (season && showPowerFullForPhase(season, ph, b)) {
    parts.push(
      `<div class="panel-inner sylvaneth-encart sylvaneth-encart--season"><h4 class="subh">Saison — ${escapeHtml(season.name)}</h4>
        <p class="muted small">${escapeHtml(season.summary)}</p></div>`,
    );
  }

  if (glade && showPowerFullForPhase(glade, ph, b)) {
    parts.push(
      `<div class="panel-inner sylvaneth-encart sylvaneth-encart--glad"><h4 class="subh">Clairière — ${escapeHtml(glade.name)}</h4>
        <p class="muted small">${escapeHtml(glade.summary)}</p></div>`,
    );
  }

  for (const form of SYLVANETH_FORMATIONS) {
    if (!showPowerFullForPhase(form, ph, b)) continue;
    parts.push(
      `<div class="panel-inner sylvaneth-encart sylvaneth-encart--bt"><h4 class="subh">Trait de bataille — ${escapeHtml(form.name)}</h4>
        <p class="muted small"><strong>${escapeHtml(form.ability || "")}</strong> — ${escapeHtml(form.summary)}</p>
        ${form.id === "syl_form_clairiere" ? `<p class="muted small">La clairière choisie en préparation (ci-dessus) s’applique à ton armée.</p>` : ""}</div>`,
    );
  }

  if (tr && th && !th.destroyed && showPowerFullForPhase(tr, ph, b)) {
    const uo = getUnitById(th.catalogId);
    if (
      !tr.allowedHeroCatalogIds?.length ||
      (uo && tr.allowedHeroCatalogIds.includes(uo.id))
    ) {
      parts.push(
        `<div class="panel-inner sylvaneth-encart sylvaneth-encart--tct"><h4 class="subh">Trait de commandement — ${escapeHtml(tr.name)}</h4>
          <p class="muted small"><strong>Porteur :</strong> ${escapeHtml(uo?.name || "")} — ${escapeHtml(tr.summary)}</p></div>`,
      );
    }
  }

  if (ar && ah && !ah.destroyed && showPowerFullForPhase(ar, ph, b)) {
    const ua = getUnitById(ah.catalogId);
    if (
      !ar.allowedHeroCatalogIds?.length ||
      (ua && ar.allowedHeroCatalogIds.includes(ua.id))
    ) {
      const faineBlock =
        ar.id === "syl_rel_faine_ages" && mine && ph.id === "hero" ?
          (sy.faineAgesUsed ?
            `<p class="muted small">Fiaine des âges — <strong>utilisée</strong> (1×/bataille).</p>` :
            `<p class="sylvaneth-faine-wrap"><label class="tracker-label"><input type="checkbox" class="sylvaneth-faine-used" />
            <strong>1×/bataille :</strong> coche quand l’aptitude a été déclenchée (puis coche l’app pour t’en souvenir).</label></p>`)
        : ar.id === "syl_rel_faine_ages" && sy.faineAgesUsed && mine
          ? `<p class="muted small">Fiaine des âges — déjà employée.</p>`
          : "";
      parts.push(
        `<div class="panel-inner sylvaneth-encart sylvaneth-encart--rel"><h4 class="subh">Relique — ${escapeHtml(ar.name)}</h4>
          <p class="muted small"><strong>Porteur :</strong> ${escapeHtml(ua?.name || "")} — ${escapeHtml(ar.summary)}</p>
          ${faineBlock}</div>`,
      );
    }
  }

  for (const sp of SYLVANETH_SPELLS) {
    if (!sp.phases?.includes(ph.id)) continue;
    if (sp.playerTurnOnly && !mine) continue;
    if (sp.id === "syl_spell_trone_vigne" || sp.id === "syl_spell_chant_arbres") {
      if (ph.id === "hero" && mine) {
        const isTr = sp.id === "syl_spell_trone_vigne";
        const active = isTr ? sy.troneVigneActive : sy.chantArbresActive;
        const cls = isTr ? "sylvaneth-trone-active" : "sylvaneth-chant-active";
        parts.push(
          `<div class="panel-inner sylvaneth-encart sylvaneth-encart--spell"><h4 class="subh">Sort — ${escapeHtml(sp.name)}</h4>
            <p class="muted small">${escapeHtml(sp.summary)} (incant. ${escapeHtml(sp.cast || "—")})</p>
            <label class="tracker-label"><input type="checkbox" class="${cls}" ${active ? "checked" : ""} /> Incantation réussie : effet actif (${isTr ? "jusqu’à ta prochaine phase héros" : "mêlée jusqu’à ta prochaine phase héros"})</label></div>`,
        );
      }
    } else if (ph.id === "hero" && mine) {
      parts.push(
        `<div class="panel-inner sylvaneth-encart sylvaneth-encart--spell"><h4 class="subh">Sort — ${escapeHtml(sp.name)}</h4>
          <p class="muted small">${escapeHtml(sp.summary)} (incant. ${escapeHtml(sp.cast || "—")})</p></div>`,
      );
    }
  }
  if (mine && sy.troneVigneActive && ph.id !== "hero" && ph.id !== "deployment") {
    parts.push(
      `<div class="panel-inner sylvaneth-encart sylvaneth-encart--spell-on"><h4 class="subh">Sort actif — Trône de vigne</h4>
        <p class="muted small">Effet en cours jusqu’à ta prochaine phase des héros (coche retirée automatiquement au début de celle-ci).</p></div>`,
    );
  }
  if (mine && sy.chantArbresActive && ph.id === "combat") {
    parts.push(
      `<div class="panel-inner sylvaneth-encart sylvaneth-encart--spell-on"><h4 class="subh">Sort actif — Chant des arbres (mêlée)</h4>
        <p class="muted small">Applique le bonus de mêlée ; se termine au début de ta prochaine phase des héros.</p></div>`,
    );
  }

  if (ph.id === "combat" && mine) {
    const d = state.instances.find(
      (i) => !i.destroyed && getUnitById(i.catalogId)?.id === "syl_spirit_durthu",
    );
    if (d) {
      parts.push(
        `<div class="panel-inner sylvaneth-encart sylvaneth-encart--durthu"><h4 class="subh">Esprit de Durthu — mêlée (ton tour)</h4>
          <p class="muted small"><strong>Gardien colérique :</strong> +1 toucher cible à 3&quot; d’un bois. <strong>Duel titanesque :</strong> 1×/tour armée, 1 monstre au contact, 3+ = −1 A mêlée adverses jusqu’à la fin du tour.</p></div>`,
      );
    }
  }
  if (ph.id === "combat" && !mine) {
    const d = state.instances.find(
      (i) => !i.destroyed && getUnitById(i.catalogId)?.id === "syl_spirit_durthu",
    );
    if (d) {
      parts.push(
        `<div class="panel-inner sylvaneth-encart sylvaneth-encart--durthu"><h4 class="subh">Esprit de Durthu (adversaire)</h4>
          <p class="muted small">Pense à la résolution du Duel titanesque / Gardien (warscroll) si le joueur l’applique.</p></div>`,
      );
    }
  }

  if ((ph.id === "hero" && mine) || (ph.id === "combat" && mine)) {
    const k = state.instances.find(
      (i) =>
        !i.destroyed && getUnitById(i.catalogId)?.id === "syl_kurnoth_hunters_greatbow",
    );
    if (k) {
      parts.push(
        `<div class="panel-inner sylvaneth-encart sylvaneth-encart--kurnoth"><h4 class="subh">Chasseurs de Kurnoth</h4>
          <p class="muted small"><strong>Envoyés de la reine :</strong> rappel objectif 6p / mêlée. <strong>Piétinement :</strong> fin de mêlée (tour ami et ennemi) — 1D par fig. par unité 1p, 4+ BM.</p></div>`,
      );
    }
  }

  if (ph.id === "combat" || (ph.id === "hero" && mine)) {
    const bw = state.instances.find(
      (i) => !i.destroyed && getUnitById(i.catalogId)?.id === "syl_branchwych",
    );
    if (bw) {
      if (ph.id === "combat" && mine) {
        parts.push(
          `<div class="panel-inner sylvaneth-encart sylvaneth-encart--bwy"><h4 class="subh">Branchanteresse — mêlée (ton tour)</h4>
            <p class="muted small"><strong>Furie des forêts :</strong> +1 / +1 mêlée si entièrement à 9p d’un bois (coche suivi <strong>9p bois</strong>).</p></div>`,
        );
      }
      if (ph.id === "hero" && mine) {
        parts.push(
          `<div class="panel-inner sylvaneth-encart sylvaneth-encart--bwy-ff"><h4 class="subh">Branchanteresse — lâcher de fiel-follets</h4>
            <p class="muted small">Sort de guerre en phase héros (voir warscroll) ; incant. 5, 9p.</p></div>`,
        );
      }
    }
  }

  return parts.length ? parts.join("") : "";
}

function unitIsPriestProfile(u) {
  if (!u) return false;
  if (u.isPriest === true) return true;
  return u.keywords?.some((k) => String(k).startsWith("PRÊTRE"));
}

function trempesActiveForCurrentGame(b) {
  return isKhorneFactionContext() && isTrempesDeSangActive(b);
}

/** Partie en cours dans une sauvegarde (sinon on considère l’écran préparation). */
function isPersistedBattleActive(b) {
  return (
    b != null &&
    typeof b === "object" &&
    typeof b.phaseIndex === "number" &&
    b.phaseIndex >= 0
  );
}

function defaultGameState() {
  return {
    schemaVersion: 5,
    setup: {
      armyName: "",
      factionId: "",
      totalGameUnits: 24,
      formationId: FORMATIONS[0]?.id || "",
      traitId: HEROIC_TRAITS[0]?.id || "",
      artifactId: ARTIFACTS[0]?.id || "",
      traitHeroInstanceId: "",
      artifactHeroInstanceId: "",
      /** "player" | "opponent" — qui joue le premier tour après le déploiement. */
      whoStartsFirst: "player",
      /** 1 … 10 — plusieurs joueurs peuvent partager le même numéro. */
      teamId: 1,
      playerName: "",
      roomCode: "",
      /** "solo" | "host" | "guest" — futur diffuseur. */
      roomRole: "solo",
      /** Hôte PartyKit déployé (sans https://) */
      partyHost: DEFAULT_PARTYKIT_HOST,
      /** Identifiant stable par appareil / onglet pour fusionner les snapshots adverses. */
      syncClientId: "",
      /** Seraphon — Asterisme du Grand Plan (`ser_asterism_*`). */
      seraphonAsterismId: "",
      sylvanethSeasonId: "",
      sylvanethGladeId: "",
    },
    instances: [],
    battle: null,
  };
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultGameState();
    const data = JSON.parse(raw);
    const s = defaultGameState();
    if (data.setup) Object.assign(s.setup, data.setup);
    if (s.setup.factionId === "future") s.setup.factionId = "";
    if (s.setup.factionId == null) s.setup.factionId = "";
    s.setup.factionId = String(s.setup.factionId).trim();
    const fEntry0 = FACTIONS.find((f) => f.id === s.setup.factionId);
    if (s.setup.factionId && (!fEntry0 || !fEntry0.implemented)) {
      s.setup.factionId = "";
    }
    if (s.setup.totalGameUnits == null || s.setup.totalGameUnits < 1)
      s.setup.totalGameUnits = Math.max(1, (s.instances?.length ?? 0) * 2 || 24);
    const wsf = s.setup.whoStartsFirst;
    s.setup.whoStartsFirst =
      wsf === "opponent" ? "opponent" : "player";
    s.setup.teamId = normalizeTeamId(s.setup.teamId);
    if (s.setup.playerName == null) s.setup.playerName = "";
    else s.setup.playerName = String(s.setup.playerName);
    if (s.setup.roomCode == null) s.setup.roomCode = "";
    else s.setup.roomCode = String(s.setup.roomCode);
    const rr = s.setup.roomRole;
    s.setup.roomRole =
      rr === "host" || rr === "guest" ? rr : "solo";
    if (s.setup.partyHost == null) s.setup.partyHost = "";
    else s.setup.partyHost = String(s.setup.partyHost);
    if (!s.setup.partyHost.trim()) s.setup.partyHost = DEFAULT_PARTYKIT_HOST;
    if (s.setup.syncClientId == null) s.setup.syncClientId = "";
    else s.setup.syncClientId = String(s.setup.syncClientId);
    if (!s.setup.syncClientId.trim()) s.setup.syncClientId = uid();
    if (s.setup.seraphonAsterismId == null) s.setup.seraphonAsterismId = "";
    if (isSeraphonFactionId(s.setup.factionId)) {
      if (
        !SERAPHON_ASTERISMS.some((a) => a.id === s.setup.seraphonAsterismId)
      ) {
        s.setup.seraphonAsterismId = SERAPHON_ASTERISMS[0]?.id ?? "";
      }
      const sForms = getFormationsForFaction("seraphon");
      if (s.setup.formationId && !sForms.some((f) => f.id === s.setup.formationId)) {
        s.setup.formationId = sForms[0]?.id ?? "";
      }
      const sTraits = getHeroicTraitsForFaction("seraphon");
      if (s.setup.traitId && !sTraits.some((t) => t.id === s.setup.traitId)) {
        s.setup.traitId = sTraits[0]?.id ?? "";
      }
      const sArts = getArtifactsForFaction("seraphon");
      if (s.setup.artifactId && !sArts.some((a) => a.id === s.setup.artifactId)) {
        s.setup.artifactId = sArts[0]?.id ?? "";
      }
    }
    if (s.setup.sylvanethSeasonId == null) s.setup.sylvanethSeasonId = "";
    else s.setup.sylvanethSeasonId = String(s.setup.sylvanethSeasonId);
    if (s.setup.sylvanethGladeId == null) s.setup.sylvanethGladeId = "";
    else s.setup.sylvanethGladeId = String(s.setup.sylvanethGladeId);
    if (isSylvanethFactionId(s.setup.factionId)) {
      const syForms = getFormationsForFaction("sylvaneth");
      if (s.setup.formationId && !syForms.some((f) => f.id === s.setup.formationId)) {
        s.setup.formationId = syForms[0]?.id ?? "";
      }
      const syTraits = getHeroicTraitsForFaction("sylvaneth");
      if (s.setup.traitId && !syTraits.some((t) => t.id === s.setup.traitId)) {
        s.setup.traitId = syTraits[0]?.id ?? "";
      }
      const syArts = getArtifactsForFaction("sylvaneth");
      if (s.setup.artifactId && !syArts.some((a) => a.id === s.setup.artifactId)) {
        s.setup.artifactId = syArts[0]?.id ?? "";
      }
      if (!SYLVANETH_SEASONS.some((x) => x.id === s.setup.sylvanethSeasonId)) {
        s.setup.sylvanethSeasonId = SYLVANETH_SEASONS[0]?.id ?? "";
      }
      if (!SYLVANETH_GLADES.some((x) => x.id === s.setup.sylvanethGladeId)) {
        s.setup.sylvanethGladeId = SYLVANETH_GLADES[0]?.id ?? "";
      }
    }
    if (Array.isArray(data.instances)) {
      s.instances = data.instances;
      for (const inst of s.instances) {
        if (!inst.buffs) inst.buffs = [];
        const u = getUnitById(inst.catalogId);
        if (
          unitIsPriestProfile(u) &&
          (inst.ritualPoints === undefined || inst.ritualPoints === null)
        )
          inst.ritualPoints = 0;
        if (
          u &&
          typeof u.woundsPerModel === "number" &&
          inst.modelCount == null
        ) {
          inst.modelCount = u.defaultModelCount ?? 1;
        }
        ensureInstanceTracking(inst);
      }
    }
    if (data.battle) {
      s.battle = data.battle;
      if (s.battle && !s.battle.titheUnlocked) {
        s.battle.titheUnlocked = defaultTitheUnlocked();
      }
      if (s.battle) {
        if (s.battle.turn != null && s.battle.playerTurnNumber == null) {
          s.battle.playerTurnNumber = s.battle.turn;
          if (s.battle.battleRound == null) s.battle.battleRound = s.battle.turn;
          delete s.battle.turn;
        }
        if (s.battle.playerTurnNumber == null) s.battle.playerTurnNumber = 1;
        if (s.battle.battleRound == null) s.battle.battleRound = 1;
        if (s.battle.activeSide == null) s.battle.activeSide = "player";
        if (s.battle.startingArmySize == null) {
          const armyOnly = (s.instances || []).filter((i) => !i.isInvocation);
          s.battle.startingArmySize = armyOnly.length;
        }
        if (s.battle.deadUnitsCount == null) s.battle.deadUnitsCount = 0;
        if (typeof s.battle.consangRageActive !== "boolean")
          s.battle.consangRageActive = false;
        if (typeof s.battle.consangRageUsed !== "boolean")
          s.battle.consangRageUsed = false;
        if (typeof s.battle.ironjawzWaaaghUsedThisBattle !== "boolean")
          s.battle.ironjawzWaaaghUsedThisBattle = false;
        if (s.battle.ironjawzWaaaghTriggerInstanceId == null)
          s.battle.ironjawzWaaaghTriggerInstanceId = "";
        if (typeof s.battle.ironjawzWaaaghAuraActiveThisPlayerTurn !== "boolean")
          s.battle.ironjawzWaaaghAuraActiveThisPlayerTurn = false;
        if (typeof s.battle.soulblightLegionsSansFinUsedBattle !== "boolean")
          s.battle.soulblightLegionsSansFinUsedBattle = false;
        if (s.battle.totalGameUnits == null || s.battle.totalGameUnits < 1) {
          const nArmy = (s.instances || []).filter((i) => !i.isInvocation)
            .length;
          s.battle.totalGameUnits =
            s.setup?.totalGameUnits != null && s.setup.totalGameUnits >= 1
              ? s.setup.totalGameUnits
              : Math.max(1, nArmy * 2);
        }
        if (!Array.isArray(s.battle.phaseHistory)) s.battle.phaseHistory = [];
        if (!Array.isArray(s.battle.opponentUnits)) s.battle.opponentUnits = [];
        if (!s.battle.remoteFactionEffectsByClient)
          s.battle.remoteFactionEffectsByClient = {};
        if (!s.battle.remoteUnitEffectsByClient)
          s.battle.remoteUnitEffectsByClient = {};
        if (!Array.isArray(s.battle.myOutgoingUnitEffects))
          s.battle.myOutgoingUnitEffects = [];
        if (!s.battle.seraphon) {
          s.battle.seraphon = { itzlPursue: false, coatlUsed: false };
        } else {
          if (typeof s.battle.seraphon.itzlPursue !== "boolean")
            s.battle.seraphon.itzlPursue = false;
          if (typeof s.battle.seraphon.coatlUsed !== "boolean")
            s.battle.seraphon.coatlUsed = false;
        }
        if (!s.battle.sylvaneth) {
          s.battle.sylvaneth = {
            faineAgesUsed: false,
            troneVigneActive: false,
            chantArbresActive: false,
          };
        } else {
          if (typeof s.battle.sylvaneth.faineAgesUsed !== "boolean")
            s.battle.sylvaneth.faineAgesUsed = false;
          if (typeof s.battle.sylvaneth.troneVigneActive !== "boolean")
            s.battle.sylvaneth.troneVigneActive = false;
          if (typeof s.battle.sylvaneth.chantArbresActive !== "boolean")
            s.battle.sylvaneth.chantArbresActive = false;
        }
      }
    }
    const battleActive = isPersistedBattleActive(s.battle);
    if (battleActive) {
      for (const inst of s.instances || []) {
        inst.chargedThisTurn = false;
      }
    }
    if (!battleActive) {
      s.instances = (s.instances || []).filter((i) => !i.isInvocation);
      /* Préparation : ne jamais restaurer la faction (évite Khorne coché au rechargement).
       * Si battle était un objet vide / corrompu, le retirer pour que le test soit fiable. */
      s.setup.factionId = "";
      if (s.battle != null && !battleActive) s.battle = null;
    }
    return s;
  } catch {
    return defaultGameState();
  }
}

function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function loadArmyPresets() {
  try {
    const raw = localStorage.getItem(ARMY_PRESETS_KEY);
    if (!raw) return [];
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function saveArmyPresetsList(list) {
  localStorage.setItem(ARMY_PRESETS_KEY, JSON.stringify(list));
}

function buildPresetFromCurrentState(label) {
  const instances = state.instances
    .filter((i) => !i.isInvocation)
    .map((i) => {
      const row = { id: i.id, catalogId: i.catalogId };
      if (i.modelCount != null) row.modelCount = i.modelCount;
      return row;
    });
  return {
    schemaVersion: 1,
    id: uid(),
    label: label || "",
    savedAt: new Date().toISOString(),
    factionId: state.setup.factionId || "",
    armyName: state.setup.armyName || "",
    totalGameUnits: state.setup.totalGameUnits ?? 24,
    formationId: state.setup.formationId,
    traitId: state.setup.traitId,
    artifactId: state.setup.artifactId,
    traitHeroInstanceId: state.setup.traitHeroInstanceId || "",
    artifactHeroInstanceId: state.setup.artifactHeroInstanceId || "",
    whoStartsFirst: state.setup.whoStartsFirst === "opponent" ? "opponent" : "player",
    teamId: normalizeTeamId(state.setup.teamId),
    roomCode: state.setup.roomCode || "",
    roomRole:
      state.setup.roomRole === "host" || state.setup.roomRole === "guest"
        ? state.setup.roomRole
        : "solo",
    playerName: state.setup.playerName || "",
    partyHost: state.setup.partyHost || "",
    seraphonAsterismId: state.setup.seraphonAsterismId || "",
    sylvanethSeasonId: state.setup.sylvanethSeasonId || "",
    sylvanethGladeId: state.setup.sylvanethGladeId || "",
    instances,
  };
}

function applyArmyPreset(preset) {
  if (!preset || typeof preset !== "object") return;
  const idMap = new Map();
  const nextInstances = [];
  for (const raw of preset.instances || []) {
    const u = getUnitById(raw.catalogId);
    if (!u) continue;
    const nid = uid();
    if (raw.id) idMap.set(raw.id, nid);
    const inst = {
      id: nid,
      catalogId: raw.catalogId,
      buffs: [],
    };
    if (unitIsPriestProfile(u)) inst.ritualPoints = 0;
    if (
      typeof u.woundsPerModel === "number" &&
      raw.modelCount != null &&
      typeof raw.modelCount === "number"
    ) {
      inst.modelCount = raw.modelCount;
    } else if (
      typeof u.woundsPerModel === "number" &&
      u.defaultModelCount != null
    ) {
      inst.modelCount = u.defaultModelCount;
    }
    ensureInstanceTracking(inst);
    nextInstances.push(inst);
  }

  state.setup.factionId = preset.factionId || "";
  let fEntry = FACTIONS.find((f) => f.id === state.setup.factionId);
  if (!fEntry || !fEntry.implemented) {
    if (nextInstances.length === 0) {
      state.setup.factionId = "";
    } else {
      const u0 = getUnitById(nextInstances[0].catalogId);
      const looksIronjawz = u0?.keywords?.includes("MÂCHEFERS");
      const looksSoulblight = (u0?.keywords || []).some((k) =>
        String(k).includes("SEIGNEURS RUINEMÂNES"),
      );
      const looksSeraphon = (u0?.keywords || []).some(
        (k) => String(k).toUpperCase() === "SERAPHON",
      );
      const looksSylvaneth = (u0?.keywords || []).some(
        (k) => String(k).toUpperCase() === "SYLVANETH",
      );
      state.setup.factionId = looksIronjawz
        ? "peaux_vertes"
        : looksSoulblight
          ? "vampires"
          : looksSylvaneth
            ? "sylvaneth"
            : looksSeraphon
              ? "seraphon"
              : "khorne";
    }
    fEntry = FACTIONS.find((f) => f.id === state.setup.factionId);
  }

  state.setup.armyName =
    preset.armyName != null ? String(preset.armyName) : "";
  const tg = Number(preset.totalGameUnits);
  state.setup.totalGameUnits =
    Number.isFinite(tg) && tg >= 1 ? tg : 24;
  state.setup.whoStartsFirst =
    preset.whoStartsFirst === "opponent" ? "opponent" : "player";
  state.setup.teamId = normalizeTeamId(preset.teamId);
  state.setup.roomCode =
    preset.roomCode != null ? String(preset.roomCode) : "";
  state.setup.roomRole =
    preset.roomRole === "host" || preset.roomRole === "guest"
      ? preset.roomRole
      : "solo";
  state.setup.playerName =
    preset.playerName != null ? String(preset.playerName) : "";
  state.setup.partyHost =
    preset.partyHost != null ? String(preset.partyHost) : "";
  if (!state.setup.partyHost.trim())
    state.setup.partyHost = DEFAULT_PARTYKIT_HOST;

  const pfid = state.setup.factionId;
  const formList = getFormationsForFaction(pfid);
  const traitList = getHeroicTraitsForFaction(pfid);
  const artList = getArtifactsForFaction(pfid);
  state.setup.formationId =
    preset.formationId &&
    formList.some((f) => f.id === preset.formationId)
      ? preset.formationId
      : formList[0]?.id || "";
  state.setup.traitId =
    preset.traitId && traitList.some((t) => t.id === preset.traitId)
      ? preset.traitId
      : traitList[0]?.id || "";
  state.setup.artifactId =
    preset.artifactId && artList.some((a) => a.id === preset.artifactId)
      ? preset.artifactId
      : artList[0]?.id || "";
  if (isSeraphonFactionId(pfid)) {
    state.setup.seraphonAsterismId =
      preset.seraphonAsterismId &&
      SERAPHON_ASTERISMS.some((a) => a.id === preset.seraphonAsterismId)
        ? preset.seraphonAsterismId
        : SERAPHON_ASTERISMS[0]?.id || "";
  } else {
    state.setup.seraphonAsterismId = "";
  }

  if (isSylvanethFactionId(pfid)) {
    state.setup.sylvanethSeasonId =
      preset.sylvanethSeasonId &&
      SYLVANETH_SEASONS.some((s) => s.id === preset.sylvanethSeasonId)
        ? preset.sylvanethSeasonId
        : SYLVANETH_SEASONS[0]?.id || "";
    state.setup.sylvanethGladeId =
      preset.sylvanethGladeId &&
      SYLVANETH_GLADES.some((g) => g.id === preset.sylvanethGladeId)
        ? preset.sylvanethGladeId
        : SYLVANETH_GLADES[0]?.id || "";
  } else {
    state.setup.sylvanethSeasonId = "";
    state.setup.sylvanethGladeId = "";
  }

  state.instances = nextInstances;
  state.setup.traitHeroInstanceId =
    (preset.traitHeroInstanceId &&
      idMap.get(preset.traitHeroInstanceId)) ||
    "";
  state.setup.artifactHeroInstanceId =
    (preset.artifactHeroInstanceId &&
      idMap.get(preset.artifactHeroInstanceId)) ||
    "";

  persist();
}

/** `bonusSummary` catalogue : `**a**` → gras (hors listes dangereuses). */
function formatSetupRecapRich(text) {
  if (text == null || String(text) === "") return "";
  const parts = String(text).split(/\*\*/);
  let out = "";
  for (let i = 0; i < parts.length; i += 1) {
    out +=
      i % 2 ? `<strong>${escapeHtml(parts[i])}</strong>` : escapeHtml(parts[i]);
  }
  return out;
}

function buildSetupArmyRecapHtml() {
  const fid = state.setup.factionId;
  const formations = getFormationsForFaction(fid);
  const traits = getHeroicTraitsForFaction(fid);
  const artifacts = getArtifactsForFaction(fid);
  const traitTitle =
    isKhorneFactionId(fid) ?
      "Traits héroïques (Massacreur de peuples)"
    : isSeraphonFactionId(fid) ?
        "Traits héroïques (disciplines célestes, Héros)"
      : isSylvanethFactionId(fid) ?
        "Traits de commandement (Sylvaneth)"
        : "Traits héroïques";
  const artTitle =
    isKhorneFactionId(fid) ? "Artefacts (Meurtriers)" : isSeraphonFactionId(
        fid,
      ) ?
        "Trésors des Anciens (Héros)"
      : isSylvanethFactionId(fid) ?
        "Reliques d’arôme (Sylvaneth)"
        : "Artefacts de pouvoir";
  let h = '<div class="setup-recap-columns">';
  if (isSeraphonFactionId(fid)) {
    h += '<div class="setup-recap-col setup-recap-col--seraphon-grand-plan"><h3 class="setup-recap-sub">Grand Plan — Asterisme</h3><ul class="setup-recap-list">';
    const chosen = getSeraphonAsterismById(state.setup.seraphonAsterismId);
    h += `<li><strong>${chosen ? escapeHtml(chosen.name) : "—"}</strong><p class="muted small setup-recap-line">${chosen ? escapeHtml(chosen.summary) : ""}</p>`;
    h += `<p class="muted small setup-recap-line"><em>Poursuivre (3e manche) :</em> ${chosen ? escapeHtml(chosen.pursueCondition || "") : ""}</p></li>`;
    h += `</ul><p class="muted small setup-recap-line">${escapeHtml(SERAPHON_POURSUIVRE_INTRO)} Voir la liste des conditions pour chaque Asterisme dans les choix ci-dessus.</p></div>`;
  }
  if (isSylvanethFactionId(fid)) {
    const ss = getSylvanethSeasonById(state.setup.sylvanethSeasonId);
    const gg = getSylvanethGladeById(state.setup.sylvanethGladeId);
    const trSel = traits.find((t) => t.id === state.setup.traitId);
    const arSel = artifacts.find((a) => a.id === state.setup.artifactId);
    h += '<div class="setup-recap-col setup-recap-col--sylvaneth setup-recap-col--sylvaneth-main"><h3 class="setup-recap-sub">Sylvaneth — bonus de tes choix</h3><ul class="setup-recap-list setup-recap-sylvaneth-choices">';
    h += `<li class="setup-recap-choice setup-recap-choice--season"><span class="setup-recap-choice-label">Saison (choisie)</span> — <strong>${ss ? escapeHtml(ss.name) : "—"}</strong>
      <p class="setup-recap-bonus">${ss?.bonusSummary ? formatSetupRecapRich(ss.bonusSummary) : "—"}</p></li>`;
    h += `<li class="setup-recap-choice setup-recap-choice--glad"><span class="setup-recap-choice-label">Clairière (choisie)</span> — <strong>${gg ? escapeHtml(gg.name) : "—"}</strong>
      <p class="setup-recap-bonus">${gg?.bonusSummary ? formatSetupRecapRich(gg.bonusSummary) : "—"}</p></li>`;
    h += `<li class="setup-recap-choice setup-recap-choice--tct"><span class="setup-recap-choice-label">Trait de commandement (sélection)</span> — <strong>${trSel ? escapeHtml(trSel.name) : "—"}</strong>
      <p class="setup-recap-bonus">${trSel?.bonusSummary ? formatSetupRecapRich(trSel.bonusSummary) : ""}</p></li>`;
    h += `<li class="setup-recap-choice setup-recap-choice--rel"><span class="setup-recap-choice-label">Relique d’arôme (sélection)</span> — <strong>${arSel ? escapeHtml(arSel.name) : "—"}</strong>
      <p class="setup-recap-bonus">${arSel?.bonusSummary ? formatSetupRecapRich(arSel.bonusSummary) : ""}</p></li>`;
    h += `</ul><h4 class="setup-recap-sub setup-recap-sub--sylvaneth-bt">Traits de bataille (tous s’appliquent)</h4><ul class="setup-recap-list setup-recap-sylvaneth-battle-traits">`;
    for (const sbf of SYLVANETH_FORMATIONS) {
      h += `<li class="setup-recap-sylvaneth-bt"><strong>${escapeHtml(sbf.name)}</strong> <span class="muted small">— ${escapeHtml(sbf.ability || "")}</span>
        <p class="setup-recap-bonus">${sbf.bonusSummary ? formatSetupRecapRich(sbf.bonusSummary) : escapeHtml(sbf.summary || "")}</p></li>`;
    }
    h += `</ul><h4 class="setup-recap-sub setup-recap-sub--domaine">Domaine du grand-bois (sorts — effets type)</h4><ul class="setup-recap-list setup-recap-sylvaneth-spells">`;
    for (const sp of SYLVANETH_SPELLS) {
      h += `<li><strong>${escapeHtml(sp.name)}</strong> <span class="muted small">(inc. ${escapeHtml(sp.cast || "—")})</span>
        <p class="setup-recap-bonus">${sp.bonusSummary ? formatSetupRecapRich(sp.bonusSummary) : escapeHtml(sp.summary)}</p></li>`;
    }
    h += `</ul><p class="muted small setup-recap-foot">Chenfront a été exclu. Coche <strong>9p bois</strong> en suivi pour les règles de proximité. Les valeurs en gras sont des synthèses : vérifie le battletome / MUSE en tournoi.</p></div>`;
  }
  if (!isSylvanethFactionId(fid)) {
    h += `<div class="setup-recap-col"><h3 class="setup-recap-sub">${
      isSeraphonFactionId(fid) ?
        "Formations (Hôtes d’étoile)"
      : "Formations de bataille"
    }</h3><ul class="setup-recap-list">`;
    for (const f of formations) {
      h += `<li><strong>${escapeHtml(f.name)}</strong><span class="muted small"> — ${escapeHtml(f.ability)}</span><p class="muted small setup-recap-line">${escapeHtml(f.summary)}</p>`;
      if (f.bonusSummary) {
        h += `<p class="setup-recap-bonus setup-recap-bonus--detail">${formatSetupRecapRich(f.bonusSummary)}</p>`;
      }
      if (f.setupRecap) {
        h += `<p class="muted small setup-recap-line setup-recap-rappel">${f.setupRecap}</p>`;
      }
      h += `</li>`;
    }
    h += "</ul></div>";
  }
  h += `<div class="setup-recap-col"><h3 class="setup-recap-sub">${escapeHtml(traitTitle)}</h3><ul class="setup-recap-list">`;
  for (const t of traits) {
    h += `<li><strong>${escapeHtml(t.name)}</strong><p class="muted small setup-recap-line">${escapeHtml(t.summary)}</p>`;
    if (t.bonusSummary) {
      h += `<p class="setup-recap-bonus setup-recap-bonus--detail">${formatSetupRecapRich(t.bonusSummary)}</p>`;
    }
    if (t.setupRecap) {
      h += `<p class="muted small setup-recap-line setup-recap-rappel">${t.setupRecap}</p>`;
    }
    h += `</li>`;
  }
  h += "</ul></div>";
  h += `<div class="setup-recap-col"><h3 class="setup-recap-sub">${escapeHtml(artTitle)}</h3><ul class="setup-recap-list">`;
  for (const a of artifacts) {
    h += `<li><strong>${escapeHtml(a.name)}</strong><p class="muted small setup-recap-line">${escapeHtml(a.summary)}</p>`;
    if (a.bonusSummary) {
      h += `<p class="setup-recap-bonus setup-recap-bonus--detail">${formatSetupRecapRich(a.bonusSummary)}</p>`;
    }
    if (a.setupRecap) {
      h += `<p class="muted small setup-recap-line setup-recap-rappel">${a.setupRecap}</p>`;
    }
    h += `</li>`;
  }
  h += "</ul></div></div>";
  return h;
}

function refreshArmyPresetControls() {
  const sel = document.getElementById("setup-preset-select");
  const btnLoad = document.getElementById("btn-preset-load");
  const btnDel = document.getElementById("btn-preset-delete");
  if (!sel) return;
  const prev = sel.value;
  sel.innerHTML = '<option value="">— Choisir une liste —</option>';
  const list = loadArmyPresets().sort((a, b) =>
    String(b.savedAt || "").localeCompare(String(a.savedAt || "")),
  );
  for (const p of list) {
    const o = document.createElement("option");
    o.value = p.id;
    const d = p.savedAt ? new Date(p.savedAt) : null;
    const ds =
      d && !Number.isNaN(d.getTime())
        ? d.toLocaleDateString("fr-FR", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })
        : "";
    const lab = (p.label || "Sans nom").trim() || "Sans nom";
    o.textContent = ds ? `${lab} — ${ds}` : lab;
    sel.appendChild(o);
  }
  if (list.some((p) => p.id === prev)) sel.value = prev;
  else sel.value = "";
  const on = !!(sel.value && sel.value !== "");
  if (btnLoad) btnLoad.disabled = !on;
  if (btnDel) btnDel.disabled = !on;
}

let state = loadState();

/** Phase mêlée : si faux, n’affiche que les unités avec « En mêlée » coché (pas persisté). */
let combatTrackerShowAll = false;

const el = {
  viewSetup: document.getElementById("view-setup"),
  viewBattle: document.getElementById("view-battle"),
  setupMainTitle: document.getElementById("setup-main-title"),
  setupTagline: document.getElementById("setup-tagline"),
  setupFactionList: document.getElementById("setup-factions"),
  setupFactionDetail: document.getElementById("setup-faction-detail"),
  setupUnitsHint: document.getElementById("setup-units-hint"),
  setupTrempesHint: document.getElementById("setup-trempes-hint"),
  armyName: document.getElementById("setup-army-name"),
  unitPicker: document.getElementById("setup-unit-picker"),
  instanceList: document.getElementById("setup-instance-list"),
  formationList: document.getElementById("setup-formations"),
  traitSelect: document.getElementById("setup-trait"),
  artifactSelect: document.getElementById("setup-artifact"),
  traitHero: document.getElementById("setup-trait-hero"),
  artifactHero: document.getElementById("setup-artifact-hero"),
  btnStart: document.getElementById("btn-start-battle"),
  btnResetSave: document.getElementById("btn-reset-save"),
  battleTitle: document.getElementById("battle-title"),
  battleRound: document.getElementById("battle-round"),
  battleSide: document.getElementById("battle-side"),
  battlePhase: document.getElementById("battle-phase"),
  battleCp: document.getElementById("battle-cp"),
  btnCpMinus: document.getElementById("btn-cp-minus"),
  btnCpPlus: document.getElementById("btn-cp-plus"),
  btnNextPhase: document.getElementById("btn-next-phase"),
  btnPrevPhase: document.getElementById("btn-prev-phase"),
  btnExitBattle: document.getElementById("btn-exit-battle"),
  phaseContent: document.getElementById("phase-content"),
  unitSidebar: document.getElementById("unit-sidebar"),
  detailPanel: document.getElementById("detail-panel"),
  detailTitle: document.getElementById("detail-title"),
  detailBody: document.getElementById("detail-body"),
  btnCloseDetail: document.getElementById("btn-close-detail"),
  prayerSection: document.getElementById("prayer-apply-section"),
  prayerCaster: document.getElementById("prayer-caster"),
  prayerSelect: document.getElementById("prayer-select"),
  prayerTarget: document.getElementById("prayer-target"),
  prayerHint: document.getElementById("prayer-hint"),
  prayerTargetLabel: document.getElementById("prayer-target-label"),
  btnApplyPrayer: document.getElementById("btn-apply-prayer"),
  prayerConvocationWrap: document.getElementById("prayer-convocation-wrap"),
  prayerConvocationSuccess: document.getElementById("prayer-convocation-success"),
  buffManual: document.getElementById("buff-manual-section"),
  buffHit: document.getElementById("buff-hit"),
  buffWound: document.getElementById("buff-wound"),
  buffSave: document.getElementById("buff-save"),
  buffRend: document.getElementById("buff-rend"),
  buffLabel: document.getElementById("buff-label"),
  btnApplyBuff: document.getElementById("btn-apply-buff"),
  bloodTithe: document.getElementById("blood-tithe"),
  btnTithePlus: document.getElementById("btn-tithe-plus"),
  btnTitheMinus: document.getElementById("btn-tithe-minus"),
  setupTotalGameUnits: document.getElementById("setup-total-game-units"),
  battleDead: document.getElementById("battle-dead"),
  battleArmySize: document.getElementById("battle-army-size"),
  battleTrempesBadge: document.getElementById("battle-trempes-badge"),
  battleFooterKhornePack: document.getElementById("battle-footer-khorne-pack"),
  battleRailTithe: document.getElementById("battle-rail-tithe"),
  btnDeadMinus: document.getElementById("btn-dead-minus"),
  btnDeadPlus: document.getElementById("btn-dead-plus"),
  drawerBackdrop: document.getElementById("drawer-backdrop"),
  drawerUnits: document.getElementById("drawer-units"),
  drawerTithe: document.getElementById("drawer-tithe"),
  titheDrawerBody: document.getElementById("tithe-drawer-body"),
  btnDrawerUnits: document.getElementById("btn-drawer-units"),
  btnDrawerTithe: document.getElementById("btn-drawer-tithe"),
  btnDrawerPc: document.getElementById("btn-drawer-pc"),
  btnCloseDrawerUnits: document.getElementById("btn-close-drawer-units"),
  btnCloseDrawerPc: document.getElementById("btn-close-drawer-pc"),
  btnCloseDrawerTithe: document.getElementById("btn-close-drawer-tithe"),
  drawerPc: document.getElementById("drawer-pc"),
  pcDrawerBody: document.getElementById("pc-drawer-body"),
  drawerEnemy: document.getElementById("drawer-enemy"),
  btnDrawerEnemy: document.getElementById("btn-drawer-enemy"),
  btnCloseDrawerEnemy: document.getElementById("btn-close-drawer-enemy"),
  enemySidebar: document.getElementById("enemy-sidebar"),
  enemyDrawerHint: document.getElementById("enemy-drawer-hint"),
  enemyDetailPanel: document.getElementById("enemy-detail-panel"),
  enemyDetailTitle: document.getElementById("enemy-detail-title"),
  enemyDetailBody: document.getElementById("enemy-detail-body"),
  btnCloseEnemyDetail: document.getElementById("btn-close-enemy-detail"),
  btnEnemyDemo: document.getElementById("btn-enemy-demo"),
  setupPlayerName: document.getElementById("setup-player-name"),
  setupRoomCode: document.getElementById("setup-room-code"),
};

function handleFactionChange(ev) {
  const t =
    ev?.target?.name === "faction" && ev?.target?.type === "radio"
      ? ev.target
      : el.setupFactionList?.querySelector(
          'input[name="faction"]:checked',
        );
  if (!t) return;
  const value = String(t.value ?? "").trim();
  const chosen = FACTIONS.find((x) => x.id === value);
  if (!chosen?.implemented) return;
  const prev = state.setup.factionId;
  state.setup.factionId = value;
  if (prev !== value) {
    state.instances = [];
    state.setup.traitHeroInstanceId = "";
    state.setup.artifactHeroInstanceId = "";
    Object.assign(state.setup, getDefaultArmySetupForFaction(value));
  }
  persist();
  renderSetup();
}

/**
 * Délégation au niveau document : les radios sont recréées à chaque renderSetup ;
 * un listener sur #setup-factions peut ne jamais être attaché si getElementById a échoué au chargement.
 */
function handleFactionChangeFromDocument(ev) {
  const t = ev.target;
  if (t?.name !== "faction" || t.type !== "radio") return;
  const box = document.getElementById("setup-factions");
  if (!box || !box.contains(t)) return;
  handleFactionChange(ev);
}
document.addEventListener("change", handleFactionChangeFromDocument);

function isHeroInstance(inst) {
  const u = getUnitById(inst.catalogId);
  if (!u) return false;
  return (
    (u.keywords && u.keywords.includes("HÉROS")) || u.isPriest === true
  );
}

/** Traits héroïques et artefacts : réservés aux héros dont le warscroll n’a pas le mot-clé UNIQUE. */
function isHeroEligibleForTraitArtifact(inst) {
  if (!isHeroInstance(inst)) return false;
  const u = getUnitById(inst.catalogId);
  if (!u) return false;
  const kws = u.keywords || [];
  return !kws.some((x) => String(x).toUpperCase() === "UNIQUE");
}

/** Restreint porteur relique / trait (ex. sorcier → Branchanteresse seulement). */
function heroMatchesAllowlistCatalogIds(inst, allowedIds) {
  if (!allowedIds?.length) return true;
  const u = getUnitById(inst.catalogId);
  return !!(u && allowedIds.includes(u.id));
}

function persist() {
  saveState(state);
  maybeSchedulePartySnapshotPush();
}

function maybeSchedulePartySnapshotPush() {
  if (!state.battle) return;
  const rr = state.setup.roomRole;
  if (rr !== "host" && rr !== "guest") return;
  if (!String(state.setup.roomCode || "").trim()) return;
  if (!String(state.setup.partyHost || "").trim()) return;
  partyKit.schedulePartySnapshotPush();
}

function setPartyKitStatus(msg) {
  const n = document.getElementById("setup-partykit-status");
  if (n) n.textContent = msg;
}

function updatePartyKitConnectButton() {
  const btn = document.getElementById("btn-partykit-connect");
  if (!btn) return;
  const solo = state.setup.roomRole === "solo";
  btn.disabled = solo;
  btn.textContent = partyKit.isPartyConnected()
    ? "Se déconnecter du salon"
    : "Connexion au salon";
}

function ensureSyncClientId() {
  if (state.setup.syncClientId && String(state.setup.syncClientId).trim())
    return;
  state.setup.syncClientId = uid();
  persist();
}

async function connectPartyKitConfigured() {
  ensureSyncClientId();
  await partyKit.connectPartyKit({
    host: state.setup.partyHost,
    room: state.setup.roomCode,
    getSnapshot: () => ({
      type: "army_snapshot",
      clientId: state.setup.syncClientId,
      ...buildMyArmySnapshotForSync(),
    }),
    getBattle: () => state.battle,
    getMyTeamId: () => state.setup.teamId,
    onApplied: () => {
      persist();
      renderBattle();
    },
    onStatus: setPartyKitStatus,
    onSalonMessage: handleSalonIncoming,
    getSalonHelloPayload: () => ({
      type: "salon_hello",
      clientId: state.setup.syncClientId,
      playerName: state.setup.playerName || "Joueur",
      teamId: normalizeTeamId(state.setup.teamId),
      roomCode: state.setup.roomCode || "",
    }),
    onChannelOpen: () => {
      if (state.battle) sendSalonReady(true);
    },
  });
  updatePartyKitConnectButton();
  renderSalonRoster();
}

async function maybeAutoConnectPartyKit() {
  const rr = state.setup.roomRole;
  if (rr !== "host" && rr !== "guest") return;
  if (!String(state.setup.roomCode || "").trim()) return;
  if (!String(state.setup.partyHost || "").trim()) return;
  try {
    await connectPartyKitConfigured();
  } catch (e) {
    console.warn("[PartyKit]", e);
    setPartyKitStatus(
      "Connexion impossible — vérifie l’hôte, le code salon et le déploiement.",
    );
  }
}

/** Pairs connectés au salon PartyKit (clientId → nom, équipe, prêt). */
const salonPeers = new Map();

function clearSalonPeers() {
  salonPeers.clear();
  renderSalonRoster();
}

function mergeSalonPeer(data) {
  const id = String(data.clientId ?? "").trim();
  if (!id) return;
  const prev = salonPeers.get(id);
  const name = String(data.playerName ?? prev?.playerName ?? "Joueur").slice(
    0,
    40,
  );
  const teamId = normalizeTeamId(data.teamId ?? prev?.teamId ?? 1);
  let ready = prev?.ready ?? false;
  if (data.type === "salon_ready") ready = !!data.ready;
  salonPeers.set(id, {
    playerName: name,
    teamId,
    ready,
    lastSeen: Date.now(),
  });
}

function removeSalonPeer(clientId) {
  const id = String(clientId ?? "").trim();
  if (!id) return;
  salonPeers.delete(id);
  renderSalonRoster();
}

function handleSalonIncoming(data) {
  if (!data || typeof data !== "object") return;
  const t = data.type;
  if (t === "salon_presence" && data.event === "leave") {
    removeSalonPeer(data.clientId);
    return;
  }
  if (t === "salon_hello" || t === "salon_ready") {
    mergeSalonPeer(data);
    pruneStaleSalonPeers();
    renderSalonRoster();
  }
}

function pruneStaleSalonPeers() {
  const now = Date.now();
  const maxAge = 120000;
  const myId = String(state.setup.syncClientId ?? "").trim();
  for (const [id, p] of salonPeers) {
    if (id === myId) continue;
    if (now - p.lastSeen > maxAge) salonPeers.delete(id);
  }
}

function renderSalonRoster() {
  const wrap = document.getElementById("setup-salon-roster-wrap");
  const ul = document.getElementById("setup-salon-roster");
  const battleLine = document.getElementById("battle-salon-line");
  const rr = state.setup.roomRole;
  const solo = rr === "solo";
  const connected = partyKit.isPartyConnected();
  pruneStaleSalonPeers();

  const myId = String(state.setup.syncClientId ?? "").trim();
  if (myId && connected && !solo && !salonPeers.has(myId)) {
    mergeSalonPeer({
      type: "salon_hello",
      clientId: myId,
      playerName: state.setup.playerName || "Joueur",
      teamId: state.setup.teamId,
    });
  }

  if (wrap) wrap.hidden = solo || !connected;

  if (ul) {
    const entries = Array.from(salonPeers.entries()).sort((a, b) => {
      const ta = a[1].teamId - b[1].teamId;
      if (ta !== 0) return ta;
      return a[1].playerName.localeCompare(b[1].playerName, "fr");
    });
    ul.innerHTML = "";
    for (const [, p] of entries) {
      const li = document.createElement("li");
      li.className = "salon-roster-item";
      const nameSpan = document.createElement("span");
      nameSpan.className = "salon-roster-name";
      nameSpan.textContent = p.playerName;
      const teamSpan = document.createElement("span");
      teamSpan.className = "salon-roster-team";
      teamSpan.textContent = `Équipe ${p.teamId}`;
      const readySpan = document.createElement("span");
      readySpan.className = "salon-roster-ready";
      readySpan.title = p.ready ? "Partie lancée" : "En préparation";
      readySpan.textContent = p.ready ? "✓" : "…";
      readySpan.setAttribute(
        "aria-label",
        p.ready ? "Prêt" : "Pas encore prêt",
      );
      li.append(nameSpan, teamSpan, readySpan);
      ul.appendChild(li);
    }
  }

  if (battleLine) {
    if (solo || !connected || !state.battle) {
      battleLine.hidden = true;
      battleLine.textContent = "";
    } else {
      const entries = Array.from(salonPeers.entries()).sort((a, b) => {
        const ta = a[1].teamId - b[1].teamId;
        if (ta !== 0) return ta;
        return a[1].playerName.localeCompare(b[1].playerName, "fr");
      });
      if (entries.length === 0) {
        battleLine.hidden = true;
      } else {
        battleLine.hidden = false;
        const readyN = entries.filter((e) => e[1].ready).length;
        const parts = entries.map(
          ([, p]) => `${p.playerName}${p.ready ? " ✓" : " …"}`,
        );
        battleLine.textContent = `Salon — ${readyN}/${entries.length} prêts · ${parts.join(" · ")}`;
      }
    }
  }
}

function sendSalonReady(ready) {
  if (!partyKit.isPartyConnected()) return;
  partyKit.sendPartyMessage({
    type: "salon_ready",
    clientId: state.setup.syncClientId,
    playerName: state.setup.playerName || "Joueur",
    teamId: normalizeTeamId(state.setup.teamId),
    ready: !!ready,
  });
  mergeSalonPeer({
    type: "salon_ready",
    clientId: state.setup.syncClientId,
    playerName: state.setup.playerName || "Joueur",
    teamId: state.setup.teamId,
    ready: !!ready,
  });
  renderSalonRoster();
}

/** PV max issu du profil (premier nombre dans la chaîne). */
function getWoundsMaxFromProfile(u) {
  if (!u?.stats?.wounds) return null;
  const m = String(u.stats.wounds).trim().match(/^(\d+)/);
  return m ? parseInt(m[1], 10) : null;
}

/** Nombre de figurines (unités multi-modèles : `woundsPerModel` + `modelCount` sur l’instance). */
function getFigurineCount(inst, u) {
  if (!u || typeof u.woundsPerModel !== "number") return 1;
  const n = Number(inst?.modelCount ?? u.defaultModelCount ?? 1);
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.floor(n);
}

/**
 * PV max pour cette instance (somme des PV des figurines si multi-modèle).
 */
function getWoundsMaxInst(inst, u) {
  if (!u) return null;
  let base;
  if (typeof u.woundsPerModel === "number") {
    base = getFigurineCount(inst, u) * u.woundsPerModel;
  } else {
    base = getWoundsMaxFromProfile(u);
  }
  if (base == null) return null;
  if (
    isSeraphonFactionId(state.setup?.factionId) &&
    state.setup.formationId === "ser_formation_thunderquake_starhost" &&
    seraphonUnitIsMonsterSeraphon(u)
  ) {
    if (typeof u.woundsPerModel === "number")
      return base + getFigurineCount(inst, u) * 2;
    return base + 2;
  }
  return base;
}

/** PV restants (nombre saisi), bornés au max ; 0 si détruite. */
function getWoundsRemainingInst(inst, u) {
  if (!u) return null;
  const max = getWoundsMaxInst(inst, u);
  if (max == null) return null;
  if (inst.destroyed) return 0;
  const raw = inst.woundsCurrent;
  if (raw === "" || raw == null) return max;
  const n = Number(raw);
  if (!Number.isFinite(n)) return max;
  return Math.max(0, Math.min(max, Math.floor(n)));
}

/**
 * Figurines encore « présentes » selon les PV restants (répartition minimale cohérente avec le total de blessures).
 */
function getRemainingFigurineCount(inst, u) {
  if (!u || inst.destroyed) return 0;
  const w = getWoundsRemainingInst(inst, u);
  if (w == null || w <= 0) return 0;
  if (typeof u.woundsPerModel !== "number" || u.woundsPerModel <= 0) return 1;
  const nMax = getFigurineCount(inst, u);
  return Math.min(nMax, Math.ceil(w / u.woundsPerModel));
}

/** `3/5` pour une unité multi-modèles ; chaîne vide sinon. */
function formatFigurinesRatioLabel(inst, u) {
  if (!u) return "";
  const nMax = getFigurineCount(inst, u);
  if (typeof u.woundsPerModel !== "number" || nMax <= 1) return "";
  const rem = getRemainingFigurineCount(inst, u);
  return `${rem}/${nMax}`;
}

/** Cellule tableau de suivi : figurines restantes / totales (ou 1 / 0 pour modèle unique). */
function formatTrackerFiguresCell(inst, u) {
  if (!u) return "—";
  if (typeof u.woundsPerModel === "number" && getFigurineCount(inst, u) > 1) {
    return formatFigurinesRatioLabel(inst, u);
  }
  if (inst.destroyed) return "0";
  return "1";
}

/** Suffixe HTML pour récaps de phase (nom d’unité). */
function formatFigurinesHtmlSuffix(inst, u) {
  if (!u) return "";
  ensureInstanceTracking(inst);
  const ratio = formatFigurinesRatioLabel(inst, u);
  if (ratio) {
    return ` <span class="unit-fig-count muted">(${escapeHtml(ratio)} fig.)</span>`;
  }
  if (inst.destroyed) {
    return ` <span class="unit-fig-count muted">(0 fig.)</span>`;
  }
  return ` <span class="unit-fig-count muted">(1 fig.)</span>`;
}

/** Suffixe texte barre latérale Unités. */
function formatSidebarFiguresSuffix(inst, u) {
  if (!u) return "";
  ensureInstanceTracking(inst);
  const ratio = formatFigurinesRatioLabel(inst, u);
  if (ratio) return ` · ${ratio} fig.`;
  if (inst.destroyed) return " · 0 fig.";
  return " · 1 fig.";
}

/** Indication dans la case PV : total puis (nombre de figurines). */
function formatPvMaxHint(inst, u) {
  const max = getWoundsMaxInst(inst, u);
  if (max == null) return "max";
  const n = getFigurineCount(inst, u);
  if (typeof u.woundsPerModel === "number" && n > 1)
    return `${max} (${n} fig. max)`;
  return String(max);
}

/** Ligne PV : courant/max et ratio de figurines dynamique si multi-modèles. */
function formatPvStatLine(inst, u) {
  const max = getWoundsMaxInst(inst, u);
  if (max == null) return u.stats?.wounds ?? "—";
  const cur = getWoundsRemainingInst(inst, u);
  const curDisp = cur != null ? cur : max;
  const ratio = formatFigurinesRatioLabel(inst, u);
  if (ratio) return `${curDisp}/${max} (${ratio} fig.)`;
  return `${curDisp}/${max}`;
}

/** Be'lakor — Lame des ombres : 8 att. par défaut, 6 si 10+ blessures subies (PV rest. ≤ 4 sur 14). */
function getBelakorLameAttacks(inst, u) {
  if (u?.id !== "belakor") return null;
  const maxW = getWoundsMaxInst(inst, u);
  const cur = inst?.woundsCurrent;
  if (maxW == null) return "8";
  if (cur === "" || cur == null) return "8";
  const lost = maxW - Number(cur);
  return lost >= 10 ? "6" : "8";
}

/** Gordrakk — Poings et queue : 8 att. par défaut, 6 si 10+ dégâts alloués (sur 20 PV). */
function getGordrakkPoingsAttacks(inst, u) {
  if (u?.id !== "ij_gordrakk") return null;
  const maxW = getWoundsMaxInst(inst, u);
  const cur = inst?.woundsCurrent;
  if (maxW == null) return "8";
  if (cur === "" || cur == null) return "8";
  const lost = maxW - Number(cur);
  return lost >= 10 ? "6" : "8";
}

/** Prince Vhordrai — Griffes : 7 att. par défaut, 5 si 10+ dégâts alloués. */
function getVhordraiGriffesAttacks(inst, u) {
  if (u?.id !== "sb_prince_vhordrai") return null;
  const maxW = getWoundsMaxInst(inst, u);
  const cur = inst?.woundsCurrent;
  if (maxW == null) return "7";
  if (cur === "" || cur == null) return "7";
  const lost = maxW - Number(cur);
  return lost >= 10 ? "5" : "7";
}

/** Carnosaure — Mâchoires massives : 3 A par défaut, 2 si 10+ dégâts alloués (PV rest. ≤4 sur 14). */
function getCarnosaurMassiveJawAttacks(inst, u) {
  if (u?.id !== "ser_oldblood_carnosaure") return null;
  const maxW = getWoundsMaxInst(inst, u);
  const cur = inst?.woundsCurrent;
  if (maxW == null) return "3";
  if (cur === "" || cur == null) return "3";
  const lost = maxW - Number(cur);
  return lost >= 10 ? "2" : "3";
}

/** Esprit de Durthu — Épée gardienne : 4 A, 3 si 10+ blessures allouées (PV rest. ≤4 sur 14). */
function getSylDurthuEpeeAttacks(inst, u) {
  if (u?.id !== "syl_spirit_durthu") return null;
  const maxW = getWoundsMaxInst(inst, u);
  const cur = inst?.woundsCurrent;
  if (maxW == null) return "4";
  if (cur === "" || cur == null) return "4";
  const lost = maxW - Number(cur);
  return lost >= 10 ? "3" : "4";
}

function waaaghVictoryMeleeAttackBonus(inst, u, w) {
  if (!inst || inst.destroyed || !u || !w) return 0;
  if (u.id !== "ij_gordrakk" && u.id !== "ij_megaboss") return 0;
  if (weaponIsRangedForPhase(w)) return 0;
  const tok = Math.min(3, Number(inst.waaaghVictoryTokens) || 0);
  const spent = Number(inst.waaaghSpentAttackBonus) || 0;
  return tok + spent;
}

function armyHasBloodsecrator() {
  return state.instances.some(
    (inst) => getUnitById(inst.catalogId)?.id === "bloodsecrator",
  );
}

/** Consangcrateur — Rage de Khorne : bonus affiché uniquement en phase de mêlée tant que l’effet est actif. */
function isConsangRageDisplayedOnSheet() {
  const b = state.battle;
  if (!b || b.consangRageActive !== true) return false;
  return currentPhase().id === "combat" && isPlayerTurn(b);
}

function getTotalGameUnitsForTrempes() {
  const b = state.battle;
  if (!b) return 0;
  return b.totalGameUnits != null && b.totalGameUnits > 0
    ? b.totalGameUnits
    : b.startingArmySize ?? 0;
}

function hasRageIncontrolableBuff(inst) {
  return (inst.buffs || []).some((bf) =>
    String(bf.label || "").includes("Rage incontrôlable"),
  );
}

function trempesProfileActiveForUnit(inst, u, battle) {
  if (!battle || inst.destroyed) return false;
  if (trempesActiveForCurrentGame(battle)) return true;
  return !!(hasRageIncontrolableBuff(inst) || inst.rageIncontrolableTrempes);
}

function filterTrempesEffectsForInstance(effects, inst) {
  if (!inst?.rageIncontrolableRecite8plus) return effects;
  return effects.filter((e) => e.id !== "brutalite_aveugle");
}

function buildBonusSummaryLines(inst, u) {
  const lines = [];
  const b = state.battle;
  if (!b || inst.destroyed || !u) return lines;
  const form = getFormationById(state.setup.formationId);
  const artH = state.setup.artifactHeroInstanceId;
  const isArtCarrier =
    artH && String(artH) === String(inst.id);
  const artId = state.setup.artifactId;

  if (isPeauxVertesFactionContext()) {
    if (b.ironjawzWaaaghAuraActiveThisPlayerTurn && inst.ironjawzInWaaaghAura) {
      lines.push({
        ability: "Waaagh! Mâchefer",
        detail:
          "+1 au jet de charge et +1 A aux armes de mêlée (voir suivi) ; unités Mâchefers ennemies à 18\" du déclencheur : −1 au toucher.",
      });
    }
    if (state.setup.formationId === "ij_bagarde" && inst.ironjawzChargeRoll8Plus) {
      lines.push({
        ability: "Catastrophe naturelle (Bagarre)",
        detail: "+1 A aux armes de mêlée (charge 8+ non héros)",
      });
    }
    if (
      state.setup.formationId === "ij_poing_bizarre" &&
      unitKeyword(u, "INFANTERIE") &&
      inst.ironjawzEspritDeGork
    ) {
      lines.push({
        ability: "Esprit de Gork",
        detail: "Protection 6+ (à 12\" d’un sorcier ou prêtre Mâchefer allié)",
      });
    }
    if (isArtCarrier && artId === "ij_cranes_trophees") {
      lines.push({
        ability: "Crânes-trophées",
        detail: "+10 au score de contrôle",
      });
    }
    if (isArtCarrier && artId === "ij_armure_gork") {
      lines.push({
        ability: "Armure de Gork",
        detail: "Protection 6+",
      });
    }
    if (isArtCarrier && artId === "ij_pierre_ambrivoire") {
      lines.push({
        ability: "Pierre à Ambrivoire",
        detail: "+1 perforant sur l’arme choisie (déploiement)",
      });
    }
  }

  if (trackerHordeObjEnabled(u) && inst.hordeObjectiveContested) {
    lines.push({
      ability: form?.name
        ? `${form.ability} (${form.name})`
        : "Objectif contesté (Horde)",
      detail: "+1 pour toucher (mêlée)",
    });
  }
  if (trackerClawsPackEnabled(u) && inst.clawsPack12) {
    lines.push({
      ability: "Chasseur de meute",
      detail: "Touches critiques sur 5+ en mêlée (12\" Molosses / Karanak)",
    });
  }
  if (trackerDespoteBandEnabled(u) && inst.despoteBand12) {
    lines.push({
      ability: "Seigneur de sang lié — proximité Despote",
      detail: "+1 pour blesser (mêlée)",
    });
  }
  if (
    isConsangRageDisplayedOnSheet() &&
    unitKeyword(u, "SANG-LIÉS") &&
    (u.weapons || []).some((w) => !weaponIsRangedForPhase(w))
  ) {
    lines.push({
      ability: "Rage de Khorne",
      detail: "+1 aux Attaques des armes de mêlée (cette phase de mêlée dans l’app)",
    });
  }

  const trempesOn = trempesProfileActiveForUnit(inst, u, b);
  const trempesEffects = getTrempesDeSangEffectsForUnit(u);
  if (trempesOn && trempesEffects.length) {
    const shown = filterTrempesEffectsForInstance(trempesEffects, inst);
    const bits = [];
    if (trempesActiveForCurrentGame(b)) bits.push("trait de bataille (seuil atteint)");
    if (hasRageIncontrolableBuff(inst) || inst.rageIncontrolableTrempes)
      bits.push("Rage incontrôlable (prière ou encart)");
    if (inst.rageIncontrolableRecite8plus)
      bits.push("récitation 8+ : sans Brutalité aveugle");
    lines.push({
      ability: "Trempés de sang",
      detail: `${bits.join(" · ")} — effets : ${shown.map((e) => e.name).join(", ")}`,
    });
  }

  if (isSoulblightFactionContext()) {
    if (inst.soulblightGardeRoyaleMelee && u?.id === "sb_garde_tertres") {
      lines.push({
        ability: "Gardes royaux",
        detail:
          "Protection 5+ (tant qu’un héros Ruinemâne d’infanterie ami est à portée de mêlée — coches suivi)",
      });
    }
    if (
      inst.soulblightRoiOsCrit2Touches &&
      u &&
      unitKeyword(u, "RACLEMORTS")
    ) {
      lines.push({
        ability: "Roi des os ambulants",
        detail: "Armes de mêlée avec Crit (2 touches) pour le tour",
      });
    }
    const sm = String(inst.soulblightSaintMassacreChoice || "");
    if (unitIsVampireNonMonster(u) && (sm === "move" || sm === "atk" || sm === "dmg")) {
      const detail =
        sm === "move"
          ? "+2\" au mouvement"
          : sm === "atk"
            ? "+1 à la caractéristique d’Attaque (mêlée)"
            : "+1 à la caractéristique de dégâts des armes (mêlée)";
      lines.push({
        ability: "Saint du massacre",
        detail: `${detail} (cumulable, reste de bataille)`,
      });
    }
  }

  return lines;
}

function getConsangRageMeleeAttackBonus(inst, u, w) {
  if (inst?.destroyed) return 0;
  if (!isConsangRageDisplayedOnSheet()) return 0;
  if (!unitKeyword(u, "SANG-LIÉS")) return 0;
  if (weaponIsRangedForPhase(w)) return 0;
  return 1;
}

function formatAttacksCellWithRage(w, inst, u, rageBonus) {
  let atkCell = w.attacks ?? "—";
  if (w.dynamicAttacks === "belakor_lame") {
    atkCell = String(getBelakorLameAttacks(inst, u));
  }
  if (w.dynamicAttacks === "gordrakk_poings") {
    atkCell = String(getGordrakkPoingsAttacks(inst, u));
  }
  if (w.dynamicAttacks === "vhordrai_griffes") {
    atkCell = String(getVhordraiGriffesAttacks(inst, u));
  }
  if (w.dynamicAttacks === "carnosaur_machoires") {
    atkCell = String(getCarnosaurMassiveJawAttacks(inst, u));
  }
  if (w.dynamicAttacks === "syl_durthu_epee") {
    atkCell = String(getSylDurthuEpeeAttacks(inst, u));
  }
  if (!rageBonus || inst.destroyed) return atkCell;
  if (w.dynamicAttacks === "belakor_lame") {
    const n = parseInt(atkCell, 10);
    if (Number.isFinite(n)) return `${n} → ${n + 1}`;
  }
  if (w.dynamicAttacks === "gordrakk_poings") {
    const n = parseInt(atkCell, 10);
    if (Number.isFinite(n)) return `${n} → ${n + 1}`;
  }
  if (w.dynamicAttacks === "vhordrai_griffes") {
    const n = parseInt(atkCell, 10);
    if (Number.isFinite(n)) return `${n} → ${n + 1}`;
  }
  if (w.dynamicAttacks === "carnosaur_machoires") {
    const n = parseInt(atkCell, 10);
    if (Number.isFinite(n)) return `${n} → ${n + 1}`;
  }
  if (w.dynamicAttacks === "syl_durthu_epee") {
    const n = parseInt(atkCell, 10);
    if (Number.isFinite(n)) return `${n} → ${n + 1}`;
  }
  const s = String(atkCell).trim();
  if (/^\d+$/.test(s)) {
    const n = parseInt(s, 10);
    return `${n} → ${n + 1}`;
  }
  if (s && s !== "—") {
    return `${atkCell} <span class="muted small">(+1 Rage)</span>`;
  }
  return atkCell;
}

function unitKeyword(u, kw) {
  const k = kw.toUpperCase();
  return (u?.keywords || []).some((x) => String(x).toUpperCase() === k);
}

function trackerHordeObjEnabled(u) {
  return state.setup?.formationId === "horde" && unitKeyword(u, "SANG-LIÉS");
}

function trackerClawsPackEnabled(u) {
  return u?.id === "claws_karanak";
}

function trackerDespoteBandEnabled(u) {
  if (u?.id === "deathbringer") return false;
  return unitKeyword(u, "INFANTERIE") && unitKeyword(u, "SANG-LIÉS");
}

function armyShowsTacticalBonusColumn() {
  for (const inst of state.instances) {
    if (inst.destroyed) continue;
    const u = getUnitById(inst.catalogId);
    if (!u) continue;
    if (
      trackerHordeObjEnabled(u) ||
      trackerClawsPackEnabled(u) ||
      trackerDespoteBandEnabled(u)
    )
      return true;
  }
  return false;
}

/** Modificateurs tactiques (suivi) : Horde / Despote — reflets sur la fiche. */
function getTacticalSituationMods(inst, u) {
  if (inst.destroyed) return { hit: 0, wound: 0 };
  let hit = 0;
  let wound = 0;
  if (trackerHordeObjEnabled(u) && inst.hordeObjectiveContested) hit += 1;
  if (trackerDespoteBandEnabled(u) && inst.despoteBand12) wound += 1;
  return { hit, wound };
}

/** Cases Horde / Griffes / Despote (même marquage dans tableau et fiche). */
function tacticalBonusCheckboxLabels(inst, u, tacticalLocked) {
  if (inst.destroyed) return [];
  const disAttr = tacticalLocked ? " disabled" : "";
  const parts = [];
  if (trackerHordeObjEnabled(u)) {
    parts.push(
      `<label class="tracker-label tracker-bonus-label"><input type="checkbox" class="tracker-horde-obj" data-iid="${inst.id}" ${inst.hordeObjectiveContested ? "checked" : ""}${disAttr} title="Horde : +1 pour toucher en mêlé vs unité sur objectif contesté que tu ne contrôles pas"> Obj. contesté</label>`,
    );
  }
  if (trackerClawsPackEnabled(u)) {
    parts.push(
      `<label class="tracker-label tracker-bonus-label"><input type="checkbox" class="tracker-claws-pack" data-iid="${inst.id}" ${inst.clawsPack12 ? "checked" : ""}${disAttr} title="À 12&quot; de Molosses ou Karanak : critique sur un jet de touche de 5+ (mêlée)"> 12&quot; Molosses / Karanak</label>`,
    );
  }
  if (trackerDespoteBandEnabled(u)) {
    parts.push(
      `<label class="tracker-label tracker-bonus-label"><input type="checkbox" class="tracker-despote-band" data-iid="${inst.id}" ${inst.despoteBand12 ? "checked" : ""}${disAttr} title="À 12&quot; d&apos;un Despote sanglant : +1 pour blesser (mêlée)"> 12&quot; Despote</label>`,
    );
  }
  return parts;
}

function buildTrackerBonusCell(inst, u, tacticalLocked) {
  const parts = tacticalBonusCheckboxLabels(inst, u, tacticalLocked);
  if (!parts.length) return `<td class="tracker-bonus muted">—</td>`;
  return `<td class="tracker-bonus"><div class="tracker-bonus-stack">${parts.join("")}</div></td>`;
}

function ensureInstanceTracking(inst) {
  const u = getUnitById(inst.catalogId);
  const max = getWoundsMaxInst(inst, u);
  if (inst.woundsCurrent === undefined || inst.woundsCurrent === null) {
    inst.woundsCurrent = max != null ? max : "";
  }
  if (typeof inst.inMelee !== "boolean") inst.inMelee = false;
  if (typeof inst.chargedThisTurn !== "boolean") inst.chargedThisTurn = false;
  if (typeof inst.hordeObjectiveContested !== "boolean")
    inst.hordeObjectiveContested = false;
  if (typeof inst.clawsPack12 !== "boolean") inst.clawsPack12 = false;
  if (typeof inst.despoteBand12 !== "boolean") inst.despoteBand12 = false;
  if (typeof inst.destroyed !== "boolean") inst.destroyed = false;
  if (typeof inst.rageIncontrolableTrempes !== "boolean")
    inst.rageIncontrolableTrempes = false;
  if (typeof inst.rageIncontrolableRecite8plus !== "boolean")
    inst.rageIncontrolableRecite8plus = false;
  if (typeof inst.isInvocation !== "boolean") inst.isInvocation = false;
  if (typeof inst.ironjawzInWaaaghAura !== "boolean")
    inst.ironjawzInWaaaghAura = false;
  if (typeof inst.ironjawzChargeRoll8Plus !== "boolean")
    inst.ironjawzChargeRoll8Plus = false;
  if (typeof inst.ironjawzEspritDeGork !== "boolean")
    inst.ironjawzEspritDeGork = false;
  if (
    inst.ironjawzAmbrivoireWeaponIndex == null ||
    typeof inst.ironjawzAmbrivoireWeaponIndex !== "number"
  ) {
    inst.ironjawzAmbrivoireWeaponIndex = 0;
  }
  if (
    typeof inst.waaaghVictoryTokens !== "number" ||
    inst.waaaghVictoryTokens < 0
  )
    inst.waaaghVictoryTokens = 0;
  if (inst.waaaghVictoryTokens > 3) inst.waaaghVictoryTokens = 3;
  if (typeof inst.waaaghSpentAttackBonus !== "number")
    inst.waaaghSpentAttackBonus = 0;
  if (inst.volonteControlD6 === undefined || inst.volonteControlD6 === null)
    inst.volonteControlD6 = "";
  if (typeof inst.soulblightGardeRoyaleMelee !== "boolean")
    inst.soulblightGardeRoyaleMelee = false;
  if (typeof inst.soulblightRoiOsCrit2Touches !== "boolean")
    inst.soulblightRoiOsCrit2Touches = false;
  if (
    inst.soulblightSaintMassacreChoice == null ||
    (typeof inst.soulblightSaintMassacreChoice === "string" &&
      !["", "move", "atk", "dmg"].includes(inst.soulblightSaintMassacreChoice))
  )
    inst.soulblightSaintMassacreChoice = "";
  if (inst.soulblightMachineMortisEnergy == null)
    inst.soulblightMachineMortisEnergy = 1;
  const sme = Number(inst.soulblightMachineMortisEnergy);
  if (!Number.isFinite(sme) || sme < 1) inst.soulblightMachineMortisEnergy = 1;
  else if (sme > 6) inst.soulblightMachineMortisEnergy = 6;
  if (typeof inst.sylWithin9OfWood !== "boolean") inst.sylWithin9OfWood = false;
  if (
    inst.chevalierTertresBaselineWounds !== "" &&
    inst.chevalierTertresBaselineWounds != null &&
    typeof inst.chevalierTertresBaselineWounds !== "number"
  ) {
    const n = Number(inst.chevalierTertresBaselineWounds);
    inst.chevalierTertresBaselineWounds = Number.isFinite(n) ? n : "";
  }
}

function sylvanethWood9ColumnActive() {
  return isSylvanethFactionContext();
}

function soulblightVolonteTrackerColumnActive() {
  if (!isSoulblightFactionContext()) return false;
  if (state.setup.traitId !== "sb_volonte_inebranlable") return false;
  return !!state.setup.traitHeroInstanceId;
}

function soulblightGardeRoyaleColumnActive() {
  return (
    isSoulblightFactionContext() && soulblightArmyHasCatalogUnit("sb_garde_tertres")
  );
}

function soulblightRoiCritColumnActive() {
  return (
    isSoulblightFactionContext() &&
    soulblightArmyHasCatalogUnit("sb_roi_revenant_pied") &&
    state.instances.some(
      (i) =>
        !i.destroyed &&
        unitKeyword(getUnitById(i.catalogId) || {}, "RACLEMORTS"),
    )
  );
}

function soulblightSaintMassacreColumnActive() {
  if (!isSoulblightFactionContext()) return false;
  if (!soulblightArmyHasCatalogUnit("sb_prince_vhordrai")) return false;
  return state.instances.some((i) => {
    if (i.destroyed) return false;
    const u = getUnitById(i.catalogId);
    return u && unitIsVampireNonMonster(u);
  });
}

function buildSoulblightGardeRoyaleCell(inst, u, tacticalLocked) {
  ensureInstanceTracking(inst);
  if (u?.id !== "sb_garde_tertres") {
    return `<td class="muted" title="Réservé à la Garde des tertres">—</td>`;
  }
  const dis = inst.destroyed === true || tacticalLocked === true;
  return `<td class="tracker-check"><label class="tracker-label"><input type="checkbox" class="tracker-sb-garde-royale" data-iid="${inst.id}" ${inst.soulblightGardeRoyaleMelee ? "checked" : ""} ${dis ? "disabled" : ""} title="Gardes royaux : héros Ruinemâne inf. à portée de mêlée → Protection 5+" /> Gardes roy.</label></td>`;
}

function buildSoulblightRoiCritCell(inst, u, tacticalLocked) {
  ensureInstanceTracking(inst);
  if (!unitKeyword(u || {}, "RACLEMORTS")) {
    return `<td class="muted" title="Réservé aux RACLEMORTS">—</td>`;
  }
  const dis = inst.destroyed === true || tacticalLocked === true;
  return `<td class="tracker-check"><label class="tracker-label"><input type="checkbox" class="tracker-sb-roi-crit" data-iid="${inst.id}" ${inst.soulblightRoiOsCrit2Touches ? "checked" : ""} ${dis ? "disabled" : ""} title="Roi des os ambulants : Crit (2 touches)" /> Crit 2+</label></td>`;
}

function buildSoulblightSaintMassacreCell(inst, u, tacticalLocked) {
  ensureInstanceTracking(inst);
  if (!unitIsVampireNonMonster(u)) {
    return `<td class="muted" title="Réservé aux VAMPIRES non monstres">—</td>`;
  }
  const dead = inst.destroyed === true;
  const v = String(inst.soulblightSaintMassacreChoice || "");
  if (dead) {
    return `<td class="muted"><select class="tracker-sb-saint-massacre" data-iid="${inst.id}" disabled><option value="">—</option></select></td>`;
  }
  const sel = (x) => (v === x ? "selected" : "");
  const disAttr = tacticalLocked ? " disabled" : "";
  return `<td class="tracker-volonte"><select class="tracker-sb-saint-massacre" data-iid="${inst.id}" title="Saint du massacre (bonus reste de bataille)"${disAttr}>
    <option value="" ${sel("")}>—</option>
    <option value="move" ${sel("move")}>+2" M</option>
    <option value="atk" ${sel("atk")}>+1 A</option>
    <option value="dmg" ${sel("dmg")}>+1 Dégâts</option>
  </select></td>`;
}

function buildSoulblightVolonteControlCell(inst, tacticalLocked) {
  ensureInstanceTracking(inst);
  const dis = inst.destroyed === true || tacticalLocked === true;
  let val = inst.volonteControlD6;
  if (val !== "" && val != null) {
    const n = Number(val);
    if (Number.isFinite(n) && n >= 1 && n <= 6) val = String(n);
    else val = "";
  } else val = "";
  return `<td class="tracker-volonte"><input type="number" class="tracker-sb-volonte-d6 input-narrow" data-iid="${inst.id}" min="1" max="6" step="1" placeholder="D6" value="${val ? escapeHtml(val) : ""}" title="Volonté inébranlable : +D6 au contrôle pour l’unité ciblée (ce tour)" ${dis ? "disabled" : ""} /></td>`;
}

/**
 * Tableau de suivi : PV, en mêlée, a chargé ce tour.
 * Les PV restent éditables pendant le tour adverse ; le reste est réservé au tour ami.
 */
function buildPhaseTrackerHtml(ph, b) {
  const myTurn = isPlayerTurn(b);
  let phaseNote = "";

  let instanceList = state.instances.slice();
  if (ph.id === "combat" && !combatTrackerShowAll) {
    instanceList = instanceList.filter((inst) => {
      ensureInstanceTracking(inst);
      return inst.inMelee;
    });
  }

  let combatFilterBar = "";
  if (ph.id === "combat") {
    combatFilterBar = `<div class="combat-filter-bar">
      <label class="tracker-label"><input type="checkbox" class="combat-show-all" ${combatTrackerShowAll ? "checked" : ""} /> Toute l’armée (si oubli « En mêlée »)</label>
    </div>`;
  }

  const showBonusCol = armyShowsTacticalBonusColumn();
  const showIjWaaaghCol = ironjawzWaaaghAuraColumnActive(b);
  const showIjCharge8Col = ironjawzCharge8ColumnActive(b, ph);
  const showVolonteCol = soulblightVolonteTrackerColumnActive();
  const showSbGardeCol = soulblightGardeRoyaleColumnActive();
  const showSbRoiCritCol = soulblightRoiCritColumnActive();
  const showSbSaintCol = soulblightSaintMassacreColumnActive();
  const showSylWoodCol = sylvanethWood9ColumnActive();
  const colSpan =
    6 +
    (showBonusCol ? 1 : 0) +
    (showIjWaaaghCol ? 1 : 0) +
    (showIjCharge8Col ? 1 : 0) +
    (showVolonteCol ? 1 : 0) +
    (showSbGardeCol ? 1 : 0) +
    (showSbRoiCritCol ? 1 : 0) +
    (showSbSaintCol ? 1 : 0) +
    (showSylWoodCol ? 1 : 0);

  let rows = "";
  for (const inst of instanceList) {
    ensureInstanceTracking(inst);
    const u = getUnitById(inst.catalogId);
    const name = u?.name || inst.catalogId;
    const wc = inst.woundsCurrent;
    const pvVal =
      wc === "" || wc === null || wc === undefined ? "" : String(wc);
    const maxHint = formatPvMaxHint(inst, u);
    const pvDis = inst.destroyed === true;
    const tactDis = pvDis || !myTurn;
    const rowClass = pvDis ? "tracker-row--destroyed" : "";
    const destTitle = inst.isInvocation
      ? isKhorneFactionContext()
        ? "Invocation retirée : +1 dîme ; ne compte pas pour Trempés de sang"
        : "Invocation retirée du suivi."
      : "Unité détruite : plus de bonus de profil ni rappels de phase pour le reste de la partie";

    rows += `<tr class="${rowClass}">`;
    rows += `<td class="tracker-name"><button type="button" class="tracker-open" data-iid="${inst.id}" ${pvDis ? ' disabled aria-disabled="true"' : ""}>${escapeHtml(name)}</button></td>`;
    rows += `<td class="tracker-fig muted" title="Figurines restantes / totales (selon PV saisis)">${escapeHtml(formatTrackerFiguresCell(inst, u))}</td>`;
    rows += `<td><input type="number" class="tracker-pv input-narrow" data-iid="${inst.id}" min="0" step="1" value="${escapeHtml(pvVal)}" placeholder="${escapeHtml(maxHint)}" title="PV restants (max ${escapeHtml(maxHint)})" ${pvDis ? "disabled" : ""} /></td>`;
    rows += `<td class="tracker-check"><label class="tracker-label"><input type="checkbox" class="tracker-melee" data-iid="${inst.id}" ${inst.inMelee ? "checked" : ""} ${tactDis ? "disabled" : ""} /> En mêlée</label></td>`;
    rows += `<td class="tracker-check"><label class="tracker-label"><input type="checkbox" class="tracker-charged" data-iid="${inst.id}" ${inst.chargedThisTurn ? "checked" : ""} ${tactDis ? "disabled" : ""} /> A chargé ce tour</label></td>`;
    rows += `<td class="tracker-check tracker-destroyed-cell"><label class="tracker-label"><input type="checkbox" class="tracker-destroyed" data-iid="${inst.id}" ${inst.destroyed ? "checked" : ""} title="${escapeHtml(destTitle)}" ${tactDis ? "disabled" : ""} /> Détruite</label></td>`;
    if (showBonusCol) rows += buildTrackerBonusCell(inst, u, !myTurn);
    if (showIjWaaaghCol) {
      rows += `<td class="tracker-check"><label class="tracker-label"><input type="checkbox" class="tracker-ij-waaagh-aura" data-iid="${inst.id}" ${inst.ironjawzInWaaaghAura ? "checked" : ""} ${tactDis ? "disabled" : ""} title="Entièrement à 18&quot; du héros Waaagh : +1 jet de charge et +1 A mêlée" /> ≤18&quot; Waaagh</label></td>`;
    }
    if (showIjCharge8Col) {
      const bagarreNonHero = u && !unitKeyword(u, "HÉROS");
      rows += bagarreNonHero
        ? `<td class="tracker-check"><label class="tracker-label"><input type="checkbox" class="tracker-ij-charge-8" data-iid="${inst.id}" ${inst.ironjawzChargeRoll8Plus ? "checked" : ""} ${tactDis ? "disabled" : ""} title="Bagarre : charge non modifiée 8+ (non héros) : +1 A mêlée ce tour" /> 8+ charge</label></td>`
        : `<td class="muted" title="Réservé aux unités non héros">—</td>`;
    }
    if (showVolonteCol) rows += buildSoulblightVolonteControlCell(inst, !myTurn);
    if (showSbGardeCol) rows += buildSoulblightGardeRoyaleCell(inst, u, !myTurn);
    if (showSbRoiCritCol) rows += buildSoulblightRoiCritCell(inst, u, !myTurn);
    if (showSbSaintCol) rows += buildSoulblightSaintMassacreCell(inst, u, !myTurn);
    if (showSylWoodCol) {
      const dis = inst.destroyed === true || tactDis;
      rows += `<td class="tracker-check"><label class="tracker-label"><input type="checkbox" class="tracker-syl-wood-9" data-iid="${inst.id}" ${inst.sylWithin9OfWood ? "checked" : ""} ${dis ? "disabled" : ""} title="Sylvaneth : entièrement / à moins de 9p d&apos;un bois luxuriant ou Bois sauvage (selon règles &amp; warscroll)" /> 9p bois</label></td>`;
    }
    rows += `</tr>`;
  }

  const emptyCombatMsg =
    ph.id === "combat" &&
    !combatTrackerShowAll &&
    !instanceList.length &&
    state.instances.length > 0
      ? `<tr><td colspan="${colSpan}" class="muted">Aucune unité avec « En mêlée » coché — coche la case ci-dessus pour afficher toute l’armée et mettre à jour.</td></tr>`
      : null;

  const theadBonus = showBonusCol
    ? `<th class="tracker-bonus-col">Bonus tactiques</th>`
    : "";
  const theadIjWaaagh = showIjWaaaghCol
    ? `<th class="tracker-bonus-col" title="À 18 pouces du héros Waaagh">Waaagh 18p</th>`
    : "";
  const theadIjCharge8 = showIjCharge8Col
    ? `<th class="tracker-bonus-col">8+ charge</th>`
    : "";
  const theadVolonte = showVolonteCol
    ? `<th class="tracker-bonus-col" title="Trait Volonté inébranlable">Ctrl +D6</th>`
    : "";
  const theadSbGarde = showSbGardeCol
    ? `<th class="tracker-bonus-col" title="Gardes royaux">Garde r.</th>`
    : "";
  const theadSbRoiCrit = showSbRoiCritCol
    ? `<th class="tracker-bonus-col" title="Roi des os ambulants">Crit 2+</th>`
    : "";
  const theadSbSaint = showSbSaintCol
    ? `<th class="tracker-bonus-col" title="Saint du massacre">St. massacre</th>`
    : "";
  const theadSylWood = showSylWoodCol
    ? `<th class="tracker-bonus-col" title="Sylvaneth — bois (9p)">9p bois</th>`
    : "";

  let consangRageEncart = "";
  if (ph.id === "combat" && isPlayerTurn(b) && armyHasBloodsecrator()) {
    const active = b.consangRageActive === true;
    const used = b.consangRageUsed === true;
    if (!used) {
      consangRageEncart = `<div class="phase-tracker-consangrage panel-inner">
        <p class="muted small"><strong>Rage de Khorne</strong> (Consangcrateur) — 1× bataille : +1 A mêlée (Sang-liés), <strong>cette phase</strong> (livre : fin du tour).</p>
        <label class="tracker-label"><input type="checkbox" class="tracker-consang-rage" ${active ? "checked" : ""} /> Activer cette mêlée</label>
      </div>`;
    } else if (active) {
      consangRageEncart = `<div class="phase-tracker-consangrage panel-inner">
        <p class="muted small"><strong>Rage de Khorne</strong> active (+1 A mêlée Sang-liés) — retire fin de mêlée.</p>
      </div>`;
    } else {
      consangRageEncart = `<div class="phase-tracker-consangrage panel-inner">
        <p class="muted small"><strong>Rage de Khorne</strong> — déjà utilisée.</p>
      </div>`;
    }
  }

  return `<div class="phase-tracker">
    ${phaseNote ? `<p class="muted small tracker-phase-hint">${phaseNote}</p>` : ""}
    ${combatFilterBar}
    ${consangRageEncart}
    <div class="tracker-table-wrap">
      <table class="tracker-table">
        <thead><tr>
          <th>Unité</th>
          <th class="tracker-col-fig">Fig.</th>
          <th>PV restants</th>
          <th>Mêlée</th>
          <th>Charge (tour)</th>
          <th class="tracker-col-destroyed">Détruite</th>
          ${theadBonus}
          ${theadIjWaaagh}
          ${theadIjCharge8}
          ${theadVolonte}
          ${theadSbGarde}
          ${theadSbRoiCrit}
          ${theadSbSaint}
          ${theadSylWood}
        </tr></thead>
        <tbody>${rows || emptyCombatMsg || `<tr><td colspan="${colSpan}" class="muted">Aucune unité dans la liste.</td></tr>`}</tbody>
      </table>
    </div>
  </div>`;
}

/** Suivi PV / mêlée / charge : plié par défaut. */
function wrapPhaseTrackerCollapsible(trackerHtml) {
  return `<details class="phase-tracker-details">
    <summary class="phase-tracker-summary">Suivi unités (PV, mêlée, charge)</summary>
    <div class="phase-tracker-details-body">${trackerHtml}</div>
  </details>`;
}

function renderSetup() {
  if (el.viewSetup) el.viewSetup.hidden = false;
  if (el.viewBattle) el.viewBattle.hidden = true;
  closeDrawers();
  /* Jamais masquer le panneau salon (hors #setup-post-faction) — évite tout état résiduel. */
  const salonPanel = document.getElementById("setup-multiplayer");
  if (salonPanel) {
    salonPanel.hidden = false;
    salonPanel.removeAttribute("hidden");
  }
  /* Aligner l’état sur une radio déjà cochée (ex. clic avant chargement du module) avant tout calcul d’UI. */
  if (el.setupFactionList) {
    const preChecked = el.setupFactionList.querySelector(
      'input[name="faction"]:checked',
    );
    if (preChecked && !String(state.setup?.factionId ?? "").trim()) {
      const v = String(preChecked.value ?? "").trim();
      const entry = FACTIONS.find((f) => f.id === v);
      if (entry?.implemented) {
        const prev = state.setup.factionId;
        state.setup.factionId = v;
        if (prev !== v) {
          state.instances = [];
          state.setup.traitHeroInstanceId = "";
          state.setup.artifactHeroInstanceId = "";
          Object.assign(state.setup, getDefaultArmySetupForFaction(v));
        }
        persist();
      }
    }
  }
  const factionId = String(state.setup?.factionId ?? "").trim();
  const factionChosen =
    factionId !== "" && FACTIONS.some((f) => f.id === factionId);
  const khorne = isKhorneFactionId(factionId);
  const playable = isPlayableFactionId(factionId);
  const fmeta = FACTIONS.find((f) => f.id === factionId);
  if (el.viewSetup) {
    el.viewSetup.classList.toggle(
      "setup-faction-sylvaneth",
      playable && isSylvanethFactionId(factionId),
    );
  }

  function syncSetupPostFactionVisibility() {
    const pf = document.getElementById("setup-post-faction");
    if (!pf) return;
    const fid = String(state.setup?.factionId ?? "").trim();
    const chosen =
      fid !== "" && FACTIONS.some((f) => f.id === fid && f.implemented);
    if (chosen) {
      pf.hidden = false;
      pf.removeAttribute("hidden");
    } else {
      pf.hidden = true;
    }
  }

  syncSetupPostFactionVisibility();

  try {

  /* Factions en premier + remplacement atomique : évite une liste vide si une erreur survient plus bas. */
  if (el.setupFactionList) {
    const frag = document.createDocumentFragment();
    for (const f of FACTIONS) {
      const lab = document.createElement("label");
      lab.className = "radio-line";
      const r = document.createElement("input");
      r.type = "radio";
      r.name = "faction";
      r.value = f.id;
      r.checked = factionId === f.id;
      r.disabled = !f.implemented;
      lab.appendChild(r);
      lab.appendChild(
        document.createTextNode(
          ` ${f.name}${f.implemented ? "" : " (bientôt)"}`,
        ),
      );
      frag.appendChild(lab);
    }
    el.setupFactionList.replaceChildren(frag);
  }

  if (el.armyName) el.armyName.value = state.setup.armyName || "";

  if (el.setupMainTitle) {
    if (!factionChosen) {
      el.setupMainTitle.textContent = "Warhammer — préparation";
    } else if (fmeta) {
      el.setupMainTitle.textContent = `Warhammer — ${fmeta.name}`;
    } else {
      el.setupMainTitle.textContent = "Warhammer — préparation";
    }
  }
  if (el.setupTagline) {
    if (!factionChosen) {
      el.setupTagline.textContent =
        "Salon multijoueur (optionnel) en haut, puis choisis une faction pour la liste d’armée.";
    } else if (playable) {
      el.setupTagline.textContent =
        "Compose ta liste, puis lance la partie.";
    } else {
      el.setupTagline.textContent =
        "Catalogue et lancement de partie pour cette faction : à venir.";
    }
  }
  if (el.setupFactionDetail) {
    if (!factionChosen) {
      el.setupFactionDetail.textContent =
        "Choisis une faction ci-dessous : composition, listes enregistrées et résumés de règles ne s’affichent qu’après sélection (contenu adapté à chaque faction).";
    } else {
      el.setupFactionDetail.textContent = fmeta?.description || "";
    }
  }

  if (el.setupTrempesHint) {
    el.setupTrempesHint.hidden = !factionChosen || !khorne;
  }
  const whoBox = document.getElementById("setup-who-starts");
  if (whoBox) {
    const who =
      state.setup.whoStartsFirst === "opponent" ? "opponent" : "player";
    for (const inp of whoBox.querySelectorAll('input[name="who-starts"]')) {
      inp.checked = inp.value === who;
    }
    if (!whoBox.dataset.listenerBound) {
      whoBox.dataset.listenerBound = "1";
      whoBox.addEventListener("change", (e) => {
        const t = e.target;
        if (t?.name !== "who-starts") return;
        state.setup.whoStartsFirst =
          t.value === "opponent" ? "opponent" : "player";
        persist();
      });
    }
  }

  if (el.setupPlayerName) {
    el.setupPlayerName.value = state.setup.playerName || "";
    if (!el.setupPlayerName.dataset.listenerBound) {
      el.setupPlayerName.dataset.listenerBound = "1";
      el.setupPlayerName.addEventListener("input", () => {
        state.setup.playerName = el.setupPlayerName.value.trim();
        persist();
      });
    }
  }
  if (el.setupRoomCode) {
    el.setupRoomCode.value = state.setup.roomCode || "";
    if (!el.setupRoomCode.dataset.listenerBound) {
      el.setupRoomCode.dataset.listenerBound = "1";
      el.setupRoomCode.addEventListener("input", () => {
        state.setup.roomCode = el.setupRoomCode.value.trim();
        persist();
      });
    }
  }
  const roleBox = document.getElementById("setup-room-role");
  if (roleBox) {
    const rr =
      state.setup.roomRole === "host" || state.setup.roomRole === "guest"
        ? state.setup.roomRole
        : "solo";
    for (const inp of roleBox.querySelectorAll('input[name="room-role"]')) {
      inp.checked = inp.value === rr;
    }
    if (!roleBox.dataset.listenerBound) {
      roleBox.dataset.listenerBound = "1";
      roleBox.addEventListener("change", (e) => {
        const t = e.target;
        if (t?.name !== "room-role") return;
        state.setup.roomRole =
          t.value === "host" || t.value === "guest" ? t.value : "solo";
        if (state.setup.roomRole === "solo") {
          partyKit.disconnectPartyKit();
          clearSalonPeers();
          setPartyKitStatus("Mode local — pas de salon.");
        }
        persist();
        updatePartyKitConnectButton();
        renderSalonRoster();
      });
    }
  }
  const partyHostIn = document.getElementById("setup-partykit-host");
  if (partyHostIn) {
    partyHostIn.value = state.setup.partyHost || "";
    if (!partyHostIn.dataset.listenerBound) {
      partyHostIn.dataset.listenerBound = "1";
      partyHostIn.addEventListener("input", () => {
        state.setup.partyHost = partyKit.normalizePartyHost(partyHostIn.value);
        persist();
      });
    }
  }
  const partyConnectBtn = document.getElementById("btn-partykit-connect");
  if (partyConnectBtn && !partyConnectBtn.dataset.listenerBound) {
    partyConnectBtn.dataset.listenerBound = "1";
    partyConnectBtn.addEventListener("click", async () => {
      if (partyKit.isPartyConnected()) {
        partyKit.disconnectPartyKit();
        clearSalonPeers();
        setPartyKitStatus("Déconnecté.");
        updatePartyKitConnectButton();
        renderSalonRoster();
        return;
      }
      if (state.setup.roomRole === "solo") {
        setPartyKitStatus("Choisis « héberger » ou « rejoindre » pour le salon.");
        return;
      }
      if (!String(state.setup.roomCode || "").trim()) {
        setPartyKitStatus("Indique un code salon.");
        return;
      }
      if (!String(state.setup.partyHost || "").trim()) {
        setPartyKitStatus("Indique l’hôte PartyKit (après déploiement).");
        return;
      }
      try {
        await connectPartyKitConfigured();
      } catch (e) {
        console.warn("[PartyKit]", e);
        setPartyKitStatus(
          "Échec de la connexion — hôte, code salon ou réseau.",
        );
      }
      updatePartyKitConnectButton();
    });
  }
  updatePartyKitConnectButton();
  renderSalonRoster();
  const teamSel = document.getElementById("setup-team-id");
  if (teamSel) {
    if (!teamSel.dataset.optionsFilled) {
      teamSel.dataset.optionsFilled = "1";
      teamSel.innerHTML = "";
      for (let i = 1; i <= MAX_TEAMS; i++) {
        const o = document.createElement("option");
        o.value = String(i);
        o.textContent = `Équipe ${i}`;
        teamSel.appendChild(o);
      }
    }
    teamSel.value = String(normalizeTeamId(state.setup.teamId));
    if (!teamSel.dataset.listenerBound) {
      teamSel.dataset.listenerBound = "1";
      teamSel.addEventListener("change", () => {
        state.setup.teamId = normalizeTeamId(teamSel.value);
        persist();
      });
    }
  }

  document.querySelectorAll(".setup-army-powers").forEach((node) => {
    node.hidden = !playable;
  });
  const setupFormationsPanel = document.getElementById("setup-khorne-powers");
  if (setupFormationsPanel) {
    setupFormationsPanel.hidden =
      !playable || isSylvanethFactionId(factionId);
  }

  const setupHeadingTrait = document.getElementById("setup-heading-trait");
  const setupHeadingArtifact = document.getElementById("setup-heading-artifact");
  const setupRecapTitle = document.getElementById("setup-army-recap-title");
  const setupRecapHint = document.getElementById("setup-army-recap-hint");
  if (setupHeadingTrait) {
    setupHeadingTrait.textContent =
      isKhorneFactionId(factionId)
        ? "Trait héroïque (Massacreur de peuples)"
        : isPeauxVertesFactionId(factionId)
          ? "Trait héroïque (Mâchefers)"
          : isSoulblightFactionId(factionId)
            ? "Trait héroïque (Seigneurs Ruinemânes)"
            : isSeraphonFactionId(factionId)
              ? "Discipline céleste (trait héroïque)"
              : isSylvanethFactionId(factionId)
                ? "Trait de commandement (Sylvaneth)"
                : "Trait héroïque";
  }
  if (setupHeadingArtifact) {
    setupHeadingArtifact.textContent =
      isKhorneFactionId(factionId)
        ? "Artefact (Meurtriers)"
        : isPeauxVertesFactionId(factionId)
          ? "Artefact de pouvoir"
          : isSoulblightFactionId(factionId)
            ? "Artefact d’armée"
            : isSeraphonFactionId(factionId)
              ? "Trésor des Anciens (artefact)"
              : isSylvanethFactionId(factionId)
                ? "Relique d’arôme (Sylvaneth)"
                : "Artefact";
  }
  const setupFormationTitle = document.getElementById("setup-formation-title");
  if (setupFormationTitle) {
    setupFormationTitle.textContent = isSylvanethFactionId(factionId)
      ? "Formation de bataille"
      : isSeraphonFactionId(factionId)
        ? "Hôte d’étoile (formation de bataille)"
        : "Formation de bataille";
  }
  const setupSylvanethBlock = document.getElementById("setup-sylvaneth-options");
  const setupSylvanethSeason = document.getElementById("setup-sylvaneth-season-list");
  const setupSylvanethGlade = document.getElementById("setup-sylvaneth-glad-list");
  if (setupSylvanethBlock) {
    setupSylvanethBlock.hidden = !isSylvanethFactionId(factionId);
  }
  if (isSylvanethFactionId(factionId) && setupSylvanethSeason) {
    if (!SYLVANETH_SEASONS.some((s) => s.id === state.setup.sylvanethSeasonId)) {
      state.setup.sylvanethSeasonId = SYLVANETH_SEASONS[0]?.id || "";
    }
    setupSylvanethSeason.innerHTML = "";
    for (const s of SYLVANETH_SEASONS) {
      const lab = document.createElement("label");
      lab.className = "radio-line";
      const r = document.createElement("input");
      r.type = "radio";
      r.name = "sylvaneth-season";
      r.value = s.id;
      r.checked = state.setup.sylvanethSeasonId === s.id;
      r.addEventListener("change", () => {
        state.setup.sylvanethSeasonId = s.id;
        persist();
        const recap = document.getElementById("setup-army-recap-body");
        if (recap) recap.innerHTML = buildSetupArmyRecapHtml();
      });
      lab.appendChild(r);
      const one = String(s.summary || "").replace(/\s+/g, " ");
      lab.appendChild(
        document.createTextNode(
          ` ${s.name} — ${one.slice(0, 100)}${one.length > 100 ? "…" : ""}`,
        ),
      );
      setupSylvanethSeason.appendChild(lab);
    }
  }
  if (isSylvanethFactionId(factionId) && setupSylvanethGlade) {
    if (!SYLVANETH_GLADES.some((g) => g.id === state.setup.sylvanethGladeId)) {
      state.setup.sylvanethGladeId = SYLVANETH_GLADES[0]?.id || "";
    }
    setupSylvanethGlade.innerHTML = "";
    for (const g of SYLVANETH_GLADES) {
      const lab = document.createElement("label");
      lab.className = "radio-line";
      const r = document.createElement("input");
      r.type = "radio";
      r.name = "sylvaneth-glad";
      r.value = g.id;
      r.checked = state.setup.sylvanethGladeId === g.id;
      r.addEventListener("change", () => {
        state.setup.sylvanethGladeId = g.id;
        persist();
        const recap = document.getElementById("setup-army-recap-body");
        if (recap) recap.innerHTML = buildSetupArmyRecapHtml();
      });
      lab.appendChild(r);
      const one = String(g.summary || "").replace(/\s+/g, " ");
      lab.appendChild(
        document.createTextNode(
          ` ${g.name} — ${one.slice(0, 100)}${one.length > 100 ? "…" : ""}`,
        ),
      );
      setupSylvanethGlade.appendChild(lab);
    }
  }
  const setupSeraphonBlock = document.getElementById("setup-seraphon-asterism");
  const setupSeraphonList = document.getElementById(
    "setup-seraphon-asterism-list",
  );
  const setupSeraphonPoursuivre = document.getElementById(
    "setup-seraphon-poursuivre",
  );
  if (setupSeraphonBlock) {
    setupSeraphonBlock.hidden = !isSeraphonFactionId(factionId);
  }
  if (isSeraphonFactionId(factionId) && setupSeraphonList) {
    if (
      !SERAPHON_ASTERISMS.some((a) => a.id === state.setup.seraphonAsterismId)
    ) {
      state.setup.seraphonAsterismId = SERAPHON_ASTERISMS[0]?.id || "";
    }
    setupSeraphonList.innerHTML = "";
    for (const a of SERAPHON_ASTERISMS) {
      const lab = document.createElement("label");
      lab.className = "radio-line";
      const r = document.createElement("input");
      r.type = "radio";
      r.name = "seraphon-asterism";
      r.value = a.id;
      r.checked = state.setup.seraphonAsterismId === a.id;
      r.addEventListener("change", () => {
        state.setup.seraphonAsterismId = a.id;
        persist();
        const recap = document.getElementById("setup-army-recap-body");
        if (recap) recap.innerHTML = buildSetupArmyRecapHtml();
      });
      lab.appendChild(r);
      lab.appendChild(
        document.createTextNode(
          (() => {
            const s = String(a.summary ?? "");
            const one = s.replace(/\s+/g, " ");
            return ` ${a.name} — ${one.slice(0, 88)}${s.length > 88 ? "…" : ""}`;
          })(),
        ),
      );
      setupSeraphonList.appendChild(lab);
    }
  }
  if (setupSeraphonPoursuivre) {
    setupSeraphonPoursuivre.innerHTML = isSeraphonFactionId(factionId)
      ? `<strong>Poursuivre le Grand Plan (3e manche, 1×/bataille)</strong> — ${escapeHtml(SERAPHON_POURSUIVRE_INTRO)}<br/>` +
        SERAPHON_ASTERISMS.map(
          (a) =>
            `<br/><strong>${escapeHtml(a.name)}</strong> : ${escapeHtml(a.pursueCondition || "")}`,
        ).join("")
      : "";
  }
  if (setupRecapTitle && fmeta) {
    setupRecapTitle.textContent = isSylvanethFactionId(factionId)
      ? `Résumé — choix, traits de bataille, sorts (${fmeta.name})`
      : `Résumé — formations, traits, artefacts (${fmeta.name})`;
  }
  if (setupRecapHint && fmeta) {
    setupRecapHint.innerHTML = `Synthèse des options d’armée pour <strong>${escapeHtml(fmeta.name)}</strong> (phases et conditions : voir règles et warscrolls).`;
  }

  if (el.setupUnitsHint) {
    if (playable) {
      el.setupUnitsHint.classList.remove("muted");
      el.setupUnitsHint.innerHTML =
        'Choisis une unité dans la liste puis clique « Ajouter », ou <strong>Tout ajouter</strong> pour une entrée par type du catalogue. Tu peux aussi prendre plusieurs fois la même unité.';
    } else {
      el.setupUnitsHint.classList.add("muted");
      el.setupUnitsHint.textContent =
        "Aucune unité n’est disponible pour cette faction dans cette version — choisis une faction marquée comme disponible.";
    }
  }

  const unitsForFaction = getUnitsForFaction(factionId);
  if (el.unitPicker) {
    el.unitPicker.innerHTML = "";
    for (const u of unitsForFaction) {
      if (u.invocationOnly) continue;
      const o = document.createElement("option");
      o.value = u.id;
      o.textContent = u.name;
      el.unitPicker.appendChild(o);
    }
    if (!el.unitPicker.options.length) {
      const o = document.createElement("option");
      o.value = "";
      o.textContent = "— Aucune unité au catalogue —";
      el.unitPicker.appendChild(o);
    }
    const canAddUnits =
      playable && unitsForFaction.some((u) => !u.invocationOnly);
    const btnAddUnit = document.getElementById("btn-add-unit");
    const btnAddAllUnits = document.getElementById("btn-add-all-units");
    if (btnAddUnit) btnAddUnit.disabled = !canAddUnits;
    if (btnAddAllUnits) btnAddAllUnits.disabled = !canAddUnits;
    el.unitPicker.disabled = !canAddUnits;
  }

  const setupsFormations = getFormationsForFaction(factionId);
  const setupsTraits = getHeroicTraitsForFaction(factionId);
  const setupsArtifacts = getArtifactsForFaction(factionId);

  if (!setupsFormations.some((f) => f.id === state.setup.formationId)) {
    state.setup.formationId = setupsFormations[0]?.id ?? "";
  }
  if (!setupsTraits.some((t) => t.id === state.setup.traitId)) {
    state.setup.traitId = setupsTraits[0]?.id ?? "";
  }
  if (!setupsArtifacts.some((a) => a.id === state.setup.artifactId)) {
    state.setup.artifactId = setupsArtifacts[0]?.id ?? "";
  }

  if (!el.formationList || !el.traitSelect || !el.artifactSelect) {
    console.error(
      "[Warhammer helper] Éléments DOM manquants (formations / traits / artefacts). Vérifie que index.html contient #setup-formations, #setup-trait, #setup-artifact.",
    );
  } else {
    el.formationList.innerHTML = "";
    for (const f of setupsFormations) {
      const lab = document.createElement("label");
      lab.className = "radio-line";
      const r = document.createElement("input");
      r.type = "radio";
      r.name = "formation";
      r.value = f.id;
      r.checked = state.setup.formationId === f.id;
      r.addEventListener("change", () => {
        state.setup.formationId = f.id;
        persist();
      });
      lab.appendChild(r);
      lab.appendChild(document.createTextNode(` ${f.name}`));
      el.formationList.appendChild(lab);
    }

    el.traitSelect.innerHTML = "";
    for (const t of setupsTraits) {
      const o = document.createElement("option");
      o.value = t.id;
      o.textContent = t.name;
      el.traitSelect.appendChild(o);
    }
    el.traitSelect.value = state.setup.traitId || setupsTraits[0]?.id;

    el.artifactSelect.innerHTML = "";
    for (const a of setupsArtifacts) {
      const o = document.createElement("option");
      o.value = a.id;
      o.textContent = a.name;
      el.artifactSelect.appendChild(o);
    }
    el.artifactSelect.value = state.setup.artifactId || setupsArtifacts[0]?.id;

    el.traitSelect.onchange = () => {
      state.setup.traitId = el.traitSelect.value;
      persist();
    };
    el.artifactSelect.onchange = () => {
      state.setup.artifactId = el.artifactSelect.value;
      persist();
    };
  }

  if (!el.instanceList) {
    console.error(
      "[Warhammer helper] #setup-instance-list introuvable dans le DOM.",
    );
  } else {
  el.instanceList.innerHTML = "";
  for (const inst of state.instances) {
    if (inst.isInvocation) continue;
    const row = document.createElement("div");
    row.className = "instance-row";
    const u = getUnitById(inst.catalogId);
    const name = u ? u.name : inst.catalogId;
    const nameEl = document.createElement("span");
    nameEl.className = "instance-name";
    nameEl.textContent = name;
    if (u) {
      ensureInstanceTracking(inst);
      nameEl.textContent += formatSidebarFiguresSuffix(inst, u);
    }
    row.appendChild(nameEl);

    if (
      u &&
      typeof u.woundsPerModel === "number" &&
      typeof u.defaultModelCount === "number" &&
      typeof u.reinforcedModelCount === "number" &&
      u.reinforcedModelCount > u.defaultModelCount
    ) {
      const lab = document.createElement("label");
      lab.className = "instance-reinforced";
      const cb = document.createElement("input");
      cb.type = "checkbox";
      const mc = inst.modelCount ?? u.defaultModelCount;
      cb.checked = mc >= u.reinforcedModelCount;
      cb.title =
        "Unité renforcée : " +
        u.reinforcedModelCount +
        " figurines au lieu de " +
        u.defaultModelCount;
      cb.addEventListener("change", () => {
        inst.modelCount = cb.checked
          ? u.reinforcedModelCount
          : u.defaultModelCount;
        const max = getWoundsMaxInst(inst, u);
        if (max != null) inst.woundsCurrent = max;
        persist();
        renderSetup();
      });
      lab.appendChild(cb);
      lab.appendChild(
        document.createTextNode(
          ` Unité renforcée (${u.reinforcedModelCount} fig.)`,
        ),
      );
      row.appendChild(lab);
    }

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "btn icon small";
    btn.textContent = "×";
    btn.title = "Retirer";
    btn.addEventListener("click", () => {
      state.instances = state.instances.filter((x) => x.id !== inst.id);
      if (state.setup.traitHeroInstanceId === inst.id)
        state.setup.traitHeroInstanceId = "";
      if (state.setup.artifactHeroInstanceId === inst.id)
        state.setup.artifactHeroInstanceId = "";
      persist();
      renderSetup();
    });
    row.appendChild(btn);
    el.instanceList.appendChild(row);
  }
  }

  const heroesForUpgrade = state.instances.filter(isHeroEligibleForTraitArtifact);
  const traitDef = getHeroicTraitsForFaction(factionId).find(
    (t) => t.id === state.setup.traitId,
  );
  const artDef = getArtifactsForFaction(factionId).find(
    (a) => a.id === state.setup.artifactId,
  );
  const heroesForTrait = heroesForUpgrade.filter((h) =>
    heroMatchesAllowlistCatalogIds(h, traitDef?.allowedHeroCatalogIds),
  );
  const heroesForArt = heroesForUpgrade.filter((h) =>
    heroMatchesAllowlistCatalogIds(h, artDef?.allowedHeroCatalogIds),
  );
  let heroUpgradeSelectionCleared = false;
  function fillHeroSelect(select, currentId, setupKey) {
    if (!select) return;
    select.innerHTML = '<option value="">— Choisir —</option>';
    const list =
      setupKey === "trait"
        ? heroesForTrait
        : setupKey === "artifact"
          ? heroesForArt
          : heroesForUpgrade;
    for (const h of list) {
      const u = getUnitById(h.catalogId);
      const o = document.createElement("option");
      o.value = h.id;
      o.textContent = u ? u.name : h.id;
      select.appendChild(o);
    }
    const valid = heroesForUpgrade.some((h) => h.id === currentId);
    select.value = valid ? currentId : "";
    if (!valid && currentId) {
      if (setupKey === "trait") state.setup.traitHeroInstanceId = "";
      if (setupKey === "artifact") state.setup.artifactHeroInstanceId = "";
      heroUpgradeSelectionCleared = true;
    }
  }
  fillHeroSelect(el.traitHero, state.setup.traitHeroInstanceId, "trait");
  fillHeroSelect(el.artifactHero, state.setup.artifactHeroInstanceId, "artifact");
  if (heroUpgradeSelectionCleared) persist();

  if (el.traitHero) {
    el.traitHero.onchange = () => {
      state.setup.traitHeroInstanceId = el.traitHero.value;
      persist();
    };
  }
  if (el.artifactHero) {
    el.artifactHero.onchange = () => {
      state.setup.artifactHeroInstanceId = el.artifactHero.value;
      persist();
    };
  }

  if (el.armyName) {
    el.armyName.oninput = () => {
      state.setup.armyName = el.armyName.value;
      persist();
    };
  }

  if (el.setupTotalGameUnits) {
    const tg = state.setup.totalGameUnits ?? 24;
    el.setupTotalGameUnits.value = String(tg);
    el.setupTotalGameUnits.oninput = () => {
      const v = parseInt(el.setupTotalGameUnits.value, 10);
      state.setup.totalGameUnits =
        Number.isFinite(v) && v >= 1 ? v : 24;
      if (!Number.isFinite(v) || v < 1)
        el.setupTotalGameUnits.value = String(state.setup.totalGameUnits);
      persist();
    };
  }

  const recapBody = document.getElementById("setup-army-recap-body");
  if (recapBody) {
    try {
      recapBody.innerHTML = playable ? buildSetupArmyRecapHtml() : "";
    } catch (recapErr) {
      console.error("[renderSetup] résumé d’armée", recapErr);
      recapBody.innerHTML =
        playable ?
          '<p class="muted small">Résumé d’armée : erreur d’affichage (détail en console F12).</p>'
        : "";
    }
  }

  refreshArmyPresetControls();
  } catch (err) {
    console.error("[renderSetup]", err);
  } finally {
    syncSetupPostFactionVisibility();
    updatePartyKitConnectButton();
    renderSalonRoster();
  }
}

function addUnitInstance(catalogId) {
  const uPre = getUnitById(catalogId);
  if (uPre?.invocationOnly) {
    alert(
      "Les invocations ne font pas partie de la liste d’armée : utilise une prière de convocation en phase des héros et coche « Récitation réussie ».",
    );
    return;
  }
  const inst = {
    id: uid(),
    catalogId: catalogId,
    buffs: [],
  };
  const u = getUnitById(catalogId);
  if (unitIsPriestProfile(u)) inst.ritualPoints = 0;
  if (typeof u?.woundsPerModel === "number" && u.defaultModelCount != null) {
    inst.modelCount = u.defaultModelCount;
  }
  ensureInstanceTracking(inst);
  state.instances.push(inst);
}

document.getElementById("btn-add-unit")?.addEventListener("click", () => {
  const id = el.unitPicker.value;
  if (!id) return;
  addUnitInstance(id);
  persist();
  renderSetup();
});

document.getElementById("btn-add-all-units")?.addEventListener("click", () => {
  const list = getUnitsForFaction(state.setup.factionId);
  if (!list.length) return;
  for (const u of list) {
    if (!u.invocationOnly) addUnitInstance(u.id);
  }
  persist();
  renderSetup();
});

function spawnInvocationFromPrayer(prayerId, priestInstanceId) {
  const unitId = CONVOCATION_PRAYER_TO_UNIT[prayerId];
  if (!unitId) return null;
  const inv = {
    id: uid(),
    catalogId: unitId,
    buffs: [],
    isInvocation: true,
    invocationPrayerId: prayerId,
    summonedByPriestId: priestInstanceId,
  };
  ensureInstanceTracking(inv);
  const uInv = getUnitById(unitId);
  const maxW = getWoundsMaxInst(inv, uInv);
  if (maxW != null) inv.woundsCurrent = maxW;
  state.instances.push(inv);
  return inv;
}

function initBattleFromSetup() {
  const fid = state.setup.factionId;
  if (!fid || !FACTIONS.some((f) => f.id === fid)) {
    alert("Choisis d’abord une faction pour lancer une partie.");
    return;
  }
  if (!isPlayableFactionId(state.setup.factionId)) {
    alert(
      "Cette faction n’a pas encore de catalogue jouable dans cette version. Choisis une faction implémentée.",
    );
    return;
  }
  state.instances = state.instances.filter((i) => !i.isInvocation);
  if (state.instances.length === 0) {
    alert("Ajoute au moins une unité à ta liste.");
    return;
  }
  for (const inst of state.instances) {
    if (!inst.buffs) inst.buffs = [];
    ensureInstanceTracking(inst);
    inst.inMelee = false;
    inst.chargedThisTurn = false;
    const u0 = getUnitById(inst.catalogId);
    const m0 = getWoundsMaxInst(inst, u0);
    if (m0 != null) inst.woundsCurrent = m0;
    if (u0?.id === "sb_chevaliers_tertres") {
      inst.chevalierTertresBaselineWounds = m0 != null ? m0 : "";
    }
    if (u0?.id === "sb_machine_mortis") {
      inst.soulblightMachineMortisEnergy = 1;
    }
  }
  const tg =
    state.setup.totalGameUnits != null && state.setup.totalGameUnits >= 1
      ? state.setup.totalGameUnits
      : Math.max(1, state.instances.length * 2);
  state.battle = {
    battleRound: 1,
    activeSide: "player",
    playerTurnNumber: 1,
    phaseIndex: 0,
    commandPoints: CP_MAX,
    bloodTithe: 0,
    titheUnlocked: defaultTitheUnlocked(),
    startingArmySize: state.instances.length,
    totalGameUnits: tg,
    deadUnitsCount: 0,
    consangRageActive: false,
    consangRageUsed: false,
    ironjawzWaaaghUsedThisBattle: false,
    ironjawzWaaaghTriggerInstanceId: "",
    ironjawzWaaaghAuraActiveThisPlayerTurn: false,
    soulblightLegionsSansFinUsedBattle: false,
    phaseHistory: [],
    /** Snapshots unités adverses (sync réseau) — voir multiplayer-sync.js */
    opponentUnits: [],
    remoteFactionEffectsByClient: {},
    remoteUnitEffectsByClient: {},
    myOutgoingUnitEffects: [],
    seraphon: { itzlPursue: false, coatlUsed: false },
    sylvaneth: { faineAgesUsed: false, troneVigneActive: false, chantArbresActive: false },
  };
  persist();
  showBattle();
  void maybeAutoConnectPartyKit();
}

function showBattle() {
  el.viewSetup.hidden = true;
  el.viewBattle.hidden = false;
  renderBattle();
  if (partyKit.isPartyConnected()) sendSalonReady(true);
}

function showSetup() {
  if (partyKit.isPartyConnected()) sendSalonReady(false);
  partyKit.disconnectPartyKit();
  clearSalonPeers();
  state.battle = null;
  state.instances = state.instances.filter((i) => !i.isInvocation);
  persist();
  renderSetup();
}

function currentPhase() {
  return PHASES[state.battle.phaseIndex];
}

function pushBattlePhaseSnapshot() {
  const b = state.battle;
  if (!b) return;
  if (!Array.isArray(b.phaseHistory)) b.phaseHistory = [];
  b.phaseHistory.push({
    phaseIndex: b.phaseIndex,
    activeSide: b.activeSide,
    battleRound: b.battleRound,
    playerTurnNumber: b.playerTurnNumber,
  });
  if (b.phaseHistory.length > 120) b.phaseHistory.shift();
}

function retreatPhase() {
  const b = state.battle;
  if (!b?.phaseHistory?.length) return;
  const snap = b.phaseHistory.pop();
  if (!snap) return;
  b.phaseIndex = snap.phaseIndex;
  b.activeSide = snap.activeSide;
  b.battleRound = snap.battleRound;
  b.playerTurnNumber = snap.playerTurnNumber;
  persist();
  renderBattle();
}

function advancePhase() {
  const b = state.battle;
  if (!b) return;
  if (currentPhase().id === "deployment") return;

  pushBattlePhaseSnapshot();

  const phaseBefore = currentPhase().id;
  const wasPlayer = isPlayerTurn(b);
  const roundBefore = b.battleRound;

  b.phaseIndex += 1;
  if (b.phaseIndex >= PHASES.length) {
    b.phaseIndex = 1;
    if (b.activeSide === "player") {
      b.activeSide = "opponent";
    } else {
      b.activeSide = "player";
      b.battleRound += 1;
      b.commandPoints = CP_MAX;
      b.playerTurnNumber += 1;
    }
  }
  if (phaseBefore === "combat") {
    b.consangRageActive = false;
  }
  if (phaseBefore === "end" && wasPlayer) {
    b.ironjawzWaaaghAuraActiveThisPlayerTurn = false;
    for (const inst of state.instances) {
      inst.chargedThisTurn = false;
    }
  }
  if (phaseBefore === "end" && isSoulblightFactionContext()) {
    for (const inst of state.instances) {
      const u = getUnitById(inst.catalogId);
      if (u?.id !== "sb_chevaliers_tertres") continue;
      ensureInstanceTracking(inst);
      const maxW = getWoundsMaxInst(inst, u);
      if (maxW == null) continue;
      const curRaw = inst.woundsCurrent;
      const cur =
        curRaw === "" || curRaw == null ? maxW : Number(curRaw);
      if (!Number.isFinite(cur)) continue;
      inst.chevalierTertresBaselineWounds = cur;
    }
  }
  const now = currentPhase();
  if (now.id === "hero" && isPlayerTurn(b)) {
    for (const inst of state.instances) {
      inst.chargedThisTurn = false;
      ensureInstanceTracking(inst);
      inst.ironjawzChargeRoll8Plus = false;
      inst.ironjawzInWaaaghAura = false;
      inst.waaaghSpentAttackBonus = 0;
      inst.volonteControlD6 = "";
      inst.buffs = (inst.buffs || []).filter((bf) => {
        if (!bf.expiresNextHero) return true;
        return bf.castTurn >= b.playerTurnNumber;
      });
    }
    if (isSylvanethFactionContext() && b.sylvaneth) {
      b.sylvaneth.troneVigneActive = false;
      b.sylvaneth.chantArbresActive = false;
    }
  }
  persist();
  renderBattle();
}

function buildTitheHtml(b) {
  if (!isPlayerTurn(b)) {
    return `<p class="muted">Points de dîme : <strong>${b.bloodTithe ?? 0}</strong>. Le déblocage des aptitudes se fait à <strong>ton</strong> tour, en phase des héros.</p>`;
  }
  const unlocked = b.titheUnlocked || {};
  const pts = b.bloodTithe ?? 0;
  let h = `<div class="tithe-panel">`;
  h += `<p><strong>Points de dîme disponibles :</strong> ${pts}</p>`;
  h += `<p class="muted small">Au début de chaque tour, tu peux débloquer <strong>une</strong> aptitude dont tu remplis les prérequis (règle officielle : 1× par round de bataille au début d’un tour — ici simplifié en phase des héros).</p>`;
  h += `<ul class="tithe-list">`;
  for (const a of BLOOD_TITHE_ABILITIES) {
    const isUn = !!unlocked[a.id];
    const prereq = tithePrereqsMet(a, unlocked);
    const canBuy =
      !isUn &&
      prereq &&
      pts >= a.cost;
    h += `<li class="tithe-row ${isUn ? "tithe-unlocked" : ""}">`;
    h += `<span class="tithe-cost">${a.cost}</span>`;
    h += `<div class="tithe-body">`;
    h += `<strong>${a.name}</strong>`;
    if (isUn) {
      h += ` <span class="tag">Débloquée</span>`;
    } else if (canBuy && a.cost > 0) {
      h += ` <button type="button" class="btn small" data-tithe-unlock="${a.id}">Débloquer (−${a.cost} pts)</button>`;
    } else if (!isUn && !prereq) {
      h += ` <span class="muted">(Prérequis non remplis)</span>`;
    } else if (!isUn && pts < a.cost) {
      h += ` <span class="muted">(Pas assez de points)</span>`;
    }
    h += `<div class="muted small">${a.summary}</div>`;
    h += `</div></li>`;
  }
  h += `</ul></div>`;
  return h;
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Tiroir repliable pour alléger la colonne de phase lorsque plusieurs blocs s’empilent. */
function wrapPhaseDrawer(title, bodyHtml, opts = {}) {
  const inner = String(bodyHtml || "").trim();
  if (!inner) return "";
  const open = opts.open !== false;
  const extra = opts.className ? ` ${opts.className}` : "";
  return `<details class="phase-drawer${extra}"${
    open ? " open" : ""
  }><summary class="phase-drawer-summary">${escapeHtml(title)}</summary><div class="phase-drawer-body">${bodyHtml}</div></details>`;
}

function purgeExpiredOutgoingEffects(b) {
  if (!b || !Array.isArray(b.myOutgoingUnitEffects)) return;
  const br = b.battleRound ?? 1;
  const before = b.myOutgoingUnitEffects.length;
  b.myOutgoingUnitEffects = b.myOutgoingUnitEffects.filter((e) =>
    isOutgoingEffectActiveForBattleRound(e, br),
  );
  if (b.myOutgoingUnitEffects.length !== before) persist();
}

function phaseUnitsFootnote(phaseId) {
  const heroFoot =
    isKhorneFactionContext()
      ? "Phase des héros : ordres, sorts, prières, dîme de sang, et aptitudes « début de tour » sur les warscrolls."
    : isPeauxVertesFactionContext()
      ? "Phase des héros : ordres, sorts, prières (traits Puissants Destructeurs en n’importe quelle phase des héros), aptitudes « début de tour » sur les warscrolls."
    : isSoulblightFactionContext()
      ? "Phase des héros : ordres, sorts (Non-Vie, manifestations), Invocation cadavérique (tour), aptitudes « début de tour » sur les warscrolls."
      : "Phase des héros : ordres, sorts, prières, et aptitudes « début de tour » sur les warscrolls.";
  const lines = {
    deployment:
      "Déploiement : règles de mission pour placement, réserve et terrains.",
    hero: heroFoot,
    movement:
      "Toute unité peut courir ou se déplacer (aptitudes du livre de règles). Les aptitudes ci-dessus sont des rappels spécifiques.",
    shooting:
      "Les unités avec armes à distance peuvent tirer si éligibles (hors mêlée, sauf « Tir en mêlée »).",
    charge:
      "Toute unité hors mêlée peut tenter une charge (aptitude « Charge » du livre de règles).",
    combat:
      "Les unités au contact ou qui ont chargé combattent (aptitude « Combattre »).",
    end:
      "Applique les effets « fin de tour » et de phase de fin sur les warscrolls.",
  };
  return lines[phaseId] || "";
}

/**
 * Effets à cible ennemie synchronisés (sorts + Be’lakor + Antique malédiction).
 */
function buildLinkedEnemyOutgoingHtml(ph, b) {
  if (!isPlayerTurn(b)) return "";
  const opp = b.opponentUnits || [];
  const blocks = [];

  if (ph.id === "hero" && isSoulblightFactionContext()) {
    const spells = SOULBLIGHT_SPELLS.filter(
      (s) => s.phases?.includes("hero") && s.requiresEnemyTarget,
    );
    if (spells.length) {
      if (!opp.length) {
        blocks.push(
          `<section class="panel-inner phase-spell-cast"><h3 class="subh">Sorts (cible ennemie)</h3><p class="muted small">Connecte le salon ou utilise « Exemple local » dans le rail <strong>Ennemi</strong> pour afficher des unités à cibler.</p></section>`,
        );
      } else {
        let h = `<section class="panel-inner phase-spell-cast"><h3 class="subh">Sorts — cible ennemie</h3>`;
        h += `<p class="muted small">Après un jet réussi, enregistre la cible : l’adversaire voit le rappel sur sa fiche (synchronisé). Effet valable la <strong>manche en cours</strong> ; retirable sous « Effets enregistrés actifs » en cas d’erreur.</p>`;
        h += `<ul class="phase-spell-list">`;
        for (const sp of spells) {
          h += `<li class="phase-spell-list-item">`;
          h += `<strong>${escapeHtml(sp.name)}</strong> <span class="muted">(incant. ${escapeHtml(sp.cast)})</span>`;
          h += `<div class="muted small">${escapeHtml(sp.summary)}</div>`;
          h += `<div class="phase-spell-controls">`;
          h += `<label class="field phase-spell-field"><span>Unité ennemie</span>`;
          h += `<select class="outgoing-enemy-select" data-outgoing-effect-id="${escapeHtml(sp.id)}">`;
          h += `<option value="">— Choisir —</option>`;
          for (const row of opp) {
            if (row.destroyed) continue;
            const u = getUnitById(row.catalogId);
            const lab = escapeHtml(row.name || u?.name || row.catalogId);
            h += `<option value="${escapeHtml(row.id)}">${lab} (${row.woundsCurrent}/${row.woundsMax} PV)</option>`;
          }
          h += `</select></label>`;
          h += `<button type="button" class="btn small" data-outgoing-apply="${escapeHtml(sp.id)}">Appliquer sur la cible</button>`;
          h += `</div></li>`;
        }
        h += `</ul></section>`;
        blocks.push(h);
      }
    }
  }

  if (ph.id === "hero" && isSeraphonFactionContext()) {
    const serSpells = SERAPHON_SPELLS.filter(
      (s) => s.phases?.includes("hero") && s.requiresEnemyTarget,
    );
    if (serSpells.length) {
      if (!opp.length) {
        blocks.push(
          `<section class="panel-inner phase-spell-cast"><h3 class="subh">Sorts Seraphon (cible ennemie)</h3><p class="muted small">Connecte le salon ou utilise « Exemple local » dans le rail <strong>Ennemi</strong> pour afficher des unités à cibler.</p></section>`,
        );
      } else {
        let h = `<section class="panel-inner phase-spell-cast"><h3 class="subh">Sorts Seraphon — cible ennemie</h3>`;
        h += `<p class="muted small">Après un jet réussi, enregistre la cible : l’adversaire voit le rappel sur sa fiche (synchronisé). Effet valable la <strong>manche en cours</strong> ; retirable sous « Effets enregistrés actifs » en cas d’erreur.</p>`;
        h += `<ul class="phase-spell-list">`;
        for (const sp of serSpells) {
          h += `<li class="phase-spell-list-item">`;
          h += `<strong>${escapeHtml(sp.name)}</strong> <span class="muted">(incant. ${escapeHtml(sp.cast)})</span>`;
          h += `<div class="muted small">${escapeHtml(sp.summary)}</div>`;
          h += `<div class="phase-spell-controls">`;
          h += `<label class="field phase-spell-field"><span>Unité ennemie</span>`;
          h += `<select class="outgoing-enemy-select" data-outgoing-effect-id="${escapeHtml(sp.id)}">`;
          h += `<option value="">— Choisir —</option>`;
          for (const row of opp) {
            if (row.destroyed) continue;
            const u = getUnitById(row.catalogId);
            const lab = escapeHtml(row.name || u?.name || row.catalogId);
            h += `<option value="${escapeHtml(row.id)}">${lab} (${row.woundsCurrent}/${row.woundsMax} PV)</option>`;
          }
          h += `</select></label>`;
          h += `<button type="button" class="btn small" data-outgoing-apply="${escapeHtml(sp.id)}">Appliquer sur la cible</button>`;
          h += `</div></li>`;
        }
        h += `</ul></section>`;
        blocks.push(h);
      }
    }
  }

  if (ph.id === "hero") {
    const hasBel = state.instances.some(
      (i) =>
        !i.destroyed && getUnitById(i.catalogId)?.id === "belakor",
    );
    if (hasBel) {
      if (!opp.length) {
        blocks.push(
          `<section class="panel-inner phase-spell-cast"><h3 class="subh">Be’lakor — Affaiblissement de l’ennemi</h3><p class="muted small">Ajoute des unités dans le rail « Ennemi » (salon ou exemple local) pour enregistrer une cible.</p></section>`,
        );
      } else {
        const ab = getUnitById("belakor")?.abilities?.find(
          (a) => a.name === "Affaiblissement de l’ennemi",
        );
        let h = `<section class="panel-inner phase-spell-cast"><h3 class="subh">Be’lakor — Affaiblissement de l’ennemi</h3>`;
        h += `<p class="muted small">${escapeHtml(ab?.summary || "")}</p>`;
        h += `<div class="phase-spell-controls">`;
        h += `<label class="field phase-spell-field"><span>Unité ennemie</span>`;
        h += `<select class="outgoing-enemy-select" data-outgoing-effect-id="belakor_affaiblissement">`;
        h += `<option value="">— Choisir —</option>`;
        for (const row of opp) {
          if (row.destroyed) continue;
          const u = getUnitById(row.catalogId);
          const lab = escapeHtml(row.name || u?.name || row.catalogId);
          h += `<option value="${escapeHtml(row.id)}">${lab} (${row.woundsCurrent}/${row.woundsMax} PV)</option>`;
        }
        h += `</select></label>`;
        h += `<button type="button" class="btn small" data-outgoing-apply="belakor_affaiblissement">Appliquer sur la cible</button>`;
        h += `</div></section>`;
        blocks.push(h);
      }
    }
  }

  if (ph.id === "combat" && isSoulblightFactionContext()) {
    for (const def of SOULBLIGHT_LINKED_ENEMY_EFFECTS) {
      if (!def.phases?.includes("combat")) continue;
      const rosterOk = def.rosterCatalogIds.some((cid) =>
        state.instances.some(
          (i) => !i.destroyed && getUnitById(i.catalogId)?.id === cid,
        ),
      );
      if (!rosterOk) continue;
      if (!opp.length) {
        blocks.push(
          `<section class="panel-inner phase-spell-cast"><h3 class="subh">${escapeHtml(def.name)}</h3><p class="muted small">Rail « Ennemi » vide — impossible d’enregistrer la cible maudite.</p></section>`,
        );
        continue;
      }
      let h = `<section class="panel-inner phase-spell-cast"><h3 class="subh">${escapeHtml(def.name)}</h3>`;
      h += `<p class="muted small">${escapeHtml(def.summary)}</p>`;
      h += `<div class="phase-spell-controls">`;
      h += `<label class="field phase-spell-field"><span>Unité ennemie</span>`;
      h += `<select class="outgoing-enemy-select" data-outgoing-effect-id="${escapeHtml(def.id)}">`;
      h += `<option value="">— Choisir —</option>`;
      for (const row of opp) {
        if (row.destroyed) continue;
        const u = getUnitById(row.catalogId);
        const lab = escapeHtml(row.name || u?.name || row.catalogId);
        h += `<option value="${escapeHtml(row.id)}">${lab} (${row.woundsCurrent}/${row.woundsMax} PV)</option>`;
      }
      h += `</select></label>`;
      h += `<button type="button" class="btn small" data-outgoing-apply="${escapeHtml(def.id)}">Appliquer sur la cible</button>`;
      h += `</div></section>`;
      blocks.push(h);
    }
  }

  return blocks.join("");
}

/** Liste des effets cible ennemie encore actifs (manche en cours) + retrait manuel. */
function buildOutgoingEffectsManagerHtml(b) {
  if (!b || !isPlayerTurn(b)) return "";
  const br = b.battleRound ?? 1;
  const list = (b.myOutgoingUnitEffects || []).filter((e) =>
    isOutgoingEffectActiveForBattleRound(e, br),
  );
  if (!list.length) return "";
  let h = `<div class="outgoing-effects-manager panel-inner">`;
  h += `<h4 class="subh">Effets enregistrés actifs</h4>`;
  h += `<p class="muted small">Chaque entrée vaut pour la <strong>manche ${br}</strong> en cours ; elle est retirée automatiquement au passage à la manche suivante. Utilise <strong>Retirer</strong> en cas d’erreur.</p>`;
  h += `<ul class="outgoing-effects-list">`;
  for (const e of list) {
    const row = b.opponentUnits?.find((r) => r.id === e.targetRemoteId);
    const u = row ? getUnitById(row.catalogId) : null;
    const targetName = escapeHtml(row?.name || u?.name || e.targetRemoteId || "…");
    const keyAttr = encodeURIComponent(e.key || "");
    h += `<li class="outgoing-effects-list-item"><span class="outgoing-effects-label">${escapeHtml(e.label || "Effet")}</span> <span class="muted">— cible : ${targetName}</span> `;
    h += `<button type="button" class="btn tiny secondary" data-outgoing-remove-key="${keyAttr}">Retirer</button></li>`;
  }
  h += `</ul></div>`;
  return h;
}

function buildPhaseArmyPowersHtml(ph, b) {
  if (!isPlayableFactionContext()) return "";
  const fid = state.setup.factionId;
  const parts = [];

  if (isPeauxVertesFactionContext()) {
    for (const bt of IRONJAWZ_BATTLE_TRAITS) {
      if (!bt.phases?.includes(ph.id)) continue;
      if (bt.id === "waaagh_machefer" && ph.id === "charge") continue;
      if (showPowerFullForPhase(bt, ph, b)) {
        parts.push(
          `<li><strong>Trait d’armée — ${escapeHtml(bt.name)}</strong> : ${escapeHtml(bt.summary)}</li>`,
        );
      } else {
        parts.push(
          `<li class="muted"><strong>Trait d’armée — ${escapeHtml(bt.name)}</strong> — ${escapeHtml(bt.summary)}</li>`,
        );
      }
    }
  }

  if (isSoulblightFactionContext()) {
    for (const bt of SOULBLIGHT_BATTLE_TRAITS) {
      if (!bt.phases?.includes(ph.id)) continue;
      if (showPowerFullForPhase(bt, ph, b)) {
        parts.push(
          `<li><strong>Trait d’armée — ${escapeHtml(bt.name)}</strong> : ${escapeHtml(bt.summary)}</li>`,
        );
      } else {
        parts.push(
          `<li class="muted"><strong>Trait d’armée — ${escapeHtml(bt.name)}</strong> — ${escapeHtml(bt.summary)}</li>`,
        );
      }
    }
    if (ph.id === "hero" && isPlayerTurn(b)) {
      for (const sp of SOULBLIGHT_SPELLS) {
        if (!sp.phases?.includes(ph.id)) continue;
        parts.push(
          `<li><strong>Domaine Non-Vie — ${escapeHtml(sp.name)}</strong> (incant. ${escapeHtml(sp.cast)}) : ${escapeHtml(sp.summary)}</li>`,
        );
      }
      for (const m of SOULBLIGHT_CONVOCATION_SPELLS) {
        parts.push(
          `<li><strong>Manifestation — ${escapeHtml(m.name)}</strong> (incant. ${escapeHtml(m.cast)}) : ${escapeHtml(m.summary)}</li>`,
        );
      }
    }
  }

  if (isSeraphonFactionContext()) {
    for (const bt of SERAPHON_BATTLE_TRAITS) {
      if (!bt.phases?.includes(ph.id)) continue;
      if (showPowerFullForPhase(bt, ph, b)) {
        parts.push(
          `<li><strong>Trait d’armée — ${escapeHtml(bt.name)}</strong> : ${escapeHtml(bt.summary)}</li>`,
        );
      } else {
        parts.push(
          `<li class="muted"><strong>Trait d’armée — ${escapeHtml(bt.name)}</strong> — ${escapeHtml(bt.summary)}</li>`,
        );
      }
    }
    if (ph.id === "hero" && isPlayerTurn(b)) {
      for (const sp of SERAPHON_SPELLS) {
        if (!sp.phases?.includes(ph.id)) continue;
        const lore = sp.lore
          ? ` <span class="muted">(${escapeHtml(sp.lore)})</span>`
          : "";
        parts.push(
          `<li><strong>Sort — ${escapeHtml(sp.name)}</strong>${lore} (incant. ${escapeHtml(sp.cast)}) : ${escapeHtml(sp.summary)}</li>`,
        );
      }
    }
  }

  if (isSylvanethFactionContext() && b) {
    const season = getSylvanethSeasonById(state.setup.sylvanethSeasonId);
    if (season && showPowerFullForPhase(season, ph, b)) {
      parts.push(
        `<li><strong>Saison</strong> — ${escapeHtml(season.name)} : ${escapeHtml(season.summary)}</li>`,
      );
    }
    const glade = getSylvanethGladeById(state.setup.sylvanethGladeId);
    if (glade && showPowerFullForPhase(glade, ph, b)) {
      parts.push(
        `<li><strong>Clairière</strong> — ${escapeHtml(glade.name)} : ${escapeHtml(glade.summary)}</li>`,
      );
    }
    for (const bf of SYLVANETH_FORMATIONS) {
      if (!bf.phases?.includes(ph.id)) continue;
      if (showPowerFullForPhase(bf, ph, b)) {
        parts.push(
          `<li><strong>Trait de bataille — ${escapeHtml(bf.name)}</strong> · <strong>${escapeHtml(bf.ability || "")}</strong> : ${escapeHtml(bf.summary)}</li>`,
        );
      } else {
        parts.push(
          `<li class="muted"><strong>Trait de bataille — ${escapeHtml(bf.name)}</strong> · ${escapeHtml(bf.summary)}</li>`,
        );
      }
    }
  }

  const form = getFormationById(state.setup.formationId);
  const traitsFaction = getHeroicTraitsForFaction(fid);
  const artsFaction = getArtifactsForFaction(fid);
  const trait = traitsFaction.find((t) => t.id === state.setup.traitId);
  const art = artsFaction.find((a) => a.id === state.setup.artifactId);

  if (
    !isSylvanethFactionId(fid) &&
    form &&
    form.phases?.includes(ph.id)
  ) {
    if (showPowerFullForPhase(form, ph, b)) {
      parts.push(
        `<li><strong>Formation de bataille — ${escapeHtml(form.name)}</strong> · <strong>${escapeHtml(form.ability)}</strong> : ${escapeHtml(form.summary)}</li>`,
      );
    } else {
      parts.push(
        `<li class="muted"><strong>Formation de bataille — ${escapeHtml(form.name)}</strong> · ${escapeHtml(form.summary)}</li>`,
      );
    }
  }

  if (trait && trait.phases?.includes(ph.id)) {
    const hero = state.instances.find(
      (i) => i.id === state.setup.traitHeroInstanceId,
    );
    const hn = hero
      ? getUnitById(hero.catalogId)?.name
      : "(aucun héros choisi)";
    if (showPowerFullForPhase(trait, ph, b)) {
      parts.push(
        `<li><strong>Trait : ${escapeHtml(trait.name)}</strong> (${escapeHtml(hn)}) — ${escapeHtml(trait.summary)}</li>`,
      );
    } else {
      const why = mutedPowerReason(trait, ph, b);
      parts.push(
        `<li class="muted"><strong>Trait : ${escapeHtml(trait.name)}</strong> — ${escapeHtml(trait.summary)}${why ? ` — ${escapeHtml(why)}` : ""}</li>`,
      );
    }
  }

  if (art && art.phases?.includes(ph.id)) {
    const hero = state.instances.find(
      (i) => i.id === state.setup.artifactHeroInstanceId,
    );
    const hn = hero
      ? getUnitById(hero.catalogId)?.name
      : "(aucun héros choisi)";
    if (showPowerFullForPhase(art, ph, b)) {
      parts.push(
        `<li><strong>Artefact : ${escapeHtml(art.name)}</strong> (${escapeHtml(hn)}) — ${escapeHtml(art.summary)}</li>`,
      );
    } else {
      const why = mutedPowerReason(art, ph, b);
      parts.push(
        `<li class="muted"><strong>Artefact : ${escapeHtml(art.name)}</strong> — ${escapeHtml(art.summary)}${why ? ` — ${escapeHtml(why)}` : ""}</li>`,
      );
    }
  }

  if (!parts.length) return "";
  const blockTitle =
    isPeauxVertesFactionContext() ||
    isSoulblightFactionContext() ||
    isSeraphonFactionContext() ||
    isSylvanethFactionContext()
      ? "Traits d’armée, formation, trait, artefact (cette phase)"
      : "Formation, trait, artefact (cette phase)";
  return `<h4 class="subh phase-sub">${escapeHtml(blockTitle)}</h4><ul class="phase-reasons phase-army-powers">${parts.join("")}</ul>`;
}

function buildMeleeProximityRecapHtml() {
  const rows =
    isKhorneFactionContext()
      ? MELEE_PROXIMITY_RECAP
      : isPeauxVertesFactionContext()
        ? MELEE_PROXIMITY_RECAP_IRONJAWZ
        : isSoulblightFactionContext()
          ? MELEE_PROXIMITY_RECAP_SOULBLIGHT
          : isSeraphonFactionContext()
            ? MELEE_PROXIMITY_RECAP_SERAPHON
            : isSylvanethFactionContext()
              ? MELEE_PROXIMITY_RECAP_SYLVANETH
              : null;
  if (!rows?.length) return "";
  let h = `<details class="melee-proximity-recap">`;
  h += `<summary class="melee-proximity-recap-summary">Bonus de proximité (mêlée) — récapitulatif</summary>`;
  h += `<div class="melee-proximity-recap-body">`;
  h += `<p class="muted small melee-proximity-recap-lead">Distances / contact / objectifs — rappels généraux ; détail par unité plus bas.</p>`;
  h += `<ul class="melee-proximity-recap-list">`;
  for (const row of rows) {
    h += `<li><strong>${escapeHtml(row.label)}</strong> — ${escapeHtml(row.detail)}</li>`;
  }
  h += `</ul></div></details>`;
  return h;
}

/** Cartes compactes : unités en mêlée, PV, sauvegarde, buffs, bonus tactiques (sans passer par l’onglet Unités). */
function buildCombatMeleeStripHtml(b, ph) {
  if (ph.id !== "combat" || !b) return "";
  const list = [];
  for (const inst of state.instances) {
    ensureInstanceTracking(inst);
    if (inst.destroyed || !inst.inMelee) continue;
    const u = getUnitById(inst.catalogId);
    if (!u) continue;
    list.push({ inst, u });
  }
  if (!list.length) {
    return `<section class="combat-melee-strip panel-inner" aria-label="Aperçu mêlée"><h3 class="subh combat-melee-strip-title">Mêlée — au contact</h3><p class="muted small melee-strip-empty">Aucune unité avec « En mêlée » — coche-la dans le suivi ci-dessous ou affiche toute l’armée.</p></section>`;
  }
  let cards = "";
  for (const { inst, u } of list) {
    const modsRaw = sumBuffMods(inst.buffs);
    const mods = modsRaw;
    const sit = getTacticalSituationMods(inst, u);
    const trempesForProfile = trempesProfileActiveForUnit(inst, u, b);
    const tm = getTrempesDeSangCombatMods(u, trempesForProfile);
    const buffLabels = (inst.buffs || [])
      .map((bf) => escapeHtml(String(bf.label || "").trim()))
      .filter(Boolean);
    const tact = [];
    if (sit.hit) tact.push("+1 toucher (objectif contesté)");
    if (sit.wound) tact.push("+1 blesser (12″ Despote)");
    if (trempesForProfile && (tm.rend > 0 || tm.damageBonus > 0)) {
      const bits = [];
      if (tm.rend > 0) bits.push(`+${tm.rend} perforant`);
      if (tm.damageBonus > 0) bits.push(`+${tm.damageBonus} dégâts`);
      tact.push(`Trempés : ${bits.join(", ")}`);
    }
    const name = escapeHtml(u.name || inst.catalogId);
    const pvLine = formatPvStatLine(inst, u);
    const svDisp = showSaveEff(u.stats.save, mods.save);
    cards += `<article class="melee-strip-card">
      <header class="melee-strip-card-head"><button type="button" class="tracker-open" data-iid="${inst.id}">${name}</button></header>
      <dl class="melee-strip-dl">
        <div><dt>PV</dt><dd>${escapeHtml(pvLine)}</dd></div>
        <div><dt>Sv</dt><dd>${escapeHtml(String(svDisp))}</dd></div>
      </dl>
      ${buffLabels.length ? `<p class="melee-strip-buffs"><strong>Buffs</strong> : ${buffLabels.join(", ")}</p>` : ""}
      ${tact.length ? `<p class="melee-strip-tact muted small">${tact.join(" · ")}</p>` : ""}
    </article>`;
  }
  return `<section class="combat-melee-strip panel-inner" aria-label="Aperçu mêlée"><h3 class="subh combat-melee-strip-title">Mêlée — au contact</h3><div class="melee-strip-grid">${cards}</div></section>`;
}

/** Rappels locaux (traits, artefacts, dîmes, unités) sans synchro adverse. */
function buildPhaseLocalRemindersHtml(ph, b) {
  let h = "";
  if (ph.id === "hero" && isPlayerTurn(b) && isKhorneFactionContext() && state.setup.traitId === "mepris_magie") {
    const hero = state.instances.find(
      (i) => i.id === state.setup.traitHeroInstanceId,
    );
    const hn = hero
      ? getUnitById(hero.catalogId)?.name || "Héros"
      : "Héros (choisis le porteur du trait)";
    h += `<div class="panel-inner battle-global-effect"><p>Rappel — <strong>Mépris pour la magie</strong> (${escapeHtml(hn)}) : −1 aux jets d’incantation des SORCIERS ennemis à 12″ ; −1 aux psalmodies des PRÊTRES ennemis à 12″.</p></div>`;
  }
  if (ph.id === "hero" && isPlayerTurn(b) && isKhorneFactionContext() && state.setup.artifactId === "collier_mepris") {
    const hero = state.instances.find(
      (i) => i.id === state.setup.artifactHeroInstanceId,
    );
    const hn = hero
      ? getUnitById(hero.catalogId)?.name || "Porteur"
      : "Porteur";
    const art = ARTIFACTS.find((a) => a.id === "collier_mepris");
    h += `<div class="panel-inner battle-global-effect"><p>Rappel — <strong>${escapeHtml(art?.name || "Collier de mépris")}</strong> (${escapeHtml(hn)}) : ${escapeHtml(art?.summary || "")}</p></div>`;
  }
  if (ph.id === "combat" && isPlayerTurn(b) && isKhorneFactionContext() && state.setup.artifactId === "argath") {
    const hero = state.instances.find(
      (i) => i.id === state.setup.artifactHeroInstanceId,
    );
    const hn = hero
      ? getUnitById(hero.catalogId)?.name || "Porteur"
      : "Porteur";
    const art = ARTIFACTS.find((a) => a.id === "argath");
    h += `<div class="panel-inner battle-global-effect"><p>Rappel — <strong>${escapeHtml(art?.name || "Ar’gath")}</strong> (${escapeHtml(hn)}) : ${escapeHtml(art?.summary || "")}</p></div>`;
  }
  if (
    ph.id === "hero" &&
    isPlayerTurn(b) &&
    isKhorneFactionContext() &&
    state.instances.some(
      (i) =>
        !i.destroyed && getUnitById(i.catalogId)?.id === "flesh_hounds",
    )
  ) {
    h += `<div class="panel-inner battle-global-effect"><p>Rappel — <strong>Molosses de Khorne</strong> — Chasseurs de mystiques : à 12″ d’un SORCIER, doubles 1-2 sur incantation = sort fourbe ; psalmodie 2 non modifiée = échec.</p></div>`;
  }
  if (
    ph.id === "hero" &&
    isPlayerTurn(b) &&
    isSoulblightFactionContext() &&
    state.setup.artifactId === "sb_pendule_terminus"
  ) {
    const art = SOULBLIGHT_ARTIFACTS.find((a) => a.id === "sb_pendule_terminus");
    if (art) {
      h += `<div class="panel-inner battle-global-effect"><p>Rappel — <strong>${escapeHtml(art.name)}</strong> : ${escapeHtml(art.summary)}</p></div>`;
    }
  }
  if (ph.id === "charge") {
    if (
      isKhorneFactionContext() &&
      b.titheUnlocked?.euphorie_combat &&
      !isPlayerTurn(b)
    ) {
      const ab = BLOOD_TITHE_ABILITIES.find((a) => a.id === "euphorie_combat");
      h += `<div class="panel-inner battle-global-effect"><p><strong>Euphorie du combat</strong> (passif) : ${escapeHtml(ab?.summary || "")} — rappel pendant la phase de charge adverse.</p></div>`;
    }
    if (isPlayerTurn(b) && remoteHasSyncedEffect(state, "euphorie_combat")) {
      h += `<div class="panel-inner battle-global-effect"><p>Rappel — adversaire avec <strong>Euphorie du combat</strong> : si tu charges des Lames de Khorne ce tour, les aptitudes d’arme de tes unités concernées n’ont pas d’effet (sauf Compagnon).</p></div>`;
    }
    if (isPlayerTurn(b) && isPeauxVertesFactionContext()) {
      const w = IRONJAWZ_BATTLE_TRAITS.find((t) => t.id === "waaagh_machefer");
      if (w) {
        h += `<div class="panel-inner battle-global-effect"><p>Rappel — <strong>${escapeHtml(w.name)}</strong> : ${escapeHtml(w.summary)}</p></div>`;
      }
    }
  }
  if (ph.id === "end" && isPlayerTurn(b)) {
    if (
      isKhorneFactionContext() &&
      state.instances.some(
        (i) => !i.destroyed && getUnitById(i.catalogId)?.id === "skull_cannon",
      )
    ) {
      const u = getUnitById("skull_cannon");
      const ab = u?.abilities?.find((a) => a.name === "Bombardement macabre");
      h += `<div class="panel-inner battle-global-effect"><p><strong>Canon à crânes — Bombardement macabre</strong> (comptage objectifs / fin de tour) : ${escapeHtml(ab?.summary || "")}</p></div>`;
    }
    if (
      isKhorneFactionContext() &&
      state.instances.some(
        (i) => !i.destroyed && getUnitById(i.catalogId)?.id === "khorgorath",
      )
    ) {
      const u = getUnitById("khorgorath");
      const ab = u?.abilities?.find((a) => a.name === "Repas d’os");
      h += `<div class="panel-inner battle-global-effect"><p><strong>Khorgorath — Repas d’os</strong> (fin de tour) : ${escapeHtml(ab?.summary || "")}</p></div>`;
    }
  }
  return h;
}

function buildPhaseUnitsPanelHtml(ph, b) {
  if (!isPlayerTurn(b)) {
    const oppTitle =
      ph.id === "hero"
        ? "Phase des héros adverse — rappels (dissipation / anti-magie)"
        : ph.id === "end"
          ? "Fin de tour adverse — rappels (y compris effets des deux camps)"
          : ph.id === "charge"
            ? "Phase de charge adverse — rappels"
            : "";
    const oppPhases = ["hero", "end", "charge"];
    if (oppPhases.includes(ph.id)) {
      const rowsOpp = getPhaseInstancesForArmy(ph.id, state.instances, {
        isPlayerTurn: false,
        factionId: state.setup.factionId,
      });
      if (rowsOpp.length && oppTitle) {
        let innerOpp = `<h3 class="subh">${escapeHtml(oppTitle)}</h3>`;
        innerOpp += `<ul class="phase-units-list">`;
        for (const row of rowsOpp) {
          const instRo = state.instances.find((i) => i.id === row.instanceId);
          const uRo = instRo ? getUnitById(instRo.catalogId) : null;
          if (instRo && uRo) ensureInstanceTracking(instRo);
          const figRo =
            instRo && uRo ? formatFigurinesHtmlSuffix(instRo, uRo) : "";
          innerOpp += `<li class="phase-unit-row"><span class="phase-unit-name">${escapeHtml(row.name)}${figRo}</span><ul class="phase-reasons">`;
          for (const r of row.reasons) {
            innerOpp += `<li><strong>${escapeHtml(r.title)}</strong> — ${escapeHtml(r.text)}</li>`;
          }
          innerOpp += `</ul></li>`;
        }
        innerOpp += `</ul>`;
        innerOpp += `<p class="muted small phase-units-footnote">${escapeHtml(phaseUnitsFootnote(ph.id))}</p>`;
        const mod =
          ph.id === "hero"
            ? "phase-units-panel--opponent-hero"
            : "phase-units-panel--opponent-extra";
        return `<div class="phase-units-panel ${mod}">${innerOpp}</div>`;
      }
    }
    return `<div class="phase-units-panel phase-units-panel--muted"><h3 class="subh">Unités de ton armée</h3><p class="muted small">Au tour adverse, ce récapitulatif est masqué — concentre-toi sur les actions de l’ennemi.</p></div>`;
  }
  let rows = getPhaseInstancesForArmy(ph.id, state.instances, {
    isPlayerTurn: true,
    factionId: state.setup.factionId,
  });
  if (ph.id === "combat" && !combatTrackerShowAll) {
    rows = rows.filter((row) => {
      const inst = state.instances.find((i) => i.id === row.instanceId);
      if (!inst) return false;
      ensureInstanceTracking(inst);
      return inst.inMelee;
    });
  }
  let inner = `<h3 class="subh">Tes unités concernées par cette phase</h3>`;
  if (ph.id === "combat" && !combatTrackerShowAll) {
    inner += `<p class="muted small phase-combat-filter-note">Filtré : unités « En mêlée » (comme le suivi).</p>`;
  }
  if (!state.instances.length) {
    inner += `<p class="muted">Ajoute des unités dans la préparation pour voir des rappels ici.</p>`;
  } else if (!rows.length) {
    if (ph.id === "combat" && !combatTrackerShowAll) {
      inner += `<p class="muted">Aucun rappel d’aptitude pour les unités filtrées (en mêlée), ou aucune cochée — utilise <strong>Afficher toutes les unités</strong> dans le suivi si besoin.</p>`;
    } else {
      inner += `<p class="muted">Aucune unité de ta liste n’a d’aptitude ou d’arme listée pour cette phase — voir les rappels ci-dessous.</p>`;
    }
  } else {
    inner += `<ul class="phase-units-list">`;
    for (const row of rows) {
      const instPr = state.instances.find((i) => i.id === row.instanceId);
      const uPr = instPr ? getUnitById(instPr.catalogId) : null;
      if (instPr && uPr) ensureInstanceTracking(instPr);
      const figPr =
        instPr && uPr ? formatFigurinesHtmlSuffix(instPr, uPr) : "";
      inner += `<li class="phase-unit-row"><span class="phase-unit-name">${escapeHtml(row.name)}${figPr}</span><ul class="phase-reasons">`;
      for (const r of row.reasons) {
        inner += `<li><strong>${escapeHtml(r.title)}</strong> — ${escapeHtml(r.text)}</li>`;
      }
      inner += `</ul></li>`;
    }
    inner += `</ul>`;
  }

  if (ph.id === "shooting" && isPlayerTurn(b)) {
    const pen = getShootingHitPenaltyVsKhorne(state);
    if (pen < 0) {
      inner += `<div class="panel-inner battle-global-effect"><p>Rappel : <strong>${-pen} au jet pour toucher</strong> pour tes attaques de tir contre les Lames de Khorne (dîme adverse <em>Un combat glorieux ou rien</em>).</p></div>`;
    }
  }
  inner += buildPhaseLocalRemindersHtml(ph, b);

  const titheNotes = isKhorneFactionContext()
    ? getBloodTitheReasonsForPhase(ph.id)
    : [];
  if (titheNotes.length) {
    inner += `<h4 class="subh phase-sub">Dîme de sang</h4><ul class="phase-reasons phase-tithe-list">`;
    for (const row of titheNotes) {
      inner += `<li><strong>${escapeHtml(row.title)}</strong> — ${escapeHtml(row.text)}</li>`;
    }
    inner += `</ul>`;
  }

  inner += buildPhaseArmyPowersHtml(ph, b);

  const foot = phaseUnitsFootnote(ph.id);
  if (foot)
    inner += `<p class="muted small phase-units-footnote">${escapeHtml(foot)}</p>`;
  return `<div class="phase-units-panel">${inner}</div>`;
}

function mutedPowerReason(item, ph, b) {
  if (!item?.phases?.includes(ph.id)) return "";
  if (ph.id === "hero" && item.bothHeroPhases) return "";
  if (item.playerTurnOnly && !isPlayerTurn(b))
    return "Ce pouvoir ne s’applique que pendant ton tour.";
  if (ph.id === "hero" && item.heroPhase === "mine" && !isPlayerTurn(b))
    return "À utiliser pendant ta phase des héros.";
  if (ph.id === "hero" && item.heroPhase === "opponent" && isPlayerTurn(b))
    return "Actif en phase des héros adverse (dissipation, etc.).";
  return "";
}

function syncDrawerRailAria() {
  if (el.btnDrawerUnits && el.drawerUnits) {
    el.btnDrawerUnits.setAttribute(
      "aria-expanded",
      el.drawerUnits.hidden ? "false" : "true",
    );
  }
  if (el.btnDrawerPc && el.drawerPc) {
    el.btnDrawerPc.setAttribute(
      "aria-expanded",
      el.drawerPc.hidden ? "false" : "true",
    );
  }
  if (el.btnDrawerTithe && el.drawerTithe) {
    el.btnDrawerTithe.setAttribute(
      "aria-expanded",
      el.drawerTithe.hidden ? "false" : "true",
    );
  }
  if (el.btnDrawerEnemy && el.drawerEnemy) {
    el.btnDrawerEnemy.setAttribute(
      "aria-expanded",
      el.drawerEnemy.hidden ? "false" : "true",
    );
  }
}

function openUnitsDrawer() {
  if (el.drawerUnits) el.drawerUnits.hidden = false;
  if (el.drawerPc) el.drawerPc.hidden = true;
  if (el.drawerTithe) el.drawerTithe.hidden = true;
  if (el.drawerEnemy) el.drawerEnemy.hidden = true;
  if (el.drawerBackdrop) el.drawerBackdrop.hidden = false;
  syncDrawerRailAria();
}

function openPcDrawer() {
  if (el.drawerPc) el.drawerPc.hidden = false;
  if (el.drawerUnits) el.drawerUnits.hidden = true;
  if (el.drawerTithe) el.drawerTithe.hidden = true;
  if (el.drawerEnemy) el.drawerEnemy.hidden = true;
  if (el.drawerBackdrop) el.drawerBackdrop.hidden = false;
  syncDrawerRailAria();
}

function openTitheDrawer() {
  if (!isKhorneFactionContext()) return;
  if (el.drawerTithe) el.drawerTithe.hidden = false;
  if (el.drawerUnits) el.drawerUnits.hidden = true;
  if (el.drawerPc) el.drawerPc.hidden = true;
  if (el.drawerEnemy) el.drawerEnemy.hidden = true;
  if (el.drawerBackdrop) el.drawerBackdrop.hidden = false;
  syncDrawerRailAria();
}

function openEnemyDrawer() {
  if (el.drawerEnemy) el.drawerEnemy.hidden = false;
  if (el.drawerUnits) el.drawerUnits.hidden = true;
  if (el.drawerPc) el.drawerPc.hidden = true;
  if (el.drawerTithe) el.drawerTithe.hidden = true;
  if (el.drawerBackdrop) el.drawerBackdrop.hidden = false;
  syncDrawerRailAria();
}

function closeDrawers() {
  if (el.drawerUnits) el.drawerUnits.hidden = true;
  if (el.drawerPc) el.drawerPc.hidden = true;
  if (el.drawerTithe) el.drawerTithe.hidden = true;
  if (el.drawerEnemy) el.drawerEnemy.hidden = true;
  if (el.drawerBackdrop) el.drawerBackdrop.hidden = true;
  syncDrawerRailAria();
}

function toggleUnitsDrawer() {
  if (!el.drawerUnits) return;
  if (!el.drawerUnits.hidden) closeDrawers();
  else openUnitsDrawer();
}

function toggleTitheDrawer() {
  if (!isKhorneFactionContext()) return;
  if (!el.drawerTithe) return;
  if (!el.drawerTithe.hidden) closeDrawers();
  else openTitheDrawer();
}

function togglePcDrawer() {
  if (!el.drawerPc) return;
  if (!el.drawerPc.hidden) closeDrawers();
  else openPcDrawer();
}

function toggleEnemyDrawer() {
  if (!el.drawerEnemy) return;
  if (!el.drawerEnemy.hidden) closeDrawers();
  else openEnemyDrawer();
}

/** Charge utile à envoyer au diffuseur (armée de ce client). */
function buildMyArmySnapshotForSync() {
  const out = [];
  for (const inst of state.instances || []) {
    if (inst.isInvocation) continue;
    const u = getUnitById(inst.catalogId);
    if (!u) continue;
    const max = getWoundsMaxInst(inst, u);
    const cur = getWoundsRemainingInst(inst, u);
    out.push({
      id: inst.id,
      catalogId: inst.catalogId,
      name: u.name,
      woundsMax: max ?? 0,
      woundsCurrent: cur ?? 0,
      destroyed: inst.destroyed === true,
      buffs: (inst.buffs || []).map((b) => ({ label: b.label })),
    });
  }
  return {
    teamId: normalizeTeamId(state.setup.teamId),
    factionId: state.setup.factionId || "",
    armyName: state.setup.armyName || "",
    playerName: state.setup.playerName || "",
    roomCode: state.setup.roomCode || "",
    units: out,
    factionEffects: buildFactionEffectsPayload(state),
    unitEffectsOnOthers: (
      state.battle?.myOutgoingUnitEffects || []
    ).filter((e) =>
      isOutgoingEffectActiveForBattleRound(e, state.battle?.battleRound ?? 1),
    ),
  };
}

/**
 * Tableau d’armes — unités adverses (rappel CT tir si dîme « Un combat glorieux ou rien » côté ami).
 * @param {{ hitModRanged?: number }} [opts]
 */
function buildReadonlyWeaponsTableHtml(u, opts = {}) {
  const hitModRanged = opts.hitModRanged ?? 0;
  const weapons = u?.weapons;
  if (!Array.isArray(weapons) || weapons.length === 0) return "";
  const hasRange = weapons.some((w) => w.range);
  let h = `<h4>Armes</h4><table class="wtable wtable--readonly"><thead><tr>`;
  h += `<th></th>`;
  if (hasRange) h += `<th>Portée</th>`;
  h += `<th>A</th><th>CT</th><th>CB</th><th>P</th><th>D</th></tr></thead><tbody>`;
  for (const w of weapons) {
    const hb = parseRoll(w.hit);
    const ranged = weaponIsRangedForPhase(w);
    const he =
      ranged && hb != null && hitModRanged
        ? applyRollBonus(hb, hitModRanged)
        : null;
    const ctDisp =
      he != null && hb != null && he !== hb
        ? `${escapeHtml(String(w.hit ?? "—"))} → ${escapeHtml(formatRoll(he))}`
        : escapeHtml(String(w.hit ?? "—"));
    h += `<tr><td>${escapeHtml(w.name)}</td>`;
    if (hasRange) h += `<td>${escapeHtml(String(w.range ?? "—"))}</td>`;
    h += `<td>${escapeHtml(String(w.attacks ?? "—"))}</td>`;
    h += `<td>${ctDisp}</td>`;
    h += `<td>${escapeHtml(String(w.wound ?? "—"))}</td>`;
    h += `<td>${escapeHtml(String(w.rend ?? "—"))}</td>`;
    h += `<td>${escapeHtml(String(w.damage ?? "—"))}`;
    if (w.notes)
      h += ` <span class="muted small">(${escapeHtml(w.notes)})</span>`;
    h += `</td></tr>`;
  }
  h += `</tbody></table>`;
  if (hitModRanged) {
    h += `<p class="muted small">Rappel : pour les tirs contre les Lames de Khorne : <strong>${hitModRanged > 0 ? "+" : ""}${hitModRanged} pour toucher</strong> (ta dîme « Un combat glorieux ou rien »).</p>`;
  }
  return h;
}

function renderEnemyBattleUI() {
  const b = state.battle;
  if (!el.enemySidebar || !b) return;
  if (!Array.isArray(b.opponentUnits)) b.opponentUnits = [];
  const units = b.opponentUnits;
  el.enemySidebar.innerHTML = "";
  if (el.enemyDrawerHint) {
    el.enemyDrawerHint.textContent = units.length
      ? "Clique une unité pour lire les aptitudes (PV mis à jour par le salon)."
      : "Aucune unité adverse pour l’instant. Quand le diffuseur sera connecté, les armées des autres équipes apparaîtront ici. Tu peux utiliser « Exemple local » pour tester l’affichage.";
  }
  for (const row of units) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className =
      "sidebar-unit enemy-unit-open" +
      (row.destroyed ? " sidebar-unit--destroyed" : "");
    btn.dataset.remoteId = row.id;
    const u = getUnitById(row.catalogId);
    const label = row.name || u?.name || row.catalogId;
    const pv = `${row.woundsCurrent}/${row.woundsMax} PV`;
    btn.textContent = `${label} — ${pv}`;
    btn.addEventListener("click", () => renderEnemyDetailPanel(row.id));
    el.enemySidebar.appendChild(btn);
  }
  if (el.enemyDetailPanel && !el.enemyDetailPanel.hidden) {
    const cur = el.enemyDetailPanel.dataset.remoteId;
    if (cur && !units.some((x) => x.id === cur)) {
      el.enemyDetailPanel.hidden = true;
    }
  }
}

function renderEnemyDetailPanel(remoteId) {
  const b = state.battle;
  if (!b?.opponentUnits || !el.enemyDetailTitle || !el.enemyDetailBody) return;
  const row = b.opponentUnits.find((x) => x.id === remoteId);
  if (!row) return;
  const u = getUnitById(row.catalogId);
  el.enemyDetailTitle.textContent = row.name || u?.name || row.catalogId;
  let h = `<div class="enemy-detail-stats panel-inner">`;
  h += `<p><strong>PV</strong> ${row.woundsCurrent}/${row.woundsMax} PV`;
  if (row.destroyed) h += ` — <strong>unité détruite</strong>`;
  h += `</p>`;
  if (u) {
    h += `<p class="muted small"><strong>M</strong> ${u.stats.move} · <strong>Sv</strong> ${u.stats.save} · <strong>PV</strong> ${u.stats.wounds ?? "—"} · <strong>Ctrl</strong> ${u.stats.control}</p>`;
    if (u.stats?.bravery) {
      h += `<p class="muted small"><strong>Courage</strong> ${u.stats.bravery}</p>`;
    }
    if (u.keywords?.length) {
      h += `<p class="muted small"><strong>Mots-clés :</strong> ${u.keywords.map((k) => escapeHtml(k)).join(", ")}</p>`;
    }
    const khornePassive =
      isKhorneFactionContext() && b?.titheUnlocked?.un_combat_glorieux;
    const hitModRanged = khornePassive ? -1 : 0;
    h += buildReadonlyWeaponsTableHtml(u, { hitModRanged });
    h += `<h4>Aptitudes</h4><ul class="abil-list">`;
    for (const a of u.abilities || []) {
      h += `<li><strong>${escapeHtml(a.name)}</strong> — ${escapeHtml(a.summary)}</li>`;
    }
    h += `</ul>`;
    if (u.stigmates?.length) {
      h += `<h4>Stigmates</h4><ul class="abil-list">`;
      for (const s of u.stigmates) {
        h += `<li><strong>${escapeHtml(s.name)}</strong> — ${escapeHtml(s.summary)}</li>`;
      }
      h += `</ul>`;
    }
  } else {
    h += `<p class="muted">Profil non trouvé dans le catalogue (id : ${escapeHtml(row.catalogId)}).</p>`;
  }
  const mergedBuffs = mergeOutgoingBuffsForEnemyRow(row, state);
  if (mergedBuffs?.length) {
    h += `<h4>Effets visibles</h4><ul class="abil-list">`;
    for (const bf of mergedBuffs) {
      h += `<li>${escapeHtml(bf.label || "Effet")}</li>`;
    }
    h += `</ul>`;
  }
  h += `</div>`;
  el.enemyDetailBody.innerHTML = h;
  if (el.enemyDetailPanel) {
    el.enemyDetailPanel.dataset.remoteId = remoteId;
    el.enemyDetailPanel.hidden = false;
  }
}

function removeOutgoingUnitEffectByKey(key) {
  const b = state.battle;
  if (!b || !isPlayerTurn(b) || !key) return;
  const prev = (b.myOutgoingUnitEffects || []).length;
  b.myOutgoingUnitEffects = (b.myOutgoingUnitEffects || []).filter(
    (e) => e.key !== key,
  );
  if ((b.myOutgoingUnitEffects || []).length === prev) return;
  persist();
  partyKit.schedulePartySnapshotPush();
  renderBattle();
}

function tryApplyOutgoingEnemyEffect(effectId) {
  const b = state.battle;
  if (!b || !isPlayerTurn(b)) return;
  const ph = currentPhase();
  /** @type {{ label: string, hit: number, wound: number, save: number, rend: number, damageMelee: number, spellId: string, effectId: string } | null} */
  let payload = null;

  if (effectId === "belakor_affaiblissement") {
    if (ph.id !== "hero") {
      alert("En phase des héros uniquement.");
      return;
    }
    const hasBel = state.instances.some(
      (i) =>
        !i.destroyed && getUnitById(i.catalogId)?.id === "belakor",
    );
    if (!hasBel) return;
    payload = {
      label:
        "Affaiblissement de l’ennemi — cible enregistrée (−1 pour toucher ; attaques ennemies contre cette unité sans critique — règle table).",
      hit: -1,
      wound: 0,
      save: 0,
      rend: 0,
      damageMelee: 0,
      spellId: "",
      effectId: "belakor_affaiblissement",
    };
  } else if (effectId === "sb_antique_malediction") {
    if (ph.id !== "combat") {
      alert("En phase de mêlée uniquement.");
      return;
    }
    const def = SOULBLIGHT_LINKED_ENEMY_EFFECTS.find(
      (x) => x.id === "sb_antique_malediction",
    );
    const rosterOk = def?.rosterCatalogIds?.some((cid) =>
      state.instances.some(
        (i) => !i.destroyed && getUnitById(i.catalogId)?.id === cid,
      ),
    );
    if (!def || !rosterOk) return;
    payload = {
      label: "Antique malédiction des tertres — cible maudite (−1 sauvegarde).",
      hit: 0,
      wound: 0,
      save: def.debuffSave ?? -1,
      rend: 0,
      damageMelee: 0,
      spellId: "",
      effectId: "sb_antique_malediction",
    };
  } else {
    const sp =
      SOULBLIGHT_SPELLS.find((s) => s.id === effectId) ||
      SERAPHON_SPELLS.find((s) => s.id === effectId);
    if (!sp?.requiresEnemyTarget) return;
    if (ph.id !== "hero") {
      alert("En phase des héros uniquement.");
      return;
    }
    const dmgMelee =
      sp.debuffMeleeDamage != null ? Number(sp.debuffMeleeDamage) : 0;
    const rendDebuff =
      sp.debuffRend != null ? Number(sp.debuffRend) : 0;
    payload = {
      label: `${sp.name} — cible enregistrée`,
      hit: 0,
      wound: 0,
      save: 0,
      rend: Number.isFinite(rendDebuff) ? rendDebuff : 0,
      damageMelee: Number.isFinite(dmgMelee) ? dmgMelee : 0,
      spellId: effectId,
      effectId: effectId,
    };
  }

  if (!payload) return;

  const sel = el.phaseContent?.querySelector(
    `select.outgoing-enemy-select[data-outgoing-effect-id="${effectId}"]`,
  );
  const remoteId = sel?.value?.trim();
  if (!remoteId) {
    alert("Choisis une unité ennemie.");
    return;
  }
  const row = (b.opponentUnits || []).find((r) => r.id === remoteId);
  if (!row || row.destroyed) {
    alert("Cible invalide.");
    return;
  }
  const key = `${effectId}:${remoteId}:${b.battleRound ?? 1}`;
  b.myOutgoingUnitEffects = (b.myOutgoingUnitEffects || []).filter(
    (e) => e.key !== key,
  );
  b.myOutgoingUnitEffects.push({
    key,
    effectId: payload.effectId,
    spellId: payload.spellId,
    targetRemoteId: remoteId,
    label: payload.label,
    hit: payload.hit,
    wound: payload.wound,
    save: payload.save,
    rend: payload.rend,
    damageMelee: payload.damageMelee,
    castTurn: b.playerTurnNumber,
    battleRound: b.battleRound ?? 1,
  });
  persist();
  partyKit.schedulePartySnapshotPush();
  renderBattle();
}

function tryUnlockTithe(abilityId) {
  if (!isKhorneFactionContext()) return;
  const ab = BLOOD_TITHE_ABILITIES.find((a) => a.id === abilityId);
  const b = state.battle;
  if (!ab || !b) return;
  if (!isPlayerTurn(b)) return;
  if (b.titheUnlocked[abilityId]) return;
  if (!tithePrereqsMet(ab, b.titheUnlocked)) {
    alert("Prérequis non remplis.");
    return;
  }
  if ((b.bloodTithe || 0) < ab.cost) {
    alert("Pas assez de points de dîme.");
    return;
  }
  b.bloodTithe -= ab.cost;
  b.titheUnlocked[abilityId] = true;
  persist();
  partyKit.schedulePartySnapshotPush();
  renderBattle();
}

function renderBattle() {
  const b = state.battle;
  if (!b) return;
  purgeExpiredOutgoingEffects(b);

  const ph = currentPhase();
  if (ph.id !== "combat") combatTrackerShowAll = false;

  el.battleTitle.textContent = state.setup.armyName || "Partie";
  if (el.battleRound)
    el.battleRound.textContent = String(b.battleRound ?? 1);
  if (el.battleSide) {
    el.battleSide.textContent = isPlayerTurn(b) ? "ami" : "ennemi";
    el.battleSide.classList.toggle("mine", isPlayerTurn(b));
    el.battleSide.classList.toggle("opponent", !isPlayerTurn(b));
  }
  el.battlePhase.textContent = ph.name;
  el.battleCp.textContent = `${b.commandPoints} / ${CP_MAX}`;
  if (el.btnCpMinus) el.btnCpMinus.disabled = !isPlayerTurn(b);
  if (el.btnCpPlus) el.btnCpPlus.disabled = !isPlayerTurn(b);
  if (el.bloodTithe)
    el.bloodTithe.textContent = String(b.bloodTithe ?? 0);
  if (el.battleDead)
    el.battleDead.textContent = String(b.deadUnitsCount ?? 0);
  const totalGameU =
    b.totalGameUnits != null && b.totalGameUnits > 0
      ? b.totalGameUnits
      : b.startingArmySize ?? 0;
  if (el.battleArmySize)
    el.battleArmySize.textContent = String(totalGameU);
  const khorneBattle = isKhorneFactionContext();
  if (el.battleTrempesBadge) {
    el.battleTrempesBadge.hidden = !trempesActiveForCurrentGame(b);
  }
  if (el.battleFooterKhornePack)
    el.battleFooterKhornePack.hidden = !khorneBattle;
  if (el.battleRailTithe) el.battleRailTithe.hidden = !khorneBattle;
  if (!khorneBattle && el.drawerTithe) el.drawerTithe.hidden = true;
  if (el.btnDrawerTithe) el.btnDrawerTithe.disabled = !khorneBattle;

  const deadN = b.deadUnitsCount ?? 0;
  const maxDead = totalGameU;
  if (el.btnDeadPlus)
    el.btnDeadPlus.disabled = deadN >= maxDead || maxDead <= 0;
  if (el.btnDeadMinus) el.btnDeadMinus.disabled = deadN <= 0;

  const form = getFormationById(state.setup.formationId);
  const traitsFaction = getHeroicTraitsForFaction(state.setup.factionId);
  const artsFaction = getArtifactsForFaction(state.setup.factionId);
  const trait = traitsFaction.find((t) => t.id === state.setup.traitId);
  const art = artsFaction.find((a) => a.id === state.setup.artifactId);

  let html = "";

  if (ph.id === "deployment") {
    const deployIntro =
      isSylvanethFactionContext() ?
        `Déploiement — <strong>Sylvaneth</strong> : tous les traits de bataille s’appliquent ; rappelle la saison, la clairière choisie et la case <strong>9p bois</strong> pour la forêt-sympathie.`
      : `Déploiement — <strong>${escapeHtml(form?.name || "—")}</strong> : ${escapeHtml(form?.ability || "—")}`;
    html += `<p class="phase-intro">${deployIntro}</p>`;
    html += buildPhaseUnitsPanelHtml(ph, b);
    html += wrapPhaseTrackerCollapsible(buildPhaseTrackerHtml(ph, b));
    html += `<p><button type="button" class="btn" id="btn-deploy-done">Déploiement terminé — commencer tour 1</button></p>`;
  } else {
    const sideLabel = isPlayerTurn(b) ? "Tour ami" : "Tour ennemi";
    html += `<p class="phase-intro">Manche <strong>${b.battleRound ?? 1}</strong> — ${sideLabel} — ${ph.name}</p>`;

    if (ph.id === "combat") {
      html += buildCombatMeleeStripHtml(b, ph);
    }
    if (
      ph.id === "combat" &&
      isPlayerTurn(b) &&
      (isKhorneFactionContext() ||
        isPeauxVertesFactionContext() ||
        isSoulblightFactionContext() ||
        isSylvanethFactionContext())
    ) {
      html += buildMeleeProximityRecapHtml();
    }

    html += buildIronjawzBattleEncartsHtml(ph, b);
    html += buildSoulblightBattleEncartsHtml(ph, b);
    html += buildSeraphonBattleEncartsHtml(ph, b);
    html += buildSylvanethBattleEncartsHtml(ph, b);
    html += `<div class="phase-drawer-stack">`;
    html += wrapPhaseDrawer(
      "Récap unités & rappels de phase",
      buildPhaseUnitsPanelHtml(ph, b),
    );
    html += wrapPhaseDrawer(
      "Rappels perso (traits, artefacts, terrain)",
      buildPhaseLocalRemindersHtml(ph, b),
    );
    const linkedAndManager =
      buildLinkedEnemyOutgoingHtml(ph, b) +
      buildOutgoingEffectsManagerHtml(b);
    html += wrapPhaseDrawer(
      "Enregistrements cible ennemie (synchronisés)",
      linkedAndManager,
    );
    html += `</div>`;
    html += wrapPhaseTrackerCollapsible(buildPhaseTrackerHtml(ph, b));

    if (khorneBattle) {
      if (ph.id === "hero" && isPlayerTurn(b)) {
        html += `<p class="muted small phase-dime-hint">Dîme : panneau <strong>Dîme</strong> (rail droite).</p>`;
      } else if (ph.id !== "hero") {
        html += `<h3 class="subh">Dîme</h3>`;
        html += `<p class="muted"><strong>${b.bloodTithe ?? 0}</strong> pts — déblocage phase héros (ton tour) ; +1 par unité perdue.</p>`;
      }
    }
  }

  el.phaseContent.innerHTML = html;

  if (el.titheDrawerBody) {
    el.titheDrawerBody.innerHTML = khorneBattle ? buildTitheHtml(b) : "";
  }
  if (el.pcDrawerBody) {
    el.pcDrawerBody.innerHTML = buildUniversalPcDrawerHtml(ph.id, escapeHtml);
  }

  if (el.btnNextPhase) {
    el.btnNextPhase.disabled = ph.id === "deployment";
  }
  if (el.btnPrevPhase) {
    el.btnPrevPhase.disabled =
      ph.id === "deployment" || !(b.phaseHistory && b.phaseHistory.length);
  }

  renderUnitSidebar();

  const priests = state.instances.filter((i) => {
    const u = getUnitById(i.catalogId);
    return u?.isPriest || u?.keywords?.some((k) => k.startsWith("PRÊTRE"));
  });
  if (
    el.prayerSection &&
    (isKhorneFactionContext() ||
      isPeauxVertesFactionContext() ||
      isSoulblightFactionContext()) &&
    ph.id === "hero" &&
    priests.length > 0 &&
    isPlayerTurn(b)
  ) {
    el.prayerSection.hidden = false;
    el.prayerSelect.innerHTML = "";
    const prayerList = getPrayersForFaction(state.setup.factionId);
    for (const p of prayerList) {
      const o = document.createElement("option");
      o.value = p.id;
      const cost = getPrayerRitualCost(p);
      o.textContent = `${p.name} (${cost} pts rituel)`;
      el.prayerSelect.appendChild(o);
    }
    refreshPrayerCasters();
    refreshPrayerTargets();
    updatePrayerFormHints();
  } else if (el.prayerSection) {
    el.prayerSection.hidden = true;
  }

  if (el.detailPanel && !el.detailPanel.hidden) {
    const tid = el.detailPanel.dataset.targetId;
    if (tid) {
      if (el.buffManual) el.buffManual.hidden = !isPlayerTurn(b);
      renderDetailPanel(tid);
    }
  }

  renderEnemyBattleUI();
  renderSalonRoster();
}

function renderUnitSidebar() {
  el.unitSidebar.innerHTML = "";
  const trempesOn = trempesActiveForCurrentGame(state.battle);
  for (const inst of state.instances) {
    ensureInstanceTracking(inst);
    const u = getUnitById(inst.catalogId);
    const wrap = document.createElement("div");
    wrap.className = "sidebar-unit-wrap";
    if (inst.destroyed) wrap.classList.add("sidebar-unit-wrap--destroyed");

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "sidebar-unit";
    if (
      trempesOn &&
      u &&
      getTrempesDeSangEffectsForUnit(u).length > 0 &&
      !inst.destroyed
    ) {
      btn.classList.add("sidebar-unit--trempes");
    }
    if (inst.destroyed) btn.classList.add("sidebar-unit--destroyed");
    {
      let base =
        (inst.isInvocation ? "◇ " : "") + (u?.name || inst.catalogId);
      if (u) base += formatSidebarFiguresSuffix(inst, u);
      btn.textContent = base;
    }
    btn.addEventListener("click", () => openDetail(inst.id));
    wrap.appendChild(btn);

    const trempList = u ? getTrempesDeSangEffectsForUnit(u) : [];
    if (trempList.length > 0 && !inst.destroyed) {
      const det = document.createElement("details");
      det.className = "sidebar-rage-details";
      const sum = document.createElement("summary");
      sum.textContent = "Rage incontrôlable (Trempés)";
      det.appendChild(sum);

      const labTremp = document.createElement("label");
      labTremp.className = "sidebar-rage-line";
      const cbTremp = document.createElement("input");
      cbTremp.type = "checkbox";
      cbTremp.className = "sidebar-rage-trempes";
      cbTremp.dataset.iid = inst.id;
      cbTremp.checked = !!inst.rageIncontrolableTrempes;
      cbTremp.title =
        "Cette unité compte comme sous Trempés de sang (prière ou suivi manuel).";
      labTremp.appendChild(cbTremp);
      labTremp.appendChild(
        document.createTextNode(" Effets Trempés de sang sur le profil"),
      );
      det.appendChild(labTremp);

      const lab8 = document.createElement("label");
      lab8.className = "sidebar-rage-line sidebar-rage-line--indent";
      const cb8 = document.createElement("input");
      cb8.type = "checkbox";
      cb8.className = "sidebar-rage-recite8";
      cb8.dataset.iid = inst.id;
      cb8.checked = !!inst.rageIncontrolableRecite8plus;
      cb8.title =
        "Récitation 8+ : ignorer Brutalité aveugle (voir prière Rage incontrôlable).";
      lab8.appendChild(cb8);
      lab8.appendChild(
        document.createTextNode(" Récitation 8+ (sans Brutalité aveugle)"),
      );
      det.appendChild(lab8);

      wrap.appendChild(det);
    }

    el.unitSidebar.appendChild(wrap);
  }
}

function openDetail(instanceId) {
  openUnitsDrawer();
  el.detailPanel.hidden = false;
  el.detailPanel.dataset.targetId = instanceId;
  if (el.buffManual)
    el.buffManual.hidden = !isPlayerTurn(state.battle);
  renderDetailPanel(instanceId);
}

function refreshPrayerTargets() {
  if (!el.prayerTarget) return;
  el.prayerTarget.innerHTML = '<option value="">— Cible —</option>';
  for (const inst of state.instances) {
    const u = getUnitById(inst.catalogId);
    const o = document.createElement("option");
    o.value = inst.id;
    if (u) {
      ensureInstanceTracking(inst);
      o.textContent = (u.name || inst.id) + formatSidebarFiguresSuffix(inst, u);
    } else {
      o.textContent = inst.id;
    }
    el.prayerTarget.appendChild(o);
  }
}

function refreshPrayerCasters() {
  if (!el.prayerCaster) return;
  el.prayerCaster.innerHTML = '<option value="">— Prêtre —</option>';
  for (const inst of state.instances) {
    const u = getUnitById(inst.catalogId);
    if (!unitIsPriestProfile(u)) continue;
    const o = document.createElement("option");
    o.value = inst.id;
    o.textContent = u.name;
    el.prayerCaster.appendChild(o);
  }
}

function updatePrayerFormHints() {
  const prayerList = getPrayersForFaction(state.setup.factionId);
  const prayer = prayerList.find((p) => p.id === el.prayerSelect?.value);
  if (!el.prayerHint || !el.prayerTargetLabel) return;
  if (!prayer) {
    el.prayerHint.textContent = "";
    if (el.prayerConvocationWrap) el.prayerConvocationWrap.hidden = true;
    return;
  }
  const cost = getPrayerRitualCost(prayer);
  if (prayer.id.startsWith("convocation_")) {
    el.prayerHint.textContent = `Coût ${cost} pts de rituel (déduits du prêtre). Les invocations ne sont pas dans la liste d’armée : coche la case ci‑dessous uniquement si la psalmodie réussit en phase des héros — l’invocation apparaît alors dans le suivi.`;
    el.prayerTargetLabel.textContent = "Cible";
    if (el.prayerTarget) el.prayerTarget.disabled = true;
    if (el.prayerConvocationWrap) el.prayerConvocationWrap.hidden = false;
    if (el.prayerConvocationSuccess) el.prayerConvocationSuccess.checked = false;
  } else if (prayer.id === "sang_bouillant") {
    el.prayerHint.textContent = `Coût ${cost} pts de rituel. Cible ennemie : gérée sur la table ; l’app enregistre un rappel sur le prêtre.`;
    el.prayerTargetLabel.textContent = "Cible";
    if (el.prayerTarget) el.prayerTarget.disabled = true;
    if (el.prayerConvocationWrap) el.prayerConvocationWrap.hidden = true;
  } else {
    el.prayerHint.textContent = `Coût ${cost} pts de rituel. Choisis une cible alliée dans la liste si besoin.`;
    el.prayerTargetLabel.textContent = "Cible (alliée)";
    if (el.prayerTarget) el.prayerTarget.disabled = false;
    if (el.prayerConvocationWrap) el.prayerConvocationWrap.hidden = true;
  }
}

function formatDamageTrempes(raw, damageBonus) {
  if (!damageBonus) return raw ?? "—";
  const s = String(raw ?? "").trim();
  if (s === "" || s === "—") return raw ?? "—";
  if (/^\d+$/.test(s)) {
    const n = parseInt(s, 10);
    const next = n + damageBonus;
    return `${raw} → ${Math.max(0, next)}`;
  }
  if (damageBonus < 0) {
    return `${raw} (dégâts ${damageBonus})`;
  }
  return `${raw} (+${damageBonus})`;
}

/**
 * Bonus de dégâts indiqué dans les notes (ex. « Charge +1 dégât ») — uniquement si la formulation
 * correspond à un bonus de charge (évite « Anti-charge », etc.).
 */
function getChargeDamageBonusFromWeaponNotes(notes) {
  if (!notes || typeof notes !== "string") return 0;
  const m = notes.match(
    /(?:^|[\s,;])Charge\s*(?:\(\s*\+(\d+)\s*dégât\s*\)|[:(]?\s*\+(\d+)\s*dégât)\.?/i,
  );
  if (!m) return 0;
  const n = parseInt(m[1] || m[2], 10);
  return Number.isFinite(n) ? n : 0;
}

function renderDetailPanel(instanceId) {
  const inst = state.instances.find((i) => i.id === instanceId);
  if (!inst) return;
  const u = getUnitById(inst.catalogId);
  if (!u) return;

  ensureInstanceTracking(inst);
  const incomingRemote = collectIncomingRemoteBuffsForInstance(inst, state);
  const modsRaw = sumBuffMods([...(inst.buffs || []), ...incomingRemote]);
  const khorneShotPen = getShootingHitPenaltyVsKhorne(state);
  const mods = inst.destroyed
    ? { hit: 0, wound: 0, save: 0, rend: 0, damageMelee: 0 }
    : modsRaw;
  const sit = getTacticalSituationMods(inst, u);
  const trempesForProfile = trempesProfileActiveForUnit(
    inst,
    u,
    state.battle,
  );
  const tm = getTrempesDeSangCombatMods(u, trempesForProfile);
  const rendTotal = mods.rend + tm.rend;
  {
    let t = u.name;
    t += formatSidebarFiguresSuffix(inst, u);
    el.detailTitle.textContent = t;
  }

  const b = state.battle;
  const dead = b?.deadUnitsCount ?? 0;
  const totalGameU = getTotalGameUnitsForTrempes();
  const threshold = getTrempesDeSangThreshold(totalGameU);
  const need = Math.max(0, threshold - dead);

  let h = "";
  if (inst.destroyed) {
    h += `<div class="unit-destroyed-banner">Unité <strong>détruite</strong> — bonus de profil, Trempés de sang et rappels de phase désactivés pour le reste de la partie.</div>`;
  } else if (inst.isInvocation) {
    h += `<div class="unit-invocation-banner"><strong>Invocation</strong> — hors liste d’armée ; à la destruction : +1 au compteur <strong>Dîme</strong> uniquement (pas pour le seuil Trempés de sang).</div>`;
  }

  const artHeroId = state.setup.artifactHeroInstanceId;
  const isArtifactCarrier =
    artHeroId && String(artHeroId) === String(inst.id);
  const artId = state.setup.artifactId;
  let ctrlDisplay = u.stats.control ?? "—";
  if (
    isPeauxVertesFactionContext() &&
    isArtifactCarrier &&
    artId === "ij_cranes_trophees"
  ) {
    const c = parseInt(String(ctrlDisplay).trim(), 10);
    ctrlDisplay = Number.isFinite(c) ? String(c + 10) : `${ctrlDisplay} (+10)`;
  }

  h += `<div class="detail-stats">`;
  h += `<p><strong>M</strong> ${u.stats.move} · <strong>Sv</strong> ${showSaveEff(u.stats.save, mods.save)} · <strong>PV</strong> ${formatPvStatLine(inst, u)} · <strong>Ctrl</strong> ${ctrlDisplay}</p>`;
  if (u.stats.magicSave || u.stats.banishment) {
    const bits = [];
    if (u.stats.magicSave)
      bits.push(
        `<strong>Sauvegarde magique</strong> ${u.stats.magicSave}`,
      );
    if (u.stats.banishment)
      bits.push(`<strong>Bannissement</strong> ${u.stats.banishment}`);
    h += `<p class="muted small">${bits.join(" · ")}</p>`;
  }
  if (
    isPeauxVertesFactionContext() &&
    isArtifactCarrier &&
    artId === "ij_armure_gork" &&
    !inst.destroyed
  ) {
    h += `<p class="muted small"><strong>Protection</strong> 6+ (Armure de Gork)</p>`;
  }
  if (
    isPeauxVertesFactionContext() &&
    state.setup.formationId === "ij_poing_bizarre" &&
    unitKeyword(u, "INFANTERIE") &&
    !inst.destroyed
  ) {
    h += `<div class="panel-inner ironjawz-inline-cb"><label class="tracker-label"><input type="checkbox" class="detail-ij-esprit-gork" data-iid="${inst.id}" ${inst.ironjawzEspritDeGork ? "checked" : ""} /> <strong>Esprit de Gork</strong> : entièrement à 12" d’un sorcier ou prêtre Mâchefer allié → Protection 6+</label></div>`;
    if (inst.ironjawzEspritDeGork) {
      h += `<p class="muted small"><strong>Protection</strong> 6+ (active)</p>`;
    }
  }
  if (u.keywords?.length) {
    h += `<p class="muted small"><strong>Mots-clés :</strong> ${u.keywords.join(", ")}</p>`;
  }
  h += `</div>`;

  if (b) {
    const myTurn = isPlayerTurn(b);
    const pvHint = formatPvMaxHint(inst, u);
    const wc = inst.woundsCurrent;
    const pvVal =
      wc === "" || wc === null || wc === undefined ? "" : String(wc);
    const pvDis = inst.destroyed === true;
    h += `<div class="detail-tracker panel-inner">`;
    h += `<h4>Suivi</h4>`;
    h += `<div class="detail-tracker-row">`;
    h += `<label class="detail-tracker-pv">PV rest. <input type="number" class="tracker-pv input-narrow" data-iid="${inst.id}" min="0" step="1" value="${escapeHtml(pvVal)}" placeholder="${escapeHtml(pvHint)}" title="Total max ${escapeHtml(pvHint)}" ${pvDis ? "disabled" : ""} /></label>`;
    if (myTurn) {
      h += `<label class="tracker-label"><input type="checkbox" class="tracker-melee" data-iid="${inst.id}" ${inst.inMelee ? "checked" : ""} ${pvDis ? "disabled" : ""} /> Mêlée</label>`;
      h += `<label class="tracker-label"><input type="checkbox" class="tracker-charged" data-iid="${inst.id}" ${inst.chargedThisTurn ? "checked" : ""} ${pvDis ? "disabled" : ""} /> Chargé</label>`;
    }
    h += `</div>`;
    if (myTurn) {
      const tactLabels = tacticalBonusCheckboxLabels(inst, u, false);
      if (tactLabels.length) {
        h += `<div class="detail-tracker-row detail-tracker-tactical">${tactLabels.join("")}</div>`;
      }
    }
    h += `</div>`;
  }

  if (unitIsPriestProfile(u)) {
    const rp = inst.ritualPoints ?? 0;
    h += `<div class="ritual-panel panel-inner">`;
    h += `<h4>Points de rituel</h4>`;
    h += `<p class="ritual-pts"><strong>${rp}</strong> pts</p>`;
    h += `<div class="ritual-actions">`;
    h += `<button type="button" class="btn tiny btn-ritual" data-act="minus" data-iid="${inst.id}">−</button>`;
    h += `<button type="button" class="btn tiny btn-ritual" data-act="plus" data-iid="${inst.id}">+</button>`;
    h += `<button type="button" class="btn tiny secondary btn-ritual" data-act="d6" data-iid="${inst.id}">D6 (début de tour)</button>`;
    h += `<button type="button" class="btn tiny secondary btn-ritual" data-act="sacrifice" data-iid="${inst.id}">+1 Sacrifice</button>`;
    h += `</div>`;
    h += `<p class="hint small">Cumul possible : gain D6 en début de tour, +1 par Sacrifice de sang, points conservés si récitation &lt; coût (voir règles). Ajuste avec − / + si besoin.</p>`;
    h += `</div>`;
  }

  const trempesAll = getTrempesDeSangEffectsForUnit(u);
  const trempes = filterTrempesEffectsForInstance(trempesAll, inst);
  if (
    isKhorneFactionContext() &&
    trempesAll.length &&
    !inst.destroyed
  ) {
    const trempesGlobOn = trempesActiveForCurrentGame(state.battle);
    h += `<h4>Trempés de sang</h4>`;
    h += `<p class="muted small">Unités détruites (partie entière, compteur) : <strong>${dead}</strong> / <strong>${totalGameU}</strong> — seuil : <strong>${threshold}</strong>${need > 0 && !trempesGlobOn ? ` (encore ${need} pour le trait global)` : ""}.</p>`;
    if (trempesForProfile) {
      h += `<div class="trempes-active-banner">Effets Trempés actifs sur cette unité (trait global et/ou Rage incontrôlable).</div>`;
      h += `<ul class="abil-list">`;
      for (const t of trempes) {
        h += `<li><strong>${t.name}</strong> — ${t.summary}</li>`;
      }
      h += `</ul>`;
      if (tm.rend > 0 || tm.damageBonus > 0) {
        const bits = [];
        if (tm.rend > 0) bits.push(`+${tm.rend} perforant`);
        if (tm.damageBonus > 0) bits.push(`+${tm.damageBonus} dégâts`);
        h += `<p class="muted small">Reflet sur le tableau d’armes : ${bits.join(" et ")}.</p>`;
      }
    } else {
      h += `<ul class="abil-list muted">`;
      for (const t of trempesAll) {
        h += `<li><strong>${t.name}</strong> — ${t.summary}</li>`;
      }
      h += `</ul>`;
      h += `<p class="muted small">Le trait global n’est pas actif : augmente le compteur <strong>Unités détruites</strong> ou utilise la prière <strong>Rage incontrôlable</strong> (encart dans la liste d’unités).</p>`;
    }
  }

  const bonusSummary = buildBonusSummaryLines(inst, u);
  if (bonusSummary.length && !inst.destroyed) {
    h += `<div class="panel-inner bonus-summary"><h4>Résumé des bonus (profil)</h4><ul class="bonus-summary-list">`;
    for (const row of bonusSummary) {
      h += `<li><strong>${escapeHtml(row.ability)}</strong> — ${escapeHtml(row.detail)}</li>`;
    }
    h += `</ul></div>`;
  }

  if (
    isPeauxVertesFactionContext() &&
    isArtifactCarrier &&
    artId === "ij_pierre_ambrivoire" &&
    !inst.destroyed
  ) {
    let ambOpts = "";
    (u.weapons || []).forEach((w, wi) => {
      if (weaponIsRangedForPhase(w)) return;
      ambOpts += `<option value="${wi}" ${Number(inst.ironjawzAmbrivoireWeaponIndex) === wi ? "selected" : ""}>${escapeHtml(w.name)}</option>`;
    });
    h += `<div class="panel-inner"><label class="field"><span>Pierre à Ambrivoire — arme (+1 perforant)</span><select class="detail-ij-ambrivoire-weapon" data-iid="${inst.id}">${ambOpts}</select></label></div>`;
  }

  if (
    isSoulblightFactionContext() &&
    u.id === "sb_machine_mortis" &&
    !inst.destroyed
  ) {
    ensureInstanceTracking(inst);
    const e = Math.min(
      6,
      Math.max(1, Number(inst.soulblightMachineMortisEnergy) || 1),
    );
    h += `<div class="panel-inner soulblight-reliquaire-panel">
      <h4>Reliquaire — dé d’énergie</h4>
      <p class="muted small">À la mise en place : <strong>1</strong>. Chaque sort réussi d’un <strong>sorcier Ruinemâne</strong> à 12" : <strong>+1</strong> (max <strong>6</strong>). <strong>Onde de pouvoir</strong> (phase de tir) : utilise la valeur puis remet le dé à <strong>1</strong>.</p>
      <p class="soulblight-energy-controls">
        <button type="button" class="btn small btn-sb-machine-energy" data-act="minus" data-iid="${inst.id}">−</button>
        <strong class="soulblight-energy-val">${e}</strong> / 6
        <button type="button" class="btn small btn-sb-machine-energy" data-act="plus" data-iid="${inst.id}">+</button>
      </p>
    </div>`;
  }

  if (
    isPeauxVertesFactionContext() &&
    (u.id === "ij_gordrakk" || u.id === "ij_megaboss") &&
    !inst.destroyed
  ) {
    ensureInstanceTracking(inst);
    const tok = inst.waaaghVictoryTokens ?? 0;
    const spent = inst.waaaghSpentAttackBonus ?? 0;
    h += `<div class="panel-inner ironjawz-waaagh-tokens-panel">
      <h4>Pions Waaagh! — La victoire rend fort</h4>
      <p class="muted small">Compteur (max 3) : +1 A par pion aux armes de mêlée (voir tableau). <strong>Dépenser</strong> remet les pions à 0 et ajoute ce total aux attaques jusqu’au début de ta prochaine phase des héros.</p>
      <p class="waaagh-tok-controls">
        <button type="button" class="btn small btn-waaagh-tok-minus" data-iid="${inst.id}" ${tok <= 0 ? "disabled" : ""}>−</button>
        <strong class="waaagh-tok-display">${tok}</strong> pion(s)
        <button type="button" class="btn small btn-waaagh-tok-plus" data-iid="${inst.id}" ${tok >= 3 ? "disabled" : ""}>+</button>
        <button type="button" class="btn small btn-waaagh-tok-spend" data-iid="${inst.id}" ${tok <= 0 ? "disabled" : ""}>Dépenser (+${tok} A mêlée)</button>
      </p>
      ${
        spent > 0
          ? `<p class="muted small">Bonus dépensé actif : <strong>+${spent} A</strong> (mêlée) — effacé au début de ta prochaine phase des héros.</p>`
          : ""
      }
    </div>`;
  }

  h += `<h4>Armes</h4><table class="wtable"><thead><tr><th></th><th>A</th><th>CT</th><th>CB</th><th>P</th><th>D</th></tr></thead><tbody>`;
  (u.weapons || []).forEach((w, wi) => {
    const hb = parseRoll(w.hit);
    const wb = parseRoll(w.wound);
    const rb = parseRend(w.rend);
    const ambRend =
      isPeauxVertesFactionContext() &&
      isArtifactCarrier &&
      artId === "ij_pierre_ambrivoire" &&
      Number(inst.ironjawzAmbrivoireWeaponIndex) === wi
        ? 1
        : 0;
    const rbForEff = rb != null ? rb + ambRend : null;
    let extraHit = 0;
    if (weaponIsRangedForPhase(w) && khorneShotPen < 0) {
      extraHit += khorneShotPen;
    }
    const he =
      hb != null
        ? applyRollBonus(hb, mods.hit + sit.hit + extraHit)
        : null;
    const we = wb != null ? applyRollBonus(wb, mods.wound + sit.wound) : null;
    const re = rbForEff != null ? rbForEff - rendTotal : null;
    const chargeDmg =
      inst.chargedThisTurn && !inst.destroyed
        ? getChargeDamageBonusFromWeaponNotes(w.notes)
        : 0;
    const trempesDmg =
      trempesForProfile && tm.damageBonus > 0 ? tm.damageBonus : 0;
    const isMeleeRow = !weaponIsRangedForPhase(w);
    const dmgExtra =
      (isMeleeRow ? mods.damageMelee : 0) + trempesDmg + chargeDmg;
    const dmgCell = formatDamageTrempes(w.damage, dmgExtra);
    const rageExtra = getConsangRageMeleeAttackBonus(inst, u, w);
    const ijExtra = getIronjawzMeleeAttackBonus(inst, u, w);
    const atkCell = formatAttacksCellWithMeleeAtkBonus(
      w,
      inst,
      u,
      rageExtra + ijExtra,
    );
    h += `<tr><td>${w.name}</td><td>${atkCell}</td><td>${fmtEff(w.hit, he, hb)}</td><td>${fmtEff(w.wound, we, wb)}</td><td>${fmtRendEff(w.rend, re, rb)}</td><td>${dmgCell}${w.notes ? ` <span class="muted small">(${w.notes})</span>` : ""}</td></tr>`;
  });
  h += `</tbody></table>`;
  if (
    inst.chargedThisTurn &&
    !inst.destroyed &&
    (u.weapons || []).some(
      (w) => getChargeDamageBonusFromWeaponNotes(w.notes) > 0,
    )
  ) {
    h += `<p class="muted small">Bonus <strong>Charge +dégâts</strong> des notes d’arme appliqué en colonne <strong>D</strong> (case « A chargé ce tour » cochée dans le suivi).</p>`;
  }

  if (
    isPeauxVertesFactionContext() &&
    !inst.destroyed &&
    b?.ironjawzWaaaghAuraActiveThisPlayerTurn &&
    inst.ironjawzInWaaaghAura
  ) {
    h += `<p class="muted small"><strong>Waaagh!</strong> : +1 au jet de charge ; +1 A en mêlée (voir tableau).</p>`;
  }

  if (u.id === "claws_karanak" && inst.clawsPack12 && !inst.destroyed) {
    h += `<p class="muted small">À 12&quot; de Molosses ou Karanak : touches critiques sur <strong>5+</strong> non modifiés en mêlée (Chasseur de meute).</p>`;
  }

  if (u.id === "belakor") {
    h += `<p class="muted small">Lame des ombres : critique = blessure automatique.</p>`;
    if (b) {
      const st = getBelakorLameAttacks(inst, u);
      h += `<p class="muted small">Attaques actuelles (selon PV saisis) : <strong>${st}</strong> — stigmate de guerre : 6 att. si PV restants ≤ 4 sur 14.</p>`;
    }
  }

  if (u.id === "ij_gordrakk" && b) {
    const st = getGordrakkPoingsAttacks(inst, u);
    h += `<p class="muted small">Poings et queue (selon PV saisis) : <strong>${st}</strong> attaques — stigmates : 6 A si 10+ dégâts alloués (≤10 PV restants sur 20).</p>`;
  }

  if (u.id === "sb_prince_vhordrai" && b) {
    const st = getVhordraiGriffesAttacks(inst, u);
    h += `<p class="muted small">Griffes de Shordemaire (selon PV saisis) : <strong>${st}</strong> attaques — stigmates : 5 A si 10+ dégâts alloués (≤8 PV restants sur 18).</p>`;
  }

  if (u.id === "ser_oldblood_carnosaure" && b) {
    const st = getCarnosaurMassiveJawAttacks(inst, u);
    h += `<p class="muted small">Mâchoires massives du Carnosaure (selon PV saisis) : <strong>${st}</strong> attaques — stigmates : 2 A si 10+ dégâts alloués (≤4 PV restants sur 14).</p>`;
  }

  if (u.id === "syl_spirit_durthu" && b) {
    const st = getSylDurthuEpeeAttacks(inst, u);
    h += `<p class="muted small">Épée gardienne (selon PV saisis) : <strong>${st}</strong> attaques — stigmates : 3 A si 10+ blessures allouées (≤4 PV restants sur 14).</p>`;
  }

  if (u.stigmates?.length) {
    h += `<h4>Stigmates</h4><ul class="abil-list">`;
    for (const s of u.stigmates) {
      h += `<li><strong>${s.name}</strong> — ${s.summary}</li>`;
    }
    h += `</ul>`;
  }

  h += `<h4>Aptitudes (rappel)</h4><ul class="abil-list">`;
  for (const a of u.abilities || []) {
    h += `<li><strong>${a.name}</strong> — ${a.summary}</li>`;
  }
  h += `</ul>`;

  if (incomingRemote.length) {
    h += `<h4>Effets reçus (adversaire)</h4><p class="muted small">Valables pour la manche indiquée ; ils disparaissent à la manche suivante (synchronisé).</p><ul class="abil-list">`;
    for (const e of incomingRemote) {
      const mr =
        e.battleRound != null
          ? ` <span class="muted small">(manche ${e.battleRound})</span>`
          : "";
      h += `<li>${escapeHtml(e.label || "Effet")}${mr}</li>`;
    }
    h += `</ul>`;
  }

  h += `<h4>Buffs actifs sur cette unité</h4>`;
  if (!inst.buffs?.length) h += `<p class="muted">Aucun.</p>`;
  else {
    h += `<ul class="buff-items">`;
    for (const bf of inst.buffs) {
      h += `<li>${bf.label}<button type="button" class="btn icon small btn-remove-buff" data-bid="${bf.id}">×</button></li>`;
    }
    h += `</ul>`;
  }

  el.detailBody.innerHTML = h;

  el.detailBody.querySelectorAll(".btn-ritual").forEach((btn) => {
    btn.addEventListener("click", () => {
      const iid = btn.dataset.iid;
      const instR = state.instances.find((i) => i.id === iid);
      if (!instR || !isPlayerTurn(state.battle)) return;
      if (instR.ritualPoints == null) instR.ritualPoints = 0;
      const act = btn.dataset.act;
      if (act === "plus") instR.ritualPoints += 1;
      else if (act === "minus")
        instR.ritualPoints = Math.max(0, instR.ritualPoints - 1);
      else if (act === "d6")
        instR.ritualPoints += Math.floor(Math.random() * 6) + 1;
      else if (act === "sacrifice") instR.ritualPoints += 1;
      persist();
      renderDetailPanel(iid);
      renderBattle();
    });
  });

  el.detailBody.querySelectorAll(".btn-remove-buff").forEach((btn) => {
    btn.addEventListener("click", () => {
      const bid = btn.dataset.bid;
      inst.buffs = inst.buffs.filter((x) => x.id !== bid);
      persist();
      renderDetailPanel(instanceId);
      renderBattle();
    });
  });
}

function showSaveEff(saveStr, saveModSum) {
  const b = parseRoll(saveStr);
  if (b == null) return saveStr;
  const e = applyRollBonus(b, saveModSum);
  if (saveModSum === 0) return saveStr;
  return `${saveStr} → ${formatRoll(e)}`;
}

function fmtEff(raw, eff, base) {
  if (eff == null || base == null || eff === base) return raw;
  return `${raw} → ${formatRoll(eff)}`;
}

function fmtRendEff(raw, eff, base) {
  if (base == null || eff == null) return raw || "—";
  if (eff === base) return raw || "—";
  return `${raw || "—"} → ${formatRendNum(eff)}`;
}

el.btnStart?.addEventListener("click", initBattleFromSetup);

el.btnNextPhase?.addEventListener("click", () => {
  if (currentPhase().id === "deployment") return;
  advancePhase();
});

el.btnPrevPhase?.addEventListener("click", () => {
  retreatPhase();
});

el.btnExitBattle?.addEventListener("click", () => {
  if (confirm("Quitter la partie ? (la liste d’armée reste enregistrée.)")) {
    showSetup();
  }
});

el.btnCpMinus?.addEventListener("click", () => {
  if (!isPlayerTurn(state.battle)) return;
  if (state.battle.commandPoints > 0) {
    state.battle.commandPoints -= 1;
    persist();
    renderBattle();
  }
});

el.btnCpPlus?.addEventListener("click", () => {
  if (!isPlayerTurn(state.battle)) return;
  if (state.battle.commandPoints < CP_MAX) {
    state.battle.commandPoints += 1;
    persist();
    renderBattle();
  }
});

el.btnTithePlus?.addEventListener("click", () => {
  if (!isKhorneFactionContext()) return;
  state.battle.bloodTithe = (state.battle.bloodTithe || 0) + 1;
  persist();
  renderBattle();
});

el.btnTitheMinus?.addEventListener("click", () => {
  if (!isKhorneFactionContext()) return;
  state.battle.bloodTithe = Math.max(
    0,
    (state.battle.bloodTithe || 0) - 1,
  );
  persist();
  renderBattle();
});

el.btnDeadPlus?.addEventListener("click", () => {
  const b = state.battle;
  if (!b) return;
  const max =
    b.totalGameUnits != null && b.totalGameUnits > 0
      ? b.totalGameUnits
      : b.startingArmySize ?? 0;
  if ((b.deadUnitsCount ?? 0) >= max) return;
  b.deadUnitsCount = (b.deadUnitsCount ?? 0) + 1;
  if (isKhorneFactionContext()) {
    b.bloodTithe = (b.bloodTithe || 0) + 1;
  }
  persist();
  renderBattle();
  const tid = el.detailPanel?.dataset?.targetId;
  if (tid && !el.detailPanel.hidden) renderDetailPanel(tid);
});

el.btnDeadMinus?.addEventListener("click", () => {
  const b = state.battle;
  if (!b) return;
  if ((b.deadUnitsCount ?? 0) <= 0) return;
  b.deadUnitsCount -= 1;
  if (isKhorneFactionContext()) {
    b.bloodTithe = Math.max(0, (b.bloodTithe || 0) - 1);
  }
  persist();
  renderBattle();
  const tid = el.detailPanel?.dataset?.targetId;
  if (tid && !el.detailPanel.hidden) renderDetailPanel(tid);
});

el.btnCloseDetail?.addEventListener("click", () => {
  el.detailPanel.hidden = true;
});

el.btnApplyBuff?.addEventListener("click", () => {
  if (!isPlayerTurn(state.battle)) return;
  const id = el.detailPanel.dataset.targetId;
  const inst = state.instances.find((i) => i.id === id);
  if (!inst) return;
  const hit = parseInt(el.buffHit.value, 10) || 0;
  const wound = parseInt(el.buffWound.value, 10) || 0;
  const save = parseInt(el.buffSave.value, 10) || 0;
  const rend = parseInt(el.buffRend.value, 10) || 0;
  const label = el.buffLabel.value.trim() || "Buff manuel";
  if (!hit && !wound && !save && !rend) {
    alert("Entre au moins un modificateur non nul.");
    return;
  }
  inst.buffs.push({
    id: uid(),
    label,
    hit,
    wound,
    save,
    rend,
    expiresNextHero: true,
    castTurn: state.battle.playerTurnNumber,
  });
  el.buffHit.value = "0";
  el.buffWound.value = "0";
  el.buffSave.value = "0";
  el.buffRend.value = "0";
  el.buffLabel.value = "";
  persist();
  renderDetailPanel(id);
});

el.btnApplyPrayer?.addEventListener("click", () => {
  if (!isKhorneFactionContext() && !isPeauxVertesFactionContext()) return;
  if (!isPlayerTurn(state.battle)) return;
  const pid = el.prayerSelect.value;
  const tid = el.prayerTarget.value;
  const casterId = el.prayerCaster?.value;
  const prayerList = getPrayersForFaction(state.setup.factionId);
  const prayer = prayerList.find((p) => p.id === pid);
  const priest = state.instances.find((i) => i.id === casterId);
  const priestU = priest ? getUnitById(priest.catalogId) : null;

  if (!prayer || !priest || !unitIsPriestProfile(priestU)) {
    alert("Choisis un prêtre et une prière.");
    return;
  }

  const cost = getPrayerRitualCost(prayer);
  if ((priest.ritualPoints ?? 0) < cost) {
    alert(`Pas assez de points de rituel (il en faut ${cost}).`);
    return;
  }

  const isConvocation =
    isKhorneFactionContext() && prayer.id.startsWith("convocation_");

  if (isConvocation) {
    if (currentPhase().id !== "hero") {
      alert(
        "Les convocations se placent en phase des héros. Passe à cette phase pour ajouter l’invocation au suivi.",
      );
      return;
    }
    if (!CONVOCATION_PRAYER_TO_UNIT[prayer.id]) {
      alert("Convocation non reliée à un profil d’invocation.");
      return;
    }
    const placeInvocation = el.prayerConvocationSuccess?.checked === true;
    priest.ritualPoints = (priest.ritualPoints ?? 0) - cost;
    priest.buffs = priest.buffs || [];

    if (!placeInvocation) {
      priest.buffs.push({
        id: uid(),
        label: `${prayer.name} — non placée cette fois (note les dés sur la table)`,
        hit: 0,
        wound: 0,
        save: 0,
        rend: 0,
        expiresNextHero: true,
        castTurn: state.battle.playerTurnNumber,
      });
      persist();
      openDetail(priest.id);
      renderBattle();
      return;
    }

    const spawnedInv = spawnInvocationFromPrayer(prayer.id, priest.id);
    persist();
    openDetail(spawnedInv.id);
    renderBattle();
    return;
  }

  if (isKhorneFactionContext() && prayer.id === "sang_bouillant") {
    priest.ritualPoints = (priest.ritualPoints ?? 0) - cost;
    priest.buffs = priest.buffs || [];
    priest.buffs.push({
      id: uid(),
      label: `${prayer.name} — noter cible ennemie 18"`,
      hit: 0,
      wound: 0,
      save: 0,
      rend: 0,
      expiresNextHero: true,
      castTurn: state.battle.playerTurnNumber,
    });
    persist();
    openDetail(priest.id);
    renderBattle();
    return;
  }

  if (!tid) {
    alert("Choisis une cible alliée.");
    return;
  }

  const target = state.instances.find((i) => i.id === tid);
  if (!target) {
    alert("Cible invalide.");
    return;
  }

  priest.ritualPoints = (priest.ritualPoints ?? 0) - cost;
  target.buffs = target.buffs || [];
  if (isKhorneFactionContext() && prayer.id === "rage_incontrolable") {
    target.buffs.push({
      id: uid(),
      label: `${prayer.name} (Trempés de sang)`,
      hit: 0,
      wound: 0,
      save: 0,
      rend: 0,
      expiresNextHero: true,
      castTurn: state.battle.playerTurnNumber,
    });
  } else {
    target.buffs.push({
      id: uid(),
      label: prayer.name,
      hit: 0,
      wound: 0,
      save: 0,
      rend: 0,
      expiresNextHero: true,
      castTurn: state.battle.playerTurnNumber,
    });
  }
  persist();
  openDetail(target.id);
  renderBattle();
});

el.prayerSelect?.addEventListener("change", () => {
  updatePrayerFormHints();
  refreshPrayerTargets();
});

el.btnResetSave?.addEventListener("click", () => {
  if (confirm("Effacer toutes les données sauvegardées ?")) {
    localStorage.removeItem(STORAGE_KEY);
    state = defaultGameState();
    persist();
    renderSetup();
  }
});

el.viewBattle?.addEventListener("click", (e) => {
  const openTr = e.target.closest?.(".tracker-open");
  if (openTr?.dataset?.iid) {
    openDetail(openTr.dataset.iid);
    return;
  }
  const t = e.target;
  if (t && t.id === "btn-deploy-done") {
    pushBattlePhaseSnapshot();
    state.battle.phaseIndex = 1;
    state.battle.commandPoints = CP_MAX;
    state.battle.activeSide =
      state.setup.whoStartsFirst === "opponent" ? "opponent" : "player";
    state.battle.battleRound = 1;
    state.battle.playerTurnNumber = 1;
    state.battle.startingArmySize = state.instances.length;
    if (state.battle.deadUnitsCount == null) state.battle.deadUnitsCount = 0;
    const tg =
      state.setup.totalGameUnits != null && state.setup.totalGameUnits >= 1
        ? state.setup.totalGameUnits
        : Math.max(1, state.instances.length * 2);
    state.battle.totalGameUnits = tg;
    persist();
    renderBattle();
    return;
  }
  const titheId = t?.closest?.("[data-tithe-unlock]")?.dataset?.titheUnlock;
  if (titheId) tryUnlockTithe(titheId);
  const outgoingApply = t?.closest?.("[data-outgoing-apply]")?.dataset
    ?.outgoingApply;
  if (outgoingApply) tryApplyOutgoingEnemyEffect(outgoingApply);
  const removeBtn = t?.closest?.("[data-outgoing-remove-key]");
  if (removeBtn?.dataset?.outgoingRemoveKey != null) {
    try {
      const key = decodeURIComponent(removeBtn.dataset.outgoingRemoveKey);
      if (key) removeOutgoingUnitEffectByKey(key);
    } catch {
      /* ignore */
    }
    return;
  }
});

el.viewBattle?.addEventListener("change", (e) => {
  const t = e.target;
  if (!state.battle) return;
  if (t.classList.contains("combat-show-all")) {
    combatTrackerShowAll = t.checked;
    renderBattle();
    return;
  }
  if (
    t.classList.contains("seraphon-itzl-pursue") ||
    t.classList.contains("seraphon-coatl-spent")
  ) {
    const b = state.battle;
    if (b) {
      b.seraphon = b.seraphon || {
        itzlPursue: false,
        coatlUsed: false,
      };
      if (t.classList.contains("seraphon-itzl-pursue")) {
        b.seraphon.itzlPursue = t.checked;
      }
      if (t.classList.contains("seraphon-coatl-spent")) {
        b.seraphon.coatlUsed = t.checked;
      }
      persist();
      partyKit.schedulePartySnapshotPush();
      renderBattle();
    }
    return;
  }
  if (
    t.classList.contains("sylvaneth-faine-used") ||
    t.classList.contains("sylvaneth-trone-active") ||
    t.classList.contains("sylvaneth-chant-active")
  ) {
    if (!isSylvanethFactionContext() || !state.battle) return;
    const sy = (state.battle.sylvaneth = state.battle.sylvaneth || {
      faineAgesUsed: false,
      troneVigneActive: false,
      chantArbresActive: false,
    });
    if (t.classList.contains("sylvaneth-faine-used")) sy.faineAgesUsed = t.checked;
    if (t.classList.contains("sylvaneth-trone-active"))
      sy.troneVigneActive = t.checked;
    if (t.classList.contains("sylvaneth-chant-active"))
      sy.chantArbresActive = t.checked;
    persist();
    maybeSchedulePartySnapshotPush();
    renderBattle();
    return;
  }
  if (t.classList.contains("tracker-pv")) {
    const iidPv = t.dataset?.iid;
    if (!iidPv) return;
    const instPv = state.instances.find((i) => i.id === iidPv);
    if (!instPv || instPv.destroyed) return;
    const v = parseInt(t.value, 10);
    instPv.woundsCurrent = Number.isFinite(v) ? v : "";
    persist();
    renderBattle();
    return;
  }
  if (!isPlayerTurn(state.battle)) return;
  if (t.classList.contains("tracker-consang-rage")) {
    const b = state.battle;
    if (t.checked && !b.consangRageUsed) {
      b.consangRageActive = true;
      b.consangRageUsed = true;
    } else if (!t.checked) {
      b.consangRageActive = false;
    }
    persist();
    renderBattle();
    return;
  }
  if (t.classList.contains("tracker-destroyed")) {
    const did = t.dataset?.iid;
    if (!did) return;
    const instD = state.instances.find((i) => i.id === did);
    if (!instD) return;
    ensureInstanceTracking(instD);
    const wasDest = instD.destroyed === true;
    instD.destroyed = t.checked;
    if (t.checked && !wasDest) {
      if (instD.isInvocation) {
        if (isKhorneFactionContext()) {
          state.battle.bloodTithe = (state.battle.bloodTithe || 0) + 1;
        }
      } else {
        state.battle.deadUnitsCount = (state.battle.deadUnitsCount ?? 0) + 1;
      }
    } else if (!t.checked && wasDest) {
      if (instD.isInvocation) {
        if (isKhorneFactionContext()) {
          state.battle.bloodTithe = Math.max(
            0,
            (state.battle.bloodTithe || 0) - 1,
          );
        }
      } else {
        state.battle.deadUnitsCount = Math.max(
          0,
          (state.battle.deadUnitsCount ?? 0) - 1,
        );
      }
    }
    persist();
    renderBattle();
    return;
  }
  if (t.classList.contains("sidebar-rage-trempes")) {
    const sid = t.dataset?.iid;
    if (!sid) return;
    const instS = state.instances.find((i) => i.id === sid);
    if (!instS) return;
    ensureInstanceTracking(instS);
    instS.rageIncontrolableTrempes = t.checked;
    persist();
    renderBattle();
    return;
  }
  if (t.classList.contains("sidebar-rage-recite8")) {
    const sid8 = t.dataset?.iid;
    if (!sid8) return;
    const inst8 = state.instances.find((i) => i.id === sid8);
    if (!inst8) return;
    ensureInstanceTracking(inst8);
    inst8.rageIncontrolableRecite8plus = t.checked;
    persist();
    renderBattle();
    return;
  }
  const iid = t.dataset?.iid;
  if (!iid) return;
  const inst = state.instances.find((i) => i.id === iid);
  if (!inst) return;

  if (t.classList.contains("tracker-melee")) {
    inst.inMelee = t.checked;
    persist();
    renderBattle();
    return;
  }
  if (t.classList.contains("tracker-syl-wood-9")) {
    ensureInstanceTracking(inst);
    inst.sylWithin9OfWood = t.checked;
    persist();
    renderBattle();
    return;
  }
  if (t.classList.contains("tracker-charged")) {
    inst.chargedThisTurn = t.checked;
    persist();
    renderBattle();
    return;
  }
  if (t.classList.contains("tracker-horde-obj")) {
    ensureInstanceTracking(inst);
    inst.hordeObjectiveContested = t.checked;
    persist();
    renderBattle();
    return;
  }
  if (t.classList.contains("tracker-claws-pack")) {
    ensureInstanceTracking(inst);
    inst.clawsPack12 = t.checked;
    persist();
    renderBattle();
    return;
  }
  if (t.classList.contains("tracker-despote-band")) {
    ensureInstanceTracking(inst);
    inst.despoteBand12 = t.checked;
    persist();
    renderBattle();
    return;
  }
  if (t.classList.contains("tracker-ij-waaagh-aura")) {
    ensureInstanceTracking(inst);
    inst.ironjawzInWaaaghAura = t.checked;
    persist();
    renderBattle();
    return;
  }
  if (t.classList.contains("tracker-ij-charge-8")) {
    ensureInstanceTracking(inst);
    inst.ironjawzChargeRoll8Plus = t.checked;
    persist();
    renderBattle();
    return;
  }
});

el.btnDrawerUnits?.addEventListener("click", () => toggleUnitsDrawer());
el.btnDrawerEnemy?.addEventListener("click", () => toggleEnemyDrawer());
el.btnDrawerPc?.addEventListener("click", () => togglePcDrawer());
el.btnDrawerTithe?.addEventListener("click", () => toggleTitheDrawer());
el.btnCloseDrawerPc?.addEventListener("click", () => closeDrawers());
el.btnCloseDrawerUnits?.addEventListener("click", () => closeDrawers());
el.btnCloseDrawerEnemy?.addEventListener("click", () => closeDrawers());
el.btnCloseDrawerTithe?.addEventListener("click", () => closeDrawers());
el.btnCloseEnemyDetail?.addEventListener("click", () => {
  if (el.enemyDetailPanel) el.enemyDetailPanel.hidden = true;
});
el.btnEnemyDemo?.addEventListener("click", () => {
  if (!state.battle) return;
  applyOpponentUnitsToBattle(state.battle, [
    {
      id: "demo-1",
      catalogId: "blood_warriors",
      name: "",
      woundsCurrent: 8,
      woundsMax: 10,
      destroyed: false,
      buffs: [],
    },
    {
      id: "demo-2",
      catalogId: "ij_brutes",
      name: "",
      woundsCurrent: 15,
      woundsMax: 15,
      destroyed: false,
      buffs: [{ label: "Exemple d’effet" }],
    },
  ]);
  persist();
  renderBattle();
  openEnemyDrawer();
});
el.drawerBackdrop?.addEventListener("click", () => closeDrawers());

document.addEventListener("keydown", (e) => {
  if (e.key !== "Escape" || el.viewBattle?.hidden) return;
  if (!el.drawerBackdrop?.hidden) closeDrawers();
});

document.getElementById("btn-preset-save")?.addEventListener("click", () => {
  const inp = document.getElementById("setup-preset-label");
  let label = (inp?.value || "").trim();
  if (!label) label = (state.setup.armyName || "").trim();
  if (!label) {
    const d = new Date();
    label = `Liste ${d.toLocaleDateString("fr-FR")} ${d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`;
  }
  const list = loadArmyPresets();
  if (list.length >= MAX_ARMY_PRESETS) {
    alert(
      `Tu ne peux enregistrer que ${MAX_ARMY_PRESETS} listes. Supprimes-en une avant d’en ajouter.`,
    );
    return;
  }
  const preset = buildPresetFromCurrentState(label);
  preset.label = label;
  list.push(preset);
  saveArmyPresetsList(list);
  if (inp) inp.value = "";
  refreshArmyPresetControls();
  const sel = document.getElementById("setup-preset-select");
  if (sel) {
    sel.value = preset.id;
    const btnLoad = document.getElementById("btn-preset-load");
    const btnDel = document.getElementById("btn-preset-delete");
    if (btnLoad) btnLoad.disabled = false;
    if (btnDel) btnDel.disabled = false;
  }
});

document.getElementById("btn-preset-load")?.addEventListener("click", () => {
  const sel = document.getElementById("setup-preset-select");
  const id = sel?.value;
  if (!id) return;
  const p = loadArmyPresets().find((x) => x.id === id);
  if (!p) return;
  applyArmyPreset(p);
  renderSetup();
});

document.getElementById("btn-preset-delete")?.addEventListener("click", () => {
  const sel = document.getElementById("setup-preset-select");
  const id = sel?.value;
  if (!id) return;
  if (!confirm("Supprimer cette liste enregistrée ?")) return;
  const next = loadArmyPresets().filter((x) => x.id !== id);
  saveArmyPresetsList(next);
  refreshArmyPresetControls();
});

document
  .getElementById("setup-preset-select")
  ?.addEventListener("change", () => {
    refreshArmyPresetControls();
  });

document.addEventListener("change", (e) => {
  const t = e.target;
  if (t.classList.contains("detail-ij-esprit-gork")) {
    const iid = t.dataset?.iid;
    const inst = state.instances.find((i) => i.id === iid);
    if (!inst) return;
    ensureInstanceTracking(inst);
    inst.ironjawzEspritDeGork = t.checked === true;
    persist();
    renderBattle();
    if (el.detailPanel && el.detailPanel.dataset.targetId === iid)
      renderDetailPanel(iid);
    return;
  }
  if (t.classList.contains("detail-ij-ambrivoire-weapon")) {
    const iid = t.dataset?.iid;
    const inst = state.instances.find((i) => i.id === iid);
    if (!inst) return;
    const v = parseInt(t.value, 10);
    inst.ironjawzAmbrivoireWeaponIndex = Number.isFinite(v) ? v : 0;
    persist();
    renderBattle();
    if (el.detailPanel && el.detailPanel.dataset.targetId === iid)
      renderDetailPanel(iid);
    return;
  }
  if (t.classList.contains("ironjawz-waaagh-hero-select")) {
    if (!state.battle || !isPeauxVertesFactionContext()) return;
    state.battle.ironjawzWaaaghTriggerInstanceId = t.value || "";
    persist();
    return;
  }
  if (t.classList.contains("ironjawz-waaagh-declare")) {
    if (
      !state.battle ||
      !isPeauxVertesFactionContext() ||
      !isPlayerTurn(state.battle)
    )
      return;
    const b = state.battle;
    if (t.checked) {
      let sid =
        document.querySelector(".ironjawz-waaagh-hero-select")?.value || "";
      if (!sid) {
        const heroes = ironjawzHeroInstancesForWaaagh();
        const g = heroes.find(
          (i) => getUnitById(i.catalogId)?.id === "ij_gordrakk",
        );
        sid = g?.id || heroes[0]?.id || "";
      }
      if (!sid) {
        alert("Choisis d’abord un héros Mâchefer déclencheur.");
        t.checked = false;
        return;
      }
      b.ironjawzWaaaghUsedThisBattle = true;
      b.ironjawzWaaaghTriggerInstanceId = sid;
      b.ironjawzWaaaghAuraActiveThisPlayerTurn = true;
      persist();
      renderBattle();
    }
    return;
  }
  if (t.classList.contains("soulblight-legions-used")) {
    if (
      !state.battle ||
      !isSoulblightFactionContext() ||
      !isPlayerTurn(state.battle)
    )
      return;
    state.battle.soulblightLegionsSansFinUsedBattle = t.checked === true;
    persist();
    renderBattle();
    return;
  }
  if (t.classList.contains("tracker-sb-volonte-d6")) {
    const iid = t.dataset?.iid;
    const inst = state.instances.find((i) => i.id === iid);
    if (!inst) return;
    ensureInstanceTracking(inst);
    const raw = String(t.value || "").trim();
    if (raw === "") inst.volonteControlD6 = "";
    else {
      const n = parseInt(raw, 10);
      inst.volonteControlD6 =
        Number.isFinite(n) && n >= 1 && n <= 6 ? String(n) : "";
    }
    persist();
    renderBattle();
    return;
  }
  if (t.classList.contains("tracker-sb-garde-royale")) {
    if (
      !state.battle ||
      !isSoulblightFactionContext() ||
      !isPlayerTurn(state.battle)
    )
      return;
    const iid = t.dataset?.iid;
    const inst = state.instances.find((i) => i.id === iid);
    if (!inst) return;
    ensureInstanceTracking(inst);
    inst.soulblightGardeRoyaleMelee = t.checked === true;
    persist();
    renderBattle();
    if (el.detailPanel?.dataset.targetId === iid) renderDetailPanel(iid);
    return;
  }
  if (t.classList.contains("tracker-sb-roi-crit")) {
    if (
      !state.battle ||
      !isSoulblightFactionContext() ||
      !isPlayerTurn(state.battle)
    )
      return;
    const iid = t.dataset?.iid;
    const inst = state.instances.find((i) => i.id === iid);
    if (!inst) return;
    ensureInstanceTracking(inst);
    inst.soulblightRoiOsCrit2Touches = t.checked === true;
    persist();
    renderBattle();
    if (el.detailPanel?.dataset.targetId === iid) renderDetailPanel(iid);
    return;
  }
  if (t.classList.contains("tracker-sb-saint-massacre")) {
    if (
      !state.battle ||
      !isSoulblightFactionContext() ||
      !isPlayerTurn(state.battle)
    )
      return;
    const iid = t.dataset?.iid;
    const inst = state.instances.find((i) => i.id === iid);
    if (!inst) return;
    ensureInstanceTracking(inst);
    const v = String(t.value || "");
    inst.soulblightSaintMassacreChoice =
      v === "move" || v === "atk" || v === "dmg" ? v : "";
    persist();
    renderBattle();
    if (el.detailPanel?.dataset.targetId === iid) renderDetailPanel(iid);
    return;
  }
  if (t.classList.contains("soulblight-sang-vif-success")) {
    if (
      !state.battle ||
      !isSoulblightFactionContext() ||
      !isPlayerTurn(state.battle)
    )
      return;
    if (currentPhase().id !== "hero") return;
    const iid = t.dataset?.iid;
    const inst = state.instances.find((i) => i.id === iid);
    if (!inst) return;
    const u = getUnitById(inst.catalogId);
    if (u?.id !== "sb_prince_vhordrai") return;
    if (!inst.buffs) inst.buffs = [];
    if (t.checked) {
      inst.buffs = inst.buffs.filter(
        (bf) => !String(bf.label || "").includes("Sang-vif"),
      );
      inst.buffs.push({
        id: uid(),
        label: "Frappe en premier (Sang-vif)",
        hit: 0,
        wound: 0,
        save: 0,
        rend: 0,
        expiresNextHero: true,
        castTurn: state.battle.playerTurnNumber,
      });
    } else {
      inst.buffs = inst.buffs.filter(
        (bf) => !String(bf.label || "").includes("Sang-vif"),
      );
    }
    persist();
    renderBattle();
    if (el.detailPanel?.dataset.targetId === iid) renderDetailPanel(iid);
    return;
  }
});

document.addEventListener("click", (e) => {
  const ondeBtn = e.target.closest(".btn-soulblight-onde-resolved");
  if (ondeBtn) {
    if (
      !state.battle ||
      !isSoulblightFactionContext() ||
      !isPlayerTurn(state.battle)
    )
      return;
    const mach = soulblightInstanceAliveByCatalogId("sb_machine_mortis");
    if (!mach) return;
    ensureInstanceTracking(mach);
    mach.soulblightMachineMortisEnergy = 1;
    persist();
    renderBattle();
    if (el.detailPanel?.dataset.targetId === mach.id) renderDetailPanel(mach.id);
    return;
  }

  const machE = e.target.closest(".btn-sb-machine-energy");
  if (machE) {
    if (
      !state.battle ||
      !isSoulblightFactionContext() ||
      !isPlayerTurn(state.battle)
    )
      return;
    const iid = machE.dataset?.iid;
    const inst = state.instances.find((i) => i.id === iid);
    if (!inst || getUnitById(inst.catalogId)?.id !== "sb_machine_mortis") return;
    ensureInstanceTracking(inst);
    const act = machE.dataset?.act;
    let en = Number(inst.soulblightMachineMortisEnergy) || 1;
    if (act === "minus") en = Math.max(1, en - 1);
    else if (act === "plus") en = Math.min(6, en + 1);
    inst.soulblightMachineMortisEnergy = en;
    persist();
    renderBattle();
    if (el.detailPanel?.dataset.targetId === iid) renderDetailPanel(iid);
    return;
  }

  const chT = e.target.closest(".btn-chevalier-tertres-restore");
  if (chT) {
    if (!state.battle || !isSoulblightFactionContext()) return;
    if (currentPhase().id !== "end") return;
    const iid = chT.dataset?.iid;
    const inst = state.instances.find((i) => i.id === iid);
    if (!inst || inst.destroyed) return;
    const u = getUnitById(inst.catalogId);
    if (u?.id !== "sb_chevaliers_tertres") return;
    ensureInstanceTracking(inst);
    const maxW = getWoundsMaxInst(inst, u);
    const curRaw = inst.woundsCurrent;
    const cur =
      curRaw === "" || curRaw == null || maxW == null
        ? maxW
        : Number(curRaw);
    if (maxW == null || cur == null) return;
    inst.woundsCurrent = Math.min(maxW, cur + 3);
    persist();
    renderBattle();
    if (el.detailPanel?.dataset.targetId === iid) renderDetailPanel(iid);
    return;
  }

  const racl = e.target.closest(".btn-raclemorts-raise");
  if (racl) {
    if (!state.battle || !isSoulblightFactionContext()) return;
    if (currentPhase().id !== "end") return;
    const iid = racl.dataset?.iid;
    const n = parseInt(racl.dataset?.n, 10);
    const inst = state.instances.find((i) => i.id === iid);
    if (!inst || inst.destroyed || !Number.isFinite(n) || n < 1) return;
    const u = getUnitById(inst.catalogId);
    if (u?.id !== "sb_squelettes_raclemorts") return;
    ensureInstanceTracking(inst);
    const maxW = getWoundsMaxInst(inst, u);
    const curRaw = inst.woundsCurrent;
    const cur =
      curRaw === "" || curRaw == null || maxW == null
        ? maxW
        : Number(curRaw);
    if (maxW == null || cur == null) return;
    const missing = maxW - cur;
    const add = Math.min(n, missing);
    if (add <= 0) return;
    inst.woundsCurrent = cur + add;
    persist();
    renderBattle();
    if (el.detailPanel?.dataset.targetId === iid) renderDetailPanel(iid);
    return;
  }

  const btn =
    e.target.closest(".btn-waaagh-tok-minus") ||
    e.target.closest(".btn-waaagh-tok-plus") ||
    e.target.closest(".btn-waaagh-tok-spend");
  if (!btn) return;
  const iid = btn.dataset?.iid;
  if (!iid) return;
  const inst = state.instances.find((i) => i.id === iid);
  if (!inst) return;
  const u = getUnitById(inst.catalogId);
  if (!u || (u.id !== "ij_gordrakk" && u.id !== "ij_megaboss")) return;
  if (!isPeauxVertesFactionContext()) return;
  ensureInstanceTracking(inst);
  if (btn.classList.contains("btn-waaagh-tok-minus")) {
    inst.waaaghVictoryTokens = Math.max(0, (inst.waaaghVictoryTokens ?? 0) - 1);
  } else if (btn.classList.contains("btn-waaagh-tok-plus")) {
    inst.waaaghVictoryTokens = Math.min(3, (inst.waaaghVictoryTokens ?? 0) + 1);
  } else if (btn.classList.contains("btn-waaagh-tok-spend")) {
    const n = inst.waaaghVictoryTokens ?? 0;
    if (n <= 0) return;
    inst.waaaghSpentAttackBonus = (inst.waaaghSpentAttackBonus ?? 0) + n;
    inst.waaaghVictoryTokens = 0;
  }
  persist();
  renderBattle();
  if (el.detailPanel?.dataset.targetId === iid) renderDetailPanel(iid);
});

window.__WH_multiplayer = {
  buildArmySnapshot: buildMyArmySnapshotForSync,
  applyOpponentUnits: (units) => {
    if (!state.battle) return;
    applyOpponentUnitsToBattle(state.battle, units);
    persist();
    renderBattle();
  },
};

try {
  renderSetup();
  window.__AOS_KHORNE_READY = true;
  const setupErr = document.getElementById("setup-js-error");
  if (setupErr) setupErr.hidden = true;
} catch (err) {
  console.error(err);
  window.__AOS_KHORNE_READY = false;
  const setupErr = document.getElementById("setup-js-error");
  const detail = document.getElementById("setup-js-error-detail");
  if (setupErr) {
    setupErr.hidden = false;
    const strong = setupErr.querySelector("strong");
    if (strong) {
      strong.textContent =
        "Erreur lors du chargement de l’interface. Détail dans la console (F12).";
    }
    if (detail) {
      detail.textContent =
        "Une erreur s’est produite pendant l’initialisation (souvent un bug à signaler).";
    }
  }
}
