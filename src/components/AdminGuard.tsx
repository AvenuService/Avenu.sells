import { useAdminAuth } from "../store/AdminAuthContext";
import { Navigate } from "react-router-dom";
import AdminDashboard from "../pages/admin/AdminDashboard";
import AdminProducts from "../pages/admin/AdminProducts";
import ProductEditor from "../pages/admin/ProductEditor";

type Props = { view: "dashboard" | "products" | "new" | "edit" };

export default function AdminGuard({ view }: Props) {
  const { isAuthenticated } = useAdminAuth();

  if (!isAuthenticated) return <Navigate to="/admin/login" replace />;

  if (view === "dashboard") return <AdminDashboard />;
  if (view === "products") return <AdminProducts />;
  if (view === "new" || view === "edit") return <ProductEditor />;
  return <Navigate to="/admin" replace />;
}
