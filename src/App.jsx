import React, { useEffect } from 'react';
import { Routes, Route } from "react-router-dom";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import PrivateRoute from './pages/auth/PrivateRoute';
import LayoutAuth from "./layouts/LayoutAuth";
import LayoutAdmin from "./layouts/LayoutAdmin";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import ForgetPassword from "./pages/auth/ForgetPassword";
import Home from "./pages/admin/Home";
import Chat from "./pages/admin/Chat";
import Error404 from "./pages/Error404";
import Activos from "./pages/admin/Activos";
import Unidades from "./pages/admin/Unidades";
import RegisterUser from "./pages/admin/RegisterUser";
import RegisterActivos from "./pages/admin/RegisterActivos";
import AsignarActivos from "./pages/admin/AsignarActivos";
import Usuarios from "./pages/admin/Usuarios";
import RegisterUnidades from "./pages/admin/RegisterUnidades";
import GestionActivos from "./pages/admin/GestionarActivos";
import Reset from "./pages/auth/ResetPassword";
import Calendario from "./pages/admin/Calendario";
import Depreciacion from "./pages/admin/Depreciacion";
import Bajas from "./pages/admin/Bajas";
import Mantenimientos from "./pages/admin/Mantenimientos";
import Reportes from "./pages/admin/Reportes";
import CambioEstado from "./pages/admin/Cambio_Estado";
import DevolverActivos from "./pages/admin/DevolucionActivos";
import { WebSocketProvider } from "./pages/admin/WebSocketContext";
import RevisionPersonal from "./pages/admin/RevisionPersonal";


function App() {
  useEffect(() => {
    function handleOnline() {
      toast.success('Conexión a Internet reestablecida.', {
        position: "top-center",
        autoClose: 3000,
        hideProgressBar: true,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
    }

    function handleOffline() {
      toast.info('Entrando en modo visualizador. Solo podrás ver la información disponible.', {
        position: "top-center",
        autoClose: false,
        hideProgressBar: true,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
    }

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <WebSocketProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/registro" element={<Register />} />
        <Route path="/olvide-password" element={<ForgetPassword />} />
        <Route path="/reestablecer" element={<Reset />} />
        
        <Route element={<PrivateRoute />}>
          <Route path="/" element={<LayoutAdmin />}>
            <Route index element={<Home />} />
            <Route path="chat" element={<Chat />} />
            <Route path="activos" element={<Activos />} />
            <Route path="unidades" element={<Unidades />} />
            <Route path="registrouser" element={<RegisterUser />} />
            <Route path="registroactivos" element={<RegisterActivos />} />
            <Route path="asignar-activos" element={<AsignarActivos />} />
            <Route path="usuarios" element={<Usuarios />} />
            <Route path="registrounidades" element={<RegisterUnidades />} />
            <Route path="gestionaractivos" element={<GestionActivos />} />
            <Route path="devolveractivos" element={<DevolverActivos />} />
            <Route path="calendario" element={<Calendario />} />
            <Route path='depreciacion' element={<Depreciacion />} />
            <Route path='bajas' element={<Bajas />} />
            <Route path='mantenimiento' element={<Mantenimientos />} />
            <Route path='reportes' element={<Reportes />} />
            <Route path='estado' element={<CambioEstado />} />
            <Route path='revision' element={<RevisionPersonal />} />
          </Route>
        </Route>
        <Route path="*" element={<Error404 />} />
      </Routes>
      <ToastContainer />
    </WebSocketProvider>
  );
}

export default App;