import { useEffect } from "react";

const BASE = "Avenu — Curated Essentials & Website Studio";

/**
 * Tiny SEO helper. Sets a sensible per-route <title> (and optionally updates the
 * description meta tags) so each page is linkable/socialable without pulling in
 * `react-helmet`. No-op SSR-safe.
 */
export default function Seo({
  title,
  description,
}: {
  title?: string;
  description?: string;
}) {
  useEffect(() => {
    document.title = title ? `${title} · ${BASE}` : BASE;
    if (!description) return;
    const selectors = [
      'meta[name="description"]',
      'meta[property="og:description"]',
      'meta[name="twitter:description"]',
    ];
    for (const sel of selectors) {
      const el = document.querySelector<HTMLMetaElement>(sel);
      if (el) el.setAttribute("content", description);
    }
  }, [title, description]);
  return null;
}
