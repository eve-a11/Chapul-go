import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import LoginForm from "../components/molecules/LoginForm";
import RegisterForm from "../components/molecules/RegisterForm";
import { loginUser, registerUser, registerAdmin } from "../services/authService";
import {
  decodeJwtPayload,
  isTokenValid,
  isAdminSession,
} from "../utils/authSession";

const SUPER_ADMINS = {
  "evelin@chapulgo.com": {
    nombre: "Evelin",
    apellidoP: "Admin",
    apellidoM: "Chapul",
    fechaNacimiento: "2000-01-01",
    idLocalidad: 1,
  },
  "fani@chapulgo.com": {
    nombre: "Fani",
    apellidoP: "Admin",
    apellidoM: "Chapul",
    fechaNacimiento: "2000-01-01",
    idLocalidad: 1,
  },
};

function CombiRouteLoader({ text = "Preparando tu ruta..." }) {
  return (
    <div className="my-4 flex flex-col items-center justify-center rounded-2xl border border-slate-200/80 bg-slate-50/90 px-6 py-8">
      <style>{`
        @keyframes combiCruise {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-4px) rotate(-1deg); }
        }
        @keyframes roadDash {
          0% { stroke-dashoffset: 24; }
          100% { stroke-dashoffset: 0; }
        }
      `}</style>

      <div className="relative flex h-28 w-28 items-center justify-center">
        <div className="absolute inset-0 animate-spin rounded-full border-[3px] border-slate-200 border-t-[#123254] border-r-sky-500 [animation-duration:1.6s]" />
        <div className="absolute inset-2.5 rounded-full border border-dashed border-sky-300/80" />

        <div
          className="relative flex flex-col items-center"
          style={{ animation: "combiCruise 1.1s ease-in-out infinite" }}
        >
          <svg
            className="h-14 w-16 drop-shadow-sm"
            viewBox="0 0 120 84"
            fill="none"
          >
            <path
              d="M18 34C18 24.0589 26.0589 16 36 16H86C95.9411 16 104 24.0589 104 34V40H18V34Z"
              fill="#F1F5F9"
              stroke="#123254"
              strokeWidth="2.5"
            />
            <path
              d="M16 38H104C106.209 38 108 39.7909 108 42V56C108 60.4183 104.418 64 100 64H22C17.5817 64 14 60.4183 14 56V42C14 39.7909 15.7909 38 18 38Z"
              fill="#123254"
            />
            <rect x="15" y="43" width="92" height="4.5" fill="#38BDF8" />
            <rect x="24" y="22" width="18" height="13" rx="3.5" fill="#BAE6FD" />
            <rect x="46" y="22" width="22" height="13" rx="3.5" fill="#BAE6FD" />
            <rect x="72" y="22" width="24" height="13" rx="4" fill="#E0F2FE" />
            <rect x="103" y="51" width="4" height="6" rx="2" fill="#FDE047" />
            <circle cx="36" cy="65" r="9.5" fill="#0F172A" />
            <circle cx="36" cy="65" r="4" fill="#E2E8F0" />
            <circle cx="85" cy="65" r="9.5" fill="#0F172A" />
            <circle cx="85" cy="65" r="4" fill="#E2E8F0" />
          </svg>

          <svg className="-mt-1 h-2 w-20" viewBox="0 0 80 6" fill="none">
            <line
              x1="4"
              y1="3"
              x2="76"
              y2="3"
              stroke="#0284C7"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeDasharray="6 6"
              style={{ animation: "roadDash 0.6s linear infinite" }}
            />
          </svg>
        </div>
      </div>

      <p className="mt-4 text-sm font-bold text-[#123254]">{text}</p>
      <p className="mt-0.5 text-xs text-slate-500">
        Conectando con Chapul-Go...
      </p>
    </div>
  );
}

export default function Login() {
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (isTokenValid()) {
      navigate(isAdminSession() ? "/admin" : "/public", { replace: true });
    }
  }, [navigate]);

  const extractToken = (response) => {
    if (typeof response === "string") return response;
    return (
      response?.access_token ||
      response?.token ||
      response?.accessToken ||
      response?.jwt ||
      response?.data?.access_token ||
      response?.data?.token ||
      response?.data?.accessToken ||
      null
    );
  };

  const formatApiError = (error, fallbackMsg) => {
    const rawMsg = error.response?.data?.message || error.response?.data?.error;
    if (Array.isArray(rawMsg)) {
      return rawMsg.map((item) => `• ${item}`).join("\n");
    }
    return rawMsg || fallbackMsg;
  };

  const resolveUserRole = (userObj, email, token) => {
    const payload = decodeJwtPayload(token) || {};
    const rawRole =
      userObj?.role?.name ||
      userObj?.role ||
      userObj?.rol?.nombre ||
      userObj?.rol ||
      payload?.rol?.nombre ||
      payload?.rol ||
      payload?.role ||
      "";
    const roleStr = String(rawRole).toLowerCase();
    const cleanEmail = (email || userObj?.email || payload?.email || "").toLowerCase();
    const idRol = Number(
      userObj?.idRol ?? userObj?.Id_Rol ?? userObj?.rol?.idRol ?? payload?.idRol ?? 0
    );

    if (
      roleStr === "usuario" ||
      roleStr === "pasajero" ||
      roleStr === "cliente" ||
      roleStr === "public" ||
      idRol === 3
    ) {
      return "user";
    }

    const isAdmin =
      roleStr.includes("admin") ||
      roleStr.includes("super") ||
      idRol === 1 ||
      idRol === 2 ||
      Boolean(SUPER_ADMINS[cleanEmail]);

    return isAdmin ? "admin" : "user";
  };

  const completeSession = (response, email) => {
    const token = extractToken(response);
    if (!token) {
      throw new Error("El servidor no devolvió un token de acceso válido.");
    }

    const payload = decodeJwtPayload(token) || {};
    const userObj = response?.user || response?.usuario || { email, ...payload };
    const finalRole = resolveUserRole(userObj, email, token);
    const savedProfile = { ...userObj, email, finalRole };

    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(savedProfile));
    localStorage.setItem("chapulgo_user", JSON.stringify(savedProfile));

    navigate(finalRole === "admin" ? "/admin" : "/public", { replace: true });
  };

  const handleLogin = async (credentials) => {
    setIsLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    const cleanEmail = credentials.email.trim().toLowerCase();

    try {
      const response = await loginUser({
        email: cleanEmail,
        password: credentials.password,
      });
      completeSession(response, cleanEmail);
    } catch (error) {
      const adminPreset = SUPER_ADMINS[cleanEmail];
      if (adminPreset && error.response) {
        try {
          await registerAdmin({
            ...adminPreset,
            email: cleanEmail,
            password: credentials.password,
          });
          const retryResponse = await loginUser({
            email: cleanEmail,
            password: credentials.password,
          });
          completeSession(retryResponse, cleanEmail);
          return;
        } catch (regErr) {
          console.error("Error al registrar SuperAdmin en backend:", regErr);
          setErrorMessage(
            formatApiError(regErr, "No se pudo autenticar la cuenta de administrador.")
          );
          return;
        }
      }

      setErrorMessage(
        formatApiError(error, "Credenciales incorrectas o error en el servidor.")
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (userData) => {
    setIsLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    const cleanEmail = (userData.email || userData.Email || "").trim().toLowerCase();
    const rawPassword = userData.password || userData.Password || "";

    try {
      const response = await registerUser({
        ...userData,
        email: cleanEmail,
      });

      let token = extractToken(response);
      let apiUser = response?.user || response?.usuario || {};

      if (!token && cleanEmail && rawPassword) {
        const loginResponse = await loginUser({
          email: cleanEmail,
          password: rawPassword,
        });
        token = extractToken(loginResponse);
        apiUser = loginResponse?.user || loginResponse?.usuario || apiUser;
      }

      const { password, Password, ...safeProfile } = userData;

      if (token) {
        const savedProfile = {
          ...safeProfile,
          ...apiUser,
          email: cleanEmail,
          finalRole: "user",
        };
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(savedProfile));
        localStorage.setItem("chapulgo_user", JSON.stringify(savedProfile));
        navigate("/public", { replace: true });
      } else {
        setIsRegisterMode(false);
        setSuccessMessage("¡Cuenta creada con éxito! Ahora inicia sesión con tus datos.");
      }
    } catch (error) {
      console.error("Error al registrar usuario:", error);
      setErrorMessage(
        formatApiError(error, "No se pudo completar el registro. Verifica tus datos.")
      );
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setIsRegisterMode(!isRegisterMode);
    setErrorMessage("");
    setSuccessMessage("");
  };

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-gradient-to-br from-[#08172c] via-[#0d2544] to-[#163a66] flex flex-col items-center justify-center px-4 py-8 sm:px-6">
      {/* Destellos decorativos */}
      <div className="pointer-events-none fixed -top-32 -left-32 h-96 w-96 rounded-full bg-sky-400/15 blur-3xl" />
      <div className="pointer-events-none fixed -bottom-32 -right-32 h-96 w-96 rounded-full bg-blue-500/15 blur-3xl" />

      {/* Tarjeta principal responsiva */}
      <div
        className={`relative z-10 my-auto w-full ${
          isRegisterMode ? "max-w-xl" : "max-w-md"
        } rounded-3xl border border-white/15 bg-white p-6 sm:p-8 shadow-[0_24px_60px_rgba(5,15,30,0.45)] transition-all duration-300`}
      >
        {/* Cabecera con círculo elegante */}
        <div className="text-center mb-6">
          <div className="relative mx-auto mb-3.5 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-[#0d2544] via-[#123254] to-[#1e5694] text-white shadow-lg shadow-[#123254]/25 ring-4 ring-sky-100 transition-transform duration-300 hover:scale-105">
            {/* Aro interior sutil */}
            <div className="absolute inset-1.5 rounded-full border border-white/15" />

            {/* Ícono moderno de combi frontal */}
            <svg
              className="relative h-10 w-10 text-white drop-shadow-sm"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.8}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect
                x="4"
                y="4"
                width="16"
                height="14"
                rx="4"
                fill="rgba(255,255,255,0.12)"
              />
              <path d="M4 10h16" />
              <path d="M12 4v6" strokeOpacity="0.65" />
              <path d="M2 8v3" />
              <path d="M22 8v3" />
              <circle cx="7.5" cy="14.5" r="1.1" fill="#38BDF8" stroke="none" />
              <circle cx="16.5" cy="14.5" r="1.1" fill="#38BDF8" stroke="none" />
              <path d="M10.5 14.5h3" stroke="#7DD3FC" />
              <path d="M7 18v2" strokeWidth={2.2} />
              <path d="M17 18v2" strokeWidth={2.2} />
            </svg>

            {/* Pin de ruta en la esquina del círculo */}
            <span className="absolute -bottom-0.5 -right-0.5 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-sky-500 text-white shadow-sm">
              <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                  clipRule="evenodd"
                />
              </svg>
            </span>
          </div>

          <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-sky-600">
            Chapul-Go
          </p>
          <h1 className="mt-1 text-xl sm:text-2xl font-extrabold tracking-tight text-[#0d2544]">
            {isRegisterMode ? "Crea tu cuenta de pasajero" : "Bienvenido de vuelta"}
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">
            {isRegisterMode
              ? "Completa tus datos para consultar rutas, paradas y horarios"
              : "Inicia sesión para consultar rutas o gestionar unidades"}
          </p>
        </div>

        {successMessage && (
          <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-700">
            {successMessage}
          </div>
        )}

        {isLoading ? (
          <CombiRouteLoader
            text={
              isRegisterMode
                ? "Creando tu cuenta y abordando..."
                : "Iniciando sesión..."
            }
          />
        ) : isRegisterMode ? (
          <RegisterForm
            onSubmit={handleRegister}
            isLoading={isLoading}
            error={errorMessage}
          />
        ) : (
          <LoginForm
            onSubmit={handleLogin}
            isLoading={isLoading}
            error={errorMessage}
          />
        )}

        {/* Pie para alternar entre Login y Registro */}
        <div className="mt-6 border-t border-slate-100 pt-5 text-center text-xs sm:text-sm text-slate-600">
          {isRegisterMode ? (
            <>
              ¿Ya tienes una cuenta?{" "}
              <button
                type="button"
                onClick={toggleMode}
                className="font-bold text-[#123254] hover:text-sky-600 hover:underline transition"
              >
                Inicia sesión
              </button>
            </>
          ) : (
            <>
              ¿Eres nuevo pasajero?{" "}
              <button
                type="button"
                onClick={toggleMode}
                className="font-bold text-[#123254] hover:text-sky-600 hover:underline transition"
              >
                Crear una cuenta
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}