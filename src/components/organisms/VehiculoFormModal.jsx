import { useState, useEffect } from "react";

export default function VehiculoFormModal({
  isOpen,
  onClose,
  onSave,
  initialData = null,
  isSaving = false,
  apiError = "",
}) {
  const [placa, setPlaca] = useState("");
  const [numeroEconomico, setNumeroEconomico] = useState("");
  const [marca, setMarca] = useState("");
  const [modelo, setModelo] = useState("");
  const [anio, setAnio] = useState("");
  const [capacidad, setCapacidad] = useState("");
  const [estado, setEstado] = useState("En servicio");
  const [localError, setLocalError] = useState("");

  useEffect(() => {
    if (initialData) {
      setPlaca(initialData.placa || initialData.placas || "");
      setNumeroEconomico(initialData.numeroEconomico || initialData.numero_economico || "");
      setMarca(initialData.marca || "");
      setModelo(initialData.modelo || "");
      setAnio(initialData.anio || initialData.año || "");
      setCapacidad(initialData.capacidad || "");
      setEstado(initialData.estado || initialData.estatus || "En servicio");
    } else {
      setPlaca("");
      setNumeroEconomico("");
      setMarca("");
      setModelo("");
      setAnio("");
      setCapacidad("");
      setEstado("En servicio");
    }
    setLocalError("");
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setLocalError("");

    if (!placa.trim() || !modelo.trim()) {
      setLocalError("La placa y el modelo son obligatorios.");
      return;
    }

    const capNum = Number(capacidad);
    if (!capNum || capNum < 1) {
      setLocalError("Ingresa una capacidad de pasajeros válida (mayor a 0).");
      return;
    }

    const payload = {
      placa: placa.trim().toUpperCase(),
      marca: marca.trim() || "Sin especificar",
      modelo: modelo.trim(),
      capacidad: capNum,
      estado,
    };

    if (anio) payload.anio = Number(anio);
    if (numeroEconomico.trim()) payload.numeroEconomico = numeroEconomico.trim().toUpperCase();

    onSave(payload);
  };

  const displayError = localError || apiError;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-[1px] flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
        {/* Cabecera del modal */}
        <div className="px-6 py-4 bg-[#123254] text-white flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold">
              {initialData ? "Editar Unidad Vehicular" : "Registrar Nueva Unidad"}
            </h3>
            <p className="text-xs text-slate-300">
              Completa los datos técnicos de la unidad de transporte
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-300 hover:text-white text-lg font-bold px-2"
          >
            ✕
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-sm">
          {displayError && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-xl text-xs whitespace-pre-line">
              {displayError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Placa *
              </label>
              <input
                type="text"
                placeholder="Ej. ABC-123-A"
                value={placa}
                onChange={(e) => setPlaca(e.target.value)}
                required
                className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-slate-800 uppercase focus:outline-none focus:ring-2 focus:ring-[#123254]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                No. Económico (Opcional)
              </label>
              <input
                type="text"
                placeholder="Ej. ECO-105"
                value={numeroEconomico}
                onChange={(e) => setNumeroEconomico(e.target.value)}
                className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-slate-800 uppercase focus:outline-none focus:ring-2 focus:ring-[#123254]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Marca *
              </label>
              <input
                type="text"
                placeholder="Ej. Nissan / Toyota"
                value={marca}
                onChange={(e) => setMarca(e.target.value)}
                required
                className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#123254]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Modelo *
              </label>
              <input
                type="text"
                placeholder="Ej. Urvan NV350"
                value={modelo}
                onChange={(e) => setModelo(e.target.value)}
                required
                className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#123254]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Año
              </label>
              <input
                type="number"
                min="1995"
                max="2030"
                placeholder="2024"
                value={anio}
                onChange={(e) => setAnio(e.target.value)}
                className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#123254]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Capacidad *
              </label>
              <input
                type="number"
                min="1"
                max="100"
                placeholder="16"
                value={capacidad}
                onChange={(e) => setCapacidad(e.target.value)}
                required
                className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#123254]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Estatus *
              </label>
              <select
                value={estado}
                onChange={(e) => setEstado(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#123254]"
              >
                <option value="En servicio">En servicio</option>
                <option value="Mantenimiento">Mantenimiento</option>
                <option value="Fuera de servicio">Fuera de servicio</option>
              </select>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="pt-4 border-t border-slate-100 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 rounded-xl bg-[#123254] hover:bg-[#1a4573] text-white text-xs font-semibold shadow-sm transition disabled:opacity-50"
            >
              {isSaving
                ? "Guardando..."
                : initialData
                ? "Guardar Cambios"
                : "Registrar Unidad"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}