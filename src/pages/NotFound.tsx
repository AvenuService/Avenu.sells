import { Link } from "react-router-dom";
import { ArrowRight } from "../components/Icons";

const popular = [
  { to: "/shop?category=websites", label: "Website packages" },
  { to: "/shop?category=software", label: "Software" },
  { to: "/shop?category=templates", label: "Templates" },
  { to: "/shop?category=audio", label: "Audio" },
  { to: "/shop?category=apparel", label: "Apparel" },
];

export default function NotFound() {
  return (
    <div className="container section">
      <div className="empty-state">
        <p className="eyebrow">404</p>
        <h2 style={{ fontSize: "2.4rem", marginTop: "0.5rem" }}>This page wandered off.</h2>
        <p className="muted">Maybe the URL is wrong, or maybe the product drifted out of the catalog.</p>
        <Link to="/" className="btn btn-primary btn-lg" style={{ marginTop: "1rem" }}>Back to home <ArrowRight size={16} /></Link>
        <p className="muted" style={{ marginTop: "1.6rem", fontSize: "0.85rem" }}>Or try one of these:</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", justifyContent: "center", marginTop: "0.4rem" }}>
          {popular.map((p) => (
            <Link key={p.to} to={p.to} className="btn btn-ghost btn-sm">{p.label}</Link>
          ))}
        </div>
      </div>
    </div>
  );
}
