import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Login from "./auth/Login";
import Signup from "./auth/Signup";
import VerifyEmail from "./auth/VerifyEmail";
import LandingPage from "./pages/LandingPage";
import DemoResultsPage from "./pages/DemoResultsPage";
import DashboardHome from "./pages/DashboardHome";

import AnalyzePage from "./features/analysis/AnalyzePage";
import HistoryPage from "./features/history/HistoryPage";
import TrendsPage from "./features/history/TrendsPage";

import LiveAnalyzePage from "./features/camera/LiveAnalyzePage";
import HairStyling from "./features/styling/HairStyling";
import NailStyling from "./features/styling/NailStyling";
import VirtualStudio from "./features/styling/VirtualStudio";
import ServicesPage from "./features/services/ServicesPage";
import SettingsPage from "./pages/SettingsPage";
import PremiumPage from "./pages/PremiumPage";
import ProgressDashboard from "./features/styling/ProgressDashboard";
import IngredientScanner from "./features/styling/IngredientScanner";
import IngredientConflictChecker from "./features/styling/IngredientConflictChecker";
import ProductCatalog from "./pages/ProductCatalog";
import SkinJourney from "./features/skin/SkinJourney";
import GoalsTracker from "./features/skin/GoalsTracker";
import ChatWidget from "./components/ChatWidget";

import LoyaltyWallet from "./features/loyalty/LoyaltyWallet";

import AdminDashboard from "./pages/admin/AdminDashboard";
import ExpertDashboard from "./pages/expert/ExpertDashboard";
import SalonMarketplace from "./features/marketplace/SalonMarketplace";
import SalonDetailPage from "./features/marketplace/SalonDetailPage";
import EcommerceStore from "./features/ecommerce/EcommerceStore";
import ShoppableRoutines from "./features/ecommerce/ShoppableRoutines";
import ReelsFeed from "./features/reels/ReelsFeed";
import ShopOwnerDashboard from "./features/marketplace/ShopOwnerDashboard";
import UserBookings from "./features/marketplace/UserBookings";
import ClientIntelligence from "./features/partner/ClientIntelligence";
import NoShowPredictor from "./features/partner/NoShowPredictor";
import ShopServices from "./features/partner/ShopServices";
import ShopProducts from "./features/partner/ShopProducts";

import ProtectedRoute from "./components/ProtectedRoute";
import DashboardLayout from "./layout/DashboardLayout";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";

function App() {
  const { i18n } = useTranslation();

  useEffect(() => {
    const isRtl = i18n.language === "ar";
    document.documentElement.dir = isRtl ? "rtl" : "ltr";
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);

  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          <Routes>

            {/* Public Pages */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/shop-owner/signup" element={<Navigate to="/signup?role=shop_owner" replace />} />
            <Route path="/shop-owner/login" element={<Navigate to="/login?role=shop_owner" replace />} />
            <Route path="/demo-results" element={<DemoResultsPage />} />
            <Route path="/premium" element={<ProtectedRoute><PremiumPage /></ProtectedRoute>} />

            {/* Protected Dashboard Shell */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              {/* Home - all authenticated roles */}
              <Route index element={<DashboardHome />} />

              {/* ═══════════════════════════════════════════════════════
                  USER / PREMIUM / EXPERT / ADMIN — CONSUMER ROUTES
                  Permission-gated: shop_owner lacks these permissions
                  and is automatically redirected to /dashboard.
                  ═══════════════════════════════════════════════════════ */}

              {/* Beauty AI */}
              <Route path="analyze"      element={<ProtectedRoute permission="face_analysis"><AnalyzePage /></ProtectedRoute>} />
              <Route path="live-analyze" element={<ProtectedRoute permission="live_camera"><LiveAnalyzePage /></ProtectedRoute>} />
              <Route path="scan"         element={<ProtectedRoute permission="ingredient_scan"><IngredientScanner /></ProtectedRoute>} />

              {/* Skin */}
              <Route path="journey"  element={<ProtectedRoute permission="skin_journey"><SkinJourney /></ProtectedRoute>} />
              <Route path="goals"    element={<ProtectedRoute permission="goals_tracker"><GoalsTracker /></ProtectedRoute>} />

              {/* Styling Studio */}
              <Route path="hair-styling"   element={<ProtectedRoute permission="hair_styling"><HairStyling /></ProtectedRoute>} />
              <Route path="nail-styling"   element={<ProtectedRoute permission="nail_styling"><NailStyling /></ProtectedRoute>} />
              <Route path="virtual-studio" element={<ProtectedRoute permission="virtual_studio"><VirtualStudio /></ProtectedRoute>} />

              {/* Consumer Marketplace */}
              <Route path="marketplace"    element={<ProtectedRoute permission="find_salons"><SalonMarketplace /></ProtectedRoute>} />
              <Route path="salon/:salonId" element={<ProtectedRoute permission="find_salons"><SalonDetailPage /></ProtectedRoute>} />
              <Route path="services"       element={<ProtectedRoute permission="spa_services"><ServicesPage /></ProtectedRoute>} />
              <Route path="reels"          element={<ProtectedRoute permission="beauty_reels"><ReelsFeed /></ProtectedRoute>} />
              <Route path="store"          element={<ProtectedRoute permission="beauty_store"><EcommerceStore /></ProtectedRoute>} />
              <Route path="routine-shop"   element={<ProtectedRoute permission="routine_shop"><ShoppableRoutines /></ProtectedRoute>} />
              <Route path="my-bookings"    element={<ProtectedRoute permission="my_bookings"><UserBookings /></ProtectedRoute>} />

              {/* Rewards */}
              <Route path="memberships" element={<ProtectedRoute permission="memberships"><PremiumPage /></ProtectedRoute>} />
              <Route path="loyalty"     element={<ProtectedRoute permission="loyalty_rewards"><LoyaltyWallet /></ProtectedRoute>} />

              {/* Insights */}
              <Route path="evolution" element={<ProtectedRoute permission="evolution"><ProgressDashboard /></ProtectedRoute>} />
              <Route path="trends"    element={<ProtectedRoute permission="skin_trends"><TrendsPage /></ProtectedRoute>} />
              <Route path="history"   element={<ProtectedRoute permission="history"><HistoryPage /></ProtectedRoute>} />
              <Route path="products"  element={<ProtectedRoute permission="products"><ProductCatalog /></ProtectedRoute>} />

              {/* Phase 1 New Consumer Features */}
              <Route path="conflict-checker" element={<ProtectedRoute permission="ingredient_conflict"><IngredientConflictChecker /></ProtectedRoute>} />

              {/* Account */}
              <Route path="settings" element={<SettingsPage />} />

              {/* ═══════════════════════════════════════════
                  ADMIN-ONLY ROUTES
                  ═══════════════════════════════════════════ */}
              <Route path="admin" element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <AdminDashboard />
                </ProtectedRoute>
              } />

              {/* ═══════════════════════════════════════════
                  EXPERT ROUTES (expert + admin)
                  ═══════════════════════════════════════════ */}
              <Route path="expert" element={
                <ProtectedRoute allowedRoles={["expert", "admin"]}>
                  <ExpertDashboard />
                </ProtectedRoute>
              } />

              {/* ═══════════════════════════════════════════
                  SHOP OWNER / ADMIN — BUSINESS HUB ROUTES
                  ═══════════════════════════════════════════ */}
              <Route path="shop-owner" element={
                <ProtectedRoute allowedRoles={["shop_owner", "admin"]}>
                  <ShopOwnerDashboard />
                </ProtectedRoute>
              } />
              <Route path="staff" element={
                <ProtectedRoute allowedRoles={["shop_owner", "admin"]}>
                  <ShopOwnerDashboard section="staff" />
                </ProtectedRoute>
              } />
              <Route path="hr" element={
                <ProtectedRoute allowedRoles={["shop_owner", "admin"]}>
                  <ShopOwnerDashboard section="hr" />
                </ProtectedRoute>
              } />
              <Route path="inventory" element={
                <ProtectedRoute allowedRoles={["shop_owner", "admin"]}>
                  <ShopOwnerDashboard section="inventory" />
                </ProtectedRoute>
              } />
              <Route path="invoices" element={
                <ProtectedRoute allowedRoles={["shop_owner", "admin"]}>
                  <ShopOwnerDashboard section="invoices" />
                </ProtectedRoute>
              } />
              <Route path="campaigns" element={
                <ProtectedRoute allowedRoles={["shop_owner", "admin"]}>
                  <ShopOwnerDashboard section="campaigns" />
                </ProtectedRoute>
              } />
              <Route path="coupons" element={
                <ProtectedRoute allowedRoles={["shop_owner", "admin"]}>
                  <ShopOwnerDashboard section="coupons" />
                </ProtectedRoute>
              } />
              <Route path="insights" element={
                <ProtectedRoute allowedRoles={["shop_owner", "admin"]}>
                  <ShopOwnerDashboard section="insights" />
                </ProtectedRoute>
              } />
              <Route path="supply-chain" element={
                <ProtectedRoute allowedRoles={["shop_owner", "admin"]}>
                  <ShopOwnerDashboard section="supply-chain" />
                </ProtectedRoute>
              } />
              <Route path="forms" element={
                <ProtectedRoute allowedRoles={["shop_owner", "admin"]}>
                  <ShopOwnerDashboard section="forms" />
                </ProtectedRoute>
              } />
              <Route path="webhooks" element={
                <ProtectedRoute allowedRoles={["shop_owner", "admin"]}>
                  <ShopOwnerDashboard section="webhooks" />
                </ProtectedRoute>
              } />

              {/* Phase 1 New B2B Features */}
              <Route path="client-intelligence" element={
                <ProtectedRoute allowedRoles={["shop_owner", "admin"]}>
                  <ClientIntelligence />
                </ProtectedRoute>
              } />
              <Route path="noshow-predictor" element={
                <ProtectedRoute allowedRoles={["shop_owner", "admin"]}>
                  <NoShowPredictor />
                </ProtectedRoute>
              } />

              {/* Shop Owner — Services & Products (dedicated pages) */}
              <Route path="shop-services" element={
                <ProtectedRoute allowedRoles={["shop_owner", "admin"]}>
                  <ShopServices />
                </ProtectedRoute>
              } />
              <Route path="shop-products" element={
                <ProtectedRoute allowedRoles={["shop_owner", "admin"]}>
                  <ShopProducts />
                </ProtectedRoute>
              } />

            </Route>

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />

          </Routes>
          <ChatWidget />
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
