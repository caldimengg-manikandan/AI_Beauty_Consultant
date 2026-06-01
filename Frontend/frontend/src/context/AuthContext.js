import { createContext, useState, useEffect, useContext } from "react";
import { jwtDecode } from "jwt-decode";
import api from "../services/api";

export const AuthContext = createContext(null);

// Roles
export const ROLES = {
  ADMIN: "admin",
  EXPERT: "expert",
  SHOP_OWNER: "shop_owner",
  PREMIUM: "premium",
  USER: "user",
};

// Role display metadata (label, color classes, emoji)
export const ROLE_LABELS = {
  admin:      { label: "Admin",      color: "bg-red-100 text-red-700",      emoji: "🛡️" },
  expert:     { label: "Expert",     color: "bg-blue-100 text-blue-700",    emoji: "🔬" },
  shop_owner: { label: "Shop Owner", color: "bg-amber-100 text-amber-700",  emoji: "🏪" },
  premium:    { label: "Premium",    color: "bg-violet-100 text-violet-700", emoji: "⭐" },
  user:       { label: "Free",       color: "bg-slate-100 text-slate-600",  emoji: "👤" },
};

// RBAC helpers
export const ROLE_PERMISSIONS = {
  admin: [
    "admin_console", "expert_panel",
    "face_analysis", "live_camera", "ingredient_scan",
    "skin_health", "skin_journey", "goals_tracker",
    "hair_styling", "nail_styling", "virtual_studio", "routine_builder",
    "spa_services", "find_salons", "beauty_reels", "beauty_store",
    "memberships", "my_bookings", "loyalty_rewards",
    "evolution", "skin_trends", "history",
    "my_shop", "franchise_hq", "staff_management", "hr_payroll",
    "inventory", "campaigns", "coupons", "pos_invoices",
    "ai_insights", "supply_chain", "webhooks_api", "custom_forms",
    "settings",
  ],
  expert: [
    "expert_panel",
    "face_analysis", "live_camera", "ingredient_scan",
    "skin_health", "skin_journey", "goals_tracker",
    "hair_styling", "nail_styling", "virtual_studio", "routine_builder",
    "spa_services", "find_salons", "beauty_reels", "beauty_store",
    "memberships", "my_bookings", "loyalty_rewards",
    "evolution", "skin_trends", "history",
    "settings",
  ],
  shop_owner: [
    "face_analysis", "live_camera", "ingredient_scan",
    "skin_health", "skin_journey", "goals_tracker",
    "hair_styling", "nail_styling", "virtual_studio", "routine_builder",
    "spa_services", "find_salons", "beauty_reels", "beauty_store",
    "memberships", "my_bookings", "loyalty_rewards",
    "evolution", "skin_trends", "history",
    "my_shop", "franchise_hq", "staff_management", "hr_payroll",
    "inventory", "campaigns", "coupons", "pos_invoices",
    "ai_insights", "supply_chain", "webhooks_api", "custom_forms",
    "settings",
  ],
  premium: [
    "face_analysis", "live_camera", "ingredient_scan",
    "skin_health", "skin_journey", "goals_tracker",
    "hair_styling", "nail_styling", "virtual_studio", "routine_builder",
    "spa_services", "find_salons", "beauty_reels", "beauty_store",
    "memberships", "my_bookings", "loyalty_rewards",
    "evolution", "skin_trends", "history",
    "settings",
  ],
  user: [
    "face_analysis", "live_camera", "ingredient_scan",
    "hair_styling", "nail_styling", "virtual_studio",
    "spa_services", "find_salons", "beauty_reels", "beauty_store",
    "memberships", "my_bookings",
    "history",
    "settings",
  ],
};



export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    if (token) {
      try {
        const decoded = jwtDecode(token);
        // Check expiry
        if (decoded.exp && decoded.exp * 1000 < Date.now()) {
          logout();
          return;
        }
        setUser(decoded);
        api.get("/api/onboarding/profile")
          .then(res => setProfile(res.data?.profile || res.data))
          .catch(e => console.error("Failed to fetch profile", e));
      } catch (error) {
        console.error("Failed to decode token:", error);
        setUser(null);
        setProfile(null);
      }
    } else {
      setUser(null);
      setProfile(null);
    }
  }, [token]);

  const login = (newToken) => {
    localStorage.setItem("token", newToken);
    setToken(newToken);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("email");
    setToken(null);
    setUser(null);
  };

  // RBAC helper
  const can = (permission) => {
    const role = user?.role || "user";
    return (ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS["user"]).includes(permission);
  };

  const hasRole = (...roles) => {
    return roles.includes(user?.role);
  };

  const isShopOwner = () => hasRole("shop_owner", "admin");
  const isExpert = () => hasRole("expert", "admin");
  const isAdmin = () => hasRole("admin");
  const isPremium = () => hasRole("premium", "admin", "shop_owner", "expert");

  return (
    <AuthContext.Provider value={{
      token,
      user,
      login,
      logout,
      can,
      hasRole,
      isShopOwner,
      isExpert,
      isAdmin,
      isPremium,
      role: user?.role || "user",
      profile,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
