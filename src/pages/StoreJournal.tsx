import { Link } from "react-router-dom";
import { ArrowRight } from "../components/Icons";
import { journalPosts } from "../data/journal";

export default function StoreJournal() {
  return (
    <div className="container" style={{ paddingBlock: "3.5rem 5rem" }}>
      <p className="eyebrow">The dispatch</p>
      <h1 className="section-title" style={{ marginBottom: "0.75rem" }}>
        Store Journal
      </h1>
      <p className="muted" style={{ marginBottom: "2rem", maxWidth: "640px" }}>
        Notes on catalog, craft, and the decisions that keep Avenu tight.
      </p>

      <div style={{ display: "grid", gap: "0.75rem", maxWidth: "760px" }}>
        {journalPosts.map((p) => (
          <Link
            key={p.slug}
            to={`/store-journal/${p.slug}`}
            className="card"
            style={{
              display: "block",
              padding: "1.25rem 1.4rem",
              background: "rgba(2, 16, 36, 0.55)",
              border: "1px solid rgba(56, 189, 248, 0.10)",
              borderRadius: "14px",
              textDecoration: "none",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <time dateTime={p.date} className="muted" style={{ fontSize: "0.78rem" }}>
                {p.date}
              </time>
              <ArrowRight size={16} style={{ color: "var(--text-muted)" }} />
            </div>
            <h3 style={{ margin: "0.4rem 0 0.2rem", color: "var(--text-primary)" }}>
              {p.title}
            </h3>
            <p className="muted" style={{ fontSize: "0.88rem", lineHeight: 1.55 }}>
              {p.excerpt}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
