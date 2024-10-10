import React, { useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { RiMailLine, RiLockLine, RiEyeLine, RiEyeOffLine } from "react-icons/ri";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Swal from 'sweetalert2';
import { useWebSocket } from '../../pages/admin/WebSocketContext';
import {message} from 'antd';
const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const apiUrl = import.meta.env.VITE_API_URL.trim();
  const socket = useWebSocket();

  const handleLogin = async (event) => {
    event.preventDefault();

    try {
      const response = await axios.post(`${apiUrl}/auth/login`, {
        username,
        password
      });
      const { access_token, user } = response.data;

      // Guardar los datos del usuario en localStorage
      localStorage.setItem("id", user.id);
      localStorage.setItem("token", access_token);
      localStorage.setItem("nombre", user.name);
      localStorage.setItem("email", user.email);
      localStorage.setItem("role", user.role);

      // Emitir roles por WebSocket una vez que el usuario inicie sesión exitosamente
      if (socket) {
        socket.emit('setRoles', [user.role]);
      }

      // Mostrar notificación de éxito
      Swal.fire({
        title: '¡Usuario Conectado!',
        text: 'Bienvenido',
        icon: 'success',
        confirmButtonText: 'Aceptar'
      });

      // Redirigir al usuario a la página principal
      navigate("/");

    } catch (error) {
      message.error(error.response?.data?.message?.message || 'Error de inicio de sesión');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-login-background2 bg-no-repeat bg-size-cover bg-position-center bg-opacity-10">
      <div className="bg-opacity-80 bg-secondary-100 p-8 rounded-xl shadow-2xl w-auto lg:w-[450px]">
        <h1 className="text-3xl text-center uppercase font-bold tracking-[5px] text-white mb-8">
          Iniciar <span className="text-primary">sesión</span>
        </h1>
        <form className="mb-8" onSubmit={handleLogin}>
          <div className="relative mb-4">
            <RiMailLine className="absolute top-1/2 -translate-y-1/2 left-2 text-primary" />
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="py-3 pl-8 pr-4 bg-secondary-900 w-full outline-none rounded-lg text-emi_azul"
              placeholder="Username"
              required
            />
          </div>
          <div className="relative mb-8">
            <RiLockLine className="absolute top-1/2 -translate-y-1/2 left-2 text-primary" />
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="py-3 px-8 bg-secondary-900 w-full outline-none rounded-lg text-emi_azul"
              placeholder="Contraseña"
              required
            />
            {showPassword ? (
              <RiEyeOffLine
                onClick={() => setShowPassword(!showPassword)}
                className="absolute top-1/2 -translate-y-1/2 right-2 hover:cursor-pointer text-primary"
              />
            ) : (
              <RiEyeLine
                onClick={() => setShowPassword(!showPassword)}
                className="absolute top-1/2 -translate-y-1/2 right-2 hover:cursor-pointer text-primary"
              />
            )}
          </div>
          <button
            type="submit"
            className="bg-primary text-emi_azul uppercase font-bold text-sm w-full py-3 px-4 rounded-lg"
          >
            Ingresar
          </button>
        </form>
        <div className="flex flex-col items-center gap-4">
          <Link
            to="/olvide-password"
            className="hover:text-primary transition-colors"
          >
            ¿Olvidaste tu contraseña?
          </Link>
          
        </div>
      </div>
    </div>
  );
};

export default Login;
