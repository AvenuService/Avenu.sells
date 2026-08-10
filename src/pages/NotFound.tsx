import { Link } from "react-router-dom";
import { ArrowRight } from "../components/Icons";

export default function NotFound() {
  return (
    <div className="container section">
      <div className="empty-state">
        <p className="eyebrow">404</p>
        <h2 style={{ fontSize: "2.4rem", marginTop: "0.5rem" }}>This page wandered off.</h2>
        <p className="muted">Maybe the URL is wrong, or maybe the product drifted out of the catalog.</p>
        <Link to="/" className="btn btn-primary btn-lg" style={{ marginTop: "1rem" }}>Back to home <ArrowRight size={16} /></Link>
      </div>
    </div>
  );
}
