import { useAdminAuth } from "../store/AdminAuthContext";
import { Navigate } from "react-router-dom";
import AdminDashboard from "../pages/admin/AdminDashboard";
import AdminProducts from "../pages/admin/AdminProducts";
import AdminOrders from "../pages/admin/AdminOrders";
import AdminCategories from "../pages/admin/AdminCategories";
import ProductEditor from "../pages/admin/ProductEditor";

type Props = { view: "dashboard" | "products" | "new" | "edit" | "orders" | "categories" };

export default function AdminGuard({ view }: Props) {
  const { isAuthenticated } = useAdminAuth();

  if (!isAuthenticated) return <Navigate to="/admin/login" replace />;

  if (view === "dashboard") return <AdminDashboard />;
  if (view === "products") return <AdminProducts />;
  if (view === "orders") return <AdminOrders />;
  if (view === "categories") return <AdminCategories />;
  if (view === "new" || view === "edit") return <ProductEditor />;
  return <Navigate to="/admin" replace />;
}
