import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { CatalogProvider } from "./store/CatalogContext";
import { CartProvider } from "./store/CartContext";
import { OrdersProvider } from "./store/OrdersContext";
import { AdminAuthProvider } from "./store/AdminAuthContext";
import { ShopperAuthProvider, consumeOAuthHash } from "./store/ShopperAuthContext";
import { WishlistProvider } from "./store/WishlistContext";
import ErrorBoundary from "./components/ErrorBoundary";
import "./styles/global.css";
import "./styles/layout.css";
import "./styles/pages.css";
import "./styles/admin.css";
import "./styles/extras.css";

// CRITICAL: parse + strip the OAuth hash fragment BEFORE React mounts so
// BrowserRouter never sees `#access_token=eyJ...` (which was causing the
// page to hang infinitely). The stripped tokens are popped into a closure
// we attach to window so ShopperAuthProvider's effect can read them.
const oauthTokens = consumeOAuthHash();
if (oauthTokens) {
  (window as unknown as { __avenu_oauth_tokens?: typeof oauthTokens }).__avenu_oauth_tokens = oauthTokens;
}

// Safety net: ensure root exists and give visual feedback if app fails to mount
const root = document.getElementById("root");
if (!root) {
  document.body.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:center;min-height:100vh;background:#021024;color:#e7f1fb;font-family:Sora,sans-serif;padding:2rem;text-align:center;">
      <div style="max-width:600px;">
        <h1>Avenu Loading…</h1>
        <p>Initializing storefront components</p>
        <div style="margin-top:2rem;padding:1rem;background:rgba(56,189,248,0.1);border:1px solid rgba(56,189,248,0.3);border-radius:8px;font-family:monospace;font-size:0.85rem;text-align:left;">
          <div>✓ HTML loaded</div>
          <div>✓ JavaScript modules ready</div>
          <div>→ Mounting React app…</div>
        </div>
      </div>
    </div>
  `;
  throw new Error("Root element #root not found");
}

try {
  createRoot(root).render(
    <StrictMode>
      <ErrorBoundary>
        <CatalogProvider>
          <OrdersProvider>
            <CartProvider>
              <AdminAuthProvider>
                <ShopperAuthProvider>
                  <WishlistProvider>
                  <App />
                </WishlistProvider>
                </ShopperAuthProvider>
              </AdminAuthProvider>
            </CartProvider>
          </OrdersProvider>
        </CatalogProvider>
      </ErrorBoundary>
    </StrictMode>,
  );
} catch (error) {
  console.error("[Avenu] Failed to mount app:", error);
  document.body.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:center;min-height:100vh;background:#5d0a0a;color:#f0f0f0;font-family:Sora,sans-serif;padding:2rem;text-align:center;">
      <div style="max-width:600px;">
        <h1 style="color:#faa;">Error Loading Avenu</h1>
        <p>Please refresh the page or try again later.</p>
        <div style="margin-top:2rem;padding:1rem;background:rgba(255,0,0,0.1);border:1px solid rgba(255,0,0,0.3);border-radius:8px;font-family:monospace;font-size:0.85rem;text-align:left;">
          <div style="word-break:break-all;color:#faa;">${error instanceof Error ? error.message : String(error)}</div>
        </div>
        <button onclick="location.reload()" style="margin-top:1rem;padding:0.75rem 1.5rem;background:#C1E8FF;color:#021024;border:none;border-radius:6px;cursor:pointer;font-weight:600;font-size:1rem;">
          Try Again
        </button>
      </div>
    </div>
  `;
}
