import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Obtener la información del usuario guardada en el Login
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error("Error al cargar datos del usuario", e);
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row">
      {/* Sidebar / Barra Lateral */}
      <aside className="w-full md:w-64 bg-slate-900 border-r border-slate-800 p-6 flex flex-col justify-between">
        <div>
          {/* Logo */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-blue-600/20 text-blue-400 rounded-xl flex items-center justify-center text-xl border border-blue-500/30">
              🚌
            </div>
            <div>
              <h1 className="font-bold text-lg text-white">Chapul-Go</h1>
              <span className="text-xs text-blue-400 font-medium">Panel Admin</span>
            </div>
          </div>

          {/* Menú de Navegación por Módulos */}
          <nav className="space-y-1">
            <button
              onClick={() => setActiveTab("overview")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition ${
                activeTab === "overview"
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`}
            >
              📊 Resumen General
            </button>

            <button
              onClick={() => setActiveTab("vehicles")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition ${
                activeTab === "vehicles"
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`}
            >
              🚍 Flota de Vehículos
            </button>

            <button
              onClick={() => setActiveTab("routes")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition ${
                activeTab === "routes"
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`}
            >
              🗺️ Rutas y Paradas
            </button>

            <button
              onClick={() => setActiveTab("users")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition ${
                activeTab === "users"
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`}
            >
              👥 Usuarios y Personal
            </button>

            <button
              onClick={() => setActiveTab("inspections")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition ${
                activeTab === "inspections"
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`}
            >
              📋 Chequeos y Servicio
            </button>

            <button
              onClick={() => setActiveTab("finance")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition ${
                activeTab === "finance"
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`}
            >
              💳 Tarifas y Pagos
            </button>
          </nav>
        </div>

        {/* Perfil y Cierre de Sesión */}
        <div className="pt-6 border-t border-slate-800 mt-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 bg-slate-800 rounded-full flex items-center justify-center font-bold text-sm text-blue-400 border border-slate-700">
              {user?.email ? user.email.charAt(0).toUpperCase() : "A"}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium text-white truncate">
                {user?.email || "Administrador"}
              </p>
              <p className="text-xs text-slate-400">SuperAdmin</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full bg-slate-800 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30 text-slate-300 py-2 px-4 rounded-xl text-sm font-medium transition border border-slate-700 flex items-center justify-center gap-2"
          >
            🚪 Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Área Principal de Contenido */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto">
        {/* Header superior */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-bold text-white">
              {activeTab === "overview" && "Resumen General Operativo"}
              {activeTab === "vehicles" && "Gestión de Vehículos y Unidades"}
              {activeTab === "routes" && "Control de Rutas y Horarios"}
              {activeTab === "users" && "Administración de Usuarios y Conductores"}
              {activeTab === "inspections" && "Historial de Chequeos e Inspecciones"}
              {activeTab === "finance" && "Tarifas y Registro de Pagos"}
            </h2>
            <p className="text-sm text-slate-400">
              Panel de control en tiempo real para la red de transporte.
            </p>
          </div>
        </header>

        {/* Tarjetas de Métricas Rápidas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
            <div className="flex justify-between items-start mb-2">
              <span className="text-slate-400 text-sm">Buses Activos</span>
              <span className="p-2 bg-blue-500/10 text-blue-400 rounded-lg text-lg">🚌</span>
            </div>
            <h3 className="text-2xl font-bold text-white">24 / 28</h3>
            <p className="text-xs text-emerald-400 mt-1">85% en servicio activo</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
            <div className="flex justify-between items-start mb-2">
              <span className="text-slate-400 text-sm">Rutas Habilitadas</span>
              <span className="p-2 bg-purple-500/10 text-purple-400 rounded-lg text-lg">🛣️</span>
            </div>
            <h3 className="text-2xl font-bold text-white">12</h3>
            <p className="text-xs text-slate-400 mt-1">Cubriendo 4 municipios</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
            <div className="flex justify-between items-start mb-2">
              <span className="text-slate-400 text-sm">Conductores / Personal</span>
              <span className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg text-lg">👥</span>
            </div>
            <h3 className="text-2xl font-bold text-white">45</h3>
            <p className="text-xs text-emerald-400 mt-1">Turnos asignados hoy</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
            <div className="flex justify-between items-start mb-2">
              <span className="text-slate-400 text-sm">Inspecciones Hoy</span>
              <span className="p-2 bg-amber-500/10 text-amber-400 rounded-lg text-lg">✅</span>
            </div>
            <h3 className="text-2xl font-bold text-white">18</h3>
            <p className="text-xs text-amber-400 mt-1">2 pendientes de revisión</p>
          </div>
        </div>

        {/* Dynamic Content según la pestaña seleccionada */}
        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-white">
              {activeTab === "overview" ? "Accesos Rápidos a Módulos" : "Tabla de Registros"}
            </h3>
            <button className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium py-2 px-4 rounded-xl transition shadow-lg shadow-blue-600/20">
              + Nuevo Registro
            </button>
          </div>

          {/* Vista previa de módulos */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl hover:border-slate-700 transition">
              <span className="text-2xl mb-2 block">🚘</span>
              <h4 className="font-semibold text-white text-sm mb-1">`/vehiculos`</h4>
              <p className="text-xs text-slate-400 mb-3">
                Gestión de placa, número económico y capacidad de pasajeros.
              </p>
              <button 
                onClick={() => setActiveTab("vehicles")}
                className="text-xs text-blue-400 font-medium hover:underline"
              >
                Administrar vehículos →
              </button>
            </div>

            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl hover:border-slate-700 transition">
              <span className="text-2xl mb-2 block">📍</span>
              <h4 className="font-semibold text-white text-sm mb-1">`/paradas` y `/rutas`</h4>
              <p className="text-xs text-slate-400 mb-3">
                Trazado geográfico por municipio, estado y tarifas aplicadas.
              </p>
              <button 
                onClick={() => setActiveTab("routes")}
                className="text-xs text-blue-400 font-medium hover:underline"
              >
                Ver rutas y paradas →
              </button>
            </div>

            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl hover:border-slate-700 transition">
              <span className="text-2xl mb-2 block">🛠️</span>
              <h4 className="font-semibold text-white text-sm mb-1">`/chequeov`</h4>
              <p className="text-xs text-slate-400 mb-3">
                Bitácora diaria de condiciones físico-mecánicas de las unidades.
              </p>
              <button 
                onClick={() => setActiveTab("inspections")}
                className="text-xs text-blue-400 font-medium hover:underline"
              >
                Revisar chequeos →
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}