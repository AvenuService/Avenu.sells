export function LoadingGrid({ rows = 6 }: { rows?: number }) {
  return (
    <div className="grid-catalog" aria-busy="true" aria-label="Loading products">
      {Array.from({ length: rows }).map((_, i) => (
        <div className="card product-card skeleton-card" key={i}>
          <span className="skeleton-art" aria-hidden="true" />
          <div className="skeleton-body">
            <span className="skeleton-line w40" />
            <span className="skeleton-line w80" />
            <span className="skeleton-line w60" />
            <span className="skeleton-line w30 mt" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function InlineSpinner({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="inline-spinner" role="status">
      <span className="spinner" aria-hidden="true" />
      <span className="muted">{label}</span>
    </div>
  );
}
