
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
import IngredientScanner from "./pages/IngredientScanner";
import ProductCatalog from "./pages/ProductCatalog";

import AdminDashboard from "./pages/admin/AdminDashboard";
import ExpertDashboard from "./pages/expert/ExpertDashboard";

import ProtectedRoute from "./components/ProtectedRoute";
import DashboardLayout from "./layout/DashboardLayout";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

function App() {
  const { i18n } = useTranslation();

  // Handle Global RTL for the ENTIRE website
  useEffect(() => {
    const isRtl = i18n.language === 'ar';
    document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);

  return (
    <BrowserRouter>
      <Routes>

        {/* Landing Page */}
        <Route path="/" element={<LandingPage />} />

        {/* Auth Pages */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/demo-results" element={<DemoResultsPage />} />
        <Route path="/premium" element={<ProtectedRoute><PremiumPage /></ProtectedRoute>} />

        {/* Protected Dashboard Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardHome />} />
          <Route path="analyze" element={<AnalyzePage />} />
          <Route path="live-analyze" element={<LiveAnalyzePage />} />
          <Route path="history" element={<HistoryPage />} />
          <Route path="trends" element={<TrendsPage />} />
          <Route path="hair-styling" element={<HairStyling />} />
          <Route path="nail-styling" element={<NailStyling />} />
          <Route path="virtual-studio" element={<VirtualStudio />} />
          <Route path="evolution" element={<ProgressDashboard />} />
          <Route path="routine" element={<RoutineBuilder />} />
          <Route path="scan" element={<IngredientScanner />} />
          <Route path="products" element={<ProductCatalog />} />
          <Route path="services" element={<ServicesPage />} />
          <Route path="settings" element={<SettingsPage />} />

          {/* Role-Based Routes */}
          <Route path="admin" element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminDashboard />
            </ProtectedRoute>
          } />
          <Route path="expert" element={
            <ProtectedRoute allowedRoles={["expert", "admin"]}>
              <ExpertDashboard />
            </ProtectedRoute>
          } />
        </Route>

        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;
