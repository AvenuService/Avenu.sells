import {
  useEffect,
  useRef,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import { useCatalog } from "../store/CatalogContext";
import { ArrowRight, CloseIcon, SearchIcon } from "./Icons";

const MAX_RESULTS = 6;
const OPEN_EVENT = "avenu:open-search";

/**
 * Global search palette (⌘K / Ctrl+K). Filters the in-memory catalog and
 * navigates to a product or the Shop results page. Toggled by keyboard or
 * programmatically via the `avenu:open-search` window event.
 */
export default function SearchModal() {
  const { products } = useCatalog();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const [activeIndex, setActiveIndex] = useState(0);

  // Seed the box from ?q=... so shareable links open pre-filled.
  useEffect(() => {
    if (!open) return;
    const q = new URLSearchParams(window.location.search).get("q");
    if (q) setQuery(q);
  }, [open]);

  // Keep ?q=... in sync with what is typed (replaceState, not push).
  useEffect(() => {
    if (!open) return;
    const u = new URLSearchParams(window.location.search);
    if (query.trim()) u.set("q", query.trim());
    else u.delete("q");
    const qs = u.toString();
    window.history.replaceState(null, "", `${window.location.pathname}${qs ? `?${qs}` : ""}`);
  }, [query, open]);

  // Reset the active result whenever the query changes.
  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  // Keyboard: toggle with ⌘K / Ctrl+K, Escape to close.
  useEffect(() => {
    const onKeyDown = (e: globalThis.KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && (e.key === "k" || e.key === "K")) {
        e.preventDefault();
        setOpen((o) => !o);
        return;
      }
      if (e.key === "Escape" && open) {
        e.preventDefault();
        setOpen(false);
      }
    };
    const onOpen = () => setOpen(true);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener(OPEN_EVENT, onOpen as EventListener);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener(OPEN_EVENT, onOpen as EventListener);
    };
  }, [open]);

  // Focus + lock scroll when open.
  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const results = query.trim()
    ? products
        .filter((p) =>
          [
            p.name,
            p.brand,
            p.tagline,
            p.category,
            p.type,
          ]
            .join(" ")
            .toLowerCase()
            .includes(query.toLowerCase()),
        )
        .slice(0, MAX_RESULTS)
    : [];

  const close = () => {
    setOpen(false);
    setQuery("");
    const u = new URLSearchParams(window.location.search);
    u.delete("q");
    const qs = u.toString();
    window.history.replaceState(null, "", `${window.location.pathname}${qs ? `?${qs}` : ""}`);
  };

  const navigateTo = (to: string) => {
    navigate(to, { replace: true });
    close();
  };

  if (!open) return null;

  return (
    <div className="sm-backdrop" role="dialog" aria-modal="true" aria-label="Search">
      <div className="sm-mask" onClick={close} />
      <div className="sm-panel" role="search">
        <div className="sm-form">
          <SearchIcon size={18} className="sm-icon" aria-hidden="true" />
          <input
            ref={inputRef}
            type="search"
            placeholder="Search products…"
            aria-label="Search products"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (results.length === 0) return;
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setActiveIndex((i) => (i + 1) % results.length);
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setActiveIndex((i) => (i - 1 + results.length) % results.length);
              } else if (e.key === "Enter") {
                e.preventDefault();
                const target = results[activeIndex] ?? results[0];
                navigateTo(`/product/${target.slug}`);
              }
            }}
          />
          <kbd className="sm-kbd">⌘K</kbd>
          <button
            type="button"
            className="sm-close"
            aria-label="Close search"
            onClick={close}
          >
            <CloseIcon size={16} />
          </button>
        </div>

        <ul className="sm-results" role="listbox">
          {query.trim() === "" && (
            <li className="sm-hint">Type to search products…</li>
          )}
          {results.map((p, i) => (
            <li key={p.id}>
              <button
                className={`sm-result ${i === activeIndex ? "sm-result-active" : ""}`}
                aria-selected={i === activeIndex}
                onClick={() => navigateTo(`/product/${p.slug}`)}
              >
                <span
                  className="sm-dot"
                  style={{
                    background: `linear-gradient(135deg, ${p.gradient[0]}, ${p.gradient[1]})`,
                  }}
                />
                <span className="sm-meta">
                  <strong>{p.name}</strong>
                  <span className="muted">{p.brand}</span>
                </span>
                <ArrowRight size={16} className="sm-arrow" />
              </button>
            </li>
          ))}
          {query.trim() && results.length === 0 && (
            <li className="sm-hint">No matches. Try the full Shop instead.</li>
          )}
        </ul>

        {query.trim() && (
          <div className="sm-viewall">
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => navigateTo(`/shop?q=${encodeURIComponent(query.trim())}`)}
            >
              View all results{" "}
              <ArrowRight size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
