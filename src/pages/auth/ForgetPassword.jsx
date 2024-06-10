import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { RiMailLine } from "react-icons/ri";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const ForgetPassword = () => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    setEmail(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const response = await axios.post('http://192.168.100.48:5075/api/Users/request-reset-password', JSON.stringify(email), {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 200) {
        toast.success('Instrucciones enviadas! Por favor revisa tu correo electrónico.');
        setTimeout(() => {
          toast.info('Redirigiendo al login...');
          setTimeout(() => navigate('/login'), 5000);
        }, 2000);
      } else {
        toast.error('Hubo un problema al enviar el correo. Por favor intenta de nuevo.');
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error enviando las instrucciones.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-login-background2 bg-no-repeat bg-size-cover bg-position-center bg-opacity-10">
      <ToastContainer position="top-center" autoClose={5000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />
      <div className="bg-secondary-100 p-8 rounded-xl shadow-2xl w-auto lg:w-[450px]">
        <h1 className="text-3xl text-center uppercase font-bold tracking-[5px] text-white mb-8">
          Recuperar <span className="text-primary">contraseña</span>
        </h1>
        <form className="mb-8" onSubmit={handleSubmit}>
          <div className="relative mb-8 text-emi_azul">
            <RiMailLine className="absolute top-1/2 -translate-y-1/2 left-2 text-primary" />
            <input
              type="email"
              value={email}
              onChange={handleInputChange}
              className="py-3 pl-8 pr-4 bg-secondary-900 w-full outline-none rounded-lg"
              placeholder="Correo electrónico"
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
              Enviar instrucciones
            </button>
          </div>
        </form>
        <div className="flex flex-col items-center gap-4">
          <span className="flex items-center gap-2">
            ¿Ya tienes cuenta?{" "}
            <Link
              to="/login"
              className="text-primary hover:text-gray-100 transition-colors"
            >
              Ingresa
            </Link>
          </span>
          <span className="flex items-center gap-2">
            ¿No tienes cuenta?{" "}
            <Link
              to="/registro"
              className="text-primary hover:text-gray-100 transition-colors"
            >
              Registrate
            </Link>
          </span>
        </div>
      </div>
    </div>
  );
};

export default ForgetPassword;
