import { Link } from "react-router-dom";
import { useCart } from "../store/CartContext";
import { formatPrice } from "../data/products";
import Breadcrumbs from "../components/Breadcrumbs";
import { CartIcon, MinusIcon, PlusIcon, TrashIcon, ArrowRight, TruckIcon } from "../components/Icons";

export default function Cart() {
  const { items, subtotal, shipping, tax, total, updateQuantity, removeItem, clear, count } = useCart();

  if (items.length === 0) {
    return (
      <div className="container cart-page">
        <Breadcrumbs items={[{ label: "Home", to: "/" }, { label: "Cart" }]} />
        <div className="empty-state">
          <div className="cart-empty-art" style={{ margin: "0 auto 1.2rem", width: 90, height: 90, borderRadius: "50%" }} />
          <h2>Your cart is empty</h2>
          <p>No essentials yet — explore the catalog and start building your edition of Avenu.</p>
          <Link to="/shop" className="btn btn-primary btn-lg">Browse the catalog <ArrowRight size={16} /></Link>
        </div>
      </div>
    );
  }

  const remaining = 150 - subtotal;

  return (
    <div className="container cart-page">
      <Breadcrumbs items={[{ label: "Home", to: "/" }, { label: "Cart" }]} />

      <div className="fade-up" style={{ marginBottom: "1.6rem" }}>
        <p className="eyebrow">Shopping cart</p>
        <h1 className="section-title" style={{ marginBottom: 0 }}>{count} {count === 1 ? "item" : "items"} in your cart</h1>
      </div>

      <div className="cart-page-grid">
        <div className="cart-list">
          {shipping > 0 && (
            <div className="card" style={{ padding: "0.85rem 1.1rem", display: "flex", alignItems: "center", gap: "0.6rem" }}>
              <TruckIcon size={18} style={{ color: "var(--accent-ice)" }} />
              <span className="muted" style={{ fontSize: "0.92rem" }}>
                Add <strong style={{ color: "var(--accent-ice)" }}>{formatPrice(remaining)}</strong> more to unlock <strong style={{ color: "var(--accent-ice)" }}>free shipping</strong>.
              </span>
            </div>
          )}
          {shipping === 0 && (
            <div className="card" style={{ padding: "0.85rem 1.1rem", display: "flex", alignItems: "center", gap: "0.6rem" }}>
              <TruckIcon size={18} style={{ color: "var(--accent-ice)" }} />
              <span style={{ fontSize: "0.92rem", color: "var(--accent-ice)" }}>You've unlocked <strong>free shipping</strong>.</span>
            </div>
          )}

          {items.map((item) => (
            <div className="cart-row" key={item.id}>
              <Link to={`/product/${item.imageSlug}`} className="cart-row-art" style={{ background: `linear-gradient(135deg, ${item.gradient[0]}, ${item.gradient[1]})` }}>
                <span>{item.name.charAt(0)}</span>
              </Link>
              <div className="cart-row-info">
                <Link to={`/product/${item.imageSlug}`} className="cart-row-name">{item.name}</Link>
                <span className="cart-row-color">{item.color}</span>
                <span className="muted" style={{ fontSize: "0.82rem" }}>{formatPrice(item.price)} each</span>
                <div className="cart-row-actions">
                  <div className="qty" style={{ background: "rgba(2,16,36,0.4)" }}>
                    <button onClick={() => updateQuantity(item.id, item.quantity - 1)} aria-label="Decrease"><MinusIcon size={14} /></button>
                    <span>{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, item.quantity + 1)} aria-label="Increase"><PlusIcon size={14} /></button>
                  </div>
                  <button className="cart-row-remove" onClick={() => removeItem(item.id)} aria-label={`Remove ${item.name}`}>
                    <TrashIcon size={14} /> Remove
                  </button>
                </div>
              </div>
              <div className="cart-row-price">{formatPrice(item.price * item.quantity)}</div>
            </div>
          ))}

          <div style={{ display: "flex", justifyContent: "space-between", margin: "0.5rem 0 0" }}>
            <Link to="/shop" className="btn btn-ghost btn-sm"><ArrowRight size={14} style={{ transform: "rotate(180deg)" }} /> Continue shopping</Link>
            <button className="cart-row-remove" onClick={clear}><TrashIcon size={14} /> Clear cart</button>
          </div>
        </div>

        <aside className="cart-summary">
          <div style={{ display: "flex", alignItems: "center", gap: "0.55rem", marginBottom: "0.4rem" }}>
            <CartIcon size={18} />
            <h2>Order summary</h2>
          </div>
          <div className="summary-line"><span>Subtotal</span><span>{formatPrice(subtotal)}</span></div>
          <div className="summary-line"><span>Shipping</span><span>{shipping === 0 ? "Free" : formatPrice(shipping)}</span></div>
          <div className="summary-line"><span>Tax (est. 8%)</span><span>{formatPrice(tax)}</span></div>
          <div className="summary-total"><span>Total</span><span>{formatPrice(total)}</span></div>

          <div className="promo-row">
            <input className="field" placeholder="Promo code" aria-label="Promo code" />
            <button className="btn btn-soft">Apply</button>
          </div>

          <Link to="/checkout" className="btn btn-primary btn-block" style={{ marginTop: "0.4rem" }}>Proceed to checkout</Link>
          <p className="muted center" style={{ fontSize: "0.78rem", marginTop: "0.6rem" }}>Secure checkout · Pay with card, Apple Pay, or PayPal</p>
        </aside>
      </div>
    </div>
  );
}
