import React, { useState, useEffect, useCallback } from "react";
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
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate } from "react-router-dom";
import QrScanner from "react-qr-scanner";
import ReactPaginate from 'react-paginate';

Modal.setAppElement("#root");

const Activos = () => {
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
  const [activosPorPagina] = useState(10);
  const [escaneoActivo, setEscaneoActivo] = useState(true);
  const [unidadIdSeguimiento, setUnidadIdSeguimiento] = useState(null);
  const [unidadIdReasignacion, setUnidadIdReasignacion] = useState(null);  // Nueva variable de estado para el ID de la unidad a reasignar
  const navigate = useNavigate();

  const apiUrl = import.meta.env.VITE_API_URL;

  const [modalStyles, setModalStyles] = useState({
    content: {
      top: '50%',
      left: '50%',
      right: 'auto',
      bottom: 'auto',
      marginRight: '-50%',
      transform: window.innerWidth <= 1263 ? 'translate(-50%, -50%)' : 'translate(-35%, -50%)',
      backgroundColor: 'rgba(255, 255, 255, 0.35)',
      borderRadius: '50px',
      padding: '2px',
      width: '100%',
      maxWidth: '1000px',
      overflow: 'auto',
      maxHeight: '90vh',
    },
    overlay: {
      backgroundColor: 'rgba(0, 0, 0, 0.75)'
    }
  });

  const updateModalStyles = () => {
    setModalStyles(prevStyles => ({
      ...prevStyles,
      content: {
        ...prevStyles.content,
        transform: window.innerWidth <= 1263 ? 'translate(-50%, -50%)' : 'translate(-35%, -50%)'
      }
    }));
  };

  useEffect(() => {
    window.addEventListener('resize', updateModalStyles);
    return () => {
      window.removeEventListener('resize', updateModalStyles);
    };
  }, []);

  const obtenerActivos = useCallback(() => {
    axios
      .get(`${apiUrl}/activo-modelo`)
      .then((response) => {
        setActivos(response.data.data);
        const unidadesMap = [];
        response.data.data.forEach((modelo) => {
          modelo.activoUnidades.forEach((unidad) => {
            unidadesMap.push({
              codigo: unidad.codigo,
              modeloId: modelo.id,
              ...unidad,
            });
          });
        });
        setUnidades(unidadesMap);
      })
      .catch((error) => {
        console.error("Error consulta activos:", error);
      });
  }, [apiUrl]);

  useEffect(() => {
    obtenerActivos();
  }, [obtenerActivos]);

  const guardarActivo = () => {
    setModalAbierto(false);
    toast.success("Los activos han sido registrados con éxito.");
    obtenerActivos();
  };

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

  const eliminarActivo = (id) => {
    if (unidades.some((unidad) => unidad.modeloId === id && unidad.asignado)) {
      toast.error("No se puede eliminar un modelo con unidades asignadas.");
      return;
    }

    Swal.fire({
      title: "¿Estás seguro?",
      text: "¡No podrás revertir esto!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Sí, eliminarlo!",
    }).then((result) => {
      if (result.isConfirmed) {
        axios
          .delete(`${apiUrl}/activo-modelo/${id}`)
          .then(() => {
            setActivos(activos.filter((a) => a.id !== id));
            Swal.fire("Eliminado!", "El activo ha sido eliminado.", "success");
          })
          .catch((error) => {
            console.error("Error al eliminar activo:", error);
            Swal.fire("Error!", "No se pudo eliminar el activo.", "error");
          });
      }
    });
  };

  const ordenarPor = (campo) => {
    const esAsc = tipoOrden === campo && direccionOrden === "asc";
    setTipoOrden(campo);
    setDireccionOrden(esAsc ? "desc" : "asc");
    setActivos((prevActivos) =>
      [...prevActivos].sort((a, b) => {
        if (campo === "fechaIngreso") {
          return esAsc ? new Date(a[campo]) - new Date(b[campo]) : new Date(b[campo]) - a[campo];
        } else if (typeof a[campo] === "string") {
          return esAsc ? a[campo].localeCompare(b[campo]) : b[campo].localeCompare(a[campo]);
        } else {
          return esAsc ? a[campo] - b[campo] : b[campo] - a[campo];
        }
      })
    );
  };

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
        const unidadEncontrada = unidades.find((unidad) => unidad.codigo === codigo);
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

  const indexOfLastActivo = (paginaActual + 1) * activosPorPagina;
  const indexOfFirstActivo = indexOfLastActivo - activosPorPagina;
  const activosFiltrados = activos.filter((activo) => {
    const descripcion = activo.descripcion ? activo.descripcion.toLowerCase() : "";
    const codigoAnterior = activo.codigoAnterior ? activo.codigoAnterior.toLowerCase() : "";
    const codigoNuevo = activo.codigoNuevo ? activo.codigoNuevo.toLowerCase() : "";
    return (
      descripcion.includes(terminoBusqueda.toLowerCase()) ||
      codigoAnterior.includes(terminoBusqueda.toLowerCase()) ||
      codigoNuevo.includes(terminoBusqueda.toLowerCase()) ||
      unidades.some(
        (unidad) =>
          unidad.modeloId === activo.id &&
          unidad.codigo &&
          unidad.codigo.toLowerCase().includes(terminoBusqueda.toLowerCase())
      )
    );
  });
  const activosPaginados = activosFiltrados.slice(indexOfFirstActivo, indexOfLastActivo);

  const paginacion = ({ selected }) => setPaginaActual(selected);

  return (
    <div className="p-4 px-0 lg:px-0">
      <div className="flex flex-col lg:flex-row justify-between items-center mb-8 space-y-3 lg:space-y-0">
        <h1 className="text-2xl text-emi_azul font-bold">Gestión de Activos</h1>
        <div className="flex items-center">
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
            className="ml-2 bg-emi_azul text-emi_amarillo py-2 px-4 rounded-lg hover:bg-black transition-colors"
          >
            <RiQrScan2Line />
          </button>
        </div>
        <button onClick={agregarActivo} className="bg-emi_azul text-emi_amarillo py-2 px-4 rounded-lg hover:bg-black transition-colors">
          Agregar Activos
        </button>
      </div>
      <Modal isOpen={modalAbierto} onRequestClose={() => setModalAbierto(false)} style={modalStyles}>
        <RegisterActivos activo={activoSeleccionado} onClose={() => setModalAbierto(false)} onSave={guardarActivo} />
      </Modal>
      <Modal isOpen={qrModalAbierto} onRequestClose={() => setQrModalAbierto(false)} style={modalStyles}>
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
      <Modal isOpen={unidadIdReasignacion !== null} onRequestClose={() => setUnidadIdReasignacion(null)} style={modalStyles}>
        <ReasignarActivos
          activoUnidadId={unidadIdReasignacion}
          onClose={() => setUnidadIdReasignacion(null)}
          onSave={obtenerActivos}
        />
      </Modal>
      <div className="overflow-x-auto relative shadow-md sm:rounded-lg">
        <table className="w-full text-sm text-left text-emi_azul">
          <thead className="text-xs text-emi_amarillo uppercase bg-white dark:bg-emi_azul dark:text-emi_amarillo">
            <tr>
              <th scope="col" className="py-1 px-2 lg:px-6 cursor-pointer" onClick={() => ordenarPor("id")}>
                ID {tipoOrden === "id" && (direccionOrden === "asc" ? "↑" : "↓")}
              </th>
              <th scope="col" className="py-1 px-2 lg:px-6 cursor-pointer" onClick={() => ordenarPor("nombre")}>
                Nombre {tipoOrden === "nombre" && (direccionOrden === "asc" ? "↑" : "↓")}
              </th>
              <th scope="col" className="py-1 px-2 lg:px-6 cursor-pointer" onClick={() => ordenarPor("descripcion")}>
                Descripción {tipoOrden === "descripcion" && (direccionOrden === "asc" ? "↑" : "↓")}
              </th>
              <th scope="col" className="py-1 px-2 lg:px-6 cursor-pointer" onClick={() => ordenarPor("estado")}>
                Estado {tipoOrden === "estado" && (direccionOrden === "asc" ? "↑" : "↓")}
              </th>
              <th scope="col" className="py-1 px-2 lg:px-6 cursor-pointer" onClick={() => ordenarPor("fechaIngreso")}>
                Fecha de Ingreso {tipoOrden === "fechaIngreso" && (direccionOrden === "asc" ? "↑" : "↓")}
              </th>
              <th scope="col" className="py-1 px-2 lg:px-6">Costo</th>
              <th scope="col" className="py-1 px-2 lg:px-6">Acciones</th>
              <th scope="col" className="py-1 px-2 lg:px-6">Unidades</th>
            </tr>
          </thead>
          <tbody>
            {activosPaginados.map((activo) => (
              <React.Fragment key={activo.id}>
                <tr className="bg-white border-b dark:bg-white dark:border-emi_azul hover:bg-yellow-400 dark:hover:bg-emi_azul-900">
                  <td className="py-1 px-2 lg:px-6">{activo.id}</td>
                  <td className="py-1 px-2 lg:px-6">{activo.nombre}</td>
                  <td className="py-1 px-2 lg:px-6">{activo.descripcion}</td>
                  <td className="py-1 px-2 lg:px-6">{activo.estado}</td>
                  <td className="py-1 px-2 lg:px-6">{new Date(activo.fechaIngreso).toLocaleDateString()}</td>
                  <td className="py-1 px-2 lg:px-6">{activo.costo} Bs</td>
                  <td className="py-1 px-2 lg:px-6 text-right space-x-4 lg:space-x-7">
                    <button
                      onClick={() => editarActivo(activo)}
                      disabled={unidades.some((unidad) => unidad.modeloId === activo.id && unidad.asignado)}
                      className={`font-medium ${
                        unidades.some((unidad) => unidad.modeloId === activo.id && unidad.asignado)
                          ? "text-gray-400"
                          : "text-emi_amarillo dark:text-black hover:underline"
                      }`}
                    >
                      <RiEdit2Line size="1.5em" />
                    </button>
                    <button
                      onClick={() => eliminarActivo(activo.id)}
                      disabled={unidades.some((unidad) => unidad.modeloId === activo.id && unidad.asignado)}
                      className={`font-medium ${
                        unidades.some((unidad) => unidad.modeloId === activo.id && unidad.asignado)
                          ? "text-gray-400"
                          : "text-red-600 dark:text-red-500 hover:underline"
                      }`}
                    >
                      <RiDeleteBin6Line size="1.5em" />
                    </button>
                  </td>
                  <td className="py-1 px-2 lg:px-6 text-right">
                    <button onClick={() => manejarUnidades(activo.id)} className="font-medium text-emi_azul dark:text-emi_amarillo hover:underline">
                      {unidadesDesplegadas[activo.id] ? <RiArrowUpSLine size="1.5em" /> : <RiArrowDownSLine size="1.5em" />}
                    </button>
                  </td>
                </tr>
                {unidadesDesplegadas[activo.id] && (
                  <tr>
                    <td colSpan="8" className="bg-gray-100 p-4">
                      <table className="w-full text-sm text-left text-emi_azul">
                        <thead className="text-xs text-emi_amarillo uppercase bg-white dark:bg-emi_azul dark:text-emi_amarillo">
                          <tr>
                            <th scope="col" className="py-1 px-2 lg:px-6">Código</th>
                            <th scope="col" className="py-1 px-2 lg:px-6">Asignado</th>
                            <th scope="col" className="py-1 px-2 lg:px-6">Acciones</th>
                          </tr>
                        </thead>
                        <tbody>
                          {unidades.filter((unidad) => unidad.modeloId === activo.id).map((unidad) => (
                            <tr key={unidad.id} className="bg-white border-b dark:bg-white dark:border-emi_azul hover:bg-yellow-400 dark:hover:bg-emi_azul-900">
                              <td className="py-1 px-2 lg:px-6">{unidad.codigo}</td>
                              <td className="py-1 px-2 lg:px-6">{unidad.asignado ? "Sí" : "No"}</td>
                              <td className="py-1 px-2 lg:px-6 text-right space-x-4">
                                <button
                                  onClick={() => manejarAsignacion(unidad.id, unidad.asignado)}
                                  className={`font-medium ${unidad.asignado ? "text-yellow-500" : "text-green-500"} hover:underline`}
                                >
                                  {unidad.asignado ? (
                                    <span className="flex items-center">
                                      <RiRefreshLine size="1.5em" className="mr-1" />
                                      Reasignar
                                    </span>
                                  ) : (
                                    <span className="flex items-center">
                                      
                                      
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
          pageClassName={"mx-1 px-3 py-1 rounded-lg bg-white text-emi_azul border border-emi_azul"}
          activeClassName={"bg-emi_azul text-white"}
          previousClassName={"mx-1 px-3 py-1 rounded-lg bg-white text-emi_azul border border-emi_azul"}
          nextClassName={"mx-1 px-3 py-1 rounded-lg bg-white text-emi_azul border border-emi_azul"}
        />
      </div>
      <SeguimientoActivo unidadId={unidadIdSeguimiento} onClose={() => setUnidadIdSeguimiento(null)} />
      <ToastContainer />
    </div>
  );
};

export default Activos;
