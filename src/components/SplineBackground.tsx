import { lazy, Suspense } from "react";
import HeroBackground from "./HeroBackground";

/* ============================================================
   SplineBackground — subtle 3D hero backdrop via @splinetool/react-spline.

   To enable: paste your Spline scene URL below, or set
   VITE_SPLINE_SCENE_URL in .env.local. When no scene is configured
   (or none can load) we gracefully fall back to the lightweight CSS
   aurora so the page always looks complete.

   Performance — deliberately lazy:
   Spline's runtime is heavy (physics, splatting, ...). It is imported
   with React.lazy so it ships as its own on-demand chunks and NEVER
   loads when no scene URL is configured. The main bundle stays light.

   Design rule — subtle, never overwhelming:
   - fixed full-viewport layer behind the content (z-index 0)
   - pointer-events: none (won't steal scroll or clicks)
   - edge-masked so text stays readable
   ============================================================ */

const SplineScene = lazy(() => import("@splinetool/react-spline"));

const SPLINE_SCENE_URL =
  (import.meta.env.VITE_SPLINE_SCENE_URL as string | undefined)?.trim() || "";

export default function SplineBackground() {
  if (!SPLINE_SCENE_URL) {
    // No scene configured yet — keep the safe aurora backdrop.
    return <HeroBackground />;
  }

  return (
    <div className="spline-bg" aria-hidden="true">
      <Suspense fallback={<HeroBackground />}>
        <SplineScene scene={SPLINE_SCENE_URL} />
      </Suspense>
    </div>
  );
}