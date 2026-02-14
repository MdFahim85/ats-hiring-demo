import { Navigate, useLocation } from "react-router";
import { useAuth } from "../contexts/AuthContext";
import Client_ROUTEMAP from "../misc/Client_ROUTEMAP";
import type { UserRole } from "@/types";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
  allowLoggedInOnly?: boolean;
  allowLoggedOutOnly?: boolean;
}

export function ProtectedRoute({
  children,
  allowedRoles,
  allowLoggedInOnly,
  allowLoggedOutOnly,
}: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();

  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to={Client_ROUTEMAP._.root} replace />;
  }

  if (!user && allowLoggedInOnly)
    return (
      <Navigate
        to={Client_ROUTEMAP.auth.root + "/" + Client_ROUTEMAP.auth.login}
        state={{ from: location.pathname + location.search }}
        replace
      />
    );

  if (user && allowLoggedOutOnly) {
    return (
      <Navigate
        to={location.state?.from ?? Client_ROUTEMAP.public.root}
        replace
      />
    );
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to={Client_ROUTEMAP.utility.unauthorized} replace />;
  }

  return <>{children}</>;
}
