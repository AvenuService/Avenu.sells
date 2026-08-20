import { useState } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../store/CartContext";
import { formatPrice } from "../data/products";
import { CartIcon, CloseIcon, MinusIcon, PlusIcon, TrashIcon } from "./Icons";

export default function CartDrawer() {
  const { isOpen, closeCart, items, subtotal, shipping, discount, total, coupon, applyCoupon, removeCoupon, updateQuantity, removeItem, count } = useCart();
  const serviceOnly = items.length > 0 && items.every((i) => i.type === "service");
  const [promoCode, setPromoCode] = useState("");
  const [promoError, setPromoError] = useState("");

  function handleApplyCode(e: React.FormEvent) {
    e.preventDefault();
    setPromoError("");
    const res = applyCoupon(promoCode);
    if (res.ok) {
      setPromoCode("");
    } else {
      setPromoError(res.error || "Invalid promo code");
    }
  }

  return (
    <div className={`cart-drawer ${isOpen ? "open" : ""}`} aria-hidden={!isOpen}>
      <div className="cart-overlay" onClick={closeCart} />
      <aside className="cart-panel" role="dialog" aria-modal="true" aria-label="Cart drawer">
        <header className="cart-head">
          <div className="cart-head-title">
            <CartIcon size={20} />
            <h2>Your Cart</h2>
            <span className="badge">{count}</span>
          </div>
          <button className="cart-close" aria-label="Close cart" onClick={closeCart}><CloseIcon size={20} /></button>
        </header>

        {items.length === 0 ? (
          <div className="cart-empty">
            <div className="cart-empty-art" />
            <h3>Your cart is empty</h3>
            <p className="muted">Discover curated essentials tuned to one icy palette.</p>
            <Link to="/shop" className="btn btn-primary" onClick={closeCart}>Browse the catalog</Link>
          </div>
        ) : (
          <>
            <div className="cart-items">
              {items.map((item) => (
                <div className="cart-item" key={item.id}>
                  <Link to={`/product/${item.imageSlug}`} className="cart-item-art" onClick={closeCart}>
                    <span style={{ background: `linear-gradient(135deg, ${item.gradient[0]}, ${item.gradient[1]})` }} className="cia">
                      <span>{item.name.charAt(0)}</span>
                    </span>
                  </Link>
                  <div className="cart-item-info">
                    <Link to={`/product/${item.imageSlug}`} className="cart-item-name" onClick={closeCart}>{item.name}</Link>
                    <span className="cart-item-color">{item.color}</span>
                    <div className="cart-item-bottom">
                      {item.type === "service" ? (
                        <span className="muted" style={{ fontSize: "0.78rem", padding: "0.25rem 0.55rem", border: "1px solid var(--border-faint)", borderRadius: "var(--radius-sm)" }}>1 package</span>
                      ) : (
                        <div className="qty">
                          <button onClick={() => updateQuantity(item.id, item.quantity - 1)} aria-label="Decrease"><MinusIcon size={14} /></button>
                          <span>{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.id, item.quantity + 1)} aria-label="Increase"><PlusIcon size={14} /></button>
                        </div>
                      )}
                      <span className="cart-item-price">{formatPrice(item.price * item.quantity)}</span>
                    </div>
                  </div>
                  <button className="cart-item-remove" onClick={() => removeItem(item.id)} aria-label={`Remove ${item.name}`}>
                    <TrashIcon size={16} />
                  </button>
                </div>
              ))}
            </div>

            <footer className="cart-foot">
              <div className="cart-line"><span className="muted">Subtotal</span><span>{formatPrice(subtotal)}</span></div>
              {discount > 0 && (
                <div className="cart-line" style={{ color: "#4ade80" }}>
                  <span>Discount ({coupon?.code})</span>
                  <span>-{formatPrice(discount)}</span>
                </div>
              )}
              {serviceOnly ? (
                <div className="cart-line"><span className="muted">Delivery</span><span style={{ color: "var(--accent-ice)" }}>Digital handoff</span></div>
              ) : (
                <div className="cart-line"><span className="muted">Shipping</span><span>{shipping === 0 ? "Free" : formatPrice(shipping)}</span></div>
              )}
              <div className="cart-line cart-line-total"><span>Total</span><span>{formatPrice(total)}</span></div>

              {/* Coupon Section */}
              <div style={{ margin: "0.6rem 0", padding: "0.6rem 0", borderTop: "1px dashed rgba(255,255,255,0.1)", borderBottom: "1px dashed rgba(255,255,255,0.1)" }}>
                {coupon ? (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(193, 232, 255, 0.08)", padding: "0.4rem 0.6rem", borderRadius: "6px" }}>
                    <span style={{ fontSize: "0.82rem", color: "#C1E8FF", fontWeight: 600 }}>
                      🎟️ {coupon.code} ({coupon.percent}% OFF)
                    </span>
                    <button
                      type="button"
                      onClick={removeCoupon}
                      style={{ background: "none", border: "none", color: "#f87171", cursor: "pointer", fontSize: "0.8rem" }}
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleApplyCode} style={{ display: "flex", gap: "0.4rem" }}>
                    <input
                      type="text"
                      placeholder="Promo code (e.g. AVENU10)"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value)}
                      style={{
                        flex: 1,
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: "6px",
                        padding: "0.35rem 0.6rem",
                        color: "#fff",
                        fontSize: "0.8rem",
                      }}
                    />
                    <button type="submit" className="btn btn-ghost" style={{ padding: "0.35rem 0.75rem", fontSize: "0.8rem" }}>
                      Apply
                    </button>
                  </form>
                )}
                {promoError && <span style={{ color: "#f87171", fontSize: "0.75rem", marginTop: "0.25rem", display: "block" }}>{promoError}</span>}
              </div>

              {!serviceOnly && (
                <p className="cart-hint muted">{subtotal < 150 ? `Add ${formatPrice(150 - subtotal)} for free shipping.` : "You've unlocked free shipping."}</p>
              )}
              {serviceOnly && (
                <p className="cart-hint muted">Includes a website package. We'll reach out after checkout to schedule your kickoff call.</p>
              )}
              <Link to="/cart" className="btn btn-ghost btn-block" onClick={closeCart}>View full cart</Link>
              <Link to="/checkout" className="btn btn-primary btn-block" onClick={closeCart}>Checkout · {formatPrice(total)}</Link>
            </footer>
          </>
        )}
      </aside>
    </div>
  );
}
