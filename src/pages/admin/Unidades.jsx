import React, { useState, useEffect, useCallback, useMemo } from "react";
import Swal from 'sweetalert2';
import { RiFileUploadLine, RiFileExcelLine } from "react-icons/ri";
import ReactECharts from 'echarts-for-react';
import axios from 'axios';
import { CSVLink } from "react-csv";
import ReactPaginate from 'react-paginate';

export default function Personal() {
  const [personal, setPersonal] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [uploadResult, setUploadResult] = useState(null);
  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000"; // Default value if VITE_API_URL is not set
  const itemsPerPage = 10;

  const fetchPersonal = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${apiUrl}/personal`);
      setPersonal(response.data.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      Swal.fire('Error', 'No se pudo cargar la lista de personal', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [apiUrl]);

  useEffect(() => {
    fetchPersonal();
  }, [fetchPersonal]);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      setIsLoading(true);
      const response = await axios.post(`${apiUrl}/personal/upload-csv`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setUploadResult(response.data.resumen);
      await fetchPersonal();
      Swal.fire('Éxito', 'Archivo CSV procesado correctamente', 'success');
    } catch (error) {
      console.error('Error uploading file:', error);
      Swal.fire('Error', 'No se pudo procesar el archivo CSV', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredPersonal = useMemo(() => {
    return personal.filter(p => 
      p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.ci.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.cargo.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.unidad.nombre.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [personal, searchTerm]);

  const paginatedPersonal = useMemo(() => {
    const startIndex = currentPage * itemsPerPage;
    return filteredPersonal.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredPersonal, currentPage]);

  const pageCount = Math.ceil(filteredPersonal.length / itemsPerPage);

  const handlePageClick = (event) => {
    setCurrentPage(event.selected);
  };

  const distribucionPersonalOption = useMemo(() => {
    const unidades = {};
    personal.forEach(p => {
      if (unidades[p.unidad.nombre]) {
        unidades[p.unidad.nombre]++;
      } else {
        unidades[p.unidad.nombre] = 1;
      }
    });

    const data = Object.entries(unidades)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    return {
      tooltip: {
        trigger: 'item',
        formatter: '{a} <br/>{b}: {c} ({d}%)'
      },
      legend: {
        orient: 'vertical',
        left: 10,
        top: 'center',
        type: 'scroll',
        textStyle: {
          fontSize: 12
        }
      },
      series: [
        {
          name: 'Distribución de Personal',
          type: 'pie',
          radius: ['40%', '70%'],
          center: ['60%', '50%'],
          avoidLabelOverlap: true,
          itemStyle: {
            borderRadius: 10,
            borderColor: '#fff',
            borderWidth: 2
          },
          label: {
            show: false,
            position: 'center'
          },
          emphasis: {
            label: {
              show: true,
              fontSize: '18',
              fontWeight: 'bold'
            }
          },
          labelLine: {
            show: false
          },
          data: data
        }
      ]
    };
  }, [personal]);

  const activosVsInactivosOption = useMemo(() => {
    const activos = personal.filter(p => p.activo).length;
    const inactivos = personal.length - activos;

    return {
      tooltip: {
        trigger: 'item',
        formatter: '{a} <br/>{b}: {c} ({d}%)'
      },
      legend: {
        orient: 'horizontal',
        bottom: 10,
        left: 'center',
      },
      series: [
        {
          name: 'Estado del Personal',
          type: 'pie',
          radius: ['40%', '70%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 10,
            borderColor: '#fff',
            borderWidth: 2
          },
          label: {
            show: false,
            position: 'center'
          },
          emphasis: {
            label: {
              show: true,
              fontSize: '18',
              fontWeight: 'bold'
            }
          },
          labelLine: {
            show: false
          },
          data: [
            { value: activos, name: 'Activos' },
            { value: inactivos, name: 'Inactivos' }
          ]
        }
      ]
    };
  }, [personal]);

  return (
    <div className="p-4 bg-gray-100 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-emi_azul mb-4">Gestión de Personal</h1>
        <div className="flex flex-wrap justify-between items-center gap-4">
          <div className="flex-grow">
            <input
              type="text"
              placeholder="Buscar personal..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
            />
          </div>
          <div className="flex gap-2">
            <CSVLink
              data={personal}
              filename={"personal.csv"}
              className="bg-green-500 text-white py-2 px-4 rounded-md hover:bg-green-600 transition-colors inline-flex items-center"
            >
              <RiFileExcelLine className="mr-2" />
              Exportar a CSV
            </CSVLink>
            <label className="bg-emi_azul text-emi_amarillo py-2 px-4 rounded-md hover:bg-black transition-colors inline-flex items-center cursor-pointer">
              <RiFileUploadLine className="mr-2" />
              Actualizar Personal
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-emi_azul"></div>
        </div>
      ) : (
        <>
          <div className="bg-white shadow-md rounded-lg overflow-hidden mb-8">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-emi_azul">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-emi_amarillo uppercase tracking-wider">ID</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-emi_amarillo uppercase tracking-wider">CI</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-emi_amarillo uppercase tracking-wider">Nombre</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-emi_amarillo uppercase tracking-wider">Cargo</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-emi_amarillo uppercase tracking-wider">Unidad</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-emi_amarillo uppercase tracking-wider">Estado</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedPersonal.map((persona) => (
                    <tr key={persona.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{persona.id}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{persona.ci}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{persona.nombre}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{persona.cargo.nombre}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{persona.unidad.nombre}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${persona.activo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {persona.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-center mt-4 mb-8">
            <ReactPaginate
              previousLabel={"Anterior"}
              nextLabel={"Siguiente"}
              breakLabel={"..."}
              pageCount={pageCount}
              marginPagesDisplayed={2}
              pageRangeDisplayed={5}
              onPageChange={handlePageClick}
              containerClassName={"pagination flex flex-wrap justify-center mt-4 mb-4"}
              pageClassName={"m-1"}
              pageLinkClassName={"px-3 py-2 rounded-lg bg-white text-emi_azul border border-emi_azul hover:bg-emi_azul hover:text-white transition-colors"}
              activeClassName={"bg-emi_azul text-white"}
              previousClassName={"m-1"}
              nextClassName={"m-1"}
              previousLinkClassName={"px-3 py-2 rounded-lg bg-white text-emi_azul border border-emi_azul hover:bg-emi_azul hover:text-white transition-colors"}
              nextLinkClassName={"px-3 py-2 rounded-lg bg-white text-emi_azul border border-emi_azul hover:bg-emi_azul hover:text-white transition-colors"}
              disabledClassName={"opacity-50 cursor-not-allowed"}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-2 text-center">Distribución de Personal por Unidad</h3>
              <ReactECharts 
                option={distribucionPersonalOption} 
                style={{ height: '400px' }} 
                opts={{ renderer: 'svg' }}
              />
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-2 text-center">Personal Activo vs Inactivo</h3>
              <ReactECharts 
                option={activosVsInactivosOption} 
                style={{ height: '400px' }} 
                opts={{ renderer: 'svg' }}
              />
            </div>
          </div>

          {uploadResult && (
            <div className="bg-white shadow-md rounded-lg p-6 mb-8">
              <h2 className="text-2xl font-bold mb-4 text-emi_azul">Resumen de Actualización</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold mb-2 text-emi_amarillo">Nuevos Personales</h3>
                  <ul className="list-disc pl-5 text-emi_azul">
                    {uploadResult.nuevosPersonales.map((persona, index) => (
                      <li key={index}>{persona.nombre} (CI: {persona.ci})</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2 text-emi_amarillo">Nuevos Cargos</h3>
                  <ul className="list-disc pl-5 text-emi_azul">
                    {uploadResult.nuevosCargos.map((cargo, index) => (
                      <li key={index}>{cargo}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2 text-emi_amarillo">Nuevas Unidades</h3>
                  <ul className="list-disc pl-5 text-emi_azul">
                    {uploadResult.nuevasUnidades.map((unidad, index) => (
                      <li key={index}>{unidad}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2 text-emi_amarillo">Personal Inactivo</h3>
                  <ul className="list-disc pl-5 text-emi_azul">
                    {uploadResult.personalInactivo.map((persona, index) => (
                      <li key={index}>{persona.nombre} (CI: {persona.ci}) - {persona.motivo}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2 text-emi_amarillo">Personal Actualizado</h3>
                  <ul className="list-disc pl-5 text-emi_azul">
                    {uploadResult.personalActualizado.map((persona, index) => (
                      <li key={index}>
                        {persona.nombre} (CI: {persona.ci})
                        <ul className="list-circle pl-5">
                          {persona.cambios.map((cambio, cambioIndex) => (
                            <li key={cambioIndex}>{cambio}</li>
                          ))}
                        </ul>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="mt-4">
                <p><strong>Personal sin cambios:</strong> {uploadResult.personalSinCambios}</p>
                <p><strong>Total procesados:</strong> {uploadResult.totalProcesados}</p>
              </div>
              {uploadResult.advertencias.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-lg font-semibold mb-2 text-emi_amarillo">Advertencias</h3>
                  <ul className="list-disc pl-5 text-emi_azul">
                    {uploadResult.advertencias.map((advertencia, index) => (
                      <li key={index}>{advertencia}</li>
                    ))}
                  </ul>
                </div>
              )}
              {uploadResult.errores.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-lg font-semibold mb-2 text-emi_amarillo">Errores</h3>
                  <ul className="list-disc pl-5 text-emi_azul">
                    {uploadResult.errores.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
