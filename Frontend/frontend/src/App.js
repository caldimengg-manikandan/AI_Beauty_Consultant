import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Login from "./auth/Login";
import Signup from "./auth/Signup";
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
import RoutineBuilder from "./features/styling/RoutineBuilder";
import IngredientScanner from "./features/styling/IngredientScanner";
import ProductCatalog from "./pages/ProductCatalog";
import SkinHealthDashboard from "./features/skin/SkinHealthDashboard";
import SkinJourney from "./features/skin/SkinJourney";
import GoalsTracker from "./features/skin/GoalsTracker";
import ChatWidget from "./components/ChatWidget";

import LoyaltyWallet from "./features/loyalty/LoyaltyWallet";

import AdminDashboard from "./pages/admin/AdminDashboard";
import ExpertDashboard from "./pages/expert/ExpertDashboard";
import SalonMarketplace from "./features/marketplace/SalonMarketplace";
import SalonDetailPage from "./features/marketplace/SalonDetailPage";
import EcommerceStore from "./features/ecommerce/EcommerceStore";
import ReelsFeed from "./features/reels/ReelsFeed";
import FranchiseHQ from "./features/partner/FranchiseHQ";
import ShopOwnerDashboard from "./features/marketplace/ShopOwnerDashboard";
import UserBookings from "./features/marketplace/UserBookings";
import ProtectedRoute from "./components/ProtectedRoute";
import DashboardLayout from "./layout/DashboardLayout";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { AuthProvider } from "./context/AuthContext";

function App() {
  const { i18n } = useTranslation();

  useEffect(() => {
    const isRtl = i18n.language === "ar";
    document.documentElement.dir = isRtl ? "rtl" : "ltr";
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);

  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>

          {/* ── Public Pages ── */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/shop-owner/signup" element={<Navigate to="/signup?role=shop_owner" replace />} />
          <Route path="/shop-owner/login" element={<Navigate to="/login?role=shop_owner" replace />} />
          <Route path="/demo-results" element={<DemoResultsPage />} />
          <Route path="/premium" element={<ProtectedRoute><PremiumPage /></ProtectedRoute>} />

          {/* ── Protected Dashboard Shell ── */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            {/* Home */}
            <Route index element={<DashboardHome />} />

            {/* ── Beauty AI — all authenticated roles ── */}
            <Route path="analyze" element={<AnalyzePage />} />
            <Route path="live-analyze" element={<LiveAnalyzePage />} />
            <Route path="scan" element={<IngredientScanner />} />

            {/* ── Skin — premium+ & shop_owner & admin & expert ── */}
            <Route path="lookbook" element={<ProtectedRoute permission="skin_health"><SkinHealthDashboard /></ProtectedRoute>} />
            <Route path="journey" element={<ProtectedRoute permission="skin_journey"><SkinJourney /></ProtectedRoute>} />
            <Route path="goals" element={<ProtectedRoute permission="goals_tracker"><GoalsTracker /></ProtectedRoute>} />

            {/* ── Styling Studio — all roles ── */}
            <Route path="hair-styling" element={<HairStyling />} />
            <Route path="nail-styling" element={<NailStyling />} />
            <Route path="virtual-studio" element={<VirtualStudio />} />
            <Route path="routine" element={<ProtectedRoute permission="routine_builder"><RoutineBuilder /></ProtectedRoute>} />

            {/* ── Marketplace — all roles ── */}
            <Route path="marketplace" element={<SalonMarketplace />} />
            <Route path="salon/:salonId" element={<SalonDetailPage />} />
            <Route path="services" element={<ServicesPage />} />
            <Route path="reels" element={<ReelsFeed />} />
            <Route path="store" element={<EcommerceStore />} />
            <Route path="my-bookings" element={<UserBookings />} />

            {/* ── Rewards — all ── */}
            <Route path="memberships" element={<PremiumPage />} />
            <Route path="loyalty" element={<ProtectedRoute permission="loyalty_rewards"><LoyaltyWallet /></ProtectedRoute>} />

            {/* ── Insights — premium+ ── */}
            <Route path="evolution" element={<ProtectedRoute permission="evolution"><ProgressDashboard /></ProtectedRoute>} />
            <Route path="trends" element={<ProtectedRoute permission="skin_trends"><TrendsPage /></ProtectedRoute>} />
            <Route path="history" element={<HistoryPage />} />
            <Route path="products" element={<ProductCatalog />} />

            {/* ── Account ── */}
            <Route path="settings" element={<SettingsPage />} />

            {/* ── Role-Based: Admin ── */}
            <Route path="admin" element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminDashboard />
              </ProtectedRoute>
            } />

            {/* ── Role-Based: Expert ── */}
            <Route path="expert" element={
              <ProtectedRoute allowedRoles={["expert", "admin"]}>
                <ExpertDashboard />
              </ProtectedRoute>
            } />

            {/* ── Role-Based: Shop Owner / Admin ── */}
            <Route path="shop-owner" element={
              <ProtectedRoute permission="my_shop">
                <ShopOwnerDashboard />
              </ProtectedRoute>
            } />
            <Route path="franchise" element={
              <ProtectedRoute permission="franchise_hq">
                <FranchiseHQ />
              </ProtectedRoute>
            } />

            {/* ── Business Hub — shop_owner / admin only ── */}
            <Route path="staff" element={
              <ProtectedRoute permission="staff_management">
                <ShopOwnerDashboard section="staff" />
              </ProtectedRoute>
            } />
            <Route path="hr" element={
              <ProtectedRoute permission="hr_payroll">
                <ShopOwnerDashboard section="hr" />
              </ProtectedRoute>
            } />
            <Route path="inventory" element={
              <ProtectedRoute permission="inventory">
                <ShopOwnerDashboard section="inventory" />
              </ProtectedRoute>
            } />
            <Route path="invoices" element={
              <ProtectedRoute permission="pos_invoices">
                <ShopOwnerDashboard section="invoices" />
              </ProtectedRoute>
            } />
            <Route path="campaigns" element={
              <ProtectedRoute permission="campaigns">
                <ShopOwnerDashboard section="campaigns" />
              </ProtectedRoute>
            } />
            <Route path="coupons" element={
              <ProtectedRoute permission="coupons">
                <ShopOwnerDashboard section="coupons" />
              </ProtectedRoute>
            } />
            <Route path="insights" element={
              <ProtectedRoute permission="ai_insights">
                <ShopOwnerDashboard section="insights" />
              </ProtectedRoute>
            } />
            <Route path="supply-chain" element={
              <ProtectedRoute permission="supply_chain">
                <ShopOwnerDashboard section="supply-chain" />
              </ProtectedRoute>
            } />
            <Route path="forms" element={
              <ProtectedRoute permission="custom_forms">
                <ShopOwnerDashboard section="forms" />
              </ProtectedRoute>
            } />
            <Route path="webhooks" element={
              <ProtectedRoute permission="webhooks_api">
                <ShopOwnerDashboard section="webhooks" />
              </ProtectedRoute>
            } />

          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />

        </Routes>
        <ChatWidget />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
