import React, { useState, useEffect, useCallback } from "react";
import Swal from 'sweetalert2';
import axios from 'axios';

export default function Revisiones() {
  const [revisionesPendientes, setRevisionesPendientes] = useState([]);
  const [revisionesFinalizadas, setRevisionesFinalizadas] = useState([]);
  const [personasRevisar, setPersonasRevisar] = useState([]);
  const [selectedRevision, setSelectedRevision] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const apiUrl = import.meta.env.VITE_API_URL;

  // Obtener las revisiones pendientes y finalizadas
  const fetchRevisiones = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${apiUrl}/personal/revisiones`);
      const revisiones = response.data.data;
      const pendientes = revisiones.filter(rev => rev.estado === 'PENDIENTE');
      const finalizadas = revisiones.filter(rev => rev.estado === 'FINALIZADA');

      setRevisionesPendientes(pendientes);
      setRevisionesFinalizadas(finalizadas);
    } catch (error) {
      Swal.fire('Error', 'No se pudo cargar las revisiones', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [apiUrl]);

  const fetchPersonasRevisar = useCallback(async (revisionId) => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${apiUrl}/personal/revision/${revisionId}/personas`);
      setPersonasRevisar(response.data.data);
      setSelectedRevision(revisionId);
    } catch (error) {
      Swal.fire('Error', 'No se pudo cargar la lista de personal', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [apiUrl]);

  useEffect(() => {
    fetchRevisiones();
  }, [fetchRevisiones]);

  const handleEvaluarPersona = async (personaId, nombre) => {
    const { value: observaciones } = await Swal.fire({
      title: `Evaluar a ${nombre}`,
      input: 'textarea',
      inputLabel: 'Observaciones',
      inputPlaceholder: 'Escribe las observaciones aquí...',
      showCancelButton: true,
    });

    if (observaciones !== null) {
      const { isConfirmed: aprobado } = await Swal.fire({
        title: '¿Aprobar revisión?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Sí, aprobar',
        cancelButtonText: 'No, rechazar',
      });

      try {
        await axios.patch(`${apiUrl}/personal/revision/${selectedRevision}/persona/${personaId}`, {
          observaciones,
          aprobado,
        });

        Swal.fire('Éxito', 'Evaluación registrada correctamente', 'success');
        setPersonasRevisar(personasRevisar.filter(persona => persona.id !== personaId));
      } catch (error) {
        Swal.fire('Error', 'No se pudo registrar la evaluación', 'error');
      }
    }
  };

  const handleFinalizarRevision = async () => {
    try {
      await axios.patch(`${apiUrl}/personal/finalizar-revision/${selectedRevision}`, { observaciones: '', aprobado: true });
      Swal.fire('Éxito', 'Revisión finalizada correctamente', 'success');
      setSelectedRevision(null);
      setPersonasRevisar([]);
      fetchRevisiones(); // Actualizar la lista de revisiones
    } catch (error) {
      Swal.fire('Error', 'No se pudo finalizar la revisión', 'error');
    }
  };

  return (
    <div className="revisiones-section p-4 bg-gray-100 min-h-screen">
      <h2 className="text-3xl font-bold text-emi_azul mb-4">Revisiones</h2>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-emi_azul"></div>
        </div>
      ) : (
        <>
          {/* Mostrar revisiones pendientes */}
          {revisionesPendientes.length > 0 ? (
            <>
              <h3 className="text-2xl font-semibold mb-4">Revisiones Pendientes</h3>
              <ul className="mb-4">
                {revisionesPendientes.map((rev) => (
                  <li key={rev.id} className="mb-2">
                    <button
                      className="bg-emi_azul text-emi_amarillo py-2 px-4 rounded-md hover:bg-black transition-colors"
                      onClick={() => fetchPersonasRevisar(rev.id)}
                    >
                      {rev.tipo} - {new Date(rev.fecha).toLocaleString()}
                    </button>
                  </li>
                ))}
              </ul>

              {/* Mostrar personal relacionado con la revisión seleccionada */}
              {selectedRevision && (
                <div>
                  <h3 className="text-2xl font-semibold">Evaluar Personal para Revisión</h3>
                  <ul className="list-disc pl-5">
                    {personasRevisar.map((persona) => (
                      <li key={persona.id} className="my-2">
                        {persona.nombre} - {persona.cargo.nombre}
                        <button
                          className="ml-4 bg-green-500 text-white py-1 px-3 rounded-md hover:bg-green-600"
                          onClick={() => handleEvaluarPersona(persona.id, persona.nombre)}
                        >
                          Evaluar
                        </button>
                      </li>
                    ))}
                  </ul>

                  {/* Botón para finalizar la revisión si no hay más personas a evaluar */}
                  {personasRevisar.length === 0 && (
                    <button
                      className="mt-4 bg-red-500 text-white py-2 px-4 rounded-md hover:bg-red-600"
                      onClick={handleFinalizarRevision}
                    >
                      Finalizar Revisión
                    </button>
                  )}
                </div>
              )}
            </>
          ) : (
            <>
              {/* Si no hay revisiones pendientes, mostrar revisiones finalizadas */}
              <h3 className="text-2xl font-semibold mb-4">Revisiones Finalizadas</h3>
              {revisionesFinalizadas.length > 0 ? (
                <ul className="mb-4">
                  {revisionesFinalizadas.map((rev) => (
                    <li key={rev.id} className="mb-2">
                      {rev.tipo} - {new Date(rev.fecha).toLocaleString()}
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No hay revisiones finalizadas.</p>
              )}

              {/* Mostrar la tabla de reportes aquí */}
              <div>
                <h3 className="text-2xl font-semibold">Tabla de Reportes</h3>
                {/* Aquí puedes agregar el código de la tabla de reportes */}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
