import { Navigate, Outlet } from "react-router-dom";

export default function ProtectedRoute({ allowedRoles }) {
  const token = localStorage.getItem("token");
  const storedUser = localStorage.getItem("user");

  if (!token || !storedUser) {
    return <Navigate to="/" replace />;
  }

  const user = JSON.parse(storedUser);
  const userRole = user.finalRole || (user.role?.name || user.role || "user").toString().toLowerCase();

  const hasPermission = allowedRoles.some((role) => userRole.includes(role.toLowerCase()));

  if (!hasPermission) {
    return <Navigate to="/public" replace />;
  }

  return <Outlet />;
}