import Breadcrumbs from "../components/Breadcrumbs";

export default function Terms() {
  return (
    <div className="container" style={{ paddingBlock: "2rem 4rem" }}>
      <Breadcrumbs items={[{ label: "Home", to: "/" }, { label: "Terms of Service" }]} />

      <article className="fade-up" style={{ maxWidth: "800px", margin: "2rem auto 0" }}>
        <p className="eyebrow" style={{ marginBottom: "0.5rem" }}>Legal</p>
        <h1 className="section-title" style={{ marginBottom: "1.5rem" }}>Terms of Service</h1>
        <p className="muted" style={{ marginBottom: "2rem", fontSize: "0.9rem" }}>Last Updated: August 10, 2026</p>

        <div className="pd-desc legal-content" style={{ display: "flex", flexDirection: "column", gap: "1.8rem" }}>
          <p>
            Welcome to Avenu (&ldquo;we,&rdquo; &ldquo;our,&rdquo; or &ldquo;us&rdquo;). By accessing or using our website (avenu.sale) and services, you agree to be bound by these Terms of Service. If you do not agree to all of these terms, do not use our site.
          </p>

          <section>
            <h2 style={{ fontSize: "1.25rem", color: "var(--accent-ice)", marginBottom: "0.6rem" }}>1. Use of the Website</h2>
            <p>
              You must be at least 13 years old (or the legal age of majority in your jurisdiction) to use this website.
            </p>
            <p style={{ marginTop: "0.6rem" }}>
              You agree not to use our site for any unlawful purpose, to violate any laws, or to attempt to breach our website's security, databases, or infrastructure.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: "1.25rem", color: "var(--accent-ice)", marginBottom: "0.6rem" }}>2. Purchases and Payments</h2>
            <p>
              All descriptions, images, and prices of products or services are subject to change at any time without notice.
            </p>
            <p style={{ marginTop: "0.6rem" }}>
              We reserve the right to refuse or cancel any order for any reason, including limitations on quantities available, inaccuracies in product or pricing information, or suspected fraud.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: "1.25rem", color: "var(--accent-ice)", marginBottom: "0.6rem" }}>3. Intellectual Property</h2>
            <p>
              All content on this website&mdash;including text, graphics, logos, code, and design&mdash;is the property of Avenu and is protected by copyright and intellectual property laws. You may not copy, reproduce, or distribute any material without our express written permission.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: "1.25rem", color: "var(--accent-ice)", marginBottom: "0.6rem" }}>4. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by law, Avenu and its team shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly, resulting from your use of our website, products, or services.
            </p>
            <p style={{ marginTop: "0.6rem" }}>
              Our website and services are provided on an &ldquo;as is&rdquo; and &ldquo;as available&rdquo; basis without warranties of any kind, either express or implied.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: "1.25rem", color: "var(--accent-ice)", marginBottom: "0.6rem" }}>5. Indemnification</h2>
            <p>
              You agree to indemnify, defend, and hold harmless Avenu, its founders, and its team from and against any claims, liabilities, damages, losses, and expenses arising out of or in any way connected with your violation of these Terms.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: "1.25rem", color: "var(--accent-ice)", marginBottom: "0.6rem" }}>6. Changes to Terms</h2>
            <p>
              We reserve the right to modify these terms at any time. Changes will be effective immediately upon posting to the website. Your continued use of the site means you accept those changes.
            </p>
          </section>
        </div>
      </article>
    </div>
  );
}
