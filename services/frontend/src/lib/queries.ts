import { client } from "./client";

export const sessionsQueries = {
  all: () => ({
    queryKey: ["sessions"],
    queryFn: async () => {
      const response = await client.api.v1.sessions.get();
      if (response.error) throw new Error("Failed to fetch sessions");
      return response.data;
    },
  }),
  detail: (id: string) => ({
    queryKey: ["sessions", id],
    queryFn: async () => {
      const response = await client.api.v1.sessions({ id }).get();
      if (response.error) throw new Error("Session not found");
      return response.data;
    },
  }),
};

export const statsQueries = {
  all: () => ({
    queryKey: ["stats"],
    queryFn: async () => {
      const response = await client.api.v1.stats.get();
      if (response.error) throw new Error("Failed to fetch stats");
      return response.data;
    },
  }),
};

export const metricsQueries = {
  dashboard: () => ({
    queryKey: ["metrics", "dashboard"],
    queryFn: async () => {
      const response = await client.api.v1.metrics.dashboard.get();
      if (response.error) throw new Error("Failed to fetch metrics");
      return response.data;
    },
  }),
};

export const notificationQueries = {
  all: (params?: { limit?: number; skip?: number; status?: "unread" | "read" | "dismissed" }) => ({
    queryKey: ["notifications", params],
    queryFn: async () => {
      const response = await client.api.v1.notifications.get({
        query: params || {},
      });
      if (response.error) throw new Error("Failed to fetch notifications");
      return response.data;
    },
  }),
  unreadCount: () => ({
    queryKey: ["notifications", "unread", "count"],
    queryFn: async () => {
      const response = await client.api.v1.notifications.unread.count.get();
      if (response.error) throw new Error("Failed to fetch unread count");
      return response.data;
    },
  }),
};

export const alertQueries = {
  all: () => ({
    queryKey: ["alerts"],
    queryFn: async () => {
      const response = await client.api.v1.alerts.get();
      if (response.error) throw new Error("Failed to fetch alert rules");
      return response.data;
    },
  }),
  detail: (id: string) => ({
    queryKey: ["alerts", id],
    queryFn: async () => {
      const response = await client.api.v1.alerts({ id }).get();
      if (response.error) throw new Error("Alert rule not found");
      return response.data;
    },
  }),
};
