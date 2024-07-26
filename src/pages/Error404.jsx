import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';

const Error404 = () => {
  const navigate = useNavigate();

  useEffect(() => {
    Swal.fire({
      icon: 'error',
      title: 'Oops...',
      text: 'Página no encontrada. Serás redirigido al login en 5 segundos.',
      timer: 5000,
      timerProgressBar: true,
      didClose: () => {
        navigate('/login');
      }
    });
  }, [navigate]);

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-secondary-100">
      <div className="text-center">
        <h1 className="text-9xl font-bold text-emi_amarillo">404</h1>
        <p className="text-2xl text-white mt-4">Página no encontrada</p>
        <p className="text-lg text-gray-400 mt-2">Lo sentimos, la página que estás buscando no existe.</p>
        <button 
          onClick={() => navigate('/login')}
          className="mt-8 px-4 py-2 bg-emi_amarillo text-emi_azul font-bold rounded-lg hover:bg-emi_azul hover:text-emi_amarillo transition-colors"
        >
          Ir al Login
        </button>
      </div>
    </div>
  );
};

export default Error404;
