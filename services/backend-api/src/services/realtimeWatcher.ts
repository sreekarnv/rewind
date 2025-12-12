import { watch } from "node:fs";
import { stat } from "node:fs/promises";
import type { Session } from "../types/session";

export type RealtimeEvent =
  | { type: "session_new"; data: Session }
  | { type: "session_update"; data: Session }
  | { type: "stats_update"; data: any }
  | { type: "error"; message: string };

export class RealtimeWatcher {
  private dataDir: string;
  private subscribers: Set<(event: RealtimeEvent) => void> = new Set();
  private lastModified: number = 0;
  private watchInterval: Timer | null = null;

  constructor(dataDir: string) {
    this.dataDir = dataDir;
  }

  subscribe(callback: (event: RealtimeEvent) => void): () => void {
    this.subscribers.add(callback);

    if (this.subscribers.size === 1) {
      this.startWatching();
    }

    return () => {
      this.subscribers.delete(callback);
      if (this.subscribers.size === 0) {
        this.stopWatching();
      }
    };
  }

  private broadcast(event: RealtimeEvent) {
    this.subscribers.forEach((callback) => {
      try {
        callback(event);
      } catch (error) {
        console.error("Error in subscriber callback:", error);
      }
    });
  }

  private startWatching() {
    console.log("Starting real-time file watcher...");

    this.watchInterval = setInterval(async () => {
      await this.checkForUpdates();
    }, 1000);
  }

  private stopWatching() {
    if (this.watchInterval) {
      clearInterval(this.watchInterval);
      this.watchInterval = null;
      console.log("⏹️  Stopped real-time file watcher");
    }
  }

  private async checkForUpdates() {
    try {
      const filePath = `${this.dataDir}/captured_sessions.json`;
      const stats = await stat(filePath);
      const currentModified = stats.mtimeMs;

      if (currentModified > this.lastModified) {
        this.lastModified = currentModified;

        this.broadcast({
          type: "stats_update",
          data: { timestamp: Date.now() },
        });
      }
    } catch (error) {
      // TODO: Need to handle this later
    }
  }

  notifySessionUpdate(session: Session) {
    this.broadcast({
      type: "session_update",
      data: session,
    });
  }

  notifyNewSession(session: Session) {
    this.broadcast({
      type: "session_new",
      data: session,
    });
  }

  getSubscriberCount(): number {
    return this.subscribers.size;
  }
}
