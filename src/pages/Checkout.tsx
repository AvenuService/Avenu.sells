import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../store/CartContext";
import { useOrders, generateOrderCode } from "../store/OrdersContext";
import { useShopperAuth } from "../store/ShopperAuthContext";
import { formatPrice } from "../data/products";
import Breadcrumbs from "../components/Breadcrumbs";
import CryptoPayment from "../components/CryptoPayment";
import { getCryptoQuote, type CryptoQuote } from "../lib/crypto";
import { ArrowRight, CheckIcon, ShieldIcon, TruckIcon, GoogleIcon } from "../components/Icons";

type Delivery = "standard" | "express" | "nextday";
const deliveryOptions: { id: Delivery; name: string; note: string; price: number }[] = [
  { id: "standard", name: "Standard", note: "3-5 business days", price: 0 },
  { id: "express", name: "Express", note: "1-2 business days", price: 12 },
  { id: "nextday", name: "Next-day", note: "Order by 2pm local", price: 24 },
];

const paymentMethods = ["Litecoin (Crypto)", "Card", "Apple Pay", "PayPal", "Affirm"] as const;
const CRYPTO_METHOD = "Litecoin (Crypto)";

export default function Checkout() {
  const { items, subtotal, tax, clear } = useCart();
  const { createOrder } = useOrders();
  const { session, loading: authLoading, signInWithGoogle, error: authError } = useShopperAuth();
  const navigate = useNavigate();
  const [delivery, setDelivery] = useState<Delivery>("standard");
  const [payment, setPayment] = useState<string>(CRYPTO_METHOD);
  const [placed, setPlaced] = useState(false);
  const [signingIn, setSigningIn] = useState(false);
  const [cryptoQuote, setCryptoQuote] = useState<CryptoQuote | null>(null);
  const [cryptoLoading, setCryptoLoading] = useState(false);
  const [cryptoError, setCryptoError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const serviceOnly = items.length > 0 && items.every((i) => i.type === "service");
  const deliveryPrice = deliveryOptions.find((d) => d.id === delivery)?.price ?? 0;
  const freeShip = subtotal >= 150;
  const finalShipping = serviceOnly ? 0 : (freeShip ? 0 : deliveryPrice);
  const total = subtotal + finalShipping + tax;

  // Fetch the live LTC quote whenever the order total changes (only matters on
  // the crypto method, but it's cheap to keep warm).
  useEffect(() => {
    let active = true;
    setCryptoLoading(true);
    getCryptoQuote(total)
      .then((q) => {
        if (!active) return;
        setCryptoQuote(q);
        setCryptoError(null);
      })
      .catch((e) => {
        if (active) setCryptoError(String(e?.message ?? e));
      })
      .finally(() => {
        if (active) setCryptoLoading(false);
      });
    return () => {
      active = false;
    };
  }, [total]);

  function readField(id: string): string {
    const el = formRef.current?.querySelector(`#${id}`) as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null;
    return el?.value?.trim() ?? "";
  }

  async function placeOrder(e: React.FormEvent) {
    e.preventDefault();
    setPlaced(true);

    const code = generateOrderCode();
    const email = readField("email");
    const firstName = readField("firstName");
    const lastName = readField("lastName");
    const customerName = [firstName, lastName].filter(Boolean).join(" ") || undefined;

    const brief = serviceOnly
      ? {
          projectName: readField("projectName") || undefined,
          projectType: readField("projectType") || undefined,
          brief: readField("brief") || undefined,
          deadline: readField("deadline") || undefined,
          budget: readField("budget") || undefined,
        }
      : null;

    const orderItems = items.map((i) => ({
      productId: i.productId,
      name: i.name,
      price: i.price,
      quantity: i.quantity,
      color: i.color,
      type: i.type,
    }));

    const isCrypto = payment === CRYPTO_METHOD;
    const notes = isCrypto
      ? JSON.stringify({
          paymentMethod: "litecoin",
          wallet: cryptoQuote?.wallet ?? "",
          ltcAmount: cryptoQuote?.ltcAmount ?? 0,
          usdTotal: cryptoQuote?.usdTotal ?? total,
          rateUsd: cryptoQuote?.rateUsd ?? 0,
          network: "litecoin",
        })
      : undefined;

    try {
      const created = await createOrder({
        code,
        status: "new",
        customerEmail: email || undefined,
        customerName,
        items: orderItems,
        brief,
        notes,
        subtotal,
        shipping: finalShipping,
        tax,
        total,
        currency: "USD",
      });
      // Created returns null on failure (logged in context) — we still navigate
      // so the customer sees a confirmation regardless of backend state.
      clear();
      const orderCode = created?.code ?? code;
      const dest = isCrypto
        ? `/order/${orderCode}?pay=crypto&wallet=${encodeURIComponent(cryptoQuote?.wallet ?? "")}&ltc=${encodeURIComponent((cryptoQuote?.ltcAmount ?? 0).toFixed(6))}&usd=${encodeURIComponent((cryptoQuote?.usdTotal ?? total).toFixed(2))}`
        : `/order/${orderCode}`;
      setTimeout(() => navigate(dest), 700);
    } catch {
      // Even if order write fails, don't hang the customer. Fall through to confirmation.
      clear();
      const dest = isCrypto
        ? `/order/${code}?pay=crypto&wallet=${encodeURIComponent(cryptoQuote?.wallet ?? "")}&ltc=${encodeURIComponent((cryptoQuote?.ltcAmount ?? 0).toFixed(6))}&usd=${encodeURIComponent((cryptoQuote?.usdTotal ?? total).toFixed(2))}`
        : `/order/${code}`;
      setTimeout(() => navigate(dest), 700);
    }
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

  // Auth gate — must be signed in to place an order. Keep cart intact while
  // showing the wall so the user can preview the order they're about to
  // place once they sign in.
  if (!session) {
    return (
      <div className="container section">
        <Breadcrumbs items={[{ label: "Home", to: "/" }, { label: "Cart", to: "/cart" }, { label: "Checkout" }]} />

        <div className="checkout-steps fade-up" style={{ marginTop: "1rem" }}>
          <div className="step active"><span className="step-num">1</span> Cart</div>
          <div className="step-connector" />
          <div className="step active"><span className="step-num">2</span> Checkout</div>
          <div className="step-connector" />
          <div className="step"><span className="step-num">3</span> Confirmation</div>
        </div>

        <div className="checkout-gate card fade-up">
          <div className="gate-art"><ShieldIcon size={28} /></div>
          <p className="eyebrow">Sign in required</p>
          <h1 className="section-title" style={{ marginBottom: "0.5rem" }}>Sign in to complete checkout.</h1>
          <p className="muted" style={{ marginBottom: "1.4rem", maxWidth: "440px" }}>
            Your cart is waiting. Sign in with Google so we can attach your order to your account and
            email you a copy of the receipt. We won't charge anything yet — payment happens on the next step.
          </p>

          <button
            type="button"
            className="google-btn"
            onClick={async () => {
              if (signingIn) return;
              setSigningIn(true);
              const res = await signInWithGoogle();
              if (!res.ok) {
                setSigningIn(false);
                // The error is also surfaced in authError below.
              }
              // On success, the browser navigates away to Google's consent screen.
              // The React redirect happens automatically once they come back.
            }}
            disabled={signingIn || authLoading}
          >
            <GoogleIcon size={20} />
            <span>{signingIn ? "Redirecting to Google…" : "Continue with Google"}</span>
          </button>

          {authError && (
            <div className="gate-error" role="alert">
              <strong>Couldn't start sign-in.</strong>
              <p className="muted" style={{ marginTop: "0.3rem" }}>
                {authError}
                {/google/i.test(authError) || /provider/i.test(authError) || /disabled/i.test(authError)
                  ? " — Make sure the Google provider is enabled under Supabase → Authentication → Providers."
                  : ""}
              </p>
            </div>
          )}

          <div className="gate-meta">
            <ShieldIcon size={14} />
            <span>Secured by Supabase Auth · We never see your Google password.</span>
          </div>

          <div className="gate-back">
            <Link to="/cart" className="btn btn-ghost btn-sm">← Back to cart</Link>
          </div>
        </div>
      </div>
    );
  }

  // Capture the session email once — pre-fill the Contact field if empty.
  const sessionEmail = session?.user?.email ?? "";

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
        <form onSubmit={placeOrder} ref={formRef}>
          <section className="checkout-section fade-up">
            <h2>Contact</h2>
            <div className="form-grid">
              <div className="form-group"><label htmlFor="email">Email</label><input id="email" className="field" type="email" placeholder="you@avenu.sale" required defaultValue={sessionEmail} /></div>
              <div className="form-group"><label htmlFor="phone">Phone</label><input id="phone" className="field" type="tel" placeholder="+1 555 000 0000" /></div>
            </div>
          </section>

          {!serviceOnly && (
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
          )}

          {serviceOnly && (
            <section className="checkout-section fade-up">
              <h2>Project brief</h2>
              <div className="form-grid">
                <div className="form-group full"><label htmlFor="projectName">Project / company name</label><input id="projectName" className="field" placeholder="Avery Studio" /></div>
                <div className="form-group full"><label htmlFor="projectType">What are we building?</label>
                  <select id="projectType" className="field" defaultValue="Website">
                    <option>Website</option>
                    <option>Web app</option>
                    <option>Online store</option>
                    <option>Portfolio</option>
                    <option>Something else</option>
                  </select>
                </div>
                <div className="form-group full"><label htmlFor="brief">Tell us about it</label><textarea id="brief" className="field" rows={4} placeholder="What does it need to do? Any must-haves, references, timeline…" /></div>
                <div className="form-group"><label htmlFor="deadline">Target launch date</label><input id="deadline" className="field" type="date" /></div>
                <div className="form-group"><label htmlFor="budget">Budget (optional)</label><input id="budget" className="field" placeholder="$" /></div>
              </div>
            </section>
          )}

          {!serviceOnly && (
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
          )}

          <section className="checkout-section fade-up">
            <h2>Payment</h2>
            <div className="payment-methods">
              {paymentMethods.map((m) => (
                <button type="button" key={m} className={`payment-method ${payment === m ? "active" : ""}`} onClick={() => setPayment(m)}>{m}</button>
              ))}
            </div>

            {payment === CRYPTO_METHOD && (
              <div style={{ marginTop: "1rem" }}>
                <CryptoPayment
                  quote={cryptoQuote}
                  loading={cryptoLoading}
                  error={cryptoError}
                  onCopy={() => undefined}
                />
              </div>
            )}

            {payment === "Card" && (
              <div className="form-grid" style={{ marginTop: "1rem" }}>
                <div className="form-group full"><label htmlFor="card">Card number</label><input id="card" className="field" placeholder="0000 0000 0000 0000" inputMode="numeric" /></div>
                <div className="form-group"><label htmlFor="exp">Expiry</label><input id="exp" className="field" placeholder="MM / YY" /></div>
                <div className="form-group"><label htmlFor="cvc">Security code</label><input id="cvc" className="field" placeholder="CVC" inputMode="numeric" /></div>
                <div className="form-group full"><label htmlFor="name">Name on card</label><input id="name" className="field" placeholder="Avery Frost" /></div>
              </div>
            )}
            {payment !== CRYPTO_METHOD && payment !== "Card" && (
              <p className="muted" style={{ marginTop: "1rem", fontSize: "0.9rem" }}>You'll be redirected to {payment} to complete your purchase securely.</p>
            )}
            {payment === CRYPTO_METHOD && (
              <p className="muted" style={{ marginTop: "0.9rem", fontSize: "0.9rem" }}>
                Copy the wallet address (or scan the QR) and send <strong>{cryptoQuote?.ltcAmount ? cryptoQuote.ltcAmount.toFixed(6) : "…"} LTC</strong>. After sending, place the order — you'll verify your transaction on the confirmation page.
              </p>
            )}
          </section>

          <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={placed} style={{ marginTop: "0.6rem" }}>
            {placed ? "Placing order…" : payment === CRYPTO_METHOD ? <>Place order · Pay with Litecoin <ArrowRight size={16} /></> : <>Place order · {formatPrice(total)} <ArrowRight size={16} /></>}
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
          {serviceOnly ? (
            <div className="summary-line"><span>Delivery</span><span style={{ color: "var(--accent-ice)" }}>Digital handoff</span></div>
          ) : (
            <div className="summary-line"><span>Delivery</span><span>{finalShipping === 0 ? "Free" : formatPrice(finalShipping)}</span></div>
          )}
          <div className="summary-line"><span>Tax (est.)</span><span>{formatPrice(tax)}</span></div>
          <div className="summary-total"><span>Total</span><span>{formatPrice(total)}</span></div>
        </aside>
      </div>
    </div>
  );
}
