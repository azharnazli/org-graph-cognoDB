import type { GraphNode, GraphLink } from "@/hooks/useGraph";

// Stable color per node label. HSL strings work with canvas.
const LABEL_COLORS: Record<string, string> = {
  Person: "hsl(220, 70%, 55%)",
  Department: "hsl(280, 60%, 60%)",
  Role: "hsl(0, 0%, 50%)",
  Project: "hsl(140, 60%, 50%)",
  Product: "hsl(30, 80%, 55%)",
  Supplier: "hsl(350, 70%, 55%)",
  Location: "hsl(180, 60%, 45%)",
};

const REL_COLORS: Record<string, string> = {
  REPORTS_TO: "hsl(220, 70%, 55%)",
  WORKS_IN: "hsl(280, 60%, 60%)",
  HAS_ROLE: "hsl(0, 0%, 70%)",
  MANAGES: "hsl(140, 60%, 50%)",
  USES: "hsl(30, 80%, 55%)",
  SUPPLIED_BY: "hsl(350, 70%, 55%)",
  LOCATED_IN: "hsl(180, 60%, 45%)",
};

export function nodeColor(node: GraphNode): string {
  return LABEL_COLORS[node.label] ?? "hsl(0, 0%, 50%)";
}

export function linkColor(link: GraphLink): string {
  return REL_COLORS[link.type] ?? "hsl(0, 0%, 70%)";
}

export const LABEL_LEGEND: Array<{ label: string; color: string }> = [
  { label: "Person", color: LABEL_COLORS["Person"]! },
  { label: "Department", color: LABEL_COLORS["Department"]! },
  { label: "Role", color: LABEL_COLORS["Role"]! },
  { label: "Project", color: LABEL_COLORS["Project"]! },
  { label: "Product", color: LABEL_COLORS["Product"]! },
  { label: "Supplier", color: LABEL_COLORS["Supplier"]! },
  { label: "Location", color: LABEL_COLORS["Location"]! },
];
