import React, { useState, useEffect, useCallback, useMemo } from "react";
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
  RiWifiOffLine,
  RiWifiLine,
} from "react-icons/ri";
import RegisterActivos from "./RegisterActivos";
import SeguimientoActivo from "./SeguimientoActivo";
import ReasignarActivos from "./ReasignarActivos";
import Modal from "react-modal";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate } from "react-router-dom";
import QrScanner from "react-qr-scanner";
import ReactPaginate from "react-paginate";
import { getActivos, setActivos, getUnidades, setUnidades, addToQueue, getQueue, clearQueue } from "../../db";
import { registerServiceWorker } from "../../serviceWorkerRegistration.js";
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
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [estadoModalAbierto, setEstadoModalAbierto] = useState(false);
  const [activoUnidadSeleccionado, setActivoUnidadSeleccionado] = useState(null);

  const apiUrl = import.meta.env.VITE_API_URL;

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
    const handleOnline = () => {
      setIsOnline(true);
      sincronizarDatos();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener("resize", updateModalStyles);

    updateModalStyles();
    registerServiceWorker();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener("resize", updateModalStyles);
    };
  }, [updateModalStyles]);

  const sincronizarDatos = async () => {
    setIsSyncing(true);
    try {
      if (navigator.onLine) {
        const queue = await getQueue();
        for (const action of queue) {
          switch (action.type) {
            case 'add':
              await axios.post(`${apiUrl}/activo-modelo`, action.data);
              break;
            case 'edit':
              await axios.put(`${apiUrl}/activo-modelo/${action.data.id}`, action.data);
              break;
            case 'delete':
              await axios.delete(`${apiUrl}/activo-modelo/${action.data.id}`);
              break;
          }
        }
        await clearQueue();

        const response = await axios.get(`${apiUrl}/activo-modelo`);
        const serverActivos = response.data.data;
        setActivos(serverActivos);
        await setActivos(serverActivos);

        const updatedUnidades = serverActivos.flatMap(modelo =>
          modelo.activoUnidades.map(unidad => ({
            codigo: unidad.codigo,
            modeloId: modelo.id,
            ...unidad,
          }))
        );
        setUnidades(updatedUnidades);
        await setUnidades(updatedUnidades);

        toast.success("Datos sincronizados correctamente");
      } else {
        toast.warn("No hay conexión a internet. Los datos se sincronizarán cuando vuelva la conexión.");
      }
    } catch (error) {
      console.error("Error al sincronizar datos:", error);
      toast.error("Error al sincronizar datos");
    } finally {
      setIsSyncing(false);
    }
  };

  const obtenerActivos = useCallback(async () => {
    setCargando(true);
    try {
      let activosData, unidadesData;

      if (navigator.onLine) {
        try {
          const response = await axios.get(`${apiUrl}/activo-modelo`);
          activosData = response.data.data;
          unidadesData = activosData.flatMap((modelo) =>
            modelo.activoUnidades.map((unidad) => ({
              codigo: unidad.codigo,
              modeloId: modelo.id,
              ...unidad,
            }))
          );

          await setActivos(activosData);
          await setUnidades(unidadesData);
        } catch (error) {
          console.error("Error fetching data from server:", error);
          activosData = await getActivos();
          unidadesData = await getUnidades();
        }
      } else {
        activosData = await getActivos();
        unidadesData = await getUnidades();
      }

      if (activosData && unidadesData) {
        setActivos(activosData);
        setUnidades(unidadesData);
      } else {
        toast.error("No hay datos disponibles.");
      }
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
        if (isOnline) {
          await axios.delete(`${apiUrl}/activo-modelo/${id}`);
        } else {
          await addToQueue({ type: 'delete', data: { id } });
        }
        setActivos(activos.filter((a) => a.id !== id));
        await setActivos(activos.filter((a) => a.id !== id));
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
      toast.error(error.response.data.message.message);
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

  // Chart data preparation
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
      cantidad: activo.activoUnidades.length
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
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center">
          {isOnline ? (
            <RiWifiLine className="text-green-500 mr-2" />
          ) : (
            <RiWifiOffLine className="text-red-500 mr-2" />
          )}
          <span className={isOnline ? "text-green-500" : "text-red-500"}>
            {isOnline ? "En línea" : "Fuera de línea"}
          </span>
        </div>
        {!isOnline && (
          <button
            onClick={sincronizarDatos}
            disabled={isSyncing}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
          >
            {isSyncing ? "Sincronizando..." : "Sincronizar datos"}
          </button>
        )}
      </div>
      {!isOnline && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4" role="alert">
          <p className="font-bold">Modo sin conexión</p>
          <p>Estás trabajando con datos almacenados localmente. Algunas funciones pueden estar limitadas.</p>
        </div>
      )}
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
                      <td className="py-1 px-6">
                        {activo.partida.porcentajeDepreciacion}%
                      </td>
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
                                .filter(
                                  (unidad) => unidad.modeloId === activo.id
                                )
                                .map((unidad) => (
                                  <tr
                                    key={unidad.id}
                                    className={`border-b hover:bg-gray-100 ${
                                      unidad.estadoCondicion === "BAJA"
                                        ? "bg-red-100 text-emi_azul"
                                        : ""
                                    }`}
                                  >
                                    <td className="py-1 px-6">
                                      {unidad.codigo}
                                    </td>
                                    <td className="py-1 px-6">
                                      {unidad.asignado ? "Sí" : "No"}
                                    </td>
                                    <td className="py-1 px-6">
                                      <button
                                        onClick={() => abrirModalEstado(unidad)}
                                        className={`text-white font-bold py-1 px-3 rounded ${getEstadoColor(unidad.estadoActual)}`}
                                      >
                                        {unidad.estadoActual}
                                      </button>
                                    </td>
                                    <td className="py-1 px-6">
                                      {unidad.estadoCondicion}
                                    </td>
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
                className="bg-white shadow-md rounded-lg mb-4 p-4"
              >
                <h3 className="text-lg font-semibold text-emi_azul mb-2">
                  {activo.nombre}
                </h3>
                <p className="text-sm text-gray-600 mb-2">
                  {activo.descripcion}
                </p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="font-medium text-black">ID:</span>{" "}
                    {activo.id}
                  </div>
                  <div>
                    <span className="font-medium text-black">Estado:</span>{" "}
                    {activo.estado}
                  </div>
                  <div>
                    <span className="font-medium text-black">
                      Fecha de Ingreso:
                    </span>{" "}
                    {new Date(activo.fechaIngreso).toLocaleDateString()}
                  </div>
                  <div>
                    <span className="font-medium text-black">Costo:</span>{" "}
                    {activo.costo} Bs
                  </div>
                  <div>
                    <span className="font-medium text-black">Vida Útil:</span>{" "}
                    {activo.partida.vidaUtil} años
                  </div>
                  <div>
                    <span className="font-medium text-black">
                      % Depreciación:
                    </span>{" "}
                    {activo.partida.porcentajeDepreciacion}%
                  </div>
                </div>
                <div className="mt-4 flex justify-between items-center">
                  <div className="space-x-2">
                    <button
                      onClick={() => editarActivo(activo)}
                      disabled={unidades.some(
                        (unidad) =>
                          unidad.modeloId === activo.id && unidad.asignado
                      )}
                      className={`p-2 rounded-full ${
                        unidades.some(
                          (unidad) =>
                            unidad.modeloId === activo.id && unidad.asignado
                        )
                          ? "text-gray-400 bg-gray-200"
                          : "text-emi_amarillo bg-emi_azul hover:bg-black"
                      }`}
                      aria-label="Editar activo"
                    >
                      <RiEdit2Line size="1.5em" />
                    </button>
                    <button
                      onClick={() => eliminarActivo(activo.id)}
                      disabled={unidades.some(
                        (unidad) =>
                          unidad.modeloId === activo.id && unidad.asignado
                      )}
                      className={`p-2 rounded-full ${
                        unidades.some(
                          (unidad) =>
                            unidad.modeloId === activo.id && unidad.asignado
                        )
                          ? "text-gray-400 bg-gray-200"
                          : "text-white bg-red-600 hover:bg-red-700"
                      }`}
                      aria-label="Eliminar activo"
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
                    <h4 className="font-semibold text-emi_azul mb-2">
                      Unidades
                    </h4>
                    {unidades
                      .filter((unidad) => unidad.modeloId === activo.id)
                      .map((unidad) => (
                        <div
                          key={unidad.id}
                          className={`border-t py-2 ${
                            unidad.estadoCondicion === "BAJA"
                              ? "bg-red-100 text-gray-400"
                              : ""
                          }`}
                        >
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="font-medium text-emi_azul">
                                {unidad.codigo}
                              </p>
                              <p className="text-sm text-emi_azul">
                                {unidad.asignado ? "Asignado" : "No asignado"} |{" "}
                                <button
                                  onClick={() => abrirModalEstado(unidad)}
                                  className={`text-white font-bold py-1 px-3 rounded ${getEstadoColor(unidad.estadoActual)}`}
                                >
                                  {unidad.estadoActual}
                                </button>{" "}
                                | {unidad.estadoCondicion}
                              </p>
                            </div>
                            <div className="space-x-2">
                              {unidad.estadoCondicion !== "BAJA" && (
                                <button
                                  onClick={() =>
                                    manejarAsignacion(
                                      unidad.id,
                                      unidad.asignado
                                    )
                                  }
                                  className={`p-2 rounded-full ${
                                    unidad.asignado
                                      ? "bg-yellow-500 text-white hover:bg-yellow-600"
                                      : "bg-green-500 text-white hover:bg-green-600"
                                  }`}
                                  aria-label={
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
                                className="p-2 rounded-full bg-blue-500 text-white hover:bg-blue-600"
                                aria-label="Ver seguimiento de la unidad"
                              >
                                <RiEyeLine size="1.5em" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between items-center mt-4 px-6">
            <div>
              <label htmlFor="itemsPerPage" className="mr-2">
                Mostrar:
              </label>
              <select
                id="itemsPerPage"
                value={activosPorPagina}
                onChange={(e) => setActivosPorPagina(Number(e.target.value))}
                className="border border-gray-300 rounded px-2 py-1"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>
            <ReactPaginate
              previousLabel={"Anterior"}
              nextLabel={"Siguiente"}
              breakLabel={"..."}
              breakClassName={"break-me"}
              pageCount={Math.ceil(activosFiltrados.length / activosPorPagina)}
              marginPagesDisplayed={2}
              pageRangeDisplayed={5}
              onPageChange={paginacion}
              containerClassName={"pagination flex justify-center mt-4 mb-4"}
              pageClassName={"mx-1"}
              pageLinkClassName={
                "px-3 py-2 rounded-lg bg-white text-emi_azul border border-emi_azul hover:bg-emi_azul hover:text-white transition-colors"
              }
              activeClassName={"bg-emi_azul text-white"}
              previousClassName={"mx-1"}
              nextClassName={"mx-1"}
              previousLinkClassName={
                "px-3 py-2 rounded-lg bg-white text-emi_azul border border-emi_azul hover:bg-emi_azul hover:text-white transition-colors"
              }
              nextLinkClassName={
                "px-3 py-2 rounded-lg bg-white text-emi_azul border border-emi_azul hover:bg-emi_azul hover:text-white transition-colors"
              }
              disabledClassName={"opacity-50 cursor-not-allowed"}
            />
          </div>
        </div>
      )}
      {unidadIdSeguimiento !== null && (
        <SeguimientoActivo
          unidadId={unidadIdSeguimiento}
          onClose={cerrarModalSeguimiento}
        />
      )}
      <Modal
        isOpen={estadoModalAbierto}
        onRequestClose={cerrarModalEstado}
        style={modalStyles}
        contentLabel="Modal de Cambio de Estado de Activo"
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
                required
              >
                <option value="">Seleccione un estado</option>
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
                className="mt-1 block w-full sm:text-sm border-gray-300 rounded-md"
                placeholder="Ingrese el motivo del cambio de estado"
                required
              ></textarea>
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={cerrarModalEstado}
                className="mr-2 bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                Guardar Cambios
              </button>
            </div>
          </form>
        </div>
      </Modal>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h3 className="text-lg font-semibold mb-2">Estados de Activos</h3>
          <Pie data={estadosData} />
        </div>
        <div>
          <h3 className="text-lg font-semibold mb-2">Activos por Modelo</h3>
          <Bar 
            data={activosPorModeloData}
            options={{
              scales: {
                y: {
                  beginAtZero: true,
                  title: {
                    display: true,
                    text: 'Cantidad de Unidades'
                  }
                },
                x: {
                  title: {
                    display: true,
                    text: 'Modelo de Activo'
                  }
                }
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}