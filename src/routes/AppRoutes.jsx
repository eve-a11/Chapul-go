import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ProtectedRoute, PublicRoute } from "../components/ProtectedRoute";
import Login from "../pages/public/Login";
import AdminDashboard from "../pages/admin/AdminDashboard";

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Ruta pública: si ya iniciaste sesión, impide regresar al login */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />

        {/* Rutas protegidas: permite entrar a /admin y a cualquier apartado (/admin/empleados, /admin/vehiculos, etc.) */}
        <Route element={<ProtectedRoute />}>
          <Route path="/admin/:section?" element={<AdminDashboard />} />
        </Route>

        {/* Redirección por defecto */}
        <Route path="/" element={<Navigate to="/admin" replace />} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    </BrowserRouter>
  );
}