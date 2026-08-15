import { Link } from "react-router-dom";
import Breadcrumbs from "../components/Breadcrumbs";

/* ============================================================
   Creator / Credits page.
   One small crew. This page gives credit and a tiny bit of
   context for each hand involved in shipping Avenu.
   ============================================================ */

const contributors = [
  {
        initials: "Y",
    name: "Yoro",
    role: "Founder · Builder & Host",
    tags: ["Continubbter"],
    blurb:
      "Built and hosts Avenu. Controls the roadmap, keeps infra green, and ships the fixes and updates that make the storefront tick.",
    dot: "var(--accent-ice)",
  },
  {
    initials: "SY",
    name: "Silvin | Yoro",
        role: "Project Manager",
    tags: [],
    blurb:
      "Drives the release schedule and scope — keeps every wave on track and the roadmap sharp.",
    dot: "var(--accent-soft)",
  },
  {
    initials: "C",
    name: "Continubbter",
        role: "Design",
    tags: [],
    blurb:
      "Crafts the look, motion, and overall experience — the interface and visual direction you see everywhere.",
    dot: "var(--accent-soft)",
  },
];

export default function Creator() {
  return (
    <div className="container" style={{ paddingBlock: "3rem 5rem" }}>
      <Breadcrumbs items={[{ label: "Home", to: "/" }, { label: "Creator" }]} />

      <header className="fade-up" style={{ maxWidth: "720px", margin: "1.5rem auto 0", textAlign: "center" }}>
        <p className="eyebrow" style={{ marginBottom: "0.6rem" }}>Credits</p>
        <h1 className="section-title" style={{ marginBottom: "1rem" }}>
          The people behind Avenu
        </h1>
        <p className="muted" style={{ fontSize: "0.92rem", maxWidth: "640px", margin: "0 auto" }}>
          Avenu is a small crew building digital essentials. This page credits everyone
          who ships the product — from code to design to the roadmap.
        </p>
      </header>

      <div
        className="creator-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(232px, 1fr))",
          gap: "1.5rem",
          marginTop: "2.4rem",
        }}
      >
        {contributors.map((c, i) => (
          <div
            key={c.name}
            className="card fade-up"
            style={{
              animationDelay: `${i * 0.08}s`,
              padding: "1.6rem 1.3rem 1.3rem",
              background: "rgba(2, 16, 36, 0.55)",
              border: "1px solid rgba(56, 189, 248, 0.10)",
              borderRadius: "16px",
              backdropFilter: "blur(10px)",
            }}
          >
            <div
              aria-hidden="true"
              style={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                margin: "0 auto 1rem",
                background: `radial-gradient(135deg, ${c.dot} 0%, color-mix(in srgb, ${c.dot} 60%, transparent) 100%)`,
                display: "grid",
                placeItems: "center",
                fontSize: "1.5rem",
                fontWeight: 700,
                color: "#021024",
                boxShadow: "0 8px 24px rgba(0,0,0,0.35)",
              }}
            >
              {c.initials}
            </div>
            <h3 style={{ margin: "0 0 0.35rem", textAlign: "center", color: "var(--text-primary)" }}>
              {c.name}
            </h3>
                        <p
              className="muted"
              style={{
                textAlign: "center",
                fontSize: "0.78rem",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                color: c.dot,
                marginBottom: "0.6rem",
              }}
            >
              {c.role}
            </p>
            {c.tags && c.tags.length > 0 && (
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "0.3rem",
                  justifyContent: "center",
                  marginBottom: "0.6rem",
                }}
              >
                {c.tags.map((t) => (
                  <span
                    key={t}
                    style={{
                      fontSize: "0.72rem",
                      color: "var(--accent-soft)",
                      background: "rgba(56, 189, 248, 0.08)",
                      border: "1px solid rgba(56, 189, 248, 0.20)",
                      borderRadius: "999px",
                      padding: "0.16rem 0.6rem",
                    }}
                  >
                    {t}
                  </span>
                ))}
              </div>
            )}
            <p className="muted" style={{ fontSize: "0.86rem", lineHeight: 1.55, textAlign: "center" }}>
              {c.blurb}
            </p>
          </div>
        ))}
      </div>

      <div className="fade-up" style={{ marginTop: "2.6rem", textAlign: "center" }}>
        <Link to="/" className="btn btn-ghost btn-sm">
          ← Back to Avenu
        </Link>
      </div>
    </div>
  );
}
