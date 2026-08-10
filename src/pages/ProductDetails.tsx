import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { formatPrice, type Product } from "../data/products";
import { useCatalog } from "../store/CatalogContext";
import { useCart } from "../store/CartContext";
import Breadcrumbs from "../components/Breadcrumbs";
import Rating from "../components/Rating";
import ProductCard from "../components/ProductCard";
import {
  ArrowRight,
  CartIcon,
  CheckIcon,
  HeartIcon,
  MinusIcon,
  PlusIcon,
  ShieldIcon,
  SwapIcon,
  TruckIcon,
} from "../components/Icons";

export default function ProductDetails() {
  const { slug } = useParams<{ slug: string }>();
  const { productBySlug, related } = useCatalog();
  const product = slug ? (productBySlug(slug) as Product | undefined) : undefined;
  const { addItem } = useCart();
  const [color, setColor] = useState<string>(product?.colors[0]?.name ?? "default");
  const [qty, setQty] = useState(1);
  const [thumb, setThumb] = useState(0);

  useEffect(() => {
    if (product) {
      setColor(product.colors[0]?.name ?? "default");
      setQty(1);
      setThumb(0);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  if (!product) {
    return (
      <div className="container section empty-state">
        <h2>Product not found</h2>
        <p>We couldn't find what you were looking for.</p>
        <Link to="/shop" className="btn btn-primary">Back to shop</Link>
      </div>
    );
  }

  const relatedProducts = related(product.slug, 4);
  const inStock = product.stock > 0;
  const p: Product = product;

  function thumbStyle(angle: number, depth: number): React.CSSProperties {
    return {
      background: `radial-gradient(120% 90% at 30% 0%, ${p.gradient[0]} 0%, ${p.gradient[1]} ${depth}%, #021024 100%)`,
      transform: `rotate(${angle}deg)`,
    };
  }

  return (
    <div className="container">
      <div style={{ paddingBlock: "1.5rem 0.5rem" }}>
        <Breadcrumbs
          items={[
            { label: "Home", to: "/" },
            { label: "Shop", to: "/shop" },
            { label: product.category, to: `/shop?category=${product.category}` },
            { label: product.name },
          ]}
        />
      </div>

      <div className="pd-grid">
        <div className="pd-gallery fade-up">
          <div
            className="pd-hero-art"
            style={{ background: `radial-gradient(120% 90% at 30% 0%, ${product.gradient[0]} 0%, ${product.gradient[1]} 60%, #021024 100%)` }}
          >
            <span>{product.name.charAt(0)}</span>
          </div>
          <div className="pd-thumb-row">
            {[0, 1, 2, 3].map((i) => (
              <button
                key={i}
                className={`pd-thumb ${thumb === i ? "active" : ""}`}
                style={thumbStyle(i * 6 - 9, 50 + i * 10)}
                onClick={() => setThumb(i)}
                aria-label={`View ${i + 1}`}
              >
                {product.name.charAt(0)}
              </button>
            ))}
          </div>
        </div>

        <div className="pd-info fade-up">
          <div className="pd-brand">
            <span className="pd-brand-name">{product.brand}</span>
            <Rating value={product.rating} count={product.reviews} />
          </div>

          <h1 className="pd-title">{product.name}</h1>
          <p className="pd-tagline">{product.tagline}</p>

          <div className="pd-price">
            <span className="price">{formatPrice(product.price)}</span>
            {product.oldPrice && <>
              <span className="old">{formatPrice(product.oldPrice)}</span>
              <span className="save">Save {formatPrice(product.oldPrice - product.price)}</span>
            </>}
          </div>

          <div>
            <p className="pd-section-title">Color · <span style={{ color: "var(--text-primary)" }}>{color}</span></p>
            <div className="color-row">
              {product.colors.map((c) => (
                <button
                  key={c.name}
                  className={`color-dot ${color === c.name ? "active" : ""}`}
                  onClick={() => setColor(c.name)}
                  aria-label={c.name}
                  title={c.name}
                >
                  <span className="inner" style={{ background: c.hex }} />
                </button>
              ))}
            </div>
          </div>

          <div className="qty-row">
            <div className="qty-stepper">
              <button onClick={() => setQty(Math.max(1, qty - 1))} aria-label="Decrease"><MinusIcon size={16} /></button>
              <span className="qty-val">{qty}</span>
              <button onClick={() => setQty(Math.min(product.stock, qty + 1))} aria-label="Increase"><PlusIcon size={16} /></button>
            </div>
            <div className="badge" style={inStock ? { color: "var(--accent-ice)", borderColor: "rgba(193,232,255,0.25)", background: "rgba(193,232,255,0.10)" } : { color: "var(--accent-muted)" }}>
              {inStock ? <><CheckIcon size={12} /> In stock · {product.stock} left</> : "Sold out"}
            </div>
          </div>

          <div className="pd-actions">
            <button className="btn btn-primary btn-lg" disabled={!inStock} onClick={() => addItem(product.id, { color, quantity: qty })}>
              <CartIcon size={18} /> Add to cart · {formatPrice(product.price * qty)}
            </button>
            <button className="btn btn-ghost" aria-label="Save"><HeartIcon size={18} /></button>
          </div>

          <div className="pd-extra">
            <div className="pd-extra-row"><TruckIcon size={18} /><span><strong>Free 2-day shipping</strong> within the contiguous US. Ships next business day from your order.</span></div>
            <div className="pd-extra-row"><SwapIcon size={18} /><span><strong>30-day returns</strong>. No-questions refund if it's not for you.</span></div>
            <div className="pd-extra-row"><ShieldIcon size={18} /><span><strong>2-year warranty</strong> covering manufacturer defects.</span></div>
          </div>

          <div>
            <p className="pd-section-title">Description</p>
            <p className="pd-desc">{product.description}</p>
          </div>

          <div>
            <p className="pd-section-title">Highlights</p>
            <ul className="pd-features">
              {product.features.map((f) => <li key={f}>{f}</li>)}
            </ul>
          </div>

          <div>
            <p className="pd-section-title">Specifications</p>
            <dl className="pd-meta-table">
              <dt>Brand</dt><dd>{product.brand}</dd>
              <dt>Category</dt><dd style={{ textTransform: "capitalize" }}>{product.category}</dd>
              <dt>Colors</dt><dd>{product.colors.map((c) => c.name).join(" · ")}</dd>
              <dt>SKU</dt><dd>{product.id.toUpperCase()}-{color.substring(0, 3).toUpperCase()}</dd>
              <dt>Warranty</dt><dd>2 years</dd>
            </dl>
          </div>
        </div>
      </div>

      <section className="related-section">
        <div className="related-head">
          <h2>You may also like</h2>
          <Link to="/shop" style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", color: "var(--accent-ice)" }}>Browse all <ArrowRight size={16} /></Link>
        </div>
        <div className="grid-catalog stagger">
          {relatedProducts.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      </section>
    </div>
  );
}
