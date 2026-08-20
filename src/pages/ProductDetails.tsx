import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { formatPrice, type Product } from "../data/products";
import { useCatalog } from "../store/CatalogContext";
import { useCart } from "../store/CartContext";
import { useShopperAuth, displayName } from "../store/ShopperAuthContext";
import { useLocalStorage } from "../hooks/useLocalStorage";
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
  SparkIcon,
  StarIcon,
  SwapIcon,
  TruckIcon,
  ZapIcon,
} from "../components/Icons";

type Review = {
  id: string;
  productId: string;
  author: string;
  rating: number;
  text: string;
  createdAt: number;
};

const REVIEWS_KEY = "avenu.reviews.v1";

function starArr(n: number) {
  return [0, 1, 2, 3, 4].map((i) => i < n);
}

export default function ProductDetails() {
  const { slug } = useParams<{ slug: string }>();
  const { productBySlug, related } = useCatalog();
  const product = slug ? (productBySlug(slug) as Product | undefined) : undefined;
  const { addItem } = useCart();
  const { session } = useShopperAuth();
  const [color, setColor] = useState<string>(product?.colors[0]?.name ?? "default");
  const [qty, setQty] = useState(1);
  const [thumb, setThumb] = useState(0);
  const [storedReviews, setStoredReviews] = useLocalStorage<Review[]>(REVIEWS_KEY, []);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [reviewError, setReviewError] = useState("");

  // Only keep reviews for this product
  const productReviews = product
    ? storedReviews.filter((r) => r.productId === product.id)
    : [];
  const baseRating = product?.rating ?? 0;
  const baseReviews = product?.reviews ?? 0;
  const totalReviews = baseReviews + productReviews.length;
  const avgRating =
    totalReviews === 0
      ? baseRating
      : (baseRating * baseReviews + productReviews.reduce((s, r) => s + r.rating, 0)) / totalReviews;

  useEffect(() => {
    if (product) {
      setColor(product.colors[0]?.name ?? "default");
      setQty(1);
      setThumb(0);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
    setReviewSubmitted(false);
    setReviewError("");
    setReviewRating(5);
    setReviewText("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  function submitReview(e: React.FormEvent) {
    e.preventDefault();
    setReviewError("");
    const text = reviewText.trim();
    if (!text) {
      setReviewError("Please write a short review.");
      return;
    }
    if (!product) return;
    const author = displayName(session) || session?.user?.email || "Avenu shopper";
    const review: Review = {
      id: "rev_" + Math.random().toString(36).slice(2, 10),
      productId: product.id,
      author,
      rating: reviewRating,
      text,
      createdAt: Date.now(),
    };
    setStoredReviews((prev) => [review, ...prev]);
    setReviewText("");
    setReviewRating(5);
    setReviewSubmitted(true);
  }

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
  const isService = product.type === "service";

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
          {(() => {
            // Full set of images shown in the gallery: banner first, then extras.
            const galleryImages = [product.imageBanner, ...(product.gallery ?? [])].filter((im): im is string => !!im && im.trim() !== "");
            const active = Math.min(thumb, Math.max(0, galleryImages.length - 1));
            const activeImage = galleryImages.length ? galleryImages[active] : undefined;

            return (
              <>
                <div
                  className="pd-hero-art"
                  style={{
                    backgroundImage: activeImage
                      ? undefined
                      : `radial-gradient(120% 90% at 30% 0%, ${product.gradient[0]} 0%, ${product.gradient[1]} 60%, #021024 100%)`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                >
                  {activeImage ? (
                    <img src={activeImage} alt={`${product.name} view ${active + 1}`} className="pd-hero-img" />
                  ) : (
                    <span>{product.name.charAt(0)}</span>
                  )}
                </div>

                {galleryImages.length > 1 && (
                  <div className="pd-thumb-row">
                    {galleryImages.map((img, i) => (
                      <button
                        key={i}
                        className={`pd-thumb ${thumb === i ? "active" : ""}`}
                        style={{ background: `radial-gradient(120% 90% at 30% 0%, ${product.gradient[0]} 0%, ${product.gradient[1]} 60%, #021024 100%)` }}
                        onClick={() => setThumb(i)}
                        aria-label={`View ${i + 1}`}
                      >
                        <img src={img} alt="" />
                      </button>
                    ))}
                  </div>
                )}
              </>
            );
          })()}
        </div>

        <div className="pd-info fade-up">
          <div className="pd-brand">
            <span className="pd-brand-name">{product.brand}</span>
            <Rating value={(totalReviews ? avgRating : baseRating).toFixed(1) as unknown as number} count={totalReviews} />
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

          {product.colors.length > 0 && !isService && (
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
          )}

          <div className="qty-row">
            {isService ? (
              <div className="badge" style={{ color: "var(--accent-ice)", borderColor: "rgba(193,232,255,0.25)", background: "rgba(193,232,255,0.10)" }}>
                <CheckIcon size={12} /> Open for bookings · 1 project per slot
              </div>
            ) : (
              <div className="qty-stepper">
                <button onClick={() => setQty(Math.max(1, qty - 1))} aria-label="Decrease"><MinusIcon size={16} /></button>
                <span className="qty-val">{qty}</span>
                <button onClick={() => setQty(Math.min(product.stock, qty + 1))} aria-label="Increase"><PlusIcon size={16} /></button>
              </div>
            )}
            {!isService && (
              <div className="badge" style={inStock ? { color: "var(--accent-ice)", borderColor: "rgba(193,232,255,0.25)", background: "rgba(193,232,255,0.10)" } : { color: "var(--accent-muted)" }}>
                {inStock ? <><CheckIcon size={12} /> In stock · {product.stock} left</> : "Sold out"}
              </div>
            )}
          </div>

          <div className="pd-actions">
            <button className="btn btn-primary btn-lg" disabled={!inStock} onClick={() => addItem(product.id, { color, quantity: isService ? 1 : qty })}>
              <CartIcon size={18} /> {isService ? "Book this package" : <>Add to cart · {formatPrice(product.price * qty)}</>}
            </button>
            <button className="btn btn-ghost" aria-label="Save"><HeartIcon size={18} /></button>
          </div>

          {isService ? (
            <div className="pd-extra">
              <div className="pd-extra-row"><SparkIcon size={18} /><span><strong>Project kickoff call</strong> within 2 business days of your order to scope the build.</span></div>
              <div className="pd-extra-row"><ZapIcon size={18} /><span><strong>Source code handoff</strong> — you own everything we build. No lock-in.</span></div>
              <div className="pd-extra-row"><ShieldIcon size={18} /><span><strong>Post-launch support</strong> included with every package. We don't disappear after deploy.</span></div>
            </div>
          ) : (
            <div className="pd-extra">
              <div className="pd-extra-row"><TruckIcon size={18} /><span><strong>Free 2-day shipping</strong> within the contiguous US. Ships next business day from your order.</span></div>
              <div className="pd-extra-row"><SwapIcon size={18} /><span><strong>30-day returns</strong>. No-questions refund if it's not for you.</span></div>
              <div className="pd-extra-row"><ShieldIcon size={18} /><span><strong>2-year warranty</strong> covering manufacturer defects.</span></div>
            </div>
          )}

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
              <dt>Studio</dt><dd>{product.brand}</dd>
              <dt>Category</dt><dd style={{ textTransform: "capitalize" }}>{product.category}</dd>
              {isService ? (
                <>
                  <dt>Delivery</dt><dd>Digital · via email</dd>
                  <dt>Scope</dt><dd>Custom build, quoted per package</dd>
                  <dt>Timeline</dt><dd>2–6 weeks depending on tier</dd>
                  <dt>Ownership</dt><dd>You own the source</dd>
                </>
              ) : (
                <>
                  <dt>Colors</dt><dd>{product.colors.map((c) => c.name).join(" · ")}</dd>
                  <dt>SKU</dt><dd>{product.id.toUpperCase()}-{color.substring(0, 3).toUpperCase()}</dd>
                  <dt>Warranty</dt><dd>2 years</dd>
                </>
              )}
            </dl>
          </div>
        </div>
      </div>

      <section className="reviews-section">
        <div className="reviews-head">
          <h2>Customer reviews</h2>
          <div className="reviews-summary">
            <Rating value={avgRating} count={totalReviews} />
            <span className="muted" style={{ marginLeft: "0.5rem" }}>
              {productReviews.length + (baseReviews || 0)} rating(s)
            </span>
          </div>
        </div>

        {/* Write a review */}
        {session ? (
          <form className="review-form" onSubmit={submitReview}>
            <p className="pd-section-title" style={{ marginBottom: "0.5rem" }}>Write a review</p>
            <div style={{ display: "flex", alignItems: "center", gap: "0.25rem", marginBottom: "0.6rem" }}>
              {starArr(reviewRating).map((on, i) => (
                <button
                  key={i}
                  type="button"
                  aria-label={`${i + 1} star`}
                  onClick={() => setReviewRating(i + 1)}
                  style={{ background: "none", border: "none", cursor: "pointer", padding: "2px" }}
                >
                  <StarIcon size={22} className={on ? "star-on" : "star-off"} />
                </button>
              ))}
            </div>
            <textarea
              rows={4}
              className="field"
              placeholder="Share your experience…"
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
            />
            {reviewError && <p style={{ color: "#f87171", fontSize: "0.8rem", margin: "0.4rem 0 0" }}>{reviewError}</p>}
            <button type="submit" className="btn btn-primary" style={{ marginTop: "0.6rem" }}>
              Submit review
            </button>
            {reviewSubmitted && (
              <span style={{ color: "#4ade80", fontSize: "0.85rem", marginLeft: "0.75rem" }}>
                <CheckIcon size={14} /> Thanks! Your review is live.
              </span>
            )}
          </form>
        ) : (
          <p className="muted" style={{ fontSize: "0.85rem" }}>
            Sign in with your Avenu account to write a review.
          </p>
        )}

        {/* Reviews list */}
        {productReviews.length === 0 ? (
          <p className="muted" style={{ marginTop: "1rem" }}>No customer reviews yet. Be the first!</p>
        ) : (
          <div className="review-list">
            {productReviews.map((r) => (
              <div className="review" key={r.id}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <strong style={{ fontSize: "0.95rem" }}>{r.author}</strong>
                  <span className="muted" style={{ fontSize: "0.75rem" }}>
                    {new Date(r.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </span>
                </div>
                <div className="rating" style={{ margin: "0.2rem 0" }}>
                  <span className="rating-stars">
                    {starArr(r.rating).map((on, i) => (
                      <StarIcon key={i} size={14} className={on ? "star-on" : "star-off"} />
                    ))}
                  </span>
                  <span className="rating-num">{r.rating}.0</span>
                </div>
                <p style={{ margin: "0.2rem 0 0", fontSize: "0.9rem", lineHeight: 1.55, color: "#e2e8f0" }}>{r.text}</p>
              </div>
            ))}
          </div>
        )}
      </section>

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
