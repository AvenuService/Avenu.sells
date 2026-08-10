import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AdminLayout from "./AdminLayout";
import { useCatalog } from "../../store/CatalogContext";
import { formatPrice, type Product } from "../../data/products";
import {
  EditIcon,
  TrashIcon,
  PlusIcon,
  SearchIcon,
  StarFilledIcon,
  DigitalIcon,
  BoxIcon,
  GlobeIcon,
} from "../../components/Icons";
import ConfirmDialog from "../../components/ConfirmDialog";

export default function AdminProducts() {
  const { products, deleteProduct, refresh } = useCatalog();
  const navigate = useNavigate();

  useEffect(() => { void refresh(); }, [refresh]);

  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "digital" | "physical" | "service" | "featured">("all");
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [confirmWipe, setConfirmWipe] = useState(false);

  const filtered = useMemo(() => {
    let list = products.slice();
    if (filter === "digital") list = list.filter((p) => p.type === "digital");
    if (filter === "physical") list = list.filter((p) => p.type === "physical");
    if (filter === "service") list = list.filter((p) => p.type === "service");
    if (filter === "featured") list = list.filter((p) => p.featured);
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter((p) =>
        [p.name, p.brand, p.category, p.slug, p.tagline].join(" ").toLowerCase().includes(q),
      );
    }
    return list.sort((a, b) => b.createdAt - a.createdAt);
  }, [products, query, filter]);

  const productForConfirm = products.find((p) => p.id === confirmId) || null;

  return (
    <AdminLayout title="Products" subtitle="Manage your entire Avenu catalog.">
      <div className="admin-products-bar">
        <div className="admin-search-mini">
          <SearchIcon size={16} />
          <input className="aps-search" placeholder="Search products…" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <div className="admin-filter-chips">
          {(["all", "digital", "physical", "service", "featured"] as const).map((f) => (
            <button key={f} className={`af-chip ${filter === f ? "active" : ""}`} onClick={() => setFilter(f)}>
              {f === "all" && "All"}
              {f === "digital" && <><DigitalIcon size={13} /> Digital</>}
              {f === "physical" && <><BoxIcon size={13} /> Physical</>}
              {f === "service" && <><GlobeIcon size={13} /> Service</>}
              {f === "featured" && <><StarFilledIcon size={13} /> Featured</>}
              <span className="af-count">
                {f === "all" ? products.length
                  : f === "digital" ? products.filter((p) => p.type === "digital").length
                  : f === "physical" ? products.filter((p) => p.type === "physical").length
                  : f === "service" ? products.filter((p) => p.type === "service").length
                  : products.filter((p) => p.featured).length}
              </span>
            </button>
          ))}
        </div>
        <div className="admin-products-actions">
          {products.length > 0 && <button className="btn btn-ghost btn-sm" onClick={() => setConfirmWipe(true)}><TrashIcon size={14} /> Wipe catalog</button>}
          <Link to="/admin/products/new" className="btn btn-primary btn-sm"><PlusIcon size={16} /> Add product</Link>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="admin-empty card">
          <div className="admin-empty-glyph">∅</div>
          <h3>{products.length === 0 ? "No products yet" : "No matches found"}</h3>
          <p className="muted">
            {products.length === 0
              ? "Add your first digital or physical product to populate your storefront."
              : "Try a different filter or search term."}
          </p>
          {products.length === 0 && <Link to="/admin/products/new" className="btn btn-primary"><PlusIcon size={16} /> Add your first product</Link>}
        </div>
      ) : (
        <div className="admin-table-wrap card">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Type</th>
                <th>Category</th>
                <th>Slug</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Status</th>
                <th>Added</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p: Product) => (
                <tr key={p.id}>
                  <td>
                    <Link to={`/admin/products/${p.id}`} className="apt-product">
                      <span className="apt-art" style={{ backgroundImage: `linear-gradient(135deg, ${p.gradient[0]}, ${p.gradient[1]})` }}>
                        {p.imageBanner ? <img src={p.imageBanner} alt="" /> : <span>{p.name.charAt(0)}</span>}
                      </span>
                      <span className="apt-text">
                        <strong>{p.name}</strong>
                        <span className="muted">{p.brand}</span>
                      </span>
                    </Link>
                  </td>
                  <td>
                    <span className={`type-pill type-${p.type}`}>
                      {p.type === "digital" ? <DigitalIcon size={12} />
                        : p.type === "physical" ? <BoxIcon size={12} />
                        : <GlobeIcon size={12} />}
                      {p.type}
                    </span>
                  </td>
                  <td style={{ textTransform: "capitalize" }}>{p.category}</td>
                  <td><code className="apt-slug">/product/{p.slug}</code></td>
                  <td>
                    <strong>{formatPrice(p.price)}</strong>
                    {p.oldPrice && <span className="apt-old muted"> · {formatPrice(p.oldPrice)}</span>}
                  </td>
                  <td>{p.type === "digital" || p.type === "service" ? <span className="muted">∞</span> : p.stock}</td>
                  <td>
                    <div className="apt-badges">
                      {p.featured && <span className="badge badge-ice">featured</span>}
                      {p.bestseller && <span className="badge">bestseller</span>}
                      {p.discount ? <span className="badge">-{p.discount}%</span> : null}
                    </div>
                  </td>
                  <td className="muted">{new Date(p.createdAt).toLocaleDateString()}</td>
                  <td className="apt-actions">
                    <button className="apt-edit" onClick={() => navigate(`/admin/products/${p.id}`)} aria-label="Edit"><EditIcon size={14} /></button>
                    <button className="apt-trash" onClick={() => setConfirmId(p.id)} aria-label="Delete"><TrashIcon size={14} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {productForConfirm && (
        <ConfirmDialog
          open
          title={`Delete “${productForConfirm.name}”?`}
          message="This permanently removes the product from your storefront. This cannot be undone."
          confirmLabel="Delete product"
          danger
          onCancel={() => setConfirmId(null)}
          onConfirm={async () => { if (productForConfirm) await deleteProduct(productForConfirm.id); setConfirmId(null); }}
        />
      )}
      {confirmWipe && (
        <ConfirmDialog
          open
          title="Wipe the entire catalog?"
          message="This permanently removes all products. Make sure you've exported a backup if needed."
          confirmLabel="Wipe everything"
          danger
          onCancel={() => setConfirmWipe(false)}
          onConfirm={async () => {
            await Promise.all(products.map((p) => deleteProduct(p.id)));
            setConfirmWipe(false);
          }}
        />
      )}
    </AdminLayout>
  );
}
