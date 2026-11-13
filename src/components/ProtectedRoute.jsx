import { Navigate, Outlet, useLocation } from "react-router-dom";
import { isAdminSession, clearAuthSession } from "../utils/authSession";

export function ProtectedRoute({ children }) {
  const location = useLocation();

  if (!isAdminSession()) {
    clearAuthSession();
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  return children ? children : <Outlet />;
}

export function PublicRoute({ children }) {
  // Si ya hay sesión activa y presionan la flecha "Atrás" hacia el login, los devuelve al panel
  if (isAdminSession()) {
    return <Navigate to="/admin" replace />;
  }

  return children ? children : <Outlet />;
}

export default ProtectedRoute;