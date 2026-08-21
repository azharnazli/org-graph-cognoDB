import { useQuery } from "@tanstack/react-query";
import { api } from "../api/client";
import type {
  PersonDetail,
  DepartmentDetail,
  ProjectDetail,
  ProductDetail,
  SupplierDetail,
} from "@org-graph/shared-types";

interface Envelope<T> {
  data: T;
}

export function usePerson(id: string | null | undefined) {
  return useQuery<Envelope<PersonDetail>>({
    queryKey: ["person", id],
    enabled: Boolean(id),
    queryFn: async () => {
      const res = await api.get<Envelope<PersonDetail>>(`/api/people/${id}`);
      return res.data;
    },
  });
}

export function usePersonReportsChain(
  fromId: string | null | undefined,
  toId: string | null | undefined,
) {
  return useQuery<{
    data: { chain: Array<{ id: string; name: string; title: string }>; hops: number } | null;
    message?: string;
  }>({
    queryKey: ["reports-chain", fromId, toId],
    enabled: Boolean(fromId && toId),
    queryFn: async () => {
      const res = await api.get(`/api/people/${fromId}/reports-chain?to=${toId}`);
      return res.data;
    },
  });
}

export function useDepartment(id: string | null | undefined) {
  return useQuery<Envelope<DepartmentDetail>>({
    queryKey: ["department", id],
    enabled: Boolean(id),
    queryFn: async () => {
      const res = await api.get<Envelope<DepartmentDetail>>(`/api/departments/${id}`);
      return res.data;
    },
  });
}

export function useProject(id: string | null | undefined) {
  return useQuery<Envelope<ProjectDetail>>({
    queryKey: ["project", id],
    enabled: Boolean(id),
    queryFn: async () => {
      const res = await api.get<Envelope<ProjectDetail>>(`/api/projects/${id}`);
      return res.data;
    },
  });
}

export function useProduct(id: string | null | undefined) {
  return useQuery<Envelope<ProductDetail>>({
    queryKey: ["product", id],
    enabled: Boolean(id),
    queryFn: async () => {
      const res = await api.get<Envelope<ProductDetail>>(`/api/products/${id}`);
      return res.data;
    },
  });
}

export function useSupplier(id: string | null | undefined) {
  return useQuery<Envelope<SupplierDetail>>({
    queryKey: ["supplier", id],
    enabled: Boolean(id),
    queryFn: async () => {
      const res = await api.get<Envelope<SupplierDetail>>(`/api/suppliers/${id}`);
      return res.data;
    },
  });
}
