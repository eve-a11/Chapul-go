import { useState, useEffect } from "react";
import Input from "../atoms/Input";
import Button from "../atoms/Button";
import { getLocalidades } from "../../services/authService";

export default function RegisterForm({ onSubmit, isLoading, error }) {
  const [nombre, setNombre] = useState("");
  const [apellidoP, setApellidoP] = useState("");
  const [apellidoM, setApellidoM] = useState("");
  const [fechaNacimiento, setFechaNacimiento] = useState("");
  const [idLocalidad, setIdLocalidad] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [localidades, setLocalidades] = useState([]);
  const [loadingLocalidades, setLoadingLocalidades] = useState(true);
  const [localError, setLocalError] = useState("");

  useEffect(() => {
    const fetchLocalidades = async () => {
      try {
        const res = await getLocalidades();
        console.log("Respuesta de /localidades:", res);

        const list = Array.isArray(res)
          ? res
          : Array.isArray(res?.data)
          ? res.data
          : Array.isArray(res?.localidades)
          ? res.localidades
          : Array.isArray(res?.data?.localidades)
          ? res.data.localidades
          : [];

        setLocalidades(list);
      } catch (err) {
        console.warn("No se pudo cargar /localidades (posible 401 sin token):", err.response?.status);
      } finally {
        setLoadingLocalidades(false);
      }
    };

    fetchLocalidades();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLocalError("");

    if (apellidoP.trim().length < 2 || apellidoM.trim().length < 2) {
      setLocalError("Los apellidos deben tener al menos 2 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      setLocalError("Las contraseñas no coinciden.");
      return;
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
    if (!passwordRegex.test(password)) {
      setLocalError(
        "La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula, un número y un símbolo (ej. Pasajero123!)."
      );
      return;
    }

    const localidadNum = parseInt(idLocalidad, 10);
    if (!localidadNum || localidadNum < 1) {
      setLocalError("Selecciona o ingresa una localidad válida.");
      return;
    }

    onSubmit({
      nombre: nombre.trim(),
      apellidoP: apellidoP.trim(),
      apellidoM: apellidoM.trim(),
      fechaNacimiento,
      idLocalidad: localidadNum,
      email: email.trim(),
      password,
    });
  };

  const displayError = localError || error;

  return (
    <form onSubmit={handleSubmit} className="space-y-3.5 w-full text-left">
      {displayError && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-xl text-xs whitespace-pre-line">
          {displayError}
        </div>
      )}

      <Input
        label="Nombre(s)"
        type="text"
        placeholder="Ej. Evelyn"
        value={nombre}
        onChange={(e) => setNombre(e.target.value)}
        required
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Input
          label="Apellido Paterno"
          type="text"
          placeholder="Ej. García"
          value={apellidoP}
          onChange={(e) => setApellidoP(e.target.value)}
          required
        />

        <Input
          label="Apellido Materno"
          type="text"
          placeholder="Ej. López"
          value={apellidoM}
          onChange={(e) => setApellidoM(e.target.value)}
          required
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Input
          label="Fecha de nacimiento"
          type="date"
          value={fechaNacimiento}
          onChange={(e) => setFechaNacimiento(e.target.value)}
          required
        />

        <div className="flex flex-col gap-1.5 w-full">
          <label className="text-sm font-medium text-slate-300">Localidad</label>
          {localidades.length > 0 ? (
            <select
              value={idLocalidad}
              onChange={(e) => setIdLocalidad(e.target.value)}
              required
              className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            >
              <option value="">Selecciona tu localidad...</option>
              {localidades.map((loc) => {
                const id = loc.idLocalidad ?? loc.id_localidad ?? loc.id;
                const label =
                  loc.nombre ??
                  loc.nombreLocalidad ??
                  loc.nombre_localidad ??
                  loc.localidad ??
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
              placeholder={loadingLocalidades ? "Cargando..." : "Clave de localidad (ej. 1)"}
              value={idLocalidad}
              onChange={(e) => setIdLocalidad(e.target.value)}
              required
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            />
          )}
        </div>
      </div>

      <Input
        label="Correo electrónico"
        type="email"
        placeholder="usuario@correo.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />

      <Input
        label="Contraseña"
        type="password"
        placeholder="Ej. Pasajero123!"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />

      <Input
        label="Confirmar contraseña"
        type="password"
        placeholder="Repite tu contraseña"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        required
      />

      <div className="pt-1">
        <Button type="submit" variant="primary" disabled={isLoading}>
          {isLoading ? "Creando cuenta..." : "Crear Cuenta"}
        </Button>
      </div>
    </form>
  );
}