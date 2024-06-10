import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const ResetPassword = () => {
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const query = new URLSearchParams(location.search);
    const tokenFromUrl = query.get("token");
    if (tokenFromUrl) {
      setToken(tokenFromUrl);
    } else {
      toast.error("No se encontró el token.");
      navigate("/login"); // Usamos navigate en lugar de history.push
    }
  }, [location, navigate]);

  const handlePasswordChange = (e) => {
    setNewPassword(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newPassword) {
      toast.error("Por favor ingrese una nueva contraseña.");
      return;
    }
    try {
      const response = await fetch('http://192.168.100.48:5075/api/Users/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, newPassword })
      });

      if (response.ok) {
        toast.success("Contraseña actualizada correctamente. Serás redirigido al login.");
        setTimeout(() => {
          navigate('/login'); // Usamos navigate con el timeout
        }, 5000);
      } else {
        toast.error("No se pudo actualizar la contraseña. Intente de nuevo.");
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error("Error al actualizar la contraseña.");
    }
  };

  return (
    <div className="reset-password-container" style={{ padding: "20px", maxWidth: "400px", margin: "auto", textAlign: "center" }}>
      <ToastContainer position="top-center" autoClose={5000} />
      <h1>Restablecer Contraseña</h1>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        <input
          type="password"
          value={newPassword}
          onChange={handlePasswordChange}
          placeholder="Introduce tu nueva contraseña"
          required
          style={{ padding: "10px", fontSize: "16px" }}
        />
        <button type="submit" style={{ padding: "10px 20px", backgroundColor: "#4CAF50", color: "white", border: "none", cursor: "pointer" }}>Restablecer Contraseña</button>
      </form>
    </div>
  );
};

export default ResetPassword;
