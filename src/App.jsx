import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import AdminDashboard from "./pages/admin/AdminDashboard";
import PublicHome from "./pages/public/PublicHome";
import ProtectedRoute, { PublicRoute } from "./components/ProtectedRoute";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rutas Públicas (PublicRoute impide volver al login con la flecha Atrás si ya iniciaste sesión) */}
        <Route
          path="/"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />
        <Route path="/public" element={<PublicHome />} />

        {/* Rutas Privadas: permite entrar a /admin y a cualquier apartado (/admin/vehiculos, /admin/empleados, etc.) */}
        <Route element={<ProtectedRoute />}>
          <Route path="/admin/:section?" element={<AdminDashboard />} />
        </Route>

        {/* Ruta por defecto para URLs no encontradas */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}