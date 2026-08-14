import {
  Component,
  lazy,
  Suspense,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import HeroBackground from "./HeroBackground";

/* ============================================================
   SplineBackground — 3D hero backdrop via @splinetool/react-spline.

   Config: set VITE_SPLINE_SCENE_URL (the .splinecode file URL,
   e.g. https://my.spline.design/<name>-<id>/scene.splinecode).

   SAFETY — this decoration can never crash the site:
   - Wrapped in a local ErrorBoundary → on render/load errors it
     swaps to the CSS aurora instead of bubbling up.
   - If the scene hasn't finished loading within 12s, we fall back
     to the aurora too (prevents a hung/blank page).
   - Lazy-loaded so it never slows the critical bundle.
   ============================================================ */

const SplineScene = lazy(() => import("@splinetool/react-spline"));

const SPLINE_SCENE_URL =
  (import.meta.env.VITE_SPLINE_SCENE_URL as string | undefined)?.trim() || "";

const LOAD_TIMEOUT_MS = 12000;

class SplineErrorBoundary extends Component<
  { fallback: ReactNode; children: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    // Never let a decorative background take down the storefront.
    console.warn("[SplineBackground] scene failed, using aurora fallback:", error);
  }

  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}

export default function SplineBackground() {
  const [timedOut, setTimedOut] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!SPLINE_SCENE_URL) return;
    timerRef.current = setTimeout(() => setTimedOut(true), LOAD_TIMEOUT_MS);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleLoad = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  };

  if (!SPLINE_SCENE_URL || timedOut) {
    // Not configured, or scene too slow/broken → safe CSS backdrop.
    return <HeroBackground />;
  }

  return (
    <div className="spline-bg" aria-hidden="true">
      <SplineErrorBoundary fallback={<HeroBackground />}>
        <Suspense fallback={<HeroBackground />}>
          <SplineScene scene={SPLINE_SCENE_URL} onLoad={handleLoad} />
        </Suspense>
      </SplineErrorBoundary>
    </div>
  );
}