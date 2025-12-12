import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { FileStorageService } from "./services/fileStorage";
import { sessionsRoute } from "./routes/sessions";

const PORT = process.env.PORT || 8000;
const DATA_DIR = process.env.DATA_DIR || "../capture-agent/output";

// Initialize storage service
const storage = new FileStorageService(DATA_DIR);

// Create Elysia app
const app = new Elysia()
  // Add CORS support
  .use(
    cors({
      origin: true, // Allow all origins in development
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
      credentials: true
    })
  )

  // Global error handler
  .onError(({ code, error, set }) => {
    console.error("Error:", error);

    if (code === "NOT_FOUND") {
      set.status = 404;
      return {
        error: "Not Found",
        message: "The requested resource was not found",
        statusCode: 404
      };
    }

    if (code === "VALIDATION") {
      set.status = 400;
      return {
        error: "Bad Request",
        message: "Invalid request parameters",
        statusCode: 400
      };
    }

    set.status = 500;
    return {
      error: "Internal Server Error",
      message: error.message || "An unexpected error occurred",
      statusCode: 500
    };
  })

  // Health check endpoint
  .get("/health", () => ({
    status: "ok",
    timestamp: new Date().toISOString(),
    service: "rewind-backend-api"
  }))

  // API routes
  .use(sessionsRoute(storage))

  // Start server
  .listen(PORT);

console.log(`
🚀 Rewind Backend API is running!

📍 Server: http://localhost:${PORT}
📊 Health: http://localhost:${PORT}/health
📚 API Base: http://localhost:${PORT}/api/v1

Available endpoints:
  GET  /api/v1/sessions           - List all sessions
  GET  /api/v1/sessions/:id       - Get session details
  GET  /api/v1/sessions/:id/requests - Get session requests
  GET  /api/v1/stats              - Get statistics

Data directory: ${DATA_DIR}
`);

export type App = typeof app;
