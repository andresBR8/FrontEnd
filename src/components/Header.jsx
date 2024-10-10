import React, { useState, useEffect } from "react";
import { RiNotification3Line, RiArrowDownSLine, RiLogoutCircleRLine, RiDatabaseLine } from "react-icons/ri";
import { Menu, MenuItem, MenuButton } from "@szhsin/react-menu";
import "@szhsin/react-menu/dist/index.css";
import "@szhsin/react-menu/dist/transitions/slide.css";
import { Link, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import 'sweetalert2/dist/sweetalert2.min.css';
import { useWebSocket } from '../pages/admin/WebSocketContext'
const Header = () => {
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [email, setEmail] = useState('');
  const [rol, setRol] = useState('');
  const [notificaciones, setNotificaciones] = useState([]);
  const navigate = useNavigate();
  const socket = useWebSocket(); // Usamos el WebSocket desde el contexto

  useEffect(() => {
    // Cargar datos del localStorage
    setNombre(localStorage.getItem('nombre') || '');
    setApellido(localStorage.getItem('apellido') || '');
    setEmail(localStorage.getItem('email') || '');
    setRol(localStorage.getItem('role') || '');

    const savedNotifications = JSON.parse(localStorage.getItem('notificaciones')) || [];
    setNotificaciones(savedNotifications);

    if (socket) {
      // Emitir el rol para establecer la conexión
      socket.emit('setRole', localStorage.getItem('role'));

      // Escuchar las notificaciones recibidas desde el socket
      socket.on('nuevaAsignacion', (data) => {
        const newNotification = { 
          type: 'success', 
          message: `${data.message}`, 
          timestamp: new Date().toISOString() 
        };
        handleNewNotification(newNotification);
      });
      socket.on('nuevaAsignacion', (data) => {
        const newNotification = { 
          type: 'success', 
          message: `${data.message}`, 
          timestamp: new Date().toISOString() 
        };
        handleNewNotification(newNotification);
      });
      socket.on('nuevaBaja', (data) => {
        const newNotification = { 
          type: 'success', 
          message: `${data.message}`, 
          timestamp: new Date().toISOString() 
        };
        handleNewNotification(newNotification);
      });

      socket.on('bajaAprobada', (data) => {
        const newNotification = { 
          type: 'success', 
          message: ` ${data.message}`, 
          timestamp: new Date().toISOString() 
        };
        handleNewNotification(newNotification);
      });
      socket.on('bajaRechazada', (data) => {
        const newNotification = { 
          type: 'warning', 
          message: ` ${data.message}`, 
          timestamp: new Date().toISOString() 
        };
        handleNewNotification(newNotification);
      });

      socket.on('asignacion-eliminada', (data) => {
        const newNotification = { 
          type: 'warning', 
          message: `Asignación eliminada`, 
          timestamp: new Date().toISOString() 
        };
        handleNewNotification(newNotification);
      });
    }
  }, [socket]);

  const handleNewNotification = (notification) => {
    const notificationSound = new Audio('/notificacion.mp3');

    setNotificaciones((prev) => {
      const isDuplicate = prev.some((noti) => noti.message === notification.message && noti.timestamp === notification.timestamp);
      if (isDuplicate) return prev;

      const updatedNotifications = [notification, ...prev].slice(0, 5);
      localStorage.setItem('notificaciones', JSON.stringify(updatedNotifications));
      return updatedNotifications;
    });

    notificationSound.play();
  };

  const handleBackup = async () => {
    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: "¿Deseas iniciar el proceso de backup?",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, iniciar backup'
    });

    if (result.isConfirmed) {
      try {
        await axios.post(`${import.meta.env.VITE_API_URL}/backup`);
        Swal.fire({
          position: 'top-end',
          icon: 'success',
          title: 'Backup iniciado',
          showConfirmButton: false,
          timer: 1500
        });
      } catch (error) {
        Swal.fire('Error', 'No se pudo iniciar el proceso de backup.', 'error');
      }
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const markAllAsRead = () => {
    setNotificaciones([]);
    localStorage.setItem('notificaciones', JSON.stringify([]));
  };

  return (
    <header className="h-[7vh] md:h-[10vh] border-b border-secondary-100 p-8 flex items-center justify-end">
      <nav className="flex items-center gap-2">
        {rol === 'Nan' && (
          <button onClick={handleBackup} className="flex items-center relative hover:bg-secondary-100 p-2 rounded-lg transition-colors text-primary">
            <RiDatabaseLine />
            <span className="ml-2">Backup</span>
          </button>
        )}
        <Menu
          menuButton={
            <MenuButton className="relative hover:bg-secondary-100 p-2 rounded-lg transition-colors text-primary">
              <RiNotification3Line />
              {notificaciones.length > 0 && (
                <span className="absolute -top-0.5 right-0 bg-primary py-0.5 px-[5px] box-content text-black rounded-full text-[8px] font-bold">
                  {notificaciones.length}
                </span>
              )}
            </MenuButton>
          }
          align="end"
          arrow
          transition
          arrowClassName="bg-secondary-100"
          menuClassName="bg-secondary-100 p-4"
        >
          <h1 className="text-gray-300 text-center font-medium">
            Notificaciones ({notificaciones.length})
          </h1>
          <button onClick={markAllAsRead} className="text-sm text-blue-500 underline mb-2">
            Marcar todas como leídas
          </button>
          <hr className="my-6 border-gray-500" />
          {notificaciones.map((notificacion, index) => (
            <MenuItem key={index} className="p-0 hover:bg-transparent">
              <div className="text-gray-300 flex flex-1 items-center gap-4 py-2 px-4 hover:bg-secondary-900 transition-colors rounded-lg">
                <div className="text-sm flex flex-col">
                  <div className="flex items-center justify-between gap-4">
                    <span>{notificacion.type === 'success' ? 'Notificación Exitosa' : 'Error de Notificación'}</span>
                    <span className="text-[8px]">{new Date(notificacion.timestamp).toLocaleDateString()}</span>
                  </div>
                  <p className="text-gray-500 text-xs">{notificacion.message}</p>
                </div>
              </div>
            </MenuItem>
          ))}
          <hr className="my-6 border-gray-500" />
          <MenuItem className="p-0 hover:bg-transparent flex justify-center cursor-default">
            <Link to="/" className="text-gray-400 text-sm hover:text-white transition-colors">
              Todas las notificaciones
            </Link>
          </MenuItem>
        </Menu>
        <Menu
          menuButton={
            <MenuButton className="flex items-center gap-x-2 hover:bg-secondary-100 p-2 rounded-lg transition-colors">
              <img
                src="https://firebasestorage.googleapis.com/v0/b/sisactivos.appspot.com/o/uploads%2Flogoo_emi.jpg?alt=media&token=af571d0b-8e43-4e08-b0f2-f765c1f21b71"
                className="w-12 h-12 object-cover rounded-full"
              />
              <span className="text-primary">{nombre} {apellido}</span>
              <RiArrowDownSLine />
            </MenuButton>
          }
          align="end"
          arrow
          arrowClassName="bg-secondary-100"
          transition
          menuClassName="bg-secondary-100 p-4"
        >
          <MenuItem className="p-0 hover:bg-transparent">
            <Link
              to="/perfil"
              className="rounded-lg transition-colors text-gray-300 hover:bg-secondary-100 flex items-center gap-x-4 py-2 px-6 flex-1"
            >
              <img
                src="https://firebasestorage.googleapis.com/v0/b/sisactivos.appspot.com/o/uploads%2Flogoo_emi.jpg?alt=media&token=af571d0b-8e43-4e08-b0f2-f765c1f21b71"
                className="w-8 h-8 object-cover rounded-full"
              />
              <div className="flex flex-col text-sm">
                <span className="text-sm">{nombre} {apellido}</span>
                <span className="text-xs text-white">{email}</span>
                <span className="text-xs text-white">{rol}</span>
              </div>
            </Link>
          </MenuItem>
          <hr className="my-4 border-gray-500" />
          <MenuItem className="p-0 hover:bg-transparent" onClick={handleLogout}>
            <Link
              to="/login"
              className="rounded-lg transition-colors text-white hover:bg-emi_amarillo flex items-center gap-x-4 py-2 px-6 flex-1"
            >
              <RiLogoutCircleRLine /> Cerrar sesión
            </Link>
          </MenuItem>
        </Menu>
      </nav>
    </header>
  );
};

export default Header;
