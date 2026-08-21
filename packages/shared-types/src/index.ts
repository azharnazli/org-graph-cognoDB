// Shared types between backend (Express) and frontend (React).
// Keep this package dependency-free.

export type RoleLevel = "IC" | "Manager" | "Director" | "VP" | "C-level";

export type ProjectStatus = "planned" | "active" | "done";

export interface Person {
  id: string;
  name: string;
  email: string;
  title: string;
  joinedAt: string; // ISO date
}

export interface Department {
  id: string;
  name: string;
  costCenter: string;
}

export interface Role {
  id: string;
  level: RoleLevel;
}

export interface Project {
  id: string;
  name: string;
  status: ProjectStatus;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
}

export interface Supplier {
  id: string;
  name: string;
  rating: number;
}

export interface Location {
  id: string;
  city: string;
  country: string;
  region: string;
}

// ---------- API responses ----------

export interface Paginated<T> {
  data: T[];
  page: number;
  pageSize: number;
  total: number;
}

export interface PersonDetail extends Person {
  reportsTo: Person | null;
  directReports: Person[];
  department: Department | null;
  role: Role | null;
  projects: Project[];
}

export interface DepartmentDetail extends Department {
  location: Location | null;
  people: Person[];
  projects: Project[];
}

export interface ProjectDetail extends Project {
  managers: Person[];
  department: Department | null;
  products: Product[];
}

export interface ProductDetail extends Product {
  suppliers: Array<Supplier & { location: Location | null }>;
  projects: Project[];
}

export interface SupplierDetail extends Supplier {
  location: Location | null;
  products: Product[];
}

export interface ApiError {
  error: string;
  message: string;
  details?: unknown;
}

export interface HealthResponse {
  status: "ok";
  database: "connected" | "unreachable";
  nodeCount: number;
}
