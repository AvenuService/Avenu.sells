import { Link } from "react-router-dom";

export type Crumb = { label: string; to?: string };

export default function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav className="crumbs" aria-label="Breadcrumb">
      <ol>
        {items.map((c, i) => {
          const last = i === items.length - 1;
          return (
            <li key={i}>
              {last || !c.to ? (
                <span className={last ? "crumb-active" : ""}>{c.label}</span>
              ) : (
                <Link to={c.to}>{c.label}</Link>
              )}
              {!last && <span className="crumb-sep" aria-hidden="true">/</span>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
