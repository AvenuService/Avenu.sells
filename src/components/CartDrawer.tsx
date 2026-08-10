import { Link } from "react-router-dom";
import { useCart } from "../store/CartContext";
import { formatPrice } from "../data/products";
import { CartIcon, CloseIcon, MinusIcon, PlusIcon, TrashIcon } from "./Icons";

export default function CartDrawer() {
  const { isOpen, closeCart, items, subtotal, shipping, total, updateQuantity, removeItem, count } = useCart();

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
                      <div className="qty">
                        <button onClick={() => updateQuantity(item.id, item.quantity - 1)} aria-label="Decrease"><MinusIcon size={14} /></button>
                        <span>{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, item.quantity + 1)} aria-label="Increase"><PlusIcon size={14} /></button>
                      </div>
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
              <div className="cart-line"><span className="muted">Shipping</span><span>{shipping === 0 ? "Free" : formatPrice(shipping)}</span></div>
              <div className="cart-line cart-line-total"><span>Total</span><span>{formatPrice(total)}</span></div>
              <p className="cart-hint muted">{subtotal < 150 ? `Add ${formatPrice(150 - subtotal)} for free shipping.` : "You've unlocked free shipping."}</p>
              <Link to="/cart" className="btn btn-ghost btn-block" onClick={closeCart}>View full cart</Link>
              <Link to="/checkout" className="btn btn-primary btn-block" onClick={closeCart}>Checkout · {formatPrice(total)}</Link>
            </footer>
          </>
        )}
      </aside>
    </div>
  );
}
