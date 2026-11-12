import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import LoginForm from "../components/molecules/LoginForm";
import RegisterForm from "../components/molecules/RegisterForm";
import { loginUser, registerUser, registerAdmin } from "../services/authService";

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

export default function Login() {
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const navigate = useNavigate();

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

  const resolveUserRole = (userObj, email) => {
    const rawRole =
      userObj?.role?.name ||
      userObj?.role ||
      userObj?.rol?.nombre ||
      userObj?.rol ||
      "";
    const roleStr = String(rawRole).toLowerCase();
    const cleanEmail = (email || userObj?.email || "").toLowerCase();

    const isAdmin =
      roleStr.includes("admin") ||
      roleStr.includes("super") ||
      Boolean(SUPER_ADMINS[cleanEmail]);

    return isAdmin ? "admin" : "user";
  };

  const completeSession = (response, email) => {
    const token = extractToken(response);
    if (!token) {
      throw new Error("El servidor no devolvió un token de acceso válido.");
    }

    const userObj = response?.user || response?.usuario || { email };
    const finalRole = resolveUserRole(userObj, email);

    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify({ ...userObj, finalRole }));

    navigate(finalRole === "admin" ? "/admin" : "/public");
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
      // Si es una cuenta SuperAdmin y aún no existe en la BD del servidor, la creamos vía /auth/registerAdmin
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

    try {
      const response = await registerUser(userData);
      const token = extractToken(response);
      const { password, ...safeProfile } = userData;

      if (token) {
        const apiUser = response?.user || response?.usuario || {};
        localStorage.setItem("token", token);
        localStorage.setItem(
          "user",
          JSON.stringify({ ...safeProfile, ...apiUser, finalRole: "user" })
        );
        navigate("/public");
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
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-2xl w-full max-w-md text-center">
        <div className="w-16 h-16 bg-blue-600/10 text-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl border border-blue-500/20">
          🚌
        </div>

        <h1 className="text-2xl font-bold text-white mb-1">Chapul-Go</h1>
        <p className="text-slate-400 text-sm mb-6">
          {isRegisterMode
            ? "Crea tu cuenta de pasajero para consultar rutas y horarios"
            : "Inicia sesión en el Sistema de Transporte"}
        </p>

        {successMessage && (
          <div className="bg-emerald-500/10 border border-emerald-500/50 text-emerald-400 p-3 rounded-xl text-xs text-left mb-4">
            {successMessage}
          </div>
        )}

        {isRegisterMode ? (
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

        <div className="mt-6 text-sm text-slate-400">
          {isRegisterMode ? (
            <>
              ¿Ya tienes una cuenta?{" "}
              <button
                type="button"
                onClick={toggleMode}
                className="text-blue-400 hover:text-blue-300 font-medium hover:underline"
              >
                Inicia sesión
              </button>
            </>
          ) : (
            <>
              ¿Eres nuevo usuario?{" "}
              <button
                type="button"
                onClick={toggleMode}
                className="text-blue-400 hover:text-blue-300 font-medium hover:underline"
              >
                Crear una cuenta
              </button>
            </>
          )}
        </div>

        <div className="mt-5 pt-5 border-t border-slate-800">
          <Link to="/public" className="text-xs text-slate-500 hover:text-blue-400 transition">
            ← Continuar sin cuenta (Vista pública general)
          </Link>
        </div>
      </div>
    </div>
  );
}