import type { RoleLevel, ProjectStatus } from "@org-graph/shared-types";

export function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export function formatRating(rating: number): string {
  return rating.toFixed(1);
}

export const ROLE_LEVEL_LABEL: Record<RoleLevel, string> = {
  IC: "Individual Contributor",
  Manager: "Manager",
  Director: "Director",
  VP: "Vice President",
  "C-level": "C-level",
};

export function roleLevelVariant(level: RoleLevel | null | undefined): "default" | "secondary" | "outline" {
  if (!level) return "outline";
  if (level === "C-level" || level === "VP") return "default";
  if (level === "Director" || level === "Manager") return "secondary";
  return "outline";
}

export const PROJECT_STATUS_LABEL: Record<ProjectStatus, string> = {
  planned: "Planned",
  active: "Active",
  done: "Done",
};

export function projectStatusVariant(status: ProjectStatus | null | undefined): "default" | "secondary" | "outline" {
  if (!status) return "outline";
  if (status === "active") return "default";
  if (status === "planned") return "secondary";
  return "outline";
}
