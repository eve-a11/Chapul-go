import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import AdminDashboard from "./pages/admin/AdminDashboard";
import PublicHome from "./pages/public/PublicHome";
import ProtectedRoute from "./components/ProtectedRoute";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rutas Públicas */}
        <Route path="/" element={<Login />} />
        <Route path="/public" element={<PublicHome />} />

        {/* Rutas Privadas solo para Administradores */}
        <Route element={<ProtectedRoute allowedRoles={["admin", "superadmin"]} />}>
          <Route path="/admin" element={<AdminDashboard />} />
        </Route>

        {/* Ruta por defecto para URLs no encontradas */}
        <Route path="*" element={<Login />} />
      </Routes>
    </BrowserRouter>
  );
}