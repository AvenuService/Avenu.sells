/* ============================================================
   HeroBackground — lightweight animated aurora backdrop.

   Replaces the old full-viewport WebGL crystal (Scene3D) which
   dragged in the ~600KB three.js runtime and could fail (white
   screen) when WebGL init errored. This is pure CSS: it can
   never crash the page and loads instantly.

   Note: prefers-reduced-motion is already handled globally in
   global.css (all animations are disabled), so these drift
   animations are automatically frozen for those users.
   ============================================================ */
export default function HeroBackground() {
  return (
    <div className="hero-bg" aria-hidden="true">
      <div className="hero-bg-base" />
      <div className="hero-bg-orb orb-1" />
      <div className="hero-bg-orb orb-2" />
      <div className="hero-bg-orb orb-3" />
      <div className="hero-bg-glow" />
      <div className="hero-bg-grain" />
    </div>
  );
}