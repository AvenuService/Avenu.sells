import { useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { CheckIcon, ArrowRight, TruckIcon } from "../components/Icons";
import Breadcrumbs from "../components/Breadcrumbs";
import { useOrders } from "../store/OrdersContext";
import { formatPrice } from "../data/products";
import type { OrderBrief } from "../data/orders";

export default function OrderConfirmation() {
  const { id } = useParams<{ id: string }>();
  const code = id || "AVN-XXXXX";
  const { byCode, refresh, status } = useOrders();
  const order = byCode(code);

  // The order is created right before navigation in Checkout; in the local
  // (no-Supabase) path it's already in state, but if we land here before the
  // write settled (Supabase latency) try a refresh once.
  useEffect(() => {
    if (!order && status !== "loading") void refresh();
  }, [order, status, refresh]);

  return (
    <div className="container">
      <Breadcrumbs items={[{ label: "Home", to: "/" }, { label: "Order confirmation" }]} />

      <div className="confirm fade-up">
        <div className="confirm-art"><CheckIcon size={42} /></div>
        <p className="eyebrow">Order received</p>
        <h1>Thank you — your order is confirmed.</h1>
        <p className="muted">A confirmation has been sent to your email. We'll route updates as your essentials ship through our icy-blue supply chain.</p>
        <p className="confirm-order-id" style={{ marginTop: "1rem" }}>Order # {code}</p>

        {order && (
          <div className="card confirm-card" style={{ marginTop: "1.2rem" }}>
            <div className="confirm-summary-head" style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "0.9rem", flexWrap: "wrap", gap: "0.4rem" }}>
              <h3 style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <TruckIcon size={18} style={{ color: "var(--accent-ice)" }} /> Your order
              </h3>
              <span className="admin-order-status" style={{ color: "var(--accent-ice)", borderColor: "var(--accent-ice)" }}>
                {order.status}
              </span>
            </div>

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

            <div className="order-totals" style={{ marginTop: "0.85rem" }}>
              <div className="summary-line"><span>Subtotal</span><span>{formatPrice(order.subtotal)}</span></div>
              {order.shipping > 0 && (
                <div className="summary-line"><span>Shipping</span><span>{formatPrice(order.shipping)}</span></div>
              )}
              {order.tax > 0 && (
                <div className="summary-line"><span>Tax (est.)</span><span>{formatPrice(order.tax)}</span></div>
              )}
              <div className="summary-total"><span>Total</span><span>{formatPrice(order.total)}</span></div>
            </div>

            {order.brief && <BriefBlock brief={order.brief} />}

            {order.customerName && (
              <p className="muted" style={{ marginTop: "0.9rem", fontSize: "0.85rem" }}>
                For: {order.customerName}{order.customerEmail ? ` · ${order.customerEmail}` : ""}
              </p>
            )}
          </div>
        )}

        <div className="card confirm-card">
          <h3 style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}><TruckIcon size={18} style={{ color: "var(--accent-ice)" }} /> What happens next</h3>
          <ul className="pd-features">
            <li>We'll prep your order within one business day and hand it to the carrier.</li>
            <li>You'll receive tracking the moment it leaves our dispatch.</li>
            <li>30-day, no-hassle returns are always available.</li>
          </ul>
        </div>

        <div className="confirm-cta">
          <Link to="/shop" className="btn btn-primary">Keep shopping <ArrowRight size={16} /></Link>
          <Link to="/" className="btn btn-ghost">Back to home</Link>
        </div>
      </div>
    </div>
  );
}

function BriefBlock({ brief }: { brief: OrderBrief }) {
  if (!brief.projectName && !brief.projectType && !brief.brief && !brief.deadline && !brief.budget) {
    return null;
  }
  return (
    <div className="order-brief" style={{ marginTop: "1rem" }}>
      <p className="admin-section-title-small" style={{ marginBottom: "0.4rem" }}>Project brief</p>
      {brief.projectName && <p><strong>Project:</strong> {brief.projectName}</p>}
      {brief.projectType && <p><strong>Type:</strong> {brief.projectType}</p>}
      {brief.deadline && <p><strong>Target launch:</strong> {brief.deadline}</p>}
      {brief.budget && <p><strong>Budget:</strong> {brief.budget}</p>}
      {brief.brief && <p className="order-brief-text">{brief.brief}</p>}
    </div>
  );
}
