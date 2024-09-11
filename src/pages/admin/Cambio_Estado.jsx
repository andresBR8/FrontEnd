import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const Estado = () => {
  const [unidades, setUnidades] = useState([]);
  const [selectedUnidad, setSelectedUnidad] = useState(null);
  const [estadoNuevo, setEstadoNuevo] = useState("");
  const [motivoCambio, setMotivoCambio] = useState("");

  useEffect(() => {
    // Fetch de las unidades de activos disponibles
    const fetchUnidades = async () => {
      try {
        const response = await axios.get("http://localhost:3000/activo-modelo");
        setUnidades(response.data.data); // Asumiendo que la API devuelve un array de unidades en data.data
      } catch (error) {
        console.error("Error al obtener unidades:", error);
      }
    };

    fetchUnidades();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedUnidad || !estadoNuevo || !motivoCambio) {
      toast.error("Por favor, complete todos los campos.");
      return;
    }

    const payload = {
      fkActivoUnidad: selectedUnidad,
      estadoNuevo,
      motivoCambio,
    };

    try {
      await axios.post("http://localhost:3000/estado-activo", payload);
      toast.success("Estado del activo actualizado con éxito.");
      setSelectedUnidad(null);
      setEstadoNuevo("");
      setMotivoCambio("");
    } catch (error) {
      console.error("Error al cambiar el estado del activo:", error);
      toast.error("No se pudo actualizar el estado del activo.");
    }
  };

  return (
    <div className="p-8 bg-white shadow-lg rounded-lg max-w-md mx-auto">
      <h2 className="text-2xl font-bold text-center mb-6">Cambiar Estado de Activo</h2>

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="unidad" className="block text-gray-700 font-bold mb-2">
            Seleccionar Unidad de Activo
          </label>
          <select
            id="unidad"
            value={selectedUnidad || ""}
            onChange={(e) => setSelectedUnidad(e.target.value)}
            className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emi_azul"
          >
            <option value="">Seleccione una unidad</option>
            {unidades.map((unidad) => (
              <option key={unidad.id} value={unidad.id}>
                {unidad.codigo} - {unidad.estadoActual} - ${unidad.costoActual}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-4">
          <label htmlFor="estado" className="block text-gray-700 font-bold mb-2">
            Seleccionar Nuevo Estado
          </label>
          <select
            id="estado"
            value={estadoNuevo}
            onChange={(e) => setEstadoNuevo(e.target.value)}
            className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emi_azul"
          >
            <option value="">Seleccione un estado</option>
            <option value="bueno">Bueno</option>
            <option value="regular">Regular</option>
            <option value="malo">Malo</option>
          </select>
        </div>

        <div className="mb-4">
          <label htmlFor="motivo" className="block text-gray-700 font-bold mb-2">
            Motivo del Cambio
          </label>
          <textarea
            id="motivo"
            value={motivoCambio}
            onChange={(e) => setMotivoCambio(e.target.value)}
            className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emi_azul"
            placeholder="Describa el motivo del cambio"
          ></textarea>
        </div>

        <button
          type="submit"
          className="w-full bg-emi_azul text-white font-bold py-2 px-4 rounded-lg hover:bg-emi_amarillo hover:text-emi_azul transition-colors"
        >
          Cambiar Estado
        </button>
      </form>
    </div>
  );
};

export default Estado;
