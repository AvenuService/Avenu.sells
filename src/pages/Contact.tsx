import { useState, type FormEvent } from "react";
import Breadcrumbs from "../components/Breadcrumbs";
import {
  ArrowRight,
  CheckIcon,
  ChatIcon,
  MailIcon,
  GlobeIcon,
  ShieldIcon,
} from "../components/Icons";

type Status = "idle" | "sending" | "sent" | "error";

const projectTypes = [
  "Just saying hi",
  "Question about an order",
  "Website project — Starter",
  "Website project — Business",
  "Website project — Premium",
  "Something else",
];

export default function Contact() {
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [form, setForm] = useState({
    name: "",
    email: "",
    projectType: projectTypes[0],
    message: "",
  });

  const endpoint = import.meta.env.VITE_CONTACT_ENDPOINT ?? "/api/contact";

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("sending");
    setErrorMsg("");

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        const msg =
          data?.error ??
          (res.status === 503
            ? "Email delivery isn't configured yet — we'll hook up Resend shortly. Until then, email us directly at contact@avenu.sale."
            : "Something went wrong sending your message. Please try again.");
        setStatus("error");
        setErrorMsg(msg);
        return;
      }
      setStatus("sent");
      setForm({ name: "", email: "", projectType: projectTypes[0], message: "" });
    } catch {
      setStatus("error");
      setErrorMsg("Network error — please check your connection and try again.");
    }
  }

  return (
    <div className="container" style={{ paddingBlock: "2rem 4rem" }}>
      <Breadcrumbs items={[{ label: "Home", to: "/" }, { label: "Contact" }]} />

      <div className="fade-up" style={{ maxWidth: "640px", margin: "2rem auto 0", textAlign: "center" }}>
        <p className="eyebrow" style={{ marginBottom: "0.5rem" }}>Support</p>
        <h1 className="section-title" style={{ marginBottom: "0.75rem" }}>Get in touch</h1>
        <p className="section-sub">
          Questions about an order, a website package, or just want to say hi?
          Drop a message — we usually reply within one business day.
        </p>
      </div>

      <div className="contact-grid fade-up" style={{ marginTop: "2.5rem" }}>
        {/* FORM */}
        <form className="card contact-form" onSubmit={handleSubmit}>
          {status === "sent" && (
            <div className="contact-alert contact-alert-success" role="status">
              <span className="added-check" style={{ width: 26, height: 26, flexShrink: 0 }}>
                <CheckIcon size={14} />
              </span>
              <div>
                <strong>Message sent.</strong>
                <div className="muted" style={{ fontSize: "0.85rem", marginTop: 2 }}>
                  Thanks for reaching out — we'll be in touch shortly.
                </div>
              </div>
              <button
                type="button"
                className="cart-close"
                aria-label="Dismiss"
                onClick={() => setStatus("idle")}
                style={{ marginLeft: "auto", background: "transparent", border: "none", color: "var(--text-secondary)", cursor: "pointer" }}
              >
                ×
              </button>
            </div>
          )}

          {status === "error" && (
            <div className="contact-alert contact-alert-error" role="alert">
              <span style={{ fontSize: "1.2rem" }}>!</span>
              <div style={{ flex: 1 }}>
                <strong>Couldn't send your message.</strong>
                <div className="muted" style={{ fontSize: "0.85rem", marginTop: 2 }}>{errorMsg}</div>
              </div>
              <button
                type="button"
                className="cart-close"
                aria-label="Dismiss"
                onClick={() => setStatus("idle")}
                style={{ background: "transparent", border: "none", color: "var(--text-secondary)", cursor: "pointer" }}
              >
                ×
              </button>
            </div>
          )}

          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="name">Name <span className="muted" style={{ fontWeight: 400 }}>(optional)</span></label>
              <input
                id="name"
                className="field"
                type="text"
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
                placeholder="Avery Frost"
                autoComplete="name"
              />
            </div>
            <div className="form-group">
              <label htmlFor="email">Email <span style={{ color: "var(--accent-ice)" }}>*</span></label>
              <input
                id="email"
                className="field"
                type="email"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                placeholder="you@avenu.sale"
                required
                autoComplete="email"
              />
            </div>
            <div className="form-group full">
              <label htmlFor="projectType">What's this about?</label>
              <select
                id="projectType"
                className="field"
                value={form.projectType}
                onChange={(e) => update("projectType", e.target.value)}
              >
                {projectTypes.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div className="form-group full">
              <label htmlFor="message">Message <span style={{ color: "var(--accent-ice)" }}>*</span></label>
              <textarea
                id="message"
                className="field"
                rows={5}
                value={form.message}
                onChange={(e) => update("message", e.target.value)}
                placeholder="Tell us what you need, a timeline, any links that help us help you…"
                required
                minLength={5}
                maxLength={5000}
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg btn-block"
            disabled={status === "sending"}
            style={{ marginTop: "1rem" }}
          >
            {status === "sending" ? (
              "Sending…"
            ) : (
              <>
                Send message <ArrowRight size={16} />
              </>
            )}
          </button>
          <p className="muted center" style={{ fontSize: "0.78rem", marginTop: "0.7rem" }}>
            <ShieldIcon size={12} /> Encrypted in transit · We never share your email
          </p>
        </form>

        {/* SIDE PANEL — Avenu contact info */}
        <aside className="contact-info">
          <div className="card contact-info-card">
            <div className="ci-item">
              <span className="ci-ic"><ChatIcon size={18} /></span>
              <div>
                <strong>General / support</strong>
                <p className="muted">Questions about orders, packages, or anything else.</p>
                <a href="mailto:contact@avenu.sale" className="ci-link">contact@avenu.sale</a>
              </div>
            </div>
            <div className="ci-item">
              <span className="ci-ic"><MailIcon size={18} /></span>
              <div>
                <strong>Website projects</strong>
                <p className="muted">Briefs, quotes, and partnership enquiries.</p>
                <a href="mailto:studio@avenu.sale" className="ci-link">studio@avenu.sale</a>
              </div>
            </div>
            <div className="ci-item">
              <span className="ci-ic"><GlobeIcon size={18} /></span>
              <div>
                <strong>Studio hours</strong>
                <p className="muted">Mon – Fri · 9am – 6pm (UTC)</p>
                <p className="muted" style={{ fontSize: "0.85rem" }}>Replies within 1 business day.</p>
              </div>
            </div>
          </div>

          <div className="card contact-info-card" style={{ marginTop: "1rem" }}>
            <strong style={{ display: "block", marginBottom: "0.5rem" }}>Prefer to chat live?</strong>
            <p className="muted" style={{ fontSize: "0.9rem" }}>
              Live chat is coming soon. Until then, send a message above —
              we treat every inbox reply like a real conversation.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
