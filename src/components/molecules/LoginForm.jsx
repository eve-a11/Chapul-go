import { useState } from "react";

export default function LoginForm({ onSubmit, isLoading = false, error = "" }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSubmit) {
      onSubmit({ email: email.trim(), password });
    }
  };

  // Mantiene el fondo claro y texto oscuro aunque el navegador autocomplete
  const autofillFix =
    "[&:-webkit-autofill]:shadow-[inset_0_0_0px_1000px_#f8fafc] [&:-webkit-autofill]:[-webkit-text-fill-color:#0f172a]";

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-left">
      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs sm:text-sm font-medium text-rose-700 whitespace-pre-line">
          {error}
        </div>
      )}

      {/* Correo electrónico */}
      <div className="space-y-1.5">
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
            placeholder="nombre@chapulgo.com"
            className={`w-full rounded-xl border border-slate-200 bg-slate-50/80 py-2.5 pl-10 pr-3.5 text-sm font-medium text-slate-900 placeholder-slate-400 outline-none transition-all duration-200 focus:border-[#123254] focus:bg-white focus:ring-4 focus:ring-[#123254]/10 ${autofillFix}`}
          />
        </div>
      </div>

      {/* Contraseña */}
      <div className="space-y-1.5">
        <label className="block text-xs font-bold uppercase tracking-wide text-slate-600">
          Contraseña
        </label>
        <div className="relative group">
          <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-slate-400 transition-colors group-focus-within:text-[#123254]">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </span>
          <input
            type={showPassword ? "text" : "password"}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••••••"
            className={`w-full rounded-xl border border-slate-200 bg-slate-50/80 py-2.5 pl-10 pr-10 text-sm font-medium text-slate-900 placeholder-slate-400 outline-none transition-all duration-200 focus:border-[#123254] focus:bg-white focus:ring-4 focus:ring-[#123254]/10 ${autofillFix}`}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-3 flex items-center text-slate-400 transition hover:text-[#123254]"
            title={showPassword ? "Ocultar contraseña" : "Ver contraseña"}
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

      {/* Botón principal */}
      <button
        type="submit"
        disabled={isLoading}
        className="group relative mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-[#123254] px-4 py-3 text-sm font-bold text-white shadow-md shadow-[#123254]/20 transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#1a4573] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <span>{isLoading ? "Iniciando sesión..." : "Iniciar sesión"}</span>
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