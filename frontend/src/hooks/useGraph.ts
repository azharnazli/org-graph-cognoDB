import { useQuery } from "@tanstack/react-query";
import { api } from "../api/client";

export interface GraphNode {
  id: string;
  label: string;
  name: string;
  properties: Record<string, unknown>;
}

export interface GraphLink {
  source: string;
  target: string;
  type: string;
}

export interface GraphData {
  view: string;
  nodes: GraphNode[];
  links: GraphLink[];
}

export type GraphView = "org" | "supply" | "all" | "neighborhood";

export function useGraph(view: GraphView, opts: { node?: string; depth?: number } = {}) {
  const params = new URLSearchParams({ view });
  if (opts.node) params.set("node", opts.node);
  if (opts.depth) params.set("depth", String(opts.depth));

  return useQuery<{ data: GraphData }>({
    queryKey: ["graph", view, opts.node ?? null, opts.depth ?? null],
    queryFn: async () => {
      const res = await api.get<{ data: GraphData }>(`/api/graph?${params.toString()}`);
      return res.data;
    },
  });
}
