import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { CatalogProvider } from "./store/CatalogContext";
import { CartProvider } from "./store/CartContext";
import { AdminAuthProvider } from "./store/AdminAuthContext";
import "./styles/global.css";
import "./styles/layout.css";
import "./styles/pages.css";
import "./styles/admin.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <CatalogProvider>
      <CartProvider>
        <AdminAuthProvider>
          <App />
        </AdminAuthProvider>
      </CartProvider>
    </CatalogProvider>
  </StrictMode>,
);
