import { useMutation } from "@tanstack/react-query";
import { api } from "../api/client";

export interface CypherResult {
  data: Record<string, unknown>[];
  count: number;
}

export function useRunCypher() {
  return useMutation<CypherResult, Error, { cypher: string; params?: Record<string, unknown> }>({
    mutationFn: async (input) => {
      const res = await api.post<CypherResult>("/api/query", input);
      return res.data;
    },
  });
}
