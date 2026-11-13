import { useState, useEffect } from "react";
import { getLocalidades } from "../../services/authService";

export default function RegisterForm({ onSubmit, isLoading = false, error = "" }) {
  const [nombre, setNombre] = useState("");
  const [apellidoP, setApellidoP] = useState("");
  const [apellidoM, setApellidoM] = useState("");
  const [fechaNacimiento, setFechaNacimiento] = useState("");
  const [idLocalidad, setIdLocalidad] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [localError, setLocalError] = useState("");
  const [localidades, setLocalidades] = useState([]);

  useEffect(() => {
    let active = true;
    const fetchLocalidades = async () => {
      try {
        const list = await getLocalidades();
        if (active && Array.isArray(list) && list.length > 0) {
          setLocalidades(list);
        }
      } catch {
        // Si la API requiere token previo, se mantiene el campo numérico sin bloquear
      }
    };
    fetchLocalidades();
    return () => {
      active = false;
    };
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLocalError("");

    if (password.length < 6) {
      setLocalError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      setLocalError("Las contraseñas no coinciden. Verifícalas por favor.");
      return;
    }

    if (onSubmit) {
      onSubmit({
        nombre: nombre.trim(),
        apellidoP: apellidoP.trim(),
        apellidoM: apellidoM.trim(),
        fechaNacimiento,
        idLocalidad: Number(idLocalidad) || 1,
        email: email.trim().toLowerCase(),
        password,
      });
    }
  };

  // Mantiene los campos claros incluso cuando el navegador autocompleta
  const autofillFix =
    "[&:-webkit-autofill]:shadow-[inset_0_0_0px_1000px_#f8fafc] [&:-webkit-autofill]:[-webkit-text-fill-color:#0f172a]";

  const baseInputClass = `w-full rounded-xl border border-slate-200 bg-slate-50/80 py-2.5 px-3.5 text-sm font-medium text-slate-900 placeholder-slate-400 outline-none transition-all duration-200 focus:border-[#123254] focus:bg-white focus:ring-4 focus:ring-[#123254]/10 ${autofillFix}`;

  const displayError = localError || error;

  return (
    <form onSubmit={handleSubmit} className="space-y-3.5 text-left">
      {displayError && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs sm:text-sm font-medium text-rose-700 whitespace-pre-line">
          {displayError}
        </div>
      )}

      {/* Nombre(s) */}
      <div className="space-y-1">
        <label className="block text-xs font-bold uppercase tracking-wide text-slate-600">
          Nombre(s)
        </label>
        <input
          type="text"
          required
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Ej. Evelyn"
          className={baseInputClass}
        />
      </div>

      {/* Apellido Paterno y Materno */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <div className="space-y-1">
          <label className="block text-xs font-bold uppercase tracking-wide text-slate-600">
            Apellido Paterno
          </label>
          <input
            type="text"
            required
            value={apellidoP}
            onChange={(e) => setApellidoP(e.target.value)}
            placeholder="Ej. García"
            className={baseInputClass}
          />
        </div>

        <div className="space-y-1">
          <label className="block text-xs font-bold uppercase tracking-wide text-slate-600">
            Apellido Materno
          </label>
          <input
            type="text"
            required
            value={apellidoM}
            onChange={(e) => setApellidoM(e.target.value)}
            placeholder="Ej. López"
            className={baseInputClass}
          />
        </div>
      </div>

      {/* Fecha de nacimiento y Localidad */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <div className="space-y-1">
          <label className="block text-xs font-bold uppercase tracking-wide text-slate-600">
            Fecha de nacimiento
          </label>
          <div className="relative">
            <input
              type="date"
              required
              value={fechaNacimiento}
              onChange={(e) => setFechaNacimiento(e.target.value)}
              className={`${baseInputClass} [color-scheme:light] cursor-pointer`}
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="block text-xs font-bold uppercase tracking-wide text-slate-600">
            Localidad
          </label>
          {localidades.length > 0 ? (
            <select
              required
              value={idLocalidad}
              onChange={(e) => setIdLocalidad(e.target.value)}
              className={`${baseInputClass} cursor-pointer`}
            >
              <option value="">Selecciona tu localidad</option>
              {localidades.map((loc, idx) => {
                const id = loc.idLocalidad ?? loc.Id_Localidad ?? loc.id ?? idx + 1;
                const label =
                  loc.nombreLocalidad ??
                  loc.Nombre ??
                  loc.nombre ??
                  `Localidad ${id}`;
                return (
                  <option key={id} value={id}>
                    {label}
                  </option>
                );
              })}
            </select>
          ) : (
            <input
              type="number"
              min="1"
              required
              value={idLocalidad}
              onChange={(e) => setIdLocalidad(e.target.value)}
              placeholder="Clave de localidad (ej. 1)"
              className={baseInputClass}
            />
          )}
        </div>
      </div>

      {/* Correo electrónico */}
      <div className="space-y-1">
        <label className="block text-xs font-bold uppercase tracking-wide text-slate-600">
          Correo electrónico
        </label>
        <div className="relative group">
          <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-slate-400 transition-colors group-focus-within:text-[#123254]">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
            </svg>
          </span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="correo@ejemplo.com"
            className={`${baseInputClass} pl-10`}
          />
        </div>
      </div>

      {/* Contraseña y Confirmar contraseña */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <div className="space-y-1">
          <label className="block text-xs font-bold uppercase tracking-wide text-slate-600">
            Contraseña
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              className={`${baseInputClass} pr-10`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-3 flex items-center text-slate-400 transition hover:text-[#123254]"
              title={showPassword ? "Ocultar" : "Ver contraseña"}
            >
              {showPassword ? (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              ) : (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>
        </div>

        <div className="space-y-1">
          <label className="block text-xs font-bold uppercase tracking-wide text-slate-600">
            Confirmar contraseña
          </label>
          <div className="relative">
            <input
              type={showConfirmPassword ? "text" : "password"}
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repite tu contraseña"
              className={`${baseInputClass} pr-10`}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute inset-y-0 right-3 flex items-center text-slate-400 transition hover:text-[#123254]"
              title={showConfirmPassword ? "Ocultar" : "Ver contraseña"}
            >
              {showConfirmPassword ? (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              ) : (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Botón Crear Cuenta */}
      <button
        type="submit"
        disabled={isLoading}
        className="group relative mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-[#123254] px-4 py-3 text-sm font-bold text-white shadow-md shadow-[#123254]/20 transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#1a4573] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <span>{isLoading ? "Creando cuenta..." : "Crear Cuenta"}</span>
        <svg
          className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
        </svg>
      </button>
    </form>
  );
}