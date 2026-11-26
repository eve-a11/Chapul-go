import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import AdminDashboard from "./pages/admin/AdminDashboard";
import PublicHome from "./pages/public/PublicHome";
import ProtectedRoute, { PublicRoute } from "./components/ProtectedRoute";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Pantalla principal pública (accesible para visitantes, pasajeros y admins) */}
        <Route path="/" element={<PublicHome />} />

        {/* Login / Registro: si ya hay sesión activa, PublicRoute redirige según el rol */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />

        {/* Panel Administrativo protegido: mantiene /admin, /admin/rutas, /admin/empleados, etc. */}
        <Route element={<ProtectedRoute />}>
          <Route path="/admin/:section?" element={<AdminDashboard />} />
        </Route>

        {/* Cualquier URL no encontrada regresa al portal público */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}