import { Elysia, t } from "elysia";
import { FileStorageService } from "../services/fileStorage";

export const sessionsRoute = (storage: FileStorageService) =>
  new Elysia({ prefix: "/api/v1" })
    // GET /api/v1/sessions - List all sessions
    .get("/sessions", async () => {
      const summaries = await storage.getSessionSummaries();

      return {
        sessions: summaries,
        total: summaries.length
      };
    })

    // GET /api/v1/sessions/:id - Get session details
    .get(
      "/sessions/:id",
      async ({ params, error }) => {
        const session = await storage.getSessionById(params.id);

        if (!session) {
          return error(404, {
            error: "Not Found",
            message: `Session with ID '${params.id}' not found`,
            statusCode: 404
          });
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

    // GET /api/v1/sessions/:id/requests - Get all requests in a session
    .get(
      "/sessions/:id/requests",
      async ({ params, error }) => {
        const session = await storage.getSessionById(params.id);

        if (!session) {
          return error(404, {
            error: "Not Found",
            message: `Session with ID '${params.id}' not found`,
            statusCode: 404
          });
        }

        return {
          session_id: session.session_id,
          transactions: session.transactions,
          total: session.transactions.length
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
    });
