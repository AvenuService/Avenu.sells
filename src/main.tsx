import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { CatalogProvider } from "./store/CatalogContext";
import { CartProvider } from "./store/CartContext";
import { OrdersProvider } from "./store/OrdersContext";
import { AdminAuthProvider } from "./store/AdminAuthContext";
import { ShopperAuthProvider, consumeOAuthHash } from "./store/ShopperAuthContext";
import ErrorBoundary from "./components/ErrorBoundary";
import "./styles/global.css";
import "./styles/layout.css";
import "./styles/pages.css";
import "./styles/admin.css";

// CRITICAL: parse + strip the OAuth hash fragment BEFORE React mounts so
// BrowserRouter never sees `#access_token=eyJ...` (which was causing the
// page to hang infinitely). The stripped tokens are popped into a closure
// we attach to window so ShopperAuthProvider's effect can read them.
const oauthTokens = consumeOAuthHash();
if (oauthTokens) {
  (window as unknown as { __avenu_oauth_tokens?: typeof oauthTokens }).__avenu_oauth_tokens = oauthTokens;
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <CatalogProvider>
        <OrdersProvider>
          <CartProvider>
            <AdminAuthProvider>
              <ShopperAuthProvider>
                <App />
              </ShopperAuthProvider>
            </AdminAuthProvider>
          </CartProvider>
        </OrdersProvider>
      </CatalogProvider>
    </ErrorBoundary>
  </StrictMode>,
);
