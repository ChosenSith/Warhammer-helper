/**
 * Couche de synchronisation multijoueur (préparation diffuseur WebSocket / room).
 *
 * Modèle cible :
 * - Plusieurs joueurs rejoignent un salon (`setup.roomCode`, rôle hôte / invité).
 * - Chaque joueur choisit une équipe : 1 … 10 (`MAX_TEAMS` dans game-app.js) — plusieurs joueurs peuvent partager le même numéro.
 * - Chaque client garde son armée locale (`state.instances`) ; le diffuseur envoie aux autres clients les snapshots à afficher dans `battle.opponentUnits`.
 * - Côté client, `buildMyArmySnapshotForSync()` (game-app.js) produit le JSON à publier ; `applyOpponentUnitsToBattle` fusionne la liste reçue.
 *
 * @typedef {object} OpponentUnitSnapshot
 * @property {string} id — identifiant stable côté adversaire
 * @property {string} catalogId — id warscroll dans le catalogue fusionné
 * @property {string} [name] — libellé affiché (fallback : nom catalogue)
 * @property {number} woundsMax
 * @property {number} woundsCurrent
 * @property {boolean} [destroyed]
 * @property {{label?: string}[]} [buffs] — rappels visibles côté ennemi
 */

/**
 * @param {unknown} raw
 * @returns {object | null}
 */
export function normalizeOpponentUnit(raw) {
  if (!raw || typeof raw !== "object") return null;
  const o = /** @type {Record<string, unknown>} */ (raw);
  const catalogId = String(o.catalogId ?? "").trim();
  if (!catalogId) return null;
  const id = String(o.id ?? "").trim() || `opp-${catalogId}-${Math.random().toString(36).slice(2, 9)}`;
  const name = String(o.name ?? "").trim();
  const woundsMax = Number(o.woundsMax);
  const woundsCurrent = Number(o.woundsCurrent);
  return {
    id,
    catalogId,
    name,
    woundsMax: Number.isFinite(woundsMax) ? Math.max(0, woundsMax) : 0,
    woundsCurrent: Number.isFinite(woundsCurrent) ? Math.max(0, woundsCurrent) : 0,
    destroyed: o.destroyed === true,
    buffs: Array.isArray(o.buffs) ? o.buffs : [],
  };
}

/**
 * Remplace la liste des unités adverses visibles (reçue du réseau).
 * @param {{ opponentUnits?: unknown[] } | null | undefined} battle
 * @param {unknown[]} units
 */
export function applyOpponentUnitsToBattle(battle, units) {
  if (!battle) return;
  const list = Array.isArray(units)
    ? units.map(normalizeOpponentUnit).filter(Boolean)
    : [];
  battle.opponentUnits = list;
}

/** Aligné sur MAX_TEAMS (10) côté game-app — évite une dépendance circulaire. */
export function normalizeTeamIdSync(v) {
  const n = Math.floor(Number(v));
  if (!Number.isFinite(n)) return 1;
  const x = Math.max(1, Math.min(10, n));
  return x;
}

import { normalizeOutgoingUnitEffect } from "./battle-effects.js";

/**
 * Fusionne un message `army_snapshot` reçu du salon : unités des autres équipes uniquement.
 * Les unités d’un même client remplacent la liste précédente de ce client (clé `remoteClientId`).
 * @param {{ opponentUnits?: unknown[], remoteFactionEffectsByClient?: object, remoteUnitEffectsByClient?: object }} battle
 * @param {unknown} payload
 * @param {unknown} myTeamId
 */
export function applyRemoteArmySnapshot(battle, payload, myTeamId) {
  if (!battle || !payload || typeof payload !== "object") return;
  const p = /** @type {Record<string, unknown>} */ (payload);
  if (p.type !== "army_snapshot") return;
  const mine = normalizeTeamIdSync(myTeamId);
  const theirs = normalizeTeamIdSync(p.teamId);
  if (theirs === mine) return;

  const clientId = String(p.clientId ?? "").trim() || "anon";
  const prev = Array.isArray(battle.opponentUnits) ? battle.opponentUnits : [];
  const others = prev.filter(
    (u) =>
      !u ||
      typeof u !== "object" ||
      /** @type {{ remoteClientId?: string }} */ (u).remoteClientId !==
        clientId,
  );
  const incoming = Array.isArray(p.units) ? p.units : [];
  const next = [];
  for (const raw of incoming) {
    if (!raw || typeof raw !== "object") continue;
    const ru = /** @type {Record<string, unknown>} */ (raw);
    const uid = String(ru.id ?? "").replace(/:/g, "_");
    const n = normalizeOpponentUnit({
      ...ru,
      id: `${clientId}:${uid}`,
    });
    if (n) {
      n.remoteClientId = clientId;
      next.push(n);
    }
  }
  battle.opponentUnits = [...others, ...next];

  if (!battle.remoteFactionEffectsByClient) battle.remoteFactionEffectsByClient = {};
  if (Object.prototype.hasOwnProperty.call(p, "factionEffects")) {
    battle.remoteFactionEffectsByClient[clientId] = {
      factionId: String(p.factionId ?? ""),
      effects: Array.isArray(p.factionEffects) ? p.factionEffects : [],
    };
  }

  if (!battle.remoteUnitEffectsByClient) battle.remoteUnitEffectsByClient = {};
  if (Object.prototype.hasOwnProperty.call(p, "unitEffectsOnOthers")) {
    const rawEffects = Array.isArray(p.unitEffectsOnOthers)
      ? p.unitEffectsOnOthers
      : [];
    battle.remoteUnitEffectsByClient[clientId] = rawEffects
      .map(normalizeOutgoingUnitEffect)
      .filter(Boolean);
  }
}
