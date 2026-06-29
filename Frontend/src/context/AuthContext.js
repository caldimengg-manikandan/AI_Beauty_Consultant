import { createContext, useState, useEffect, useContext } from "react";
import { jwtDecode } from "jwt-decode";
import axios from "axios";
import api, { setApiToken } from "../services/api";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export const AuthContext = createContext(null);

export const ROLES = {
  ADMIN:      "admin",
  EXPERT:     "expert",
  SHOP_OWNER: "shop_owner",
  PREMIUM:    "premium",
  USER:       "user",
};

export const ROLE_LABELS = {
  admin:      { label: "Admin",      color: "bg-red-100 text-red-700",       emoji: "shield"     },
  expert:     { label: "Expert",     color: "bg-blue-100 text-blue-700",     emoji: "microscope" },
  shop_owner: { label: "Shop Owner", color: "bg-amber-100 text-amber-700",   emoji: "store"      },
  premium:    { label: "Premium",    color: "bg-violet-100 text-violet-700", emoji: "star"       },
  user:       { label: "Free",       color: "bg-slate-100 text-slate-600",   emoji: "user"       },
};

export const ROLE_PERMISSIONS = {
  admin: [
    "admin_console", "expert_panel",
    // Consumer Beauty AI
    "face_analysis", "live_camera", "ingredient_scan",
    "skin_journey", "goals_tracker",
    "hair_styling", "nail_styling", "virtual_studio",
    "spa_services", "find_salons", "beauty_reels", "beauty_store", "routine_shop",
    "memberships", "my_bookings", "loyalty_rewards",
    "evolution", "skin_trends", "history", "products",
    "beauty_passport", "ingredient_conflict",
    // Business Hub
    "my_shop", "staff_management", "hr_payroll",
    "inventory", "shop_products", "shop_services", "shop_appointments",
    "campaigns", "coupons", "pos_invoices",
    "ai_insights", "supply_chain", "webhooks_api", "custom_forms",
    "client_intelligence", "noshow_predictor",
    "settings",
  ],
  expert: [
    "expert_panel",
    "face_analysis", "live_camera", "ingredient_scan",
    "skin_journey", "goals_tracker",
    "hair_styling", "nail_styling", "virtual_studio",
    "spa_services", "find_salons", "beauty_reels", "beauty_store", "routine_shop",
    "memberships", "my_bookings", "loyalty_rewards",
    "evolution", "skin_trends", "history", "products",
    "beauty_passport", "ingredient_conflict",
    "settings",
  ],
  shop_owner: [
    // Business only
    "my_shop",
    "staff_management", "hr_payroll",
    "inventory", "shop_products", "shop_services", "shop_appointments",
    "campaigns", "coupons", "pos_invoices",
    "ai_insights", "supply_chain", "webhooks_api", "custom_forms",
    "client_intelligence", "noshow_predictor",
    "beauty_reels",   // Shop owners manage & upload their marketing reels
    "settings",
  ],
  premium: [
    "face_analysis", "live_camera", "ingredient_scan",
    "skin_journey", "goals_tracker",
    "hair_styling", "nail_styling", "virtual_studio",
    "spa_services", "find_salons", "beauty_reels", "beauty_store", "routine_shop",
    "memberships", "my_bookings", "loyalty_rewards",
    "evolution", "skin_trends", "history", "products",
    "beauty_passport", "ingredient_conflict",
    "settings",
  ],
  user: [
    "face_analysis", "live_camera", "ingredient_scan",
    "hair_styling", "nail_styling", "virtual_studio",
    "find_salons", "spa_services", "beauty_reels", "beauty_store",
    "memberships", "my_bookings",
    "history", "products",
    "beauty_passport", "ingredient_conflict",
    "settings",
  ],
};

export const AuthProvider = ({ children }) => {
  // Security: Access token is now stored purely in React state (memory).
  // The refresh token is an HttpOnly, Secure cookie managed by the browser.
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isInitializing, setIsInitializing] = useState(true);

  // On initial load, try to get a new access token via the refresh cookie
  useEffect(() => {
    const initAuth = async () => {
      try {
        const res = await axios.post(`${API_BASE}/api/auth/refresh`, {}, { withCredentials: true });
        if (res.data?.access_token) {
          setToken(res.data.access_token);
        }
      } catch (err) {
        // No valid refresh cookie, user is logged out
        console.log("No valid session found.");
      } finally {
        setIsInitializing(false);
      }
    };
    initAuth();
  }, []);

  useEffect(() => {
    if (token) {
      try {
        const decoded = jwtDecode(token);
        if (!decoded || typeof decoded !== "object") {
          // Malformed payload
          setToken(null);
          return;
        }
        if (decoded.exp && decoded.exp * 1000 < Date.now()) {
          setToken(null);
          return;
        }
        setUser(decoded);
        api.get("/api/onboarding/profile")
          .then(res => setProfile(res.data?.profile || res.data))
          .catch(() => {
            setToken(null);
          });
      } catch (error) {
        console.warn("Clearing invalid token from memory:", error?.message);
        setToken(null);
        setApiToken(null);
      }
    } else {
      setUser(null);
      setProfile(null);
      setApiToken(null);
    }
  }, [token]);

  const login = (newToken) => {
    setToken(newToken);
    setApiToken(newToken);
  };

  const logout = async () => {
    try {
      await api.post("/api/auth/logout");
    } catch (e) {
      // ignore
    }
    setToken(null);
    setApiToken(null);
    setUser(null);
    setProfile(null);
  };

  const can = (permission) => {
    const role = user?.role || "user";
    return (ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS["user"]).includes(permission);
  };

  const hasRole = (...roles) => roles.includes(user?.role);
  const isShopOwner = () => hasRole("shop_owner", "admin");
  const isExpert    = () => hasRole("expert", "admin");
  const isAdmin     = () => hasRole("admin");
  const isPremium   = () => hasRole("premium", "admin", "expert");

  if (isInitializing) {
    return null; // Or a loading spinner
  }

  return (
    <AuthContext.Provider value={{
      token, user, login, logout, can, hasRole,
      isShopOwner, isExpert, isAdmin, isPremium,
      role: user?.role || "user",
      profile,
      isInitializing,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
