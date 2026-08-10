import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../store/CartContext";
import { formatPrice } from "../data/products";
import Breadcrumbs from "../components/Breadcrumbs";
import { ArrowRight, CheckIcon, ShieldIcon, TruckIcon } from "../components/Icons";

type Delivery = "standard" | "express" | "nextday";
const deliveryOptions: { id: Delivery; name: string; note: string; price: number }[] = [
  { id: "standard", name: "Standard", note: "3-5 business days", price: 0 },
  { id: "express", name: "Express", note: "1-2 business days", price: 12 },
  { id: "nextday", name: "Next-day", note: "Order by 2pm local", price: 24 },
];

const paymentMethods = ["Card", "Apple Pay", "PayPal", "Affirm"] as const;

export default function Checkout() {
  const { items, subtotal, tax, clear } = useCart();
  const navigate = useNavigate();
  const [delivery, setDelivery] = useState<Delivery>("standard");
  const [payment, setPayment] = useState<string>("Card");
  const [placed, setPlaced] = useState(false);

  const deliveryPrice = deliveryOptions.find((d) => d.id === delivery)?.price ?? 0;
  const freeShip = subtotal >= 150;
  const finalShipping = freeShip ? 0 : deliveryPrice;
  const total = subtotal + finalShipping + tax;

  function placeOrder(e: React.FormEvent) {
    e.preventDefault();
    setPlaced(true);
    const orderId = "AVN-" + Math.random().toString(36).slice(2, 7).toUpperCase();
    clear();
    setTimeout(() => navigate(`/order/${orderId}${items.length ? "" : ""}`), 700);
  }

  if (items.length === 0 && !placed) {
    return (
      <div className="container section empty-state">
        <h2>Your cart is empty</h2>
        <p>Add something to your cart before heading to checkout.</p>
        <Link to="/shop" className="btn btn-primary">Browse the catalog</Link>
      </div>
    );
  }

  return (
    <div className="container checkout">
      <Breadcrumbs items={[{ label: "Home", to: "/" }, { label: "Cart", to: "/cart" }, { label: "Checkout" }]} />

      <div className="checkout-steps fade-up" style={{ marginTop: "1rem" }}>
        <div className="step active"><span className="step-num">1</span> Cart</div>
        <div className="step-connector" />
        <div className="step active"><span className="step-num">2</span> Checkout</div>
        <div className="step-connector" />
        <div className="step"><span className="step-num">3</span> Confirmation</div>
      </div>

      <h1 className="section-title fade-up" style={{ marginBottom: "1.6rem" }}>Checkout</h1>

      {placed && (
        <div className="card" style={{ padding: "1.5rem 1.4rem", marginBottom: "1.4rem", display: "flex", gap: "0.85rem", alignItems: "center", borderColor: "rgba(193,232,255,0.3)" }}>
          <span className="added-check" style={{ width: 32, height: 32, flexShrink: 0 }}><CheckIcon size={16} /></span>
          <div><strong>Placing your order…</strong><div className="muted" style={{ fontSize: "0.88rem" }}>Routing you to the confirmation page.</div></div>
        </div>
      )}

      <div className="checkout-grid">
        <form onSubmit={placeOrder}>
          <section className="checkout-section fade-up">
            <h2>Contact</h2>
            <div className="form-grid">
              <div className="form-group"><label htmlFor="email">Email</label><input id="email" className="field" type="email" placeholder="you@avenu.sale" required /></div>
              <div className="form-group"><label htmlFor="phone">Phone</label><input id="phone" className="field" type="tel" placeholder="+1 555 000 0000" /></div>
            </div>
          </section>

          <section className="checkout-section fade-up">
            <h2>Shipping address</h2>
            <div className="form-grid">
              <div className="form-group"><label htmlFor="firstName">First name</label><input id="firstName" className="field" placeholder="Avery" required /></div>
              <div className="form-group"><label htmlFor="lastName">Last name</label><input id="lastName" className="field" placeholder="Frost" required /></div>
              <div className="form-group full"><label htmlFor="address">Street address</label><input id="address" className="field" placeholder="221B Icy Lane" required /></div>
              <div className="form-group"><label htmlFor="city">City</label><input id="city" className="field" placeholder="Aurora" required /></div>
              <div className="form-group"><label htmlFor="zip">ZIP / Postal</label><input id="zip" className="field" placeholder="00000" required /></div>
              <div className="form-group full"><label htmlFor="country">Country</label><input id="country" className="field" placeholder="United States" defaultValue="United States" required /></div>
            </div>
          </section>

          <section className="checkout-section fade-up">
            <h2>Delivery</h2>
            <div className="delivery-options">
              {deliveryOptions.map((opt) => (
                <label key={opt.id} className={`delivery-opt ${delivery === opt.id ? "active" : ""}`}>
                  <span className="do-radio" />
                  <input type="radio" name="delivery" value={opt.id} checked={delivery === opt.id} onChange={() => setDelivery(opt.id)} style={{ position: "absolute", opacity: 0, width: 0, height: 0 }} />
                  <span className="delivery-opt-text"><strong>{opt.name}</strong><span>{opt.note}{opt.id === "standard" && freeShip ? " · Free over $150" : ""}</span></span>
                  <span className="delivery-opt-price">{opt.price === 0 ? "Free" : formatPrice(opt.price)}</span>
                </label>
              ))}
            </div>
          </section>

          <section className="checkout-section fade-up">
            <h2>Payment</h2>
            <div className="payment-methods">
              {paymentMethods.map((m) => (
                <button type="button" key={m} className={`payment-method ${payment === m ? "active" : ""}`} onClick={() => setPayment(m)}>{m}</button>
              ))}
            </div>

            {payment === "Card" && (
              <div className="form-grid" style={{ marginTop: "1rem" }}>
                <div className="form-group full"><label htmlFor="card">Card number</label><input id="card" className="field" placeholder="0000 0000 0000 0000" inputMode="numeric" /></div>
                <div className="form-group"><label htmlFor="exp">Expiry</label><input id="exp" className="field" placeholder="MM / YY" /></div>
                <div className="form-group"><label htmlFor="cvc">Security code</label><input id="cvc" className="field" placeholder="CVC" inputMode="numeric" /></div>
                <div className="form-group full"><label htmlFor="name">Name on card</label><input id="name" className="field" placeholder="Avery Frost" /></div>
              </div>
            )}
            {payment !== "Card" && (
              <p className="muted" style={{ marginTop: "1rem", fontSize: "0.9rem" }}>You'll be redirected to {payment} to complete your purchase securely.</p>
            )}
          </section>

          <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={placed} style={{ marginTop: "0.6rem" }}>
            {placed ? "Placing order…" : <>Place order · {formatPrice(total)} <ArrowRight size={16} /></>}
          </button>
          <div className="summary-meta" style={{ marginTop: "0.85rem", justifyContent: "center" }}>
            <ShieldIcon size={14} /><span>Encrypted, PCI-compliant checkout · Your card details never touch Avenu.</span>
          </div>
        </form>

        <aside className="checkout-summary fade-up">
          <div style={{ display: "flex", alignItems: "center", gap: "0.55rem" }}>
            <TruckIcon size={18} />
            <h2>Your order</h2>
          </div>
          <div className="cast-mini">
            {items.map((item) => (
              <div className="cast-mini-row" key={item.id}>
                <span className="do-art" style={{ background: `linear-gradient(135deg, ${item.gradient[0]}, ${item.gradient[1]})` }}><span>{item.name.charAt(0)}</span></span>
                <div className="cm-info">
                  <div className="cm-name">{item.name}</div>
                  <div className="cm-qty">{item.color} · ×{item.quantity}</div>
                </div>
                <div className="cm-price">{formatPrice(item.price * item.quantity)}</div>
              </div>
            ))}
          </div>

          <hr className="divider" />
          <div className="summary-line"><span>Subtotal</span><span>{formatPrice(subtotal)}</span></div>
          <div className="summary-line"><span>Delivery</span><span>{finalShipping === 0 ? "Free" : formatPrice(finalShipping)}</span></div>
          <div className="summary-line"><span>Tax (est.)</span><span>{formatPrice(tax)}</span></div>
          <div className="summary-total"><span>Total</span><span>{formatPrice(total)}</span></div>
        </aside>
      </div>
    </div>
  );
}
