import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { lazy, Suspense, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";

// ─── Always-needed (not lazy) ──────────────────────────────────────────────
import ProtectedRoute from "./components/ProtectedRoute";
import DashboardLayout from "./layout/DashboardLayout";
import ErrorBoundary from "./components/ErrorBoundary";

// ─── Fallback spinner shown while a route chunk is loading ─────────────────
const PageLoader = () => (
  <div style={{
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    minHeight: '100vh', background: '#faf5ff',
  }}>
    <div style={{
      width: 40, height: 40,
      border: '4px solid #e9d5ff',
      borderTopColor: '#7c3aed',
      borderRadius: '50%',
      animation: 'spin 0.8s linear infinite',
    }} />
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

// ─── Public pages ──────────────────────────────────────────────────────────
const LandingPage      = lazy(() => import("./pages/LandingPage"));
const Login            = lazy(() => import("./auth/Login"));
const Signup           = lazy(() => import("./auth/Signup"));
const VerifyEmail      = lazy(() => import("./auth/VerifyEmail"));
const DemoResultsPage  = lazy(() => import("./pages/DemoResultsPage"));
const PremiumPage      = lazy(() => import("./pages/PremiumPage"));

// ─── Dashboard home & account ──────────────────────────────────────────────
const DashboardHome    = lazy(() => import("./pages/DashboardHome"));
const SettingsPage     = lazy(() => import("./pages/SettingsPage"));

// ─── Beauty AI ────────────────────────────────────────────────────────────
const AnalyzePage              = lazy(() => import("./features/analysis/AnalyzePage"));
const LiveAnalyzePage          = lazy(() => import("./features/camera/LiveAnalyzePage"));
const IngredientScanner        = lazy(() => import("./features/styling/IngredientScanner"));
const IngredientConflictChecker = lazy(() => import("./features/styling/IngredientConflictChecker"));

// ─── Skin ──────────────────────────────────────────────────────────────────
const SkinJourney      = lazy(() => import("./features/skin/SkinJourney"));
const GoalsTracker     = lazy(() => import("./features/skin/GoalsTracker"));

// ─── Styling Studio ───────────────────────────────────────────────────────
const HairStyling      = lazy(() => import("./features/styling/HairStyling"));
const NailStyling      = lazy(() => import("./features/styling/NailStyling"));
const VirtualStudio    = lazy(() => import("./features/styling/VirtualStudio"));
const ProgressDashboard = lazy(() => import("./features/styling/ProgressDashboard"));

// ─── Services & History ────────────────────────────────────────────────────
const ServicesPage     = lazy(() => import("./features/services/ServicesPage"));
const HistoryPage      = lazy(() => import("./features/history/HistoryPage"));
const TrendsPage       = lazy(() => import("./features/history/TrendsPage"));
const ProductCatalog   = lazy(() => import("./pages/ProductCatalog"));

// ─── Marketplace ──────────────────────────────────────────────────────────
const SalonMarketplace = lazy(() => import("./features/marketplace/SalonMarketplace"));
const SalonDetailPage  = lazy(() => import("./features/marketplace/SalonDetailPage"));
const UserBookings     = lazy(() => import("./features/marketplace/UserBookings"));
const ShopOwnerDashboard = lazy(() => import("./features/marketplace/ShopOwnerDashboard"));

// ─── E-commerce ───────────────────────────────────────────────────────────
const EcommerceStore   = lazy(() => import("./features/ecommerce/EcommerceStore"));
const ShoppableRoutines = lazy(() => import("./features/ecommerce/ShoppableRoutines"));

// ─── Loyalty & Reels ──────────────────────────────────────────────────────
const LoyaltyWallet    = lazy(() => import("./features/loyalty/LoyaltyWallet"));
const ReelsFeed        = lazy(() => import("./features/reels/ReelsFeed"));

// ─── Admin & Expert ───────────────────────────────────────────────────────
const AdminDashboard   = lazy(() => import("./pages/admin/AdminDashboard"));
const ExpertDashboard  = lazy(() => import("./pages/expert/ExpertDashboard"));

// ─── Shop Owner B2B ───────────────────────────────────────────────────────
const BusinessInsights   = lazy(() => import("./features/partner/BusinessInsights"));
const ClientIntelligence = lazy(() => import("./features/partner/ClientIntelligence"));
const NoShowPredictor    = lazy(() => import("./features/partner/NoShowPredictor"));
const ShopServices       = lazy(() => import("./features/partner/ShopServices"));
const ShopProducts       = lazy(() => import("./features/partner/ShopProducts"));

// ─── Chat (loaded after route renders, not at startup) ────────────────────
const ChatWidget = lazy(() => import("./components/ChatWidget"));

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
        <BrowserRouter basename="/AI_Beauty">
          <ErrorBoundary>
          <Suspense fallback={<PageLoader />}>
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
                    <BusinessInsights />
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

            {/* Chat widget — deferred, not rendered until Suspense boundary settles */}
            <Suspense fallback={null}>
              <ChatWidget />
            </Suspense>
          </Suspense>
          </ErrorBoundary>
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
