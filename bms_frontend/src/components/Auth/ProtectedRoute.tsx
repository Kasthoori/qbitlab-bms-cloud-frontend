import { Navigate } from "react-router-dom";
import { keycloak } from "@/keycloak";

type Props = {
  children: React.ReactNode;
  allowedRoles?: string[];
};

export default function ProtectedRoute({
  children,
  allowedRoles = [],
}: Props) {
  if (!keycloak?.authenticated) {
    return <Navigate to="/access-denied" replace />;
  }

  if (allowedRoles.length === 0) {
    return <>{children}</>;
  }

  const hasRole = allowedRoles.some((role) =>
    keycloak.hasRealmRole(role)
  );

  if (!hasRole) {
    return <Navigate to="/access-denied" replace />;
  }

  return <>{children}</>;
}