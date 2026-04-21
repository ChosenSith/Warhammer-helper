/**
 * Connexion WebSocket PartyKit + envoi debouncé des snapshots d’armée + messages salon.
 */
import { createPartySocket } from "./partykit-client.js";
import { applyRemoteArmySnapshot } from "./multiplayer-sync.js";

/** @type {WebSocket | null} */
let socket = null;
let debounceTimer = null;
let helloTimer = null;
const DEBOUNCE_MS = 450;
const HELLO_MS = 22000;

/** @type {null | {
 *   getSnapshot: () => object;
 *   getBattle: () => unknown;
 *   getMyTeamId: () => unknown;
 *   onApplied: () => void;
 *   onStatus?: (msg: string) => void;
 *   onSalonMessage?: (data: object) => void;
 *   getSalonHelloPayload?: () => object;
 *   onChannelOpen?: () => void;
 * }} */
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

export function sendPartyMessage(obj) {
  if (!socket || socket.readyState !== 1) return;
  try {
    socket.send(JSON.stringify(obj));
  } catch (e) {
    console.warn("[PartyKit] sendPartyMessage", e);
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

function startSalonHeartbeat() {
  if (helloTimer) clearInterval(helloTimer);
  helloTimer = setInterval(() => {
    if (!ctx?.getSalonHelloPayload || !isPartyConnected()) return;
    try {
      const p = ctx.getSalonHelloPayload();
      if (p) sendPartyMessage(p);
    } catch (e) {
      console.warn("[PartyKit] hello", e);
    }
  }, HELLO_MS);
}

function stopSalonHeartbeat() {
  if (helloTimer) {
    clearInterval(helloTimer);
    helloTimer = null;
  }
}

export function disconnectPartyKit() {
  if (debounceTimer) {
    clearTimeout(debounceTimer);
    debounceTimer = null;
  }
  stopSalonHeartbeat();
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

function dispatchMessage(data) {
  const t = data && typeof data === "object" ? data.type : undefined;

  if (t === "army_snapshot") {
    const b = ctx?.getBattle?.();
    if (b && typeof b === "object") {
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
    }
    return;
  }

  if (
    t === "salon_hello" ||
    t === "salon_ready" ||
    t === "salon_presence"
  ) {
    try {
      ctx?.onSalonMessage?.(data);
    } catch (e) {
      console.warn("[PartyKit] onSalonMessage", e);
    }
  }
}

/**
 * @param {object} opts
 * @param {string} opts.host
 * @param {string} opts.room
 * @param {() => object} opts.getSnapshot
 * @param {() => unknown} opts.getBattle
 * @param {() => unknown} opts.getMyTeamId
 * @param {() => void} opts.onApplied
 * @param {(msg: string) => void} [opts.onStatus]
 * @param {(data: object) => void} [opts.onSalonMessage]
 * @param {() => object} [opts.getSalonHelloPayload]
 * @param {() => void} [opts.onChannelOpen]
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
    onSalonMessage: opts.onSalonMessage,
    getSalonHelloPayload: opts.getSalonHelloPayload,
    onChannelOpen: opts.onChannelOpen,
  };
  opts.onStatus?.("Connexion…");
  const sock = await createPartySocket({ host, room });
  socket = sock;
  sock.addEventListener("open", () => {
    opts.onStatus?.("Connecté au salon.");
    sendSnapshotNow();
    try {
      const hello = ctx?.getSalonHelloPayload?.();
      if (hello) sendPartyMessage(hello);
    } catch (e) {
      console.warn("[PartyKit] hello initial", e);
    }
    startSalonHeartbeat();
    try {
      ctx?.onChannelOpen?.();
    } catch (e) {
      console.warn("[PartyKit] onChannelOpen", e);
    }
  });
  sock.addEventListener("message", (ev) => {
    let data;
    try {
      data = JSON.parse(ev.data);
    } catch {
      return;
    }
    dispatchMessage(data);
  });
  sock.addEventListener("close", () => {
    stopSalonHeartbeat();
    opts.onStatus?.("Déconnecté du salon.");
  });
  sock.addEventListener("error", () => {
    opts.onStatus?.("Erreur WebSocket (vérifie l’hôte et le déploiement).");
  });
  return sock;
}
