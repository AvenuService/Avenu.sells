import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { CatalogProvider } from "./store/CatalogContext";
import { CartProvider } from "./store/CartContext";
import { OrdersProvider } from "./store/OrdersContext";
import { AdminAuthProvider } from "./store/AdminAuthContext";
import { ShopperAuthProvider } from "./store/ShopperAuthContext";
import ErrorBoundary from "./components/ErrorBoundary";
import "./styles/global.css";
import "./styles/layout.css";
import "./styles/pages.css";
import "./styles/admin.css";

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
