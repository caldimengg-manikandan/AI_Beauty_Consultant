import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * ProtectedRoute — guards routes behind authentication and optional role checks.
 *
 * Props:
 *   allowedRoles?: string[]  — if provided, user's role must be in this list
 *   permission?: string      — if provided, user must have this RBAC permission
 */
export default function ProtectedRoute({ children, allowedRoles, permission }) {
  const { token, can, hasRole } = useAuth();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !hasRole(...allowedRoles)) {
    return <Navigate to="/dashboard" replace />;
  }

  if (permission && !can(permission)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
