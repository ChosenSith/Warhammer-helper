import type * as Party from "partykit/server";

/**
 * Salon Warhammer Helper : relaie tout message JSON texte aux autres clients
 * du même room (l’URL du room = code salon, ex. /parties/main/KHORNE-42).
 * Chaque client envoie des snapshots d’armée / mises à jour ; le serveur ne fait
 * pas de logique métier — uniquement broadcast (hors expéditeur).
 */
export default class WarhammerRelay implements Party.Server {
  constructor(readonly room: Party.Room) {}

  async onMessage(message: string, sender: Party.Connection) {
    if (typeof message !== "string") return;
    try {
      JSON.parse(message);
    } catch {
      return;
    }
    this.room.broadcast(message, [sender.id]);
  }
}
