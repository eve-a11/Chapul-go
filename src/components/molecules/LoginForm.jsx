import { useState } from "react";
import Input from "../atoms/Input";
import Button from "../atoms/Button";

export default function LoginForm({ onSubmit, isLoading, error }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault(); // Evita que la página se recargue
    if (!email || !password) return;
    onSubmit({ email, password });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 w-full">
      {error && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-xl text-xs text-left">
          {error}
        </div>
      )}

      <Input
        label="Correo electrónico"
        type="email"
        placeholder="evelin@chapulgo.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />

      <Input
        label="Contraseña"
        type="password"
        placeholder="••••••••"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />

      <Button type="submit" variant="primary" disabled={isLoading}>
        {isLoading ? "Iniciando sesión..." : "Iniciar Sesión"}
      </Button>
    </form>
  );
}