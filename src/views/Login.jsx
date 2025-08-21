import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLoginMutation } from "../hooks/useLoginMutation";
import '../index.css'; // importa las clases anteriores

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [validationError, setValidationError] = useState("");
  const navigate = useNavigate();

  const loginMutation = useLoginMutation((data) => {
    if (data.token) {
      localStorage.setItem("token", data.token);
      // Add small delay to ensure token is stored
      setTimeout(() => {
        navigate("/productos", { replace: true });
      }, 100);
    }
  });

  const validateForm = () => {
    if (!username.trim()) {
      setValidationError("El usuario es requerido");
      return false;
    }
    if (!password.trim()) {
      setValidationError("La contraseña es requerida");
      return false;
    }
    setValidationError("");
    return true;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Debug point', { username, password }); // Punto de depuración
    if (!validateForm()) return;
    loginMutation.mutate({ username, password });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Iniciar sesión
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <input
                type="text"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Usuario"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div>
              <input
                type="password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {validationError && (
            <div className="text-red-500 text-sm text-center">
              {validationError}
            </div>
          )}

          {loginMutation.error && (
            <div className="text-red-500 text-sm text-center">
              {loginMutation.error instanceof Error 
                ? loginMutation.error.message 
                : 'Error al iniciar sesión'}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loginMutation.isLoading}
              className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white ${
                loginMutation.isLoading
                  ? "bg-indigo-300 cursor-not-allowed"
                  : "bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              }`}
            >
              {loginMutation.isLoading ? "Ingresando..." : "Ingresar"}
            </button>
          </div>
        </form>
        <div className="text-center">
          <p className="text-sm text-gray-600">
            ¿No tienes una cuenta?{" "}
            <a
              href="/register"
              className="font-medium text-indigo-600 hover:text-indigo-500"
            >
              Regístrate aquí
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}