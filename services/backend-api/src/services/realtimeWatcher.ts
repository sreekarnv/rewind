import { watch } from "node:fs";
import { stat, readFile } from "node:fs/promises";
import type { Session } from "../types/session";
import { MongoStorageService } from "./mongoStorage";
import type { CapturedSession } from "./fileStorage";

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
  private mongoStorage: MongoStorageService;
  private syncedSessionIds: Set<string> = new Set();

  constructor(dataDir: string, mongoStorage: MongoStorageService) {
    this.dataDir = dataDir;
    this.mongoStorage = mongoStorage;
  }

  start() {
    if (!this.watchInterval) {
      this.startWatching();
    }
  }

  stop() {
    this.stopWatching();
  }

  subscribe(callback: (event: RealtimeEvent) => void): () => void {
    this.subscribers.add(callback);

    return () => {
      this.subscribers.delete(callback);
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
    console.log("Starting real-time file watcher and MongoDB sync...");

    this.watchInterval = setInterval(async () => {
      await this.checkForUpdates();
    }, 1000);
  }

  private stopWatching() {
    if (this.watchInterval) {
      clearInterval(this.watchInterval);
      this.watchInterval = null;
      console.log("Stopped real-time file watcher");
    }
  }

  private async checkForUpdates() {
    try {
      const filePath = `${this.dataDir}/captured_sessions.json`;
      const stats = await stat(filePath);
      const currentModified = stats.mtimeMs;

      if (currentModified > this.lastModified) {
        this.lastModified = currentModified;
        console.log(`Detected changes in captured_sessions.json`);

        await this.syncSessionsToMongo(filePath);

        this.broadcast({
          type: "stats_update",
          data: { timestamp: Date.now() },
        });
      }
    } catch (error) {
      if ((error as any).code !== 'ENOENT') {
        console.error("Error checking for updates:", error);
      }
    }
  }

  private async syncSessionsToMongo(filePath: string) {
    try {
      const fileContent = await readFile(filePath, "utf-8");
      const data = JSON.parse(fileContent);

      if (!data.sessions || !Array.isArray(data.sessions)) {
        return;
      }

      const transformedSessions: CapturedSession[] = [];

      for (const rawSession of data.sessions) {
        if (this.syncedSessionIds.has(rawSession.sessionId)) {
          continue;
        }

        if (!rawSession.transactions || rawSession.transactions.length === 0) {
          continue;
        }

        for (let i = 0; i < rawSession.transactions.length; i++) {
          const txn = rawSession.transactions[i];
          const uniqueSessionId = `${rawSession.sessionId}-txn-${i}`;

          if (this.syncedSessionIds.has(uniqueSessionId)) {
            continue;
          }

          const transformedSession: CapturedSession = {
            sessionId: uniqueSessionId,
            timestamp: new Date(txn.requestTime * 1000).toISOString(),
            sourceIp: rawSession.clientIp,
            sourcePort: rawSession.clientPort,
            destIp: rawSession.serverIp,
            destPort: rawSession.serverPort,
            request: {
              method: txn.request.method,
              uri: txn.request.uri,
              version: txn.request.version,
              headers: this.transformHeaders(txn.request.headers),
              body: txn.request.body
            },
            response: txn.response ? {
              version: txn.response.version,
              statusCode: txn.response.statusCode,
              statusMessage: txn.response.statusMessage,
              headers: this.transformHeaders(txn.response.headers),
              body: txn.response.body
            } : undefined
          };

          transformedSessions.push(transformedSession);
        }

        this.syncedSessionIds.add(rawSession.sessionId);
      }

      if (transformedSessions.length > 0) {
        await this.mongoStorage.saveSessions(transformedSessions);
        transformedSessions.forEach(session => {
          this.syncedSessionIds.add(session.sessionId);
        });
        console.log(`Synced ${transformedSessions.length} new HTTP requests to MongoDB (Total synced: ${this.syncedSessionIds.size})`);
      }
    } catch (error) {
      console.error("Error syncing sessions to MongoDB:", error);
    }
  }

  private transformHeaders(headers: Record<string, string> | undefined): Array<{name: string, value: string}> {
    if (!headers) return [];
    return Object.entries(headers).map(([name, value]) => ({ name, value }));
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

  resetSyncedSessions(): void {
    this.syncedSessionIds.clear();
    console.log("Reset synced sessions tracker");
  }
}
