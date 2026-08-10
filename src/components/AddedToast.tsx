import { useCart } from "../store/CartContext";
import { formatPrice } from "../data/products";
import { CheckIcon } from "./Icons";

export default function AddedToast() {
  const { lastAdded } = useCart();
  if (!lastAdded) return null;
  return (
    <div className="added-toast card" role="status">
      <span className="added-check"><CheckIcon size={14} /></span>
      <div className="added-toast-body">
        <strong>Added to cart</strong>
        <span className="muted">{lastAdded.name} · {lastAdded.color}</span>
      </div>
      <span className="added-price">{formatPrice(lastAdded.price * lastAdded.quantity)}</span>
    </div>
  );
}
