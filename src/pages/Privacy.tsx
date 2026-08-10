import Breadcrumbs from "../components/Breadcrumbs";

export default function Privacy() {
  return (
    <div className="container" style={{ paddingBlock: "2rem 4rem" }}>
      <Breadcrumbs items={[{ label: "Home", to: "/" }, { label: "Privacy Policy" }]} />

      <article className="fade-up" style={{ maxWidth: "800px", margin: "2rem auto 0" }}>
        <p className="eyebrow" style={{ marginBottom: "0.5rem" }}>Legal</p>
        <h1 className="section-title" style={{ marginBottom: "1.5rem" }}>Privacy Policy</h1>
        <p className="muted" style={{ marginBottom: "2rem", fontSize: "0.9rem" }}>Last Updated: August 10, 2026</p>

        <div className="pd-desc legal-content" style={{ display: "flex", flexDirection: "column", gap: "1.8rem" }}>
          <p>
            At Avenu (&ldquo;we,&rdquo; &ldquo;our,&rdquo; or &ldquo;us&rdquo;), your privacy matters. This Privacy Policy explains what information we collect through avenu.sale, how we use it, and the choices you have. By using our website, you consent to the practices described here.
          </p>

          <section>
            <h2 style={{ fontSize: "1.25rem", color: "var(--accent-ice)", marginBottom: "0.6rem" }}>1. Information We Collect</h2>
            <p>
              We collect information you provide directly&mdash;such as your name, email, shipping address, and payment details when you place an order or subscribe to our dispatch.
            </p>
            <p style={{ marginTop: "0.6rem" }}>
              We also receive limited technical data automatically, including your IP address, browser type, device information, and pages visited, collected through cookies and similar technologies.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: "1.25rem", color: "var(--accent-ice)", marginBottom: "0.6rem" }}>2. How We Use Your Information</h2>
            <p>
              We use your information to process orders, communicate about your purchases, provide customer support, prevent fraud, and improve our website and services.
            </p>
            <p style={{ marginTop: "0.6rem" }}>
              With your consent, we may also send you marketing emails. You can unsubscribe at any time using the link in those emails.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: "1.25rem", color: "var(--accent-ice)", marginBottom: "0.6rem" }}>3. Sharing of Information</h2>
            <p>
              We do not sell your personal information. We share data only with trusted service providers who help us run our business&mdash;such as payment processors, shipping carriers, and analytics platforms&mdash;and only to the extent necessary to perform those services.
            </p>
            <p style={{ marginTop: "0.6rem" }}>
              We may also disclose information when required by law or to protect our rights, safety, or property.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: "1.25rem", color: "var(--accent-ice)", marginBottom: "0.6rem" }}>4. Cookies</h2>
            <p>
              We use cookies to keep you signed in, remember preferences, and understand how you use our site. You can control cookies through your browser settings, though disabling them may affect site functionality.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: "1.25rem", color: "var(--accent-ice)", marginBottom: "0.6rem" }}>5. Data Security</h2>
            <p>
              We take reasonable measures to protect your information using encryption, access controls, and secure infrastructure. However, no method of transmission over the internet is completely secure, and we cannot guarantee absolute protection.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: "1.25rem", color: "var(--accent-ice)", marginBottom: "0.6rem" }}>6. Your Rights</h2>
            <p>
              Depending on where you live, you may have the right to access, correct, or delete your personal information, or to object to certain processing. To exercise these rights, contact us at the email below.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: "1.25rem", color: "var(--accent-ice)", marginBottom: "0.6rem" }}>7. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. Changes take effect immediately upon posting. We encourage you to review this page periodically.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: "1.25rem", color: "var(--accent-ice)", marginBottom: "0.6rem" }}>8. Contact</h2>
            <p>
              Questions about this policy? Reach us anytime at <a href="mailto:contact@avenu.sale" style={{ color: "var(--accent-ice)" }}>contact@avenu.sale</a>.
            </p>
          </section>
        </div>
      </article>
    </div>
  );
}
