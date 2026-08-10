import { useParams, Link } from "react-router-dom";
import { CheckIcon, ArrowRight, TruckIcon } from "../components/Icons";
import Breadcrumbs from "../components/Breadcrumbs";

export default function OrderConfirmation() {
  const { id } = useParams<{ id: string }>();
  const orderId = id || "AVN-XXXXX";

  return (
    <div className="container">
      <Breadcrumbs items={[{ label: "Home", to: "/" }, { label: "Order confirmation" }]} />

      <div className="confirm fade-up">
        <div className="confirm-art"><CheckIcon size={42} /></div>
        <p className="eyebrow">Order received</p>
        <h1>Thank you — your order is confirmed.</h1>
        <p className="muted">A confirmation has been sent to your email. We'll route updates as your essentials ship through our icy-blue supply chain.</p>
        <p className="confirm-order-id" style={{ marginTop: "1rem" }}>Order # {orderId}</p>

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
