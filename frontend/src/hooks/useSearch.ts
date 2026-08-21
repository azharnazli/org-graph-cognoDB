import { useQuery } from "@tanstack/react-query";
import { api } from "../api/client";

export interface SearchHit {
  label: string;
  id: string;
  name: string;
}

export function useSearch(q: string) {
  return useQuery<{ data: SearchHit[]; query: string }>({
    queryKey: ["search", q],
    enabled: q.trim().length >= 2,
    queryFn: async () => {
      const res = await api.get<{ data: SearchHit[]; query: string }>(
        `/api/search?q=${encodeURIComponent(q)}`,
      );
      return res.data;
    },
  });
}
