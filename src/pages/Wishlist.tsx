import { Link } from "react-router-dom";
import Breadcrumbs from "../components/Breadcrumbs";
import Seo from "../components/Seo";
import { useCatalog } from "../store/CatalogContext";
import { useWishlist } from "../store/WishlistContext";
import ProductCard from "../components/ProductCard";
import { HeartIcon } from "../components/Icons";

export default function Wishlist() {
  const { ids } = useWishlist();
  const { products } = useCatalog();
  const items = products.filter((p) => ids.includes(p.id));

  return (
    <div className="container" style={{ paddingBlock: "3rem 5rem" }}>
      <Seo title="Your Wishlist" description="Products you've saved at Avenu." />
      <Breadcrumbs items={[{ label: "Home", to: "/" }, { label: "Wishlist" }]} />

      <header
        className="fade-up"
        style={{ maxWidth: "720px", margin: "1.5rem auto 0", textAlign: "center" }}
      >
        <p className="eyebrow" style={{ marginBottom: "0.6rem" }}>
          Saved
        </p>
        <h1 className="section-title" style={{ marginBottom: "1rem" }}>
          Your wishlist
        </h1>
        <p
          className="muted"
          style={{ fontSize: "0.92rem", maxWidth: "560px", margin: "0 auto" }}
        >
          Items you've loved stay here — until you're ready to check out.
        </p>
      </header>

      {items.length === 0 ? (
        <div
          className="fade-up"
          style={{ marginTop: "2rem", textAlign: "center" }}
        >
          <HeartIcon size={28} style={{ margin: "0 auto 1rem", opacity: 0.5 }} />
          <h3 style={{ marginBottom: "0.5rem" }}>Your wishlist is empty</h3>
          <p className="muted" style={{ marginBottom: "1.2rem" }}>
            Save items you like from any product card.
          </p>
          <Link to="/shop" className="btn btn-primary">
            Browse the catalog
          </Link>
        </div>
      ) : (
        <div className="grid-catalog stagger" style={{ marginTop: "2rem" }}>
          {items.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
