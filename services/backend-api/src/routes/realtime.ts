import { Elysia } from "elysia";
import type { RealtimeWatcher } from "../services/realtimeWatcher";
import type { MongoStorageService } from "../services/mongoStorage";
import type { AlertService } from "../services/alertService";

export const realtimeRoute = (
  watcher: RealtimeWatcher,
  storage: MongoStorageService,
  alertService: AlertService,
) =>
  new Elysia({ prefix: "/api/v1" })
    .ws("/realtime", {
      open(ws) {
        console.log("WebSocket client connected");

        // Subscribe to watcher events
        const unsubscribeWatcher = watcher.subscribe(async (event) => {
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

        // Subscribe to notification events
        const notificationHandler = (notification: any) => {
          ws.send(
            JSON.stringify({
              type: "notification",
              data: notification,
            })
          );
        };
        alertService.on("notification", notificationHandler);

        (ws as any).unsubscribeWatcher = unsubscribeWatcher;
        (ws as any).notificationHandler = notificationHandler;

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

        const unsubscribeWatcher = (ws as any).unsubscribeWatcher;
        if (unsubscribeWatcher) {
          unsubscribeWatcher();
        }

        const notificationHandler = (ws as any).notificationHandler;
        if (notificationHandler) {
          alertService.off("notification", notificationHandler);
        }
      },
    })

    .get("/realtime/status", () => ({
      status: "active",
      subscribers: watcher.getSubscriberCount(),
      timestamp: Date.now(),
    }));
