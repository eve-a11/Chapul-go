import { Link } from "react-router-dom";

export default function PublicHome() {
  return (
    <div className="min-h-screen bg-slate-900 text-white p-8">
      <div className="flex justify-between items-center mb-8 border-b border-slate-800 pb-4">
        <h1 className="text-2xl font-bold text-emerald-400">Vista Pública de Rutas</h1>
        <Link to="/" className="text-sm bg-slate-800 px-4 py-2 rounded-lg text-slate-300 hover:bg-slate-700">
          Iniciar Sesión
        </Link>
      </div>
      <p className="text-slate-400">Consulta de horarios, paradas y rutas públicas para usuarios.</p>
    </div>
  );
}