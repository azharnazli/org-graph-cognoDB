// Mapping from Neo4j node label to the in-app detail route. Lives in its own
// file so the lazy-loaded ForceGraph2D module and the static GraphExplorer
// page can both import it without forcing one bundle to pull in the other.
export const LABEL_TO_PATH: Record<string, string> = {
  Person: "/people",
  Department: "/departments",
  Project: "/projects",
  Product: "/products",
  Supplier: "/suppliers",
  Location: "/locations",
};

export function pathForLabel(label: string): string | undefined {
  return LABEL_TO_PATH[label];
}
