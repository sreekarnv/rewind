import { api } from "$lib/api";
import type { PageLoad } from "./$types";

export const load: PageLoad = async () => {
  try {
    const stats = await api.getStats();
    return {
      stats,
    };
  } catch (error) {
    console.error("Failed to load statistics:", error);
    return {
      stats: null,
      error:
        error instanceof Error ? error.message : "Failed to load statistics",
    };
  }
};
