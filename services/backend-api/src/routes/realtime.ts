import { Elysia } from "elysia";
import type { RealtimeWatcher } from "../services/realtimeWatcher";
import type { MongoStorageService } from "../services/mongoStorage";

export const realtimeRoute = (
  watcher: RealtimeWatcher,
  storage: MongoStorageService,
) =>
  new Elysia({ prefix: "/api/v1" })
    .ws("/realtime", {
      open(ws) {
        console.log("WebSocket client connected");
        const unsubscribe = watcher.subscribe(async (event) => {
          if (event.type === "stats_update") {
            try {
              const sessions = await storage.getSessionSummaries();
              const stats = await storage.getStats();

              ws.send(
                JSON.stringify({
                  type: "update",
                  data: {
                    sessions,
                    stats,
                    timestamp: Date.now(),
                  },
                }),
              );
            } catch (error) {
              console.error("Error fetching data for WebSocket:", error);
            }
          }
        });

        (ws as any).unsubscribe = unsubscribe;

        (async () => {
          try {
            const sessions = await storage.getSessionSummaries();
            const stats = await storage.getStats();

            ws.send(
              JSON.stringify({
                type: "init",
                data: {
                  sessions,
                  stats,
                  timestamp: Date.now(),
                },
              }),
            );
          } catch (error) {
            console.error("Error sending initial data:", error);
          }
        })();
      },

      message(ws, message: any) {
        try {
          const data = JSON.parse(message.toString());

          if (data.type === "ping") {
            ws.send(JSON.stringify({ type: "pong", timestamp: Date.now() }));
          }
        } catch (error) {
          console.error("Error parsing WebSocket message:", error);
        }
      },

      close(ws) {
        console.log("WebSocket client disconnected");

        const unsubscribe = (ws as any).unsubscribe;
        if (unsubscribe) {
          unsubscribe();
        }
      },
    })

    .get("/realtime/status", () => ({
      status: "active",
      subscribers: watcher.getSubscriberCount(),
      timestamp: Date.now(),
    }));
