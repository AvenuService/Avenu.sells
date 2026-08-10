import { useEffect } from "react";
import { Link } from "react-router-dom";
import AdminLayout from "./AdminLayout";
import { useCatalog } from "../../store/CatalogContext";
import { formatPrice } from "../../data/products";
import {
  PlusIcon,
  DigitalIcon,
  BoxIcon,
  StarFilledIcon,
  ArrowRight,
  EditIcon,
  GlobeIcon,
} from "../../components/Icons";
import { supabaseConfigured } from "../../store/supabaseClient";

export default function AdminDashboard() {
  const { products, status, refresh } = useCatalog();

  // Pull the latest from Supabase when the dashboard mounts
  useEffect(() => { void refresh(); }, [refresh]);

  const digitalCount = products.filter((p) => p.type === "digital").length;
  const physicalCount = products.filter((p) => p.type === "physical").length;
  const serviceCount = products.filter((p) => p.type === "service").length;
  const featuredCount = products.filter((p) => p.featured).length;
  const inventoryValue = products.reduce((s, p) => s + p.price * Math.max(0, p.stock), 0);
  const avgRating = products.length
    ? products.reduce((s, p) => s + p.rating, 0) / products.length
    : 0;

  const recent = [...products].sort((a, b) => b.createdAt - a.createdAt).slice(0, 5);

  const stats = [
    { label: "Total products", value: products.length, hint: "in catalog", icon: BoxIcon },
    { label: "Digital products", value: digitalCount, hint: "downloadable", icon: DigitalIcon },
    { label: "Physical products", value: physicalCount, hint: "shippable", icon: BoxIcon },
    { label: "Services", value: serviceCount, hint: "custom builds", icon: GlobeIcon },
    { label: "Featured", value: featuredCount, hint: "highlighted", icon: StarFilledIcon },
    { label: "Avg rating", value: avgRating ? avgRating.toFixed(2) : "—", hint: "across catalog", icon: StarFilledIcon },
    { label: "Inventory value", value: formatPrice(inventoryValue), hint: "stock × price", icon: BoxIcon },
  ];

  return (
    <AdminLayout title="Dashboard" subtitle="A snapshot of your live catalog.">
      {!supabaseConfigured && (
        <div className="admin-config-warn card">
          <div className="acw-icon">⚠</div>
          <div>
            <strong>Supabase not configured — products only save locally to this browser.</strong>
            <p className="muted">
              Add <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> to
              <code>.env.local</code> (see README) so products sync worldwide. While unconfigured,
              products added here only show in this browser.
            </p>
          </div>
        </div>
      )}

      {status === "loading" && (
        <div className="admin-sync">
          <span className="spinner" /> <span className="muted">Syncing catalog from Supabase…</span>
        </div>
      )}

      <div className="admin-stats-grid stagger">
        {stats.map((s) => (
          <div className="card admin-stat" key={s.label}>
            <div className="admin-stat-head">
              <span className="admin-stat-icon"><s.icon size={18} /></span>
              <span className="admin-stat-label">{s.label}</span>
            </div>
            <div className="admin-stat-value">{s.value}</div>
            <div className="admin-stat-hint muted">{s.hint}</div>
          </div>
        ))}
      </div>

      <div className="admin-dash-actions">
        <Link to="/admin/products/new" className="btn btn-primary btn-lg">
          <PlusIcon size={18} /> Add a new product
        </Link>
        <Link to="/admin/products" className="btn btn-ghost btn-lg">
          View all products <ArrowRight size={16} />
        </Link>
      </div>

      <section className="admin-section">
        <header className="admin-section-head">
          <h2>Recently added</h2>
          <Link to="/admin/products" className="admin-section-link">Manage →</Link>
        </header>

        {recent.length === 0 ? (
          <div className="admin-empty card">
            <div className="admin-empty-glyph">∅</div>
            <h3>No products yet</h3>
            <p className="muted">Your catalog is empty. Add your first product — digital or physical — to start selling on Avenu.</p>
            <Link to="/admin/products/new" className="btn btn-primary"><PlusIcon size={16} /> Add your first product</Link>
          </div>
        ) : (
          <div className="admin-recent-list">
            {recent.map((p) => (
              <div className="admin-recent-row card" key={p.id}>
                <div className="admin-recent-art" style={{ backgroundImage: `linear-gradient(135deg, ${p.gradient[0]}, ${p.gradient[1]})` }}>
                  {p.imageBanner ? <img src={p.imageBanner} alt="" /> : <span>{p.name.charAt(0)}</span>}
                </div>
                <div className="admin-recent-info">
                  <div className="admin-recent-top">
                    <span className="badge">
                      {p.type === "digital" ? "Digital" : p.type === "physical" ? "Physical" : "Service"}
                    </span>
                    <span className="muted" style={{ textTransform: "capitalize" }}>{p.category}</span>
                  </div>
                  <Link to={`/admin/products/${p.id}`} className="admin-recent-name">{p.name}</Link>
                  <span className="admin-recent-slug muted">/product/{p.slug}</span>
                </div>
                <div className="admin-recent-price">{formatPrice(p.price)}</div>
                <Link to={`/admin/products/${p.id}`} className="admin-recent-edit" aria-label="Edit"><EditIcon size={16} /></Link>
              </div>
            ))}
          </div>
        )}
      </section>
    </AdminLayout>
  );
}
