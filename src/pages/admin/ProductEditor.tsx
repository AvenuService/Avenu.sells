import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import AdminLayout from "./AdminLayout";
import { useCatalog } from "../../store/CatalogContext";
import {
  categories,
  formatPrice,
  pickGradient,
  slugify,
  type Product,
  type ProductType,
} from "../../data/products";
import {
  PlusIcon,
  TrashIcon,
  CopyIcon,
  CheckIcon,
  DigitalIcon,
  BoxIcon,
} from "../../components/Icons";

type Draft = Omit<Product, "id" | "createdAt"> & { id?: string };

const blankDraft: Draft = {
  slug: "",
  name: "",
  brand: "Avenu Studio",
  category: "software",
  type: "digital",
  price: 49,
  oldPrice: undefined,
  discount: undefined,
  promotion: "",
  rating: 5,
  reviews: 0,
  tagline: "",
  description: "",
  features: ["", "", ""],
  colors: [{ name: "Midnight", hex: "#021024" }],
  stock: 999,
  featured: false,
  bestseller: false,
  imageBanner: "",
  gradient: pickGradient("avenu"),
};

export default function ProductEditor() {
  const { id } = useParams<{ id: string }>();
  const editing = !!id;
  const { products, createProduct, updateProduct, productById } = useCatalog();
  const navigate = useNavigate();
  const existing = editing && id ? productById(id) : undefined;

  const [draft, setDraft] = useState<Draft>(() =>
    existing ? structuredCloneSafe(existing) : { ...blankDraft, gradient: pickGradient(Date.now().toString()) },
  );
  const [slugError, setSlugError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // if editing and the route id changes, re-sync draft
  useEffect(() => {
    if (existing) {
      setDraft(structuredCloneSafe(existing));
      setSlugError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // slug uniqueness
  const slugPreview = slugify(draft.slug || draft.name);
  const slugConflicts = useMemo(
    () => products.filter((p) => p.slug === slugPreview && p.id !== existing?.id),
    [products, slugPreview, existing?.id],
  );

  function patch<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
  }

  function setFeature(i: number, value: string) {
    setDraft((d) => {
      const next = [...d.features];
      next[i] = value;
      return { ...d, features: next };
    });
  }
  function addFeature() { setDraft((d) => ({ ...d, features: [...d.features, ""] })); }
  function removeFeature(i: number) { setDraft((d) => ({ ...d, features: d.features.filter((_, j) => j !== i) })); }

  function setColor(i: number, key: "name" | "hex", value: string) {
    setDraft((d) => {
      const next = d.colors.map((c, j) => (j === i ? { ...c, [key]: value } : c));
      return { ...d, colors: next };
    });
  }
  function addColor() { setDraft((d) => ({ ...d, colors: [...d.colors, { name: "Custom", hex: "#5483B3" }] })); }
  function removeColor(i: number) { setDraft((d) => ({ ...d, colors: d.colors.filter((_, j) => j !== i) })); }

  // image upload (read as dataURL — stored locally for this build tier)
  function onBannerUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) {
      setUploadError("Image must be under 4 MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") { patch("imageBanner", reader.result); setUploadError(null); }
    };
    reader.readAsDataURL(file);
  }
  const [uploadError, setUploadError] = useState<string | null>(null);

  function validate(): boolean {
    if (!draft.name.trim()) return false;
    if (draft.price < 0) return false;
    if (slugConflicts.length > 0) { setSlugError("Slug already in use. Choose another."); return false; }
    setSlugError(null);
    return true;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setErrorMsg(null);

    // cleanup empty features
    const cleanFeatures = draft.features.map((f) => f.trim()).filter(Boolean);
    const cleanColors = draft.colors.filter((c) => c.name.trim() && c.hex.trim());

    const payload: Omit<Product, "id" | "createdAt"> = {
      ...draft,
      slug: slugPreview,
      features: cleanFeatures,
      colors: cleanColors.length ? cleanColors : [{ name: "Avenu", hex: "#021024" }],
      gradient: draft.imageBanner ? draft.gradient : pickGradient(draft.name),
      type: draft.type,
      stock: draft.type === "digital" ? 999 : Math.max(0, Math.round(draft.stock)),
    };

    setSaving(true);
    try {
      if (editing && existing) {
        const ok = await updateProduct(existing.id, payload);
        if (!ok) throw new Error("Failed to update product in database.");
      } else {
        const created = await createProduct(payload);
        if (!created) throw new Error("Failed to create product. Check Supabase table & RLS policies.");
        navigate(`/admin/products/${created.id}`, { replace: true });
        setSaved(true);
        setTimeout(() => setSaved(false), 1600);
        return;
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 1600);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }

  function copyStoreLink() {
    if (!existing && !editing) return;
    const slug = slugPreview || existing?.slug || "";
    if (slug) navigator.clipboard?.writeText(`${window.location.origin}/product/${slug}`);
  }

  const livePreviewGradient = useMemo(
    () => `linear-gradient(135deg, ${draft.gradient[0]}, ${draft.gradient[1]})`,
    [draft.gradient],
  );

  return (
    <AdminLayout
      title={editing ? "Edit product" : "Add a new product"}
      subtitle={editing ? "Refine the details of this catalog item." : "Build a new entry for the storefront — digital or physical."}
    >
      <form onSubmit={onSubmit} className="admin-editor">
        <div className="admin-editor-main">
          {/* SAVE BANNER */}
          {saved && <div className="admin-saved">Product saved ✓</div>}

          {/* TYPE + CATEGORY */}
          <fieldset className="admin-fieldset card">
            <legend className="admin-legend">Type & category</legend>
            <div className="ae-type-row">
              {(["digital", "physical"] as const).map((t) => (
                <label key={t} className={`ae-type-card ${draft.type === t ? "active" : ""}`}>
                  <input type="radio" name="type" value={t} checked={draft.type === t} onChange={() => patch("type", t as ProductType)} />
                  <span className="ae-type-icon">{t === "digital" ? <DigitalIcon size={20} /> : <BoxIcon size={20} />}</span>
                  <span className="ae-type-text">
                    <strong>{t === "digital" ? "Digital" : "Physical"}</strong>
                    <span className="muted">{t === "digital" ? "Downloadable · no shipping" : "Shippable · needs inventory"}</span>
                  </span>
                </label>
              ))}
            </div>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="cat">Category</label>
                <select id="cat" className="field" value={draft.category} onChange={(e) => patch("category", e.target.value)}>
                  {categories.filter((c) => c.slug !== "all").map((c) => (
                    <option key={c.slug} value={c.slug}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="brand">Brand</label>
                <input id="brand" className="field" value={draft.brand} onChange={(e) => patch("brand", e.target.value)} placeholder="Avenu Studio" />
              </div>
            </div>
          </fieldset>

          {/* CORE INFO */}
          <fieldset className="admin-fieldset card">
            <legend className="admin-legend">Core information</legend>
            <div className="form-grid">
              <div className="form-group full">
                <label htmlFor="name">Product name</label>
                <input id="name" className="field" value={draft.name} onChange={(e) => patch("name", e.target.value)} placeholder="Frost Preset Pack" />
              </div>
              <div className="form-group">
                <label htmlFor="tagline">Tagline</label>
                <input id="tagline" className="field" value={draft.tagline} onChange={(e) => patch("tagline", e.target.value)} placeholder="A short, evocative one-liner" />
              </div>
              <div className="form-group">
                <label htmlFor="slug">URL slug · <code className="muted">/product/THIS</code></label>
                <div className="ae-slug-row">
                  <input
                    id="slug"
                    className={`field ${slugError || slugConflicts.length ? "field-error" : ""}`}
                    value={draft.slug}
                    onChange={(e) => patch("slug", e.target.value)}
                    placeholder={slugify(draft.name) || "frost-preset-pack"}
                  />
                  <button type="button" className="btn btn-soft btn-sm" onClick={() => patch("slug", slugPreview || slugify(draft.name))}>
                    <PlusIcon size={13} /> Suggest
                  </button>
                </div>
                {slugError ? <small className="field-hint error">{slugError}</small>
                  : slugConflicts.length > 0 ? <small className="field-hint error">Already used by another product.</small>
                  : <small className="field-hint">Preview → /product/{slugPreview || "(your-slug-here)"}</small>}
              </div>
            </div>

            <div className="form-group full" style={{ marginTop: "0.6rem" }}>
              <label htmlFor="desc">Description</label>
              <textarea id="desc" className="field ae-textarea" rows={5} value={draft.description} onChange={(e) => patch("description", e.target.value)} placeholder="Describe the product — what it is, who it's for, what makes it essential." />
            </div>
          </fieldset>

          {/* PRICING */}
          <fieldset className="admin-fieldset card">
            <legend className="admin-legend">Pricing & promo</legend>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="price">Price (USD)</label>
                <input id="price" type="number" step="0.01" min="0" className="field" value={draft.price} onChange={(e) => patch("price", Number(e.target.value))} />
              </div>
              <div className="form-group">
                <label htmlFor="old">Old price (strikethrough)</label>
                <input id="old" type="number" step="0.01" min="0" className="field" value={draft.oldPrice ?? ""} onChange={(e) => patch("oldPrice", e.target.value === "" ? undefined : Number(e.target.value))} />
              </div>
              <div className="form-group">
                <label htmlFor="disc">Discount % (applied at cart)</label>
                <input id="disc" type="number" min="0" max="90" className="field" value={draft.discount ?? ""} onChange={(e) => patch("discount", e.target.value === "" ? undefined : Number(e.target.value))} />
              </div>
              <div className="form-group">
                <label htmlFor="promo">Promo name</label>
                <input id="promo" className="field" value={draft.promotion ?? ""} onChange={(e) => patch("promotion", e.target.value)} placeholder="WAVE03 — optional" />
              </div>
            </div>
            {draft.discount && draft.price > 0 && (
              <p className="ae-pricing-hint muted">
                Final discounted price: <strong style={{ color: "var(--accent-ice)" }}>
                  {formatPrice(draft.price * (1 - draft.discount / 100))}
                </strong>
                <span className="muted"> (after {draft.discount}% off)</span>
              </p>
            )}
          </fieldset>

          {/* STOCK & META */}
          <fieldset className="admin-fieldset card">
            <legend className="admin-legend">Inventory & rating</legend>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="stock">{draft.type === "digital" ? "Stock (kept as ∞ for digital)" : "Stock"}</label>
                <input
                  id="stock"
                  type="number"
                  min="0"
                  className="field"
                  value={draft.stock}
                  disabled={draft.type === "digital"}
                  onChange={(e) => patch("stock", Number(e.target.value))}
                />
                {draft.type === "digital" && <small className="field-hint">Digital products always show as in stock.</small>}
              </div>
              <div className="form-group">
                <label htmlFor="rating">Rating (0–5) — for storefront display</label>
                <input id="rating" type="number" min="0" max="5" step="0.1" className="field" value={draft.rating} onChange={(e) => patch("rating", Number(e.target.value))} />
              </div>
              <div className="form-group">
                <label htmlFor="reviews">Reviews (count) — for storefront display</label>
                <input id="reviews" type="number" min="0" className="field" value={draft.reviews} onChange={(e) => patch("reviews", Number(e.target.value))} />
              </div>
              <div className="form-group">
                <label>Badges</label>
                <div className="ae-toggles">
                  <label className="ae-toggle">
                    <input type="checkbox" checked={!!draft.featured} onChange={(e) => patch("featured", e.target.checked)} />
                    <span>Featured</span>
                  </label>
                  <label className="ae-toggle">
                    <input type="checkbox" checked={!!draft.bestseller} onChange={(e) => patch("bestseller", e.target.checked)} />
                    <span>Bestseller</span>
                  </label>
                </div>
              </div>
            </div>
          </fieldset>

          {/* FEATURES */}
          <fieldset className="admin-fieldset card">
            <legend className="admin-legend">Highlights / features</legend>
            <div className="ae-list">
              {draft.features.map((f, i) => (
                <div className="ae-list-row" key={i}>
                  <span className="ae-list-pip">★</span>
                  <input className="field" value={f} onChange={(e) => setFeature(i, e.target.value)} placeholder="e.g. Lifetime updates, instant download, 24-bit lossless" />
                  <button type="button" className="ae-list-trash" onClick={() => removeFeature(i)} aria-label="Remove"><TrashIcon size={14} /></button>
                </div>
              ))}
            </div>
            <button type="button" className="btn btn-soft btn-sm" onClick={addFeature}><PlusIcon size={14} /> Add highlight</button>
          </fieldset>

          {/* COLORS */}
          <fieldset className="admin-fieldset card">
            <legend className="admin-legend">Color options</legend>
            <p className="ae-helper muted">Shown as the product's color picker. Leave empty to default to a single badge color.</p>
            <div className="ae-list">
              {draft.colors.map((c, i) => (
                <div className="ae-color-row" key={i}>
                  <input type="color" className="ae-color-swatch" value={c.hex} onChange={(e) => setColor(i, "hex", e.target.value)} aria-label="Color hex" />
                  <input className="field" value={c.name} onChange={(e) => setColor(i, "name", e.target.value)} placeholder="Color name" />
                  <input className="field ae-hex-input" value={c.hex} onChange={(e) => setColor(i, "hex", e.target.value)} placeholder="#021024" />
                  <button type="button" className="ae-list-trash" onClick={() => removeColor(i)} aria-label="Remove color"><TrashIcon size={14} /></button>
                </div>
              ))}
            </div>
            <button type="button" className="btn btn-soft btn-sm" onClick={addColor}><PlusIcon size={14} /> Add color</button>
          </fieldset>
        </div>

        {/* SIDEBAR: PREVIEW + BANNER + ACTIONS */}
        <aside className="admin-editor-aside">
          <div className="ae-sticky">
            <div className="admin-fieldset card">
              <legend className="admin-legend">Storefront preview</legend>
              <div className="ae-preview-art" style={{
                background: draft.imageBanner ? `url(${draft.imageBanner}) center/cover` : livePreviewGradient,
              }}>
                {!draft.imageBanner && <span className="ae-preview-glyph">{draft.name.charAt(0) || "A"}</span>}
                <div className="ae-preview-badges">
                  {draft.featured && <span className="badge badge-ice">featured</span>}
                  {draft.bestseller && <span className="badge">bestseller</span>}
                  {draft.discount ? <span className="badge">-{draft.discount}%</span> : null}
                </div>
              </div>
              <div className="ae-preview-body">
                <div className="ae-preview-meta">
                  <span style={{ textTransform: "capitalize" }}>{draft.category}</span>
                  <span>{draft.type === "digital" ? "Digital" : "Physical"}</span>
                </div>
                <strong className="ae-preview-name">{draft.name || "Your product name"}</strong>
                <span className="muted ae-preview-tagline">{draft.tagline || "Tagline appears here"}</span>
                <div className="ae-preview-price">
                  <span className="ae-preview-price-now">{formatPrice(draft.price || 0)}</span>
                  {draft.oldPrice ? <span className="ae-preview-price-old">{formatPrice(draft.oldPrice)}</span> : null}
                </div>
                <div className="ae-preview-colors">
                  {draft.colors.slice(0, 5).map((c, i) => (
                    <span key={i} className="ae-preview-color" style={{ background: c.hex }} title={c.name} />
                  ))}
                </div>
                <button type="button" className="btn btn-primary btn-block btn-sm" disabled>Add to cart</button>
              </div>
            </div>

            <div className="admin-fieldset card">
              <legend className="admin-legend">Banner image</legend>
              {draft.imageBanner && (
                <div className="ae-banner-thumb" style={{ backgroundImage: `url(${draft.imageBanner})` }}>
                  <button type="button" className="ae-banner-remove" onClick={() => patch("imageBanner", "")} aria-label="Remove banner"><TrashIcon size={14} /></button>
                </div>
              )}
              <label className="ae-upload">
                <input type="file" accept="image/*" onChange={onBannerUpload} hidden />
                <span><PlusIcon size={16} /> {draft.imageBanner ? "Replace banner" : "Upload image (.png, .jpg ≤ 4MB)"}</span>
              </label>
              {uploadError && <small className="field-hint error">{uploadError}</small>}
              <small className="field-hint">Optional — keep blank for gradient + glyph art.</small>

              <div className="form-group" style={{ marginTop: "0.7rem" }}>
                <label htmlFor="remote">…or paste remote image URL</label>
                <input id="remote" className="field" value={draft.imageBanner?.startsWith("data:") ? "" : draft.imageBanner ?? ""} onChange={(e) => patch("imageBanner", e.target.value)} placeholder="https://…" />
              </div>
            </div>

            <div className="admin-save-bar">
              {errorMsg && <div className="al-error" style={{ marginBottom: 8 }}>{errorMsg}</div>}
              {editing && existing && (
                <Link to={`/product/${existing.slug}`} target="_blank" className="btn btn-ghost btn-sm ae-view-store">
                  <CopyIcon size={14} /> View on storefront
                </Link>
              )}
              <button type="button" className="btn btn-ghost btn-sm" onClick={copyStoreLink}>
                <CopyIcon size={14} /> Copy storefront URL
              </button>
              <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={saving}>
                {saving
                  ? (editing ? "Saving…" : "Creating…")
                  : (<><CheckIcon size={16} /> {editing ? "Save changes" : "Create product"}</>)}
              </button>
              <Link to="/admin/products" className="ae-cancel">← Cancel & back to products</Link>
            </div>
          </div>
        </aside>
      </form>
    </AdminLayout>
  );
}

function structuredCloneSafe<T>(value: T): T {
  if (typeof structuredClone === "function") return structuredClone(value);
  return JSON.parse(JSON.stringify(value)) as T;
}
