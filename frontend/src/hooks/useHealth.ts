import { useQuery } from "@tanstack/react-query";
import type { HealthResponse } from "@org-graph/shared-types";
import { api } from "../api/client";

export function useHealth() {
  return useQuery<HealthResponse>({
    queryKey: ["health"],
    queryFn: async () => {
      const res = await api.get<HealthResponse>("/api/health");
      return res.data;
    },
    refetchInterval: 10_000,
  });
}
