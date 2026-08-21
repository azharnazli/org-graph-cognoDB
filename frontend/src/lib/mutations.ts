import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/client";
import type {
  Person,
  Department,
  Project,
  Product,
  Supplier,
  Location,
  CreatePersonInput,
  UpdatePersonInput,
  CreateDepartmentInput,
  UpdateDepartmentInput,
  CreateProjectInput,
  UpdateProjectInput,
  CreateProductInput,
  UpdateProductInput,
  CreateSupplierInput,
  UpdateSupplierInput,
  CreateLocationInput,
  UpdateLocationInput,
  MutationResult,
} from "@org-graph/shared-types";

// ---- People ----

function useCreatePerson() {
  const qc = useQueryClient();
  return useMutation<MutationResult<Person>, Error, CreatePersonInput>({
    mutationFn: async (input) =>
      (await api.post<MutationResult<Person>>("/api/people", input)).data,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["people"] });
      void qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

function useUpdatePerson() {
  const qc = useQueryClient();
  return useMutation<MutationResult<Person>, Error, { id: string; input: UpdatePersonInput }>({
    mutationFn: async ({ id, input }) =>
      (await api.put<MutationResult<Person>>(`/api/people/${id}`, input)).data,
    onSuccess: (_, { id }) => {
      void qc.invalidateQueries({ queryKey: ["people"] });
      void qc.invalidateQueries({ queryKey: ["person", id] });
      void qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

function useDeletePerson() {
  const qc = useQueryClient();
  return useMutation<{ data: { deleted: boolean } }, Error, string>({
    mutationFn: async (id) =>
      (await api.delete<{ data: { deleted: boolean } }>(`/api/people/${id}`)).data,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["people"] });
      void qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

// ---- Departments ----

function useCreateDepartment() {
  const qc = useQueryClient();
  return useMutation<MutationResult<Department>, Error, CreateDepartmentInput>({
    mutationFn: async (input) =>
      (await api.post<MutationResult<Department>>("/api/departments", input)).data,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["departments"] });
      void qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}
function useUpdateDepartment() {
  const qc = useQueryClient();
  return useMutation<MutationResult<Department>, Error, { id: string; input: UpdateDepartmentInput }>({
    mutationFn: async ({ id, input }) =>
      (await api.put<MutationResult<Department>>(`/api/departments/${id}`, input)).data,
    onSuccess: (_, { id }) => {
      void qc.invalidateQueries({ queryKey: ["departments"] });
      void qc.invalidateQueries({ queryKey: ["department", id] });
      void qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}
function useDeleteDepartment() {
  const qc = useQueryClient();
  return useMutation<{ data: { deleted: boolean } }, Error, string>({
    mutationFn: async (id) =>
      (await api.delete<{ data: { deleted: boolean } }>(`/api/departments/${id}`)).data,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["departments"] });
      void qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

// ---- Projects ----

function useCreateProject() {
  const qc = useQueryClient();
  return useMutation<MutationResult<Project>, Error, CreateProjectInput>({
    mutationFn: async (input) =>
      (await api.post<MutationResult<Project>>("/api/projects", input)).data,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["projects"] });
      void qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}
function useUpdateProject() {
  const qc = useQueryClient();
  return useMutation<MutationResult<Project>, Error, { id: string; input: UpdateProjectInput }>({
    mutationFn: async ({ id, input }) =>
      (await api.put<MutationResult<Project>>(`/api/projects/${id}`, input)).data,
    onSuccess: (_, { id }) => {
      void qc.invalidateQueries({ queryKey: ["projects"] });
      void qc.invalidateQueries({ queryKey: ["project", id] });
      void qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}
function useDeleteProject() {
  const qc = useQueryClient();
  return useMutation<{ data: { deleted: boolean } }, Error, string>({
    mutationFn: async (id) =>
      (await api.delete<{ data: { deleted: boolean } }>(`/api/projects/${id}`)).data,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["projects"] });
      void qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

// ---- Products ----

function useCreateProduct() {
  const qc = useQueryClient();
  return useMutation<MutationResult<Product>, Error, CreateProductInput>({
    mutationFn: async (input) =>
      (await api.post<MutationResult<Product>>("/api/products", input)).data,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["products"] });
      void qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}
function useUpdateProduct() {
  const qc = useQueryClient();
  return useMutation<MutationResult<Product>, Error, { id: string; input: UpdateProductInput }>({
    mutationFn: async ({ id, input }) =>
      (await api.put<MutationResult<Product>>(`/api/products/${id}`, input)).data,
    onSuccess: (_, { id }) => {
      void qc.invalidateQueries({ queryKey: ["products"] });
      void qc.invalidateQueries({ queryKey: ["product", id] });
      void qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}
function useDeleteProduct() {
  const qc = useQueryClient();
  return useMutation<{ data: { deleted: boolean } }, Error, string>({
    mutationFn: async (id) =>
      (await api.delete<{ data: { deleted: boolean } }>(`/api/products/${id}`)).data,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["products"] });
      void qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

// ---- Suppliers ----

function useCreateSupplier() {
  const qc = useQueryClient();
  return useMutation<MutationResult<Supplier>, Error, CreateSupplierInput>({
    mutationFn: async (input) =>
      (await api.post<MutationResult<Supplier>>("/api/suppliers", input)).data,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["suppliers"] });
      void qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}
function useUpdateSupplier() {
  const qc = useQueryClient();
  return useMutation<MutationResult<Supplier>, Error, { id: string; input: UpdateSupplierInput }>({
    mutationFn: async ({ id, input }) =>
      (await api.put<MutationResult<Supplier>>(`/api/suppliers/${id}`, input)).data,
    onSuccess: (_, { id }) => {
      void qc.invalidateQueries({ queryKey: ["suppliers"] });
      void qc.invalidateQueries({ queryKey: ["supplier", id] });
      void qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}
function useDeleteSupplier() {
  const qc = useQueryClient();
  return useMutation<{ data: { deleted: boolean } }, Error, string>({
    mutationFn: async (id) =>
      (await api.delete<{ data: { deleted: boolean } }>(`/api/suppliers/${id}`)).data,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["suppliers"] });
      void qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

// ---- Locations ----

function useCreateLocation() {
  const qc = useQueryClient();
  return useMutation<MutationResult<Location>, Error, CreateLocationInput>({
    mutationFn: async (input) =>
      (await api.post<MutationResult<Location>>("/api/locations", input)).data,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["locations"] });
      void qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}
function useUpdateLocation() {
  const qc = useQueryClient();
  return useMutation<MutationResult<Location>, Error, { id: string; input: UpdateLocationInput }>({
    mutationFn: async ({ id, input }) =>
      (await api.put<MutationResult<Location>>(`/api/locations/${id}`, input)).data,
    onSuccess: (_, { id }) => {
      void qc.invalidateQueries({ queryKey: ["locations"] });
      void qc.invalidateQueries({ queryKey: ["location", id] });
      void qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}
function useDeleteLocation() {
  const qc = useQueryClient();
  return useMutation<{ data: { deleted: boolean } }, Error, string>({
    mutationFn: async (id) =>
      (await api.delete<{ data: { deleted: boolean } }>(`/api/locations/${id}`)).data,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["locations"] });
      void qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

// Grouped exports for ergonomic imports.
export const mutations = {
  person: { create: useCreatePerson, update: useUpdatePerson, delete: useDeletePerson },
  department: { create: useCreateDepartment, update: useUpdateDepartment, delete: useDeleteDepartment },
  project: { create: useCreateProject, update: useUpdateProject, delete: useDeleteProject },
  product: { create: useCreateProduct, update: useUpdateProduct, delete: useDeleteProduct },
  supplier: { create: useCreateSupplier, update: useUpdateSupplier, delete: useDeleteSupplier },
  location: { create: useCreateLocation, update: useUpdateLocation, delete: useDeleteLocation },
};
