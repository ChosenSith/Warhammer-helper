/**
 * Effets de bataille synchronisés (dîmes, débuffs ciblés) et lecture des effets distants.
 */
import { isKhorneFactionId } from "./data/khorne-catalog.js";

/** @typedef {{ id: string }} FactionEffect */

/**
 * @param {{ battle?: object, setup?: object }} state
 * @returns {FactionEffect[]}
 */
export function buildFactionEffectsPayload(state) {
  const b = state.battle;
  const fid = state.setup?.factionId;
  const arr = [];
  if (!b || !fid) return arr;
  if (isKhorneFactionId(fid)) {
    if (b.titheUnlocked?.un_combat_glorieux) {
      arr.push({ id: "un_combat_glorieux" });
    }
    if (b.titheUnlocked?.euphorie_combat) {
      arr.push({ id: "euphorie_combat" });
    }
  }
  return arr;
}

/**
 * @param {Record<string, unknown>} byClient
 * @param {string} effectId
 */
function anyRemoteClientHasEffect(byClient, effectId) {
  for (const rec of Object.values(byClient || {})) {
    if (!rec || typeof rec !== "object") continue;
    const eff = /** @type {{ effects?: { id?: string }[] }} */ (rec).effects;
    if (!Array.isArray(eff)) continue;
    if (eff.some((e) => e && e.id === effectId)) return true;
  }
  return false;
}

/**
 * @param {{ setup?: object, battle?: object }} state
 * @param {string} effectId
 */
export function remoteHasSyncedEffect(state, effectId) {
  return anyRemoteClientHasEffect(
    state.battle?.remoteFactionEffectsByClient || {},
    effectId,
  );
}

/**
 * Malus pour toucher (tir) contre les Lames de Khorne si un adversaire a débloqué la dîme.
 * @param {{ setup?: object, battle?: object }} state
 * @returns {number} somme pour applyRollBonus (négatif = malus au tir)
 */
export function getShootingHitPenaltyVsKhorne(state) {
  const fid = state.setup?.factionId;
  if (!fid || isKhorneFactionId(fid)) return 0;
  const by = state.battle?.remoteFactionEffectsByClient || {};
  if (anyRemoteClientHasEffect(by, "un_combat_glorieux")) return -1;
  return 0;
}

/**
 * Effet « cible ennemie » valable pour la manche de bataille en cours (un round = une manche).
 * @param {object} e
 * @param {number} battleRound
 */
export function isOutgoingEffectActiveForBattleRound(e, battleRound) {
  if (e == null || typeof e !== "object") return false;
  const br = e.battleRound != null ? Number(e.battleRound) : NaN;
  const cur = Number(battleRound);
  if (!Number.isFinite(cur)) return true;
  if (!Number.isFinite(br)) return true;
  return br === cur;
}

/**
 * @param {object} inst
 * @param {{ battle?: object }} state
 */
export function collectIncomingRemoteBuffsForInstance(inst, state) {
  const b = state.battle;
  const syncId = String(state.setup?.syncClientId || "").trim();
  if (!b || !syncId || !inst?.id) return [];
  const myRemoteId = `${syncId}:${inst.id}`;
  const br = b.battleRound ?? 1;
  const by = b.remoteUnitEffectsByClient || {};
  const out = [];
  for (const effects of Object.values(by)) {
    if (!Array.isArray(effects)) continue;
    for (const e of effects) {
      if (!e || typeof e !== "object") continue;
      if (String(e.targetRemoteId || "") === myRemoteId) {
        if (isOutgoingEffectActiveForBattleRound(e, br)) out.push(e);
      }
    }
  }
  return out;
}

/**
 * @param {object} row
 * @param {{ battle?: object }} state
 */
export function mergeOutgoingBuffsForEnemyRow(row, state) {
  const b = state.battle;
  const rid = row?.id;
  if (!b || !rid) return row?.buffs ? [...row.buffs] : [];
  const br = b.battleRound ?? 1;
  const labels = [];
  for (const e of b.myOutgoingUnitEffects || []) {
    if (!isOutgoingEffectActiveForBattleRound(e, br)) continue;
    if (String(e.targetRemoteId || "") === String(rid)) {
      labels.push({ label: e.label || "Effet" });
    }
  }
  const base = Array.isArray(row.buffs) ? row.buffs.map((x) => ({ ...x })) : [];
  return [...base, ...labels];
}

/**
 * @param {unknown} raw
 */
export function normalizeOutgoingUnitEffect(raw) {
  if (!raw || typeof raw !== "object") return null;
  const o = /** @type {Record<string, unknown>} */ (raw);
  const targetRemoteId = String(o.targetRemoteId ?? "").trim();
  if (!targetRemoteId) return null;
  const spellId = String(o.spellId ?? "");
  const effectId = String(o.effectId ?? "");
  return {
    key: String(o.key ?? ""),
    spellId,
    effectId: effectId || spellId,
    targetRemoteId,
    label: String(o.label ?? "Effet"),
    hit: Number(o.hit) || 0,
    wound: Number(o.wound) || 0,
    save: Number(o.save) || 0,
    rend: Number(o.rend) || 0,
    damageMelee: Number(o.damageMelee) || 0,
    castTurn: o.castTurn != null ? Number(o.castTurn) : 0,
    battleRound: o.battleRound != null ? Number(o.battleRound) : 0,
  };
}
