import React, { useState, useEffect } from "react";
import axios from 'axios';
import Swal from 'sweetalert2';
import { RiEdit2Line, RiDeleteBin6Line } from "react-icons/ri";
import RegisterUser from "./RegisterUser";
import Modal from 'react-modal';
import { io } from 'socket.io-client';

Modal.setAppElement('#root');

const customStyles = {
  content: {
    top: '50%',
    left: '50%',
    right: 'auto',
    bottom: 'auto',
    marginRight: '-50%',
    transform: 'translate(-35%, -50%)',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: '50px',
    padding: '2px',
    width: '31%',
    maxWidth: '600px'
  },
  overlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.75)'
  }
};

const Usuarios = () => {
  const [users, setUsers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const apiUrl = import.meta.env.VITE_API_URL;

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${apiUrl}/users`);
      setUsers(response.data.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  useEffect(() => {
    fetchUsers();

    const socket = io(apiUrl, {
      withCredentials: true,
    });

    socket.emit('setRole', localStorage.getItem('role')); // Asigna el rol del usuario

    socket.on('user-changed', () => {
      fetchUsers();
    });

    return () => {
      socket.disconnect();
    };
  }, [apiUrl]);

  const handleEdit = (user) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setSelectedUser(null);
    setIsModalOpen(true);
  };

  const handleDelete = (id) => {
    Swal.fire({
      title: '¿Estás seguro?',
      text: "¡No podrás revertir esto!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, eliminarlo!'
    }).then((result) => {
      if (result.isConfirmed) {
        axios.delete(`${apiUrl}/users/${id}`)
          .then(() => {
            Swal.fire('Eliminado!', 'El usuario ha sido eliminado.', 'success');
            setUsers(users.filter(user => user.id !== id));
          })
          .catch(error => Swal.fire('Error!', 'No se pudo eliminar el usuario.', 'error'));
      }
    });
  };

  const saveUser = (user) => {
    const method = user.id ? 'put' : 'post';
    const url = user.id
      ? `${apiUrl}/users/${user.id}`
      : `${apiUrl}/users`;

    axios[method](url, user)
      .then(response => {
        const message = method === 'post' ? 'Usuario creado exitosamente' : 'Usuario actualizado exitosamente';
        if (method === 'post') {
          setUsers([...users, response.data.data]);
        } else {
          setUsers(users.map(u => (u.id === user.id ? response.data.data : u)));
        }
        setIsModalOpen(false);
        Swal.fire('Éxito!', message, 'success');
      })
      .catch(error => {
        const errorMessage = error.response?.data?.message?.message || 'Hubo un problema al guardar el usuario.';
        Swal.fire('Error!', errorMessage, 'error');
      });
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-10">
        <h1 className="text-2xl text-emi_azul font-bold">Gestión de Usuarios</h1>
        <button onClick={handleAdd} className="bg-emi_azul text-emi_amarillo py-2 px-4 rounded-lg hover:bg-black transition-colors">
          Agregar Usuario
        </button>
      </div>
      <Modal
        isOpen={isModalOpen}
        onRequestClose={() => setIsModalOpen(false)}
        style={customStyles}
      >
        <RegisterUser user={selectedUser} onClose={() => setIsModalOpen(false)} onSave={saveUser} />
      </Modal>
      <div className="overflow-x-auto relative shadow-md sm:rounded-lg">
        <table className="w-full text-sm text-left text-emi_azul">
          <thead className="text-xs text-emi_amarillo uppercase bg-white dark:bg-emi_azul dark:text-emi_amarillo">
            <tr>
              <th scope="col" className="py-2 px-6">ID</th>
              <th scope="col" className="py-2 px-6">Nombre</th>
              <th scope="col" className="py-2 px-6">Usuario</th>
              <th scope="col" className="py-2 px-6">Email</th>
              <th scope="col" className="py-2 px-6">Rol</th>
              <th scope="col" className="py-2 px-6">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="bg-white border-b dark:bg-white dark:border-emi_azul hover:bg-yellow-400 dark:hover:bg-emi_azul-900">
                <td className="py-2 px-6">{user.id}</td>
                <td className="py-2 px-6">{user.name}</td>
                <td className="py-2 px-6">{user.username}</td>
                <td className="py-2 px-6">{user.email}</td>
                <td className="py-2 px-6">{user.role}</td>
                <td className="py-2 px-6 text-right space-x-7">
                  <button onClick={() => handleEdit(user)} className="font-medium text-emi_amarillo dark:text-black hover:underline">
                    <RiEdit2Line size="1.5em" />
                  </button>
                  <button onClick={() => handleDelete(user.id)} className="font-medium text-red-600 dark:text-red-500 hover:underline">
                    <RiDeleteBin6Line size="1.5em" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Usuarios;
