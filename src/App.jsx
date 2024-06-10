import { BrowserRouter, Routes, Route } from "react-router-dom";
import React from 'react';
import PrivateRoute from './pages/auth/PrivateRoute';
// Layouts
import LayoutAuth from "./layouts/LayoutAuth";
import LayoutAdmin from "./layouts/LayoutAdmin";
// Pages auth
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import ForgetPassword from "./pages/auth/ForgetPassword";
// Pages admin
import Home from "./pages/admin/Home";
import Profile from "./pages/admin/Profile";
import Chat from "./pages/admin/Chat";
import Error404 from "./pages/Error404";
import Tickets from "./pages/admin/Tickets";
import Activos from "./pages/admin/Activos";
import Unidades from "./pages/admin/Unidades";
import RegisterUser from "./pages/admin/RegisterUser";
import RegisterActivos from "./pages/admin/RegisterActivos";
import AsignarActivos from "./pages/admin/AsignarActivos";
import Usuarios from "./pages/admin/Usuarios";
import RegisterUnidades from "./pages/admin/RegisterUnidades"
import SeguimientoActivos from "./pages/admin/SeguimientoActivos"
import GestionActivos from "./pages/admin/GestionarActivos"
import Reset from "./pages/auth/ResetPassword";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/registro" element={<Register />} />
        <Route path="/olvide-password" element={<ForgetPassword />} />
        <Route path="/reestablecer" element={<Reset />} />
        
        
        <Route element={<PrivateRoute />}>
          <Route path="/" element={<LayoutAdmin />}>
            <Route index element={<Home />} />
            <Route path="perfil" element={<Profile />} />
            <Route path="chat" element={<Chat />} />
            <Route path="tickets" element={<Tickets />} />
            <Route path="activos" element={<Activos />} />
            <Route path="unidades" element={<Unidades />} />
            <Route path="registrouser" element={<RegisterUser />} />
            <Route path="registroactivos" element={<RegisterActivos />} />
            <Route path="asignaractivos" element={<AsignarActivos />} />
            <Route path="usuarios" element={<Usuarios />} />
            <Route path="registrounidades" element={<RegisterUnidades />} />
            <Route path="seguimientoactivos" element={<SeguimientoActivos />} />
            <Route path="gestionaractivos" element={<GestionActivos />} />
          </Route>
        </Route>
        <Route path="*" element={<Error404 />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;