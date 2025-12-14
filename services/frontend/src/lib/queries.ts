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
