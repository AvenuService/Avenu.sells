import { Link } from "react-router-dom";
import Breadcrumbs from "../components/Breadcrumbs";
import Seo from "../components/Seo";

/**
 * Generic "under construction / maintenance" page reused for the footer
 * placeholder routes (About, Sustainability, Press, Careers, Store Journal).
 * The title is passed in per route.
 */
export default function UnderConstruction({
  title = "Page Coming Soon",
}: {
  title?: string;
}) {
  const label = (title || "").replace(/\s*·\s*.*/, "");
  return (
    <div className="container" style={{ paddingBlock: "4rem 5rem" }}>
      <Seo title={title} description="This page is under construction at Avenu." />
      <Breadcrumbs items={[{ label: "Home", to: "/" }, { label: label || title }]} />

      <div
        className="fade-up"
        style={{ maxWidth: "640px", margin: "1.5rem auto 0", textAlign: "center" }}
      >
        <p className="eyebrow" style={{ marginBottom: "0.7rem" }}>
          Notice
        </p>
        <h1 className="section-title" style={{ marginBottom: "1rem" }}>
          {title}
        </h1>
        <p
          className="muted"
          style={{
            fontSize: "0.92rem",
            maxWidth: "480px",
            margin: "0 auto 1.5rem",
          }}
        >
          This page is under construction / maintenance. Check back soon for
          updates.
        </p>
        <Link to="/" className="btn btn-ghost btn-sm">
          ← Back to Avenu
        </Link>
      </div>
    </div>
  );
}
