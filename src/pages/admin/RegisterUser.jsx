import React, { useState } from "react";
import { RiMailLine, RiLockLine, RiEyeLine, RiEyeOffLine, RiUserLine, RiCloseLine } from "react-icons/ri";

const RegisterUser = ({ onClose }) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="flex items-center justify-center p-4">
      <div className="relative bg-secondary-100 p-8 rounded-3xl shadow-2xl w-auto lg:w-[450px]">
        <button
          onClick={onClose}
          className="absolute top-0 right-0 text-2xl p-2 text-primary hover:text-white"
          aria-label="Cerrar"
        >
          <RiCloseLine />
        </button>
        <h1 className="text-3xl text-center uppercase font-bold tracking-[5px] text-white mb-8">
          Registrar <span className="text-primary">Usuario</span>
        </h1>
        <form className="mb-8">
          <div className="relative mb-4">
            <RiUserLine className="absolute top-1/2 -translate-y-1/2 left-2 text-primary" />
            <input
              type="text"
              className="py-2 pl-8 pr-4 bg-secondary-900 w-full outline-none rounded-lg text-emi_azul"
              placeholder="Nombre(s)"
            />
          </div>
          <div className="relative mb-4">
            <RiUserLine className="absolute top-1/2 -translate-y-1/2 left-2 text-primary" />
            <input
              type="text"
              className="py-2 pl-8 pr-4 bg-secondary-900 w-full outline-none rounded-lg text-emi_azul"
              placeholder="Apellidos"
            />
          </div>
          <div className="relative mb-4">
            <RiMailLine className="absolute top-1/2 -translate-y-1/2 left-2 text-primary" />
            <input
              type="email"
              className="py-2 pl-8 pr-4 bg-secondary-900 w-full outline-none rounded-lg text-emi_azul"
              placeholder="Correo electrónico"
            />
          </div>
          <div className="relative mb-4">
            <RiLockLine className="absolute top-1/2 -translate-y-1/2 left-2 text-primary" />
            <input
              type={showPassword ? "text" : "password"}
              className="py-2 px-8 bg-secondary-900 w-full outline-none rounded-lg text-emi_azul"
              placeholder="Contraseña"
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
          <div className="relative mb-8">
            <RiLockLine className="absolute top-1/2 -translate-y-1/2 left-2 text-primary" />
            <input
              type={showPassword ? "text" : "password"}
              className="py-2 px-8 bg-secondary-900 w-full outline-none rounded-lg text-emi_azul"
              placeholder="Confirmar contraseña"
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
          <div>
            <button
              type="submit"
              className="bg-primary text-black uppercase font-bold text-sm w-full py-3 px-4 rounded-lg"
            >
              Registrar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegisterUser;
