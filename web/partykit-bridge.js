/**
 * Connexion WebSocket PartyKit + envoi debouncé des snapshots d’armée.
 * Les callbacks sont fournis par game-app.js (pas d’import de l’état global ici).
 */
import { createPartySocket } from "./partykit-client.js";
import { applyRemoteArmySnapshot } from "./multiplayer-sync.js";

/** @type {WebSocket | null} */
let socket = null;
let debounceTimer = null;
const DEBOUNCE_MS = 450;

/** @type {null | { getSnapshot: () => object; getBattle: () => unknown; getMyTeamId: () => unknown; onApplied: () => void; onStatus?: (msg: string) => void }} */
let ctx = null;

export function normalizePartyHost(host) {
  return String(host ?? "")
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/\/$/, "");
}

export function isPartyConnected() {
  try {
    return !!(socket && socket.readyState === 1);
  } catch {
    return false;
  }
}

function sendSnapshotNow() {
  if (!ctx || !socket || socket.readyState !== 1) return;
  let payload;
  try {
    payload = ctx.getSnapshot();
  } catch (e) {
    console.warn("[PartyKit] getSnapshot", e);
    return;
  }
  try {
    socket.send(JSON.stringify(payload));
  } catch (e) {
    console.warn("[PartyKit] send", e);
  }
}

export function schedulePartySnapshotPush() {
  if (!isPartyConnected() || !ctx) return;
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    debounceTimer = null;
    sendSnapshotNow();
  }, DEBOUNCE_MS);
}

export function disconnectPartyKit() {
  if (debounceTimer) {
    clearTimeout(debounceTimer);
    debounceTimer = null;
  }
  ctx = null;
  if (socket) {
    try {
      socket.close();
    } catch {
      /* ignore */
    }
    socket = null;
  }
}

/**
 * @param {object} opts
 * @param {string} opts.host — hôte PartyKit (sans https://)
 * @param {string} opts.room — code salon = id de room
 * @param {() => object} opts.getSnapshot — JSON complet à envoyer (inclut type, clientId, units…)
 * @param {() => unknown} opts.getBattle
 * @param {() => unknown} opts.getMyTeamId
 * @param {() => void} opts.onApplied — après fusion adverse (ex. renderBattle)
 * @param {(msg: string) => void} [opts.onStatus]
 */
export async function connectPartyKit(opts) {
  disconnectPartyKit();
  const host = normalizePartyHost(opts.host);
  const room = String(opts.room ?? "").trim();
  if (!host || !room) {
    opts.onStatus?.("Indique l’hôte PartyKit et un code salon.");
    throw new Error("party_host_or_room_missing");
  }
  ctx = {
    getSnapshot: opts.getSnapshot,
    getBattle: opts.getBattle,
    getMyTeamId: opts.getMyTeamId,
    onApplied: opts.onApplied,
    onStatus: opts.onStatus,
  };
  opts.onStatus?.("Connexion…");
  const sock = await createPartySocket({ host, room });
  socket = sock;
  sock.addEventListener("open", () => {
    opts.onStatus?.("Connecté au salon.");
    sendSnapshotNow();
  });
  sock.addEventListener("message", (ev) => {
    let data;
    try {
      data = JSON.parse(ev.data);
    } catch {
      return;
    }
    const b = ctx?.getBattle?.();
    if (!b || typeof b !== "object") return;
    applyRemoteArmySnapshot(
      /** @type {{ opponentUnits?: unknown[] }} */ (b),
      data,
      ctx.getMyTeamId?.(),
    );
    try {
      ctx?.onApplied?.();
    } catch (e) {
      console.warn("[PartyKit] onApplied", e);
    }
  });
  sock.addEventListener("close", () => {
    opts.onStatus?.("Déconnecté du salon.");
  });
  sock.addEventListener("error", () => {
    opts.onStatus?.("Erreur WebSocket (vérifie l’hôte et le déploiement).");
  });
  return sock;
}
