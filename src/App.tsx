import { BrowserRouter, Route, Routes, Navigate, Outlet } from "react-router-dom";
import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import CartDrawer from "./components/CartDrawer";
import AddedToast from "./components/AddedToast";
import AdminGuard from "./components/AdminGuard";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

import Home from "./pages/Home";
import Shop from "./pages/Shop";
import ProductDetails from "./pages/ProductDetails";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import OrderConfirmation from "./pages/OrderConfirmation";
import NotFound from "./pages/NotFound";

import AdminLogin from "./pages/admin/AdminLogin";

function ScrollToTopOnNav() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior }); }, [pathname]);
  return null;
}

function StorefrontChrome() {
  return (
    <>
      <Navbar />
      <main style={{ flex: 1 }}>
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
      <Routes>
        {/* Admin */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminGuard view="dashboard" />} />
        <Route path="/admin/products" element={<AdminGuard view="products" />} />
        <Route path="/admin/products/new" element={<AdminGuard view="new" />} />
        <Route path="/admin/products/:id" element={<AdminGuard view="edit" />} />

        {/* Storefront layout: hides on /admin/* */}
        <Route element={<StorefrontChrome />}>
          <Route path="/" element={<Home />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/product/:slug" element={<ProductDetails />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/order/:id" element={<OrderConfirmation />} />
          <Route path="*" element={<NotFound />} />
        </Route>

        <CartDrawer />
        <AddedToast />
      </Routes>
    </BrowserRouter>
  );
}

void Navigate;
