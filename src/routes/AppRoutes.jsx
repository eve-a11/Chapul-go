import { Routes, Route, Navigate } from "react-router-dom";
import PublicHome from "../pages/public/PublicHome";
import ObjetosPerdidosPublic from "../pages/public/ObjetosPerdidosPublic";
import PublicLayout from "../components/templates/public/PublicLayout";
import Login from "../pages/Login";
import AdminDashboard from "../pages/admin/AdminDashboard";
import {
  AdminRoute,
  PublicOnlyRoute,
  UserRoute,
} from "../components/ProtectedRoute";

export default function AppRoutes() {
  return (
    <Routes>
      {/* Portal Público Principal (accesible para todos) */}
      <Route path="/" element={<PublicHome />} />

      {/* Objetos Perdidos (solo usuarios logueados, envuelto en PublicLayout para mantener el Navbar) */}
      <Route
        path="/objetos-perdidos"
        element={
          <UserRoute>
            <PublicLayout>
              <ObjetosPerdidosPublic />
            </PublicLayout>
          </UserRoute>
        }
      />

      {/* Login y Registro (si ya hay sesión, redirige según el rol) */}
      <Route
        path="/login"
        element={
          <PublicOnlyRoute>
            <Login />
          </PublicOnlyRoute>
        }
      />

      {/* Panel Administrativo (solo Admin / SuperAdmin) */}
      <Route
        path="/admin/:section?"
        element={
          <AdminRoute>
            <AdminDashboard />
          </AdminRoute>
        }
      />

      {/* Cualquier ruta desconocida regresa al portal público */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}