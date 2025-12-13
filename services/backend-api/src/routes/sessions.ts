import { Elysia, t } from "elysia";
import { MongoStorageService } from "../services/mongoStorage";
import type { RealtimeWatcher } from "../services/realtimeWatcher";

export const sessionsRoute = (storage: MongoStorageService, watcher?: RealtimeWatcher) =>
  new Elysia({ prefix: "/api/v1" })
    // GET /api/v1/sessions - List all sessions with pagination
    .get("/sessions", async ({ query }) => {
      const limit = query.limit ? parseInt(query.limit as string) : 100;
      const skip = query.skip ? parseInt(query.skip as string) : 0;

      const [summaries, total] = await Promise.all([
        storage.getSessionSummaries(limit),
        storage.getSessionCount()
      ]);

      return {
        sessions: summaries,
        total,
        limit,
        skip
      };
    })

    // GET /api/v1/sessions/:id - Get session details
    .get(
      "/sessions/:id",
      async ({ params, set }) => {
        const session = await storage.getSession(params.id);

        if (!session) {
          set.status = 404;
          return {
            error: "Not Found",
            message: `Session with ID '${params.id}' not found`,
            statusCode: 404
          };
        }

        return {
          session
        };
      },
      {
        params: t.Object({
          id: t.String()
        })
      }
    )

    // GET /api/v1/stats - Get statistics
    .get("/stats", async () => {
      const stats = await storage.getStats();
      return stats;
    })

    // DELETE /api/v1/sessions/:id - Delete a session
    .delete(
      "/sessions/:id",
      async ({ params, set }) => {
        const deleted = await storage.deleteSession(params.id);

        if (!deleted) {
          set.status = 404;
          return {
            error: "Not Found",
            message: `Session with ID '${params.id}' not found`,
            statusCode: 404
          };
        }

        return {
          message: "Session deleted successfully",
          sessionId: params.id
        };
      },
      {
        params: t.Object({
          id: t.String()
        })
      }
    )

    // POST /api/v1/sessions/filter - Filter sessions
    .post("/sessions/filter", async ({ body }) => {
      const sessions = await storage.filterSessions(
        body as any,
        (body as any).limit || 100
      );

      return {
        sessions,
        total: sessions.length
      };
    })

    // DELETE /api/v1/sessions/clear - Clear all sessions
    .delete("/sessions/clear", async () => {
      const deletedCount = await storage.clearAllSessions();

      if (watcher) {
        watcher.resetSyncedSessions();
      }

      return {
        message: "All sessions cleared successfully",
        deletedCount
      };
    });
