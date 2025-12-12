import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import type { CapturedData, Session, SessionSummary } from "../types/session";

export class FileStorageService {
  private dataDir: string;

  constructor(dataDir: string = "../../capture-agent/output") {
    this.dataDir = dataDir;
  }

  /**
   * Get all sessions from all JSON files
   */
  async getAllSessions(): Promise<Session[]> {
    try {
      const files = await this.getJSONFiles();
      const allSessions: Session[] = [];

      for (const file of files) {
        const filePath = join(this.dataDir, file);
        const content = await readFile(filePath, "utf-8");
        const data: CapturedData = JSON.parse(content);

        if (data.sessions && Array.isArray(data.sessions)) {
          allSessions.push(...data.sessions);
        }
      }

      return allSessions;
    } catch (error) {
      console.error("Error reading sessions:", error);
      return [];
    }
  }

  /**
   * Get session summaries (without full transaction data)
   */
  async getSessionSummaries(): Promise<SessionSummary[]> {
    const sessions = await this.getAllSessions();

    return sessions.map(session => ({
      sessionId: session.sessionId,
      clientIp: session.clientIp,
      clientPort: session.clientPort,
      serverIp: session.serverIp,
      serverPort: session.serverPort,
      startTime: session.startTime,
      endTime: session.endTime,
      duration: session.duration,
      transactionCount: session.transactionCount
    }));
  }

  /**
   * Get a specific session by ID
   */
  async getSessionById(sessionId: string): Promise<Session | null> {
    const sessions = await this.getAllSessions();
    return sessions.find(s => s.sessionId === sessionId) || null;
  }

  /**
   * Get all JSON files in the data directory
   */
  private async getJSONFiles(): Promise<string[]> {
    try {
      const files = await readdir(this.dataDir);
      return files.filter(file => file.endsWith(".json"));
    } catch (error) {
      console.error("Error reading directory:", error);
      return [];
    }
  }

  /**
   * Get statistics about captured sessions
   */
  async getStats() {
    const sessions = await this.getAllSessions();

    const totalRequests = sessions.reduce(
      (sum, session) => sum + session.transactions.length,
      0
    );

    const methodCounts: Record<string, number> = {};
    const statusCounts: Record<number, number> = {};

    sessions.forEach(session => {
      session.transactions.forEach(transaction => {
        // Only count if transaction has request
        if (transaction.request) {
          // Count methods
          const method = transaction.request.method || "UNKNOWN";
          methodCounts[method] = (methodCounts[method] || 0) + 1;
        }

        // Only count status if transaction has response
        if (transaction.response && transaction.response.statusCode) {
          const status = transaction.response.statusCode;
          statusCounts[status] = (statusCounts[status] || 0) + 1;
        }
      });
    });

    return {
      totalSessions: sessions.length,
      totalRequests: totalRequests,
      methodDistribution: methodCounts,
      statusDistribution: statusCounts
    };
  }
}
