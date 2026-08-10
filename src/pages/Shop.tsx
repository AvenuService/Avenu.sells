import { useMemo, useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useCatalog } from "../store/CatalogContext";
import { categories, formatPrice, type Product } from "../data/products";
import ProductCard from "../components/ProductCard";
import { FilterIcon, CloseIcon } from "../components/Icons";

const sortOptions = [
  { value: "featured", label: "Featured" },
  { value: "popular", label: "Most popular" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
  { value: "rating", label: "Top rated" },
  { value: "newest", label: "Newest added" },
] as const;

type SortValue = (typeof sortOptions)[number]["value"];

const CATALOG_CATEGORIES = categories.filter((c) => c.slug !== "all");

export default function Shop() {
  const { products } = useCatalog();
  const [params, setParams] = useSearchParams();

  const category = params.get("category") ?? "all";
  const q = params.get("q") ?? "";
  const sort = (params.get("sort") as SortValue) ?? "featured";

  const [selectedCats, setSelectedCats] = useState<Set<string>>(
    new Set(category !== "all" ? [category] : ["all"]),
  );
  const [search, setSearch] = useState(q);
  const [sortState, setSortState] = useState<SortValue>(sort);

  const brands = useMemo(() => Array.from(new Set(products.map((p) => p.brand))), [products]);
  const [selectedBrands, setSelectedBrands] = useState<Set<string>>(new Set());

  const priceBounds = useMemo(() => {
    if (!products.length) return { min: 0, max: 200 };
    const min = Math.min(...products.map((p) => p.price));
    const max = Math.max(...products.map((p) => p.price));
    return { min, max: Math.max(max, min + 1) };
  }, [products]);
  const [maxPrice, setMaxPrice] = useState<number>(priceBounds.max);

  useEffect(() => {
    setMaxPrice(priceBounds.max);
  }, [priceBounds.max]);

  // sync url -> state
  useEffect(() => {
    setSearch(q);
    setSortState(sort);
    if (category !== "all") setSelectedCats(new Set([category]));
    else setSelectedCats(new Set(["all"]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, q, sort]);

  // state -> url (loose)
  useEffect(() => {
    const next = new URLSearchParams();
    const cat = selectedCats.size === 1 && selectedCats.has("all") ? "all" : Array.from(selectedCats)[0];
    if (cat && cat !== "all") next.set("category", cat);
    if (search.trim()) next.set("q", search.trim());
    if (sortState !== "featured") next.set("sort", sortState);
    setParams(next, { replace: true });
  }, [selectedCats, search, sortState, setParams]);

  function toggleCat(slug: string) {
    setSelectedCats((prev) => {
      const next = new Set(prev);
      if (slug === "all") return new Set(["all"]);
      next.delete("all");
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next.size ? next : new Set(["all"]);
    });
  }
  function toggleBrand(b: string) {
    setSelectedBrands((prev) => {
      const next = new Set(prev);
      if (next.has(b)) next.delete(b); else next.add(b);
      return next;
    });
  }

  const filtered = useMemo<Product[]>(() => {
    let list = products.slice();
    if (!(selectedCats.size === 1 && selectedCats.has("all"))) {
      list = list.filter((p) => selectedCats.has(p.category));
    }
    if (selectedBrands.size) list = list.filter((p) => selectedBrands.has(p.brand));
    list = list.filter((p) => p.price <= maxPrice);
    if (search.trim()) {
      const s = search.trim().toLowerCase();
      list = list.filter((p) =>
        [p.name, p.brand, p.tagline, p.category, p.type].join(" ").toLowerCase().includes(s),
      );
    }
    switch (sortState) {
      case "price-asc": list.sort((a, b) => a.price - b.price); break;
      case "price-desc": list.sort((a, b) => b.price - a.price); break;
      case "rating": list.sort((a, b) => b.rating - a.rating); break;
      case "popular": list.sort((a, b) => b.reviews - a.reviews); break;
      case "newest": list.sort((a, b) => b.createdAt - a.createdAt); break;
      default:
        list.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0) || b.createdAt - a.createdAt);
    }
    return list;
  }, [products, selectedCats, selectedBrands, maxPrice, search, sortState]);

  const hasActiveFilters =
    !(selectedCats.size === 1 && selectedCats.has("all")) ||
    selectedBrands.size > 0 ||
    maxPrice < priceBounds.max ||
    search.trim() !== "";

  function clearAll() {
    setSelectedCats(new Set(["all"]));
    setSelectedBrands(new Set());
    setMaxPrice(priceBounds.max);
    setSearch("");
  }

  const appliedChips = useMemo(() => {
    const arr: { key: string; label: string; onClear: () => void }[] = [];
    if (search.trim()) arr.push({ key: "q", label: `“${search.trim()}”`, onClear: () => setSearch("") });
    selectedCats.forEach((c) => {
      if (c !== "all") {
        const cat = categories.find((x) => x.slug === c);
        arr.push({ key: c, label: cat?.name ?? c, onClear: () => toggleCat(c) });
      }
    });
    selectedBrands.forEach((b) => arr.push({ key: b, label: b, onClear: () => toggleBrand(b) }));
    if (maxPrice < priceBounds.max) arr.push({ key: "price", label: `≤ ${formatPrice(maxPrice)}`, onClear: () => setMaxPrice(priceBounds.max) });
    return arr;
  }, [search, selectedCats, selectedBrands, maxPrice, priceBounds.max]);

  return (
    <div className="container">
      <div className="shop-head fade-up" style={{ paddingBlock: "2rem 1rem" }}>
        <p className="eyebrow">Catalog</p>
        <h1 className="section-title">All products</h1>
        <p className="section-sub">A tightly edited catalog tuned to one icy palette. Filter, sort, and find your avenue.</p>
      </div>

      <div className="shop-layout">
        <aside className="shop-aside">
          <div className="filter-block">
            <div className="filter-title">Search catalog</div>
            <input className="field filter-input" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search…" />
          </div>

          <div className="filter-block">
            <div className="filter-title">Category</div>
            <div className="filter-list">
              <label key="all" className="filter-label">
                <input type="checkbox" checked={selectedCats.has("all")} onChange={() => toggleCat("all")} />
                <span className="filter-label-text">All <p>Everything in the catalog</p></span>
              </label>
              {CATALOG_CATEGORIES.map((c) => (
                <label key={c.slug} className="filter-label">
                  <input type="checkbox" checked={selectedCats.has(c.slug)} onChange={() => toggleCat(c.slug)} />
                  <span className="filter-label-text">{c.name}<p>{c.blurb}</p></span>
                </label>
              ))}
            </div>
          </div>

          {brands.length > 0 && (
            <div className="filter-block">
              <div className="filter-title">Brand</div>
              <div className="filter-list">
                {brands.map((b) => (
                  <label key={b} className="filter-label">
                    <input type="checkbox" checked={selectedBrands.has(b)} onChange={() => toggleBrand(b)} />
                    <span className="filter-label-text">{b}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {products.length > 0 && (
            <div className="filter-block">
              <div className="filter-title">Max price · <span style={{ color: "var(--accent-ice)" }}>{formatPrice(maxPrice)}</span></div>
              <input
                className="filter-input"
                type="range"
                min={priceBounds.min}
                max={priceBounds.max}
                step={5}
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                style={{ accentColor: "var(--accent-ice)" }}
              />
              <div className="price-range"><span>{formatPrice(priceBounds.min)}</span><span>{formatPrice(priceBounds.max)}</span></div>
            </div>
          )}

          {hasActiveFilters && (
            <button className="filter-clear" onClick={clearAll}><CloseIcon size={12} /> Clear all filters</button>
          )}
        </aside>

        <main className="shop-main">
          <div className="shop-bar">
            <div className="shop-count"><strong>{filtered.length}</strong> {filtered.length === 1 ? "product" : "products"}</div>
            <div className="shop-sort">
              <FilterIcon size={16} style={{ color: "var(--accent-soft)" }} />
              <select className="sort-select" value={sortState} onChange={(e) => setSortState(e.target.value as SortValue)} aria-label="Sort">
                {sortOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>

          {appliedChips.length > 0 && (
            <div className="applied-chips">
              {appliedChips.map((c) => (
                <span className="chip" key={c.key}>{c.label}<button onClick={c.onClear} aria-label="Clear"><CloseIcon size={11} /></button></span>
              ))}
            </div>
          )}

          {products.length === 0 ? (
            <div className="shop-empty">
              <div className="admin-empty-glyph" style={{ margin: "0 auto 1rem" }}>∅</div>
              <h3>The catalog is empty</h3>
              <p className="muted">No products have been published yet. Sign in to the admin panel to add your first product.</p>
              <a href="/admin" className="btn btn-primary" style={{ marginTop: "1rem" }}>Open admin panel</a>
            </div>
          ) : filtered.length === 0 ? (
            <div className="shop-empty">
              <h3>Nothing matched those filters</h3>
              <p className="muted">Try widening your price range or clearing a category.</p>
              <button className="btn btn-primary" style={{ marginTop: "1rem" }} onClick={clearAll}>Clear filters</button>
            </div>
          ) : (
            <div className="grid-catalog stagger">
              {filtered.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
