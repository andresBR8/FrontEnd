import React, { useState, useEffect } from "react";
import { RiMailLine, RiLockLine, RiEyeLine, RiEyeOffLine, RiUserLine, RiCloseLine } from "react-icons/ri";
import { Toaster, toast } from 'sonner';  // Importa Sonner

const RegisterUser = ({ user, onClose, onSave }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: ''
  });

  useEffect(() => {
    if (user) {
      setFormData({
        id: user.id || '',
        name: user.name || '',
        username: user.username || '',
        email: user.email || '',
        password: '',
        confirmPassword: '',
        role: user.role || ''
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      toast.error('Las contraseñas no coinciden');  // Muestra error si las contraseñas no coinciden
      return;
    }

    const userData = {
      username: formData.username,
      password: formData.password,
      name: formData.name,
      email: formData.email,
      role: formData.role
    };

    onSave(userData);
    toast.success(user ? 'Usuario actualizado exitosamente' : 'Usuario registrado exitosamente');  // Muestra mensaje de éxito
  };

  return (
    <div className="flex items-center justify-center p-4">
      <Toaster position="top-right" richColors/>
      
      <div className="relative bg-secondary-100 p-8 rounded-3xl shadow-2xl w-auto lg:w-[450px]">
        <button
          onClick={onClose}
          className="absolute top-0 right-0 text-2xl p-2 text-primary hover:text-white"
          aria-label="Cerrar"
        >
          <RiCloseLine />
        </button>
        <h1 className="text-3xl text-center uppercase font-bold tracking-[5px] text-white mb-8">
          {user ? 'Actualizar' : 'Registrar'} <span className="text-primary">Usuario</span>
        </h1>
        <form className="mb-8" onSubmit={handleSubmit}>
          <div className="relative mb-4">
            <RiUserLine className="absolute top-1/2 -translate-y-1/2 left-2 text-primary" />
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="py-2 pl-8 pr-4 bg-secondary-900 w-full outline-none rounded-lg text-emi_azul"
              placeholder="Nombre"
              required
              disabled={!!user}  
            />
          </div>
          <div className="relative mb-4">
            <RiUserLine className="absolute top-1/2 -translate-y-1/2 left-2 text-primary" />
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className="py-2 pl-8 pr-4 bg-secondary-900 w-full outline-none rounded-lg text-emi_azul"
              placeholder="Usuario"
              required
              disabled={!!user}  
            />
          </div>
          <div className="relative mb-4">
            <RiMailLine className="absolute top-1/2 -translate-y-1/2 left-2 text-primary" />
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="py-2 pl-8 pr-4 bg-secondary-900 w-full outline-none rounded-lg text-emi_azul"
              placeholder="Correo electrónico"
              required
              disabled={!!user} 
            />
          </div>
          <div className="relative mb-4">
            <RiLockLine className="absolute top-1/2 -translate-y-1/2 left-2 text-primary" />
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="py-2 px-8 bg-secondary-900 w-full outline-none rounded-lg text-emi_azul"
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
          <div className="relative mb-4">
            <RiLockLine className="absolute top-1/2 -translate-y-1/2 left-2 text-primary" />
            <input
              type={showPassword ? "text" : "password"}
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="py-2 px-8 bg-secondary-900 w-full outline-none rounded-lg text-emi_azul"
              placeholder="Confirmar contraseña"
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
          <div className="relative mb-4">
            <RiUserLine className="absolute top-1/2 -translate-y-1/2 left-2 text-primary" />
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="py-2 pl-8 pr-4 bg-secondary-900 w-full outline-none rounded-lg text-emi_azul"
              required
            >
              <option value="" disabled>Seleccionar rol</option>
              <option value="Administrador">Administrador</option>
              <option value="Encargado">Encargado</option>
            </select>
          </div>
          <div>
            <button
              type="submit"
              className="bg-primary text-black uppercase font-bold text-sm w-full py-3 px-4 rounded-lg"
            >
              {user ? 'Actualizar' : 'Registrar'}
            </button>
          </div>
        </form>
      </div>
      
    </div>
  );
};

export default RegisterUser;
