import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useOrders } from "../store/OrdersContext";
import { useShopperAuth } from "../store/ShopperAuthContext";
import Breadcrumbs from "../components/Breadcrumbs";
import Rating from "../components/Rating";
import { CheckIcon, SearchIcon, ZapIcon } from "../components/Icons";
import { formatPrice } from "../data/products";

const STATUS_LABELS: Record<string, string> = {
  new: "Processing",
  paid: "Paid",
  fulfilled: "Fulfilled",
  cancelled: "Cancelled",
};

export default function TrackOrder() {
  const { orders, byCode, status, refresh } = useOrders();
  const { session } = useShopperAuth();

  const [code, setCode] = useState("");
  const [submitted, setSubmitted] = useState(false);

  // If the shopper is logged in, pre-fill their most recent order code.
  const recentCode = useMemo(() => {
    if (!session?.user?.email) return "";
    const email = session.user.email.toLowerCase().trim();
    const mine = orders.filter((o) => o.customerEmail?.toLowerCase().trim() === email);
    if (mine.length === 0) return "";
    return mine[0].code;
  }, [orders, session?.user?.email]);

  useEffect(() => {
    if (!submitted && recentCode) {
      setCode(recentCode);
    }
  }, [recentCode, submitted]);

  useEffect(() => {
    if (status === "loading") void refresh();
  }, [status, refresh]);

  const order = submitted ? byCode(code.trim().toUpperCase()) : undefined;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
  }

  const found = !!order;

  return (
    <div className="container section">
      <Breadcrumbs items={[{ label: "Home", to: "/" }, { label: "Track order" }]} />

      <div className="fade-up" style={{ marginBottom: "1.6rem" }}>
        <p className="eyebrow">Order tracking</p>
        <h1 className="section-title" style={{ marginBottom: 0 }}>
          Track your order
        </h1>
      </div>

      <div className="card" style={{ padding: "1.2rem 1.4rem", marginBottom: "1.4rem" }}>
        <form onSubmit={handleSubmit} style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <SearchIcon size={18} style={{ color: "var(--accent-muted)" }} />
          <input
            className="field"
            type="text"
            placeholder="Enter your order code (e.g. AVN-AB12C)"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            style={{ flex: 1 }}
          />
          <button type="submit" className="btn btn-primary" style={{ whiteSpace: "nowrap" }}>
            Track
          </button>
        </form>
      </div>

      {submitted && (
        <>
          {found ? (
            <div className="fade-up">
              <div className="card" style={{ padding: "1.4rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: "0.5rem" }}>
                  <h2 style={{ margin: 0 }}>Order #{order.code}</h2>
                  <span
                    className="admin-order-status"
                    style={{
                      color:
                        order.status === "paid" || order.status === "fulfilled"
                          ? "#4ade80"
                          : order.status === "cancelled"
                          ? "#f87171"
                          : "#facc15",
                      borderColor:
                        order.status === "paid" || order.status === "fulfilled"
                          ? "#4ade80"
                          : order.status === "cancelled"
                          ? "#f87171"
                          : "#facc15",
                    }}
                  >
                    {STATUS_LABELS[order.status] ?? order.status}
                  </span>
                </div>

                <p className="muted" style={{ marginTop: "0.3rem", fontSize: "0.85rem" }}>
                  Placed on {new Date(order.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                </p>

                <div style={{ marginTop: "1rem" }}>
                  <Rating value={5} />
                  <span className="muted" style={{ marginLeft: "0.5rem", fontSize: "0.8rem" }}>
                    {order.items.length} {order.items.length === 1 ? "item" : "items"}
                  </span>
                </div>

                <div style={{ marginTop: "1rem" }}>
                  {order.items.map((item) => (
                    <div
                      key={item.productId}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        padding: "0.5rem 0",
                        borderBottom: "1px solid rgba(255,255,255,0.06)",
                      }}
                    >
                      <span>{item.name} × {item.quantity}</span>
                      <span>{formatPrice(item.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: "1rem", borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "0.8rem" }}>
                  <div className="summary-line">
                    <span className="muted">Subtotal</span>
                    <span>{formatPrice(order.subtotal)}</span>
                  </div>
                  <div className="summary-line">
                    <span className="muted">Shipping</span>
                    <span>{order.shipping === 0 ? "Free" : formatPrice(order.shipping)}</span>
                  </div>
                  <div className="summary-line">
                    <span className="muted">Tax</span>
                    <span>{formatPrice(order.tax)}</span>
                  </div>
                  <div className="summary-total">
                    <span>Total</span>
                    <span>{formatPrice(order.total)}</span>
                  </div>
                </div>

                {order.status === "paid" || order.status === "fulfilled" ? (
                  <div style={{ marginTop: "1rem", padding: "0.7rem 1rem", background: "rgba(74, 222, 128, 0.08)", border: "1px solid rgba(74, 222, 128, 0.3)", borderRadius: "8px", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <CheckIcon size={16} style={{ color: "#4ade80" }} />
                    <span style={{ color: "#4ade80", fontWeight: 500 }}>Payment confirmed.</span>
                  </div>
                ) : (
                  <div style={{ marginTop: "1rem", padding: "0.7rem 1rem", background: "rgba(250, 202, 21, 0.08)", border: "1px solid rgba(250, 202, 21, 0.3)", borderRadius: "8px", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <ZapIcon size={16} style={{ color: "#facc15" }} />
                    <span style={{ color: "#facc15", fontWeight: 500 }}>Awaiting payment confirmation.</span>
                  </div>
                )}
              </div>

              <div style={{ marginTop: "1rem", display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
                <Link to={`/order/${order.code}`} className="btn btn-ghost btn-sm">
                  View full receipt
                </Link>
                <Link to="/shop" className="btn btn-ghost btn-sm">
                  Continue shopping
                </Link>
              </div>
            </div>
          ) : (
            <div className="fade-up">
              <div className="card" style={{ padding: "1.4rem", textAlign: "center" }}>
                <div style={{ width: 64, height: 64, margin: "0 auto 1rem", borderRadius: "50%", background: "rgba(248, 113, 113, 0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <SearchIcon size={28} style={{ color: "#f87171" }} />
                </div>
                <h3>No order found</h3>
                <p className="muted" style={{ maxWidth: "360px", margin: "0 auto 1rem" }}>
                  We couldn't find an order with the code <strong>{code.trim().toUpperCase() || "(empty)"}</strong>.
                  Please double-check the code from your confirmation email.
                </p>
                <Link to="/track" className="btn btn-primary" onClick={() => setSubmitted(false)}>
                  Try again
                </Link>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
