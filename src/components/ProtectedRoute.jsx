import { Navigate, Outlet, useLocation } from "react-router-dom";
import { isAdminSession, getStoredUser } from "../utils/authSession";

const hasActiveUserSession = () => {
  const user = getStoredUser();
  return Boolean(user && typeof user === "object" && Object.keys(user).length > 0);
};

export function ProtectedRoute({ children }) {
  const location = useLocation();

  // 1. Si es Admin o SuperAdmin, tiene acceso total a /admin
  if (isAdminSession()) {
    return children ? children : <Outlet />;
  }

  // 2. Si es un pasajero logueado intentando entrar a /admin, lo regresamos al inicio sin cerrar su sesión
  if (hasActiveUserSession()) {
    return <Navigate to="/" replace />;
  }

  // 3. Si no ha iniciado sesión, lo mandamos al login
  return <Navigate to="/login" state={{ from: location }} replace />;
}

export function PublicRoute({ children }) {
  // Si ya inició sesión un Admin/SuperAdmin, lo manda a su panel
  if (isAdminSession()) {
    return <Navigate to="/admin" replace />;
  }

  // Si ya inició sesión un usuario normal (pasajero), lo manda al portal público
  if (hasActiveUserSession()) {
    return <Navigate to="/" replace />;
  }

  return children ? children : <Outlet />;
}

export default ProtectedRoute;