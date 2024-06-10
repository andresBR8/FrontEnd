import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { RiLockPasswordLine } from "react-icons/ri";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const ResetPassword = () => {
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const query = new URLSearchParams(location.search);
    const tokenFromUrl = query.get("token");
    if (tokenFromUrl) {
      setToken(tokenFromUrl);
    } else {
      toast.error("No se encontró el token.");
      navigate("/login");
    }
  }, [location, navigate]);

  const handlePasswordChange = (e) => {
    setNewPassword(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        token: token,
        newPassword: newPassword
      };

      const response = await axios.post('http://192.168.100.48:5075/api/Users/reset-password', payload, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      if (response.status === 200) {
        toast.success('Contraseña actualizada correctamente. Serás redirigido al login.');
        setTimeout(() => navigate('/login'), 5000);
      } else {
        toast.error('No se pudo actualizar la contraseña. Por favor intenta de nuevo.');
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al actualizar la contraseña.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-login-background2 bg-no-repeat bg-size-cover bg-position-center bg-opacity-10">
      <ToastContainer position="top-center" autoClose={5000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />
      <div className="bg-secondary-100 p-8 rounded-xl shadow-2xl w-auto lg:w-[450px]">
        <h1 className="text-3xl text-center uppercase font-bold tracking-[5px] text-white mb-8">
          Restablecer <span className="text-primary">contraseña</span>
        </h1>
        <form className="mb-8" onSubmit={handleSubmit}>
          <div className="relative mb-8 text-emi_azul">
            <RiLockPasswordLine className="absolute top-1/2 -translate-y-1/2 left-2 text-primary" />
            <input
              type="password"
              value={newPassword}
              onChange={handlePasswordChange}
              className="py-3 pl-8 pr-4 bg-secondary-900 w-full outline-none rounded-lg"
              placeholder="Nueva contraseña"
              required
              disabled={isSubmitting}
            />
          </div>
          <div>
            <button
              type="submit"
              className="bg-primary text-black uppercase font-bold text-sm w-full py-3 px-4 rounded-lg"
              disabled={isSubmitting}
            >
              Restablecer contraseña
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
