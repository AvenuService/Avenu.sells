import { useEffect, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useCart } from "../store/CartContext";
import { useCatalog } from "../store/CatalogContext";
import { useDebounce } from "../hooks/useLocalStorage";
import { CartIcon, CloseIcon, MenuIcon, SearchIcon, UserIcon } from "./Icons";

const navLinks = [
  { to: "/", label: "Home" },
  { to: "/shop", label: "Shop" },
  { to: "/shop?category=software", label: "Software" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [query, setQuery] = useState("");
  const [showResults, setShowResults] = useState(false);
  const debounced = useDebounce(query, 200);
  const { products } = useCatalog();
  const { count, openCart } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const results = debounced.trim()
    ? products
        .filter((p) =>
          [p.name, p.brand, p.tagline, p.category, p.type]
            .join(" ")
            .toLowerCase()
            .includes(debounced.toLowerCase()),
        )
        .slice(0, 5)
    : [];

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    navigate(`/shop?q=${encodeURIComponent(query.trim())}`);
    setShowResults(false);
    setOpen(false);
  }

  return (
    <header className={`nav ${scrolled ? "nav-scrolled" : ""}`}>
      <div className="container nav-inner">
        <Link to="/" className="nav-brand" aria-label="Avenu home">
          <span className="brand-mark" aria-hidden="true">
            <img src="/A_for_logo.svg" alt="" className="brand-logo-img" />
          </span>
          <span className="brand-text">Avenu</span>
        </Link>

        <nav className="nav-links" aria-label="Primary">
          {navLinks.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) => `nav-link ${isActive && l.to === "/shop" ? "active" : ""}`}
            >
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="nav-actions">
          <form className="nav-search" onSubmit={submitSearch} role="search">
            <SearchIcon size={18} className="ns-icon" />
            <input
              className="ns-input"
              type="search"
              placeholder="Search products…"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setShowResults(true); }}
              onFocus={() => setShowResults(true)}
              onBlur={() => setTimeout(() => setShowResults(false), 120)}
              aria-label="Search products"
            />
            {query && (
              <button type="button" className="ns-clear" onClick={() => setQuery("")} aria-label="Clear search">
                <CloseIcon size={14} />
              </button>
            )}
            {showResults && results.length > 0 && (
              <div className="ns-results card" onMouseDown={(e) => e.preventDefault()}>
                {results.map((p) => (
                  <Link key={p.id} to={`/product/${p.slug}`} className="ns-item" onClick={() => { setQuery(""); setShowResults(false); }}>
                    <span className="ns-dot" style={{ background: `linear-gradient(135deg, ${p.gradient[0]}, ${p.gradient[1]})` }} />
                    <span className="ns-text">
                      <strong>{p.name}</strong>
                      <span className="muted">{p.brand}</span>
                    </span>
                  </Link>
                ))}
                <Link to={`/shop?q=${encodeURIComponent(debounced)}`} className="ns-all">See all results →</Link>
              </div>
            )}
          </form>

          <button className="nav-icon-btn" aria-label="Account"><UserIcon size={20} /></button>
          <button className="nav-icon-btn nav-cart-btn" aria-label="Open cart" onClick={openCart}>
            <CartIcon size={20} />
            {count > 0 && <span className="cart-count">{count}</span>}
          </button>

          <button
            className="nav-icon-btn nav-burger"
            aria-label="Toggle menu"
            aria-expanded={open}
            onClick={() => setOpen((o) => !o)}
          >
            {open ? <CloseIcon size={20} /> : <MenuIcon size={20} />}
          </button>
        </div>
      </div>

      <div className={`nav-drawer ${open ? "open" : ""}`} onClick={() => setOpen(false)}>
        <div className="nav-drawer-inner card" onClick={(e) => e.stopPropagation()}>
          {navLinks.map((l) => (
            <Link key={l.to} to={l.to} className="nav-drawer-link" onClick={() => setOpen(false)}>
              {l.label}
            </Link>
          ))}
          <form className="nav-drawer-search" onSubmit={submitSearch}>
            <SearchIcon size={18} />
            <input className="field" placeholder="Search…" value={query} onChange={(e) => setQuery(e.target.value)} />
          </form>
          <Link to="/shop" className="btn btn-primary btn-block" onClick={() => setOpen(false)}>Browse the catalog</Link>
        </div>
      </div>
    </header>
  );
}
