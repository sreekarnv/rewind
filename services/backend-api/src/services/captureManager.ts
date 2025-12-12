import { spawn, ChildProcess } from "node:child_process";
import { join } from "node:path";

export type CaptureStatus =
  | "stopped"
  | "starting"
  | "running"
  | "stopping"
  | "error";

export interface CaptureState {
  status: CaptureStatus;
  pid?: number;
  startedAt?: number;
  stoppedAt?: number;
  error?: string;
}

export type OutputListener = (data: string) => void;

export class CaptureManager {
  private process: ChildProcess | null = null;
  private status: CaptureStatus = "stopped";
  private startedAt: number | null = null;
  private errorMessage: string | null = null;
  private captureAgentPath: string;
  private configPath: string;
  private outputListeners: Set<OutputListener> = new Set();

  constructor(captureAgentPath?: string, configPath?: string) {
    this.captureAgentPath =
      captureAgentPath || "../capture-agent/build/Release/capture-agent.exe";
    this.configPath = configPath || "../capture-agent/config/config.yaml";
  }

  async start(): Promise<CaptureState> {
    if (this.status === "running" || this.status === "starting") {
      return this.getState();
    }

    this.status = "starting";
    this.errorMessage = null;

    try {
      console.log(`🚀 Starting capture agent: ${this.captureAgentPath}`);

      this.process = spawn(
        this.captureAgentPath,
        ["--config", this.configPath],
        {
          cwd: join(process.cwd(), "../capture-agent"),
          detached: false,
          stdio: ["pipe", "pipe", "pipe"],
        },
      );

      this.process.stdout?.on("data", (data) => {
        const output = data.toString();
        console.log(`[Capture Agent] ${output.trim()}`);
        this.broadcastOutput(output);
      });

      this.process.stderr?.on("data", (data) => {
        const output = data.toString();
        console.error(`[Capture Agent Error] ${output.trim()}`);
        this.broadcastOutput(`ERROR: ${output}`);
      });

      this.process.on("exit", (code, signal) => {
        console.log(
          `📛 Capture agent exited with code ${code}, signal ${signal}`,
        );
        this.status = "stopped";
        this.process = null;

        if (code !== 0 && code !== null) {
          this.errorMessage = `Process exited with code ${code}`;
          this.status = "error";
        }
      });

      this.process.on("error", (error) => {
        console.error("❌ Failed to start capture agent:", error);
        this.status = "error";
        this.errorMessage = error.message;
        this.process = null;
      });

      await new Promise((resolve) => setTimeout(resolve, 500));

      if (this.process && !this.process.killed) {
        this.status = "running";
        this.startedAt = Date.now();
        console.log(`Capture agent started with PID ${this.process.pid}`);
      } else {
        this.status = "error";
        this.errorMessage = "Process failed to start";
      }

      return this.getState();
    } catch (error) {
      console.error("❌ Error starting capture agent:", error);
      this.status = "error";
      this.errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      this.process = null;
      return this.getState();
    }
  }

  async stop(): Promise<CaptureState> {
    if (this.status === "stopped" || this.status === "stopping") {
      return this.getState();
    }

    if (!this.process) {
      this.status = "stopped";
      return this.getState();
    }

    this.status = "stopping";

    try {
      console.log(`Stopping capture agent (PID: ${this.process.pid})`);

      this.process.kill("SIGTERM");

      await new Promise<void>((resolve) => {
        const timeout = setTimeout(() => {
          if (this.process && !this.process.killed) {
            console.log("Graceful shutdown timeout, forcing kill...");
            this.process.kill("SIGKILL");
          }
          resolve();
        }, 5000);

        this.process?.on("exit", () => {
          clearTimeout(timeout);
          resolve();
        });
      });

      this.status = "stopped";
      this.process = null;
      console.log("Capture agent stopped");

      return this.getState();
    } catch (error) {
      console.error("❌ Error stopping capture agent:", error);
      this.status = "error";
      this.errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      return this.getState();
    }
  }

  getState(): CaptureState {
    const state: CaptureState = {
      status: this.status,
      pid: this.process?.pid,
    };

    if (this.startedAt) {
      state.startedAt = this.startedAt;
    }

    if (this.status === "stopped" && this.startedAt) {
      state.stoppedAt = Date.now();
    }

    if (this.errorMessage) {
      state.error = this.errorMessage;
    }

    return state;
  }

  isRunning(): boolean {
    return this.status === "running";
  }

  getUptime(): number {
    if (!this.startedAt || this.status !== "running") {
      return 0;
    }
    return Math.floor((Date.now() - this.startedAt) / 1000);
  }

  onOutput(listener: OutputListener): () => void {
    this.outputListeners.add(listener);

    return () => {
      this.outputListeners.delete(listener);
    };
  }

  private broadcastOutput(data: string) {
    this.outputListeners.forEach((listener) => {
      try {
        listener(data);
      } catch (error) {
        console.error("Error in output listener:", error);
      }
    });
  }

  sendInput(input: string): boolean {
    if (!this.process || !this.process.stdin) {
      return false;
    }

    try {
      this.process.stdin.write(input + "\n");
      return true;
    } catch (error) {
      console.error("Error sending input to capture agent:", error);
      return false;
    }
  }
}
