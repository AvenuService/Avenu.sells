import { Link } from "react-router-dom";
import type { Product } from "../data/products";
import { formatPrice } from "../data/products";
import { useCart } from "../store/CartContext";
import { useWishlist } from "../store/WishlistContext";
import { CartIcon, HeartIcon, StarIcon } from "./Icons";

export default function ProductCard({ product }: { product: Product }) {
    const { addItem } = useCart();
  const { has: inWishlist, toggle: toggleWishlist } = useWishlist();

  return (
        <article className="product-card card">
      <button
        type="button"
        className={`pc-heart ${inWishlist(product.id) ? "active" : ""}`}
        aria-label={inWishlist(product.id) ? "Remove from wishlist" : "Add to wishlist"}
        title={inWishlist(product.id) ? "Remove from wishlist" : "Add to wishlist"}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          toggleWishlist(product.id);
        }}
      >
        <HeartIcon size={16} />
      </button>

      <Link to={`/product/${product.slug}`} className="pc-media" aria-label={product.name}>
        <div
          className="pc-art"
          style={{
            backgroundImage: `radial-gradient(120% 90% at 30% 0%, ${product.gradient[0]} 0%, ${product.gradient[1]} 60%, #021024 100%)`,
          }}
        >
          <span className="pc-glyph">{product.name.charAt(0)}</span>
        </div>
        {product.oldPrice && <span className="pc-flag">Save {formatPrice(product.oldPrice - product.price)}</span>}
        {product.bestseller && <span className="pc-flag flag-ice">Bestseller</span>}
                {product.type === "service" && <span className="pc-flag flag-ice">Service</span>}
        {product.type === "digital" && <span className="pc-flag">Instant access</span>}
      </Link>

      <div className="pc-body">
        <div className="pc-meta">
          <span className="pc-cat">{product.brand}</span>
          {product.reviews > 0 && (
            <span className="pc-rate"><StarIcon size={13} /> {product.rating.toFixed(1)}<span className="pc-rev">({product.reviews})</span></span>
          )}
        </div>

        <h3 className="pc-title"><Link to={`/product/${product.slug}`}>{product.name}</Link></h3>
        <p className="pc-tagline">{product.tagline}</p>

        <div className="pc-foot">
          <div className="pc-price-row">
            <span className="pc-price">{formatPrice(product.price)}</span>
            {product.oldPrice && <span className="pc-old">{formatPrice(product.oldPrice)}</span>}
          </div>
          {product.type === "service" ? (
            <Link
              to={`/product/${product.slug}`}
              className="btn btn-primary btn-sm pc-add"
              aria-label={`View ${product.name} package`}
            >
              View package
            </Link>
          ) : (
            <button
              className="btn btn-primary btn-sm pc-add"
              onClick={(e) => { e.preventDefault(); addItem(product.id, { quantity: 1 }); }}
              aria-label={`Add ${product.name} to cart`}
            >
              <CartIcon size={15} /> Add
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
