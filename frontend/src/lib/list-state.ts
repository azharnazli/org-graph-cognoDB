import { useQuery } from "@tanstack/react-query";
import { api } from "../api/client";
import type {
  Paginated,
  Person,
  Department,
  Project,
  Product,
  Supplier,
  Location,
} from "@org-graph/shared-types";

export type ListQuery = {
  page: number;
  pageSize: number;
  q?: string;
  status?: string;
};

export type SortOrder = "ASC" | "DESC";

function toSearch(params: Record<string, string | number | undefined>): string {
  const usp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === "") continue;
    usp.set(k, String(v));
  }
  const s = usp.toString();
  return s ? `?${s}` : "";
}

export function usePeople(query: ListQuery, sortField = "name", order: SortOrder = "ASC") {
  return useQuery<Paginated<Person>>({
    queryKey: ["people", query, sortField, order],
    queryFn: async () => {
      const search = toSearch({
        page: query.page,
        pageSize: query.pageSize,
        ...(query.q ? { q: query.q } : {}),
        sort: sortField,
        order,
      });
      const res = await api.get<Paginated<Person>>(`/api/people${search}`);
      return res.data;
    },
  });
}

export function useDepartments(query: ListQuery, sortField = "name", order: SortOrder = "ASC") {
  return useQuery<Paginated<Department>>({
    queryKey: ["departments", query, sortField, order],
    queryFn: async () => {
      const search = toSearch({ page: query.page, pageSize: query.pageSize, sort: sortField, order });
      const res = await api.get<Paginated<Department>>(`/api/departments${search}`);
      return res.data;
    },
  });
}

export function useProjects(
  query: ListQuery & { status?: string },
  sortField = "name",
  order: SortOrder = "ASC",
) {
  return useQuery<Paginated<Project>>({
    queryKey: ["projects", query, sortField, order],
    queryFn: async () => {
      const search = toSearch({
        page: query.page,
        pageSize: query.pageSize,
        ...(query.status ? { status: query.status } : {}),
        sort: sortField,
        order,
      });
      const res = await api.get<Paginated<Project>>(`/api/projects${search}`);
      return res.data;
    },
  });
}

export function useProducts(query: ListQuery, sortField = "name", order: SortOrder = "ASC") {
  return useQuery<Paginated<Product>>({
    queryKey: ["products", query, sortField, order],
    queryFn: async () => {
      const search = toSearch({ page: query.page, pageSize: query.pageSize, sort: sortField, order });
      const res = await api.get<Paginated<Product>>(`/api/products${search}`);
      return res.data;
    },
  });
}

export function useSuppliers(query: ListQuery, sortField = "name", order: SortOrder = "ASC") {
  return useQuery<Paginated<Supplier>>({
    queryKey: ["suppliers", query, sortField, order],
    queryFn: async () => {
      const search = toSearch({ page: query.page, pageSize: query.pageSize, sort: sortField, order });
      const res = await api.get<Paginated<Supplier>>(`/api/suppliers${search}`);
      return res.data;
    },
  });
}

export function useLocations(query: ListQuery, sortField = "city", order: SortOrder = "ASC") {
  return useQuery<Paginated<Location>>({
    queryKey: ["locations", query, sortField, order],
    queryFn: async () => {
      const search = toSearch({ page: query.page, pageSize: query.pageSize, sort: sortField, order });
      const res = await api.get<Paginated<Location>>(`/api/locations${search}`);
      return res.data;
    },
  });
}
