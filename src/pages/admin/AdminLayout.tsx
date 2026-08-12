import { useState, type ReactNode } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAdminAuth } from "../../store/AdminAuthContext";
import { useCatalog } from "../../store/CatalogContext";
import { useOrders } from "../../store/OrdersContext";
import {
  PlusIcon,
  CloseIcon,
  MenuIcon,
  ShieldIcon,
  ZapIcon,
  LogoutIcon,
  CartIcon,
} from "../../components/Icons";

const navItems = [
  { to: "/admin", label: "Dashboard", icon: ZapIcon, end: true },
  { to: "/admin/products", label: "Products", icon: ShieldIcon, end: false },
  { to: "/admin/products/new", label: "Add product", icon: PlusIcon, end: false },
  { to: "/admin/orders", label: "Orders", icon: CartIcon, end: false },
];

export default function AdminLayout({ children, title, subtitle }: { children: ReactNode; title: string; subtitle?: string }) {
  const { logout, session } = useAdminAuth();
  const { products } = useCatalog();
  const { orders } = useOrders();
  const newOrderCount = orders.filter((o) => o.status === "new").length;
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  function onLogout() {
    logout();
    navigate("/admin/login", { replace: true });
  }

  return (
    <div className="admin-shell">
      <aside className={`admin-sidebar ${mobileOpen ? "open" : ""}`}>
        <div className="admin-brand">
          <Link to="/admin">
            <span className="brand-mark" aria-hidden="true"><img src="/A_for_logo.svg" alt="" className="brand-logo-img" /></span>
            <span className="brand-text">Avenu</span>
            <span className="badge badge-ice admin-pill">Admin</span>
          </Link>
        </div>

        <nav className="admin-nav">
          {navItems.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              className={({ isActive }) => `admin-nav-item ${isActive ? "active" : ""}`}
              onClick={() => setMobileOpen(false)}
            >
              <n.icon size={18} />
              <span>{n.label}</span>
              {n.label === "Products" && <span className="admin-nav-count">{products.length}</span>}
              {n.label === "Orders" && newOrderCount > 0 && (
                <span className="admin-nav-count" style={{ background: "var(--accent-ice)", color: "var(--bg-deep)" }}>{newOrderCount}</span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="admin-side-foot">
          <Link to="/" className="admin-visit-link">↗ View storefront</Link>
          <button className="admin-logout-btn" onClick={onLogout}>
            <LogoutIcon size={16} /> Sign out
          </button>
        </div>
      </aside>

      <div className={`admin-mobile-overlay ${mobileOpen ? "open" : ""}`} onClick={() => setMobileOpen(false)} />
      <button className="admin-burger" aria-label="Toggle sidebar" onClick={() => setMobileOpen((o) => !o)}>
        {mobileOpen ? <CloseIcon size={20} /> : <MenuIcon size={20} />}
      </button>

      <main className="admin-main">
        <header className="admin-head">
          <div>
            <h1>{title}</h1>
            {subtitle && <p className="muted">{subtitle}</p>}
          </div>
          <div className="admin-head-meta">
            <span className="badge"><ShieldIcon size={12} /> Session active</span>
            <span className="muted admin-session-id">session {session?.token.slice(0, 6)}…</span>
          </div>
        </header>

        <div className="admin-body">{children}</div>
      </main>
    </div>
  );
}
