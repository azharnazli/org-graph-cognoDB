import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "./components/layout/AppLayout";
import { DashboardPage } from "./pages/Dashboard";
import { PeopleListPage } from "./pages/PeopleList";
import { PersonDetailPage } from "./pages/PersonDetail";
import { DepartmentsListPage } from "./pages/DepartmentsList";
import { DepartmentDetailPage } from "./pages/DepartmentDetail";
import { ProjectsListPage } from "./pages/ProjectsList";
import { ProjectDetailPage } from "./pages/ProjectDetail";
import { ProductsListPage } from "./pages/ProductsList";
import { ProductDetailPage } from "./pages/ProductDetail";
import { SuppliersListPage } from "./pages/SuppliersList";
import { SupplierDetailPage } from "./pages/SupplierDetail";
import { LocationsListPage } from "./pages/LocationsList";
import { GraphExplorerPage } from "./pages/GraphExplorer";
import { NotFoundPage } from "./pages/NotFound";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="people" element={<PeopleListPage />} />
          <Route path="people/:id" element={<PersonDetailPage />} />
          <Route path="departments" element={<DepartmentsListPage />} />
          <Route path="departments/:id" element={<DepartmentDetailPage />} />
          <Route path="projects" element={<ProjectsListPage />} />
          <Route path="projects/:id" element={<ProjectDetailPage />} />
          <Route path="products" element={<ProductsListPage />} />
          <Route path="products/:id" element={<ProductDetailPage />} />
          <Route path="suppliers" element={<SuppliersListPage />} />
          <Route path="suppliers/:id" element={<SupplierDetailPage />} />
          <Route path="locations" element={<LocationsListPage />} />
          <Route path="explorer" element={<GraphExplorerPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
