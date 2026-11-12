
import { useState, useEffect } from "react";

import {
  getVehiculos,
  createVehiculo,
  updateVehiculo,
  deleteVehiculo,
  isVehiculoActivo,
  updateVehiculoEstatus,
} from "../../services/vehiculosService";

import { getEmpleadosConRol as getUsuariosConRol } from "../../services/empleadosService";

// ==========================================
// FUNCIONES AUXILIARES
// ==========================================

const toSafeString = (val, fallback = "") => {
  if (val === null || val === undefined) return fallback;

  if (typeof val === "object") {
    if (val.type === "Buffer" && Array.isArray(val.data)) {
      return val.data[0] === 1 ? "Activo" : "Inactivo";
    }

    return fallback;
  }

  return String(val);
};

// ==========================================
// COMPONENTE PRINCIPAL
// ==========================================

export default function VehiculosAdmin() {
  const [vehiculos, setVehiculos] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [editingId, setEditingId] = useState(null);
  const [numVehic, setNumVehic] = useState("");
  const [marca, setMarca] = useState("");
  const [placa, setPlaca] = useState("");
  const [idUser, setIdUser] = useState("");

  // ==========================================
  // OBTENER DATOS DEL VEHÍCULO
  // ==========================================

  const getVehiculoId = (v) =>
    v?.idVehiculo ??
    v?.id_Vehiculo ??
    v?.id_vehiculo ??
    v?.id;

  const getNumVehiculo = (v) =>
    toSafeString(
      v?.numVehic ??
      v?.numeroVehiculo ??
      v?.num_vehiculo ??
      v?.numero
    );

  // ==========================================
  // FILTRAR CHOFERES
  // ==========================================

  const soloChoferes = usuarios.filter((u) =>
    String(u.resolvedRole || "")
      .toLowerCase()
      .includes("chofer")
  );

  // ==========================================
  // CARGAR INFORMACIÓN
  // ==========================================

  const loadData = async () => {
    setIsLoading(true);
    setErrorMsg("");

    try {
      const [vehiculosData, usersData] = await Promise.all([
        getVehiculos(),
        getUsuariosConRol(),
      ]);

      const vList = Array.isArray(vehiculosData)
        ? vehiculosData
        : [];

      const uList = Array.isArray(usersData)
        ? usersData
        : [];

      // Ordenar poniendo primero a los usuarios con rol Chofer
      const sortedUsers = [...uList].sort((a, b) => {
        const aChofer = toSafeString(a.resolvedRole)
          .toLowerCase()
          .includes("chofer") ? 0 : 1;

        const bChofer = toSafeString(b.resolvedRole)
          .toLowerCase()
          .includes("chofer") ? 0 : 1;

        return aChofer - bChofer;
      });

      setVehiculos(vList);
      setUsuarios(sortedUsers);

      if (!editingId) {
        setIdUser("");
      }
    } catch (error) {
      console.error("Error al obtener vehículos:", error);

      setErrorMsg(
        `Error al obtener vehículos (${error.response?.status || "Red"})`
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // ==========================================
  // LIMPIAR FORMULARIO
  // ==========================================

  const resetForm = () => {
    setEditingId(null);
    setNumVehic("");
    setMarca("");
    setPlaca("");
    setIdUser("");
  };

  // ==========================================
  // EDITAR VEHÍCULO
  // ==========================================

  const handleEditClick = (v) => {
    setEditingId(getVehiculoId(v));

    setNumVehic(getNumVehiculo(v).slice(0, 5));

    setMarca(toSafeString(v?.marca));
    setPlaca(toSafeString(v?.placa));

    const assignedUser =
      v?.idUser ??
      v?.id_User ??
      v?.id_user ??
      v?.user?.idUser ??
      v?.user?.id ??
      "";

    setIdUser(String(assignedUser));

    setErrorMsg("");
    setSuccessMsg("");
  };

  // ==========================================
  // REGISTRAR / ACTUALIZAR VEHÍCULO
  // ==========================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    setErrorMsg("");
    setSuccessMsg("");

    const cleanNum = toSafeString(numVehic)
      .trim()
      .toUpperCase();

    const cleanMarca = toSafeString(marca).trim();

    const cleanPlaca = toSafeString(placa)
      .trim()
      .toUpperCase();

    const parsedUserId = parseInt(idUser, 10);

    if (!cleanNum || !cleanMarca || !cleanPlaca) {
      setErrorMsg(
        "Completa Número de Vehículo, Marca y Placa."
      );
      return;
    }

    if (cleanNum.length >= 6) {
      setErrorMsg(
        "El Número de Vehículo debe tener máximo 5 caracteres (ej. V002)."
      );
      return;
    }

    if (!parsedUserId || parsedUserId < 1) {
      setErrorMsg(
        "Selecciona un usuario con rol Chofer válido."
      );
      return;
    }

    setIsSaving(true);

    const payload = {
      numVehic: cleanNum,
      marca: cleanMarca,
      placa: cleanPlaca,
      idUser: parsedUserId,
    };

    try {
      if (editingId) {
        await updateVehiculo(editingId, payload);

        setSuccessMsg(
          "Vehículo actualizado correctamente."
        );
      } else {
        await createVehiculo(payload);

        setSuccessMsg(
          "Vehículo registrado correctamente."
        );
      }

      resetForm();
      await loadData();

    } catch (error) {
      console.error("Error al guardar vehículo:", error);

      const raw =
        error.response?.data?.message ||
        error.response?.data?.error;

      setErrorMsg(
        Array.isArray(raw)
          ? raw.join(" • ")
          : raw || "No se pudo guardar el vehículo."
      );
    } finally {
      setIsSaving(false);
    }
  };

  // ==========================================
  // ELIMINAR VEHÍCULO
  // ==========================================

  const handleDelete = async (v) => {
    const id = getVehiculoId(v);

    const label = `${getNumVehiculo(v) || "Unidad"} (${toSafeString(v?.placa, id)})`;

    if (!window.confirm(`¿Eliminar la unidad ${label}?`)) {
      return;
    }

    try {
      await deleteVehiculo(id);

      setSuccessMsg(`Unidad ${label} eliminada.`);

      if (editingId === id) {
        resetForm();
      }

      await loadData();

    } catch (error) {
      console.error("Error al eliminar:", error);

      setErrorMsg(
        "No se pudo eliminar el vehículo."
      );
    }
  };

  // ==========================================
  // ACTIVAR / DESACTIVAR VEHÍCULO
  // ==========================================

  const handleToggleEstatus = async (v) => {
    const id =
      v.idVehiculo ??
      v.id_Vehiculo ??
      v.id_vehiculo ??
      v.id;

    if (!id) {
      setErrorMsg("No se encontró el ID del vehículo.");
      return;
    }

    const activoActual = isVehiculoActivo(
      v.Estatus ?? v.estatus ?? v.estado
    );

    setErrorMsg("");
    setSuccessMsg("");

    try {
      await updateVehiculoEstatus(id, !activoActual);

      setSuccessMsg(
        `Unidad ${getNumVehiculo(v)} ${
          activoActual ? "desactivada" : "activada"
        } correctamente.`
      );

      await loadData();

    } catch (error) {
      console.error("Error al cambiar estatus:", error);

      const raw = error.response?.data?.message;

      setErrorMsg(
        Array.isArray(raw)
          ? raw.join(" • ")
          : raw || "No se pudo cambiar el estatus de la unidad."
      );
    }
  };

  // ==========================================
  // BUSCADOR
  // ==========================================

  const filteredVehiculos = vehiculos.filter((v) => {
    const query = toSafeString(searchTerm).toLowerCase();

    return (
      getNumVehiculo(v).toLowerCase().includes(query) ||
      toSafeString(v?.marca).toLowerCase().includes(query) ||
      toSafeString(v?.placa).toLowerCase().includes(query)
    );
  });

  const hasChoferes = soloChoferes.length > 0;

  // ==========================================
  // INTERFAZ
  // ==========================================

  return (
    <div className="space-y-5">

      {/* ENCABEZADO */}

      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-xl font-extrabold text-[#123254] tracking-tight">
          GESTIÓN DE VEHÍCULOS
        </h1>

        <p className="text-xs text-slate-500">
          Registro, actualización y control de unidades conectadas a /api/v1/vehiculos
        </p>
      </div>

      {/* MENSAJE DE ERROR */}

      {errorMsg && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-xs font-medium">
          {errorMsg}
        </div>
      )}

      {/* MENSAJE DE ÉXITO */}

      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl text-xs font-medium flex justify-between">
          <span>✓ {successMsg}</span>

          <button
            type="button"
            onClick={() => setSuccessMsg("")}
            className="font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* FORMULARIO DE REGISTRO / EDICIÓN */}

      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm">

        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">

          <div className="flex items-center gap-3">

            <h2 className="text-sm font-bold text-[#123254]">
              {editingId
                ? `Editando Unidad #${editingId}`
                : "Registrar Nueva Unidad"}
            </h2>

            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Estatus: Activo (automático)
            </span>

          </div>

          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="text-xs text-slate-500 hover:text-slate-800 underline"
            >
              Cancelar edición
            </button>
          )}

        </div>

        <form onSubmit={handleSubmit} className="space-y-4">

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

            {/* NÚMERO DE VEHÍCULO */}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Núm. de Vehículo (máx. 5) *
              </label>

              <input
                type="text"
                maxLength={5}
                placeholder="Ej. V002"
                value={numVehic}
                onChange={(e) => setNumVehic(e.target.value)}
                required
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 uppercase focus:outline-none focus:ring-2 focus:ring-[#123254]"
              />
            </div>

            {/* MARCA */}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Marca *
              </label>

              <input
                type="text"
                placeholder="Ej. Nissan"
                value={marca}
                onChange={(e) => setMarca(e.target.value)}
                required
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#123254]"
              />
            </div>

            {/* PLACA */}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Placa *
              </label>

              <input
                type="text"
                placeholder="Ej. HGO989A"
                value={placa}
                onChange={(e) => setPlaca(e.target.value)}
                required
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 uppercase focus:outline-none focus:ring-2 focus:ring-[#123254]"
              />
            </div>

            {/* CHOFER ASIGNADO */}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Chofer Asignado *
              </label>

              <select
                value={idUser}
                onChange={(e) => setIdUser(e.target.value)}
                required
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#123254]"
              >
                <option value="">
                  {soloChoferes.length > 0
                    ? "Selecciona un chofer..."
                    : "No hay choferes registrados (ve a Registro de Empleados)"}
                </option>

                {soloChoferes.map((c) => {
                  const cid =
                    c.idUser ??
                    c.id_User ??
                    c.id_user ??
                    c.id;

                  const nombreCompleto = [
                    c.Nombre ?? c.nombre,
                    c.ApellidoP ?? c.apellidoP,
                    c.ApellidoM ?? c.apellidoM,
                  ]
                    .filter((s) => s && s !== "N/A")
                    .join(" ");

                  return (
                    <option key={cid} value={cid}>
                      #{cid} - {nombreCompleto} ({c.resolvedRole})
                    </option>
                  );
                })}
              </select>
            </div>

          </div>

          {!hasChoferes && usuarios.length > 0 && (
            <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 px-3 py-2 rounded-lg">
              Aún no hay usuarios con el rol <strong>Chofer</strong>.
              Ve al apartado <strong>Choferes</strong> del menú lateral
              para registrar uno primero.
            </p>
          )}

          {/* BOTÓN GUARDAR */}

          <div>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2.5 rounded-xl bg-[#123254] hover:bg-[#1a4573] text-white text-xs font-semibold shadow-sm transition disabled:opacity-50"
            >
              {isSaving
                ? "Guardando..."
                : editingId
                ? "Actualizar Vehículo"
                : "Guardar Vehículo"}
            </button>
          </div>

        </form>
      </div>

      {/* TABLA DE VEHÍCULOS */}

      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm">

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">

          <div>
            <h2 className="text-sm font-bold text-[#123254]">
              Vehículos Registrados ({vehiculos.length})
            </h2>

            <p className="text-[11px] text-slate-400">
              Conectado a /api/v1/vehiculos
            </p>
          </div>

          {/* BUSCADOR */}

          <input
            type="text"
            placeholder="Buscar por unidad, marca o placa..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:w-72 px-3.5 py-2 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#123254]"
          />

        </div>

        {/* CARGANDO */}

        {isLoading ? (

          <div className="py-8 text-center text-xs text-slate-400">
            Cargando flota...
          </div>

        ) : filteredVehiculos.length === 0 ? (

          <div className="py-8 text-center text-xs text-slate-400">
            No hay vehículos para mostrar.
          </div>

        ) : (

          <div className="overflow-x-auto">

            <table className="w-full text-left border-collapse">

              <thead>
                <tr className="border-b border-slate-200 text-[10px] font-bold uppercase text-slate-400">

                  <th className="py-3 px-3">ID</th>

                  <th className="py-3 px-3">
                    NÚM. VEHÍCULO
                  </th>

                  <th className="py-3 px-3">MARCA</th>

                  <th className="py-3 px-3">PLACA</th>

                  <th className="py-3 px-3">ESTATUS</th>

                  <th className="py-3 px-3 text-right">
                    ACCIONES
                  </th>

                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 text-xs">

                {filteredVehiculos.map((v, idx) => {
                  const id = getVehiculoId(v) ?? idx + 1;

                  return (
                    <tr
                      key={id}
                      className="hover:bg-slate-50 transition"
                    >

                      {/* ID */}

                      <td className="py-3 px-3 text-slate-400 font-medium">
                        # {id}
                      </td>

                      {/* NÚMERO */}

                      <td className="py-3 px-3 font-bold text-[#123254]">
                        {getNumVehiculo(v) || "—"}
                      </td>

                      {/* MARCA */}

                      <td className="py-3 px-3 text-slate-700">
                        {toSafeString(v?.marca, "—")}
                      </td>

                      {/* PLACA */}

                      <td className="py-3 px-3 text-slate-700 font-medium">
                        {toSafeString(v?.placa, "—")}
                      </td>

                      {/* ESTATUS INTERACTIVO */}

                      <td className="py-3 px-3">
                        {(() => {
                          const activo = isVehiculoActivo(
                            v.Estatus ?? v.estatus ?? v.estado
                          );

                          return (
                            <button
                              type="button"
                              onClick={() => handleToggleEstatus(v)}
                              title="Haz clic para activar o desactivar la unidad"
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold transition cursor-pointer ${
                                activo
                                  ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 ring-1 ring-emerald-600/20"
                                  : "bg-rose-50 text-rose-700 hover:bg-rose-100 ring-1 ring-rose-600/20"
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  activo
                                    ? "bg-emerald-500"
                                    : "bg-rose-500"
                                }`}
                              />

                              {activo ? "Activo" : "Inactivo"}
                            </button>
                          );
                        })()}
                      </td>

                      {/* ACCIONES */}

                      <td className="py-3 px-3 text-right space-x-3">

                        <button
                          type="button"
                          onClick={() => handleEditClick(v)}
                          className="text-[#123254] font-semibold hover:underline"
                        >
                          Editar
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete(v)}
                          className="text-rose-600 font-semibold hover:underline"
                        >
                          Eliminar
                        </button>

                      </td>

                    </tr>
                  );
                })}

              </tbody>

            </table>

          </div>
        )}

      </div>

    </div>
  );
}
