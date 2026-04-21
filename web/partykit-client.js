/**
 * Client WebSocket PartyKit (à brancher depuis game-app quand tu activeras « en ligne »).
 *
 * Déploiement : depuis le dossier `party/`, `npm run deploy` → hôte du type
 * `https://<projet>.<compte>.partykit.dev` (HTTPS, accessible 4G/Wi‑Fi partout).
 * L’app statique (GitHub Pages, etc.) doit être en HTTPS pour les WebSockets mixtes.
 *
 * Exemple :
 *   const sock = await createPartySocket({
 *     host: "mon-projet.monuser.partykit.dev",
 *     room: state.setup.roomCode || "default",
 *   });
 *   sock.send(JSON.stringify({ type: "army_snapshot", ...buildMyArmySnapshotForSync() }));
 */

export async function createPartySocket({ host, room }) {
  const { default: PartySocket } = await import(
    "https://esm.sh/partysocket@1.0.2"
  );
  return new PartySocket({
    host,
    room,
    party: "main",
  });
}
