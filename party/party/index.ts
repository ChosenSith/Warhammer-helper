import type * as Party from "partykit/server";

/**
 * Salon Warhammer Helper : relaie les messages JSON ; enregistre clientId par connexion
 * pour annoncer les départs (`salon_presence` leave).
 */
export default class WarhammerRelay implements Party.Server {
  private connToClient = new Map<string, string>();

  constructor(readonly room: Party.Room) {}

  async onMessage(message: string, sender: Party.Connection) {
    if (typeof message !== "string") return;
    try {
      JSON.parse(message);
    } catch {
      return;
    }
    let data: { clientId?: unknown };
    try {
      data = JSON.parse(message) as { clientId?: unknown };
    } catch {
      return;
    }
    const cid =
      typeof data.clientId === "string" ? data.clientId.trim() : "";
    if (cid) this.connToClient.set(sender.id, cid);

    this.room.broadcast(message, [sender.id]);
  }

  async onClose(connection: Party.Connection) {
    const clientId = this.connToClient.get(connection.id);
    if (!clientId) return;
    this.connToClient.delete(connection.id);
    this.room.broadcast(
      JSON.stringify({
        type: "salon_presence",
        event: "leave",
        clientId,
      }),
    );
  }
}
