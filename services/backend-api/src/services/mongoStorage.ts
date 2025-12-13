import { Session, ISession } from "../models/Session";
import type { CapturedSession, SessionSummary, SessionStats } from "./fileStorage";

export class MongoStorageService {
  /**
   * Save a single session to MongoDB
   * Upserts based on sessionId to avoid duplicates
   */
  async saveSession(session: CapturedSession): Promise<void> {
    try {
      await Session.findOneAndUpdate(
        { sessionId: session.sessionId },
        session,
        { upsert: true, new: true }
      );
    } catch (error) {
      console.error(`Error saving session ${session.sessionId}:`, error);
      throw error;
    }
  }

  /**
   * Save multiple sessions to MongoDB
   * Bulk upsert for better performance
   */
  async saveSessions(sessions: CapturedSession[]): Promise<void> {
    if (sessions.length === 0) return;

    try {
      const bulkOps = sessions.map(session => ({
        updateOne: {
          filter: { sessionId: session.sessionId },
          update: { $set: session },
          upsert: true
        }
      }));

      await Session.bulkWrite(bulkOps);
      console.log(`Synced ${sessions.length} sessions to MongoDB`);
    } catch (error) {
      console.error("Error saving sessions to MongoDB:", error);
      throw error;
    }
  }

  /**
   * Get all sessions with pagination
   */
  async getSessions(limit: number = 100, skip: number = 0): Promise<ISession[]> {
    try {
      return await Session
        .find()
        .sort({ timestamp: -1 })
        .limit(limit)
        .skip(skip)
        .lean()
        .exec();
    } catch (error) {
      console.error("Error fetching sessions from MongoDB:", error);
      throw error;
    }
  }

  /**
   * Get a single session by ID
   */
  async getSession(sessionId: string): Promise<ISession | null> {
    try {
      return await Session.findOne({ sessionId }).lean().exec();
    } catch (error) {
      console.error(`Error fetching session ${sessionId}:`, error);
      throw error;
    }
  }

  /**
   * Get session summaries (lightweight version)
   */
  async getSessionSummaries(limit: number = 100): Promise<SessionSummary[]> {
    try {
      const sessions = await Session
        .find()
        .select('sessionId timestamp sourceIp sourcePort destIp destPort request response')
        .sort({ timestamp: -1 })
        .limit(limit)
        .lean()
        .exec();

      return sessions.map(session => ({
        sessionId: session.sessionId,
        timestamp: session.timestamp,
        sourceIp: session.sourceIp,
        sourcePort: session.sourcePort,
        destIp: session.destIp,
        destPort: session.destPort,
        method: session.request?.method || 'UNKNOWN',
        uri: session.request?.uri || '/',
        statusCode: session.response?.statusCode
      }));
    } catch (error) {
      console.error("Error fetching session summaries:", error);
      throw error;
    }
  }

  /**
   * Get statistics about captured sessions
   */
  async getStats(): Promise<SessionStats> {
    try {
      const [totalSessions, methodStats, statusStats] = await Promise.all([
        Session.countDocuments(),
        Session.aggregate([
          {
            $group: {
              _id: "$request.method",
              count: { $sum: 1 }
            }
          }
        ]),

        Session.aggregate([
          {
            $match: { "response.statusCode": { $exists: true } }
          },
          {
            $group: {
              _id: "$response.statusCode",
              count: { $sum: 1 }
            }
          }
        ])
      ]);

      const methodDistribution: Record<string, number> = {};
      methodStats.forEach(item => {
        if (item._id) {
          methodDistribution[item._id] = item.count;
        }
      });

      const statusDistribution: Record<string, number> = {};
      statusStats.forEach(item => {
        if (item._id) {
          statusDistribution[item._id.toString()] = item.count;
        }
      });

      return {
        totalSessions,
        methodDistribution,
        statusDistribution
      };
    } catch (error) {
      console.error("Error fetching stats:", error);
      throw error;
    }
  }

  /**
   * Delete a session by ID
   */
  async deleteSession(sessionId: string): Promise<boolean> {
    try {
      const result = await Session.deleteOne({ sessionId });
      return result.deletedCount > 0;
    } catch (error) {
      console.error(`Error deleting session ${sessionId}:`, error);
      throw error;
    }
  }

  /**
   * Clear all sessions (use with caution!)
   */
  async clearAllSessions(): Promise<number> {
    try {
      const result = await Session.deleteMany({});
      console.log(`Cleared ${result.deletedCount} sessions from MongoDB`);
      return result.deletedCount;
    } catch (error) {
      console.error("Error clearing sessions:", error);
      throw error;
    }
  }

  /**
   * Get sessions by filter
   */
  async filterSessions(filter: {
    method?: string;
    statusCode?: number;
    sourceIp?: string;
    startDate?: Date;
    endDate?: Date;
  }, limit: number = 100): Promise<ISession[]> {
    try {
      const query: any = {};

      if (filter.method) {
        query['request.method'] = filter.method;
      }
      if (filter.statusCode) {
        query['response.statusCode'] = filter.statusCode;
      }
      if (filter.sourceIp) {
        query.sourceIp = filter.sourceIp;
      }
      if (filter.startDate || filter.endDate) {
        query.createdAt = {};
        if (filter.startDate) {
          query.createdAt.$gte = filter.startDate;
        }
        if (filter.endDate) {
          query.createdAt.$lte = filter.endDate;
        }
      }

      return await Session
        .find(query)
        .sort({ timestamp: -1 })
        .limit(limit)
        .lean()
        .exec();
    } catch (error) {
      console.error("Error filtering sessions:", error);
      throw error;
    }
  }

  /**
   * Get count of sessions
   */
  async getSessionCount(): Promise<number> {
    try {
      return await Session.countDocuments();
    } catch (error) {
      console.error("Error counting sessions:", error);
      throw error;
    }
  }
}
