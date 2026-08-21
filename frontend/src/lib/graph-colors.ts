import type { GraphNode, GraphLink } from "@/hooks/useGraph";

// Transit route lines. HSL strings work with canvas.
const LINE_COMMAND = "hsl(193, 85%, 27%)"; // REPORTS_TO — the command line
const LINE_WORKS = "hsl(153, 55%, 26%)"; // WORKS_IN — the works line
const LINE_PROJECTS = "hsl(42, 88%, 46%)"; // MANAGES / USES-out — the projects line
const LINE_SUPPLY = "hsl(6, 60%, 45%)"; // SUPPLIED_BY — the supply line
const LINE_ROLE = "hsl(266, 42%, 52%)"; // Products — the goods line
const LINE_STEEL = "hsl(200, 22%, 46%)"; // Locations — the network line
const LINE_SLATE = "hsl(215, 18%, 34%)"; // Roles — the neutral line

const LABEL_COLORS: Record<string, string> = {
  Person: LINE_COMMAND,
  Department: LINE_WORKS,
  Role: LINE_SLATE,
  Project: LINE_PROJECTS,
  Product: LINE_ROLE,
  Supplier: LINE_SUPPLY,
  Location: LINE_STEEL,
};

const REL_COLORS: Record<string, string> = {
  REPORTS_TO: LINE_COMMAND,
  WORKS_IN: LINE_WORKS,
  HAS_ROLE: LINE_SLATE,
  MANAGES: LINE_PROJECTS,
  USES: LINE_ROLE,
  SUPPLIED_BY: LINE_SUPPLY,
  LOCATED_IN: LINE_STEEL,
};

export function nodeColor(node: GraphNode): string {
  return LABEL_COLORS[node.label] ?? LINE_SLATE;
}

/** Station accent for a domain label — used for DOM marks, not canvas. */
export function entityAccent(label: string): string {
  return LABEL_COLORS[label] ?? LINE_SLATE;
}

export function linkColor(link: GraphLink): string {
  return REL_COLORS[link.type] ?? LINE_SLATE;
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
