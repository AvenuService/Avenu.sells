import { StarIcon } from "./Icons";

export default function Rating({ value, count }: { value: number; count?: number }) {
  return (
    <div className="rating">
      <span className="rating-stars" aria-label={`${value.toFixed(1)} out of 5`}>
        {[0, 1, 2, 3, 4].map((i) => (
          <StarIcon
            key={i}
            size={15}
            className={i < Math.round(value) ? "star-on" : "star-off"}
          />
        ))}
      </span>
      <span className="rating-num">{value.toFixed(1)}</span>
      {count !== undefined && <span className="rating-count muted">({count})</span>}
    </div>
  );
}
