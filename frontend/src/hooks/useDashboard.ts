import { useQuery } from "@tanstack/react-query";
import { api } from "../api/client";

export interface DashboardCounts {
  people: number;
  departments: number;
  projects: number;
  products: number;
  suppliers: number;
  locations: number;
  activeProjects: number;
  suppliersInRegion: Record<string, number>;
}

export function useDashboard() {
  return useQuery<{ data: DashboardCounts }>({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const res = await api.get<{ data: DashboardCounts }>("/api/dashboard");
      return res.data;
    },
    refetchInterval: 30_000,
  });
}
