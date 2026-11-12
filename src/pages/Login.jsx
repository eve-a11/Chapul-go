import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import LoginForm from "../components/molecules/LoginForm";
import { loginUser } from "../services/authService";

export default function Login() {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (credentials) => {
    setIsLoading(true);
    setErrorMessage("");

    try {
      console.log("Enviando credenciales:", credentials);
      const response = await loginUser(credentials);
      console.log("Respuesta de la API:", response);

      // Extraer token de sesión
      const token = response?.token || response?.accessToken || response?.data?.token || "session-token-admin";
      const userObj = response?.user || response?.usuario || { email: credentials.email };

      // Guardar información en localStorage
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify({ ...userObj, finalRole: "admin" }));

      // Redirigir al panel de administración
      navigate("/admin");

    } catch (error) {
      console.error("Error al iniciar sesión:", error);

      const apiMsg = error.response?.data?.message || error.message || "Error al conectar con la API.";
      setErrorMessage(`Error: ${apiMsg}`);
      
      // Respaldo con credenciales de prueba
      if (
        (credentials.email === "evelin@chapulgo.com" && credentials.password === "Evelinda123!") ||
        (credentials.email === "fani@chapulgo.com" && credentials.password === "FaniOs123!")
      ) {
        localStorage.setItem("token", "superadmin-local-token");
        localStorage.setItem(
          "user",
          JSON.stringify({ email: credentials.email, finalRole: "admin" })
        );
        navigate("/admin");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-2xl w-full max-w-md text-center">
        <div className="w-16 h-16 bg-blue-600/10 text-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl border border-blue-500/20">
          🚌
        </div>
        
        <h1 className="text-2xl font-bold text-white mb-1">Chapul-Go</h1>
        <p className="text-slate-400 text-sm mb-6">Acceso al Sistema de Transporte</p>

        <LoginForm onSubmit={handleLogin} isLoading={isLoading} error={errorMessage} />

        <div className="mt-6 pt-6 border-t border-slate-800">
          <Link to="/public" className="text-sm text-slate-400 hover:text-blue-400 transition">
            ← Entrar como visitante / Vista pública
          </Link>
        </div>
      </div>
    </div>
  );
}