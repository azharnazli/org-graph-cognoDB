// Helpers for validating pagination + sorting query params.
// All values must be whitelisted — never pass user input directly into Cypher.

const SORT_FIELDS: Record<string, readonly string[]> = {
  people: ["name", "email", "title", "joinedAt"],
  departments: ["name", "costCenter"],
  projects: ["name", "status"],
  products: ["name", "sku", "category"],
  suppliers: ["name", "rating"],
  locations: ["city", "country", "region"],
};

export interface Pagination {
  page: number;
  pageSize: number;
  skip: number;
  limit: number;
}

export interface Sorting {
  sortField: string;
  order: "ASC" | "DESC";
}

export function parsePagination(
  pageRaw: unknown,
  pageSizeRaw: unknown,
): Pagination {
  const page = Math.max(1, Number(pageRaw) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(pageSizeRaw) || 20));
  return { page, pageSize, skip: (page - 1) * pageSize, limit: pageSize };
}

export function parseSorting(
  resource: keyof typeof SORT_FIELDS,
  sortRaw: unknown,
  orderRaw: unknown,
  defaultField: string,
): Sorting {
  const allowed = SORT_FIELDS[resource] ?? [];
  const sortField = allowed.includes(String(sortRaw)) ? String(sortRaw) : defaultField;
  const order = String(orderRaw).toLowerCase() === "desc" ? "DESC" : "ASC";
  return { sortField, order };
}
