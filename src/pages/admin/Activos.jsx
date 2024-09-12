import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useWebSocket } from '../../pages/admin/WebSocketContext.jsx';
import Swal from "sweetalert2";
import {
  RiEdit2Line,
  RiDeleteBin6Line,
  RiArrowDownSLine,
  RiArrowUpSLine,
  RiAddLine,
  RiRefreshLine,
  RiEyeLine,
  RiQrScan2Line,
} from "react-icons/ri";
import RegisterActivos from "./RegisterActivos";
import SeguimientoActivo from "./SeguimientoActivo";
import ReasignarActivos from "./ReasignarActivos";
import Modal from "react-modal";
import axios from "axios";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import QrScanner from "react-qr-scanner";
import ReactPaginate from "react-paginate";
import { Bar, Pie } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

Modal.setAppElement("#root");

export default function Activos() {
  const [activos, setActivos] = useState([]);
  const [unidades, setUnidades] = useState([]);
  const [unidadesDesplegadas, setUnidadesDesplegadas] = useState({});
  const [modalAbierto, setModalAbierto] = useState(false);
  const [qrModalAbierto, setQrModalAbierto] = useState(false);
  const [activoSeleccionado, setActivoSeleccionado] = useState(null);
  const [terminoBusqueda, setTerminoBusqueda] = useState("");
  const [tipoOrden, setTipoOrden] = useState("");
  const [direccionOrden, setDireccionOrden] = useState("asc");
  const [paginaActual, setPaginaActual] = useState(0);
  const [activosPorPagina, setActivosPorPagina] = useState(10);
  const [escaneoActivo, setEscaneoActivo] = useState(true);
  const [unidadIdReasignacion, setUnidadIdReasignacion] = useState(null);
  const [cargando, setCargando] = useState(true);
  const navigate = useNavigate();
  const [unidadIdSeguimiento, setUnidadIdSeguimiento] = useState(null);
  const [estadoModalAbierto, setEstadoModalAbierto] = useState(false);
  const [activoUnidadSeleccionado, setActivoUnidadSeleccionado] = useState(null);

  const apiUrl = import.meta.env.VITE_API_URL;
  const socket = useWebSocket();

  const [modalStyles, setModalStyles] = useState({
    content: {
      top: "50%",
      left: "50%",
      right: "auto",
      bottom: "auto",
      marginRight: "-50%",
      transform: "translate(-50%, -50%)",
      backgroundColor: "rgba(0, 0, 0, 0)",
      borderRadius: "15px",
      padding: "1px",
      width: "95%", 
      maxWidth: "900px",
      overflow: "auto",
      maxHeight: "90vh",
    },
    overlay: {
      backgroundColor: "rgba(0, 0, 0, 0.5)",
    },
  });

  const updateModalStyles = useCallback(() => {
    setModalStyles((prevStyles) => ({
      ...prevStyles,
      content: {
        ...prevStyles.content,
        width: window.innerWidth <= 768 ? "95%" : "90%",
        maxWidth: window.innerWidth <= 768 ? "none" : "900px",
      },
    }));
  }, []);

  useEffect(() => {
    window.addEventListener("resize", updateModalStyles);
    updateModalStyles();

    return () => {
      window.removeEventListener("resize", updateModalStyles);
    };
  }, [updateModalStyles]);

  // Integración del WebSocket
  const toastIdRef = useRef(null);

  const handleActivoModeloChanged = useCallback((data) => {
    console.log('Activo modelo changed:', data);
    if (data && data.action) {
      setActivos((prevActivos) => {
        let updatedActivos;
        switch (data.action) {
          case 'created':
            updatedActivos = [...prevActivos, data.activoModelo];
            break;
          case 'updated':
          case 'change-estado':
            updatedActivos = prevActivos.map(activo => {
              if (activo.id === data.activoModelo.id) {
                return {
                  ...activo,
                  ...data.activoModelo,
                  activoUnidades: data.activoModelo.activoUnidades.map(nuevaUnidad => {
                    const unidadExistente = activo.activoUnidades.find(u => u.id === nuevaUnidad.id);
                    return unidadExistente ? { ...unidadExistente, ...nuevaUnidad } : nuevaUnidad;
                  })
                };
              }
              return activo;
            });
            break;
          case 'deleted':
            updatedActivos = prevActivos.filter(activo => activo.id !== data.activoModelo.id);
            break;
          default:
            updatedActivos = prevActivos;
        }
        return updatedActivos;
      });

      setUnidades((prevUnidades) => {
        let updatedUnidades;
        switch (data.action) {
          case 'created':
          case 'updated':
          case 'change-estado':
            updatedUnidades = prevUnidades.map(unidad => {
              const nuevaUnidad = data.activoModelo.activoUnidades.find(u => u.id === unidad.id);
              return nuevaUnidad ? { ...unidad, ...nuevaUnidad, modeloId: data.activoModelo.id } : unidad;
            });
            const nuevasUnidades = data.activoModelo.activoUnidades.filter(
              nuevaUnidad => !prevUnidades.some(u => u.id === nuevaUnidad.id)
            ).map(u => ({ ...u, modeloId: data.activoModelo.id }));
            updatedUnidades = [...updatedUnidades, ...nuevasUnidades];
            break;
          case 'deleted':
            updatedUnidades = prevUnidades.filter(unidad => unidad.modeloId !== data.activoModelo.id);
            break;
          default:
            updatedUnidades = prevUnidades;
        }
        return updatedUnidades;
      });

      // Toast notification
      setTimeout(() => {
        if (toastIdRef.current) {
          toast.dismiss(toastIdRef.current);
        }
        switch (data.action) {
          case 'created':
            toastIdRef.current = toast.success(`Nuevo activo modelo creado: ${data.activoModelo.nombre}`);
            break;
          case 'updated':
            toastIdRef.current = toast.info(`Activo modelo actualizado: ${data.activoModelo.nombre}`);
            break;
          case 'deleted':
            toastIdRef.current = toast.error(`Activo modelo eliminado: ${data.activoModelo.nombre}`);
            break;
          case 'change-estado':
            const unidadCambiada = data.activoModelo.activoUnidades.find(u => u.estadoActual !== u.estadoAnterior);
            if (unidadCambiada) {
              toastIdRef.current = toast.info(`Estado de unidad actualizado: ${unidadCambiada.codigo} - Nuevo estado: ${unidadCambiada.estadoActual}`);
            }
            break;
        }
      }, 0);
    }
  }, []);

  useEffect(() => {
    if (socket) {
      const handleSocketEvent = (data) => {
        requestAnimationFrame(() => handleActivoModeloChanged(data));
      };

      socket.on('activo-modelo-changed', handleSocketEvent);
      return () => {
        socket.off('activo-modelo-changed', handleSocketEvent);
      };
    }
  }, [socket, handleActivoModeloChanged]);

  const obtenerActivos = useCallback(async () => {
    setCargando(true);
    try {
      const response = await axios.get(`${apiUrl}/activo-modelo`);
      const activosData = response.data.data;
      const unidadesData = activosData.flatMap((modelo) =>
        modelo.activoUnidades.map((unidad) => ({
          codigo: unidad.codigo,
          modeloId: modelo.id,
          ...unidad,
        }))
      );
      setActivos(activosData);
      setUnidades(unidadesData);
    } catch (error) {
      console.error("Error al obtener activos:", error);
      toast.error("Error al cargar los activos.");
    } finally {
      setCargando(false);
    }
  }, [apiUrl]);

  useEffect(() => {
    obtenerActivos();
  }, [obtenerActivos]);

  const editarActivo = (activo) => {
    if (unidades.some((unidad) => unidad.modeloId === activo.id && unidad.asignado)) {
      toast.error("No se puede editar un modelo con unidades asignadas.");
      return;
    }
    setActivoSeleccionado(activo);
    setModalAbierto(true);
  };

  const agregarActivo = () => {
    setActivoSeleccionado(null);
    setModalAbierto(true);
  };

  const eliminarActivo = async (id) => {
    if (unidades.some((unidad) => unidad.modeloId === id && unidad.asignado)) {
      toast.error("No se puede eliminar un modelo con unidades asignadas.");
      return;
    }

    const result = await Swal.fire({
      title: "¿Estás seguro?",
      text: "¡No podrás revertir esto!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Sí, eliminarlo!",
    });

    if (result.isConfirmed) {
      try {
        await axios.delete(`${apiUrl}/activo-modelo/${id}`);
        setActivos(activos.filter((a) => a.id !== id));
        Swal.fire("Eliminado!", "El activo ha sido eliminado.", "success");
      } catch (error) {
        console.error("Error al eliminar activo:", error);
        Swal.fire("Error!", "No se pudo eliminar el activo.", "error");
      }
    }
  };

  const ordenarPor = (campo) => {
    const esAsc = tipoOrden === campo && direccionOrden === "asc";
    setTipoOrden(campo);
    setDireccionOrden(esAsc ? "desc" : "asc");
  };

  const activosOrdenados = useMemo(() => {
    return [...activos].sort((a, b) => {
      if (tipoOrden === "fechaIngreso") {
        return direccionOrden === "asc"
          ? new Date(a[tipoOrden]) - new Date(b[tipoOrden])
          : new Date(b[tipoOrden]) - new Date(a[tipoOrden]);
      } else if (typeof a[tipoOrden] === "string") {
        return direccionOrden === "asc"
          ? a[tipoOrden].localeCompare(b[tipoOrden])
          : b[tipoOrden].localeCompare(a[tipoOrden]);
      } else {
        return direccionOrden === "asc"
          ? a[tipoOrden] - b[tipoOrden]
          : b[tipoOrden] - a[tipoOrden];
      }
    });
  }, [activos, tipoOrden, direccionOrden]);

  const manejarUnidades = (id) => {
    setUnidadesDesplegadas((prevDesplegadas) => ({
      ...prevDesplegadas,
      [id]: !prevDesplegadas[id],
    }));
  };

  const manejarAsignacion = (id, asignado) => {
    if (asignado) {
      setUnidadIdReasignacion(id);
    } else {
      navigate(`/asignar-activo/${id}`);
    }
  };

  const manejarSeguimiento = (id) => {
    setUnidadIdSeguimiento(id);
  };

  const cerrarModalSeguimiento = () => {
    setUnidadIdSeguimiento(null);
  };

  const handleScan = (data) => {
    if (data && data.text && escaneoActivo) {
      setEscaneoActivo(false);

      let codigo = "";

      if (data.text.includes("Activo ID:")) {
        const regex = /Código:\s*(\S+)/;
        const match = data.text.match(regex);
        if (match) {
          codigo = match[1];
        }
      } else {
        codigo = data.text.split(" ")[0];
      }

      if (codigo) {
        const unidadEncontrada = unidades.find(
          (unidad) => unidad.codigo === codigo
        );
        if (unidadEncontrada) {
          setTerminoBusqueda(codigo);
          setUnidadesDesplegadas((prevDesplegadas) => ({
            ...prevDesplegadas,
            [unidadEncontrada.modeloId]: true,
          }));
          setQrModalAbierto(false);
          toast.success("Activo encontrado.");
        } else {
          toast.error("Activo no encontrado.");
        }
      } else {
        toast.error("Formato de QR no reconocido.");
      }
      setEscaneoActivo(true);
    }
  };

  const handleError = (error) => {
    console.error("Error al escanear el QR:", error);
    if (escaneoActivo) {
      toast.error("Error al escanear el QR.");
    }
  };

  const activosFiltrados = useMemo(() => {
    return activosOrdenados.filter((activo) => {
      if (!activo) return false;
      const descripcion = activo.descripcion?.toLowerCase() ?? "";
      const codigo = activo.codigo?.toLowerCase() ?? "";
      const termino = terminoBusqueda.toLowerCase();
      return (
        descripcion.includes(termino) ||
        codigo.includes(termino) ||
        unidades.some(
          (unidad) =>
            unidad.modeloId === activo.id &&
            unidad.codigo &&
            unidad.codigo.toLowerCase().includes(termino)
        )
      );
    });
  }, [activosOrdenados, unidades, terminoBusqueda]);

  const indexOfLastActivo = (paginaActual + 1) * activosPorPagina;
  const indexOfFirstActivo = indexOfLastActivo - activosPorPagina;
  const activosPaginados = activosFiltrados.slice(
    indexOfFirstActivo,
    indexOfLastActivo
  );

  const paginacion = ({ selected }) => setPaginaActual(selected);

  const cambiarEstadoActivo = async (fkActivoUnidad, estadoNuevo, motivoCambio) => {
    try {
      const response = await axios.post(`${apiUrl}/estado-activo`, {
        fkActivoUnidad,
        estadoNuevo,
        motivoCambio
      });
      toast.success("Estado del activo actualizado con éxito");
      obtenerActivos();
    } catch (error) {
      console.error("Error al cambiar el estado del activo:", error);
      toast.error(error.response?.data?.message?.message || "Error al cambiar el estado del activo");
    }
  };

  const abrirModalEstado = (unidad) => {
    setActivoUnidadSeleccionado(unidad);
    setEstadoModalAbierto(true);
  };

  const cerrarModalEstado = () => {
    setActivoUnidadSeleccionado(null);
    setEstadoModalAbierto(false);
  };

  const handleCambioEstado = (e) => {
    e.preventDefault();
    const estadoNuevo = e.target.estadoNuevo.value;
    const motivoCambio = e.target.motivoCambio.value;
    cambiarEstadoActivo(activoUnidadSeleccionado.id, estadoNuevo, motivoCambio);
    cerrarModalEstado();
  };

  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'Nuevo':
        return 'bg-green-500 hover:bg-green-600';
      case 'Bueno':
        return 'bg-blue-500 hover:bg-blue-600';
      case 'Regular':
        return 'bg-yellow-500 hover:bg-yellow-600';
      case 'Malo':
        return 'bg-red-500 hover:bg-red-600';
      default:
        return 'bg-gray-500 hover:bg-gray-600';
    }
  };

  const estadosData = useMemo(() => {
    const estados = unidades.reduce((acc, unidad) => {
      acc[unidad.estadoActual] = (acc[unidad.estadoActual] || 0) + 1;
      return acc;
    }, {});
    return {
      labels: ['Nuevo', 'Bueno', 'Regular', 'Malo'],
      datasets: [{
        data: ['Nuevo', 'Bueno', 'Regular', 'Malo'].map(estado => estados[estado] || 0),
        backgroundColor: ['#48BB78', '#4299E1', '#ECC94B', '#F56565'],
      }],
    };
  }, [unidades]);

  const activosPorModeloData = useMemo(() => {
    const activosPorModelo = activos.map(activo => ({
      modelo: activo.nombre,
      cantidad: activo.activoUnidades?.length || 0
    }));
    return {
      labels: activosPorModelo.map(a => a.modelo),
      datasets: [{
        label: 'Cantidad de Unidades',
        data: activosPorModelo.map(a => a.cantidad),
        backgroundColor: 'rgba(54, 162, 235, 0.6)',
      }],
    };
  }, [activos]);

  return (
    <div className="p-4 px-0 lg:px-0">
      <div className="flex flex-col lg:flex-row justify-between items-center mb-8 space-y-3 lg:space-y-0">
        <h1 className="text-2xl text-emi_azul font-bold">Gestión de Activos</h1>
        <div className="flex items-center space-x-2">
          <input
            type="text"
            placeholder="Buscar por detalle..."
            value={terminoBusqueda}
            onChange={(e) => setTerminoBusqueda(e.target.value)}
            className="text-sm p-2 text-emi_azul border-emi_azul border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-emi_azul focus:border-transparent transition-colors"
          />
          <button
            onClick={() => {
              setQrModalAbierto(true);
              setEscaneoActivo(true);
            }}
            className="bg-emi_azul text-emi_amarillo py-2 px-4 rounded-lg hover:bg-black transition-colors"
            aria-label="Escanear QR"
          >
            <RiQrScan2Line className="text-2xl" />
          </button>
          <button
            onClick={agregarActivo}
            className="bg-emi_azul text-emi_amarillo py-2 px-4 rounded-lg hover:bg-black transition-colors text-sm md:text-base"
          >
            Agregar Activos
          </button>
        </div>
      </div>

      <Modal
        isOpen={modalAbierto}
        onRequestClose={() => setModalAbierto(false)}
        style={modalStyles}
        contentLabel="Modal de Registro de Activos"
      >
        <RegisterActivos
          activo={activoSeleccionado}
          onClose={() => { setModalAbierto(false); obtenerActivos(); }}
        />
      </Modal>
      <Modal
        isOpen={qrModalAbierto}
        onRequestClose={() => setQrModalAbierto(false)}
        style={modalStyles}
        contentLabel="Modal de Escaneo QR"
      >
        <div className="flex flex-col items-center p-4">
          <h2 className="text-2xl text-emi_azul font-bold mb-4">Escanear QR</h2>
          <QrScanner
            delay={300}
            onError={handleError}
            onScan={handleScan}
            style={{ width: "100%" }}
            facingMode="user"
          />
          <div className="mt-4">
            <button
              onClick={() => setQrModalAbierto(false)}
              className="bg-emi_azul text-emi_amarillo py-2 px-4 rounded-lg hover:bg-black transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      </Modal>
      <Modal
        isOpen={unidadIdReasignacion !== null}
        onRequestClose={() => setUnidadIdReasignacion(null)}
        style={modalStyles}
        contentLabel="Modal de Reasignación de Activos"
      >
        <ReasignarActivos
          activoUnidadId={unidadIdReasignacion}
          onClose={() => setUnidadIdReasignacion(null)}
          onSave={obtenerActivos}
        />
      </Modal>
      {cargando ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-emi_azul"></div>
        </div>
      ) : (
        <div className="overflow-x-auto relative shadow-md sm:rounded-lg">
          <div className="hidden md:block">
            <table className="w-full text-sm text-left text-emi_azul">
              <thead className="text-xs text-emi_amarillo uppercase bg-white dark:bg-emi_azul dark:text-emi_amarillo">
                <tr>
                  <th
                    scope="col"
                    className="py-1 px-6 cursor-pointer"
                    onClick={() => ordenarPor("id")}
                  >
                    ID {tipoOrden === "id" && (direccionOrden === "asc" ? "↑" : "↓")}
                  </th>
                  <th
                    scope="col"
                    className="py-1 px-6 cursor-pointer"
                    onClick={() => ordenarPor("nombre")}
                  >
                    Nombre {tipoOrden === "nombre" && (direccionOrden === "asc" ? "↑" : "↓")}
                  </th>
                  <th
                    scope="col"
                    className="py-1 px-6 cursor-pointer"
                    onClick={() => ordenarPor("descripcion")}
                  >
                    Descripción {tipoOrden === "descripcion" && (direccionOrden === "asc" ? "↑" : "↓")}
                  </th>
                  <th
                    scope="col"
                    className="py-1 px-6 cursor-pointer"
                    onClick={() => ordenarPor("estado")}
                  >
                    Estado {tipoOrden === "estado" && (direccionOrden === "asc" ? "↑" : "↓")}
                  </th>
                  <th
                    scope="col"
                    className="py-1 px-6 cursor-pointer"
                    onClick={() => ordenarPor("fechaIngreso")}
                  >
                    Fecha de Ingreso {tipoOrden === "fechaIngreso" && (direccionOrden === "asc" ? "↑" : "↓")}
                  </th>
                  <th className="py-1 px-6">Costo</th>
                  <th className="py-1 px-6">Vida Útil (Años)</th>
                  <th className="py-1 px-6">% Depreciación</th>
                  <th className="py-1 px-6">Acciones</th>
                  <th className="py-1 px-6">Unidades</th>
                </tr>
              </thead>
              <tbody>
                {activosPaginados.map((activo) => (
                  <React.Fragment key={activo.id}>
                    <tr className="bg-white border-b hover:bg-gray-50">
                      <td className="py-1 px-6">{activo.id}</td>
                      <td className="py-1 px-6">{activo.nombre}</td>
                      <td className="py-1 px-6">{activo.descripcion}</td>
                      <td className="py-1 px-6">{activo.estado}</td>
                      <td className="py-1 px-6">
                        {new Date(activo.fechaIngreso).toLocaleDateString()}
                      </td>
                      <td className="py-1 px-6">{activo.costo} Bs</td>
                      <td className="py-1 px-6">{activo.partida.vidaUtil}</td>
                      <td className="py-1 px-6">{activo.partida.porcentajeDepreciacion}%</td>
                      <td className="py-1 px-1 text-right space-x-2">
                        <button
                          onClick={() => editarActivo(activo)}
                          disabled={unidades.some(
                            (unidad) =>
                              unidad.modeloId === activo.id && unidad.asignado
                          )}
                          className={`font-medium p-2 rounded-full ${
                            unidades.some(
                              (unidad) =>
                                unidad.modeloId === activo.id && unidad.asignado
                            )
                              ? "text-gray-400 cursor-not-allowed"
                              : "text-emi_amarillo bg-emi_azul hover:bg-black"
                          }`}
                          aria-label="Editar activo"
                          title="Editar activo"
                        >
                          <RiEdit2Line size="1.5em" />
                        </button>
                        <button
                          onClick={() => eliminarActivo(activo.id)}
                          disabled={unidades.some(
                            (unidad) =>
                              unidad.modeloId === activo.id && unidad.asignado
                          )}
                          className={`font-medium p-2 rounded-full ${
                            unidades.some(
                              (unidad) =>
                                unidad.modeloId === activo.id && unidad.asignado
                            )
                              ? "text-gray-400 cursor-not-allowed"
                              : "text-white bg-red-600 hover:bg-red-700"
                          }`}
                          aria-label="Eliminar activo"
                          title="Eliminar activo"
                        >
                          <RiDeleteBin6Line size="1.5em" />
                        </button>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <button
                          onClick={() => manejarUnidades(activo.id)}
                          className="font-medium text-emi_azul hover:text-emi_amarillo p-2 rounded-full bg-gray-100 hover:bg-emi_azul transition-colors"
                          aria-label={
                            unidadesDesplegadas[activo.id]
                              ? "Ocultar unidades"
                              : "Mostrar unidades"
                          }
                          title={
                            unidadesDesplegadas[activo.id]
                              ? "Ocultar unidades"
                              : "Mostrar unidades"
                          }
                        >
                          {unidadesDesplegadas[activo.id] ? (
                            <RiArrowUpSLine size="1.5em" />
                          ) : (
                            <RiArrowDownSLine size="1.5em" />
                          )}
                        </button>
                      </td>
                    </tr>
                    {unidadesDesplegadas[activo.id] && (
                      <tr>
                        <td colSpan="10" className="bg-gray-50 p-4">
                          <table className="w-full text-sm text-left text-emi_azul">
                            <thead className="text-xs text-emi_amarillo uppercase bg-emi_azul">
                              <tr>
                                <th className="py-3 px-6">Código</th>
                                <th className="py-3 px-6">Asignado</th>
                                <th className="py-3 px-6">Estado Actual</th>
                                <th className="py-3 px-6">Condición</th>
                                <th className="py-3 px-6">Acciones</th>
                              </tr>
                            </thead>
                            <tbody>
                              {unidades
                                .filter((unidad) => unidad.modeloId === activo.id)
                                .map((unidad) => (
                                  <tr key={unidad.id} className="border-b hover:bg-gray-100">
                                    <td className="py-1 px-6">{unidad.codigo}</td>
                                    <td className="py-1 px-6">{unidad.asignado ? "Sí" : "No"}</td>
                                    <td className="py-1 px-6">
                                      <button
                                        onClick={() => abrirModalEstado(unidad)}
                                        className={`text-white font-bold py-1 px-3 rounded ${getEstadoColor(unidad.estadoActual)}`}
                                      >
                                        {unidad.estadoActual}
                                      </button>
                                    </td>
                                    <td className="py-1 px-6">{unidad.estadoCondicion}</td>
                                    <td className="py-1 px-6 space-x-2">
                                      {unidad.estadoCondicion !== "BAJA" && (
                                        <button
                                          onClick={() =>
                                            manejarAsignacion(
                                              unidad.id,
                                              unidad.asignado
                                            )
                                          }
                                          className={`font-medium p-2 rounded-full ${
                                            unidad.asignado
                                              ? "bg-yellow-500 text-white hover:bg-yellow-600"
                                              : "bg-green-500 text-white hover:bg-green-600"
                                          }`}
                                          aria-label={
                                            unidad.asignado
                                              ? "Reasignar unidad"
                                              : "Asignar unidad"
                                          }
                                          title={
                                            unidad.asignado
                                              ? "Reasignar unidad"
                                              : "Asignar unidad"
                                          }
                                        >
                                          {unidad.asignado ? (
                                            <RiRefreshLine size="1.5em" />
                                          ) : (
                                            <RiAddLine size="1.5em" />
                                          )}
                                        </button>
                                      )}
                                      <button
                                        onClick={() =>
                                          manejarSeguimiento(unidad.id)
                                        }
                                        className="font-medium p-2 rounded-full bg-blue-500 text-white hover:bg-blue-600"
                                        aria-label="Ver seguimiento de la unidad"
                                        title="Ver seguimiento de la unidad"
                                      >
                                        <RiEyeLine size="1.5em" />
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
          </div>
          <div className="md:hidden">
            {activosPaginados.map((activo) => (
              <div
                key={activo.id}
                className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 mb-4 p-4 rounded-lg shadow"
              >
                <h3 className="text-lg font-semibold mb-2">{activo.nombre}</h3>
                <p className="text-sm mb-2">
                  <span className="font-medium">ID:</span> {activo.id}
                </p>
                <p className="text-sm mb-2">
                  <span className="font-medium">Descripción:</span>{" "}
                  {activo.descripcion}
                </p>
                <p className="text-sm mb-2">
                  <span className="font-medium">Estado:</span> {activo.estado}
                </p>
                <p className="text-sm mb-2">
                  <span className="font-medium">Fecha de Ingreso:</span>{" "}
                  {new Date(activo.fechaIngreso).toLocaleDateString()}
                </p>
                <p className="text-sm mb-2">
                  <span className="font-medium">Costo:</span> {activo.costo} Bs
                </p>
                <p className="text-sm mb-2">
                  <span className="font-medium">Vida Útil:</span>{" "}
                  {activo.partida.vidaUtil} años
                </p>
                <p className="text-sm mb-2">
                  <span className="font-medium">% Depreciación:</span>{" "}
                  {activo.partida.porcentajeDepreciacion}%
                </p>
                <div className="flex justify-between items-center mt-4">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => editarActivo(activo)}
                      disabled={unidades.some(
                        (unidad) =>
                          unidad.modeloId === activo.id && unidad.asignado
                      )}
                      className={`font-medium p-2 rounded-full ${
                        unidades.some(
                          (unidad) =>
                            unidad.modeloId === activo.id && unidad.asignado
                        )
                          ? "text-gray-400 cursor-not-allowed"
                          : "text-emi_amarillo bg-emi_azul hover:bg-black"
                      }`}
                      aria-label="Editar activo"
                      title="Editar activo"
                    >
                      <RiEdit2Line size="1.5em" />
                    </button>
                    <button
                      onClick={() => eliminarActivo(activo.id)}
                      disabled={unidades.some(
                        (unidad) =>
                          unidad.modeloId === activo.id && unidad.asignado
                      )}
                      className={`font-medium p-2 rounded-full ${
                        unidades.some(
                          (unidad) =>
                            unidad.modeloId === activo.id && unidad.asignado
                        )
                          ? "text-gray-400 cursor-not-allowed"
                          : "text-white bg-red-600 hover:bg-red-700"
                      }`}
                      aria-label="Eliminar activo"
                      title="Eliminar activo"
                    >
                      <RiDeleteBin6Line size="1.5em" />
                    </button>
                  </div>
                  <button
                    onClick={() => manejarUnidades(activo.id)}
                    className="font-medium text-emi_azul hover:text-emi_amarillo p-2 rounded-full bg-gray-100 hover:bg-emi_azul transition-colors"
                    aria-label={
                      unidadesDesplegadas[activo.id]
                        ? "Ocultar unidades"
                        : "Mostrar unidades"
                    }
                    title={
                      unidadesDesplegadas[activo.id]
                        ? "Ocultar unidades"
                        : "Mostrar unidades"
                    }
                  >
                    {unidadesDesplegadas[activo.id] ? (
                      <RiArrowUpSLine size="1.5em" />
                    ) : (
                      <RiArrowDownSLine size="1.5em" />
                    )}
                  </button>
                </div>
                {unidadesDesplegadas[activo.id] && (
                  <div className="mt-4">
                    <h4 className="text-md font-semibold mb-2">Unidades</h4>
                    {unidades
                      .filter((unidad) => unidad.modeloId === activo.id)
                      .map((unidad) => (
                        <div
                          key={unidad.id}
                          className={`bg-gray-100 p-2 rounded mb-2 ${
                            unidad.estadoCondicion === "BAJA"
                              ? "bg-red-100"
                              : ""
                          }`}
                        >
                          <p className="text-sm">
                            <span className="font-medium">Código:</span>{" "}
                            {unidad.codigo}
                          </p>
                          <p className="text-sm">
                            <span className="font-medium">Asignado:</span>{" "}
                            {unidad.asignado ? "Sí" : "No"}
                          </p>
                          <p className="text-sm">
                            <span className="font-medium">Estado Actual:</span>{" "}
                            <button
                              onClick={() => abrirModalEstado(unidad)}
                              className={`text-white font-bold py-1 px-3 rounded ${getEstadoColor(
                                unidad.estadoActual
                              )}`}
                            >
                              {unidad.estadoActual}
                            </button>
                          </p>
                          <p className="text-sm">
                            <span className="font-medium">Condición:</span>{" "}
                            {unidad.estadoCondicion}
                          </p>
                          <div className="flex justify-end space-x-2 mt-2">
                            {unidad.estadoCondicion !== "BAJA" && (
                              <button
                                onClick={() =>
                                  manejarAsignacion(unidad.id, unidad.asignado)
                                }
                                className={`font-medium p-2 rounded-full ${
                                  unidad.asignado
                                    ? "bg-yellow-500 text-white hover:bg-yellow-600"
                                    : "bg-green-500 text-white hover:bg-green-600"
                                }`}
                                aria-label={
                                  unidad.asignado
                                    ? "Reasignar unidad"
                                    : "Asignar unidad"
                                }
                                title={
                                  unidad.asignado
                                    ? "Reasignar unidad"
                                    : "Asignar unidad"
                                }
                              >
                                {unidad.asignado ? (
                                  <RiRefreshLine size="1.5em" />
                                ) : (
                                  <RiAddLine size="1.5em" />
                                )}
                              </button>
                            )}
                            <button
                              onClick={() => manejarSeguimiento(unidad.id)}
                              className="font-medium p-2 rounded-full bg-blue-500 text-white hover:bg-blue-600"
                              aria-label="Ver seguimiento de la unidad"
                              title="Ver seguimiento de la unidad"
                            >
                              <RiEyeLine size="1.5em" />
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      <ReactPaginate
        previousLabel={"Anterior"}
        nextLabel={"Siguiente"}
        breakLabel={"..."}
        pageCount={Math.ceil(activosFiltrados.length / activosPorPagina)}
        marginPagesDisplayed={2}
        pageRangeDisplayed={5}
        onPageChange={paginacion}
        containerClassName={"flex justify-center mt-4 space-x-2"}
        pageClassName={"bg-white border border-gray-300 text-gray-500 hover:bg-gray-50 relative inline-flex items-center px-4 py-2 text-sm font-medium"}
        pageLinkClassName={"page-link"}
        previousClassName={"bg-white border border-gray-300 text-gray-500 hover:bg-gray-50 relative inline-flex items-center px-4 py-2 text-sm font-medium rounded-l-md"}
        previousLinkClassName={"page-link"}
        nextClassName={"bg-white border border-gray-300 text-gray-500 hover:bg-gray-50 relative inline-flex items-center px-4 py-2 text-sm font-medium rounded-r-md"}
        nextLinkClassName={"page-link"}
        breakClassName={"bg-white border border-gray-300 text-gray-500 hover:bg-gray-50 relative inline-flex items-center px-4 py-2 text-sm font-medium"}
        breakLinkClassName={"page-link"}
        activeClassName={"bg-blue-50 border-blue-500 text-blue-600 z-10"}
      />
      <Modal
        isOpen={unidadIdSeguimiento !== null}
        onRequestClose={cerrarModalSeguimiento}
        style={modalStyles}
        contentLabel="Modal de Seguimiento de Activo"
      >
        <SeguimientoActivo
          unidadId={unidadIdSeguimiento}
          onClose={cerrarModalSeguimiento}
        />
      </Modal>
      <Modal
        isOpen={estadoModalAbierto}
        onRequestClose={cerrarModalEstado}
        style={modalStyles}
        contentLabel="Modal de Cambio de Estado"
      >
        <div className="bg-white p-6 rounded-lg">
          <h2 className="text-2xl font-bold mb-4">Cambiar Estado del Activo</h2>
          <form onSubmit={handleCambioEstado}>
            <div className="mb-4">
              <label htmlFor="estadoNuevo" className="block text-sm font-medium text-gray-700">
                Nuevo Estado
              </label>
              <select
                id="estadoNuevo"
                name="estadoNuevo"
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                defaultValue={activoUnidadSeleccionado?.estadoActual}
              >
                <option value="Nuevo">Nuevo</option>
                <option value="Bueno">Bueno</option>
                <option value="Regular">Regular</option>
                <option value="Malo">Malo</option>
              </select>
            </div>
            <div className="mb-4">
              <label htmlFor="motivoCambio" className="block text-sm font-medium text-gray-700">
                Motivo del Cambio
              </label>
              <textarea
                id="motivoCambio"
                name="motivoCambio"
                rows="3"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Explique el motivo del cambio de estado"
                required
              ></textarea>
            </div>
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={cerrarModalEstado}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Guardar Cambios
              </button>
            </div>
          </form>
        </div>
      </Modal>
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">Estados de Activos</h2>
          <Pie data={estadosData} />
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">Activos por Modelo</h2>
          <Bar data={activosPorModeloData} />
        </div>
      </div>
    </div>
  );
}
