import { useEffect, useMemo, useState } from "react";
import AdminLayout from "./AdminLayout";
import { useOrders } from "../../store/OrdersContext";
import { formatPrice } from "../../data/products";
import type { Order, OrderStatus, OrderBrief } from "../../data/orders";
import { supabaseConfigured } from "../../store/supabaseClient";
import { SearchIcon, CheckIcon, ArrowRight } from "../../components/Icons";

const STATUSES: OrderStatus[] = ["new", "paid", "fulfilled", "cancelled"];

const STATUS_LABEL: Record<OrderStatus, string> = {
  new: "New",
  paid: "Paid",
  fulfilled: "Fulfilled",
  cancelled: "Cancelled",
};

const STATUS_COLOR: Record<OrderStatus, string> = {
  new: "var(--accent-ice)",
  paid: "#A6E3A1",
  fulfilled: "rgba(166, 227, 161, 0.85)",
  cancelled: "#ffb4b4",
};

function timeAgo(ts: number) {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

function BriefPreview({ brief }: { brief: OrderBrief | null | undefined }) {
  if (!brief) return null;
  return (
    <div className="order-brief">
      {brief.projectName && <p><strong>Project:</strong> {brief.projectName}</p>}
      {brief.projectType && <p><strong>Type:</strong> {brief.projectType}</p>}
      {brief.deadline && <p><strong>Target launch:</strong> {brief.deadline}</p>}
      {brief.budget && <p><strong>Budget:</strong> {brief.budget}</p>}
      {brief.brief && <p className="order-brief-text">{brief.brief}</p>}
    </div>
  );
}

export default function AdminOrders() {
  const { orders, status, error, updateStatus, refresh } = useOrders();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | OrderStatus>("all");
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => { void refresh(); }, [refresh]);

  const filtered = useMemo(() => {
    let list = orders.slice();
    if (filter !== "all") list = list.filter((o) => o.status === filter);
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter((o) =>
        [o.code, o.customerEmail ?? "", o.customerName ?? "", o.notes ?? ""]
          .join(" ")
          .toLowerCase()
          .includes(q),
      );
    }
    return list.sort((a, b) => b.createdAt - a.createdAt);
  }, [orders, query, filter]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: orders.length, new: 0, paid: 0, fulfilled: 0, cancelled: 0 };
    for (const o of orders) c[o.status] = (c[o.status] ?? 0) + 1;
    return c;
  }, [orders]);

  const revenue = useMemo(
    () =>
      orders
        .filter((o) => o.status === "paid" || o.status === "fulfilled")
        .reduce((s, o) => s + o.total, 0),
    [orders],
  );

  return (
    <AdminLayout title="Orders" subtitle="Every order placed on Avenu, with quick status controls.">
      {!supabaseConfigured && (
        <div className="admin-config-warn card">
          <div className="acw-icon">⚠</div>
          <div>
            <strong>Supabase not configured — orders only save locally to this browser.</strong>
            <p className="muted">
              Add <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> to
              <code>.env.local</code>. Until then, completed checkouts appear here only in this session.
            </p>
          </div>
        </div>
      )}

      {status === "loading" && (
        <div className="admin-sync"><span className="spinner" /> <span className="muted">Loading orders…</span></div>
      )}
      {status === "error" && (
        <div className="admin-config-warn card">
          <div className="acw-icon">⚠</div>
          <div>
            <strong>Could not load orders from Supabase.</strong>
            <p className="muted">{error}</p>
          </div>
        </div>
      )}

      <div className="admin-stats-grid">
        <div className="card admin-stat">
          <div className="admin-stat-head"><span className="admin-stat-label">Total orders</span></div>
          <div className="admin-stat-value">{orders.length}</div>
        </div>
        <div className="card admin-stat">
          <div className="admin-stat-head"><span className="admin-stat-label">New (awaiting)</span></div>
          <div className="admin-stat-value" style={{ color: "var(--accent-ice)" }}>{counts.new ?? 0}</div>
        </div>
        <div className="card admin-stat">
          <div className="admin-stat-head"><span className="admin-stat-label">Paid</span></div>
          <div className="admin-stat-value" style={{ color: "#A6E3A1" }}>{counts.paid ?? 0}</div>
        </div>
        <div className="card admin-stat">
          <div className="admin-stat-head"><span className="admin-stat-label">Recognized revenue</span></div>
          <div className="admin-stat-value">{orders.length ? formatPrice(revenue) : "—"}</div>
          <div className="admin-stat-hint muted">paid + fulfilled</div>
        </div>
      </div>

      <div className="admin-products-bar" style={{ marginTop: "1.5rem" }}>
        <div className="admin-search-mini">
          <SearchIcon size={16} />
          <input
            className="aps-search"
            placeholder="Search by code, email, or name…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="admin-filter-chips">
          <button className={`af-chip ${filter === "all" ? "active" : ""}`} onClick={() => setFilter("all")}>
            All ({counts.all})
          </button>
          {STATUSES.map((s) => (
            <button
              key={s}
              className={`af-chip ${filter === s ? "active" : ""}`}
              onClick={() => setFilter(s)}
            >
              {STATUS_LABEL[s]} ({counts[s] ?? 0})
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="admin-empty card" style={{ marginTop: "1.5rem" }}>
          <div className="admin-empty-glyph">∅</div>
          <h3>{orders.length === 0 ? "No orders yet" : "Nothing matched that filter"}</h3>
          <p className="muted">
            {orders.length === 0
              ? "When a shopper completes checkout, the order will land here with a code, items, and status controls."
              : "Try a different search or clear the status filter."}
          </p>
        </div>
      ) : (
        <div className="admin-orders-list" style={{ marginTop: "1.5rem" }}>
          {filtered.map((o) => (
            <div className="card admin-order-row" key={o.id}>
              <button
                className="admin-order-summary"
                onClick={() => setExpanded((p) => (p === o.id ? null : o.id))}
                aria-expanded={expanded === o.id}
              >
                <span className="admin-order-code">{o.code}</span>
                <span className="admin-order-customer">{o.customerName || o.customerEmail || "Anonymous"}</span>
                <span
                  className="admin-order-status"
                  style={{ color: STATUS_COLOR[o.status], borderColor: STATUS_COLOR[o.status] }}
                >
                  {STATUS_LABEL[o.status]}
                </span>
                <span className="admin-order-total">{formatPrice(o.total)}</span>
                <span className="admin-order-time">{timeAgo(o.createdAt)}</span>
                <ArrowRight
                  size={16}
                  className="admin-order-chevron"
                  style={{ transform: expanded === o.id ? "rotate(90deg)" : "none", transition: "transform 0.15s ease" }}
                />
              </button>

              {expanded === o.id && <OrderDetail order={o} onSetStatus={(s) => void updateStatus(o.id, s)} />}
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}

function OrderDetail({
  order,
  onSetStatus,
}: {
  order: Order;
  onSetStatus: (s: OrderStatus) => void;
}) {
  return (
    <div className="admin-order-detail">
      <div className="admin-order-detail-grid">
        <div>
          <p className="admin-section-title-small">Items</p>
          <ul className="orders-items">
            {order.items.map((it, i) => (
              <li key={i}>
                <span className="order-qty">×{it.quantity}</span>
                <span className="order-name">{it.name}</span>
                {it.color && <span className="muted order-color">· {it.color}</span>}
                <span className="order-price">{formatPrice(it.price * it.quantity)}</span>
              </li>
            ))}
          </ul>

          <div className="order-totals">
            <div className="summary-line"><span>Subtotal</span><span>{formatPrice(order.subtotal)}</span></div>
            {order.shipping > 0 && (
              <div className="summary-line"><span>Shipping</span><span>{formatPrice(order.shipping)}</span></div>
            )}
            {order.tax > 0 && (
              <div className="summary-line"><span>Tax</span><span>{formatPrice(order.tax)}</span></div>
            )}
            <div className="summary-total"><span>Total</span><span>{formatPrice(order.total)}</span></div>
          </div>
        </div>

        <div>
          <p className="admin-section-title-small">Customer</p>
          <p><strong>{order.customerName || "—"}</strong></p>
          <p className="muted">{order.customerEmail || "no email on file"}</p>
          <p className="muted" style={{ fontSize: 12, marginTop: 4 }}>
            Placed {new Date(order.createdAt).toLocaleString()}
          </p>

          {order.brief && (
            <>
              <p className="admin-section-title-small" style={{ marginTop: "1rem" }}>Project brief</p>
              <BriefPreview brief={order.brief} />
            </>
          )}

          <p className="admin-section-title-small" style={{ marginTop: "1rem" }}>Status</p>
          <div className="order-status-row">
            {STATUSES.map((s) => (
              <button
                key={s}
                className={`order-status-btn ${order.status === s ? "active" : ""}`}
                onClick={() => onSetStatus(s)}
              >
                {order.status === s && <CheckIcon size={12} />} {STATUS_LABEL[s]}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
