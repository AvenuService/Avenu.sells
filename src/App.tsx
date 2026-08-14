import { BrowserRouter, Route, Routes, Outlet } from "react-router-dom";
import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import CartDrawer from "./components/CartDrawer";
import AccountDrawer from "./components/AccountDrawer";
import AddedToast from "./components/AddedToast";
import CookieConsent from "./components/CookieConsent";
import AdminGuard from "./components/AdminGuard";
import { AppDiagnostic } from "./components/AppDiagnostic";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import BackToTop from "./components/BackToTop";

import Home from "./pages/Home";
import Shop from "./pages/Shop";
import ProductDetails from "./pages/ProductDetails";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import OrderConfirmation from "./pages/OrderConfirmation";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import NotFound from "./pages/NotFound";

import AdminLogin from "./pages/admin/AdminLogin";

function ScrollToTopOnNav() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, [pathname]);
  return null;
}

/**
 * Strip a Supabase OAuth response fragment (`#access_token=...` etc.) from
 * the address bar once the session has been processed by ShopperAuthProvider.
 *
 * Why: Supabase v2's auth client auto-parses the hash on `_initialize`, but
 * there's a race if React mounts/upduras before that resolves. By the time
 * we hit this effect (mounted after providers), the auth client should have
 * consumed the tokens — we just need to clean the URL.
 *
 * We also re-check after a brief delay so an async resolution of the OAuth
 * fragment is still cleaned if it somehow lands *after* first paint.
 */
function OAuthHashCleanup() {
  useEffect(() => {
    let rafId = 0;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    function stripIfOAuthFragment() {
      if (typeof window === "undefined") return;
      const hash = window.location.hash || "";
      const isOAuth =
        hash.includes("access_token=") ||
        hash.includes("refresh_token=") ||
        hash.includes("expires_in=") ||
        hash.includes("token_type=") ||
        hash.includes("provider_token=") ||
        hash.includes("error_description=") ||
        hash.includes("error=");
      if (!isOAuth) return;
      try {
        const cleanURL =
          window.location.origin +
          window.location.pathname +
          window.location.search;
        window.history.replaceState(null, "", cleanURL);
      } catch {
        /* ignore — replaceState is universally supported; this is defensive */
      }
    }

    // Initial sweep on mount.
    stripIfOAuthFragment();

    // Re-sweep a couple ticks later in case the hash was added during the
    // first paint cycle (rare, but covers the race condition).
    rafId = window.requestAnimationFrame(stripIfOAuthFragment);
    timeoutId = setTimeout(stripIfOAuthFragment, 600);

    return () => {
      window.cancelAnimationFrame(rafId);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  return null;
}

function StorefrontChrome() {
  return (
    <>
      <a href="#main" className="skip-link">Skip to content</a>
      <Navbar />
      <main id="main" style={{ flex: 1 }}>
        <Outlet />
      </main>
      <Footer />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTopOnNav />
      <OAuthHashCleanup />
      <AppDiagnostic />
      <Routes>
        {/* Admin */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminGuard view="dashboard" />} />
        <Route path="/admin/products" element={<AdminGuard view="products" />} />
        <Route path="/admin/products/new" element={<AdminGuard view="new" />} />
        <Route path="/admin/products/:id" element={<AdminGuard view="edit" />} />
        <Route path="/admin/orders" element={<AdminGuard view="orders" />} />

        {/* Storefront layout: hides on /admin/* */}
        <Route element={<StorefrontChrome />}>
          <Route path="/" element={<Home />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/product/:slug" element={<ProductDetails />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/order/:id" element={<OrderConfirmation />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>

      {/* These render globally (cart drawer + toast can appear on admin too) */}
      <CartDrawer />
      <AccountDrawer />
      <AddedToast />
      <CookieConsent />
      <BackToTop />
    </BrowserRouter>
  );
}
