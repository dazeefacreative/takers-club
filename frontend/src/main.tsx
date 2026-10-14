import { StrictMode, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router";
import { AuthProvider, useAuth } from "@/app/context/AuthContext";
import { CartProvider } from "@/app/context/CartContext";
import { ErrorBoundary } from "@/app/components/ErrorBoundary";

import HomePage        from "@/app/pages/HomePage";
import ShopPage        from "@/app/pages/ShopPage";
import ProductPage     from "@/app/pages/ProductPage";
import CartPage        from "@/app/pages/CartPage";
import CheckoutPage    from "@/app/pages/CheckoutPage";
import PaymentSuccess  from "@/app/pages/PaymentSuccess";
import PaymentFailed   from "@/app/pages/PaymentFailed";
import AboutPage       from "@/app/pages/AboutPage";
import ContactPage     from "@/app/pages/ContactPage";
import AdminLoginPage  from "@/app/pages/LoginPage";
import NotFoundPage    from "@/app/pages/NotFoundPage";
import ShippingPage      from "@/app/pages/ShippingPage";
import ReturnsPage       from "@/app/pages/ReturnsPage";
import PrivacyPolicyPage from "@/app/pages/PrivacyPolicyPage";
import TermsPage         from "@/app/pages/TermsPage";

import AdminLayout     from "@/app/pages/admin/AdminLayout";
import DashboardPage   from "@/app/pages/admin/DashboardPage";
import AdminProducts   from "@/app/pages/admin/ProductsPage";
import ProductFormPage from "@/app/pages/admin/ProductFormPage";
import AdminOrders     from "@/app/pages/admin/OrdersPage";
import AdminCustomers  from "@/app/pages/admin/CustomersPage";
import SiteSettingsPage from "@/app/pages/admin/SiteSettingsPage";
import AdminsPage      from "@/app/pages/admin/AdminsPage";
import AdminSetupPage  from "@/app/pages/admin/AdminSetupPage";

import "@/styles/tailwind.css";
import "@/styles/fonts.css";

function AdminRoute({ children }: { children: React.ReactElement }) {
  const { user, isAdmin, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/admin/login" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;
  return children;
}

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function AppRoutes() {
  return (
    <>
    <ScrollToTop />
    <Routes>
      <Route path="/"                element={<HomePage />} />
      <Route path="/shop"            element={<ShopPage />} />
      <Route path="/shop/:category"  element={<ShopPage />} />
      <Route path="/product/:slug"   element={<ProductPage />} />
      <Route path="/about"           element={<AboutPage />} />
      <Route path="/contact"         element={<ContactPage />} />
      <Route path="/shipping"        element={<ShippingPage />} />
      <Route path="/returns"         element={<ReturnsPage />} />
      <Route path="/privacy-policy"  element={<PrivacyPolicyPage />} />
      <Route path="/terms-of-service" element={<TermsPage />} />
      <Route path="/cart"            element={<CartPage />} />
      <Route path="/payment/success" element={<PaymentSuccess />} />
      <Route path="/payment/failed"  element={<PaymentFailed />} />
      <Route path="/checkout"        element={<CheckoutPage />} />

      {/* Guest-only store: shoppers never sign in. Old account URLs go home. */}
      <Route path="/login"           element={<Navigate to="/admin/login" replace />} />
      <Route path="/register"        element={<Navigate to="/" replace />} />
      <Route path="/account/*"       element={<Navigate to="/" replace />} />

      <Route path="/admin/login"     element={<AdminLoginPage />} />
      <Route path="/admin/setup"     element={<AdminSetupPage />} />

      <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
        <Route index                    element={<DashboardPage />} />
        <Route path="products"          element={<AdminProducts />} />
        <Route path="products/new"      element={<ProductFormPage />} />
        <Route path="products/:id/edit" element={<ProductFormPage />} />
        <Route path="orders"            element={<AdminOrders />} />
        <Route path="customers"         element={<AdminCustomers />} />
        <Route path="settings"          element={<SiteSettingsPage />} />
        <Route path="admins"            element={<AdminsPage />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
    </>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <CartProvider>
            <AppRoutes />
          </CartProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>
);
