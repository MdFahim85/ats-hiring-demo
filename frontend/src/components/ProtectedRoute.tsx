import { Navigate, useLocation } from "react-router";

import Client_ROUTEMAP from "../misc/Client_ROUTEMAP";
import { useUserContext } from "@/contexts/UserContext";
import Loading from "./shared/Loading";

import type { User } from "@backend/models/User";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: User["role"][];
  allowLoggedInOnly?: boolean;
  allowLoggedOutOnly?: boolean;
}

const getDashboardByRole = (role: User["role"]) => {
  switch (role) {
    case "admin":
      return `${Client_ROUTEMAP.admin.root}/${Client_ROUTEMAP.admin.index}`;
    case "hr":
      return `${Client_ROUTEMAP.hr.root}/${Client_ROUTEMAP.hr.index}`;

    case "candidate":
      return `${Client_ROUTEMAP.candidate.root}/${Client_ROUTEMAP.candidate.index}`;

    default:
      return Client_ROUTEMAP.public.root;
  }
};

export function ProtectedRoute({
  children,
  allowedRoles,
  allowLoggedInOnly,
  allowLoggedOutOnly,
}: ProtectedRouteProps) {
  const { user, isLoading } = useUserContext();
  const location = useLocation();

  if (isLoading) {
    return <Loading />;
  }

  if (user) {
    if (allowLoggedOutOnly) {
      const destination = getDashboardByRole(user.role);
      return <Navigate to={destination} replace />;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
      return <Navigate to={Client_ROUTEMAP.utility.unauthorized} replace />;
    }
  }

  if (!user) {
    if (allowLoggedInOnly) {
      return (
        <Navigate
          to={Client_ROUTEMAP.auth.root + "/" + Client_ROUTEMAP.auth.login}
          state={{ from: location.pathname + location.search }}
          replace
        />
      );
    }
  }

  return <>{children}</>;
}
