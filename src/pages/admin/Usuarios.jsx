import React, { useState, useEffect, useCallback, useMemo } from "react";
import Swal from 'sweetalert2';
import { RiUserAddLine, RiFileExcelLine } from "react-icons/ri";
import RegisterUnidades from "./RegisterUnidades";
import Modal from 'react-modal';
import ReactECharts from 'echarts-for-react';
import axios from 'axios';
import { useTable, useFilters, useSortBy, usePagination } from 'react-table';
import { CSVLink } from "react-csv";

Modal.setAppElement('#root');

export default function Personal() {
  const [personal, setPersonal] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPersona, setSelectedPersona] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const apiUrl = import.meta.env.VITE_API_URL;

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

  const handleAdd = useCallback(() => {
    setSelectedPersona(null);
    setIsModalOpen(true);
  }, []);

  const columns = useMemo(
    () => [
      {
        Header: 'ID',
        accessor: 'id',
      },
      {
        Header: 'CI',
        accessor: 'ci',
      },
      {
        Header: 'Nombre',
        accessor: 'nombre',
      },
      {
        Header: 'Cargo',
        accessor: 'cargo.nombre',
      },
      {
        Header: 'Unidad',
        accessor: 'unidad.nombre',
      },
      {
        Header: 'Estado',
        accessor: 'activo',
        Cell: ({ value }) => (
          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${value ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {value ? 'Activo' : 'Inactivo'}
          </span>
        ),
        Filter: ({ column }) => (
          <select
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            onChange={e => {
              column.setFilter(e.target.value === 'all' ? undefined : e.target.value === 'true')
            }}
          >
            <option value="all">Todos</option>
            <option value="true">Activos</option>
            <option value="false">Inactivos</option>
          </select>
        ),
      },
    ],
    []
  );

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    prepareRow,
    page,
    canPreviousPage,
    canNextPage,
    pageOptions,
    pageCount,
    gotoPage,
    nextPage,
    previousPage,
    setPageSize,
    state: { pageIndex, pageSize },
  } = useTable(
    {
      columns,
      data: personal,
      initialState: { pageIndex: 0, pageSize: 10 },
    },
    useFilters,
    useSortBy,
    usePagination
  );

  const statusChartOption = useMemo(() => {
    const activeCount = personal.filter(p => p.activo).length;
    const inactiveCount = personal.length - activeCount;

    return {
      title: {
        text: 'Estado del Personal',
        left: 'center'
      },
      tooltip: {
        trigger: 'item',
        formatter: '{a} <br/>{b}: {c} ({d}%)'
      },
      legend: {
        orient: 'vertical',
        left: 'left',
      },
      series: [
        {
          name: 'Estado',
          type: 'pie',
          radius: ['50%', '70%'],
          avoidLabelOverlap: false,
          label: {
            show: false,
            position: 'center'
          },
          emphasis: {
            label: {
              show: true,
              fontSize: '30',
              fontWeight: 'bold'
            }
          },
          labelLine: {
            show: false
          },
          data: [
            { value: activeCount, name: 'Activos' },
            { value: inactiveCount, name: 'Inactivos' },
          ]
        }
      ]
    };
  }, [personal]);

  const unitChartOption = useMemo(() => {
    const unitData = personal.reduce((acc, p) => {
      const unit = p.unidad.nombre;
      acc[unit] = (acc[unit] || 0) + 1;
      return acc;
    }, {});

    const sortedData = Object.entries(unitData).sort((a, b) => b[1] - a[1]);
    const categories = sortedData.map(item => item[0]);
    const values = sortedData.map(item => item[1]);

    return {
      title: {
        text: 'Cantidad de Personal por Unidad',
        left: 'center'
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow'
        }
      },
      xAxis: {
        type: 'category',
        data: categories,
        axisLabel: {
          interval: 0,
          rotate: 30
        }
      },
      yAxis: {
        type: 'value'
      },
      series: [{
        data: values,
        type: 'bar'
      }]
    };
  }, [personal]);

  return (
    <div className="p-4 bg-gray-100 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-emi_azul mb-4">Gestión de Personal</h1>
        <div className="flex flex-wrap justify-between items-center gap-4">
          <div className="flex-grow">
            <input
              onChange={e => {
                headerGroups[0].headers.forEach(column => {
                  column.setFilter(e.target.value || undefined)
                })
              }}
              placeholder="Buscar en todas las columnas..."
              className="p-2 border border-gray-300 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-emi_azul focus:border-transparent"
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
            <button
              onClick={handleAdd}
              className="bg-emi_azul text-emi_amarillo py-2 px-4 rounded-md hover:bg-black transition-colors inline-flex items-center"
            >
              <RiUserAddLine className="mr-2" />
              Agregar Personal
            </button>
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
              <table {...getTableProps()} className="min-w-full divide-y divide-gray-200">
                <thead className="bg-emi_azul">
                  {headerGroups.map(headerGroup => (
                    <tr {...headerGroup.getHeaderGroupProps()}>
                      {headerGroup.headers.map(column => (
                        <th
                          {...column.getHeaderProps(column.getSortByToggleProps())}
                          className="px-6 py-3 text-left text-xs font-medium text-emi_amarillo uppercase tracking-wider"
                        >
                          {column.render('Header')}
                          <span>
                            {column.isSorted
                              ? column.isSortedDesc
                                ? ' 🔽'
                                : ' 🔼'
                              : ''}
                          </span>
                          <div>{column.canFilter ? column.render('Filter') : null}</div>
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody {...getTableBodyProps()} className="bg-white divide-y divide-gray-200">
                  {page.map((row, i) => {
                    prepareRow(row)
                    return (
                      <tr {...row.getRowProps()} className={row.original.activo ? '' : 'bg-red-50'}>
                        {row.cells.map(cell => {
                          return (
                            <td
                              {...cell.getCellProps()}
                              className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"
                            >
                              {cell.render('Cell')}
                            </td>
                          )
                        })}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between mb-8 gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <button onClick={() => gotoPage(0)} disabled={!canPreviousPage} className="px-3 py-1 bg-emi_azul text-white rounded-md disabled:opacity-50">
                {'<<'}
              </button>
              <button onClick={() => previousPage()} disabled={!canPreviousPage} className="px-3 py-1 bg-emi_azul text-white rounded-md disabled:opacity-50">
                {'<'}
              </button>
              <button onClick={() => nextPage()} disabled={!canNextPage} className="px-3 py-1 bg-emi_azul text-white rounded-md disabled:opacity-50">
                {'>'}
              </button>
              <button onClick={() => gotoPage(pageCount - 1)} disabled={!canNextPage} className="px-3 py-1 bg-emi_azul text-white rounded-md disabled:opacity-50">
                {'>>'}
              </button>
            </div>
            <span className="text-sm text-gray-700">
              Página{' '}
              <strong>
                {pageIndex + 1} de {pageOptions.length}
              </strong>
            </span>
            <select
              value={pageSize}
              onChange={e => {
                setPageSize(Number(e.target.value))
              }}
              className="px-2 py-1 border border-gray-300 rounded-md"
            >
              {[10, 20, 30, 40, 50].map(pageSize => (
                <option key={pageSize} value={pageSize}>
                  Mostrar {pageSize}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div className="bg-white p-4 rounded-lg shadow">
              <ReactECharts option={statusChartOption} style={{ height: '400px' }} />
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <ReactECharts option={unitChartOption} style={{ height: '400px' }} />
            </div>
          </div>
        </>
      )}

      <Modal
        isOpen={isModalOpen}
        onRequestClose={() => setIsModalOpen(false)}
        style={{
          content: {
            top: '50%',
            left: '50%',
            right: 'auto',
            bottom: 'auto',
            marginRight: '-50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '20px',
            maxWidth: '500px',
            width: '100%',
          },
          overlay: {
            backgroundColor: 'rgba(0, 0, 0, 0.75)'
          }
        }}
      >
        <RegisterUnidades
          persona={selectedPersona}
          onClose={() => setIsModalOpen(false)}
          onSave={(data) => {
            // Lógica para guardar aquí
            setIsModalOpen(false);
            fetchPersonal();
          }}
        />
      </Modal>
    </div>
  );
}