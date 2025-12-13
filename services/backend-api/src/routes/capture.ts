import { Elysia } from "elysia";
import type { CaptureManager } from "../services/captureManager";

export const captureRoute = (captureManager: CaptureManager) =>
  new Elysia({ prefix: "/api/v1/capture" })
    /**
     * Get current capture status
     */
    .get("/status", () => {
      const state = captureManager.getState();
      return {
        ...state,
        uptime: captureManager.getUptime(),
      };
    })

    /**
     * Start capturing
     */
    .post("/start", async ({ set }) => {
      const state = captureManager.getState();

      if (state.status === "running") {
        set.status = 409;
        return {
          error: "Conflict",
          message: "Capture is already running",
          statusCode: 409,
        };
      }

      try {
        const newState = await captureManager.start();

        if (newState.status === "error") {
          set.status = 500;
          return {
            error: "Internal Server Error",
            message: newState.error || "Failed to start capture",
            statusCode: 500,
          };
        }

        return {
          message: "Capture started successfully",
          state: {
            ...newState,
            uptime: captureManager.getUptime(),
          },
        };
      } catch (err) {
        console.error("Error starting capture:", err);
        set.status = 500;
        return {
          error: "Internal Server Error",
          message: err instanceof Error ? err.message : "Unknown error",
          statusCode: 500,
        };
      }
    })

    /**
     * Stop capturing
     */
    .post("/stop", async ({ set }) => {
      const state = captureManager.getState();

      if (state.status === "stopped") {
        set.status = 409;
        return {
          error: "Conflict",
          message: "Capture is not running",
          statusCode: 409,
        };
      }

      try {
        const newState = await captureManager.stop();

        if (newState.status === "error") {
          set.status = 500;
          return {
            error: "Internal Server Error",
            message: newState.error || "Failed to stop capture",
            statusCode: 500,
          };
        }

        return {
          message: "Capture stopped successfully",
          state: {
            ...newState,
            uptime: 0,
          },
        };
      } catch (err) {
        console.error("Error stopping capture:", err);
        set.status = 500;
        return {
          error: "Internal Server Error",
          message: err instanceof Error ? err.message : "Unknown error",
          statusCode: 500,
        };
      }
    })

    /**
     * Restart capturing (stop then start)
     */
    .post("/restart", async ({ set }) => {
      try {
        const currentState = captureManager.getState();
        if (currentState.status === "running") {
          await captureManager.stop();
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }

        const newState = await captureManager.start();

        if (newState.status === "error") {
          set.status = 500;
          return {
            error: "Internal Server Error",
            message: newState.error || "Failed to restart capture",
            statusCode: 500,
          };
        }

        return {
          message: "Capture restarted successfully",
          state: {
            ...newState,
            uptime: captureManager.getUptime(),
          },
        };
      } catch (err) {
        console.error("Error restarting capture:", err);
        set.status = 500;
        return {
          error: "Internal Server Error",
          message: err instanceof Error ? err.message : "Unknown error",
          statusCode: 500,
        };
      }
    })

    /**
     * WebSocket endpoint for streaming C++ agent output and sending input
     */
    .ws("/stream", {
      open(ws) {
        console.log("Client connected to capture stream");

        const unsubscribe = captureManager.onOutput((data) => {
          try {
            ws.send(
              JSON.stringify({
                type: "output",
                data: data,
              }),
            );
          } catch (error) {
            console.error("Error sending output to WebSocket:", error);
          }
        });

        (ws as any).unsubscribe = unsubscribe;
      },

      message(ws, message) {
        try {
          let data: any;

          if (
            typeof message === "object" &&
            message !== null &&
            !Buffer.isBuffer(message)
          ) {
            data = message;
            console.log("Received as object:", data);
          } else {
            let messageStr: string;
            if (typeof message === "string") {
              messageStr = message;
            } else if (Buffer.isBuffer(message)) {
              messageStr = message.toString("utf-8");
            } else if (message instanceof ArrayBuffer) {
              messageStr = Buffer.from(message).toString("utf-8");
            } else {
              messageStr = String(message);
            }

            console.log("Parsing JSON from string:", messageStr);
            data = JSON.parse(messageStr);
          }

          if (data.type === "input") {
            console.log(`Received input from browser: "${data.value}"`);

            const success = captureManager.sendInput(data.value);
            console.log(
              `Sent to capture agent: ${success ? "success" : "failed"}`,
            );

            ws.send(
              JSON.stringify({
                type: "input_ack",
                success: success,
              }),
            );
          }
        } catch (error) {
          console.error("Error processing WebSocket message:", error);
          console.error("Message was:", message);
          ws.send(
            JSON.stringify({
              type: "error",
              message: error instanceof Error ? error.message : "Unknown error",
            }),
          );
        }
      },

      close(ws) {
        console.log("Client disconnected from capture stream");

        const unsubscribe = (ws as any).unsubscribe;
        if (unsubscribe) {
          unsubscribe();
        }
      },
    });
