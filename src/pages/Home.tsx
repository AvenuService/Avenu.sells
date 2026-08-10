import { Link } from "react-router-dom";
import { useCatalog } from "../store/CatalogContext";
import ProductCard from "../components/ProductCard";
import { LoadingGrid } from "../components/Loading";
import Hero3DCanvas from "../components/Hero3DCanvas";
import { ArrowRight, ShieldIcon, SwapIcon, SparkIcon, ZapIcon } from "../components/Icons";

const valueProps = [
  { Icon: ZapIcon, title: "Instant digital delivery", text: "Software, presets, and keys unlock the moment you check out." },
  { Icon: ShieldIcon, title: "Secure escrow", text: "Every order is backed by Avenu's buyer-protection guarantee." },
  { Icon: SwapIcon, title: "30-day refunds", text: "Try it. If it's not right, refund within 30 days, no questions." },
  { Icon: SparkIcon, title: "Curated, not crowded", text: "A tight catalog of essentials tuned to a single icy palette." },
];

const cats = [
  { slug: "audio", name: "Audio", idx: "01" },
  { slug: "wearables", name: "Wearables", idx: "02" },
  { slug: "computing", name: "Computing", idx: "03" },
  { slug: "apparel", name: "Apparel", idx: "04" },
  { slug: "home", name: "Home", idx: "05" },
  { slug: "software", name: "Software", idx: "06" },
];

export default function Home() {
  const { products, status } = useCatalog();
  const featured = products.filter((p) => p.featured).slice(0, 4);
  const bestsellers = products.filter((p) => p.bestseller).slice(0, 4);
  const empty = products.length === 0 && status !== "loading";
  const loading = status === "loading";
  return (
    <>
      {/* HERO */}
      <section className="hero">
        <div className="container hero-grid">
          <div className="hero-copy fade-up">
            <div className="hero-eyebrow"><span className="dot" /> {empty ? "Storefront initializing" : "Live catalog"}</div>
            <h1>Curated essentials.<br /><span className="ice">One icy palette.</span></h1>
            <p className="lead">
              Avenu is a tight catalog of digital and physical essentials — software, presets,
              audio, and apparel — designed to feel essential, all tuned to one cohesive
              deep-to-icy blue signature.
            </p>
            <div className="hero-cta">
              <Link to="/shop" className="btn btn-primary btn-lg">Browse the catalog <ArrowRight size={16} /></Link>
              <Link to="/shop?category=software" className="btn btn-ghost btn-lg">Explore software</Link>
            </div>
            <div className="hero-stats">
              <div className="hero-stat"><strong>{products.length}</strong><span>Live products</span></div>
              <div className="hero-stat"><strong>{products.filter((p) => p.type === "digital").length}</strong><span>Digital items</span></div>
              <div className="hero-stat"><strong>{products.filter((p) => p.type === "physical").length}</strong><span>Physical items</span></div>
              <div className="hero-stat"><strong>30d</strong><span>Easy refunds</span></div>
            </div>
          </div>

          <div className="hero-visual" aria-hidden="true">
            <Hero3DCanvas />
            <div className="hv-chip" style={{ zIndex: 10 }}><span className="pip" /><strong>Instant delivery</strong> · digital first</div>
          </div>
        </div>
      </section>

      {/* MARQUEE */}
      <div className="marquee" aria-hidden="true">
        <div className="marquee-track">
          {Array.from({ length: 2 }).flatMap((_, i) =>
            ["Avenu", "Instant digital delivery", "Downloadable keys", "Lossless presets", "Curated templates", "Icy blue signature", `Shop now${i === 0 ? "" : ""}`].map((t, j) => (
              <span key={`${i}-${j}`}>{t}</span>
            )),
          )}
        </div>
      </div>

      {/* EMPTY STATE */}
      {loading && (
        <section className="section" style={{ paddingTop: "3rem" }}>
          <div className="container">
            <div className="featured-head fade-up">
              <div>
                <p className="eyebrow">Live catalog</p>
                <h2 className="section-title" style={{ marginBottom: 0 }}>Loading the catalog…</h2>
              </div>
            </div>
            <LoadingGrid rows={4} />
          </div>
        </section>
      )}

      {empty && (
        <section className="section" style={{ paddingTop: "3rem" }}>
          <div className="container">
            <div className="card empty-state">
              <div className="admin-empty-glyph" style={{ margin: "0 auto 1rem" }}>∅</div>
              <h2 style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>The catalog is being curated.</h2>
              <p className="muted" style={{ marginInline: "auto" }}>
                No products have been published yet. Sign in to the Avenu admin panel to
                add your first digital or physical product and it will appear here instantly.
              </p>
              <div style={{ marginTop: "1.5rem", display: "flex", gap: "0.75rem", flexWrap: "wrap", justifyContent: "center" }}>
                <Link to="/shop" className="btn btn-primary btn-lg">Explore products <ArrowRight size={16} /></Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* FEATURED */}
      {featured.length > 0 && (
        <section className="section">
          <div className="container">
            <div className="featured-head fade-up">
              <div>
                <p className="eyebrow">Featured this wave</p>
                <h2 className="section-title" style={{ marginBottom: 0 }}>Quietly impressive.</h2>
              </div>
              <Link to="/shop" className="see-all">Shop everything <ArrowRight size={16} /></Link>
            </div>
            <div className="grid-catalog stagger">
              {featured.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          </div>
        </section>
      )}

      {/* CATEGORIES */}
      <section className="section" style={empty ? {} : { paddingTop: 0 }}>
        <div className="container">
          <div className="featured-head fade-up">
            <div>
              <p className="eyebrow">Browse the catalog</p>
              <h2 className="section-title" style={{ marginBottom: 0 }}>Find your avenue.</h2>
            </div>
          </div>
          <div className="cat-grid stagger">
            {cats.map((c) => (
              <Link to={`/shop?category=${c.slug}`} key={c.slug} className="cat-card">
                <span className="cat-idx">{c.idx}</span>
                <ArrowRight className="cat-arrow" size={18} />
                <h3>{c.name}</h3>
                <p>Explore {c.name.toLowerCase()} essentials</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* VALUE PROPS */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="value-grid stagger">
            {valueProps.map((v) => (
              <div className="value-card" key={v.title}>
                <span className="value-icon"><v.Icon size={20} /></span>
                <div>
                  <h4>{v.title}</h4>
                  <p>{v.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BESTSELLERS */}
      {bestsellers.length > 0 && (
        <section className="section" style={{ paddingTop: 0 }}>
          <div className="container">
            <div className="featured-head fade-up">
              <div>
                <p className="eyebrow">Loved by customers</p>
                <h2 className="section-title" style={{ marginBottom: 0 }}>Bestsellers.</h2>
              </div>
              <Link to="/shop?sort=popular" className="see-all">See all bestsellers <ArrowRight size={16} /></Link>
            </div>
            <div className="grid-catalog stagger">
              {bestsellers.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          </div>
        </section>
      )}

      {/* CTA BAND */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="cta-band fade-up">
            <p className="eyebrow">Join the Avenu dispatch</p>
            <h2>Early drops, factory notes, and quiet releases — once a month.</h2>
            <form className="footer-news" style={{ maxWidth: 460, width: "100%" }} onSubmit={(e) => e.preventDefault()}>
              <input className="field" type="email" placeholder="you@avenu.sale" aria-label="Email" />
              <button className="btn btn-primary" type="submit">Subscribe</button>
            </form>
          </div>
        </div>
      </section>
    </>
  );
}
