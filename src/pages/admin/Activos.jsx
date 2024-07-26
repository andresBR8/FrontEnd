import React, { useState, useEffect } from "react";
import Swal from 'sweetalert2';
import { RiEdit2Line, RiDeleteBin6Line, RiArrowDownSLine, RiArrowUpSLine, RiAddLine, RiRefreshLine, RiEyeLine } from "react-icons/ri";
import RegisterActivo from "./RegisterActivos";
import Modal from 'react-modal';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useNavigate } from 'react-router-dom';

Modal.setAppElement('#root');

const estilosPersonalizados = {
  content: {
    top: '50%',
    left: '50%',
    right: 'auto',
    bottom: 'auto',
    marginRight: '-50%',
    transform: 'translate(-35%, -50%)',
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
    borderRadius: '50px',
    padding: '2px',
    width: '100%',
    maxWidth: '1000px',
  },
  overlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.75)'
  }
};

const Activos = () => {
  const [activos, setActivos] = useState([]);
  const [unidades, setUnidades] = useState({});
  const [modalAbierto, setModalAbierto] = useState(false);
  const [activoSeleccionado, setActivoSeleccionado] = useState(null);
  const [terminoBusqueda, setTerminoBusqueda] = useState('');
  const [tipoOrden, setTipoOrden] = useState('');
  const [direccionOrden, setDireccionOrden] = useState('asc');
  const [rolUsuario, setRolUsuario] = useState(null);
  const [paginaActual, setPaginaActual] = useState(1);
  const [activosPorPagina] = useState(10); // Número de activos por página
  const navigate = useNavigate();

  const apiUrl = import.meta.env.VITE_API_URL;

  const obtenerActivos = () => {
    axios.get(`${apiUrl}/activo-modelo`)
      .then(response => {
        console.log('Activos obtenidos:', response.data.data);
        setActivos(response.data.data);
      })
      .catch(error => {
        console.error('Error consulta activos:', error);
      });
  };

  useEffect(() => {
    obtenerActivos();
    const rol = localStorage.getItem('fk_Rol');
    setRolUsuario(rol);
  }, []);

  const ocultarMenu = rolUsuario === '3';

  const guardarActivo = (activo) => {
    const metodo = activo.id ? 'put' : 'post';
    const url = `${apiUrl}/activo-modelo/${activo.id ? activo.id : ''}`;
    const data = {
      fkPartida: activo.fkPartida,
      fechaIngreso: new Date(activo.fechaIngreso).toISOString(),
      costo: activo.costo,
      descripcion: activo.descripcion,
      estado: activo.estado,
      codigoAnterior: activo.codigoAnterior,
      codigoNuevo: activo.codigoNuevo,
      ordenCompra: activo.ordenCompra,
    };

    axios({ method: metodo, url, data })
      .then(response => {
        setModalAbierto(false);
        toast.success(`El activo ha sido ${activo.id ? 'actualizado' : 'registrado'} con éxito.`);
        obtenerActivos();
      })
      .catch(error => {
        console.error('Error al crear o actualizar el activo:', error);
        toast.error(`No se pudo ${activo.id ? 'actualizar' : 'registrar'} el activo.`);
      });
  };

  const editarActivo = (activo) => {
    if (unidades[activo.id] && unidades[activo.id].some(unidad => unidad.asignado)) {
      toast.error('No se puede editar un modelo con unidades asignadas.');
      return;
    }
    setActivoSeleccionado(activo);
    setModalAbierto(true);
  };

  const agregarActivo = () => {
    setActivoSeleccionado(null);
    setModalAbierto(true);
  };

  const eliminarActivo = (id) => {
    if (unidades[id] && unidades[id].some(unidad => unidad.asignado)) {
      toast.error('No se puede eliminar un modelo con unidades asignadas.');
      return;
    }

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
        axios.delete(`${apiUrl}/activo-modelo/${id}`)
          .then(() => {
            setActivos(activos.filter(a => a.id !== id));
            Swal.fire('Eliminado!', 'El activo ha sido eliminado.', 'success');
          })
          .catch(error => {
            console.error('Error al eliminar activo:', error);
            Swal.fire('Error!', 'No se pudo eliminar el activo.', 'error');
          });
      }
    });
  };

  const ordenarPor = (campo) => {
    const esAsc = tipoOrden === campo && direccionOrden === 'asc';
    setTipoOrden(campo);
    setDireccionOrden(esAsc ? 'desc' : 'asc');
    setActivos(prevActivos =>
      [...prevActivos].sort((a, b) => {
        if (campo === 'fechaIngreso') {
          return esAsc ? new Date(a[campo]) - new Date(b[campo]) : new Date(b[campo]) - new Date(a[campo]);
        } else if (typeof a[campo] === 'string') {
          return esAsc ? a[campo].localeCompare(b[campo]) : b[campo].localeCompare(a[campo]);
        } else {
          return esAsc ? a[campo] - b[campo] : b[campo] - a[campo];
        }
      })
    );
  };

  const manejarUnidades = (id) => {
    if (unidades[id]) {
      setUnidades(prev => ({ ...prev, [id]: null }));
    } else {
      axios.get(`${apiUrl}/activo-modelo/${id}`)
        .then(response => {
          console.log(`Unidades obtenidas para activo ${id}:`, response.data.data.activoUnidades);
          setUnidades(prev => ({ ...prev, [id]: response.data.data.activoUnidades }));
        })
        .catch(error => {
          console.error('Error al obtener unidades:', error);
        });
    }
  };

  const manejarAsignacion = (id, asignado) => {
    const ruta = asignado ? '/reasignacion' : '/asignar-activo';
    navigate(`${ruta}/${id}`);
  };

  const manejarSeguimiento = (id) => {
    navigate(`/seguimiento/${id}`);
  };

  // Obtener activos actuales
  const indexOfLastActivo = paginaActual * activosPorPagina;
  const indexOfFirstActivo = indexOfLastActivo - activosPorPagina;
  const activosFiltrados = activos.filter(activo => activo.descripcion.toLowerCase().includes(terminoBusqueda.toLowerCase()));
  const activosPaginados = activosFiltrados.slice(indexOfFirstActivo, indexOfLastActivo);

  // Cambiar de página
  const paginacion = (numeroPagina) => setPaginaActual(numeroPagina);

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-10">
        <h1 className="text-2xl text-emi_azul font-bold">Gestión de Activos</h1>
        <input 
          type="text" 
          placeholder="Buscar por detalle..." 
          value={terminoBusqueda} 
          onChange={e => setTerminoBusqueda(e.target.value)} 
          className="text-sm p-2 text-emi_azul border-emi_azul border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-emi_azul focus:border-transparent transition-colors"
        />
        {!ocultarMenu && (
        <button onClick={agregarActivo} className="bg-emi_azul text-emi_amarillo py-2 px-4 rounded-lg hover:bg-black transition-colors">
          Agregar Activos
        </button>
        )}
      </div>
      <Modal isOpen={modalAbierto} onRequestClose={() => setModalAbierto(false)} style={estilosPersonalizados}>
        <RegisterActivo activo={activoSeleccionado} onClose={() => setModalAbierto(false)} onSave={guardarActivo} />
      </Modal>
      <div className="overflow-x-auto relative shadow-md sm:rounded-lg">
        <table className="w-full text-sm text-left text-emi_azul">
          <thead className="text-xs text-emi_amarillo uppercase bg-white dark:bg-emi_azul dark:text-emi_amarillo">
            <tr>
              <th scope="col" className="py-1 px-6 cursor-pointer" onClick={() => ordenarPor('id')}>
                ID {tipoOrden === 'id' && (direccionOrden === 'asc' ? '↑' : '↓')}
              </th>
              <th scope="col" className="py-1 px-6 cursor-pointer" onClick={() => ordenarPor('nombre')}>
                Nombre {tipoOrden === 'nombre' && (direccionOrden === 'asc' ? '↑' : '↓')}
              </th>
              <th scope="col" className="py-1 px-6 cursor-pointer" onClick={() => ordenarPor('descripcion')}>
                Descripción {tipoOrden === 'descripcion' && (direccionOrden === 'asc' ? '↑' : '↓')}
              </th>
              <th scope="col" className="py-1 px-6 cursor-pointer" onClick={() => ordenarPor('estado')}>
                Estado {tipoOrden === 'estado' && (direccionOrden === 'asc' ? '↑' : '↓')}
              </th>
              <th scope="col" className="py-1 px-6 cursor-pointer" onClick={() => ordenarPor('fechaIngreso')}>
                Fecha de Ingreso {tipoOrden === 'fechaIngreso' && (direccionOrden === 'asc' ? '↑' : '↓')}
              </th>
              <th scope="col" className="py-1 px-6">
                Costo
              </th>
              {!ocultarMenu && (
              <th scope="col" className="py-1 px-6">
                Acciones
              </th>
              )}
              <th scope="col" className="py-1 px-6">
                Unidades
              </th>
            </tr>
          </thead>
          <tbody>
            {activosPaginados.map((activo) => (
              <React.Fragment key={activo.id}>
                <tr className="bg-white border-b dark:bg-white dark:border-emi_azul hover:bg-yellow-400 dark:hover:bg-emi_azul-900">
                  <td className="py-1 px-6">{activo.id}</td>
                  <td className="py-1 px-6">{activo.nombre}</td>
                  <td className="py-1 px-6">{activo.descripcion}</td>
                  <td className="py-1 px-6">{activo.estado}</td>
                  <td className="py-1 px-6">{new Date(activo.fechaIngreso).toLocaleDateString()}</td>
                  <td className="py-1 px-6">{activo.costo} Bs</td>
                  {!ocultarMenu && (
                  <td className="py-1 px-6 text-right space-x-7">
                    <button onClick={() => editarActivo(activo)} disabled={unidades[activo.id] && unidades[activo.id].some(unidad => unidad.asignado)} className={`font-medium ${unidades[activo.id] && unidades[activo.id].some(unidad => unidad.asignado) ? 'text-gray-400' : 'text-emi_amarillo dark:text-black hover:underline'}`}>
                      <RiEdit2Line size="1.5em" />
                    </button>
                    <button onClick={() => eliminarActivo(activo.id)} disabled={unidades[activo.id] && unidades[activo.id].some(unidad => unidad.asignado)} className={`font-medium ${unidades[activo.id] && unidades[activo.id].some(unidad => unidad.asignado) ? 'text-gray-400' : 'text-red-600 dark:text-red-500 hover:underline'}`}>
                      <RiDeleteBin6Line size="1.5em" />
                    </button>
                  </td>
                  )}
                  <td className="py-1 px-6 text-right">
                    <button onClick={() => manejarUnidades(activo.id)} className="font-medium text-emi_azul dark:text-emi_amarillo hover:underline">
                      {unidades[activo.id] ? <RiArrowUpSLine size="1.5em" /> : <RiArrowDownSLine size="1.5em" />}
                    </button>
                  </td>
                </tr>
                {unidades[activo.id] && Array.isArray(unidades[activo.id]) && unidades[activo.id].length > 0 && (
                  <tr>
                    <td colSpan="8" className="bg-gray-100 p-4">
                      <table className="w-full text-sm text-left text-emi_azul">
                        <thead className="text-xs text-emi_amarillo uppercase bg-white dark:bg-emi_azul dark:text-emi_amarillo">
                          <tr>
                            <th scope="col" className="py-1 px-6">Código</th>
                            <th scope="col" className="py-1 px-6">Asignado</th>
                            <th scope="col" className="py-1 px-6">Acciones</th>
                          </tr>
                        </thead>
                        <tbody>
                          {unidades[activo.id].map((unidad) => (
                            <tr key={unidad.id} className="bg-white border-b dark:bg-white dark:border-emi_azul hover:bg-yellow-400 dark:hover:bg-emi_azul-900">
                              <td className="py-1 px-6">{unidad.codigo}</td>
                              <td className="py-1 px-6">{unidad.asignado ? 'Sí' : 'No'}</td>
                              <td className="py-1 px-6 text-right space-x-4">
                                <button onClick={() => manejarAsignacion(unidad.id, unidad.asignado)} className={`font-medium ${unidad.asignado ? 'text-yellow-500' : 'text-green-500'} hover:underline`}>
                                  {unidad.asignado ? (
                                    <span className="flex items-center">
                                      <RiRefreshLine size="1.5em" className="mr-1" />
                                      Reasignar
                                    </span>
                                  ) : (
                                    <span className="flex items-center">
                                      <RiAddLine size="1.5em" className="mr-1" />
                                      Asignar
                                    </span>
                                  )}
                                </button>
                                <button onClick={() => manejarSeguimiento(unidad.id)} className="font-medium text-blue-500 hover:underline">
                                  <span className="flex items-center">
                                    <RiEyeLine size="1.5em" className="mr-1" />
                                    Seguimiento
                                  </span>
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
        <div className="flex justify-center mt-4 mb-4">
          {Array.from({ length: Math.ceil(activosFiltrados.length / activosPorPagina) }, (_, index) => (
            <button
              key={index}
              onClick={() => paginacion(index + 1)}
              className={`mx-1 px-3 py-1 rounded-lg ${paginaActual === index + 1 ? 'bg-emi_azul text-white' : 'bg-white text-emi_azul border border-emi_azul'}`}
            >
              {index + 1}
            </button>
          ))}
        </div>
      </div>
      <ToastContainer />
    </div>
  );
};

export default Activos;
