import { Link } from "react-router-dom";

const cols = [
  {
    title: "Shop",
    links: [
      { to: "/shop", label: "All Products" },
      { to: "/shop?category=audio", label: "Audio" },
      { to: "/shop?category=wearables", label: "Wearables" },
      { to: "/shop?category=computing", label: "Computing" },
      { to: "/shop?category=apparel", label: "Apparel" },
      { to: "/shop?category=home", label: "Home" },
    ],
  },
  {
    title: "Company",
    links: [
      { to: "/", label: "About Avenu" },
      { to: "/", label: "Sustainability" },
      { to: "/", label: "Press" },
      { to: "/", label: "Careers" },
      { to: "/", label: "Store Journal" },
    ],
  },
  {
    title: "Support",
    links: [
      { to: "/", label: "Help Center" },
      { to: "/", label: "Shipping" },
      { to: "/", label: "Returns" },
      { to: "/", label: "Track an Order" },
      { to: "/", label: "Warranty" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-top">
          <div className="footer-brand">
            <Link to="/" className="nav-brand" aria-label="Avenu home">
              <span className="brand-mark" aria-hidden="true">
                <img src="/A_for_logo.svg" alt="" className="brand-logo-img" />
              </span>
              <span className="brand-text">Avenu</span>
            </Link>
            <p className="muted footer-blurb">
              Avenu curates tech, apparel, and home essentials designed to feel essential —
              built to last, tuned to a single icy palette.
            </p>
            <form className="footer-news" onSubmit={(e) => e.preventDefault()}>
              <input className="field" type="email" placeholder="Email for the Avenu dispatch" aria-label="Email" />
              <button className="btn btn-primary btn-sm" type="submit">Subscribe</button>
            </form>
          </div>

          <div className="footer-cols">
            {cols.map((c) => (
              <div className="footer-col" key={c.title}>
                <h4>{c.title}</h4>
                <ul>
                  {c.links.map((l) => (
                    <li key={l.label}><Link to={l.to}>{l.label}</Link></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <hr className="divider" />

        <div className="footer-bottom">
          <p className="muted">© {new Date().getFullYear()} Avenu, Inc. — avenu.sale · <a href="mailto:contact@avenu.sale" style={{ color: "var(--accent-ice)" }}>contact@avenu.sale</a></p>
          <div className="footer-legal">
            <Link to="/privacy">Privacy</Link>
            <Link to="/terms">Terms</Link>
            <Link to="/privacy#cookies">Cookies</Link>
            <Link to="/">Accessibility</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
