import { useAuth } from "../context/AuthContext";

/**
 * RoleGate — conditionally renders children based on role permissions.
 *
 * Usage:
 *   <RoleGate permission="my_shop">
 *     <ShopOwnerDashboard />
 *   </RoleGate>
 *
 *   <RoleGate roles={["admin", "expert"]}>
 *     <ExpertPanel />
 *   </RoleGate>
 *
 *   <RoleGate permission="evolution" fallback={<UpgradePrompt />}>
 *     <EvolutionDashboard />
 *   </RoleGate>
 */
const RoleGate = ({ permission, roles, children, fallback = null }) => {
  const { can, hasRole } = useAuth();

  if (permission && !can(permission)) return fallback;
  if (roles && !hasRole(...roles)) return fallback;

  return children;
};

export default RoleGate;
